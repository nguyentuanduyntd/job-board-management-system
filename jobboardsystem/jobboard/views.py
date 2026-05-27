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
import logging
from datetime import datetime
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from django.views.decorators.csrf import csrf_exempt
from oauthlib.common import generate_token
from oauth2_provider.models import Application as OAuth2Application
from oauth2_provider.models import AccessToken
import stripe
from django.conf import settings
from datetime import timedelta
from django.core.cache import cache

from .models import (
    Company, JobCategory, Skill, Job, Package,
    Application, CandidateProfile, EmployerProfile, JobComparison, Payment
)
from .paginators import MyPaginator
from .serializers import (
    RegisterSerializer, UserSerializer, InterviewScheduleSerializer,
    CompanySerializer, JobCategorySerializer, SkillSerializer,
    JobListSerializer, JobDetailSerializer,
    ApplicationSerializer, PackageSerializer,
    AdminJobSerializer,
    CandidateProfileSerializer, EmployerProfileSerializer, EmployerVerifySerializer, EmployerProfileAdminSerializer,
    JobComparisonSerializer, PaymentSerializer, JobCompareItemSerializer
)
from .permissions import IsEmployer, IsCandidate, IsAdmin, IsOwnerOrReadOnly, IsVerifiedEmployer

User = get_user_model()
stripe.api_key = settings.STRIPE_SECRET_KEY


class LoginRateThrottle(AnonRateThrottle):
    scope = 'login'


class RegisterRateThrottle(AnonRateThrottle):
    scope = 'register'


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [RegisterRateThrottle]


class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ['get', 'patch']

    def get_object(self):
        return self.request.user


class ChangePasswordView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request):
        user = request.user
        old_password = request.data.get("old_password")
        new_password = request.data.get("new_password")
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


class CompanyViewSet(viewsets.ModelViewSet):
    queryset = Company.objects.filter(is_active=True)
    serializer_class = CompanySerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = {'name': ['icontains']}
    pagination_class = MyPaginator
    def get_permissions(self):
        if self.action in ['create', 'my_companies']:
            return [IsEmployer()]
        if self.action in ['update', 'partial_update', 'destroy']:
            return [IsEmployer(), IsOwnerOrReadOnly()]
        return [permissions.AllowAny()]

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    @action(methods=['get'], detail=False, url_path='my-companies')
    def my_companies(self, request):
        companies = Company.objects.filter(is_active=True, owner=request.user)
        page = self.paginate_queryset(companies)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(companies, many=True)
        return Response(serializer.data)

logger = logging.getLogger(__name__)

def log_cache_status(status_type, message):
    time_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")[:-3]
    prefix = ""
    if status_type == "HIT":
        prefix = "[CACHE HIT]"
    elif status_type == "MISS":
        prefix = "[CACHE MISS]"
    elif status_type == "CLEAR":
        prefix = "[CACHE CLEARED]"
    print(f"\n{prefix} [{time_str}] -> {message}\n")

