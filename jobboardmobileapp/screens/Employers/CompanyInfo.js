import React, { useState, useCallback, useEffect } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
    RefreshControl, Modal, Alert, TextInput, KeyboardAvoidingView,
    Platform, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { authApi, endpoints } from '../../configs/Apis';

// Nhúng file Styles dùng chung
import styles, { Colors } from './Styles';

// ─── Company Form Modal ───────────────────────────────────────────────────────
const CompanyFormModal = ({ visible, company, onClose, onSaved }) => {
    const isEdit = !!company;
    const [form, setForm] = useState({ name: '', description: '', website: '', address: '' });
    const [logoUri, setLogoUri] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (visible) {
            if (isEdit) {
                setForm({
                    name: company.name || '',
                    description: company.description || '',
                    website: company.website || '',
                    address: company.address || '',
                });
                setLogoUri(company.logo_url || null);
            } else {
                setForm({ name: '', description: '', website: '', address: '' });
                setLogoUri(null);
            }
        }
    }, [visible, company]);

    const pickLogo = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Quyền truy cập', 'Cần quyền truy cập thư viện ảnh.');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true, aspect: [1, 1], quality: 0.8,
        });
        if (!result.canceled) setLogoUri(result.assets[0].uri);
    };

    const handleSave = async () => {
        if (!form.name.trim()) {
            Alert.alert('Thiếu thông tin', 'Tên công ty không được để trống.');
            return;
        }
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem('token');
            const api = authApi(token);

            const fd = new FormData();

            fd.append('name', form.name.trim());
            if (form.description.trim()) {
                fd.append('description', form.description.trim());
            }
            if (form.website.trim()) {
                fd.append('website', form.website.trim());
            }
            if (form.address.trim()) {
                fd.append('address', form.address.trim());
            }

            if (logoUri && logoUri.startsWith('file')) {
                const filename = logoUri.split('/').pop() || 'logo.jpg';
                const match = /\.(\w+)$/.exec(filename);
                const type = match ? `image/${match[1]}` : `image/jpeg`;

                fd.append('logo', {
                    uri: logoUri,
                    name: filename,
                    type: type
                });
            }

            let res;
            if (isEdit) {
                res = await api.patch(endpoints['company-detail'](company.id), fd, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
            } else {
                const currentUrl = endpoints['companies'] || '/companies/';
                res = await api.post(currentUrl, fd, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
            }
            onSaved(res.data);
            onClose();
        } catch (ex) {
            // Log ra để sau này nếu có lỗi khác mình dễ check
            console.log("LỖI TỪ BACKEND:", JSON.stringify(ex.response?.data));

            const msg = ex?.response?.data?.name?.[0]
                || ex?.response?.data?.website?.[0]  // Thêm dòng này để bắt lỗi website nếu user nhập sai định dạng link
                || ex?.response?.data?.detail
                || 'Không thể lưu thông tin công ty.';
            Alert.alert('Lỗi', msg);
        } finally {
            setLoading(false);
        }
        // } catch (ex) {
        //     const msg = ex?.response?.data?.name?.[0]
        //         || ex?.response?.data?.detail
        //         || 'Không thể lưu thông tin công ty.';
        //     Alert.alert('Lỗi', msg);
        // } finally {
        //     setLoading(false);
        // }
    };

    // Hàm render Field (Viết dạng function để KHÔNG BỊ MẤT FOCUS KHI GÕ)
    const renderField = (label, field, placeholder, multiline = false) => (
        <View style={styles.fieldWrap} key={field}>
            <Text style={styles.fieldLabel}>{label}</Text>
            <TextInput
                style={[styles.fieldInput, multiline && styles.fieldInputMulti]}
                placeholder={placeholder}
                placeholderTextColor={Colors.textMuted}
                value={form[field]}
                onChangeText={v => setForm(prev => ({ ...prev, [field]: v }))}
                multiline={multiline}
                numberOfLines={multiline ? 4 : 1}
                textAlignVertical={multiline ? 'top' : 'center'}
                autoCapitalize="none"
            />
        </View>
    );

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            {/* behavior={undefined} trên Android giúp form không bị bóp méo, 'padding' trên iOS */}
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                <View style={styles.formOverlay}>
                    <View style={styles.formCard}>
                        <View style={styles.handleBar} />

                        {/* Header */}
                        <View style={styles.formHeader}>
                            <Text style={styles.formTitle}>{isEdit ? 'Chỉnh sửa công ty' : 'Thêm thông tin công ty'}</Text>
                            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                                <Ionicons name="close" size={20} color={Colors.textSec} />
                            </TouchableOpacity>
                        </View>

                        {/* Bỏ style={{ flex: 1 }} ở ScrollView để form hiển thị đúng chiều cao */}
                        <ScrollView showsVerticalScrollIndicator={false}>
                            {/* Logo picker */}
                            <View style={styles.logoPicker}>
                                <TouchableOpacity style={styles.logoCircle} onPress={pickLogo}>
                                    {logoUri ? (
                                        <Image source={{ uri: logoUri }} style={styles.logoImg} />
                                    ) : (
                                        <View style={styles.logoPlaceholder}>
                                            <Ionicons name="camera-outline" size={28} color={Colors.accent} />
                                            <Text style={styles.logoPlaceholderText}>Tải logo</Text>
                                        </View>
                                    )}
                                    <View style={styles.logoEditBadge}>
                                        <Ionicons name="pencil" size={12} color="#fff" />
                                    </View>
                                </TouchableOpacity>
                            </View>

                            {/* Render Inputs */}
                            {renderField('Tên công ty *', 'name', 'VD: Tech Solutions JSC')}
                            {renderField('Địa chỉ', 'address', 'VD: 123 Nguyễn Huệ, Q.1, TP.HCM')}
                            {renderField('Website', 'website', 'https://example.com')}
                            {renderField('Mô tả công ty', 'description', 'Giới thiệu về công ty...', true)}

                            <View style={{ height: 24 }} />
                        </ScrollView>

                        {/* Actions */}
                        <View style={styles.formActions}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={loading}>
                                <Text style={styles.cancelBtnText}>Hủy</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.saveBtn, loading && { opacity: 0.6 }]}
                                onPress={handleSave}
                                disabled={loading}
                            >
                                {loading
                                    ? <ActivityIndicator size="small" color="#fff" />
                                    : <Text style={styles.saveBtnText}>{isEdit ? 'Lưu thay đổi' : 'Tạo công ty'}</Text>
                                }
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────
const DeleteModal = ({ visible, companyName, onConfirm, onCancel, loading }) => (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
        <View style={styles.overlay}>
            <View style={styles.deleteCard}>
                <View style={styles.deleteIconWrap}>
                    <Ionicons name="trash-outline" size={32} color={Colors.danger} />
                </View>
                <Text style={styles.deleteTitle}>Xóa công ty?</Text>
                <Text style={styles.deleteSub}>
                    Bạn có chắc muốn xóa <Text style={{ fontWeight: '700' }}>"{companyName}"</Text>?{'\n'}
                    Hành động này không thể hoàn tác.
                </Text>
                <View style={styles.deleteActions}>
                    <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} disabled={loading}>
                        <Text style={styles.cancelBtnText}>Hủy</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.deleteConfirmBtn, loading && { opacity: 0.6 }]}
                        onPress={onConfirm}
                        disabled={loading}
                    >
                        {loading
                            ? <ActivityIndicator size="small" color="#fff" />
                            : <Text style={styles.deleteConfirmBtnText}>Xóa</Text>
                        }
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    </Modal>
);

