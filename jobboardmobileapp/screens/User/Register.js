import { useState } from "react";
import { ScrollView, View, TouchableOpacity, Alert } from "react-native";
import { Button, HelperText, TextInput, Text, SegmentedButtons, Divider } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";

import Apis, { endpoints } from "../../configs/Apis";
import styles from "./Styles";

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID_EXPO    = "319877551032-8tc956k29ktdj6etpglibi59u7g36bhf.apps.googleusercontent.com";
const GOOGLE_CLIENT_ID_ANDROID = "319877551032-6vq1o6m1l96tfnuf6gtbei374vcuf3re.apps.googleusercontent.com";
const GOOGLE_CLIENT_ID_IOS     = "319877551032-tfn7kvqobte0cm5eifui1pm29t5h0hgf.apps.googleusercontent.com";

const TEXT_FIELDS = [
    { field: "username", label: "Tên đăng nhập", icon: "account", keyboard: "default"       },
    { field: "email",    label: "Email",          icon: "email",   keyboard: "email-address"  },
    { field: "phone",    label: "Số điện thoại",  icon: "phone",   keyboard: "phone-pad"      },
];

const Register = () => {
    const [user, setUser] = useState({
        username: "", email: "", password: "", confirm_password: "", phone: "", role: "candidate",
    });
    const [err, setErr]                   = useState("");
    const [loading, setLoading]           = useState(false);
    const [showPass, setShowPass]         = useState(false);
    const [showConfirm, setShowConfirm]   = useState(false);

    const nav = useNavigation();

    // ── Google Auth ──────────────────────────────────────────────────────────
    const [request, response, promptAsync] = Google.useAuthRequest({
        clientId:        GOOGLE_CLIENT_ID_EXPO,
        androidClientId: GOOGLE_CLIENT_ID_ANDROID,
        iosClientId:     GOOGLE_CLIENT_ID_IOS,
        scopes:          ["profile", "email"],
    });

    useState(() => {
        if (response?.type === "success")
            handleGoogleRegister(response.authentication.accessToken);
    }, [response]);

    const handleGoogleRegister = async (googleAccessToken) => {
        setLoading(true);
        setErr("");
        try {
            await Apis.post(endpoints["google_register"], {
                google_token: googleAccessToken,
                role:         user.role,
            });
            Alert.alert(
                "Thành công!",
                user.role === "employer"
                    ? "Tài khoản Nhà tuyển dụng đang chờ Admin xét duyệt."
                    : "Tài khoản đã được tạo. Bạn có thể đăng nhập ngay.",
                [{ text: "Đăng nhập", onPress: () => nav.navigate("Login") }]
            );
        } catch (ex) {
            setErr(parseError(ex) || "Đăng ký thất bại. Vui lòng thử lại!");
            console.error("Google Register Error:", ex?.response?.data ?? ex);
        } finally {
            setLoading(false);
        }
    };

    // ── Form thường ──────────────────────────────────────────────────────────
    const updateUser  = (field, value) => setUser(prev => ({ ...prev, [field]: value }));
    const parseError  = (ex) => {
        const data = ex?.response?.data;
        if (!data) return "Không thể kết nối máy chủ. Vui lòng thử lại!";
        const firstKey = Object.keys(data)[0];
        return Array.isArray(data[firstKey]) ? data[firstKey][0] : data[firstKey];
    };

    const validate = () => {
        if (!user.username || !user.email || !user.password || !user.confirm_password)
            return setErr("Vui lòng nhập đầy đủ thông tin bắt buộc!"), false;
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email))
            return setErr("Email không hợp lệ!"), false;
        if (user.password.length < 8)
            return setErr("Mật khẩu phải có ít nhất 8 ký tự!"), false;
        if (user.password !== user.confirm_password)
            return setErr("Mật khẩu không khớp!"), false;
        return true;
    };

    const handleRegister = async () => {
        setErr("");
        if (!validate()) return;
        setLoading(true);
        try {
            await Apis.post(endpoints["register"], {
                username:         user.username,
                email:            user.email,
                phone:            user.phone,
                password:         user.password,
                confirm_password: user.confirm_password,
                role:             user.role,
            });
            Alert.alert(
                "Đăng ký thành công!",
                user.role === "employer"
                    ? "Tài khoản Nhà tuyển dụng đang chờ Admin xét duyệt."
                    : "Bạn có thể đăng nhập ngay bây giờ.",
                [{ text: "Đăng nhập", onPress: () => nav.navigate("Login") }]
            );
        } catch (ex) {
            setErr(parseError(ex));
            console.error("Register Error:", ex?.response?.data ?? ex);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>

                <View style={styles.headerContainer}>
                    <Text style={styles.title}>ĐĂNG KÝ</Text>
                </View>

                {/* Chọn vai trò */}
                <Text style={styles.roleLabel}>Bạn là</Text>
                <SegmentedButtons
                    value={user.role}
                    onValueChange={val => updateUser("role", val)}
                    style={styles.roleToggle}
                    buttons={[
                        {
                            value: "candidate", label: "Ứng viên", icon: "account-search",
                            checkedColor: "#3B5BDB",
                            style: user.role === "candidate" ? styles.roleActive : styles.roleInactive,
                        },
                        {
                            value: "employer", label: "Nhà tuyển dụng", icon: "domain",
                            checkedColor: "#3B5BDB",
                            style: user.role === "employer" ? styles.roleActive : styles.roleInactive,
                        },
                    ]}
                />
                {user.role === "employer" && (
                    <HelperText type="info" visible style={styles.employerHint}>
                        Tài khoản Nhà tuyển dụng cần được Admin xét duyệt trước khi sử dụng.
                    </HelperText>
                )}

                {/* Đăng ký bằng Google */}
                <Button
                    mode="outlined"
                    icon="google"
                    disabled={!request || loading}
                    onPress={() => promptAsync()}
                    style={styles.googleBtn}
                    textColor="#3B5BDB"
                    contentStyle={styles.googleBtnContent}
                >
                    Đăng ký bằng Google
                </Button>

                <View style={styles.dividerRow}>
                    <Divider style={styles.dividerLine} />
                    <Text style={styles.dividerText}>hoặc đăng ký thủ công</Text>
                    <Divider style={styles.dividerLine} />
                </View>

                {err ? <HelperText type="error" visible>{err}</HelperText> : null}

                {/* Text fields */}
                {TEXT_FIELDS.map(i => (
                    <TextInput
                        key={i.field}
                        label={i.label}
                        value={user[i.field]}
                        onChangeText={t => updateUser(i.field, t)}
                        style={styles.input}
                        right={<TextInput.Icon icon={i.icon} />}
                        mode="outlined"
                        outlineColor="#3B5BDB"
                        activeOutlineColor="#3B5BDB"
                        keyboardType={i.keyboard}
                        autoCapitalize="none"
                    />
                ))}

                {/* Password */}
                <TextInput
                    label="Mật khẩu"
                    value={user.password}
                    onChangeText={t => updateUser("password", t)}
                    style={styles.input}
                    secureTextEntry={!showPass}
                    right={
                        <TextInput.Icon
                            icon={showPass ? "eye-off" : "eye"}
                            onPress={() => setShowPass(p => !p)}
                        />
                    }
                    mode="outlined"
                    outlineColor="#3B5BDB"
                    activeOutlineColor="#3B5BDB"
                    autoCapitalize="none"
                />

                {/* Confirm Password */}
                <TextInput
                    label="Xác nhận mật khẩu"
                    value={user.confirm_password}
                    onChangeText={t => updateUser("confirm_password", t)}
                    style={styles.input}
                    secureTextEntry={!showConfirm}
                    right={
                        <TextInput.Icon
                            icon={showConfirm ? "eye-off" : "eye"}
                            onPress={() => setShowConfirm(p => !p)}
                        />
                    }
                    mode="outlined"
                    outlineColor="#3B5BDB"
                    activeOutlineColor="#3B5BDB"
                    autoCapitalize="none"
                />

                <Button
                    mode="contained"
                    loading={loading}
                    disabled={loading}
                    onPress={handleRegister}
                    style={styles.submitBtn}
                >
                    <Text style={styles.submitBtnText}>ĐĂNG KÝ</Text>
                </Button>

                <View style={styles.footer}>
                    <Text>Đã có tài khoản? </Text>
                    <TouchableOpacity onPress={() => nav.navigate("Login")}>
                        <Text style={styles.registerLink}>Đăng nhập</Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
};

export default Register;