class JobViewSet(viewsets.ModelViewSet):
    queryset = Job.objects.filter(is_active=True, status='approved') \
        .select_related('company', 'category') \
        .prefetch_related('skills') \
        .order_by('-featured_score', '-created_at')
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['job_type', 'category', 'company']
    search_fields = ['title', 'description', 'location']
    ordering_fields = ['created_at', 'salary_min', 'deadline', 'featured_score']
    ordering = ['-featured_score', '-created_at']
    pagination_class = MyPaginator

    def get_serializer_class(self):
        if self.action == 'list':
            return JobListSerializer
        return JobDetailSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsVerifiedEmployer()]
        return [permissions.AllowAny()]

    def list(self, request, *args, **kwargs):
        page = request.query_params.get('page', '1')
        job_type = request.query_params.get('job_type', '')
        category = request.query_params.get('category', '')
        company = request.query_params.get('company', '')
        search = request.query_params.get('search', '')
        ordering = request.query_params.get('ordering', '')

        cache_key = f"jobs_list_p{page}_t{job_type}_c{category}_co{company}_s{search}_o{ordering}"

        cached_jobs = cache.get(cache_key)
        if cached_jobs:
            log_cache_status("HIT", f"Dữ liệu tìm thấy trong Cache với Key: '{cache_key}'. Không gọi Database!")
            return Response(cached_jobs)

        log_cache_status("MISS", f"Không tìm thấy Cache cho Key: '{cache_key}'. Đang truy vấn Database...")
        response = super().list(request, *args, **kwargs)

        cache.set(cache_key, response.data, timeout=300)
        log_cache_status("MISS", f"Đã lưu kết quả mới vào Cache thành công (Timeout: 5 phút).")
        return response

    def perform_create(self, serializer):
        serializer.save()
        cache.clear()
        log_cache_status("CLEAR", "Nhà tuyển dụng ĐĂNG JOB MỚI -> Hệ thống đã xóa sạch toàn bộ Cache cũ để cập nhật trang chủ.")

    def perform_update(self, serializer):
        job = self.get_object()
        if job.company.owner != self.request.user:
            raise PermissionDenied('Bạn không có quyền sửa job này.')
        serializer.save()
        cache.clear()
        log_cache_status("CLEAR", f"Nhà tuyển dụng CẬP NHẬT JOB (ID: {job.id}) -> Hệ thống tiến hành làm sạch bộ nhớ Cache.")

    def perform_destroy(self, instance):
        if instance.company.owner != self.request.user:
            raise PermissionDenied('Bạn không có quyền xóa job này!')
        instance.is_active = False
        instance.save()
        cache.clear()
        log_cache_status("CLEAR", f"Nhà tuyển dụng XÓA JOB (ID: {instance.id}) -> Hệ thống thực hiện Clear toàn bộ Cache cũ.")

    @action(detail=True, methods=['get'], permission_classes=[IsEmployer], url_path='applications')
    def applications(self, request, pk=None):
        job = self.get_object()
        if job.company.owner != request.user:
            return Response({'error': 'Bạn không có quyền xem.'}, status=403)
        apps = job.applications.select_related('candidate__profile') \
            .prefetch_related('candidate__profile__skills')
        status_filter = request.query_params.get('status')
        if status_filter:
            apps = apps.filter(status=status_filter)
        apps = apps.order_by('-priority_level', '-created_at')

        return Response(ApplicationSerializer(apps, many=True, context={'request': request}).data)

    @action(detail=False, methods=['get'], url_path='my-jobs', permission_classes=[IsVerifiedEmployer])
    def my_jobs(self, request):
        jobs = Job.objects.filter(
            company__owner=request.user
        ).select_related('company', 'category') \
            .prefetch_related('skills') \
            .order_by('-created_at')

        page = self.paginate_queryset(jobs)
        if page is not None:
            serializer = JobDetailSerializer(page, many=True, context={'request': request})
            return self.get_paginated_response(serializer.data)

        return Response(JobDetailSerializer(jobs, many=True, context={'request': request}).data)


