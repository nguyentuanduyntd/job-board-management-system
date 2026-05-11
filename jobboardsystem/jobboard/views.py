from django.db.models.functions import TruncMonth, TruncQuarter, TruncYear
from django.utils import timezone
from rest_framework import generics, viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.contrib.auth import get_user_model
from rest_framework.throttling import UserRateThrottle, AnonRateThrottle
from django.db.models import Count, Sum, Q, Avg

from .models import (
    Company, JobCategory, Skill, Job,
    Application, CandidateProfile, EmployerProfile, JobComparison, Payment
)
from .paginators import MyPaginator
from .serializers import (
    RegisterSerializer, UserSerializer,
    CompanySerializer, JobCategorySerializer, SkillSerializer,
    JobListSerializer, JobDetailSerializer,
    ApplicationSerializer,
    CandidateProfileSerializer, EmployerProfileSerializer, EmployerVerifySerializer, EmployerProfileAdminSerializer,
    JobComparisonSerializer, PaymentSerializer, JobCompareItemSerializer
)
from .permissions import IsEmployer, IsCandidate, IsAdmin, IsOwnerOrReadOnly, IsVerifiedEmployer

User = get_user_model()

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


# COMPANY
class CompanyViewSet(viewsets.ModelViewSet):
    queryset = Company.objects.filter(is_active=True)
    serializer_class = CompanySerializer

    def get_permissions(self):
        #tách create và update/destroy để tránh trường hợp employer sửa/xóa company của người khác
        if self.action == 'create':
            return [IsEmployer()]
        if self.action in ['update','partial_update','destroy']:
            return [IsEmployer(), IsOwnerOrReadOnly()]
        return [permissions.AllowAny()]

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


