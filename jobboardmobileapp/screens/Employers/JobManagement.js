import React, { useState, useCallback, useEffect } from 'react';
import { 
    View, Text, ScrollView, TouchableOpacity, ActivityIndicator, 
    RefreshControl, Alert, Modal, KeyboardAvoidingView, Platform 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TextInput, Button, HelperText } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { authApi, endpoints } from '../../configs/Apis';
import { useStripe } from '@stripe/stripe-react-native';
import { Colors } from './Styles';
import styles from './Styles';
import { formStyles, cardStyles, addBtnStyles, listStyles, boostStyles } from './JobManagementStyles';

const FORM_FIELDS = [
    { key: 'title',        label: 'Tiêu đề *',             keyboard: 'default' },
    { key: 'company_id',   label: 'Công ty đăng tuyển *',   type: 'company_picker' }, // Thêm picker chọn công ty
    { key: 'category_id',  label: 'Danh mục ngành nghề *',  type: 'picker' },
    { key: 'location',     label: 'Địa điểm làm việc',      keyboard: 'default' },
    { key: 'salary_min',   label: 'Lương tối thiểu (VND)',  keyboard: 'numeric' },
    { key: 'salary_max',   label: 'Lương tối đa (VND)',      keyboard: 'numeric' },
    { key: 'quantity',     label: 'Số lượng tuyển',         keyboard: 'numeric' },
    { key: 'deadline',     label: 'Hạn nộp hồ sơ *',        type: 'date' },
    { key: 'description',  label: 'Mô tả công việc',        multiline: true },
    { key: 'requirements', label: 'Yêu cầu ứng viên',       multiline: true },
    { key: 'benefits',     label: 'Quyền lợi được hưởng',    multiline: true },
];

const EMPTY_FORM = {
    title: '', description: '', requirements: '', benefits: '', location: '',
    salary_min: '', salary_max: '', quantity: '', deadline: '', category_id: '', company_id: '',
};

