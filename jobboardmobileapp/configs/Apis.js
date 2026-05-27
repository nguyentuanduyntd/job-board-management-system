import axios from "axios";

export const BASE_URL = 'http://192.168.1.32:8000';

export const endpoints = {      
    'register': '/auth/register/',
    'login' : '/auth/login/',
    'change-password' : '/auth/change-password/',
    'refresh-token' : '/auth/token/refresh/',
    'revoke-token' : '/auth/revoke/',
    'profile' : '/auth/profile/',
    'google_login':    '/auth/google-login/',
    'google_register': '/auth/google-register/',
    
    'candidate-profile' : '/candidate/profile/',
    'employer-profile' : '/employer/profile/',

    'categories' : '/categories/',
    'skills' : '/skills/',

    'jobs' : '/jobs/',
    'job-detail': (id) => `/jobs/${id}/`,
    'job-applications': (id) => `/jobs/${id}/applications/`, 
    'my-jobs': '/jobs/my-jobs/', 
    
    'applications': '/applications/',
    'application-detail': (id) => `/applications/${id}/`,
    'application-update-status':(id) => `/applications/${id}/update-status/`,
    'application-add-note':     (id) => `/applications/${id}/add-note/`,
    
    'applications-accepted': '/applications/accepted/',
    'application-schedule-interview': (id) => `/applications/${id}/schedule-interview/`,

    'companies' : '/companies/',
    'my-companies' : '/companies/my-companies/',
    'company-detail' : (id) => `/companies/${id}/`,

    'admin-employers':         '/admin-api/employers/',
    'admin-employers-pending': '/admin-api/employers/pending/',
    'admin-employer-approve':  (id) => `/admin-api/employers/${id}/approve/`,
    'admin-employer-reject':   (id) => `/admin-api/employers/${id}/reject/`,
    
    'admin-jobs' : '/admin-api/jobs/',
    'admin-job-approve' : (id) => `/admin-api/jobs/${id}/approve/`,
    'admin-job-reject' : (id) => `/admin-api/jobs/${id}/reject/`,

    'comparison' : '/comparison/',
    'comparison-detail': (id) => `/comparison/${id}/`,
    'comparison-suggest': '/comparison/suggest/',
    'comparison-add-job': (id) => `/comparison/${id}/add-job/`,
    'comparison-remove-job': (id) => `/comparison/${id}/remove-job/`,

    'packages' : '/packages/',

    'payments' : '/payments/',
    'payment-detail' : (id) => `/payments/${id}/`,
    'create-payment-intent' : '/payments/create-payment-intent/',

    'admin-statistics' : '/statistics/admin/admin-dashboard/',
    'employer-statistics' : '/statistics/employer/employer-dashboard/',
};

export const authApi = (token) => axios.create({
    baseURL : BASE_URL,
    headers: {
        'Authorization': `Bearer ${token}`
    }
});

export default axios.create({
    baseURL: BASE_URL
})