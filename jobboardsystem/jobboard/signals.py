from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.core.cache import cache
from django.contrib.auth import get_user_model
from .models import Job, CandidateProfile, EmployerProfile

User = get_user_model() # Cách lấy User model chuẩn nhất của Django

print("--- [OK] File signals.py đã được nạp thành công vào bộ nhớ hệ thống! ---")


# --- LOGIC QUẢN LÝ CACHE REDIS (JOB) ---

def clear_job_list_caches():
    """Hàm trung tâm quét và xóa toàn bộ các cache key bắt đầu bằng jobs_list_"""
    try:
        # Xóa tất cả các khóa lưu trữ danh sách động (Yêu cầu sử dụng thư viện django-redis)
        cache.delete_pattern("jobs_list_*")
        print("--- [SIGNAL] Đã dọn dẹp toàn bộ cache dạng 'jobs_list_*'.")
    except AttributeError:
        # Phương án dự phòng nếu môi trường không hỗ trợ cấu hình quét pattern
        cache.clear()
        print("--- [SIGNAL WARNING] Môi trường không hỗ trợ delete_pattern. Đã clear sạch RAM cache.")


@receiver(post_save, sender=Job)
def job_post_save_handler(sender, instance, created, **kwargs):
    """
    Kích hoạt ngay sau khi một bản ghi Job được Thêm mới hoặc Cập nhật thành công.
    """
    action = "tạo mới" if created else "cập nhật/xóa mềm"
    print(f"--- [SIGNAL] Phát hiện bài đăng '{instance.title}' vừa được {action}.")
    clear_job_list_caches()


@receiver(post_delete, sender=Job)
def job_post_delete_handler(sender, instance, **kwargs):
    """
    Kích hoạt nếu có hành động xóa cứng bản ghi Job khỏi cơ sở dữ liệu.
    """
    print(f"--- [SIGNAL] Phát hiện bài đăng '{instance.title}' bị xóa cứng khỏi DB.")
    clear_job_list_caches()


# --- LOGIC TỰ ĐỘNG TẠO PROFILE (USER) ---

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """
    Tự động khởi tạo CandidateProfile hoặc EmployerProfile tương ứng ngay khi User đăng ký xong.
    """
    if created:
        if instance.role == 'candidate':
            # Dùng get_or_create để phòng ngừa lỗi trùng lặp bản ghi (IntegrityError)
            CandidateProfile.objects.get_or_create(user=instance)
            print(f"--- [SIGNAL] Đã khởi tạo CandidateProfile cho tài khoản: {instance.username}")
        elif instance.role == 'employer':
            EmployerProfile.objects.get_or_create(user=instance)
            print(f"--- [SIGNAL] Đã khởi tạo EmployerProfile cho tài khoản: {instance.username}")