class JobComparisonViewSet(viewsets.ModelViewSet):
    serializer_class = JobComparisonSerializer
    permission_classes = [IsCandidate]
    http_method_names = ['get', 'post', 'delete']

    def get_queryset(self):
        return JobComparison.objects.filter(
            candidate=self.request.user
        ).prefetch_related('jobs__skills', 'jobs__company', 'jobs__category')

    def perform_create(self, serializer):
        serializer.save(candidate=self.request.user)

    @action(detail=False, methods=['get'], url_path='suggest')
    def suggest(self, request):
        category_id = request.query_params.get('category_id')
        exclude_job_id = request.query_params.get('exclude_job_id')

        if not category_id:
            return Response({'error': 'Cần truyền category_id.'}, status=status.HTTP_400_BAD_REQUEST)

        jobs = Job.objects.filter(category__id=category_id, is_active=True) \
            .select_related('company', 'category') \
            .prefetch_related('skills').order_by('-featured_score', '-created_at')

        if exclude_job_id:
            jobs = jobs.exclude(id=exclude_job_id)
        jobs = jobs[:10]
        return Response(JobCompareItemSerializer(jobs, many=True).data)

    @action(detail=True, methods=['patch'], url_path='add-job')
    def add_job(self, request, pk=None):
        comparison = self.get_object()
        job_id = request.data.get('job_id')
        if not job_id:
            return Response({'error': 'Thiếu job_id'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            job = Job.objects.get(pk=job_id, is_active=True)
        except Job.DoesNotExist:
            return Response({'error': 'Job không tồn tại hoặc đã đóng'}, status=status.HTTP_404_NOT_FOUND)

        if comparison.jobs.count() >= 5:
            return Response({'error': 'Chỉ được so sánh tối đa 5 công việc'}, status=status.HTTP_400_BAD_REQUEST)
        if comparison.jobs.filter(pk=job_id).exists():
            return Response({'error': 'Job này đã có trong danh sách so sánh'}, status=status.HTTP_400_BAD_REQUEST)

        existing_categories = set(comparison.jobs.values_list('category_id', flat=True))
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
            return Response({'error': 'Thiếu job_id'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            job = comparison.jobs.get(pk=job_id)
        except Job.DoesNotExist:
            return Response({'error': 'Job này không có trong danh sách so sánh'}, status=status.HTTP_404_NOT_FOUND)

        comparison.jobs.remove(job)

        if comparison.jobs.count() < 2:
            comparison.delete()
            return Response({'message': 'Comparison đã bị xóa vì còn ít hơn 2 công việc!'}, status=status.HTTP_200_OK)
        return Response(JobComparisonSerializer(comparison, context={'request': request}).data)

def log_app_status(action_type, message):
    time_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")[:-3]
    prefix = ""
    if action_type == "VIP_SCAN":
        prefix = "[VIP EXPIRED SCAN]"
    elif action_type == "CREATE":
        prefix = "[APPLICATION CREATED]"
    elif action_type == "DELETE":
        prefix = "[APPLICATION WITHDRAWN]"
    elif action_type == "STATUS":
        prefix = "[STATUS UPDATED]"
    elif action_type == "INTERVIEW":
        prefix = "[INTERVIEW SCHEDULED]"

    print(f"\n{prefix} [{time_str}] -> {message}\n")

class ApplicationViewSet(viewsets.ModelViewSet):
    serializer_class = ApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ['get', 'post', 'patch', 'delete']
    pagination_class = MyPaginator
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status', 'job__category', 'job']

    def get_queryset(self):
        user = self.request.user

        if self.action == 'list':
            try:
                expired_count = Application.objects.filter(
                    is_priority=True,
                    priority_expired_at__isnull=False,
                    priority_expired_at__lte=timezone.now()
                ).update(is_priority=False, priority_level=0)
                
                if expired_count > 0:
                    log_app_status("VIP_SCAN", f"Đã quét và hạ cấp {expired_count} đơn ứng tuyển VIP hết hạn về trạng thái thường.")
            
            except Exception as e:
                print("--- [WARNING] Lỗi quét hạn định VIP ứng tuyển: ", str(e))

        if user.role == 'candidate':
            return Application.objects.filter(candidate=user).select_related('job')

        if user.role == 'employer':
            return Application.objects.filter(job__company__owner=user) \
                .select_related('job', 'job__company', 'candidate') \
                .prefetch_related('candidate__profile')

        return Application.objects.all()

    def get_permissions(self):
        if self.action == 'create':
            return [IsCandidate()]
        if self.action in ['update_status', 'add_note', 'schedule_interview', 'accepted_list']:
            return [IsEmployer()]
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        app = serializer.save(candidate=self.request.user)
        log_app_status("CREATE", f"Ứng viên '{self.request.user.username}' vừa nộp đơn thành công cho Job ID: {app.job.id}.")
        cache.clear()
        log_app_status("CREATE", "Hệ thống làm sạch Cache Job cũ để đảm bảo số lượng thống kê real-time.")

    def destroy(self, request, *args, **kwargs):
        app = self.get_object()
        if app.candidate != request.user:
            return Response({'error': 'Bạn không có quyền rút đơn này.'}, status=status.HTTP_403_FORBIDDEN)
        if app.status in ['ACCEPTED', 'REVIEWING']:
            return Response({'error': 'Không thể rút đơn khi đang được xét duyệt hoặc đã được chấp nhận.'},
                            status=status.HTTP_400_BAD_REQUEST)
        app_id = app.id
        job_id = app.job.id
        response = super().destroy(request, *args, **kwargs)
        log_app_status("DELETE", f"Ứng viên '{request.user.username}' đã RÚT ĐƠN ỨNG TUYỂN (ID đơn: {app_id}) khỏi Job ID: {job_id}.")
        cache.clear()
        return response
    
    @action(detail=True, methods=['patch'], url_path='update-status')
    def update_status(self, request, pk=None):
        app = self.get_object()
        if app.job.company.owner != request.user:
            return Response({'error': 'Bạn không có quyền cập nhật đơn này!'}, status=status.HTTP_403_FORBIDDEN)

        new_status = request.data.get('status')
        valid_statuses = ['PENDING', 'REVIEWING', 'ACCEPTED', 'REJECTED']
        if new_status not in valid_statuses:
            return Response({'error': f'Trạng thái không hợp lệ. Chọn: {valid_statuses}'},
                            status=status.HTTP_400_BAD_REQUEST)

        if new_status == 'ACCEPTED':
            accepted_count = Application.objects.filter(job=app.job, status='ACCEPTED').exclude(pk=app.pk).count()
            if accepted_count >= app.job.quantity:
                return Response({'error': f'Vị trí này chỉ tuyển {app.job.quantity} người. Đã chấp nhận đủ số lượng.'},
                                status=status.HTTP_400_BAD_REQUEST)

        old_status = app.status
        app.status = new_status
        app.save()
        log_app_status("STATUS", f"Nhà tuyển dụng thay đổi trạng thái đơn số {app.id}: [{old_status}] ➡️ [{new_status}].")
        cache.clear()
        return Response(self.get_serializer(app).data)

    @action(detail=True, methods=['patch'], url_path='add-note')
    def add_note(self, request, pk=None):
        app = self.get_object()
        if app.job.company.owner != request.user:
            return Response({'error': 'Bạn không có quyền!'}, status=status.HTTP_403_FORBIDDEN)

        note = request.data.get('employer_note', '').strip()
        app.employer_note = note if note else None
        app.save()
        return Response({
            'message': 'Đã lưu ghi chú nội bộ thành công.',
            'employer_note': app.employer_note
        })

    @action(detail=True, methods=['patch'], url_path='schedule-interview')
    def schedule_interview(self, request, pk=None):
        app = self.get_object()
        if app.job.company.owner != request.user:
            return Response({'error': 'Bạn không có quyền thao tác đơn này.'}, status=status.HTTP_403_FORBIDDEN)
        if app.status != 'ACCEPTED':
            return Response({'error': 'Chỉ có thể lên lịch phỏng vấn cho đơn ứng tuyển đã được chấp nhận (ACCEPTED).'},
                            status=status.HTTP_400_BAD_REQUEST)

        serializer = InterviewScheduleSerializer(app, data=request.data, partial=True, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save(interview_notified=False)

        log_app_status("INTERVIEW", f"Đã lên lịch phỏng vấn cho đơn ứng tuyển số {app.id}. Thời gian lưu trữ thành công.")

        send_email_requested = request.data.get('send_email', True)
        if send_email_requested:
            from .tasks import send_interview_email_task
            send_interview_email_task.delay(app.id)
            log_app_status("INTERVIEW", f"Đã đẩy Task gửi Email thông báo tự động (Celery) tới ứng viên.")

        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='accepted')
    def accepted_list(self, request):
        apps = Application.objects.filter(
            job__company__owner=request.user,
            status='ACCEPTED',
        ).select_related('candidate', 'job__company').order_by('-created_at')

        page = self.paginate_queryset(apps)
        if page is not None:
            serializer = InterviewScheduleSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = InterviewScheduleSerializer(apps, many=True)
        return Response(serializer.data)


class JobCategoryListView(generics.ListAPIView):
    queryset = JobCategory.objects.filter(is_active=True)
    serializer_class = JobCategorySerializer
    permission_classes = [permissions.AllowAny]

    @method_decorator(cache_page(60 * 60))
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)


class SkillListView(generics.ListAPIView):
    queryset = Skill.objects.filter(is_active=True)
    serializer_class = SkillSerializer
    permission_classes = [permissions.AllowAny]

    @method_decorator(cache_page(60 * 60))
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)


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
    pagination_class = MyPaginator

    def get_queryset(self):
        return EmployerProfile._base_manager.select_related('user', 'company').order_by('-id')

    def get_serializer_class(self):
        if self.action in ['approve', 'reject']:
            return EmployerVerifySerializer
        return EmployerProfileAdminSerializer

    def list(self, request):
        queryset = self.get_queryset()
        status_filter = request.query_params.get('status')

        if status_filter == 'pending':
            queryset = queryset.filter(user__is_active=False, is_rejected=False)
        elif status_filter == 'approved':
            queryset = queryset.filter(is_verified=True)
        elif status_filter == 'rejected':
            queryset = queryset.filter(is_rejected=True)

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='pending')
    def pending(self, request):
        queryset = self.get_queryset().filter(user__is_active=False, is_rejected=False)
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['patch'], url_path='approve')
    def approve(self, request, pk=None):
        profile = self.get_object()
        if profile.is_verified:
            return Response({'error': 'Tài khoản này đã được duyệt rồi.'}, status=400)

        profile.is_verified = True
        profile.is_rejected = False
        profile.save()

        user = profile.user
        user.is_active = True
        user.save()
        return Response({'message': f'Đã duyệt và kích hoạt tài khoản "{user.username}".'})

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
    pagination_class = MyPaginator

    def get_queryset(self):
        return Job.objects.select_related('company', 'category').order_by('-created_at')

    def list(self, request):
        queryset = self.get_queryset()
        status_filter = request.query_params.get('status')

        if status_filter in ['pending', 'approved', 'rejected']:
            queryset = queryset.filter(status=status_filter)

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='pending')
    def pending(self, request):
        queryset = self.get_queryset().filter(status='pending')
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

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
        cache.clear()
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
            return Payment.objects.filter(user=user, payment_type='featured_job').select_related('job')
        if user.role == 'candidate':
            return Payment.objects.filter(user=user, payment_type='priority_application').select_related('application')
        return Payment.objects.none()

    @action(detail=False, methods=['post'], url_path='create-payment-intent')
    def create_payment_intent(self, request):
        serializer = PaymentSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        validated = serializer.validated_data
        package = validated['package']
        amount_vnd = int(package.price)

        user = request.user
        if not user.stripe_customer_id:
            customer = stripe.Customer.create(email=user.email, name=user.username)
            user.stripe_customer_id = customer.id
            user.save(update_fields=['stripe_customer_id'])

        ephemeral_key = stripe.EphemeralKey.create(
            customer=user.stripe_customer_id,
            stripe_version='2024-06-20',
        )

        payment_intent = stripe.PaymentIntent.create(
            amount=amount_vnd,
            currency='vnd',
            customer=user.stripe_customer_id,
            metadata={
                'payment_type': validated.get('payment_type'),
                'package_id': str(package.id),
                'job_id': str(validated['job'].id) if validated.get('job') else '',
                'user_id': str(user.id),
            }
        )
        payment = serializer.save(
            user=user,
            transaction_id=payment_intent.id,
            status='pending',
        )
        return Response({
            'payment_intent_client_secret': payment_intent.client_secret,
            'ephemeral_key': ephemeral_key.secret,
            'customer_id': user.stripe_customer_id,
            'payment_id': payment.id,
        })

    @action(detail=False, methods=['post'], url_path='stripe-webhook',
            permission_classes=[permissions.AllowAny],
            parser_classes=[StripeWebhookParser])
    def stripe_webhook(self, request):
        payload = request.data
        sig_header = request.META.get('HTTP_STRIPE_SIGNATURE', '')
        webhook_secret = getattr(settings, 'STRIPE_WEBHOOK_SECRET', '')

        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, webhook_secret
            )
        except ValueError:
            print("--- [ERROR] Webhook: Dữ liệu Payload trống hoặc sai cấu trúc ---")
            return Response({'error': 'Invalid payload'}, status=status.HTTP_400_BAD_REQUEST)
        except stripe.error.SignatureVerificationError:
            print("--- [ERROR] Webhook: Mã ký bí mật STRIPE_WEBHOOK_SECRET không chính xác ---")
            return Response({'error': 'Invalid signature'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print(f"--- [ERROR] Webhook: Gặp lỗi xác thực không xác định: {str(e)} ---")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        if event['type'] == 'payment_intent.succeeded':
            intent = event['data']['object']
            print(f"--- [INFO] Nhận gói tin Succeeded cho Intent ID: {intent['id']} ---")
            
            try:
                payment = Payment.objects.select_related('job', 'package').get(transaction_id=intent['id'])
                
                if payment.status != 'completed':
                    payment.status = 'completed'
                    payment.save()
                    print("--- [SUCCESS] Đã cập nhật trạng thái giao dịch: Completed ---")

                    if payment.payment_type == 'featured_job' and payment.job:
                        job = payment.job
                        job.is_featured = True 
                        if payment.package:
                            job.featured_priority = payment.package.level
                            job.featured_score = payment.package.level * 10
                        else:
                            job.featured_priority = 1
                            job.featured_score = 10
                        
                        job.save()
                        print(f"--- [VIP ACTIVATED] Bài đăng '{job.title}' đã được chuyển trạng thái NỔI BẬT! ---")
                    
                    cache.clear()
                    print("--- [CACHE] Đã xóa toàn bộ cache cũ thành công ---")

            except Payment.DoesNotExist:
                print(f"--- [WARNING] Không tìm thấy hóa đơn nào khớp với Transaction ID: {intent['id']} ---")
            except Exception as e:
                print(f"--- [CRITICAL] Hàm Webhook sập khi đang cập nhật cơ sở dữ liệu: {str(e)} ---")
                return Response({'error': 'Internal database update failed'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        elif event['type'] == 'payment_intent.payment_failed':
            intent = event['data']['object']
            print(f"--- [INFO] Nhận gói tin Payment Failed cho Intent ID: {intent['id']} ---")
            Payment.objects.filter(transaction_id=intent['id']).update(status='failed')

        return Response({'status': 'ok'}, status=status.HTTP_200_OK)


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
