import React from 'react';
import { View, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import AdminHome from '../screens/Admin/AdminDashboard';
import AdminUpdateStatusJob from '../screens/Admin/AdminUpdateStatusJob'; 
import EmployerHome from '../screens/Employers/EmployersDashboard';
import JobDetail from '../screens/Job/JobDetail';
import Login from '../screens/User/Login';
import Register from '../screens/User/Register';
import Profile from '../screens/User/Profile';
import HomeScreen from '../screens/Home/Index';
import { useMyUser } from '../configs/Contexts';
import JobManagement from '../screens/Employers/JobManagement';
import EmployerApplication from '../screens/Employers/EmployerApplications';
import CompanyDetail from '../screens/Companies/CompanyDetail';
import CompaniesList from '../screens/Companies/CompaniesList';
import HistoryApplications from '../screens/Candidate/HistoryApplications';
import AdminUpdateStatusEmployer from '../screens/Admin/AdminUpdateStatusEmployer';
import CompanyInfo from '../screens/Employers/CompanyInfo';
import InterviewManagement from '../screens/Employers/InterviewManagement'; 

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const PlaceholderScreen = (title) => () => (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>{title} - Đang phát triển</Text>
    </View>
);

function AccountStack() {
    const user = useMyUser();
    return (
        <Stack.Navigator>
            {user ? (
                <Stack.Screen name="Profile" component={Profile} options={{ headerShown: false }} />
            ) : (
                <>
                    <Stack.Screen name="Login" component={Login} options={{ title: 'Đăng nhập' }} />
                    <Stack.Screen name="Register" component={Register} options={{ title: 'Đăng ký tài khoản' }} />
                </>
            )}
        </Stack.Navigator>
    );
}

function HomeStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="HomeScreen" component={HomeScreen} />
            <Stack.Screen name="JobDetail" component={JobDetail} options={{ headerShown: true, title: 'Chi tiết' }} />
            <Stack.Screen name="CompaniesList" component={CompaniesList} options={{ title: 'Tất cả công ty' }} />
            <Stack.Screen name="CompanyDetail" component={CompanyDetail} />
        </Stack.Navigator>
    );
}

function HistoryStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="HistoryApplications" component={HistoryApplications} />
            <Stack.Screen name="JobDetail" component={JobDetail} options={{ headerShown: true, title: 'Chi tiết việc làm' }} />
        </Stack.Navigator>
    );
}

function CompanyInfoStack(){
    return (
        <Stack.Navigator>
            <Stack.Screen name="CompanyInfo" component={CompanyInfo} options={{ headerShown: false }} />
        </Stack.Navigator>
    );
}

function EmployerStack() {
    return (
        <Stack.Navigator>
            <Stack.Screen name="EmployerHome" component={EmployerHome} options={{ title: 'Quản lý tuyển dụng' }} />
            <Stack.Screen name="JobManagement" component={JobManagement} options={{ headerShown: false }} />
            <Stack.Screen name="JobDetail" component={JobDetail} />
        </Stack.Navigator>
    );
}

// Bọc InterviewManagement vào một Stack để giữ cấu trúc điều hướng chuẩn
function InterviewStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="InterviewManagementScreen" component={InterviewManagement} />
        </Stack.Navigator>
    );
}

function AdminStack() {
    return (
        <Stack.Navigator>
            <Stack.Screen name="AdminHome" component={AdminHome} options={{ title: 'Bảng điều khiển Admin' }} />
        </Stack.Navigator>
    );
}

function AdminApprovalStack() {
    return (
        <Stack.Navigator>
            <Stack.Screen name="AdminUpdateStatusJob" component={AdminUpdateStatusJob} options={{ headerShown: false }} />
        </Stack.Navigator>
    );
}

function AdminEmployerApprovalStack() {
    return (
        <Stack.Navigator>
            <Stack.Screen name="AdminUpdateStatusEmployer" component={AdminUpdateStatusEmployer} options={{ headerShown: false }} />
        </Stack.Navigator>
    );
}

// ─── Tab Candidate ────────────────────────────────────────────────────────────
function CandidateTab() {
    const user = useMyUser();
    return (
        <Tab.Navigator screenOptions={({ route }) => ({
            tabBarIcon: ({ color, size }) => {
                const icons = {
                    'Trang chủ': 'home',
                    'Tài khoản': 'person',
                    ...(user && {'Lịch sử': 'time-outline'}),
                };
                return <Ionicons name={icons[route.name]} size={size} color={color} />;
            },
            tabBarActiveTintColor: '#3B5BDB',
            tabBarInactiveTintColor: 'gray',
            headerShown: false,
        })}>
            <Tab.Screen name="Trang chủ" component={HomeStack} />
            {user && <Tab.Screen name="Lịch sử" component={HistoryStack} />}
            <Tab.Screen name="Tài khoản" component={AccountStack} />
        </Tab.Navigator>
    );
}

// ─── Tab Admin ────────────────────────────────────────────────────────────────
function AdminTab() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ color, size }) => {
                    const icons = {
                        'Thống kê':      'stats-chart',
                        'Duyệt bài':     'checkmark-circle',
                        'Duyệt Cty':     'people-circle',
                        'Tài khoản':     'person',
                    };
                    return <Ionicons name={icons[route.name]} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#3B5BDB',
                tabBarInactiveTintColor: 'gray',
                headerShown: false,
            })}
        >
            <Tab.Screen name="Thống kê" component={AdminStack} />
            <Tab.Screen name="Duyệt bài" component={AdminApprovalStack} options={{ tabBarLabel: 'Duyệt bài' }} />
            <Tab.Screen name="Duyệt Cty" component={AdminEmployerApprovalStack} options={{ tabBarLabel: 'Duyệt Cty' }} />
            <Tab.Screen name="Tài khoản" component={AccountStack} />
        </Tab.Navigator>
    );
}

// ─── Tab Employer ─────────────────────────────────────────────────────────────
function EmployerTab() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ color, size }) => {
                    const icons = {
                        'Thống kê': 'stats-chart',
                        'Bài đăng': 'checkmark-done',
                        'Đơn ứng tuyển': 'document-text',
                        'Phỏng vấn': 'calendar', // Icon cho mục lịch phỏng vấn mới
                        'Công ty' : 'business',
                        'Tài khoản': 'person',
                    };
                    return <Ionicons name={icons[route.name]} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#3B5BDB',
                tabBarInactiveTintColor: 'gray',
                headerShown: false,
            })}
        >
            <Tab.Screen name="Thống kê" component={EmployerStack} />
            <Tab.Screen name="Bài đăng" component={JobManagement} />
            <Tab.Screen name="Đơn ứng tuyển" component={EmployerApplication} />
            
            {/* THÊM TAB LỊCH PHỎNG VẤN TRỰC TIẾP TẠI ĐÂY */}
            <Tab.Screen name="Phỏng vấn" component={InterviewStack} />
            
            <Tab.Screen name="Công ty" component={CompanyInfoStack}/>
            <Tab.Screen name="Tài khoản" component={AccountStack} />
        </Tab.Navigator>
    );
}

// ─── Main Navigator ───────────────────────────────────────────────────────────
export default function MainNavigator() {
    const user = useMyUser();
    if (!user || user.role === 'candidate') return <CandidateTab />;
    if (user.role === 'employer')           return <EmployerTab />;
    if (user.role === 'admin')              return <AdminTab />;
    return <CandidateTab />;
}