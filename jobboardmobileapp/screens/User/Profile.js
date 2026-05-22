import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Modal, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { List, Divider, Avatar, Button, TextInput, HelperText } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMyUser, useMyDispatch } from '../../configs/Contexts';
import { useNavigation } from '@react-navigation/native';
import { authApi, endpoints } from '../../configs/Apis';
import styles from './Styles';
import { Ionicons } from '@expo/vector-icons';

// ─── Modal Chỉnh sửa hồ sơ ───────────────────────────────────────────────────
const EditProfileModal = ({ visible, onClose, user, dispatch }) => {
    const [form, setForm]       = useState({
        username: user?.username || '',
        email:    user?.email    || '',
        phone:    user?.phone    || '',
    });
    const [avatar, setAvatar]   = useState(null);
    const [loading, setLoading] = useState(false);
    const [err, setErr]         = useState('');

    const updateForm = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

    const pickAvatar = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') { Alert.alert('Cần quyền truy cập thư viện ảnh!'); return; }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true, aspect: [1, 1], quality: 0.8,
        });
        if (!result.canceled) setAvatar(result.assets[0]);
    };

    const handleSave = async () => {
        if (!form.username || !form.email) {
            setErr('Tên đăng nhập và email không được để trống!'); return;
        }
        setErr('');
        setLoading(true);
        try {
            const token    = await AsyncStorage.getItem('token');
            const formData = new FormData();
            formData.append('username', form.username);
            formData.append('email',    form.email);
            formData.append('phone',    form.phone);
            if (avatar) {
                formData.append('avatar', { uri: avatar.uri, name: 'avatar.jpg', type: 'image/jpeg' });
            }
            const res = await authApi(token).patch(endpoints['profile'], formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            dispatch({ type: 'login', payload: res.data });
            Alert.alert('Thành công', 'Hồ sơ đã được cập nhật!');
            onClose();
        } catch (ex) {
            const data = ex?.response?.data;
            const key  = data ? Object.keys(data)[0] : null;
            setErr(key ? (Array.isArray(data[key]) ? data[key][0] : data[key]) : 'Cập nhật thất bại!');
        } finally {
            setLoading(false);
        }
    };

    const avatarUri = avatar?.uri || user?.avatar_url;

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
            <SafeAreaView style={styles.container}>
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.headerContainer}>
                        <Text style={styles.title}>CHỈNH SỬA HỒ SƠ</Text>
                    </View>

                    {/* Avatar */}
                    <View style={{ alignItems: 'center', marginBottom: 24 }}>
                        <TouchableOpacity onPress={pickAvatar}>
                            <Avatar.Image
                                size={100}
                                source={{ uri: avatarUri || 'https://via.placeholder.com/100' }}
                                style={{ backgroundColor: '#ccc' }}
                            />
                            <View style={styles.avatarEditBadge}>
                                <Text style={styles.avatarEditText}>
                                    <Ionicons name="pencil" size={16} color="#6B7280" style={{ marginRight: 6 }} />
                                </Text>
                            </View>
                        </TouchableOpacity>
                        <Text style={{ color: '#3B5BDB', marginTop: 8, fontSize: 13 }}>Nhấn để đổi ảnh</Text>
                    </View>

                    {err ? <HelperText type="error" visible>{err}</HelperText> : null}

                    <TextInput label="Tên đăng nhập" value={form.username}
                        onChangeText={t => updateForm('username', t)}
                        style={styles.input} mode="outlined" autoCapitalize="none"
                        outlineColor="#3B5BDB" activeOutlineColor="#3B5BDB"
                        right={<TextInput.Icon icon="account" />}
                    />
                    <TextInput label="Email" value={form.email}
                        onChangeText={t => updateForm('email', t)}
                        style={styles.input} mode="outlined" autoCapitalize="none"
                        keyboardType="email-address" outlineColor="#3B5BDB" activeOutlineColor="#3B5BDB"
                        right={<TextInput.Icon icon="email" />}
                    />
                    <TextInput label="Số điện thoại" value={form.phone}
                        onChangeText={t => updateForm('phone', t)}
                        style={styles.input} mode="outlined" keyboardType="phone-pad"
                        outlineColor="#3B5BDB" activeOutlineColor="#3B5BDB"
                        right={<TextInput.Icon icon="phone" />}
                    />

                    <Button mode="contained" loading={loading} disabled={loading}
                        onPress={handleSave} style={styles.submitBtn}>
                        <Text style={styles.submitBtnText}>LƯU THAY ĐỔI</Text>
                    </Button>
                    <Button mode="text" onPress={onClose} textColor="#888">Hủy</Button>
                </ScrollView>
            </SafeAreaView>
        </Modal>
    );
};

