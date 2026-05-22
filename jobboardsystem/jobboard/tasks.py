from celery import shared_task
from django.core.mail import EmailMultiAlternatives
from django.utils.timezone import localtime, make_aware, is_naive

def _build_html(app) -> str:
    candidate = app.candidate
    job       = app.job
    company   = job.company
    
    # Xử lý múi giờ an toàn
    interview_time = app.interview_at
    if interview_time and is_naive(interview_time):
        interview_time = make_aware(interview_time)
        
    dt_str = localtime(interview_time).strftime('%H:%M  —  %d/%m/%Y') if interview_time else 'Chưa lên lịch'
    name   = candidate.get_full_name() or candidate.username

    # Xử lý đường dẫn bản đồ nếu có
    map_info = ""
    if app.interview_map_url:
        map_info = f'<p style="margin: 4px 0;">🗺️ <strong>Bản đồ địa điểm:</strong> <a href="{app.interview_map_url}" style="color: #2563EB; text-decoration: underline;">Nhấn vào đây để xem đường đi</a></p>'

    # Xử lý ghi chú nếu có
    note_info = ""
    if app.interview_note:
        note_info = f'<p style="margin: 4px 0;">📝 <strong>Ghi chú từ hội đồng tuyển dụng:</strong> {app.interview_note}</p>'

    # Trả về giao diện văn bản tối giản, sang trọng và chuẩn mực
    return f"""<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1F2937; line-height: 1.6; background-color: #FFFFFF;">
    
    <div style="max-width: 600px; margin: 0 auto;">
        
        <h2 style="color: #111827; font-size: 20px; font-weight: 700; margin-bottom: 24px; border-bottom: 2px solid #E5E7EB; padding-bottom: 12px;">
            THƯ MỜI THAM GIA PHỎNG VẤN TRỰC TIẾP
        </h2>

        <p>Kính gửi <strong>{name}</strong>,</p>
        
        <p>Lời đầu tiên, Ban nhân sự công ty <strong>{company.name}</strong> xin được cảm ơn sự quan tâm của bạn dành cho cơ hội nghề nghiệp tại tổ chức của chúng tôi.</p>
        
        <p>Qua quá trình xem xét và đánh giá hồ sơ ứng tuyển (CV), chúng tôi rất ấn tượng với nền tảng kiến thức cũng như kinh nghiệm chuyên môn của bạn. Ban nhân sự trân trọng chúc mừng bạn đã chính thức vượt qua vòng sàng lọc và được lựa chọn tham gia vào <strong>Vòng phỏng vấn trực tiếp</strong> cho vị trí <strong style="color: #2563EB;">{job.title}</strong>.</p>
        
        <p>Dưới đây là thông tin chi tiết về lịch hẹn phỏng vấn được điều phối riêng cho bạn:</p>

        <div style="background-color: #F9FAFB; border-left: 4px solid #1D4ED8; padding: 16px; margin: 20px 0; border-radius: 0 8px 8px 0;">
            <p style="margin: 4px 0;">🏢 <strong>Đơn vị tuyển dụng:</strong> {company.name}</p>
            <p style="margin: 4px 0;">💼 <strong>Vị trí ứng tuyển:</strong> {job.title}</p>
            <p style="margin: 4px 0;">⏰ <strong>Thời gian dự kiến:</strong> <span style="color: #1D4ED8; font-weight: bold;">{dt_str}</span></p>
            <p style="margin: 4px 0;">📍 <strong>Địa điểm làm việc:</strong> {app.interview_location}</p>
            {map_info}
            {note_info}
        </div>

        <p style="font-weight: 700; margin-top: 24px; color: #374151;">⚠️ Một số lưu ý quan trọng dành cho ứng viên khi đến tham gia phỏng vấn:</p>
        <ul style="padding-left: 20px; margin: 8px 0; color: #4B5563;">
            <li style="margin-bottom: 6px;">Vui lòng có mặt tại địa điểm trước giờ hẹn từ <strong>10 đến 15 phút</strong> để làm thủ tục và ổn định vị trí.</li>
            <li style="margin-bottom: 6px;">Khi đi nhớ mang theo <strong>CCCD / Hộ chiếu</strong> còn hiệu lực để xuất trình tại quầy an ninh của tòa nhà.</li>
            <li style="margin-bottom: 6px;">Trang phục tham gia phỏng vấn đảm bảo tính lịch sự, chỉnh chu và chuyên nghiệp.</li>
        </ul>

        <p style="margin-top: 24px;">Nếu có bất kỳ thay đổi đột xuất nào về mặt thời gian hoặc cần hỗ trợ thêm thông tin, bạn vui lòng phản hồi lại sớm cho chúng tôi qua tính năng nhắn tin trực tiếp trên ứng dụng <strong>JobApp</strong> để được hỗ trợ sắp xếp kịp thời.</p>
        
        <p>Chúc bạn có một buổi phỏng vấn đạt kết quả tốt nhất!</p>
        
        <div style="margin-top: 40px; border-top: 1px solid #E5E7EB; padding-top: 16px; font-size: 13px; color: #6B7280;">
            <p style="margin: 2px 0; font-weight: 700; color: #4B5563;">BAN NHÂN SỰ — {company.name}</p>
            <p style="margin: 2px 0;">Hệ thống quản lý tuyển dụng tự động JobApp</p>
            <p style="margin: 2px 0; font-style: italic;">*Đây là email thông báo tự động, vui lòng không phản hồi trực tiếp vào địa chỉ thư này.</p>
        </div>
        
    </div>
</body>
</html>"""

