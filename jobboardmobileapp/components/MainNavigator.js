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

function AdminStack() {
    return (
        <Stack.Navigator>
            <Stack.Screen name="AdminHome" component={AdminHome} options={{ title: 'Bảng điều khiển Admin' }} />
        </Stack.Navigator>
    );
}

// ─── AdminJobApproval Stack ──────────────────────────────────────────────────
// Bọc trong Stack để sau này có thể thêm màn hình con (chi tiết, lịch sử...)
function AdminApprovalStack() {
    return (
        <Stack.Navigator>
            <Stack.Screen
                name="AdminUpdateStatusJob"
                component={AdminUpdateStatusJob}
                options={{ headerShown: false }}
            />
        </Stack.Navigator>
    );
}

// ─── Tab Candidate ────────────────────────────────────────────────────────────
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

// ─── Tab Admin ────────────────────────────────────────────────────────────────
function AdminTab() {
    return (
        <Tab.Navigator
            initialRouteName="Thống kê"
            screenOptions={({ route }) => ({
                tabBarIcon: ({ color, size }) => {
                    const icons = {
                        'Thống kê':      'stats-chart',
                        'Duyệt bài':     'checkmark-circle',
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

            {/* Tab duyệt bài — hiện badge số bài chờ duyệt nếu muốn thì có thể
                dùng tabBarBadge từ context/state global sau này */}
            <Tab.Screen
                name="Duyệt bài"
                component={AdminApprovalStack}
                options={{
                    tabBarLabel: 'Duyệt bài',
                    // Uncomment dòng dưới để hiện số badge khi có context global:
                    // tabBarBadge: pendingCount || null,
                }}
            />

            <Tab.Screen name="Tài khoản" component={AccountStack} />
        </Tab.Navigator>
    );
}

// ─── Tab Employer ─────────────────────────────────────────────────────────────
function EmployerTab() {
    return (
        <Tab.Navigator
            initialRouteName="Thống kê"
            screenOptions={({ route }) => ({
                tabBarIcon: ({ color, size }) => {
                    const icons = {
                        'Thống kê':       'stats-chart',
                        'Bài đăng':       'checkmark-done',
                        'Đơn ứng tuyển':  'document-text',
                        'Tài khoản':      'person',
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
            <Tab.Screen name="Đơn ứng tuyển" component={PlaceholderScreen('Đơn ứng tuyển')} />
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