from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.utils import timezone
from .models import (
    Company, JobCategory, Skill, Job, Package,
    Application, CandidateProfile, EmployerProfile, JobComparison, Payment
)

User = get_user_model()

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'confirm_password', 'role', 'phone']

    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({'confirm_password': 'Mật khẩu không khớp.'})
        if data.get('role') == 'admin':
            raise serializers.ValidationError({'role': 'Không thể tự đăng ký role admin.'})
        return data

    def create(self, validated_data):
        validated_data.pop('confirm_password')

        if validated_data.get('role') == 'employer':
            validated_data['is_active'] = False

        user = User.objects.create_user(**validated_data)

        if user.role == 'employer':
            EmployerProfile.objects.get_or_create(user=user)

        return user

class UserSerializer(serializers.ModelSerializer):
    avatar_url = serializers.SerializerMethodField()
    avatar = serializers.ImageField(write_only=True, required=False)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'phone', 'avatar_url','avatar']
        read_only_fields = ['role']

    def get_avatar_url(self, obj):
        if obj.avatar:
            return obj.avatar.url
        return None

    def update(self, instance, validated_data):
        avatar = validated_data.pop('avatar',None)
        instance = super().update(instance, validated_data)
        if avatar is not None:
            instance.avatar = avatar
            instance.save()
        return instance

class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = ['id', 'name']

class JobCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = JobCategory
        fields = ['id', 'name']

class CompanySerializer(serializers.ModelSerializer):
    owner = UserSerializer(read_only=True)
    logo_url = serializers.SerializerMethodField()
    logo = serializers.ImageField(write_only=True, required=False)

    class Meta:
        model = Company
        fields = ['id', 'name', 'logo','logo_url', 'description', 'website', 'address', 'owner', 'created_at']
        read_only_fields = ['owner', 'created_at']

    def get_logo_url(self, obj):
        request = self.context.get('request')
        if obj.logo and request:
            return request.build_absolute_uri(obj.logo.url)
        return None

    def get_job_count(self, obj):
        return obj.jobs.filter(is_active=True, status='approved').count()

