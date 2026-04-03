from rest_framework.permissions import BasePermission, SAFE_METHODS
from jobboard.models import EmployerProfile


class IsEmployer(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'employer'

class IsCandidate(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'candidate'

class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'

class IsOwnerOrReadOnly(BasePermission):
    # Chỉ owner mới được sửa và xóa, người khác chỉ đọc
    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        owner = getattr(obj, 'owner', None) or getattr(obj, 'candidate', None)
        return owner == request.user

class IsVerifiedEmployer(BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.role != 'employer':
            return False
        try:
            return request.user.employer_profile.is_verified
        except EmployerProfile.DoesNotExist:
            return False