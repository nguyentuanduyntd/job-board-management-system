from django.db.models.functions import TruncMonth, TruncQuarter, TruncYear
from django.utils import timezone
from rest_framework import generics, viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.parsers import BaseParser
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.contrib.auth import get_user_model
from rest_framework.throttling import UserRateThrottle, AnonRateThrottle
from django.db.models import Count, Sum, Q, Avg
import requests
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from google.oauth2 import id_token as google_id_token
from google.auth.transport import requests as google_requests
from oauthlib.common import generate_token
from oauth2_provider.models import Application as OAuth2Application
from oauth2_provider.models import AccessToken
import stripe
from django.conf import settings
from datetime import timedelta
from .models import (
    Company, JobCategory, Skill, Job, Package,
    Application, CandidateProfile, EmployerProfile, JobComparison, Payment
)
from .paginators import MyPaginator
from .serializers import (
    RegisterSerializer, UserSerializer,
    CompanySerializer, JobCategorySerializer, SkillSerializer,
    JobListSerializer, JobDetailSerializer,
    ApplicationSerializer, PackageSerializer,
    AdminJobSerializer,
    CandidateProfileSerializer, EmployerProfileSerializer, EmployerVerifySerializer, EmployerProfileAdminSerializer,
    JobComparisonSerializer, PaymentSerializer, JobCompareItemSerializer
)
from .permissions import IsEmployer, IsCandidate, IsAdmin, IsOwnerOrReadOnly, IsVerifiedEmployer
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import EmployerProfile
from .serializers import EmployerProfileAdminSerializer, EmployerVerifySerializer
from .permissions import IsAdmin  # Hoặc permissions.IsAdminUser tùy cấu hình của bạn

User = get_user_model()

stripe.api_key = settings.STRIPE_SECRET_KEY

# custom throttle class cho login và register
class LoginRateThrottle(AnonRateThrottle):
    scope = 'login'

class RegisterRateThrottle(AnonRateThrottle):
    scope = 'register'


# AUTH
class RegisterView(generics.CreateAPIView):
    #POST /api/auth/register/
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [RegisterRateThrottle]

class ProfileView(generics.RetrieveUpdateAPIView):
    #GET, PATCH /api/auth/profile
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ['get', 'patch']

    def get_object(self):
        return self.request.user

class ChangePasswordView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request):
        user = request.user
        old_password     = request.data.get("old_password")
        new_password     = request.data.get("new_password")
        confirm_password = request.data.get("confirm_password")

        if not all([old_password, new_password, confirm_password]):
            return Response({"error": "Vui lòng nhập đầy đủ thông tin."}, status=400)
        if not user.check_password(old_password):
            return Response({"error": "Mật khẩu hiện tại không đúng."}, status=400)
        if len(new_password) < 8:
            return Response({"error": "Mật khẩu mới phải có ít nhất 8 ký tự."}, status=400)
        if new_password != confirm_password:
            return Response({"error": "Mật khẩu xác nhận không khớp."}, status=400)
        if old_password == new_password:
            return Response({"error": "Mật khẩu mới không được trùng mật khẩu cũ."}, status=400)

        user.set_password(new_password)
        user.save()
        return Response({"message": "Đổi mật khẩu thành công!"})

# COMPANY
class CompanyViewSet(viewsets.ModelViewSet):
    queryset = Company.objects.filter(is_active=True)
    serializer_class = CompanySerializer

    filter_backends = [DjangoFilterBackend]
    filterset_fields = {
        'name': ['icontains'],
    }

    def get_permissions(self):
        if self.action == 'create':
            return [IsEmployer()]
        if self.action in ['update','partial_update','destroy']:
            return [IsEmployer(), IsOwnerOrReadOnly()]
        return [permissions.AllowAny()]

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


