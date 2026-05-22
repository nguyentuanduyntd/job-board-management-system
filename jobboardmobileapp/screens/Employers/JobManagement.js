import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Alert, Modal, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TextInput, Button, HelperText } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { useStripe } from '@stripe/stripe-react-native';

import { authApi, endpoints } from '../../configs/Apis';
import styles, { Colors } from './Styles';
import usePagination from '../../hooks/usePagination';
import Paginator from '../../components/Paginator';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const PAGE_SIZE = 10;

const FORM_FIELDS = [
    { key: 'title',        label: 'Tiêu đề *',            keyboard: 'default' },
    { key: 'category_id',  label: 'Danh mục *',           type: 'picker' },
    { key: 'location',     label: 'Địa điểm',             keyboard: 'default' },
    { key: 'salary_min',   label: 'Lương tối thiểu',      keyboard: 'numeric' },
    { key: 'salary_max',   label: 'Lương tối đa',         keyboard: 'numeric' },
    { key: 'quantity',     label: 'Số lượng tuyển',       keyboard: 'numeric' },
    { key: 'deadline',     label: 'Hạn nộp (YYYY-MM-DD)', keyboard: 'default' },
    { key: 'description',  label: 'Mô tả công việc',      multiline: true },
    { key: 'requirements', label: 'Yêu cầu',              multiline: true },
    { key: 'benefits',     label: 'Quyền lợi',            multiline: true },
];

const EMPTY_FORM = {
    title: '', description: '', requirements: '', benefits: '',
    location: '', salary_min: '', salary_max: '', quantity: '',
    deadline: '', category_id: '',
};

const APPROVAL_CONFIG = {
    pending:  { color: '#F59E0B', bg: '#FFFBEB', text: 'Chờ duyệt' },
    approved: { color: '#10B981', bg: '#ECFDF5', text: 'Đã duyệt' },
    rejected: { color: '#EF4444', bg: '#FEF2F2', text: 'Bị từ chối' },
};

// ─── JOB FORM MODAL ───────────────────────────────────────────────────────────
const JobFormModal = ({ visible, onClose, onSuccess, editJob = null }) => {
    const [form, setForm]           = useState(EMPTY_FORM);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading]     = useState(false);
    const [err, setErr]             = useState('');

    // Tải danh mục ngành nghề từ Backend
    useEffect(() => {
        if (!visible) return;
        authApi().get(endpoints['categories'])
            .then(res => setCategories(res.data))
            .catch(ex => console.error('Lỗi load danh mục:', ex));
    }, [visible]);

    // Đồng bộ dữ liệu khi Sửa (Edit) hoặc Tạo mới (Create)
    useEffect(() => {
        setForm(editJob ? {
            ...editJob,
            salary_min:  String(editJob.salary_min  ?? ''),
            salary_max:  String(editJob.salary_max  ?? ''),
            quantity:    String(editJob.quantity     ?? ''),
            category_id: String(editJob.category?.id ?? ''),
        } : EMPTY_FORM);
        setErr('');
    }, [editJob, visible, myCompanies]);

    const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

    const onDateChange = (event, selectedDate) => {
        if (Platform.OS === 'android') setShowDatePicker(false);
        if (selectedDate) {
            const yyyy = selectedDate.getFullYear();
            const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
            const dd = String(selectedDate.getDate()).padStart(2, '0');
            update('deadline', `${yyyy}-${mm}-${dd}`);
        }
    };

    const handleSubmit = async () => {
        if (!form.title.trim() || !form.category_id || !form.company_id) {
            return setErr('Vui lòng nhập đầy đủ Tiêu đề, Danh mục và Công ty đăng tuyển!');
        }
        setErr(''); setLoading(true);
        try {
            const token = await AsyncStorage.getItem('token');
            const body  = {
                ...form,
                salary_min:  form.salary_min  ? Number(form.salary_min)  : null,
                salary_max:  form.salary_max  ? Number(form.salary_max)  : null,
                quantity:    form.quantity    ? Number(form.quantity)    : null,
                category_id: Number(form.category_id),
                company_id:  Number(form.company_id), // Truyền chuẩn ID số nguyên để hết lỗi 400
                skill_ids:   [],
            };
            if (editJob) {
                await authApi(token).patch(endpoints['job-detail'](editJob.id), body);
                Alert.alert('Thành công', 'Cập nhật bài tuyển dụng thành công!');
            } else {
                await authApi(token).post(endpoints['jobs'], body);
                Alert.alert('Thành công', 'Đăng tin tuyển dụng thành công!');
            }
            onSuccess(); onClose();
        } catch {
            setErr('Thao tác thất bại. Vui lòng thử lại!');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
            <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
                <ScrollView contentContainerStyle={{ padding: 20 }}>
                    <Text style={styles.jobFormTitle}>
                        {editJob ? 'CHỈNH SỬA BÀI ĐĂNG' : 'ĐĂNG TIN TUYỂN DỤNG'}
                    </Text>
                    {!!err && <HelperText type="error" visible>{err}</HelperText>}

                    {FORM_FIELDS.map(f =>
                        f.type === 'picker' ? (
                            <View key={f.key} style={styles.jobPickerContainer}>
                                <Text style={styles.jobPickerLabel}>{f.label}</Text>
                                <Picker selectedValue={form[f.key]} onValueChange={val => update(f.key, val)} style={{ height: 50 }}>
                                    <Picker.Item label="-- Chọn danh mục --" value="" color="#888" />
                                    {categories.map(cat => (
                                        <Picker.Item key={cat.id} label={cat.name} value={String(cat.id)} color="#000" />
                                    ))}
                                </Picker>
                            </View>
                        ) : (
                            <TextInput
                                key={f.key} label={f.label} value={form[f.key]}
                                onChangeText={t => update(f.key, t)}
                                mode="outlined" style={styles.jobFormInput}
                                outlineColor="#3B5BDB" activeOutlineColor="#3B5BDB"
                                keyboardType={f.keyboard || 'default'}
                                multiline={!!f.multiline} numberOfLines={f.multiline ? 3 : 1}
                            />
                        )
                    )}

                    <Button mode="contained" loading={loading} disabled={loading} onPress={handleSubmit} style={styles.jobFormSubmitBtn}>
                        {editJob ? 'LƯU THAY ĐỔI' : 'ĐĂNG TIN'}
                    </Button>
                    <Button mode="text" onPress={onClose} textColor="#888" style={{ marginTop: 8 }}>Hủy</Button>
                </ScrollView>
            </SafeAreaView>
        </Modal>
    );
};