# JOB
class JobViewSet(viewsets.ModelViewSet):
    queryset = Job.objects.filter(is_active=True)\
        .select_related('company','category')\
        .prefetch_related('skills')\
        .order_by('-featured_score','-created_at')
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['job_type', 'category', 'company']
    search_fields = ['title', 'description', 'location']
    ordering_fields = ['created_at', 'salary_min', 'deadline']
    ordering = ['-created_at']
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

    def perform_destroy(self,instance):
        if instance.company.owner != self.request.user:
            raise PermissionDenied('Bạn không có quyền xóa job này!')
        instance.is_active = False
        instance.save()

    @action(detail=True, methods=['get'], permission_classes=[IsEmployer],
            url_path='applications')
    def applications(self, request, pk=None):
        """GET /api/jobs/{id}/applications/ - Employer xem danh sách ứng viên"""
        job = self.get_object()
        # Kiểm tra job thuộc về employer này
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
                apps,many=True, context={'request': request}
        ).data)

    @action(detail=False , methods=['get'],url_path='my-jobs',permission_classes=[IsVerifiedEmployer])
    def my_jobs(self, request):
        #GET /jobs/my-jobs/ employer xem danh sách job của mình
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
        .prefetch_related('skills') .order_by('-featured_score','-created_at')

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
                {'error':'Job không tồn tại hoặc đã đóng'}
                , status=status.HTTP_404_NOT_FOUND
            )
        if comparison.jobs.count() >=5:
            return Response(
                {'error':'Chỉ được so sánh tối đa 5 công việc'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if comparison.jobs.filter(pk=job_id).exists():
            return Response(
                {'error': 'Job này đã có trong danh sách so sánh'},
                status=status.HTTP_400_BAD_REQUEST
            )

        existing_categoires = set(
            comparison.jobs.values_list('category_id',flat=True)
        )
        warning = None
        if existing_categoires and job.category_id not in existing_categoires:
            warning = 'Job này thuộc lĩnh vực khác với các job đang so sánh.'
        comparison.jobs.add(job)
        return Response(
            JobComparisonSerializer(comparison, context={'request': request}).data
        ).data
        if warning:
            respone_data['warning'] = warning
        return Response(respone_data)
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

        #Chỉ candidate sở hữu application mới được xóa
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
        """PATCH /api/applications/{id}/update-status/"""
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
        serializer = self.get_serializer(app, data={'status': new_status}, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    @action(detail=True, methods=['patch'], permission_classes=[IsEmployer],url_path='add-note')
    def add_note(self, request, pk=None):
        #PATCH /application/{id}/add-note
        app = self.get_object()
        if app.job.company.owner != request.user:
            return Response({'error': 'Bạn không có quyền!'}, status=403)

        note = request.data.get('employer_note','').strip()
        if not note:
            return Response({'error': 'Ghi chú không được để trống.'}, status=400)

        app.employer_note = note
        app.save()
        return Response({
            'message': 'Đã lưu ghi chú.',
            'employer_note': app.employer_note
        })

#Chưa sửa
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
    # GET, PATCH /api/candidate/profile/
    serializer_class = CandidateProfileSerializer
    permission_classes = [IsCandidate]
    http_method_names = ['get', 'patch']

    def get_object(self):
        profile, _ = CandidateProfile.objects.get_or_create(user=self.request.user)
        return profile


class EmployerProfileView(generics.RetrieveUpdateAPIView):
    # GET, PATCH /api/employer/profile/
    serializer_class = EmployerProfileSerializer
    permission_classes = [IsEmployer]
    http_method_names = ['get', 'patch']
    def get_object(self):
        profile, _ = EmployerProfile.objects.get_or_create(user=self.request.user)
        return profile

#Admin quản lý duyệt account employer
class AdminEmployerViewSet(viewsets.GenericViewSet):
    def get_serializer_class(self):
        if self.action in ['approve','reject']:
            return  EmployerVerifySerializer
        return EmployerProfileAdminSerializer
    #GET /admin/employers/
    #Admin xem toàn bộ list employer
    def list(self, request):
        queryset = self.get_queryset()
        serializer = EmployerProfileAdminSerializer(queryset, many=True)
        return Response(serializer.data)

    #GET /admin/employers/pending/
    @action(detail=False, methods=['get'], url_path='pending')
    def pending(self, request):
        queryset = self.get_queryset().filter(is_active=False)
        serializer = EmployerProfileAdminSerializer(queryset, many=True)
        return Response(serializer.data)

    #PATCH /admin/employers/{id}/approve/
    @action(detail=True, methods=['patch'], url_path='approve')
    def approve(self, request, pk=None):
        profile = self.get_object()
        if profile.is_verified:
            return Response(
                {'error': 'Tài khoản này đã được duyệt rồi'},
                status=status.HTTP_400_BAD_REQUEST
            )
        profile.is_verified = True
        profile.save()
        return Response(
            {'message':f'Đã duyệt tài khoản {profile.user.username}.'},
            status=status.HTTP_200_OK
        )
    #PATCH /admin/employer/{id}/reject/
    @action(detail=True, methods=['patch'], url_path='reject')
    def reject(self, request, pk=None):
        profile = self.get_object()
        if not profile.is_verified:
            return Response(
                {'error':'Tài khoản này chưa được duyệt.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        profile.is_verified = False
        profile.save()
        return Response(
            {'message':f'Đã thu hồi xác minh tài khoản {profile.user.username}.'},
            status=status.HTTP_200_OK
        )

#Payment
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
        # Employer chỉ thấy featured_job payments
        if user.role == 'employer':
            return Payment.objects.filter(
                user=user,
                payment_type='featured_job'
            ).select_related('job')
        # Candidate chỉ thấy priority_application payments
        if user.role == 'candidate':
            return Payment.objects.filter(
                user=user,
                payment_type='priority_application'
            ).select_related('application')
        return Payment.objects.none()

#Thống kê trang admin
class AdminStatisticsViewSet(viewsets.ViewSet):
    permission_classes = [IsAdmin]

    @action(detail=False, methods=['get'], url_path='admin-dashboard')
    def admin_dashboard(self, request):
        total_jobs = Job.objects.count()
        total_candidates = User.objects.filter(role='candidate').count()
        total_employers = User.objects.filter(role='employer').count()
        total_revenue = Payment.objects.filter(status='completed').aggregate(Sum('amount'))['amount__sum'] or 0

        # Base querysets — filter
        completed_payments = Payment.objects.filter(status='completed')
        base_candidates = User.objects.filter(role='candidate')
        base_employers = User.objects.filter(role='employer')
        base_jobs = Job.objects.all()

        # Doanh thu theo tháng, quý, năm
        revenue_by_month = completed_payments.annotate(month=TruncMonth('paid_at')).values('month').annotate(
            revenue=Sum('amount')).order_by('month')
        revenue_by_quarter = completed_payments.annotate(quarter=TruncQuarter('paid_at')).values('quarter').annotate(
            revenue=Sum('amount')).order_by('quarter')
        revenue_by_year = completed_payments.annotate(year=TruncYear('paid_at')).values('year').annotate(
            revenue=Sum('amount')).order_by('year')

        # Ứng viên mới theo tháng, quý, năm
        new_candidates_by_month = base_candidates.annotate(month=TruncMonth('date_joined')).values('month').annotate(
            total=Count('id')).order_by('month')
        new_candidates_by_quarter = base_candidates.annotate(quarter=TruncQuarter('date_joined')).values(
            'quarter').annotate(total=Count('id')).order_by('quarter')
        new_candidates_by_year = base_candidates.annotate(year=TruncYear('date_joined')).values('year').annotate(
            total=Count('id')).order_by('year')

        # Nhà tuyển dụng mới theo tháng, quý, năm
        new_employers_by_month = base_employers.annotate(month=TruncMonth('date_joined')).values('month').annotate(
            total=Count('id')).order_by('month')
        new_employers_by_quarter = base_employers.annotate(quarter=TruncQuarter('date_joined')).values(
            'quarter').annotate(total=Count('id')).order_by('quarter')
        new_employers_by_year = base_employers.annotate(year=TruncYear('date_joined')).values('year').annotate(
            total=Count('id')).order_by('year')

        # Tin tuyển dụng mới theo tháng, quý, năm
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

        # Base querysets — filter
        base_apps = Application.objects.filter(job__company__owner=user)
        base_jobs = Job.objects.filter(company__owner=user)

        # Đơn ứng tuyển theo tháng, quý, năm
        apps_by_month = base_apps.annotate(month=TruncMonth('created_at')).values('month').annotate(
            total=Count('id')).order_by('month')
        apps_by_quarter = base_apps.annotate(quarter=TruncQuarter('created_at')).values('quarter').annotate(
            total=Count('id')).order_by('quarter')
        apps_by_year = base_apps.annotate(year=TruncYear('created_at')).values('year').annotate(
            total=Count('id')).order_by('year')

        # Tin tuyển dụng đăng theo tháng, quý, năm
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