// ─── Info Row ─────────────────────────────────────────────────────────────────
const InfoRow = ({ icon, label, value }) => {
    if (!value) return null;
    return (
        <View style={styles.infoRow}>
            <View style={styles.infoIconWrap}>
                <Ionicons name={icon} size={16} color={Colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>{label}</Text>
                <Text style={styles.infoValue}>{value}</Text>
            </View>
        </View>
    );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function CompanyInfo() {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editTarget, setEditTarget] = useState(null);
    const [showDelete, setShowDelete] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);

    // ── Fetch my companies ────────────────────────────────────────────────────
    const fetchCompanies = useCallback(async (isRefresh = false) => {
        try {
            isRefresh ? setRefreshing(true) : setLoading(true);
            const token = await AsyncStorage.getItem('token');
            const res = await authApi(token).get(endpoints['my-companies']);
            const data = res.data;
            setCompanies(Array.isArray(data) ? data : data?.results || []);
        } catch (ex) {
            Alert.alert('Lỗi', 'Không thể tải thông tin công ty.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchCompanies(); }, [fetchCompanies]);

    // ── Saved callback (create or update) ────────────────────────────────────
    const handleSaved = useCallback((saved) => {
        setCompanies(prev => {
            const exists = prev.find(c => c.id === saved.id);
            return exists
                ? prev.map(c => c.id === saved.id ? saved : c)
                : [saved, ...prev];
        });
    }, []);

    // ── Delete ────────────────────────────────────────────────────────────────
    const handleDelete = useCallback(async () => {
        if (!deleteTarget) return;
        try {
            setDeleting(true);
            const token = await AsyncStorage.getItem('token');
            await authApi(token).delete(endpoints['company-detail'](deleteTarget.id));
            setCompanies(prev => prev.filter(c => c.id !== deleteTarget.id));
            setShowDelete(false);
            setDeleteTarget(null);
            Alert.alert('Đã xóa', `Công ty "${deleteTarget.name}" đã được xóa.`);
        } catch (ex) {
            const msg = ex?.response?.data?.detail || 'Không thể xóa công ty này.';
            Alert.alert('Lỗi', msg);
        } finally {
            setDeleting(false);
        }
    }, [deleteTarget]);

    // ── Empty state ───────────────────────────────────────────────────────────
    const EmptyState = () => (
        <View style={styles.empty}>
            <View style={styles.emptyIconWrap}>
                <Ionicons name="business-outline" size={52} color={Colors.accent} />
            </View>
            <Text style={styles.emptyTitle}>Chưa có thông tin công ty</Text>
            <Text style={styles.emptyDesc}>
                Thêm thông tin công ty để bắt đầu đăng tuyển dụng
            </Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => { setEditTarget(null); setShowForm(true); }}>
                <Ionicons name="add" size={18} color="#fff" />
                <Text style={styles.emptyBtnText}>Thêm công ty ngay</Text>
            </TouchableOpacity>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={Colors.accent} />
                <Text style={[styles.emptyDesc, { marginTop: 12 }]}>Đang tải thông tin...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.root}>
            {/* Header */}
            <View style={styles.pageHeader}>
                <View>
                    <Text style={styles.pageHeaderTitle}>Công ty của tôi</Text>
                    <Text style={styles.pageHeaderSub}>{companies.length} công ty đã đăng ký</Text>
                </View>
                <TouchableOpacity
                    style={styles.addBtn}
                    onPress={() => { setEditTarget(null); setShowForm(true); }}
                >
                    <Ionicons name="add" size={22} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* List */}
            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => fetchCompanies(true)}
                        tintColor={Colors.accent}
                    />
                }
            >
                {companies.length === 0
                    ? <EmptyState />
                    : companies.map(company => (
                        <View key={company.id} style={styles.card}>
                            {/* Card header */}
                            <View style={styles.cardTop}>
                                {company.logo_url ? (
                                    <Image source={{ uri: company.logo_url }} style={styles.cardLogo} />
                                ) : (
                                    <View style={styles.cardLogoPlaceholder}>
                                        <Text style={styles.cardLogoText}>
                                            {(company.name || '?')[0].toUpperCase()}
                                        </Text>
                                    </View>
                                )}
                                <View style={{ flex: 1, marginLeft: 12 }}>
                                    <Text style={styles.cardTitle} numberOfLines={1}>{company.name}</Text>
                                    {company.address ? (
                                        <Text style={styles.cardSub} numberOfLines={1}>
                                            📍 {company.address}
                                        </Text>
                                    ) : null}
                                </View>
                                {/* Actions */}
                                <View style={styles.cardActions}>
                                    <TouchableOpacity
                                        style={styles.editBtn}
                                        onPress={() => { setEditTarget(company); setShowForm(true); }}
                                    >
                                        <Ionicons name="create-outline" size={18} color={Colors.accent} />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.deleteBtn}
                                        onPress={() => { setDeleteTarget(company); setShowDelete(true); }}
                                    >
                                        <Ionicons name="trash-outline" size={18} color={Colors.danger} />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Info rows */}
                            <View style={styles.divider} />
                            <View style={styles.infoGrid}>
                                <InfoRow icon="mail-outline" label="Email" value={company.owner?.email} />
                                <InfoRow icon="globe-outline" label="Website" value={company.website} />
                                <InfoRow icon="location-outline" label="Địa chỉ" value={company.address} />
                            </View>

                            {/* Description */}
                            {company.description ? (
                                <View style={styles.descWrap}>
                                    <Text style={styles.descLabel}>Mô tả</Text>
                                    <Text style={styles.descText}>{company.description}</Text>
                                </View>
                            ) : null}
                        </View>
                    ))
                }
                <View style={{ height: 32 }} />
            </ScrollView>

            {/* Form Modal */}
            <CompanyFormModal
                visible={showForm}
                company={editTarget}
                onClose={() => setShowForm(false)}
                onSaved={handleSaved}
            />

            {/* Delete Modal */}
            <DeleteModal
                visible={showDelete}
                companyName={deleteTarget?.name || ''}
                onConfirm={handleDelete}
                onCancel={() => { setShowDelete(false); setDeleteTarget(null); }}
                loading={deleting}
            />
        </SafeAreaView>
    );
}