from django.core.management.base import BaseCommand
from django.contrib.auth.hashers import make_password
from faker import Faker
from jobboard.models import (
    User, Company, JobCategory, Skill,
    Package, Job, CandidateProfile, EmployerProfile
)
import random

fake = Faker('vi_VN')

class Command(BaseCommand):
    help = 'Seed dữ liệu mẫu'

    def handle(self, *args, **kwargs):
        self.stdout.write('Bắt đầu seed...')
        self.seed_categories()
        self.seed_skills()
        self.seed_packages()
        self.seed_users()
        self.stdout.write(self.style.SUCCESS('Seed xong!'))

    def seed_categories(self):
        categories = ['IT', 'Marketing', 'Kế toán', 'Thiết kế', 'Kinh doanh', 'Nhân sự']
        for name in categories:
            JobCategory.objects.get_or_create(name=name)
        self.stdout.write('✓ Categories')

    def seed_skills(self):
        skills = ['Python', 'Django', 'React', 'SQL', 'Excel', 'Photoshop', 'Java', 'NodeJS']
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
            Package.objects.get_or_create(
                package_type=p['package_type'],
                level=p['level'],
                defaults=p
            )
        self.stdout.write('✓ Packages')

    def seed_users(self):
        skills = list(Skill.objects.all())
        categories = list(JobCategory.objects.all())

        # Tạo 5 employer
        for i in range(5):
            user, created = User.objects.get_or_create(
                username=f'employer{i+1}',
                defaults={
                    'email': fake.email(),
                    'password': make_password('123456'),
                    'role': 'employer',
                    'phone': fake.numerify('0#########'),
                }
            )
            company, _ = Company.objects.get_or_create(
                owner=user,
                defaults={
                    'name': fake.company(),
                    'description': fake.text(),
                    'address': fake.address(),
                }
            )
            EmployerProfile.objects.get_or_create(
                user=user,
                defaults={'company': company, 'is_verified': True}
            )
            # Tạo 3 job cho mỗi employer
            for j in range(3):
                job = Job.objects.create(
                    title=fake.job(),
                    description=fake.text(200),
                    requirements=fake.text(100),
                    benefits=fake.text(100),
                    location=fake.city(),
                    salary_min=random.randint(5, 20) * 1_000_000,
                    salary_max=random.randint(20, 50) * 1_000_000,
                    company=company,
                    category=random.choice(categories),
                    deadline=fake.future_date(),
                )
                job.skills.set(random.sample(skills, k=3))

        # Tạo 10 candidate
        for i in range(10):
            user, created = User.objects.get_or_create(
                username=f'candidate{i+1}',
                defaults={
                    'email': fake.email(),
                    'password': make_password('123456'),
                    'role': 'candidate',
                    'phone': fake.numerify('0#########'),
                }
            )
            profile, _ = CandidateProfile.objects.get_or_create(user=user)
            profile.skills.set(random.sample(skills, k=random.randint(2, 5)))

        self.stdout.write('✓ Users + Companies + Jobs + Profiles')