# JOB
class JobViewSet(viewsets.ModelViewSet):
    queryset = Job.objects.filter(is_active=True, status='approved')\
        .select_related('company','category')\
        .prefetch_related('skills')\
        .order_by('-featured_score','-created_at')
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['job_type', 'category', 'company']
    search_fields = ['title', 'description', 'location']
    ordering_fields = ['created_at', 'salary_min', 'deadline','featured_score']
    ordering = ['-featured_score','-created_at']
    pagination_class = MyPaginator

    def get_serializer_class(self):
        if self.action == 'list':
            return JobListSerializer
        return JobDetailSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsVerifiedEmployer()]
        return [permissions.AllowAny()]

    def perform_update(self, serializer):
        job = self.get_object()
        if job.company.owner != self.request.user:
            raise PermissionDenied('Bạn không có quyền sửa job này.')
        serializer.save()

    def perform_destroy(self, instance):
        if instance.company.owner != self.request.user:
            raise PermissionDenied('Bạn không có quyền xóa job này!')
        instance.is_active = False
        instance.save()

    @action(detail=True, methods=['get'], permission_classes=[IsEmployer], url_path='applications')
    def applications(self, request, pk=None):
        """GET /api/jobs/{id}/applications/ - Employer xem danh sách ứng viên"""
        job = self.get_object()
        if job.company.owner != request.user:
            return Response({'error': 'Bạn không có quyền xem.'}, status=403)
        apps = job.applications.select_related('candidate__profile')\
                                .prefetch_related('candidate__profile__skills')
        status_filter = request.query_params.get('status')
        if status_filter:
            apps = apps.filter(status=status_filter)
        apps = apps.order_by('-priority_level','-created_at')

        return Response(
            ApplicationSerializer(
                apps, many=True, context={'request': request}
            ).data)

    @action(detail=False, methods=['get'], url_path='my-jobs', permission_classes=[IsVerifiedEmployer])
    def my_jobs(self, request):
        jobs = Job.objects.filter(
            company__owner=request.user
        ).select_related('company','category')\
        .prefetch_related('skills')\
        .order_by('-created_at')

        return Response(JobDetailSerializer(
            jobs, many=True, context={'request': request}
        ).data)