@shared_task(bind=True, max_retries=3, default_retry_delay=120)
def send_interview_email_task(self, application_id: int):
    from .models import Application
    try:
        app = Application.objects.select_related(
            'candidate', 'job__company'
        ).get(id=application_id)

        email_addr = app.candidate.email
        if not email_addr:
            return {'status': 'skipped', 'reason': 'no_email'}

        if not app.interview_at or not app.interview_location:
            return {'status': 'skipped', 'reason': 'no_schedule'}

        job_title    = app.job.title
        company_name = app.job.company.name
        
        # Đồng bộ hóa múi giờ an toàn cho chuỗi Văn bản thuần (Plain Text)
        interview_time = app.interview_at
        if is_naive(interview_time):
            interview_time = make_aware(interview_time)

        dt_str = localtime(interview_time).strftime('%H:%M  —  %d/%m/%Y')

        # Tiêu đề thư mang tính trang trọng và rõ ràng thông tin
        subject = f'[JobApp] Thư mời tham gia phỏng vấn vị trí {job_title} — {company_name}'
        
        # Phần text body dự phòng (cho những thiết bị không đọc được HTML)
        text_body = (
            f'THƯ MỜI PHỎNG VẤN\n\n'
            f'Kính gửi: {app.candidate.get_full_name() or app.candidate.username}\n\n'
            f'Ban nhân sự {company_name} trân trọng mời bạn tham dự buổi phỏng vấn trực tiếp:\n'
            f'- Vị trí ứng tuyển : {job_title}\n'
            f'- Thời gian hẹn   : {dt_str}\n'
            f'- Địa điểm hẹn    : {app.interview_location}\n\n'
            f'Vui lòng có mặt trước 15 phút và mang theo CCCD khi đến tòa nhà. Mọi phản hồi xin thực hiện qua ứng dụng JobApp.\n'
        )

        msg = EmailMultiAlternatives(
            subject=subject,
            body=text_body,
            from_email=None,
            to=[email_addr],
        )
        msg.attach_alternative(_build_html(app), 'text/html')
        msg.send()

        Application.objects.filter(id=application_id).update(interview_notified=True)
        return {'status': 'sent', 'to': email_addr}

    except Application.DoesNotExist:
        return {'status': 'skipped', 'reason': 'not_found'}
    except Exception as exc:
        raise self.retry(exc=exc)