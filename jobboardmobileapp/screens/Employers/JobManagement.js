import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TextInput, Button, HelperText } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { authApi, endpoints } from '../../configs/Apis';
import { useStripe } from '@stripe/stripe-react-native';
import { Colors } from './Styles';
import styles from './Styles';
import { formStyles, cardStyles, addBtnStyles, listStyles, boostStyles } from './JobManagementStyles';

const FORM_FIELDS = [
    { key: 'title',        label: 'Tiêu đề *',              keyboard: 'default' },
    { key: 'category_id',  label: 'Danh mục *',             type: 'picker' },
    { key: 'location',     label: 'Địa điểm',               keyboard: 'default' },
    { key: 'salary_min',   label: 'Lương tối thiểu',        keyboard: 'numeric' },
    { key: 'salary_max',   label: 'Lương tối đa',           keyboard: 'numeric' },
    { key: 'quantity',     label: 'Số lượng tuyển',         keyboard: 'numeric' },
    { key: 'deadline',     label: 'Hạn nộp (YYYY-MM-DD)',   keyboard: 'default' },
    { key: 'description',  label: 'Mô tả công việc',        multiline: true },
    { key: 'requirements', label: 'Yêu cầu',                multiline: true },
    { key: 'benefits',     label: 'Quyền lợi',              multiline: true },
];

const EMPTY_FORM = {
    title: '', description: '', requirements: '', benefits: '', location: '',
    salary_min: '', salary_max: '', quantity: '', deadline: '', category_id: '',
};

// ─── COMPONENT: MODAL FORM ────────────────────────────────────────────────────
const JobFormModal = ({ visible, onClose, onSuccess, editJob = null }) => {
    const [form, setForm]       = useState(EMPTY_FORM);
    const [loading, setLoading] = useState(false);
    const [err, setErr]         = useState('');
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await authApi().get(endpoints['categories']);
                setCategories(res.data);
            } catch (ex) { console.error("Lỗi load danh mục:", ex); }
        };
        if (visible) fetchCategories();
    }, [visible]);

    useEffect(() => {
        if (editJob) {
            setForm({
                ...editJob,
                salary_min:  editJob.salary_min ? String(editJob.salary_min) : '',
                salary_max:  editJob.salary_max ? String(editJob.salary_max) : '',
                quantity:    editJob.quantity ? String(editJob.quantity) : '',
                category_id: editJob.category?.id ? String(editJob.category.id) : '',
            });
        } else {
            setForm(EMPTY_FORM);
        }
        setErr('');
    }, [editJob, visible]);

    const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

    const handleSubmit = async () => {
        if (!form.title || !form.category_id) return setErr('Vui lòng nhập tiêu đề và chọn danh mục!');
        setErr(''); setLoading(true);
        try {
            const token = await AsyncStorage.getItem('token');
            const body  = {
                ...form,
                salary_min:  form.salary_min ? Number(form.salary_min) : null,
                salary_max:  form.salary_max ? Number(form.salary_max) : null,
                quantity:    form.quantity ? Number(form.quantity) : null,
                category_id: Number(form.category_id),
                skill_ids:   [],
            };

            if (editJob) {
                await authApi(token).patch(endpoints['job-detail'](editJob.id), body);
                Alert.alert('Thành công', 'Cập nhật bài đăng thành công!');
            } else {
                await authApi(token).post(endpoints['jobs'], body);
                Alert.alert('Thành công', 'Đăng tin tuyển dụng thành công!');
            }
            onSuccess(); onClose();
        } catch (ex) {
            setErr('Thao tác thất bại. Vui lòng thử lại!');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
            <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
                <ScrollView contentContainerStyle={{ padding: 20 }}>
                    <Text style={formStyles.title}>{editJob ? 'CHỈNH SỬA BÀI ĐĂNG' : 'ĐĂNG TIN TUYỂN DỤNG'}</Text>
                    {err ? <HelperText type="error" visible>{err}</HelperText> : null}
                    
                    {FORM_FIELDS.map(f => (
                        f.type === 'picker' ? (
                            <View key={f.key} style={formStyles.pickerContainer}>
                                <Text style={formStyles.pickerLabel}>{f.label}</Text>
                                <Picker selectedValue={form[f.key]} onValueChange={val => update(f.key, val)} style={{ height: 50 }}>
                                    <Picker.Item label="-- Chọn danh mục --" value="" color="#888" />
                                    {categories.map(cat => (
                                        <Picker.Item key={cat.id} label={cat.name} value={String(cat.id)} color="#000" />
                                    ))}
                                </Picker>
                            </View>
                        ) : (
                            <TextInput
                                key={f.key} label={f.label} value={form[f.key]} onChangeText={t => update(f.key, t)}
                                mode="outlined" style={formStyles.input} outlineColor="#3B5BDB" activeOutlineColor="#3B5BDB"
                                keyboardType={f.keyboard || 'default'} multiline={!!f.multiline} numberOfLines={f.multiline ? 3 : 1}
                            />
                        )
                    ))}
                    <Button mode="contained" loading={loading} disabled={loading} onPress={handleSubmit} style={formStyles.submitBtn}>
                        {editJob ? 'LƯU THAY ĐỔI' : 'ĐĂNG TIN'}
                    </Button>
                    <Button mode="text" onPress={onClose} textColor="#888" style={{ marginTop: 8 }}>Hủy</Button>
                </ScrollView>
            </SafeAreaView>
        </Modal>
    );
};

