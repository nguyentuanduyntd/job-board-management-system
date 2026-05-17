import { useState, useEffect } from "react";
import { ScrollView, View, TouchableOpacity } from "react-native";
import { Button, HelperText, TextInput, Text, Divider } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

import Apis, { authApi, endpoints } from "../../configs/Apis";
import { useMyDispatch } from "../../configs/Contexts";
import styles from "./Styles";

const WEB_CLIENT_ID = "319877551032-8tc956k29ktdj6etpglibi59u7g36bhf.apps.googleusercontent.com";
const CLIENT_ID     = "gjsYTHm5CxV8q6hZPh9xmRw4LxuzvafNp2mLBDTO";
const CLIENT_SECRET = "KsABPiesYMIHB0sUsjiWyCvBVtjLVZaMkjqpq136lQXqjJF4ev2KxzeWSqRYL9bIeGvwJwr7SGiKs6XdEHjpbaIlGTdVrBxeabVkJUZPKJNTaYZ9u3EktNR41WbgdKCl";

const Login = () => {
    const [user, setUser]         = useState({ username: "", password: "" });
    const [err, setErr]           = useState("");
    const [loading, setLoading]   = useState(false);
    const [showPass, setShowPass] = useState(false);

    const nav      = useNavigation();
    const dispatch = useMyDispatch();

    useEffect(() => {
        GoogleSignin.configure({
            webClientId: WEB_CLIENT_ID,
            offlineAccess: true,
        });
    }, []);

    const updateUser = (field, value) => setUser(prev => ({ ...prev, [field]: value }));

    const fetchProfile = async (token) => {
        const u = await authApi(token).get(endpoints["profile"]);
        dispatch({ type: "login", payload: u.data });
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        setErr("");
        try {
            await GoogleSignin.hasPlayServices();
            const userInfo = await GoogleSignin.signIn();
            const idToken  = userInfo.data?.idToken || userInfo.idToken;

            if (!idToken) {
                setErr("Không lấy được mã xác thực từ Google.");
                return;
            }

            const res = await Apis.post(endpoints["google_login"], { google_token: idToken });
            await AsyncStorage.setItem("token", res.data.access_token);
            await fetchProfile(res.data.access_token);
        } catch (error) {
            if (error.code === statusCodes.SIGN_IN_CANCELLED) return;
            if (error.code === statusCodes.IN_PROGRESS)
                setErr("Đang xử lý đăng nhập...");
            else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE)
                setErr("Thiết bị không hỗ trợ Google Play Services.");
            else
                setErr("Đăng nhập Google thất bại. Vui lòng thử lại!");
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async () => {
        if (!user.username || !user.password) {
            setErr("Vui lòng nhập đầy đủ thông tin!");
            return;
        }
        setErr("");
        setLoading(true);
        try {
            const formBody = Object.keys({
                username:      user.username,
                password:      user.password,
                client_id:     CLIENT_ID,
                client_secret: CLIENT_SECRET,
                grant_type:    "password",
            }).map(k => `${encodeURIComponent(k)}=${encodeURIComponent({ username: user.username, password: user.password, client_id: CLIENT_ID, client_secret: CLIENT_SECRET, grant_type: "password" }[k])}`)
              .join("&");

            const res = await Apis.post(endpoints["login"], formBody, {
                headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
            });

            await AsyncStorage.setItem("token", res.data.access_token);
            await fetchProfile(res.data.access_token);
        } catch {
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

                <View style={styles.dividerRow}>
                    <Divider style={styles.dividerLine} />
                    <Text style={styles.dividerText}>hoặc</Text>
                    <Divider style={styles.dividerLine} />
                </View>

                <Button
                    mode="outlined"
                    icon="google"
                    disabled={loading}
                    onPress={handleGoogleLogin}
                    style={styles.googleBtn}
                    textColor="#3B5BDB"
                    contentStyle={styles.googleBtnContent}
                >
                    Đăng nhập bằng Google
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