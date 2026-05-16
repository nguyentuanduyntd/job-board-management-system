import React from 'react';
import { View, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons'; // Thêm dòng này

import AdminHome from '../screens/Admin/AdminDashboard';
import EmployerHome from '../screens/Employers/EmployersDashboard';
import JobDetail from '../screens/Job/JobDetail';
import Login from '../screens/User/Login';
import Register from '../screens/User/Register';
import Profile from '../screens/User/Profile';
import HomeScreen from '../screens/Home/Index';

import { useMyUser } from '../configs/Contexts';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Hàm hiển thị tạm thời
const PlaceholderScreen = (title) => () => (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>{title} - Đang phát triển</Text>
    </View>
);

//Stack dành cho Tài khoản (Profile, Login, Register)
function AccountStack() {
    const user = useMyUser(); // lấy thông tin của user

    return (
        <Stack.Navigator>
            {user ? (
                // Nếu ĐÃ đăng nhập: Chỉ có màn hình Profile
                <Stack.Screen name="Profile" component={Profile} options={{ headerShown: false }} />
            ) : (
                // Nếu CHƯA đăng nhập: Hiện Login và Register
                <>
                    <Stack.Screen name="Login" component={Login} options={{ title: 'Đăng nhập' }} />
                    <Stack.Screen name="Register" component={Register} options={{ title: 'Đăng ký tài khoản' }} />
                </>
            )}
        </Stack.Navigator>
    );
}

// Stack dành cho Trang chủ (Home + JobDetail)
function HomeStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="HomeScreen" component={HomeScreen} />
            <Stack.Screen name="JobDetail" component={JobDetail} options={{ headerShown: true, title: 'Chi tiết' }} />
        </Stack.Navigator>
    );
}


// Stack dành cho Employer
function EmployerStack() {
    return (
        <Stack.Navigator>
            <Stack.Screen name="EmployerHome" component={EmployerHome} options={{ title: 'Quản lý tuyển dụng' }} />
            <Stack.Screen name="JobDetail" component={JobDetail} />
        </Stack.Navigator>
    );
}

// Stack dành cho Admin
function AdminStack() {
    return (
        <Stack.Navigator>
            <Stack.Screen name="AdminHome" component={AdminHome} options={{ title: 'Bảng điều khiển Admin' }} />
        </Stack.Navigator>
    );
}

// Tab chính dành cho Candidate
function CandidateTab() {
    return (
        <Tab.Navigator screenOptions={({ route }) => ({
            tabBarIcon: ({ color, size }) => {
                const icons = {
                    'Trang chủ': 'home',
                    'Hồ sơ': 'document-text',
                    'Công cụ': 'construct',
                    'Chat': 'chatbubble',
                    'Tài khoản': 'person',
                };
                return <Ionicons name={icons[route.name]} size={size} color={color} />;
            },
            tabBarActiveTintColor: '#3B5BDB',
            tabBarInactiveTintColor: 'gray',
            headerShown: false,
        })}>
            <Tab.Screen name="Trang chủ" component={HomeStack} />
            <Tab.Screen name="Hồ sơ" component={PlaceholderScreen('Hồ sơ')} />
            <Tab.Screen name="Công cụ" component={PlaceholderScreen('Công cụ')} />
            <Tab.Screen name="Chat" component={PlaceholderScreen('Chat')} />
            <Tab.Screen name="Tài khoản" component={AccountStack} />
        </Tab.Navigator>
    );
}

// Tab chính dành cho Admin
function AdminTab() {
    return (
        <Tab.Navigator screenOptions={({ route }) => ({
             initialRouteName : "Thống kê",// để tab Thống kê được hiển thị đầu tiên khi vào AdminTab
            tabBarIcon: ({ color, size }) => {
                const icons = {
                    'Thống kê': 'stats-chart',
                    'Duyệt bài đăng': 'checkmark-done',
                    'Tài khoản': 'person',
                };
                return <Ionicons name={icons[route.name]} size={size} color={color} />;
            },
            tabBarActiveTintColor: '#3B5BDB',
            tabBarInactiveTintColor: 'gray',
            headerShown: false,
        })}>
            <Tab.Screen name="Thống kê" component={AdminStack} />
            <Tab.Screen name="Duyệt bài đăng" component={PlaceholderScreen('Duyệt bài đăng')} />
            <Tab.Screen name="Tài khoản" component={AccountStack} />
        </Tab.Navigator>
    );
}

// Tab chính dành cho Employer
function EmployerTab() {
    return (
        <Tab.Navigator screenOptions={({ route }) => ({
            initialRouteName: "Thống kê", // để tab Thống kê được hiển thị đầu tiên khi vào EmployerTab
            tabBarIcon: ({ color, size }) => {
                const icons = {
                    'Thống kê': 'stats-chart',
                    'Bài đăng': 'checkmark-done',
                    'Đơn ứng tuyển' : 'document-text',
                    'Tài khoản': 'person',
                };
                return <Ionicons name={icons[route.name]} size={size} color={color} />;
            },
            tabBarActiveTintColor: '#3B5BDB',
            tabBarInactiveTintColor: 'gray',
            headerShown: false,
        })}>
            <Tab.Screen name="Thống kê" component={EmployerStack} />
            <Tab.Screen name="Bài đăng" component={PlaceholderScreen('Bài đăng')} />
            <Tab.Screen name="Đơn ứng tuyển" component={PlaceholderScreen('Đơn ứng tuyển')} />  
            <Tab.Screen name="Tài khoản" component={AccountStack} />
        </Tab.Navigator>
    );
}

// HÀM CHÍNH ĐIỀU PHỐI
export default function MainNavigator() {
    const user = useMyUser();

    if (!user || user.role === 'candidate') {
        return <CandidateTab />;
    }

    if (user.role === 'employer') {
        return <EmployerTab />;
    }

    if (user.role === 'admin') {
        return <AdminTab />;
    }

    return <CandidateTab />;
}