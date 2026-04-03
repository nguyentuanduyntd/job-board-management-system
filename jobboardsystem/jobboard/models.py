from django.db import models
from django.contrib.auth.models import AbstractUser
from cloudinary.models import CloudinaryField

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
    logo = models.ImageField(upload_to='jobboard/', null=True, blank=True)
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
    location =models.CharField(max_length=255, null=True, blank=True)
    job_type = models.CharField(max_length=2, choices=JOB_TYPE_CHOICES, default='FT')
    deadline = models.DateField(null=True, blank=True)
    salary_min = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    salary_max = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    quantity = models.PositiveIntegerField(default=1)

    skills = models.ManyToManyField(Skill)
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='jobs')
    category = models.ForeignKey(JobCategory, on_delete=models.CASCADE, related_name='jobs')
    is_featured = models.BooleanField(default=False) # đánh dấu tin nổi bật sau khi được employer thanh toán
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
    cv_file = models.FileField(upload_to='jobboard/cv/', null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')

    class Meta:
        unique_together = ('candidate', 'job')

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
    cv_file = models.FileField(upload_to='jobboard/cv/', null=True, blank=True)
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
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES, default='cash')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    transaction_id = models.CharField(max_length=255, null=True, blank=True) # mã giao dịch từ các bên thứ 3
    description = models.TextField(null=True, blank=True)
    job = models.ForeignKey(Job, on_delete=models.SET_NULL,null=True,blank=True, related_name='payments')
    def __str__(self):
        return f"{self.user.username} - {self.amount} - {self.method}"