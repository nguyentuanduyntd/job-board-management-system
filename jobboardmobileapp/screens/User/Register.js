import { useState } from "react";
import { ScrollView, View, TouchableOpacity, Alert } from "react-native";
import { Button, HelperText, TextInput, Text, SegmentedButtons } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";

import Apis, { endpoints } from "../../configs/Apis";
import styles from './Styles';

const Register = () => {
    const [user, setUser] = useState({
        username: "",
        email: "",
        password: "",
        confirm_password: "",
        phone: "",
        role: "candidate",   // mặc định là ứng viên
    });
    const [err, setErr] = useState("");
    const [loading, setLoading] = useState(false);

    const nav = useNavigation();

    const fields = [
        { field: "username",         label: "Tên đăng nhập",      icon: "account",        secure: false },
        { field: "email",            label: "Email",               icon: "email",          secure: false },
        { field: "phone",            label: "Số điện thoại",       icon: "phone",          secure: false },
        { field: "password",         label: "Mật khẩu",           icon: "eye",            secure: true  },
        { field: "confirm_password", label: "Xác nhận mật khẩu",  icon: "eye-off",        secure: true  },
    ];

    const updateUser = (field, value) => {
        setUser(prev => ({ ...prev, [field]: value }));
    };

    // Validate phía client trước khi gọi API
    const validate = () => {
        if (!user.username || !user.email || !user.password || !user.confirm_password) {
            setErr("Vui lòng nhập đầy đủ thông tin bắt buộc!");
            return false;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(user.email)) {
            setErr("Email không hợp lệ!");
            return false;
        }
        if (user.password.length < 8) {
            setErr("Mật khẩu phải có ít nhất 8 ký tự!");
            return false;
        }
        if (user.password !== user.confirm_password) {
            setErr("Mật khẩu không khớp!");
            return false;
        }
        return true;
    };

    const handleRegister = async () => {
        setErr("");
        if (!validate()) return;

        setLoading(true);
        try {
            // POST /api/auth/register/  — Content-Type: application/json
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
            // Django REST trả lỗi dạng { field: ["message"] } hoặc { detail: "..." }
            const data = ex?.response?.data;
            if (data) {
                const firstKey = Object.keys(data)[0];
                const msg = Array.isArray(data[firstKey]) ? data[firstKey][0] : data[firstKey];
                setErr(msg || "Đăng ký thất bại. Vui lòng thử lại!");
            } else {
                setErr("Không thể kết nối máy chủ. Vui lòng thử lại!");
            }
            console.error("Register Error:", ex?.response?.data ?? ex);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>

                {/* Tiêu đề */}
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
                            value: "candidate",
                            label: "Ứng viên",
                            icon: "account-search",
                            checkedColor: "#3B5BDB",
                            style: user.role === "candidate"
                                ? styles.roleActive
                                : styles.roleInactive,
                        },
                        {
                            value: "employer",
                            label: "Nhà tuyển dụng",
                            icon: "domain",
                            checkedColor: "#3B5BDB",
                            style: user.role === "employer"
                                ? styles.roleActive
                                : styles.roleInactive,
                        },
                    ]}
                />

                {/* Hint riêng cho employer */}
                {user.role === "employer" && (
                    <HelperText type="info" visible style={styles.employerHint}>
                        Tài khoản Nhà tuyển dụng cần được Admin xét duyệt trước khi sử dụng.
                    </HelperText>
                )}

                {/* Lỗi */}
                {err ? <HelperText type="error" visible>{err}</HelperText> : null}

                {/* Các input */}
                {fields.map(i => (
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
                        keyboardType={
                            i.field === "email" ? "email-address"
                            : i.field === "phone" ? "phone-pad"
                            : "default"
                        }
                        autoCapitalize="none"
                    />
                ))}

                {/* Nút đăng ký */}
                <Button
                    mode="contained"
                    loading={loading}
                    disabled={loading}
                    onPress={handleRegister}
                    style={styles.submitBtn}
                >
                    <Text style={styles.submitBtnText}>ĐĂNG KÝ</Text>
                </Button>

                {/* Footer về Login */}
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