// ─── COMPONENT: MODAL FORM ĐĂNG TIN ───────────────────────────────────────────
const JobFormModal = ({ visible, onClose, onSuccess, editJob = null, myCompanies = [] }) => {
    const [form, setForm]       = useState(EMPTY_FORM);
    const [loading, setLoading] = useState(false);
    const [err, setErr]         = useState('');
    const [categories, setCategories] = useState([]);
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Tải danh mục ngành nghề từ Backend
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await authApi().get(endpoints['categories']);
                setCategories(res.data);
            } catch (ex) { console.error("Lỗi tải danh mục:", ex); }
        };
        if (visible) fetchCategories();
    }, [visible]);

    // Đồng bộ dữ liệu khi Sửa (Edit) hoặc Tạo mới (Create)
    useEffect(() => {
        if (editJob) {
            setForm({
                ...editJob,
                salary_min:  editJob.salary_min ? String(editJob.salary_min) : '',
                salary_max:  editJob.salary_max ? String(editJob.salary_max) : '',
                quantity:    editJob.quantity ? String(editJob.quantity) : '',
                category_id: editJob.category?.id ? String(editJob.category.id) : '',
                company_id:  editJob.company?.id ? String(editJob.company.id) : '',
                deadline:    editJob.deadline || '',
            });
        } else {
            // Nếu tạo mới, tự động lấy công ty đầu tiên của user làm mặc định (nếu có)
            setForm({
                ...EMPTY_FORM,
                company_id: myCompanies.length > 0 ? String(myCompanies[0].id) : '',
            });
        }
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
                title: form.title.trim(),
                description: form.description.trim(),
                requirements: form.requirements.trim(),
                benefits: form.benefits.trim(),
                location: form.location.trim(),
                deadline: form.deadline,
                salary_min:  form.salary_min ? Number(form.salary_min) : null,
                salary_max:  form.salary_max ? Number(form.salary_max) : null,
                quantity:    form.quantity ? Number(form.quantity) : null,
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
        } catch (ex) {
            if (ex.response && ex.response.data) {
                const firstKey = Object.keys(ex.response.data)[0];
                const backendMsg = Array.isArray(ex.response.data[firstKey]) ? ex.response.data[firstKey][0] : ex.response.data[firstKey];
                setErr(`Backend từ chối: [${firstKey}] ${backendMsg}`);
            } else {
                setErr('Thao tác thất bại. Vui lòng kiểm tra lại kết nối mạng!');
            }
        } finally { setLoading(false); }
    };

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
            <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                    <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                        <Text style={formStyles.title}>{editJob ? 'CHỈNH SỬA BÀI ĐĂNG' : 'ĐĂNG TIN TUYỂN DỤNG'}</Text>
                        {err ? <HelperText type="error" visible>{err}</HelperText> : null}
                        
                        {FORM_FIELDS.map(f => {
                            // 1. Giao diện Picker Công ty cá nhân
                            if (f.type === 'company_picker') {
                                return (
                                    <View key={f.key} style={{ marginVertical: 8 }}>
                                        <Text style={{ fontSize: 14, color: '#3B5BDB', marginBottom: 4, fontWeight: '600' }}>{f.label}</Text>
                                        <View style={{ borderWidth: 1, borderColor: '#3B5BDB', borderRadius: 4, backgroundColor: '#fff' }}>
                                            <Picker
                                                selectedValue={form[f.key]}
                                                onValueChange={val => update(f.key, val)}
                                                style={{ width: '100%', height: Platform.OS === 'ios' ? undefined : 50 }}
                                                dropdownIconColor="#3B5BDB"
                                                mode="dropdown"
                                            >
                                                <Picker.Item label="-- Chọn công ty của bạn --" value="" color="#888" />
                                                {myCompanies.map(c => (
                                                    <Picker.Item key={c.id} label={c.name} value={String(c.id)} color="#000" />
                                                ))}
                                            </Picker>
                                        </View>
                                    </View>
                                );
                            }

                            // 2. Giao diện Picker Danh mục
                            if (f.type === 'picker') {
                                return (
                                    <View key={f.key} style={{ marginVertical: 8 }}>
                                        <Text style={{ fontSize: 14, color: '#3B5BDB', marginBottom: 4, fontWeight: '600' }}>{f.label}</Text>
                                        <View style={{ borderWidth: 1, borderColor: '#3B5BDB', borderRadius: 4, backgroundColor: '#fff' }}>
                                            <Picker
                                                selectedValue={form[f.key]}
                                                onValueChange={val => update(f.key, val)}
                                                style={{ width: '100%', height: Platform.OS === 'ios' ? undefined : 50 }}
                                                dropdownIconColor="#3B5BDB"
                                                mode="dropdown"
                                            >
                                                <Picker.Item label="-- Chọn danh mục ngành nghề --" value="" color="#888" />
                                                {categories.map(cat => (
                                                    <Picker.Item key={cat.id} label={cat.name} value={String(cat.id)} color="#000" />
                                                ))}
                                            </Picker>
                                        </View>
                                    </View>
                                );
                            }

                            // 3. Giao diện Lịch DateTimePicker Hạn nộp
                            if (f.type === 'date') {
                                return (
                                    <View key={f.key} style={{ marginVertical: 4 }}>
                                        <TouchableOpacity onPress={() => setShowDatePicker(true)} activeOpacity={0.7}>
                                            <View pointerEvents="none">
                                                <TextInput
                                                    label={f.label} value={form[f.key]} mode="outlined" style={formStyles.input}
                                                    outlineColor="#3B5BDB" activeOutlineColor="#3B5BDB" editable={false}
                                                    right={<TextInput.Icon icon="calendar" onPress={() => setShowDatePicker(true)} />}
                                                />
                                            </View>
                                        </TouchableOpacity>
                                        {showDatePicker && (
                                            <DateTimePicker
                                                value={form[f.key] ? new Date(form[f.key]) : new Date()}
                                                mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                                minimumDate={new Date()} onChange={onDateChange}
                                            />
                                        )}
                                        {Platform.OS === 'ios' && showDatePicker && (
                                            <Button mode="text" compact onPress={() => setShowDatePicker(false)}>Xác nhận ngày</Button>
                                        )}
                                    </View>
                                );
                            }

                            // 4. Các trường nhập chuỗi/số thông thường
                            return (
                                <TextInput
                                    key={f.key} label={f.label} value={form[f.key]} onChangeText={t => update(f.key, t)}
                                    mode="outlined" style={formStyles.input} outlineColor="#3B5BDB" activeOutlineColor="#3B5BDB"
                                    keyboardType={f.keyboard || 'default'} multiline={!!f.multiline} numberOfLines={f.multiline ? 3 : 1}
                                />
                            );
                        })}
                        
                        <Button mode="contained" loading={loading} disabled={loading} onPress={handleSubmit} style={formStyles.submitBtn}>
                            {editJob ? 'LƯU THAY ĐỔI' : 'ĐĂNG TIN'}
                        </Button>
                        <Button mode="text" onPress={onClose} textColor="#888" style={{ marginTop: 8 }}>Hủy</Button>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </Modal>
    );
};