// ─── Modal Đổi mật khẩu ──────────────────────────────────────────────────────
const ChangePasswordModal = ({ visible, onClose }) => {
    const [form, setForm] = useState({
        old_password: '', new_password: '', confirm_password: '',
    });
    const [show, setShow]       = useState({ old: false, new: false, confirm: false });
    const [loading, setLoading] = useState(false);
    const [err, setErr]         = useState('');

    const updateForm = (field, value) => setForm(prev => ({ ...prev, [field]: value }));
    const toggleShow = (field)        => setShow(prev => ({ ...prev, [field]: !prev[field] }));

    const handleChange = async () => {
        if (!form.old_password || !form.new_password || !form.confirm_password) {
            setErr('Vui lòng nhập đầy đủ thông tin!'); return;
        }
        if (form.new_password.length < 8) {
            setErr('Mật khẩu mới phải có ít nhất 8 ký tự!'); return;
        }
        if (form.new_password !== form.confirm_password) {
            setErr('Mật khẩu xác nhận không khớp!'); return;
        }
        setErr('');
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('token');
            await authApi(token).patch(endpoints['change-password'], {
                old_password:     form.old_password,
                new_password:     form.new_password,
                confirm_password: form.confirm_password,
            });
            Alert.alert('Thành công', 'Mật khẩu đã được thay đổi!');
            setForm({ old_password: '', new_password: '', confirm_password: '' });
            onClose();
        } catch (ex) {
            setErr(ex?.response?.data?.error || 'Đổi mật khẩu thất bại. Vui lòng thử lại!');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
            <SafeAreaView style={styles.container}>
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.headerContainer}>
                        <Text style={styles.title}>ĐỔI MẬT KHẨU</Text>
                    </View>

                    {err ? <HelperText type="error" visible>{err}</HelperText> : null}

                    {[
                        { field: 'old',     label: 'Mật khẩu hiện tại',       key: 'old_password'     },
                        { field: 'new',     label: 'Mật khẩu mới',            key: 'new_password'     },
                        { field: 'confirm', label: 'Xác nhận mật khẩu mới',   key: 'confirm_password' },
                    ].map(i => (
                        <TextInput key={i.field}
                            label={i.label} value={form[i.key]}
                            onChangeText={t => updateForm(i.key, t)}
                            style={styles.input} mode="outlined" autoCapitalize="none"
                            secureTextEntry={!show[i.field]}
                            outlineColor="#3B5BDB" activeOutlineColor="#3B5BDB"
                            right={
                                <TextInput.Icon
                                    icon={show[i.field] ? 'eye-off' : 'eye'}
                                    onPress={() => toggleShow(i.field)}
                                />
                            }
                        />
                    ))}

                    <Button mode="contained" loading={loading} disabled={loading}
                        onPress={handleChange} style={styles.submitBtn}>
                        <Text style={styles.submitBtnText}>ĐỔI MẬT KHẨU</Text>
                    </Button>
                    <Button mode="text" onPress={onClose} textColor="#888">Hủy</Button>
                </ScrollView>
            </SafeAreaView>
        </Modal>
    );
};

// ─── Profile Screen chính ─────────────────────────────────────────────────────
const Profile = () => {
    const user     = useMyUser();
    const dispatch = useMyDispatch();
    const nav      = useNavigation();

    const [showEdit,     setShowEdit]     = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleLogout = () => {
        Alert.alert('Xác nhận', 'Bạn có chắc chắn muốn đăng xuất?', [
            { text: 'Hủy', style: 'cancel' },
            {
                text: 'Đăng xuất',
                onPress: () => { dispatch({ type: 'logout' }); },
                style: 'destructive',
            },
        ]);
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                {/* Header */}
                <View style={styles.headerContainer}>
                    <Avatar.Image
                        size={120}
                        source={{ uri: user?.avatar_url || 'https://via.placeholder.com/120' }}
                        style={{ backgroundColor: '#ccc' }}
                    />
                    <Text style={styles.sectionTitle}>{user?.first_name} {user?.last_name}</Text>
                    <Text style={styles.subTitle}>@{user?.username}</Text>
                    <View style={styles.tag}>
                        <Text style={styles.tagText}>
                            {user?.role === 'employer' ? 'Nhà tuyển dụng' : 'Ứng viên'}
                        </Text>
                    </View>
                </View>

                <Divider />

                {/* Thông tin liên hệ */}
                <View style={styles.infoSection}>
                    <List.Section>
                        <List.Subheader>Thông tin liên hệ</List.Subheader>
                        <List.Item
                            title="Email"
                            description={user?.email || 'Chưa cập nhật'}
                            left={props => <List.Icon {...props} icon="email-outline" />}
                        />
                        <List.Item
                            title="Số điện thoại"
                            description={user?.phone || 'Chưa cập nhật'}
                            left={props => <List.Icon {...props} icon="phone-outline" />}
                        />
                    </List.Section>

                    <Divider />

                    {/* Cài đặt tài khoản */}
                    <List.Section>
                        <List.Subheader>Cài đặt tài khoản</List.Subheader>
                        <TouchableOpacity onPress={() => setShowEdit(true)}>
                            <List.Item
                                title="Chỉnh sửa hồ sơ"
                                left={props  => <List.Icon {...props} icon="account-edit-outline" />}
                                right={props => <List.Icon {...props} icon="chevron-right" />}
                            />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setShowPassword(true)}>
                            <List.Item
                                title="Đổi mật khẩu"
                                left={props  => <List.Icon {...props} icon="lock-reset" />}
                                right={props => <List.Icon {...props} icon="chevron-right" />}
                            />
                        </TouchableOpacity>
                    </List.Section>
                </View>

                {/* Đăng xuất */}
                <View style={{ padding: 20 }}>
                    <Button mode="outlined" onPress={handleLogout}
                        textColor="#fa5252" style={styles.logoutBtn}>
                        Đăng xuất
                    </Button>
                </View>
            </ScrollView>

            {/* Modals */}
            <EditProfileModal
                visible={showEdit}
                onClose={() => setShowEdit(false)}
                user={user}
                dispatch={dispatch}
            />
            <ChangePasswordModal
                visible={showPassword}
                onClose={() => setShowPassword(false)}
            />
        </SafeAreaView>
    );
};

export default Profile;