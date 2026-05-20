import axios from "axios";

export const BASE_URL = 'http://192.168.1.22:8000';

export const endpoints = {
    // Auth
    'register': '/auth/register/',
    'login' : '/auth/login/',
    'change-password' : '/auth/change-password',
    'refresh-token' : '/auth/token/refresh/',
    'revoke-token' : '/auth/revoke/',
    'profile' : '/auth/profile/',
    'google_login':    '/auth/google-login/',
    'google_register': '/auth/google-register/',
    // Profiles theo role
    'candidate-profile' : '/candidate/profile/',
    'employer-profile' : '/employer/profile/',

    //Lookup
    'categories' : '/categories/',
    'skills' : '/skills/',

    // Jobs
    'jobs' : '/jobs/',
    'job-detail': (id) => `/jobs/${id}/`,
    'job-applications': (id) => `/jobs/${id}/applications/`, // employer xem ứng viên của job
    'my-jobs': '/jobs/my-jobs/', // employer xem job của mình
    
    //Application
    'applications': '/applications/',
    'application-detail': (id) => `/applications/${id}/`,
    'application-update-status':(id) => `/applications/${id}/update-status/`,
    'application-add-note':     (id) => `/applications/${id}/add-note/`,

    // Companies
    'companies' : '/companies/',
    'company-detail' : (id) => `/companies/${id}/`,

     // Admin — employer management
    'admin-employers':         '/admin-api/employers/',
    'admin-employers-pending': '/admin-api/employers/pending/',
    'admin-employer-approve':  (id) => `/admin-api/employers/${id}/approve/`,
    'admin-employer-reject':   (id) => `/admin-api/employers/${id}/reject/`,
    
    'admin-jobs' : '/admin-api/jobs/',
    'admin-job-approve' : (id) => `/admin-api/jobs/${id}/approve/`,
    'admin-job-reject' : (id) => `/admin-api/jobs/${id}/reject/`,

    // Comparison
    'comparison' : '/comparison/',
    'comparison-detail': (id) => `/comparison/${id}/`,
    'comparison-suggest': '/comparison/suggest/',
    'comparison-add-job': (id) => `/comparison/${id}/add-job/`,
    'comparison-remove-job': (id) => `/comparison/${id}/remove-job/`,

    //Package
    'packages' : '/packages/',

    // Payment
    'payments' : '/payments/',
    'payment-detail' : (id) => `/payments/${id}/`,
    'create-payment-intent' : '/payments/create-payment-intent/',

    //Statistics
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