// ─── BOOST JOB MODAL ─────────────────────────────────────────────────────────
const BoostJobModal = ({ visible, onClose, job, onSuccess }) => {
    const { initPaymentSheet, presentPaymentSheet } = useStripe();
    const [packages, setPackages]           = useState([]);
    const [selectedPackage, setSelectedPackage] = useState(null);
    const [loading, setLoading]             = useState(false);

    useEffect(() => {
        if (!visible) return;
        setSelectedPackage(null);
        AsyncStorage.getItem('token').then(token =>
            authApi(token).get(`${endpoints['packages']}?package_type=featured_job`)
        ).then(res => setPackages(res.data?.results ?? res.data))
         .catch(() => Alert.alert('Lỗi', 'Không thể tải danh sách gói.'));
    }, [visible]);

    const handleStripePayment = async () => {
        if (!selectedPackage || !job) return;
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('token');
            const res = await authApi(token).post(endpoints['create-payment-intent'], {
                payment_type: 'featured_job', package: selectedPackage.id, job: job.id, method: 'stripe',
            });
            const { payment_intent_client_secret, ephemeral_key, customer_id } = res.data;

            const { error: initError } = await initPaymentSheet({
                merchantDisplayName: 'JobApp', customerId: customer_id,
                customerEphemeralKeySecret: ephemeral_key,
                paymentIntentClientSecret: payment_intent_client_secret,
                allowsDelayedPaymentMethods: false,
            });
            if (initError) throw new Error(initError.message);

            const { error: payError } = await presentPaymentSheet();
            if (payError) { if (payError.code !== 'Canceled') throw new Error(payError.message); return; }

            setTimeout(() => {
                Alert.alert('Thanh toán thành công!', `Tin "${job.title}" đang được cập nhật thành tin nổi bật.`,
                    [{ text: 'OK', onPress: () => { onSuccess(); onClose(); } }]
                );
                setLoading(false);
            }, 2500);
        } catch (error) {
            Alert.alert('Thất bại', error.message || 'Có lỗi xảy ra.');
            setLoading(false);
        }
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.boostOverlay}>
                <View style={styles.boostContent}>
                    <Text style={styles.boostTitle}>🚀 Đẩy tin: {job?.title}</Text>
                    <ScrollView style={{ maxHeight: 300 }}>
                        {packages.map(pkg => (
                            <TouchableOpacity
                                key={pkg.id} onPress={() => setSelectedPackage(pkg)}
                                style={[styles.packageCard, selectedPackage?.id === pkg.id && styles.packageCardSelected]}
                            >
                                <Text style={styles.packageName}>{pkg.name}</Text>
                                <Text style={styles.packagePrice}>{Number(pkg.price).toLocaleString('vi-VN')} đ</Text>
                                <Text style={styles.packageDesc}>{pkg.description || `Hiệu lực: ${pkg.duration_days} ngày`}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                    <TouchableOpacity
                        style={[styles.stripeBtn, (!selectedPackage || loading) && styles.stripeBtnDisabled]}
                        disabled={!selectedPackage || loading} onPress={handleStripePayment}
                    >
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.stripeBtnText}>💳 Thanh toán qua Stripe</Text>}
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.boostCancelBtn} onPress={onClose} disabled={loading}>
                        <Text style={styles.boostCancelBtnText}>Hủy bỏ</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

