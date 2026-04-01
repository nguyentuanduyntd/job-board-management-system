from django.contrib import admin
from django.template.response import TemplateResponse
from django.utils.html import mark_safe
from django.urls import path
from jobboard.models import JobCategory
from django import forms
from ckeditor.fields import CKEditorWidget
from django.db.models import Count
from .models import (
    User, Company, JobCategory, Skill, Job,
    Application, CandidateProfile, EmployerProfile
)

class JobForm(forms.ModelForm):
    description = forms.CharField(widget=CKEditorWidget())
    requirements = forms.CharField(widget=CKEditorWidget(), required=False)

    class Meta:
        model = Job
        fields = '__all__'

class UserAdmin(admin.ModelAdmin):
    list_display = ('id','username', 'email','role','is_active')
    search_fields = ['username','email']
    list_filter = ('role','is_active')
    readonly_fields = ['avatar_preview']

    def avatar_preview(self, user):
        if user.avatar:
            return mark_safe(f'<img src="{user.avatar.url}" width="100" height="100" />')
        return 'No avatar'
    avatar_preview.short_description = 'Avatar'

class CompanyAdmin(admin.ModelAdmin):
    list_display = ('id','name','owner','website','is_active')
    search_fields = ['name','address']
    list_filter = ('is_active',)
    readonly_fields = ['logo_preview']

    def logo_preview(self, company):
        if company.logo:
            return mark_safe(f'<img src="{company.logo.url}" width="100" height="100" />')
        return 'No logo'
    logo_preview.short_description = 'Logo'

class JobAdmin(admin.ModelAdmin):
    form = JobForm
    list_display = ('id', 'title', 'company', 'job_type', 'deadline', 'is_active')
    search_fields = ['title', 'description']
    list_filter = ['job_type', 'is_active', 'category']


class ApplicationAdmin(admin.ModelAdmin):
    list_display = ('id', 'candidate', 'job', 'status', 'created_at')
    search_fields = ['candidate__username', 'job__title']
    list_filter = ['status']


class CandidateProfileAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'gender')
    search_fields = ['user__username']
    list_filter = ['gender']


class EmployerProfileAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'company', 'position')
    search_fields = ['user__username', 'company__name']

class MyAdminSite(admin.AdminSite):
    site_header = 'Job Board Management'

    def get_urls(self):
        return [
            path('job-stats/', self.job_stats),
            path('application-stats/', self.application_stats),
        ] + super().get_urls()

    def job_stats(self, request):

        stats = JobCategory.objects.annotate(
            total_jobs=Count('jobs')
        ).values('name', 'total_jobs')
        return TemplateResponse(request, 'admin/job_stats.html', {'stats': stats})

    def application_stats(self, request):

        stats = Application.objects.values('status').annotate(
            total=Count('id')
        )
        return TemplateResponse(request, 'admin/application_stats.html', {'stats': stats})

admin_site = MyAdminSite()

admin_site.register(User, UserAdmin)
admin_site.register(Company, CompanyAdmin)
admin_site.register(JobCategory)
admin_site.register(Skill)
admin_site.register(Job, JobAdmin)
admin_site.register(Application, ApplicationAdmin)
admin_site.register(CandidateProfile, CandidateProfileAdmin)
admin_site.register(EmployerProfile, EmployerProfileAdmin)