// ─── COMPONENT: MODAL BOOST JOB ───────────────────────────────────────────────
const BoostJobModal = ({ visible, onClose, job, onSuccess }) => {
    const { initPaymentSheet, presentPaymentSheet } = useStripe();
    const [packages, setPackages] = useState([]);
    const [selectedPackage, setSelectedPackage] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!visible) return;
        const fetchPackages = async () => {
            try {
                const token = await AsyncStorage.getItem('token');
                const res = await authApi(token).get(`${endpoints['packages']}?package_type=featured_job`);
                setPackages(res.data?.results ?? res.data);
            } catch (ex) { Alert.alert('Lỗi', 'Không thể tải danh sách gói.'); }
        };
        fetchPackages();
        setSelectedPackage(null);
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
                customerEphemeralKeySecret: ephemeral_key, paymentIntentClientSecret: payment_intent_client_secret,
                allowsDelayedPaymentMethods: false,
            });
            if (initError) throw new Error(initError.message);

            const { error: payError } = await presentPaymentSheet();
            if (payError) {
                if (payError.code !== 'Canceled') throw new Error(payError.message);
                return;
            }

            setTimeout(() => {
                Alert.alert(
                    'Thanh toán thành công!',
                    `Tin "${job.title}" đang được hệ thống cập nhật thành tin nổi bật.`,
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
            <View style={boostStyles.modalOverlay}>
                <View style={boostStyles.modalContent}>
                    <Text style={boostStyles.modalTitle}>🚀 Đẩy tin: {job?.title}</Text>
                    <ScrollView style={{ maxHeight: 300 }}>
                        {packages.map(pkg => (
                            <TouchableOpacity
                                key={pkg.id} onPress={() => setSelectedPackage(pkg)}
                                style={[boostStyles.packageCard, selectedPackage?.id === pkg.id && boostStyles.packageCardSelected]}
                            >
                                <Text style={boostStyles.packageName}>{pkg.name}</Text>
                                <Text style={boostStyles.packagePrice}>{Number(pkg.price).toLocaleString('vi-VN')} đ</Text>
                                <Text style={boostStyles.packageDesc}>{pkg.description || `Hiệu lực: ${pkg.duration_days} ngày`}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                    <TouchableOpacity
                        style={[boostStyles.stripeBtn, (!selectedPackage || loading) && boostStyles.stripeBtnDisabled]}
                        disabled={!selectedPackage || loading} onPress={handleStripePayment}
                    >
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={boostStyles.stripeBtnText}>💳 Thanh toán qua Stripe</Text>}
                    </TouchableOpacity>
                    <TouchableOpacity style={boostStyles.cancelBtn} onPress={onClose} disabled={loading}>
                        <Text style={boostStyles.cancelBtnText}>Hủy bỏ</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

// ─── COMPONENT: JOB CARD HIỂN THỊ TỪNG JOB ────────────────────────────────────
const JobCard = ({ job, onEdit, onDelete, onBoost }) => {
    const approvalConfig = {
        pending:  { color: '#F59E0B', bg: '#FFFBEB', text: 'Chờ duyệt' },
        approved: { color: '#10B981', bg: '#ECFDF5', text: 'Đã duyệt' },
        rejected: { color: '#EF4444', bg: '#FEF2F2', text: 'Bị từ chối' },
    };
    
    const approval = approvalConfig[job.status] || approvalConfig.pending;
    
    // Đảm bảo ép kiểu Boolean cho an toàn trong mảng Style React Native
    const isFeatured = Boolean(job.is_featured);

    return (
        // Dùng toán tử 3 ngôi (isFeatured ? ... : {}) để chặn triệt để lỗi array style
        <View style={[cardStyles.card, isFeatured ? cardStyles.cardFeatured : {}]}>
            {isFeatured && (
                <View style={cardStyles.featuredRibbon}>
                    <Text style={cardStyles.featuredRibbonText}>🔥 NỔI BẬT</Text>
                </View>
            )}

            <View style={cardStyles.cardHeader}>
                <View style={{ flex: 1 }}>
                    <Text style={cardStyles.title}>{job.title}</Text>
                    <Text style={cardStyles.company}>{job.company?.name || '—'}</Text>
                </View>

                <View style={cardStyles.badgeContainer}>
                    <View style={[cardStyles.badge, { backgroundColor: approval.bg }]}>
                        <Text style={[cardStyles.badgeText, { color: approval.color }]}>
                            {approval.text}
                        </Text>
                    </View>
                </View>
            </View>

            <View style={cardStyles.actions}>
                <TouchableOpacity style={cardStyles.editBtn} onPress={() => onEdit(job)}>
                    <Text style={cardStyles.editBtnText}>Sửa</Text>
                </TouchableOpacity>

                <TouchableOpacity style={cardStyles.deleteBtn} onPress={() => onDelete(job)}>
                    <Text style={cardStyles.deleteBtnText}>Xóa</Text>
                </TouchableOpacity>

                {job.status === 'approved' && !isFeatured && (
                    <TouchableOpacity style={cardStyles.boostBtn} onPress={() => onBoost(job)}>
                        <Text style={cardStyles.boostBtnText}>🚀 Đẩy tin</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

// ─── MÀN HÌNH CHÍNH: QUẢN LÝ JOB ───────────────────────────────────────────────
export default function JobManagement() {
    const [jobs, setJobs]             = useState([]);
    const [loading, setLoading]       = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    
    const [showForm, setShowForm]     = useState(false);
    const [editJob, setEditJob]       = useState(null);
    
    const [showBoost, setShowBoost]   = useState(false);
    const [boostJob, setBoostJob]     = useState(null);

    const fetchJobs = useCallback(async (isRefresh = false) => {
        try {
            isRefresh ? setRefreshing(true) : setLoading(true);
            const token = await AsyncStorage.getItem('token');
            const res   = await authApi(token).get(endpoints['my-jobs']);
            setJobs(res.data);
        } catch (ex) { console.error('Fetch jobs error:', ex.message); } 
        finally { setLoading(false); setRefreshing(false); }
    }, []);

    useEffect(() => { fetchJobs(); }, [fetchJobs]);

    const handleEdit = (job) => { setEditJob(job); setShowForm(true); };
    const handleOpenCreate = () => { setEditJob(null); setShowForm(true); };
    const handleBoost = (job) => { setBoostJob(job); setShowBoost(true); };

    const handleDelete = (job) => {
        Alert.alert('Xác nhận xóa', `Bạn có chắc muốn xóa "${job.title}"?`, [
            { text: 'Hủy', style: 'cancel' },
            {
                text: 'Xóa', style: 'destructive',
                onPress: async () => {
                    try {
                        const token = await AsyncStorage.getItem('token');
                        await authApi(token).delete(endpoints['job-detail'](job.id));
                        setJobs(prev => prev.filter(j => j.id !== job.id));
                    } catch { Alert.alert('Lỗi', 'Không thể xóa bài đăng. Vui lòng thử lại!'); }
                },
            },
        ]);
    };

    if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.accent} /></View>;

    return (
        <SafeAreaView style={styles.root}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>Bài đăng</Text>
                    <Text style={styles.headerSub}>{jobs.length} tin tuyển dụng</Text>
                </View>
                <TouchableOpacity style={addBtnStyles.btn} onPress={handleOpenCreate}>
                    <Text style={addBtnStyles.text}>+ Đăng tin</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={listStyles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchJobs(true)} />}
            >
                {jobs.length === 0 ? (
                    <View style={listStyles.emptyWrap}>
                        <Text style={listStyles.emptyIcon}>📋</Text>
                        <Text style={listStyles.emptyText}>Bạn chưa có bài đăng nào.{'\n'}Nhấn "+ Đăng tin" để bắt đầu!</Text>
                    </View>
                ) : (
                    jobs.map(job => (
                        <JobCard key={job.id} job={job} onEdit={handleEdit} onDelete={handleDelete} onBoost={handleBoost} />
                    ))
                )}
            </ScrollView>

            <JobFormModal visible={showForm} onClose={() => setShowForm(false)} onSuccess={fetchJobs} editJob={editJob} />
            <BoostJobModal visible={showBoost} onClose={() => setShowBoost(false)} job={boostJob} onSuccess={fetchJobs} />
        </SafeAreaView>
    );
}