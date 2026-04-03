from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    Company, JobCategory, Skill, Job,
    Application, CandidateProfile, EmployerProfile
)

User = get_user_model()

#Success
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
        return User.objects.create_user(**validated_data)

#Update again
#Success
class UserSerializer(serializers.ModelSerializer):
    avatar_url = serializers.SerializerMethodField()
    #Thêm write_only để upload avatar từ CloudinaryField
    avatar = serializers.ImageField(write_only=True, required=False)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'phone', 'avatar_url','avatar']
        read_only_fields = ['role']

    def get_avatar_url(self, obj):
        if obj.avatar:
            return obj.avatar.url
        return None

    #Thêm cái update để xử lý việc lưu avatar khi update lại user
    def update(self, instance, validated_data):
        avatar = validated_data.pop('avatar',None)
        instance = super().update(instance, validated_data)
        if avatar is not None:
            instance.avatar = avatar
            instance.save()
        return instance


# SKILL
#Success
class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = ['id', 'name']

#Category
#Success
class JobCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = JobCategory
        fields = ['id', 'name']


# COMPANY
#Success
class CompanySerializer(serializers.ModelSerializer):
    owner = UserSerializer(read_only=True)

    #Thêm MethodField để trả URL tuyệt dối
    logo_url = serializers.SerializerMethodField()
    #Giữ logo là write_only để upload
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

# JOB
class JobListSerializer(serializers.ModelSerializer):
    # Dùng cho danh sách jobs
    company_name = serializers.CharField(source='company.name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    skills = SkillSerializer(many=True, read_only=True)

    class Meta:
        model = Job
        fields = [
            'id', 'title', 'company_name', 'category_name',
            'location', 'job_type', 'salary_min', 'salary_max',
            'deadline', 'quantity', 'skills', 'created_at'
        ]


class JobDetailSerializer(serializers.ModelSerializer):
    # Dùng cho chi tiết job, tạo, sửa
    company = CompanySerializer(read_only=True)
    category = JobCategorySerializer(read_only=True)
    skills = SkillSerializer(many=True, read_only=True)

    # Write-only fields để tạo/sửa
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
            'id', 'title', 'description', 'requirements',
            'location', 'job_type', 'deadline',
            'salary_min', 'salary_max', 'quantity',
            'company', 'company_id',
            'category', 'category_id',
            'skills', 'skill_ids',
            'is_active', 'created_at',
        ]
        read_only_fields = ['created_at']

    #Override update để xử lý ManytoMany cho skills, dùng set
    def update(self, instance, validated_data):
        skills = validated_data.pop('skills', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if skills is not None:
            instance.skills.set(skills)
        return instance



# APPLICATION
class ApplicationSerializer(serializers.ModelSerializer):
    candidate = UserSerializer(read_only=True)
    job = JobListSerializer(read_only=True)
    job_id = serializers.PrimaryKeyRelatedField(
        queryset=Job.objects.all(), write_only=True, source='job'
    )

    class Meta:
        model = Application
        fields = [
            'id', 'candidate', 'job', 'job_id',
            'cover_letter', 'cv_file', 'status', 'created_at'
        ]
        read_only_fields = ['candidate', 'status', 'created_at']

    def validate(self, data):
        request = self.context['request']
        job = data.get('job')

        if self.instance is None:
            if Application.objects.filter(candidate=request.user,job=job).exists():
                raise serializers.ValidationError('Bạn đã ứng tuyển vị trí này rồi!')
        return data


# PROFILES
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