from django.urls import path, include
from rest_framework.routers import DefaultRouter
import oauth2_provider.views as oauth2_views
from . import views

router = DefaultRouter()
router.register('jobs', views.JobViewSet, basename='job')
router.register('applications', views.ApplicationViewSet, basename='application')
router.register('companies', views.CompanyViewSet, basename='company')

urlpatterns = [
    # Auth
    path('auth/register/', views.RegisterView.as_view()),
    #Lấy token
    path('auth/login/', oauth2_views.TokenView.as_view()),
    #Refresh token
    path('auth/token/refresh/', oauth2_views.TokenView.as_view()),
    #thu hồi token
    path('auth/revoke/', oauth2_views.RevokeTokenView.as_view()),
    path('auth/profile/', views.ProfileView.as_view()),

    # Profiles theo role
    path('candidate/profile/', views.CandidateProfileView.as_view()),
    path('employer/profile/', views.EmployerProfileView.as_view()),

    # Lookup
    path('categories/', views.JobCategoryListView.as_view()),
    path('skills/', views.SkillListView.as_view()),

    path('', include(router.urls)),
]