class JobListSerializer(serializers.ModelSerializer):
    accepted_count = serializers.SerializerMethodField()
    company_name = serializers.CharField(source='company.name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    skills = SkillSerializer(many=True, read_only=True)
    company_logo = serializers.SerializerMethodField()

    class Meta:
        model = Job
        fields = [
            'id', 'title', 'company_name', 'category_name', 'company_logo',
            'location', 'job_type', 'salary_min', 'salary_max',
            'deadline', 'quantity', 'skills', 'created_at',
            'is_featured','featured_priority',
            'status', 'rejection_reason','accepted_count',
        ]
    
    def get_company_logo(self, obj):
        if obj.company and obj.company.logo:
            return obj.company.logo.url
        return None
    
    def get_accepted_count(self, obj):
        try:
            return Application.objects.filter(job=obj, status='ACCEPTED').count()
        except Exception:
            return 0

class JobDetailSerializer(serializers.ModelSerializer):
    company = CompanySerializer(read_only=True)
    category = JobCategorySerializer(read_only=True)
    skills = SkillSerializer(many=True, read_only=True)
    accepted_count = serializers.SerializerMethodField()
    company_id = serializers.PrimaryKeyRelatedField(
        queryset=Company.objects.all(), write_only=True, source='company'
    )
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=JobCategory.objects.all(), write_only=True, source='category'
    )
    skill_ids = serializers.PrimaryKeyRelatedField(
        queryset=Skill.objects.all(), many=True, write_only=True, source='skills'
    )

    class Meta:
        model = Job
        fields = [
            'id', 'title', 'description', 'requirements', 'benefits',
            'location', 'job_type', 'deadline',
            'salary_min', 'salary_max', 'quantity',
            'company', 'company_id',
            'category', 'category_id',
            'skills', 'skill_ids', 'accepted_count',
            'is_active', 'created_at',
            'status', 'rejection_reason',
            'is_featured','featured_priority',
        ]
        read_only_fields = ['created_at','status', 'rejection_reason','is_featured','featured_priority']

    def update(self, instance, validated_data):
        skills = validated_data.pop('skills', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if skills is not None:
            instance.skills.set(skills)
        return instance

    def get_accepted_count(self, obj):
        try:
            return Application.objects.filter(job=obj, status='ACCEPTED').count()
        except Exception:
            return 0

    def validate(self, data):
        salary_min = data.get('salary_min')
        salary_max = data.get('salary_max')
        if salary_min and salary_max and salary_min > salary_max:
            raise serializers.ValidationError({
                'salary_min': 'Lương tối thiểu không được lớn hơn lương tối đa.'
            })
        return data

class JobCompareItemSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source='company.name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    skills = SkillSerializer(many=True, read_only=True)
    company_address = serializers.CharField(source='company.address', read_only=True)
    category_id = serializers.IntegerField(source='category.id', read_only=True)

    class Meta:
        model = Job
        fields = ['id','title','salary_min','salary_max'
                  ,'requirements','description','location','job_type','benefits',
                  'company_name','company_address','category_name','category_id',
                  'skills', 'deadline','quantity','is_featured','created_at']

class JobComparisonSerializer(serializers.ModelSerializer):
    jobs = JobCompareItemSerializer(many=True, read_only=True)
    job_ids = serializers.PrimaryKeyRelatedField(
        queryset = Job.objects.filter(is_active=True),
        many = True,
        write_only = True,
        source = 'jobs'
    )
    comparison_summary = serializers.SerializerMethodField()
    class Meta:
        model = JobComparison
        fields = ['id', 'jobs', 'job_ids','comparison_summary', 'created_at']
        read_only_fields = ['created_at']

    def get_comparison_summary(self, obj):
        jobs = obj.jobs.all()
        if not jobs:
            return None
        return {
            'total_jobs': jobs.count(),
            'salary_range': {
                'highest_max': max((j.salary_max for j in jobs if j.salary_max), default=None),
                'lowest_min': min((j.salary_min for j in jobs if j.salary_min), default=None),
            },
            'locations': list(set(j.location for j in jobs if j.location)),
            'job_types': list(set(j.job_type for j in jobs if j.job_type)),
            'categories': list(set(j.category.name for j in jobs if j.category)),
            'same_category': len(set(j.category_id for j in jobs)) == 1,
        }

    def validate_job_ids(self, jobs):
        if len(jobs) < 2:
            raise serializers.ValidationError('Cần ít nhất 2 công việc để so sánh.')
        if len(jobs) > 5:
            raise serializers.ValidationError('Chỉ được so sánh tối đa 5 công việc.')

        categories = set(j.category_id for j in jobs)
        if len(categories) > 1:
            pass
        return jobs

    def create(self, validate_data):
        jobs = validate_data.pop('jobs')
        comparison = JobComparison.objects.create(**validate_data)
        comparison.jobs.set(jobs)
        return comparison

class CandidateProfilePublicSerializer(serializers.ModelSerializer):

    skills = SkillSerializer(many=True, read_only=True)

    class Meta:
        model = CandidateProfile
        fields = ['bio','gender','address','cv_file','skills']

class CandidatePublicSerializer(serializers.ModelSerializer):
    avatar_url = serializers.SerializerMethodField()
    profile = CandidateProfilePublicSerializer(read_only=True)
    class Meta:
        model = User
        fields = ['id', 'username','phone', 'avatar_url','profile']

    def get_avatar_url(self, obj):
        if obj.avatar:
            return obj.avatar.url
        return None

class ApplicationSerializer(serializers.ModelSerializer):
    candidate = CandidatePublicSerializer(read_only=True)
    job = JobListSerializer(read_only=True)
    cv_file_url = serializers.SerializerMethodField()
    job_id = serializers.PrimaryKeyRelatedField(
        queryset=Job.objects.all(), write_only=True, source='job'
    )
    is_priority_active = serializers.SerializerMethodField()

    class Meta:
        model = Application
        fields = [
            'id', 'candidate', 'job', 'job_id',
            'cover_letter', 'cv_file', 'status', 'created_at',
            'is_priority', 'priority_level', 'cv_file_url',
            'is_priority_active', 'employer_note','rating',
            'priority_expired_at',
        ]
        read_only_fields = ['candidate', 'status', 'created_at','is_priority', 'priority_level']

    def get_is_priority_active(self, obj):
        return obj.is_priority_active()
    
    def get_cv_file_url(self, obj):
        if obj.cv_file:
            return obj.cv_file.url
        return None

    def validate(self, data):
        from django.utils import timezone
        request = self.context['request']
        job = data.get('job')

        if hasattr(job, 'is_active') and not job.is_active:
            raise serializers.ValidationError('Tin tuyển dụng này đã đóng.')

        if job.deadline and job.deadline < timezone.now().date():
            raise serializers.ValidationError('Tin tuyển dụng này đã hết hạn.')

        if self.instance is None:
            if Application.objects.filter(candidate=request.user, job=job).exists():
                raise serializers.ValidationError('Bạn đã ứng tuyển vị trí này rồi!')

            accepted_count = Application.objects.filter(job=job, interview_notified=True).count()
            if accepted_count >= job.quantity:
                raise serializers.ValidationError('Vị trí tuyển dụng này đã nhận đủ số lượng ứng viên!')

        return data
    
class ApplicationEmployerNoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Application
        fields = ['id','employer_note']

class InterviewScheduleSerializer(serializers.ModelSerializer):
    candidate_email    = serializers.EmailField(source='candidate.email', read_only=True)
    candidate_name     = serializers.CharField(source='candidate.get_full_name', read_only=True)
    candidate_username = serializers.CharField(source='candidate.username', read_only=True)
    job_title          = serializers.CharField(source='job.title', read_only=True)
    company_name       = serializers.CharField(source='job.company.name', read_only=True)

    class Meta:
        model  = Application
        fields = [
            'id', 'status', 'created_at',
            'candidate_email', 'candidate_name', 'candidate_username',
            'job_title', 'company_name',
            'interview_location', 'interview_at',
            'interview_note', 'interview_map_url', 'interview_notified',
        ]
        read_only_fields = ['status', 'created_at', 'interview_notified',
                            'candidate_email', 'candidate_name', 'candidate_username',
                            'job_title', 'company_name']
    
    def validate_interview_at(self, value):
        from django.utils import timezone
        if value and value < timezone.now():
            raise serializers.ValidationError('Thời gian phỏng vấn phải trong tương lai.')
        return value

    def validate(self, data):
        if data.get('interview_at') and not data.get('interview_location'):
            raise serializers.ValidationError({'interview_location': 'Vui lòng nhập địa điểm phỏng vấn.'})
        return data
    
class CandidateProfileSerializer(serializers.ModelSerializer):
    skills = SkillSerializer(many=True, read_only=True)
    skill_ids = serializers.PrimaryKeyRelatedField(
        queryset=Skill.objects.all(), many=True, write_only=True, source='skills'
    )

    class Meta:
        model = CandidateProfile
        fields = [
            'id', 'date_of_birth', 'gender', 'address',
            'bio', 'cv_file', 'skills', 'skill_ids'
        ]
    def update(self, instance, validated_data):
        skills = validated_data.pop('skills', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if skills is not None:
            instance.skills.set(skills)
        return instance


class EmployerProfileSerializer(serializers.ModelSerializer):
    company = CompanySerializer(read_only=True)
    company_id = serializers.PrimaryKeyRelatedField(
        queryset=Company.objects.all(), write_only=True, source='company', required=False
    )

    class Meta:
        model = EmployerProfile
        fields = ['id', 'company', 'company_id', 'position', 'bio']

    def validate_company_id(self, value):
        request = self.context.get('request')
        if request and value.owner != request.user:
            raise serializers.ValidationError('Bạn không phải chủ sở hữu công ty này.')
        return value

class EmployerVerifySerializer(serializers.ModelSerializer):
    class Meta:
        model = EmployerProfile
        fields = ['id','is_verified']

class EmployerProfileAdminSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    company = CompanySerializer(read_only=True)

    class Meta:
        model = EmployerProfile
        fields = ['id', 'user', 'company', 'position', 'bio','is_verified', 'is_rejected', 'rejection_reason', 'created_at']

class AdminJobSerializer(serializers.ModelSerializer):
    company = CompanySerializer(read_only=True)
    category = JobCategorySerializer(read_only=True)

    class Meta:
        model = Job
        fields = [
            'id', 'title', 'company', 'category',
            'location', 'job_type', 'deadline',
            'status', 'rejection_reason', 'created_at',
        ]

class PackageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Package
        fields = ['id', 'name', 'package_type', 'level', 'duration_days', 'price', 'description']

class PaymentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    package_detail = serializers.SerializerMethodField()

    class Meta:
        model = Payment
        fields = ['id', 'user', 'amount', 'method', 'status',
            'payment_type','package','package_detail', 'transaction_id', 'description',
            'job', 'application', 'created_at']
        read_only_fields = ['user', 'status', 'transaction_id','amount', 'created_at']

    def get_package_detail(self, obj):
        if obj.package:
            return {
                'name': obj.package.name,
                'level': obj.package.level,
                'duration_days': obj.package.duration_days,
                'price': str(obj.package.price),
            }
        return None

    def validate(self, data):
        request = self.context['request']
        user = request.user
        payment_type = data.get('payment_type')
        package = data.get('package')
        job = data.get('job')
        application = data.get('application')

        if not package:
            raise serializers.ValidationError({'package':'Cần chọn package'})

        if package.package_type != payment_type:
            raise serializers.ValidationError({
                'package': f'Package "{package.name}" không đúng loại. Cần loại "{payment_type}"'
            })

        data['amount'] = package.price

        if payment_type == 'featured_job':
            if user.role != 'employer':
                raise serializers.ValidationError(
                    {'payment_type': 'Chỉ Employer mới có thể mua gói tin nổi bật.'}
                )
            if not job:
                raise serializers.ValidationError({'job': 'Cần chọn job để featured.'})
            if job.company.owner != user:
                raise serializers.ValidationError({'job': 'Job này không thuộc về bạn.'})
            if job.is_featured:
                raise serializers.ValidationError({'job': 'Job này đã được featured rồi.'})

        elif payment_type == 'priority_application':
            if user.role != 'candidate':
                raise serializers.ValidationError(
                    {'payment_type': 'Chỉ Candidate mới có thể mua gói ưu tiên hồ sơ.'}
                )
            if not application:
                raise serializers.ValidationError({'application': 'Cần chọn application để ưu tiên.'})
            if application.candidate != user:
                raise serializers.ValidationError({'application': 'Application này không phải của bạn.'})
            if application.is_priority_active():
                raise serializers.ValidationError({'application': 'Hồ sơ này đã được ưu tiên rồi.'})

        return data