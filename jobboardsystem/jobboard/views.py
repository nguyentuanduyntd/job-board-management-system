from rest_framework import generics, viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.contrib.auth import get_user_model

from .models import (
    Company, JobCategory, Skill, Job,
    Application, CandidateProfile, EmployerProfile
)
from .paginators import MyPaginator
from .serializers import (
    RegisterSerializer, UserSerializer,
    CompanySerializer, JobCategorySerializer, SkillSerializer,
    JobListSerializer, JobDetailSerializer,
    ApplicationSerializer,
    CandidateProfileSerializer, EmployerProfileSerializer, EmployerVerifySerializer, EmployerProfileAdminSerializer,
)
from .permissions import IsEmployer, IsCandidate, IsAdmin, IsOwnerOrReadOnly, IsVerifiedEmployer

User = get_user_model()


# AUTH
class RegisterView(generics.CreateAPIView):
    #POST /api/auth/register/
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


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
    queryset = Job.objects.filter(is_active=True).select_related('company', 'category').prefetch_related('skills')
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
        instance.delete()

    @action(detail=True, methods=['get'], permission_classes=[IsEmployer],
            url_path='applications')
    def applications(self, request, pk=None):
        """GET /api/jobs/{id}/applications/ - Employer xem danh sách ứng viên"""
        job = self.get_object()
        # Kiểm tra job thuộc về employer này
        if job.company.owner != request.user:
            return Response({'error': 'Bạn không có quyền xem.'}, status=403)
        apps = job.applications.select_related('candidate')
        return Response(ApplicationSerializer(apps, many=True).data)


# APPLICATION
class ApplicationViewSet(viewsets.ModelViewSet):
    serializer_class = ApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ['get', 'post', 'patch', 'delete']

    def get_queryset(self):
        user = self.request.user
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