from datetime import timedelta
from django.db import models, transaction
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator
from cloudinary.models import CloudinaryField
import random as _random

from django.core.exceptions import ValidationError


class User(AbstractUser):
    ROLE_CHOICES =[
        ('admin', 'Admin'),
        ('candidate', 'Candidate'),
        ('employer', 'Employer'),
    ]
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='candidate')
    phone = models.CharField(max_length=11, blank=True, null=True)
    avatar = CloudinaryField('avatar', blank=True, null=True)

    def __str__(self):
        return self.username


class BaseModel(models.Model):
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True

class Company(BaseModel):
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='companies')
    name = models.CharField(max_length=100)
    logo = CloudinaryField('logo', blank=True, null=True)
    description = models.TextField(null=True, blank=True)
    website = models.URLField(null=True, blank=True)
    address = models.TextField(null=True, blank=True)

    def __str__(self):
        return self.name

class JobCategory(BaseModel):
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name

class Skill(BaseModel):
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name

class Package(BaseModel):
    PACKAGE_TYPE_CHOICES = [
        ('featured_job', 'Tin tuyển dụng nổi bật'),
        ('priority_application', 'Hồ sơ ứng viên ưu tiên'),
    ]
    LEVEL_CHOICES = [
        (1, 'VIP1'),
        (2, 'VIP2'),
        (3, 'VIP3'),
    ]

    name = models.CharField(max_length=50)
    package_type = models.CharField(max_length=30, choices=PACKAGE_TYPE_CHOICES)
    level = models.IntegerField(choices=LEVEL_CHOICES)
    duration_days = models.IntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.TextField(null=True, blank=True)

    class Meta:
        unique_together = ('package_type', 'level')
        ordering = ['package_type','level']

    def __str__(self):
        return f"{self.name} - {self.price}đ"

class Job(BaseModel):

    JOB_TYPE_CHOICES = [
        ('FT', 'Full-time'),
        ('PT', 'Part-time'),
        ('RE', 'Remote'),
        ('FR', 'Freelance'),
    ]
    title = models.CharField(max_length=100)
    requirements = models.TextField(null=True, blank=True)
    description = models.TextField()
    benefits = models.TextField(null=True, blank=True)
    location =models.CharField(max_length=255, null=True, blank=True)
    job_type = models.CharField(max_length=2, choices=JOB_TYPE_CHOICES, default='FT')
    experience_required = models.CharField(max_length=100, null=True, blank=True)
    deadline = models.DateField(null=True, blank=True)
    salary_min = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    salary_max = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    quantity = models.PositiveIntegerField(default=1)
    skills = models.ManyToManyField(Skill)
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='jobs')
    category = models.ForeignKey(JobCategory, on_delete=models.CASCADE, related_name='jobs')


    #Ranking
    is_featured = models.BooleanField(default=False) # đánh dấu tin nổi bật sau khi được employer thanh toán
    featured_priority = models.IntegerField(default=0)
    featured_expired_at = models.DateTimeField(null=True, blank=True)
    featured_score = models.FloatField(default=0.0)

    class Meta:
        indexes = [
            models.Index(fields=['-featured_score']),
            models.Index(fields=['is_featured']),
            models.Index(fields=['-featured_priority', '-created_at']),
        ]

    def calculate_score(self):
        """score = featured_priority * 1000 + freshness_score + random_factor
         freshness_score: giảm dần theo ngày (max 100)
        random_factor: 0-10 để tránh tie hoàn toàn"""

        #freshness: tin mới = điểm cao, giảm 10 point/day tối đa có 100 point
        days_old = (timezone.now() - self.created_at).days if self.created_at else 0
        freshness_score = max(0,100 - days_old * 10)

        #Boost nếu gần hết hạn (còn <= 3 day)
        deadline_boost = 0
        if self.deadline:
            days_to_deadline = (self.deadline - timezone.now().date()).days
            if 0 <= days_to_deadline <= 3:
                #đẩy mạnh lên cao khi days càng ngắn
                deadline_boost = (3 - days_to_deadline) * 20

        seed = self.id or (int(self.created_at.timestamp()) if self.created_at else 0)
        rng = _random.Random(seed)
        random_factor = rng.uniform(0,10)
        return (self.featured_priority * 1000) + freshness_score + random_factor + deadline_boost

    def save(self, *args, **kwargs):
        if self.featured_priority > 0 and self.featured_expired_at and self.featured_expired_at > timezone.now():
            self.is_featured = True
        else:
            self.is_featured = False
            self.featured_priority = 0
        super().save(*args, **kwargs)

        score = self.calculate_score()
        if score != self.featured_score:
            Job.objects.filter(pk=self.pk).update(featured_score=score)

    def __str__(self):
        return self.title

class JobComparison(BaseModel):
    candidate =models.ForeignKey(User, on_delete=models.CASCADE, related_name='comparisons')
    jobs = models.ManyToManyField(Job, related_name='comparisons')

    class Meta:
        ordering = ('-created_at',)

    def __str__(self):
        return f"{self.candidate.username}'s comparison"

