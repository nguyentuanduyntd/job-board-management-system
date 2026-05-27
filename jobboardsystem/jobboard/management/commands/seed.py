from django.core.management.base import BaseCommand
from django.contrib.auth.hashers import make_password
from faker import Faker
from datetime import date, datetime, timedelta
import random
import cloudinary.uploader
from django.utils import timezone  

from jobboard.models import (
    User, Company, JobCategory, Skill,
    Package, Job, CandidateProfile, EmployerProfile
)

fake = Faker('vi_VN')


REAL_COMPANIES = [
    {"name": "Công ty CP Công nghệ VNG",          "address": "182 Lê Đại Hành, Q.11, TP.HCM"},
    {"name": "FPT Software",                       "address": "Tòa nhà FPT, Số 17 Duy Tân, Cầu Giấy, Hà Nội"},
    {"name": "Tiki Corporation",                   "address": "52 Út Tịch, P.4, Q. Tân Bình, TP.HCM"},
    {"name": "Shopee Việt Nam",                    "address": "Tầng 6, 14 Tống Hữu Định, TP.HCM"},
    {"name": "Công ty TNHH Giải pháp TechNova",   "address": "Lô E2a-7, KCN Cao TP.HCM, Q.9"},
    {"name": "Creative Design Studio",             "address": "85 Nguyễn Đình Chiểu, Q.3, TP.HCM"},
    {"name": "MoMo (M_Service)",                   "address": "Tầng 4, 42 Cống Quỳnh, Q.1, TP.HCM"},
    {"name": "Grab Vietnam",                       "address": "Tầng 12, 15 Đoàn Văn Bộ, Q.4, TP.HCM"},
    {"name": "Công ty CP Truyền thông MediaZ",     "address": "55 Lạc Long Quân, Tây Hồ, Hà Nội"},
    {"name": "Axon Active Vietnam",                "address": "Waseco, 10 Phổ Quang, Q. Tân Bình, TP.HCM"},
]

PENDING_COMPANIES = [
    {"name": "StartUp ABC Tech",        "address": "12 Nguyễn Văn Cừ, Q.5, TP.HCM"},
    {"name": "NextGen Solutions",       "address": "89 Trần Hưng Đạo, Q.1, TP.HCM"},
    {"name": "DataBridge Việt Nam",     "address": "45 Hoàng Văn Thụ, Q. Phú Nhuận"},
    {"name": "CloudSoft Việt Nam",      "address": "Tòa nhà Viettel, Láng Hạ, Đống Đa, Hà Nội"},
    {"name": "GreenTech Corp",          "address": "27 Đinh Tiên Hoàng, Bình Thạnh, TP.HCM"},
]

JOB_TITLES_BY_CATEGORY = {
    "IT Phần mềm": [
        "Lập trình viên Backend Python/Django",
        "Frontend Developer ReactJS",
        "Fullstack Developer NodeJS + VueJS",
        "Mobile Developer React Native",
        "DevOps Engineer (AWS/Docker)",
        "QA/QC Engineer Automation",
        "Data Engineer (Spark/Kafka)",
        "AI/ML Engineer",
        "System Analyst",
        "Junior Backend Developer Java",
    ],
    "Marketing": [
        "Chuyên viên Digital Marketing",
        "SEO Specialist",
        "Content Marketing Manager",
        "Social Media Executive",
        "Performance Marketing (Facebook/Google Ads)",
    ],
    "Kế toán / Kiểm toán": [
        "Nhân viên Kế toán tổng hợp",
        "Kế toán trưởng",
        "Kiểm toán nội bộ",
        "Chuyên viên Tài chính – Phân tích",
    ],
    "Thiết kế Đồ họa": [
        "UI/UX Designer",
        "Graphic Designer",
        "Motion Designer",
        "Product Designer",
    ],
    "Kinh doanh / Bán hàng": [
        "Trưởng nhóm Kinh doanh B2B",
        "Business Development Executive",
        "Key Account Manager",
        "Sales Manager",
    ],
    "Nhân sự": [
        "Chuyên viên Tuyển dụng IT",
        "HR Business Partner",
        "Training & Development Specialist",
    ],
}

