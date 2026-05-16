import axios from "axios";

export const BASE_URL = 'http://192.168.1.213:8000/';

export const endpoints = {
    // Auth
    'register': '/auth/register/',
    'login' : '/auth/login/',
    'refresh-token' : '/auth/token/refresh/',
    'revoke-token' : '/auth/revoke',
    'profile' : '/auth/profile/',

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
    'applications': '/applications',
    'application-detail': (id) => `/applications/${id}/`,
    'application-update-status':(id) => `/applications/${id}/update-status/`,
    'application-add-note':     (id) => `/applications/${id}/add-note/`,

    // Companies
    'companies' : '/companies/',
    'company-detail' : (id) => `/companies/${id}/`,

    // Admin
    'admin-employers': '/admin/employers/',
    'admin-employers-pending': '/admin/employers/pending/',
    'admin-employer-approve': (id) => `/admin/employers/${id}/approve/`,
    'admin-employer-reject': (id) => `/admin/employers/${id}/reject/`,

    // Comparison
    'comparison' : '/comparison/',
    'comparison-detail': (id) => `/comparison/${id}/`,
    'comparison-suggest': '/comparison/suggest/',
    'comparison-add-job': (id) => `/comparison/${id}/add-job/`,
    'comparison-remove-job': (id) => `/comparison/${id}/remove-job/`,

    // Payment
    'payments' : '/payments/',
    'payment-detail' : (id) => `/payments/${id}/`,

    //Statistics
    'admin-statistics' : '/statistics/admin/admin-dashboard',
    'employer-statistics' : '/statistics/employer/employer-dashboard',
};

export const authApi = (token) => axios.create({
    baseURL : BASE_URL,
    headers: {
        'Authorization': `bearer ${token}`
    }
});

export default axios.create({
    baseURL: BASE_URL
})