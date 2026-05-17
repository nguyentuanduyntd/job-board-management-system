from django.core.management.base import BaseCommand
from django.contrib.auth.hashers import make_password
from faker import Faker
from jobboard.models import (
    User, Company, JobCategory, Skill,
    Package, Job, CandidateProfile, EmployerProfile
)
import random
import cloudinary.uploader

fake = Faker('vi_VN')

class Command(BaseCommand):
    help = 'Seed dữ liệu mẫu thực tế và upload logo lên Cloudinary'

    def handle(self, *args, **kwargs):
        # 1. GỌI HÀM XÓA TRƯỚC
        self.stdout.write('Đang dọn dẹp dữ liệu cũ...')
        self.clear_old_data()

        self.stdout.write('Bắt đầu seed dữ liệu...')
        self.seed_categories()
        self.seed_skills()
        self.seed_packages()
        self.seed_users_companies_jobs()
        self.stdout.write(self.style.SUCCESS('Seed xong thành công!'))

    def clear_old_data(self):
        # Xóa các dữ liệu cũ (chú ý thứ tự để không dính lỗi khóa ngoại - Foreign Key)
        Job.objects.all().delete()
        EmployerProfile.objects.all().delete()
        CandidateProfile.objects.all().delete()
        Company.objects.all().delete()
        Package.objects.all().delete()
        JobCategory.objects.all().delete()
        Skill.objects.all().delete()
        
        # Xóa User nhưng GIỮ LẠI tài khoản Admin (Superuser) để bạn không phải tạo lại
        User.objects.filter(is_superuser=False).delete()
        
        self.stdout.write(self.style.WARNING('Đã xóa sạch dữ liệu cũ (giữ lại Admin).'))

    def seed_categories(self):
        categories = ['IT Phần mềm', 'Marketing', 'Kế toán / Kiểm toán', 'Thiết kế Đồ họa', 'Kinh doanh / Bán hàng', 'Nhân sự']
        for name in categories:
            JobCategory.objects.get_or_create(name=name)
        self.stdout.write('✓ Categories')

    def seed_skills(self):
        skills = ['Python', 'Django', 'ReactJS', 'MySQL', 'Excel', 'Photoshop', 'Java', 'NodeJS', 'Figma', 'SEO', 'Digital Marketing']
        for name in skills:
            Skill.objects.get_or_create(name=name)
        self.stdout.write('✓ Skills')

    def seed_packages(self):
        packages = [
            {'name': 'Featured VIP1', 'package_type': 'featured_job',        'level': 1, 'duration_days': 7,  'price': 500000},
            {'name': 'Featured VIP2', 'package_type': 'featured_job',        'level': 2, 'duration_days': 15, 'price': 900000},
            {'name': 'Featured VIP3', 'package_type': 'featured_job',        'level': 3, 'duration_days': 30, 'price': 1500000},
            {'name': 'Priority VIP1', 'package_type': 'priority_application','level': 1, 'duration_days': 7,  'price': 300000},
            {'name': 'Priority VIP2', 'package_type': 'priority_application','level': 2, 'duration_days': 15, 'price': 600000},
            {'name': 'Priority VIP3', 'package_type': 'priority_application','level': 3, 'duration_days': 30, 'price': 1000000},
        ]
        for p in packages:
            Package.objects.get_or_create(package_type=p['package_type'], level=p['level'], defaults=p)
        self.stdout.write('✓ Packages')

    def generate_dummy_logo(self, company_name):
        """
        Hàm này tạo một avatar chữ dựa trên tên công ty, 
        sau đó upload thẳng URL đó lên Cloudinary.
        """
        try:
            # Format tên công ty để đưa vào URL (vd: Tech Nova -> Tech+Nova)
            name_formatted = company_name.replace(' ', '+')
            # Tạo URL ảnh giả với màu nền ngẫu nhiên
            dummy_image_url = f"https://ui-avatars.com/api/?name={name_formatted}&background=random&color=fff&size=256"
            
            # Upload thẳng từ URL ngoài lên Cloudinary
            upload_result = cloudinary.uploader.upload(
                dummy_image_url, 
                folder="jobboard/companies/logos" # Folder lưu trên Cloudinary
            )
            # Trả về link ảnh đã lưu trên Cloudinary
            return upload_result.get('secure_url')
        except Exception as e:
            self.stdout.write(self.style.WARNING(f"Không thể upload ảnh cho {company_name}: {e}"))
            return ""

    def seed_users_companies_jobs(self):
        skills = list(Skill.objects.all())
        categories = list(JobCategory.objects.all())

        # ==========================================
        # DỮ LIỆU CHUẨN ĐỂ RANDOM
        # ==========================================
        real_companies = [
            "Công ty CP Công nghệ VNG", "FPT Software", "Tiki Corporation", 
            "Shopee Việt Nam", "Công ty TNHH Giải pháp TechNova", "Creative Design Studio"
        ]
        
        job_titles = [
            "Lập trình viên Backend (Python/Django)", "Chuyên viên Digital Marketing", 
            "Nhân viên Kế toán tổng hợp", "UI/UX Designer", "Trưởng nhóm Kinh doanh"
        ]

        desc_template = """Chúng tôi đang tìm kiếm ứng viên tài năng để tham gia vào đội ngũ nòng cốt. 
Bạn sẽ được làm việc trong môi trường năng động, chuyên nghiệp, với các dự án thực tế quy mô lớn. 
Công việc yêu cầu sự sáng tạo, chủ động và khả năng làm việc nhóm tốt."""

        req_template = """- Có ít nhất 1-2 năm kinh nghiệm ở vị trí tương đương.
- Tốt nghiệp Đại học/Cao đẳng chuyên ngành liên quan.
- Có tinh thần trách nhiệm cao, chịu được áp lực công việc.
- Kỹ năng giao tiếp và giải quyết vấn đề tốt."""

        benefit_template = """- Mức lương cạnh tranh, thoả thuận theo năng lực.
- Lương tháng 13, thưởng hiệu quả công việc (KPI).
- Được đóng BHXH, BHYT đầy đủ theo quy định của pháp luật.
- Môi trường làm việc trẻ trung, du lịch công ty 1-2 lần/năm."""

        # Tạo 5 Employer và Company
        for i, company_name in enumerate(real_companies[:5]):
            user, created = User.objects.get_or_create(
                username=f'employer{i+1}',
                defaults={
                    'email': f'hr_{i+1}@company.com',
                    'password': make_password('123456'),
                    'role': 'employer',
                    'phone': fake.numerify('09########'),
                }
            )

            # --- TẠO LOGO & UPLOAD CLOUDINARY ---
            self.stdout.write(f"Đang tạo logo cho: {company_name}...")
            logo_url = self.generate_dummy_logo(company_name)

            company, _ = Company.objects.get_or_create(
                owner=user,
                defaults={
                    'name': company_name,
                    'description': f"{company_name} là một trong những công ty hàng đầu trong lĩnh vực của mình. Chúng tôi tự hào mang đến môi trường làm việc tốt nhất.",
                    'address': fake.address(),
                    'logo': logo_url  # Gắn link Cloudinary vào trường logo (Giả định model có trường này)
                }
            )

            EmployerProfile.objects.get_or_create(
                user=user,
                defaults={'company': company, 'is_verified': True}
            )

            # Tạo 3 job chuẩn cho mỗi employer
            for j in range(3):
                job = Job.objects.create(
                    title=random.choice(job_titles),
                    description=desc_template,
                    requirements=req_template,
                    benefits=benefit_template,
                    location=fake.city(),
                    salary_min=random.randint(10, 15) * 1_000_000,
                    salary_max=random.randint(20, 40) * 1_000_000,
                    company=company,
                    category=random.choice(categories),
                    deadline=fake.future_date(end_date="+30d"),
                )
                job.skills.set(random.sample(skills, k=3))

        # Tạo 10 Candidate
        for i in range(10):
            user, created = User.objects.get_or_create(
                username=f'candidate{i+1}',
                defaults={
                    'email': fake.email(),
                    'password': make_password('123456'),
                    'role': 'candidate',
                    'phone': fake.numerify('09########'),
                }
            )
            profile, _ = CandidateProfile.objects.get_or_create(user=user)
            profile.skills.set(random.sample(skills, k=random.randint(2, 5)))

        self.stdout.write('✓ Users + Companies (kèm Logo) + Jobs chuẩn + Profiles')