DESCRIPTIONS = [
    """Chúng tôi đang tìm kiếm ứng viên tài năng để tham gia vào đội ngũ nòng cốt.
Bạn sẽ được làm việc trong môi trường năng động, chuyên nghiệp, với các dự án thực tế quy mô lớn.
Công việc yêu cầu sự sáng tạo, chủ động và khả năng làm việc nhóm tốt.""",

    """Vị trí này sẽ đóng vai trò then chốt trong việc xây dựng và phát triển sản phẩm của chúng tôi.
Bạn sẽ được cộng tác trực tiếp với đội ngũ Product và Design để cho ra đời những trải nghiệm người dùng xuất sắc.
Chúng tôi đề cao tư duy phản biện, tinh thần học hỏi liên tục và văn hóa làm việc minh bạch.""",

    """Đây là cơ hội tuyệt vời để bạn phát triển sự nghiệp trong môi trường công nghệ hàng đầu Việt Nam.
Bạn sẽ tiếp cận công nghệ mới nhất, được mentor bởi các chuyên gia giàu kinh nghiệm trong ngành.
Chúng tôi cam kết đầu tư vào sự phát triển dài hạn của từng thành viên.""",
]

REQUIREMENTS = [
    """- Có ít nhất 1–2 năm kinh nghiệm ở vị trí tương đương.
- Tốt nghiệp Đại học/Cao đẳng chuyên ngành liên quan.
- Có tinh thần trách nhiệm cao, chịu được áp lực công việc.
- Kỹ năng giao tiếp và giải quyết vấn đề tốt.
- Tiếng Anh giao tiếp được (đọc hiểu tài liệu kỹ thuật).""",

    """- Tốt nghiệp chuyên ngành liên quan hoặc tự học có portfolio minh chứng.
- Có khả năng làm việc độc lập lẫn phối hợp nhóm.
- Chú ý đến chi tiết, tư duy logic và phân tích tốt.
- Ưu tiên ứng viên có kinh nghiệm tại công ty sản phẩm (product company).""",

    """- 3+ năm kinh nghiệm ở vị trí tương đương.
- Có kinh nghiệm làm việc trong môi trường Agile/Scrum.
- Khả năng đọc hiểu tiếng Anh kỹ thuật tốt.
- Có kỹ năng mentoring hoặc dẫn dắt nhóm nhỏ là lợi thế.""",
]

BENEFITS = [
    """- Mức lương cạnh tranh, thỏa thuận theo năng lực (review 2 lần/năm).
- Lương tháng 13, thưởng hiệu quả công việc (KPI).
- BHXH, BHYT, BHTN đầy đủ theo quy định pháp luật.
- Du lịch công ty 1–2 lần/năm trong và ngoài nước.
- Môi trường trẻ trung, phòng game, snack bar miễn phí.""",

    """- Thu nhập hấp dẫn + thưởng dự án, thưởng cuối năm.
- Được tài trợ học phí các khóa học chuyên môn và chứng chỉ quốc tế.
- Làm việc hybrid (3 ngày văn phòng, 2 ngày remote).
- Cung cấp MacBook Pro/Laptop cấu hình cao để làm việc.
- Cơ hội tham gia hội thảo công nghệ trong và ngoài nước.""",

    """- Lương gross hấp dẫn theo năng lực và kinh nghiệm.
- Chế độ phúc lợi toàn diện: khám sức khỏe định kỳ, bảo hiểm tai nạn 24/7.
- Cổ phần ESOP dành cho nhân viên lâu năm.
- Văn phòng trung tâm thành phố, dễ di chuyển.
- Đội ngũ lãnh đạo tâm huyết, môi trường không chính trị.""",
]

LOCATIONS = [
    "Quận 1, TP.HCM", "Quận 3, TP.HCM", "Quận 7, TP.HCM", "Bình Thạnh, TP.HCM",
    "Tân Bình, TP.HCM", "Cầu Giấy, Hà Nội", "Đống Đa, Hà Nội", "Hoàn Kiếm, Hà Nội",
    "Remote toàn quốc", "Quận 9, TP.HCM",
]

