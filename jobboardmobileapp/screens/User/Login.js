import { useState } from "react";
import { ScrollView, View, TouchableOpacity, Alert } from "react-native";
import { Button, HelperText, TextInput, Text } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";

import Apis, { authApi, endpoints } from "../../configs/Apis";
import { useMyDispatch } from "../../configs/Contexts";
import styles from "./Styles";

const CLIENT_ID     = "Kt5xTc3dBwaB8x3u7QagVKIpheeQlKlLF9JpD5op";
const CLIENT_SECRET = "KmAPyd56bJnDvGamxRWCr3tVkptRx9mgPz3ac13Jpchtyhsg9vi3H0rLe9wzQfcruELQGMSvUrgdOZPqgXBeJl58IDqfNbWg7DhGeUrkIgyGZ83ef0MyeOrL6D4X9R1R";

const Login = () => {
    const [user, setUser]         = useState({ username: "", password: "" });
    const [err, setErr]           = useState("");
    const [loading, setLoading]   = useState(false);
    const [showPass, setShowPass] = useState(false);

    const nav      = useNavigation();
    const dispatch = useMyDispatch();

    const updateUser = (field, value) => setUser(prev => ({ ...prev, [field]: value }));

    const fetchProfile = async (token) => {
        const u = await authApi(token).get(endpoints["profile"]);
        dispatch({ type: "login", payload: { ...u.data, token } });
        return u.data;
    };

    const handleLogin = async () => {
        if (!user.username || !user.password) {
            setErr("Vui lòng nhập đầy đủ thông tin!");
            return;
        }
        setErr("");
        setLoading(true);

        try {
            const params = {
                username:      user.username,
                password:      user.password,
                client_id:     CLIENT_ID,
                client_secret: CLIENT_SECRET,
                grant_type:    "password",
            };
            const formBody = Object.keys(params)
                .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
                .join("&");

            const res = await Apis.post(endpoints["login"], formBody, {
                headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
            });

            // 1. Lưu token vào bộ nhớ máy để các API sau này bóc tách sử dụng
            await AsyncStorage.setItem("token", res.data.access_token);
            
            // 2. Lấy dữ liệu Profile chi tiết từ Backend
            const userData = await fetchProfile(res.data.access_token);

            // 3. ✅ ĐÃ SỬA: Đẩy thông tin userData vào Context toàn cục 
            // Bạn hãy đổi dòng dưới đây theo đúng hàm cập nhật Context trong dự án của bạn 
            // (Ví dụ: loginUser(userData) hoặc dispatch({ type: 'login', payload: userData }))
            dispatch({ type: "login", payload: userData }); 

            // ✅ XOÁ BỎ TOÀN BỘ CỤM ĐIỀU HƯỚNG THEO ROLE (nav.navigate) Ở ĐÂY.
            // Hệ thống MainNavigator sẽ tự đọc 'user.role' mới và chuyển đổi giao diện mượt mà!

        } catch (ex) {
            const data = ex?.response?.data;
            if (
                data?.error === "invalid_grant" &&
                data?.error_description?.toLowerCase().includes("inactive")
            ) {
                Alert.alert(
                    "Tài khoản chưa được kích hoạt",
                    "Tài khoản Nhà tuyển dụng của bạn đang chờ Admin xét duyệt.\nVui lòng thử lại sau khi được phê duyệt.",
                    [{ text: "Đã hiểu" }]
                );
                return;
            }

            // Sai username / password hoặc lỗi khác
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

                {err ? <HelperText type="error" visible>{err}</HelperText> : null}

                <TextInput
                    label="Tên đăng nhập"
                    value={user.username}
                    onChangeText={t => updateUser("username", t)}
                    style={styles.input}
                    mode="outlined"
                    autoCapitalize="none"
                    outlineColor="#3B5BDB"
                    activeOutlineColor="#3B5BDB"
                    right={<TextInput.Icon icon="account" />}
                />

                <TextInput
                    label="Mật khẩu"
                    value={user.password}
                    onChangeText={t => updateUser("password", t)}
                    style={styles.input}
                    mode="outlined"
                    autoCapitalize="none"
                    secureTextEntry={!showPass}
                    outlineColor="#3B5BDB"
                    activeOutlineColor="#3B5BDB"
                    right={
                        <TextInput.Icon
                            icon={showPass ? "eye-off" : "eye"}
                            onPress={() => setShowPass(p => !p)}
                        />
                    }
                />

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