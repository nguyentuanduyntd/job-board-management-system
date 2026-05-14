import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '../screens/Home/Index';
import JobDetail from '../screens/Job/JobDetail';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Stack cho Home — để JobDetail không hiện tab bar
function HomeStack() {
    return (
        <Stack.Navigator>
            <Stack.Screen
                name="HomeScreen"
                component={HomeScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="JobDetail"
                component={JobDetail}
                options={{
                    title: 'Chi tiết việc làm',
                    headerStyle: { backgroundColor: '#fff' },
                    headerTintColor: '#3B5BDB',
                    headerTitleStyle: { fontWeight: 'bold' },
                }}
            />
        </Stack.Navigator>
    );
}

const PlaceholderScreen = (title) => () => (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>{title} - Đang phát triển</Text>
    </View>
);

export default function MainNavigator() {
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
            <Tab.Screen name="Tài khoản" component={PlaceholderScreen('Tài khoản')} />
        </Tab.Navigator>
    );
}