JOB_TYPES = ['FT', 'PT', 'RE', 'FR']
JOB_STATUSES_WEIGHTED = (
    ['approved'] * 6 + 
    ['pending'] * 3 +   
    ['rejected'] * 1    
)


def random_date_in_2026():
    """Trả về ngày ngẫu nhiên từ 2026-01-01 đến 2026-05-25 (rải đều)."""
    start = date(2026, 1, 1)
    end = date(2026, 5, 25)
    delta = (end - start).days
    return start + timedelta(days=random.randint(0, delta))


def random_deadline():
    """Deadline từ 2026-05-26 đến 2026-08-31."""
    start = date(2026, 5, 26)
    end = date(2026, 8, 31)
    delta = (end - start).days
    return start + timedelta(days=random.randint(0, delta))


class Command(BaseCommand):
    help = 'Seed dữ liệu mẫu phong phú: 10 candidate, 10 employer (active) + 5 employer (pending), ~10 job/employer'

    def handle(self, *args, **kwargs):
        self.stdout.write('🧹 Đang dọn dẹp dữ liệu cũ...')
        self.clear_old_data()

        self.stdout.write('🌱 Bắt đầu seed dữ liệu...')
        self.seed_categories()
        self.seed_skills()
        self.seed_packages()
        self.seed_active_employers()
        self.seed_pending_employers()
        self.seed_candidates()
        self.stdout.write(self.style.SUCCESS(' Seed xong thành công!'))

    def clear_old_data(self):
        Job.objects.all().delete()
        EmployerProfile.objects.all().delete()
        CandidateProfile.objects.all().delete()
        Company.objects.all().delete()
        Package.objects.all().delete()
        JobCategory.objects.all().delete()
        Skill.objects.all().delete()
        User.objects.filter(is_superuser=False).delete()
        self.stdout.write(self.style.WARNING('  Đã xóa sạch dữ liệu cũ (giữ lại Admin).'))

    def seed_categories(self):
        for name in JOB_TITLES_BY_CATEGORY.keys():
            JobCategory.objects.get_or_create(name=name)
        self.stdout.write('  ✓ JobCategories')

    def seed_skills(self):
        skills = [
            'Python', 'Django', 'Django REST Framework', 'FastAPI',
            'ReactJS', 'VueJS', 'NextJS', 'TypeScript', 'JavaScript',
            'Java', 'Spring Boot', 'NodeJS', 'NestJS',
            'MySQL', 'PostgreSQL', 'MongoDB', 'Redis',
            'Docker', 'Kubernetes', 'AWS', 'CI/CD', 'Linux',
            'Figma', 'Adobe XD', 'Photoshop', 'Illustrator',
            'SEO', 'Google Ads', 'Facebook Ads', 'Content Writing',
            'Excel', 'Power BI', 'Tableau',
            'Tuyển dụng', 'Đào tạo', 'C&B',
        ]
        for name in skills:
            Skill.objects.get_or_create(name=name)
        self.stdout.write('  ✓ Skills')

    def seed_packages(self):
        packages = [
            {'name': 'Featured VIP1', 'package_type': 'featured_job',         'level': 1, 'duration_days': 7,  'price': 500000},
            {'name': 'Featured VIP2', 'package_type': 'featured_job',         'level': 2, 'duration_days': 15, 'price': 900000},
            {'name': 'Featured VIP3', 'package_type': 'featured_job',         'level': 3, 'duration_days': 30, 'price': 1500000},
            {'name': 'Priority VIP1', 'package_type': 'priority_application', 'level': 1, 'duration_days': 7,  'price': 300000},
            {'name': 'Priority VIP2', 'package_type': 'priority_application', 'level': 2, 'duration_days': 15, 'price': 600000},
            {'name': 'Priority VIP3', 'package_type': 'priority_application', 'level': 3, 'duration_days': 30, 'price': 1000000},
        ]
        for p in packages:
            Package.objects.get_or_create(
                package_type=p['package_type'],
                level=p['level'],
                defaults=p
            )
        self.stdout.write('  ✓ Packages')

    def generate_dummy_logo(self, company_name):
        try:
            name_formatted = company_name.replace(' ', '+')
            colors = ['0D47A1', '1B5E20', 'B71C1C', '4A148C', 'E65100', '006064']
            bg = random.choice(colors)
            dummy_url = f"https://ui-avatars.com/api/?name={name_formatted}&background={bg}&color=fff&size=256&bold=true"
            result = cloudinary.uploader.upload(dummy_url, folder="jobboard/companies/logos")
            return result.get('secure_url', '')
        except Exception as e:
            self.stdout.write(self.style.WARNING(f"    ⚠ Không upload được logo '{company_name}': {e}"))
            return ''

    def seed_active_employers(self):
        skills = list(Skill.objects.all())
        categories = list(JobCategory.objects.all())
        cat_map = {c.name: c for c in categories}

        for i, cdata in enumerate(REAL_COMPANIES):
            idx = i + 1
            username = f'employer{idx}'

            user, _ = User.objects.get_or_create(
                username=username,
                defaults={
                    'email': f'hr{idx}@{username}.com',
                    'password': make_password('123456'),
                    'role': 'employer',
                    'phone': fake.numerify('09########'),
                    'is_active': True,
                }
            )

            self.stdout.write(f"  📸 Upload logo: {cdata['name']}...")
            logo_url = self.generate_dummy_logo(cdata['name'])

            company, _ = Company.objects.get_or_create(
                owner=user,
                defaults={
                    'name': cdata['name'],
                    'description': (
                        f"{cdata['name']} là một trong những doanh nghiệp hàng đầu Việt Nam trong lĩnh vực của mình. "
                        f"Chúng tôi không ngừng đổi mới và tạo ra giá trị thực sự cho khách hàng và xã hội."
                    ),
                    'address': cdata['address'],
                    'logo': logo_url,
                    'website': f"https://www.{username}.vn",
                }
            )

            EmployerProfile.objects.get_or_create(
                user=user,
                defaults={
                    'company': company,
                    'is_verified': True,
                    'position': random.choice(['HR Manager', 'Talent Acquisition', 'HR Director', 'Recruiter']),
                }
            )

            self._create_jobs_for_company(company, skills, cat_map)

        self.stdout.write(self.style.SUCCESS(f'  ✓ {len(REAL_COMPANIES)} Employer (active) + Companies + Jobs'))

    def _create_jobs_for_company(self, company, skills, cat_map):
        all_titles = []
        for cat_name, titles in JOB_TITLES_BY_CATEGORY.items():
            for t in titles:
                all_titles.append((cat_name, t))

        chosen = random.sample(all_titles, k=min(10, len(all_titles)))

        for cat_name, title in chosen:
            category = cat_map.get(cat_name)
            if not category:
                continue

            status = random.choice(JOB_STATUSES_WEIGHTED)
            rejection_reason = None
            if status == 'rejected':
                rejection_reason = random.choice([
                    'Mô tả công việc không rõ ràng, vui lòng bổ sung chi tiết.',
                    'Mức lương quá chênh lệch so với thực tế thị trường.',
                    'Tin đăng vi phạm nội quy: không đúng chuyên mục.',
                ])

            created_date = random_date_in_2026()
            job = Job.objects.create(
                title=title,
                description=random.choice(DESCRIPTIONS),
                requirements=random.choice(REQUIREMENTS),
                benefits=random.choice(BENEFITS),
                location=random.choice(LOCATIONS),
                job_type=random.choice(JOB_TYPES),
                experience_required=random.choice([
                    'Không yêu cầu kinh nghiệm', '1 năm', '2 năm', '3 năm', '5+ năm'
                ]),
                deadline=random_deadline(),
                salary_min=random.randint(8, 20) * 1_000_000,
                salary_max=random.randint(25, 60) * 1_000_000,
                quantity=random.randint(1, 5),
                company=company,
                category=category,
                status=status,
                rejection_reason=rejection_reason,
            )
            job_skills = random.sample(skills, k=random.randint(3, 5))
            job.skills.set(job_skills)

            Job.objects.filter(pk=job.pk).update(
                created_at=datetime(
                    created_date.year,
                    created_date.month,
                    created_date.day,
                    random.randint(7, 22),
                    random.randint(0, 59),
                )
            )

    def seed_pending_employers(self):
        for i, cdata in enumerate(PENDING_COMPANIES):
            idx = i + 1
            username = f'employer_pending{idx}'

            user, _ = User.objects.get_or_create(
                username=username,
                defaults={
                    'email': f'hr{idx}@pending{idx}.com',
                    'password': make_password('123456'),
                    'role': 'employer',
                    'phone': fake.numerify('09########'),
                    'is_active': True,
                }
            )

            logo_url = self.generate_dummy_logo(cdata['name'])

            company, _ = Company.objects.get_or_create(
                owner=user,
                defaults={
                    'name': cdata['name'],
                    'description': f"{cdata['name']} – startup đang trong quá trình xét duyệt trên hệ thống.",
                    'address': cdata['address'],
                    'logo': logo_url,
                }
            )

            EmployerProfile.objects.get_or_create(
                user=user,
                defaults={
                    'company': company,
                    'is_verified': False,
                    'is_rejected': False,
                    'position': 'HR Executive',
                    'is_active': False,  
                }
            )

        self.stdout.write(self.style.SUCCESS(f'  ✓ {len(PENDING_COMPANIES)} Employer (pending - chờ admin duyệt)'))

    def seed_candidates(self):
        skills = list(Skill.objects.all())

        candidate_data = [
            {'username': 'candidate1',  'name': 'Nguyễn Minh Tuấn',   'gender': 'male'},
            {'username': 'candidate2',  'name': 'Trần Thị Hương',      'gender': 'female'},
            {'username': 'candidate3',  'name': 'Lê Quốc Bảo',         'gender': 'male'},
            {'username': 'candidate4',  'name': 'Phạm Ngọc Linh',      'gender': 'female'},
            {'username': 'candidate5',  'name': 'Hoàng Đức Thịnh',     'gender': 'male'},
            {'username': 'candidate6',  'name': 'Vũ Thị Lan Anh',      'gender': 'female'},
            {'username': 'candidate7',  'name': 'Đặng Văn Hùng',       'gender': 'male'},
            {'username': 'candidate8',  'name': 'Bùi Thanh Mai',        'gender': 'female'},
            {'username': 'candidate9',  'name': 'Ngô Minh Khoa',        'gender': 'male'},
            {'username': 'candidate10', 'name': 'Đinh Thị Thu Hà',     'gender': 'female'},
        ]

        for cd in candidate_data:
            first, *last = cd['name'].split()
            user, _ = User.objects.get_or_create(
                username=cd['username'],
                defaults={
                    'email': f"{cd['username']}@gmail.com",
                    'password': make_password('123456'),
                    'role': 'candidate',
                    'phone': fake.numerify('09########'),
                    'first_name': ' '.join(last),
                    'last_name': first,
                    'is_active': True,
                }
            )

            profile, _ = CandidateProfile.objects.get_or_create(
                user=user,
                defaults={
                    'gender': cd['gender'],
                    'address': fake.address(),
                    'bio': random.choice([
                        'Lập trình viên đam mê công nghệ với 2 năm kinh nghiệm.',
                        'Sinh viên mới ra trường, nhiệt huyết, chăm chỉ học hỏi.',
                        'Chuyên viên có kinh nghiệm 3 năm, tìm kiếm môi trường thách thức hơn.',
                        'Freelancer đang tìm kiếm cơ hội full-time tại công ty sản phẩm.',
                    ]),
                    'date_of_birth': fake.date_of_birth(minimum_age=22, maximum_age=35),
                }
            )
            profile.skills.set(random.sample(skills, k=random.randint(3, 7)))

        self.stdout.write(self.style.SUCCESS('  ✓ 10 Candidates'))