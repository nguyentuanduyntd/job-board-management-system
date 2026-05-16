import { useState } from "react";
import { ScrollView, View, Alert, TouchableOpacity } from "react-native";
import { Button, HelperText, TextInput, Text } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from "react-native-safe-area-context";

import Apis, { authApi, endpoints } from "../../configs/Apis";
import { useMyDispatch } from "../../configs/Contexts"; 
import styles from './Styles';

const Login = () => {
    const [user, setUser] = useState({
        "username": "",
        "password": ""
    });
    const [err, setErr] = useState("");
    const [loading, setLoading] = useState(false);
    
    const nav = useNavigation();
    const dispatch = useMyDispatch();

    const userInfo = [
        { field: 'username', label: 'Tên đăng nhập', icon: 'account', secure: false },
        { field: 'password', label: 'Mật khẩu', icon: 'eye', secure: true }
    ];

    const updateUser = (field, value) => {
        setUser(prev => ({ ...prev, [field]: value }));
    };

    const handleLogin = async () => {
        if (!user.username || !user.password) {
            setErr("Vui lòng nhập đầy đủ thông tin!");
            return;
        }

        setErr("");
        setLoading(true);

        try {
            const details = {
                'username': user.username,
                'password': user.password,
                'client_id': 'Y6rk4ssItGZDquOvfq1Q8evaiKOHTb',
                'client_secret': 'ZmzR0FPC8LXK3sJKsnufdidNWeKJ2f',
                'grant_type': 'password'
            };

            const formBody = Object.keys(details).map(key => 
                encodeURIComponent(key) + '=' + encodeURIComponent(details[key])
            ).join('&');

            let res = await Apis.post(endpoints['login'], formBody, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' }
            });

            await AsyncStorage.setItem('token', res.data.access_token);

            let u = await authApi(res.data.access_token).get(endpoints['profile']);
            const userData = u.data; // Đây là nơi chứa trường 'role'

            dispatch({
                "type": "login",
                "payload": userData
            });

            // Alert.alert("Thành công", "Đăng nhập thành công!");

        } catch (ex) {
            console.error("Login Error:", ex);
            setErr("Tên đăng nhập hoặc mật khẩu không chính xác!");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.headerContainer}>
                    <Text style={styles.title}>ĐĂNG NHẬP</Text>
                </View>

                {err ? <HelperText type="error" visible={true}>{err}</HelperText> : null}

                {userInfo.map(i => (
                    <TextInput
                        key={i.field}
                        label={i.label}
                        value={user[i.field]}
                        onChangeText={t => updateUser(i.field, t)}
                        style={styles.input}
                        secureTextEntry={i.secure}
                        right={<TextInput.Icon icon={i.icon} />}
                        mode="outlined"
                        outlineColor="#3B5BDB"
                        activeOutlineColor="#3B5BDB"
                    />
                ))}

                <Button
                    mode="contained"
                    loading={loading}
                    disabled={loading}
                    onPress={handleLogin}
                    style={styles.submitBtn}
                >
                    <Text style={styles.submitBtnText}>ĐĂNG NHẬP</Text>
                </Button>

                <View style={styles.footer}>
                    <Text>Chưa có tài khoản? </Text>
                    <TouchableOpacity onPress={() => nav.navigate("Register")}>
                        <Text style={styles.registerLink}>Đăng ký ngay</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default Login;