// ─── COMPONENT: MODAL ĐẨY TIN (BOOST) ─────────────────────────────────────────
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
            } catch (ex) { Alert.alert('Lỗi', 'Không thể tải danh sách gói dịch vụ nổi bật.'); }
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
                    `Tin "${job.title}" đang được hệ thống chuyển thành tin nổi bật.`,
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
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={boostStyles.stripeBtnText}>¼💳 Thanh toán qua Stripe</Text>}
                    </TouchableOpacity>
                    <TouchableOpacity style={boostStyles.cancelBtn} onPress={onClose} disabled={loading}>
                        <Text style={boostStyles.cancelBtnText}>Hủy bỏ</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

// ─── COMPONENT: HỘP THẺ TIN TUYỂN DỤNG (JOB CARD) ──────────────────────────────
const JobCard = ({ job, onEdit, onDelete, onBoost }) => {
    const approvalConfig = {
        pending:  { color: '#F59E0B', bg: '#FFFBEB', text: 'Chờ duyệt' },
        approved: { color: '#10B981', bg: '#ECFDF5', text: 'Đã duyệt' },
        rejected: { color: '#EF4444', bg: '#FEF2F2', text: 'Bị từ chối' },
    };
    
    const approval = approvalConfig[job.status] || approvalConfig.pending;
    const isFeatured = Boolean(job.is_featured);

    return (
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
                        <Text style={[cardStyles.badgeText, { color: approval.color }]}>{approval.text}</Text>
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

// ─── MAIN SCREEN: MÀN HÌNH CHÍNH QUẢN LÝ TIN ĐĂNG VÀ CÔNG TY ──────────────────
export default function JobManagement() {
    const [jobs, setJobs]               = useState([]);
    const [myCompanies, setMyCompanies] = useState([]); // Chứa danh sách công ty của riêng user này
    const [loading, setLoading]         = useState(true);
    const [refreshing, setRefreshing]   = useState(false);
    
    const [showForm, setShowForm]       = useState(false);
    const [editJob, setEditJob]         = useState(null);
    const [showBoost, setShowBoost]     = useState(false);
    const [boostJob, setBoostJob]       = useState(null);

    // Đồng bộ tải cả Tin tuyển dụng và Công ty của User hiện tại cùng lúc
    const fetchData = useCallback(async (isRefresh = false) => {
        try {
            isRefresh ? setRefreshing(true) : setLoading(true);
            const token = await AsyncStorage.getItem('token');
            const api = authApi(token);

            // 1. Tải danh sách bài đăng tuyển dụng của tôi
            const jobsRes = await api.get(endpoints['my-jobs']);
            setJobs(jobsRes.data);

            // 2. Tải danh sách công ty của riêng tôi đăng ký để ép ID vào form tạo mới
            const companyRes = await api.get(endpoints['my-companies']);
            const cData = companyRes.data;
            setMyCompanies(Array.isArray(cData) ? cData : cData?.results || []);

        } catch (ex) { 
            console.error('Lỗi nạp dữ liệu quản lý:', ex.message); 
        } finally { 
            setLoading(false); 
            setRefreshing(false); 
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleEdit = (job) => { setEditJob(job); setShowForm(true); };
    const handleOpenCreate = () => {
        if (myCompanies.length === 0) {
            return Alert.alert(
                'Chưa có doanh nghiệp', 
                'Bạn chưa đăng ký thông tin doanh nghiệp nào. Vui lòng tạo hồ sơ công ty trước khi đăng tin tuyển dụng!'
            );
        }
        setEditJob(null); 
        setShowForm(true); 
    };
    const handleBoost = (job) => { setBoostJob(job); setShowBoost(true); };

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
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} tintColor={Colors.accent} />}
                showsVerticalScrollIndicator={false}
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

            {/* Khởi tạo modal kèm dữ liệu mảng công ty đã nạp từ trước */}
            <JobFormModal 
                visible={showForm} 
                onClose={() => setShowForm(false)} 
                onSuccess={() => fetchData(true)} 
                editJob={editJob} 
                myCompanies={myCompanies} 
            />
            <BoostJobModal visible={showBoost} onClose={() => setShowBoost(false)} job={boostJob} onSuccess={() => fetchData(true)} />
        </SafeAreaView>
    );
}