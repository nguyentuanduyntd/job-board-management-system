import { useState } from "react";
import { ScrollView, View, TouchableOpacity } from "react-native";
import { Button, HelperText, TextInput, Text, Divider } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";

import Apis, { authApi, endpoints } from "../../configs/Apis";
import { useMyDispatch } from "../../configs/Contexts";
import styles from "./Styles";

const CLIENT_ID     = "HaeHYPoxhSNu3RwkOeb2g163T28Gd1eTp9w2VY0k";
const CLIENT_SECRET = "1WlAa13P3spqN4hC3pYIxbbhD4BcVSrplb8HQmDIpQer8xjeVncUj77uQs3AjQUALc6TpRxgq2wGvEFt3CHmRLNJ47NSaWdReXfICFNaZNSqWTsKyPXxAsRETevVdvNY";

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
        dispatch({ type: "login", payload: u.data });
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