// ─── JOB CARD ─────────────────────────────────────────────────────────────────
const JobCard = ({ job, onEdit, onDelete, onBoost }) => {
    const approval  = APPROVAL_CONFIG[job.status] || APPROVAL_CONFIG.pending;
    const isFeatured = Boolean(job.is_featured);

    return (
        <View style={[styles.jobCard, isFeatured ? styles.jobCardFeatured : {}]}>
            {isFeatured && (
                <View style={styles.featuredRibbon}>
                    <Text style={styles.featuredRibbonText}>🔥 NỔI BẬT</Text>
                </View>
            )}
            <View style={styles.jobCardHeader}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.jobCardTitle}>{job.title}</Text>
                    <Text style={styles.jobCardCompany}>{job.company?.name || '—'}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: approval.bg }]}>
                    <Text style={[styles.badgeText, { color: approval.color }]}>{approval.text}</Text>
                </View>
            </View>
            <View style={styles.jobCardActions}>
                <TouchableOpacity style={styles.editBtn} onPress={() => onEdit(job)}>
                    <Text style={styles.editBtnText}>Sửa</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => onDelete(job)}>
                    <Text style={styles.deleteBtnText}>Xóa</Text>
                </TouchableOpacity>
                {job.status === 'approved' && !isFeatured && (
                    <TouchableOpacity style={styles.boostBtn} onPress={() => onBoost(job)}>
                        <Text style={styles.boostBtnText}>🚀 Đẩy tin</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

// ─── MÀN HÌNH CHÍNH ───────────────────────────────────────────────────────────
export default function JobManagement() {
    const { data: jobs, setData: setJobs, loading, refreshing, page, totalPages, load, refresh, goTo } =
        usePagination(endpoints['my-jobs'], PAGE_SIZE);

    const [showForm, setShowForm] = useState(false);
    const [editJob, setEditJob]   = useState(null);
    const [showBoost, setShowBoost] = useState(false);
    const [boostJob, setBoostJob]   = useState(null);

    useEffect(() => { load(1); }, [load]);

    const handleEdit   = (job) => { setEditJob(job); setShowForm(true); };
    const handleBoost  = (job) => { setBoostJob(job); setShowBoost(true); };
    const handleCreate = () => { setEditJob(null); setShowForm(true); };

    const handleDelete = (job) => {
        Alert.alert('Xác nhận xóa', `Bạn có chắc muốn xóa bài tuyển dụng "${job.title}"?`, [
            { text: 'Hủy', style: 'cancel' },
            {
                text: 'Xóa', style: 'destructive',
                onPress: async () => {
                    try {
                        const token = await AsyncStorage.getItem('token');
                        await authApi(token).delete(endpoints['job-detail'](job.id));
                        setJobs(prev => prev.filter(j => j.id !== job.id));
                    } catch { Alert.alert('Lỗi', 'Không thể xóa tin. Vui lòng thử lại sau!'); }
                },
            },
        ]);
    };

    if (loading) return (
        <View style={styles.centered}>
            <ActivityIndicator size="large" color={Colors.accent} />
        </View>
    );

    return (
        <SafeAreaView style={styles.root}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>Bài đăng</Text>
                    <Text style={styles.headerSub}>{jobs.length} tin tuyển dụng</Text>
                </View>
                <TouchableOpacity style={styles.addJobBtn} onPress={handleCreate}>
                    <Text style={styles.addJobBtnText}>+ Đăng tin</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                contentContainerStyle={styles.listContent}
                data={jobs}
                keyExtractor={item => item.id.toString()}
                renderItem={({ item }) => (
                    <JobCard job={item} onEdit={handleEdit} onDelete={handleDelete} onBoost={handleBoost} />
                )}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Text style={styles.emptyIconWrap}>📋</Text>
                        <Text style={styles.emptyText}>Bạn chưa có bài đăng nào.{'\n'}Nhấn "+ Đăng tin" để bắt đầu!</Text>
                    </View>
                }
            />

            <Paginator page={page} totalPages={totalPages} onGoTo={goTo} />

            <JobFormModal
                visible={showForm}
                onClose={() => setShowForm(false)}
                onSuccess={() => load(page)}
                editJob={editJob}
            />
            <BoostJobModal
                visible={showBoost}
                onClose={() => setShowBoost(false)}
                job={boostJob}
                onSuccess={() => load(page)}
            />
        </SafeAreaView>
    );
}