class JobComparisonViewSet(viewsets.ModelViewSet):
    serializer_class = JobComparisonSerializer
    permission_classes = [IsCandidate]
    http_method_names = ['get', 'post', 'delete']

    def get_queryset(self):
        return JobComparison.objects.filter(
            candidate=self.request.user
        ).prefetch_related('jobs__skills','jobs__company','jobs__category')

    def perform_create(self, serializer):
        serializer.save(candidate=self.request.user)

    @action(detail=False, methods=['get'], url_path='suggest')
    def suggest(self, request):
        category_id = request.query_params.get('category_id')
        exclude_job_id = request.query_params.get('exclude_job_id')

        if not category_id:
            return Response(
                {'error': 'Cần truyền category_id.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        jobs = Job.objects.filter(
            category__id=category_id,
            is_active=True
        ).select_related('company','category')\
        .prefetch_related('skills').order_by('-featured_score','-created_at')

        if exclude_job_id:
            jobs = jobs.exclude(id=exclude_job_id)
        jobs = jobs[:10]
        return Response(JobCompareItemSerializer(jobs, many=True).data)

    @action(detail=True, methods=['patch'], url_path='add-job')
    def add_job(self, request, pk=None):
        comparison = self.get_object()
        job_id = request.data.get('job_id')
        if not job_id:
            return Response(
                {'error': 'Thiếu job_id'},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            job = Job.objects.get(pk=job_id, is_active=True)
        except Job.DoesNotExist:
            return Response(
                {'error':'Job không tồn tại hoặc đã đóng'},
                status=status.HTTP_404_NOT_FOUND
            )
        if comparison.jobs.count() >= 5:
            return Response(
                {'error':'Chỉ được so sánh tối đa 5 công việc'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if comparison.jobs.filter(pk=job_id).exists():
            return Response(
                {'error': 'Job này đã có trong danh sách so sánh'},
                status=status.HTTP_400_BAD_REQUEST
            )

        existing_categories = set(
            comparison.jobs.values_list('category_id', flat=True)
        )
        warning = None
        if existing_categories and job.category_id not in existing_categories:
            warning = 'Job này thuộc lĩnh vực khác với các job đang so sánh.'
        comparison.jobs.add(job)

        response_data = JobComparisonSerializer(comparison, context={'request': request}).data
        if warning:
            response_data['warning'] = warning
        return Response(response_data)

    @action(detail=True, methods=['patch'], url_path='remove-job')
    def remove_job(self, request, pk=None):
        comparison = self.get_object()
        job_id = request.data.get('job_id')
        if not job_id:
            return Response(
                {'error':'Thiếu job_id'},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            job = comparison.jobs.get(pk=job_id)
        except Job.DoesNotExist:
            return Response(
                {'error':'Job này không có trong danh sách so sánh'},
                status=status.HTTP_404_NOT_FOUND
            )
        comparison.jobs.remove(job)

        if comparison.jobs.count() < 2:
            comparison.delete()
            return Response(
                {'message':'Comparison đã bị xóa vì còn ít hơn 2 công việc!'},
                status=status.HTTP_200_OK
            )
        return Response(
            JobComparisonSerializer(comparison, context={'request': request}).data
        )


# APPLICATION
class ApplicationViewSet(viewsets.ModelViewSet):
    serializer_class = ApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ['get', 'post', 'patch', 'delete']

    pagination_class = MyPaginator
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status', 'job__category']

    def get_queryset(self):
        user = self.request.user

        
        Application.objects.filter(
            is_priority=True,
            priority_expired_at__lte=timezone.now()
        ).update(is_priority=False, priority_level=0)

        if user.role == 'candidate':
            return Application.objects.filter(candidate=user).select_related('job')
        if user.role == 'employer':
            return Application.objects.filter(
                job__company__owner=user
            ).select_related('candidate', 'job')
        return Application.objects.all()  # admin xem tất cả

    def get_permissions(self):
        if self.action == 'create':
            return [IsCandidate()]
        if self.action == 'update_status':
            return [IsEmployer()]
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(candidate=self.request.user)

    def destroy(self, request, *args, **kwargs):
        app = self.get_object()
        if app.candidate != request.user:
            return Response(
                {'error': 'Bạn không có quyền rút đơn này.'},
                status=status.HTTP_403_FORBIDDEN
            )
        if app.status in ['ACCEPTED','REVIEWING']:
            return Response(
                {'error':'Không thể rút đơn khi đang được xét duyệt hoặc đã được chấp nhận'},
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=['patch'], permission_classes=[IsEmployer],
            url_path='update-status')
    def update_status(self, request, pk=None):
        app = self.get_object()
        if app.job.company.owner != request.user:
            return Response(
                {'error':'Bạn không có quyền cập nhật đơn này!'},
                status=status.HTTP_403_FORBIDDEN
            )
        new_status = request.data.get('status')
        valid_statuses = ['PENDING', 'REVIEWING', 'ACCEPTED', 'REJECTED']
        if new_status not in valid_statuses:
            return Response(
                {'error': f'Trạng thái không hợp lệ. Chọn: {valid_statuses}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        app.status = new_status
        app.save()
        return Response(self.get_serializer(app).data)

    @action(detail=True, methods=['patch'], permission_classes=[IsEmployer], url_path='add-note')
    def add_note(self, request, pk=None):
        app = self.get_object()
        if app.job.company.owner != request.user:
            return Response({'error': 'Bạn không có quyền!'}, status=403)

        note = request.data.get('employer_note','').strip()

        app.employer_note = note if note else None
        app.save()
        return Response({
            'message': 'Đã lưu ghi chú.',
            'employer_note': app.employer_note
        })


# CATEGORY & SKILL
class JobCategoryListView(generics.ListAPIView):
    queryset = JobCategory.objects.filter(is_active=True)
    serializer_class = JobCategorySerializer
    permission_classes = [permissions.AllowAny]


class SkillListView(generics.ListAPIView):
    queryset = Skill.objects.filter(is_active=True)
    serializer_class = SkillSerializer
    permission_classes = [permissions.AllowAny]


# PROFILES
class CandidateProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = CandidateProfileSerializer
    permission_classes = [IsCandidate]
    http_method_names = ['get', 'patch']

    def get_object(self):
        profile, _ = CandidateProfile.objects.get_or_create(user=self.request.user)
        return profile


class EmployerProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = EmployerProfileSerializer
    permission_classes = [IsEmployer]
    http_method_names = ['get', 'patch']

    def get_object(self):
        profile, _ = EmployerProfile.objects.get_or_create(user=self.request.user)
        return profile



class AdminEmployerViewSet(viewsets.GenericViewSet):
    permission_classes = [IsAdmin]

    # Định nghĩa cấu trúc Queryset gốc: Ép quét sâu Database ngay từ đầu bằng _base_manager
    # Điều này giúp hàm self.get_queryset() và self.get_object() mặc định của DRF không bị lỗi chặn ngầm hoặc lỗi 404
    def get_queryset(self):
        return EmployerProfile._base_manager.select_related('user', 'company').order_by('-id')

    def get_serializer_class(self):
        if self.action in ['approve', 'reject']:
            return EmployerVerifySerializer
        return EmployerProfileAdminSerializer

    # GET /admin-api/employers/ -> Lấy tất cả (Giống như bên AdminJobViewSet)
    def list(self, request):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    # GET /admin-api/employers/pending/ - Lấy danh sách chờ duyệt
    @action(detail=False, methods=['get'], url_path='pending')
    def pending(self, request):
        # Kế thừa từ get_queryset() gốc và lọc ra những tài khoản có user đang bị khóa
        queryset = self.get_queryset().filter(user__is_active=False)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    # PATCH /admin-api/employers/{id}/approve/ - duyệt tài khoản employerr
    @action(detail=True, methods=['patch'], url_path='approve')
    def approve(self, request, pk=None):
        # Tự động lấy object thông qua cấu trúc chuẩn của DRF
        profile = self.get_object()

        if profile.is_verified:
            return Response({'error': 'Tài khoản này đã được duyệt rồi.'}, status=400)

        # Cập nhật trạng thái xác minh hồ sơ
        profile.is_verified = True
        profile.is_rejected = False
        profile.save()

        # Kích hoạt tài khoản User liên kết để chuyển dấu X đỏ thành V xanh
        user = profile.user
        user.is_active = True
        user.save()

        return Response({'message': f'Đã duyệt và kích hoạt tài khoản "{user.username}".'})

    # PATCH /admin-api/employers/{id}/reject/ -> Từ chối/Khóa tài khoản
    @action(detail=True, methods=['patch'], url_path='reject')
    def reject(self, request, pk=None):
        profile = self.get_object()
        profile.is_verified = False
        profile.is_rejected = True
        profile.rejection_reason = request.data.get('reason', '')
        profile.save()
        user = profile.user
        user.is_active = False
        user.save()
        return Response({'message': f'Đã từ chối tài khoản "{user.username}".'})

class AdminJobViewSet(viewsets.GenericViewSet):
    permission_classes = [IsAdmin]
    serializer_class = AdminJobSerializer

    def get_queryset(self):
        return Job.objects.select_related('company', 'category').order_by('-created_at')

    def list(self, request):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='pending')
    def pending(self, request):
        queryset = self.get_queryset().filter(status='pending')
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['patch'], url_path='approve')
    def approve(self, request, pk=None):
        job = self.get_object()
        if job.status == 'approved':
            return Response({'error': 'Job này đã được duyệt rồi.'}, status=400)
        job.status = 'approved'
        job.rejection_reason = None
        job.save()
        return Response({'message': f'Đã duyệt job "{job.title}".'})

    @action(detail=True, methods=['patch'], url_path='reject')
    def reject(self, request, pk=None):
        job = self.get_object()
        reason = request.data.get('reason', '').strip()
        if not reason:
            return Response({'error': 'Cần nhập lý do từ chối.'}, status=400)
        job.status = 'rejected'
        job.rejection_reason = reason
        job.save()
        return Response({'message': f'Đã từ chối job "{job.title}".'})

#Package
class PackageViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Package.objects.all().order_by('package_type', 'level')
    serializer_class = PackageSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['package_type']

class StripeWebhookParser(BaseParser):
    media_type = 'application/json'

    def parse(self, stream, media_type=None, parser_context=None):
        return stream.read()

# Payment
@method_decorator(csrf_exempt, name='dispatch')
class PaymentViewSet(viewsets.ModelViewSet):
    serializer_class = PaymentSerializer
    http_method_names = ['get', 'post']

    def get_permissions(self):
        if self.action == 'stripe_webhook':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Payment.objects.all().select_related('user', 'job', 'application')
        if user.role == 'employer':
            return Payment.objects.filter(
                user=user,
                payment_type='featured_job'
            ).select_related('job')
        if user.role == 'candidate':
            return Payment.objects.filter(
                user=user,
                payment_type='priority_application'
            ).select_related('application')
        return Payment.objects.none()
    
    @action(detail=False, methods=['post'], url_path='create-payment-intent')
    def create_payment_intent(self, request):
        serializer = PaymentSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        validated = serializer.validated_data
        package = validated['package']
        amount_vnd = int(package.price)

        # Tạo hoặc lấy Stripe Customer theo user
        user = request.user
        if not user.stripe_customer_id:  # thêm field này vào User model
            customer = stripe.Customer.create(email=user.email, name=user.username)
            user.stripe_customer_id = customer.id
            user.save(update_fields=['stripe_customer_id'])

        # Ephemeral key cho Payment Sheet
        ephemeral_key = stripe.EphemeralKey.create(
            customer=user.stripe_customer_id,
            stripe_version='2024-06-20',
        )

        payment_intent = stripe.PaymentIntent.create(
            amount=amount_vnd,           # VND là zero-decimal, không nhân 100
            currency='vnd',
            customer=user.stripe_customer_id,
            metadata={
                'payment_type': validated.get('payment_type'),
                'package_id':   str(package.id),
                'job_id':       str(validated['job'].id) if validated.get('job') else '',
                'user_id':      str(user.id),
            }
        )
        payment = serializer.save(
            user=user,
            transaction_id=payment_intent.id,
            status='pending',
        )
        return Response({
            'payment_intent_client_secret': payment_intent.client_secret,
            'ephemeral_key':                ephemeral_key.secret,
            'customer_id':                  user.stripe_customer_id,
            'payment_id':                   payment.id,
        })
    
    @action(detail=False, methods=['post'], url_path='stripe-webhook',
            permission_classes=[permissions.AllowAny],
            parser_classes=[StripeWebhookParser]) 
    def stripe_webhook(self, request):
        payload = request.data 
        sig_header = request.META.get('HTTP_STRIPE_SIGNATURE', '')

        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
            )
        except (ValueError, stripe.error.SignatureVerificationError):
            return Response(status=400)

        if event['type'] == 'payment_intent.succeeded':
            intent = event['data']['object']
            try:
                payment = Payment.objects.get(transaction_id=intent['id'])
                if payment.status != 'completed':
                    payment.status = 'completed'
                    payment.save() 
            except Payment.DoesNotExist:
                pass

        elif event['type'] == 'payment_intent.payment_failed':
            intent = event['data']['object']
            Payment.objects.filter(transaction_id=intent['id']).update(status='failed')

        return Response({'status': 'ok'})


# Thống kê trang admin
class AdminStatisticsViewSet(viewsets.ViewSet):
    permission_classes = [IsAdmin]

    @action(detail=False, methods=['get'], url_path='admin-dashboard')
    def admin_dashboard(self, request):
        total_jobs = Job.objects.count()
        total_candidates = User.objects.filter(role='candidate').count()
        total_employers = User.objects.filter(role='employer').count()
        total_revenue = Payment.objects.filter(status='completed').aggregate(Sum('amount'))['amount__sum'] or 0

        completed_payments = Payment.objects.filter(status='completed')
        base_candidates = User.objects.filter(role='candidate')
        base_employers = User.objects.filter(role='employer')
        base_jobs = Job.objects.all()

        revenue_by_month = completed_payments.annotate(month=TruncMonth('paid_at')).values('month').annotate(
            revenue=Sum('amount')).order_by('month')
        revenue_by_quarter = completed_payments.annotate(quarter=TruncQuarter('paid_at')).values('quarter').annotate(
            revenue=Sum('amount')).order_by('quarter')
        revenue_by_year = completed_payments.annotate(year=TruncYear('paid_at')).values('year').annotate(
            revenue=Sum('amount')).order_by('year')

        new_candidates_by_month = base_candidates.annotate(month=TruncMonth('date_joined')).values('month').annotate(
            total=Count('id')).order_by('month')
        new_candidates_by_quarter = base_candidates.annotate(quarter=TruncQuarter('date_joined')).values(
            'quarter').annotate(total=Count('id')).order_by('quarter')
        new_candidates_by_year = base_candidates.annotate(year=TruncYear('date_joined')).values('year').annotate(
            total=Count('id')).order_by('year')

        new_employers_by_month = base_employers.annotate(month=TruncMonth('date_joined')).values('month').annotate(
            total=Count('id')).order_by('month')
        new_employers_by_quarter = base_employers.annotate(quarter=TruncQuarter('date_joined')).values(
            'quarter').annotate(total=Count('id')).order_by('quarter')
        new_employers_by_year = base_employers.annotate(year=TruncYear('date_joined')).values('year').annotate(
            total=Count('id')).order_by('year')

        new_jobs_by_month = base_jobs.annotate(month=TruncMonth('created_at')).values('month').annotate(
            total=Count('id')).order_by('month')
        new_jobs_by_quarter = base_jobs.annotate(quarter=TruncQuarter('created_at')).values('quarter').annotate(
            total=Count('id')).order_by('quarter')
        new_jobs_by_year = base_jobs.annotate(year=TruncYear('created_at')).values('year').annotate(
            total=Count('id')).order_by('year')

        return Response({
            'overview': {
                'total_jobs': total_jobs,
                'total_candidates': total_candidates,
                'total_employers': total_employers,
                'total_revenue': total_revenue,
            },
            'revenue_by_month': list(revenue_by_month),
            'revenue_by_quarter': list(revenue_by_quarter),
            'revenue_by_year': list(revenue_by_year),
            'new_candidates_by_month': list(new_candidates_by_month),
            'new_candidates_by_quarter': list(new_candidates_by_quarter),
            'new_candidates_by_year': list(new_candidates_by_year),
            'new_employers_by_month': list(new_employers_by_month),
            'new_employers_by_quarter': list(new_employers_by_quarter),
            'new_employers_by_year': list(new_employers_by_year),
            'new_jobs_by_month': list(new_jobs_by_month),
            'new_jobs_by_quarter': list(new_jobs_by_quarter),
            'new_jobs_by_year': list(new_jobs_by_year),
        })


# Thống kê cho Employer
class EmployerStatisticsViewSet(viewsets.ViewSet):
    permission_classes = [IsEmployer]

    @action(detail=False, methods=['get'], url_path='employer-dashboard')
    def employer_dashboard(self, request):
        user = request.user
        total_jobs_posted = Job.objects.filter(company__owner=user).count()
        total_applications = Application.objects.filter(job__company__owner=user).count()
        avg_candidate_rating = \
        Application.objects.filter(job__company__owner=user, rating__gt=0).aggregate(Avg('rating'))['rating__avg'] or 0

        base_apps = Application.objects.filter(job__company__owner=user)
        base_jobs = Job.objects.filter(company__owner=user)

        apps_by_month = base_apps.annotate(month=TruncMonth('created_at')).values('month').annotate(
            total=Count('id')).order_by('month')
        apps_by_quarter = base_apps.annotate(quarter=TruncQuarter('created_at')).values('quarter').annotate(
            total=Count('id')).order_by('quarter')
        apps_by_year = base_apps.annotate(year=TruncYear('created_at')).values('year').annotate(
            total=Count('id')).order_by('year')

        jobs_by_month = base_jobs.annotate(month=TruncMonth('created_at')).values('month').annotate(
            total=Count('id')).order_by('month')
        jobs_by_quarter = base_jobs.annotate(quarter=TruncQuarter('created_at')).values('quarter').annotate(
            total=Count('id')).order_by('quarter')
        jobs_by_year = base_jobs.annotate(year=TruncYear('created_at')).values('year').annotate(
            total=Count('id')).order_by('year')

        return Response({
            'overview': {
                'total_jobs_posted': total_jobs_posted,
                'total_applications': total_applications,
                'avg_candidate_rating': round(avg_candidate_rating, 2),
            },
            'applications_by_month': list(apps_by_month),
            'applications_by_quarter': list(apps_by_quarter),
            'applications_by_year': list(apps_by_year),
            'jobs_by_month': list(jobs_by_month),
            'jobs_by_quarter': list(jobs_by_quarter),
            'jobs_by_year': list(jobs_by_year),
        })


def get_google_user_info(google_access_token):
    try:
        info = google_id_token.verify_oauth2_token(
            google_access_token,
            google_requests.Request(),
            "319877551032-8tc956k29ktdj6etpglibi59u7g36bhf.apps.googleusercontent.com"
        )
        return info
    except Exception as e:
        print("Google token error:", e)
        return None

def create_oauth2_token(user):
    """Tạo OAuth2 access token cho user."""
    from django.conf import settings
    # ✅ Dùng OAuth2Application thay vì Application
    app = OAuth2Application.objects.get(client_id=settings.CLIENT_ID)
    AccessToken.objects.filter(user=user, application=app).delete()
    token = AccessToken.objects.create(
        user=user,
        application=app,
        token=generate_token(),
        expires=timezone.now() + timedelta(seconds=3600),
        scope="read write",
    )
    return token.token


class GoogleLoginView(generics.GenericAPIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        google_token = request.data.get("google_token")
        if not google_token:
            return Response({"error": "Thiếu google_token"}, status=400)

        info = get_google_user_info(google_token)
        if not info or "email" not in info:
            return Response({"error": "Token Google không hợp lệ"}, status=400)

        user = User.objects.filter(email=info["email"]).first()
        if not user:
            return Response(
                {"error": "Email chưa đăng ký. Vui lòng đăng ký trước."},
                status=404,
            )
        if not user.is_active:
            return Response(
                {"error": "Tài khoản chưa được kích hoạt."},
                status=403,
            )

        access_token = create_oauth2_token(user)
        return Response({"access_token": access_token})


class GoogleRegisterView(generics.GenericAPIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        google_token = request.data.get("google_token")
        role         = request.data.get("role", "candidate")

        if not google_token:
            return Response({"error": "Thiếu google_token"}, status=400)
        if role not in ["candidate", "employer"]:
            return Response({"error": "Role không hợp lệ"}, status=400)

        info = get_google_user_info(google_token)
        if not info or "email" not in info:
            return Response({"error": "Token Google không hợp lệ"}, status=400)

        email = info["email"]
        if User.objects.filter(email=email).exists():
            return Response({"error": "Email này đã được đăng ký."}, status=400)

        base = info.get("given_name", email.split("@")[0]).lower().replace(" ", "")
        username, suffix = base, 1
        while User.objects.filter(username=username).exists():
            username = f"{base}{suffix}"
            suffix += 1

        user = User.objects.create_user(
            username=username,
            email=email,
            password=None,
            first_name=info.get("given_name", ""),
            last_name=info.get("family_name", ""),
            role=role,
            is_active=(role == "candidate"),
        )

        return Response(
            {
                "message": "Đăng ký thành công!",
                "pending": role == "employer",
            },
            status=201,
        )