class Application(BaseModel):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('REVIEWING', 'Reviewing'),
        ('ACCEPTED', 'Accepted'),
        ('REJECTED', 'Rejected'),
    ]

    candidate = models.ForeignKey(User, on_delete=models.CASCADE, related_name='applications')
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='applications')
    cover_letter = models.TextField(null=True, blank=True)
    cv_file = CloudinaryField('cv_file', blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    employer_note = models.TextField(null=True, blank=True)
    rating = models.PositiveIntegerField(default=0, validators=[MinValueValidator(0), MaxValueValidator(5)])
    #CV priority
    is_priority = models.BooleanField(default=False)
    priority_level = models.IntegerField(default=0)
    priority_expired_at = models.DateTimeField(null=True, blank=True)

    def is_priority_active(self):
        return (
            self.is_priority
            and self.priority_expired_at is not None
            and self.priority_expired_at > timezone.now()
        )

    def save(self, *args, **kwargs):
        if self.priority_expired_at and self.priority_expired_at < timezone.now():
            self.is_priority = False
            self.priority_level = 0
        super().save(*args, **kwargs)

    class Meta:
        unique_together = ('candidate', 'job')
        ordering = ('-priority_level','-created_at')
        indexes = [
            models.Index(fields=['candidate', 'job']),
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return f"{self.candidate} - {self.job}"

class CandidateProfile(BaseModel):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=10, choices=[
        ('male', 'Male'),
        ('female', 'Female'),
    ], null=True, blank=True)
    address = models.TextField(null=True, blank=True)
    bio = models.TextField(null=True, blank=True)
    cv_file = CloudinaryField('cv_file', blank=True, null=True)
    skills = models.ManyToManyField(Skill, blank=True)

    def __str__(self):
        return f"{self.user.username}'s profile"

class EmployerProfile(BaseModel):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='employer_profile')
    company = models.ForeignKey(Company, on_delete=models.SET_NULL, null=True, blank=True, related_name='employers')
    position = models.CharField(max_length=100, null=True, blank=True) 
    bio = models.TextField(null=True, blank=True)
    is_verified = models.BooleanField(default=False)
    def __str__(self):
        return f"{self.user.username}'s employer profile"

class Payment(BaseModel):
    PAYMENT_METHOD_CHOICES = [
        ('cash','Tiền mặt'),
        ('paypal','PayPal'),
        ('stripe','Stripe'),
        ('momo','MoMo'),
        ('zalopay','ZaloPay'),
    ]
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    ]
    PAYMENT_TYPE_CHOICES = [
        ('featured_job', 'Tin tuyển dụng nổi bật'),
        ('priority_application', 'Hồ sơ ứng viên ưu tiên'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='payments')
    package = models.ForeignKey(Package, on_delete=models.SET_NULL,null=True, related_name='payments')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES, default='cash')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    payment_type = models.CharField(
        max_length=30,
        choices=PAYMENT_TYPE_CHOICES,
        default='featured_job'
    )
    paid_at = models.DateTimeField(null=True, blank=True) #Timestamp thanh toán
    application = models.ForeignKey(Application, on_delete=models.SET_NULL, null=True, blank=True,
                                    related_name='payments')
    transaction_id = models.CharField(max_length=255,unique=True, null=True, blank=True) # mã giao dịch từ các bên thứ 3
    description = models.TextField(null=True, blank=True)
    job = models.ForeignKey(Job, on_delete=models.SET_NULL,null=True,blank=True, related_name='payments')

    class Meta:
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['payment_type']),
        ]

    def clean(self):
        if self.payment_type == 'featured_job' and not self.job:
            raise ValidationError('Featured job payment phải có job.')
        if self.payment_type == 'priority_application' and not self.application:
            raise ValidationError('Priority application payment phải có application.')
        if self.job and self.application:
            raise ValidationError('Payment chỉ được có job HOẶC application, không được cả hai.')

        #Validate package đúng loại
        if self.package and self.package.package_type != self.payment_type:
            raise ValidationError(
                f'Package "{self.package.name}" không đúng loại.'
                f'Cần package loại "{self.payment_type}"'
            )

    def apply_payment_effect(self):
        if self.status != 'completed':
            return
        if self.payment_type == 'featured_job' and self.job and self.package:
            self.job.is_featured = True
            self.job.featured_priority = self.package.level
            self.job.featured_expired_at = timezone.now() + timedelta(days=self.package.duration_days)
            self.job.save()

        elif self.payment_type == 'priority_application' and self.application and self.package:
            self.application.is_priority= True
            self.application.priority_level = self.package.level
            self.application.priority_expired_at = timezone.now() + timedelta(days=self.package.duration_days)
            self.application.save()

    def save(self, *args, **kwargs):

        self.clean()
        is_new_completed = (
            self.status == 'completed'
            and self.paid_at is None
        )

        with transaction.atomic():
            if is_new_completed:
                self.paid_at = timezone.now()
            super().save(*args, **kwargs)
            if is_new_completed:
                self.apply_payment_effect()


    def __str__(self):
        return f"{self.user.username} - {self.amount} - {self.method}"