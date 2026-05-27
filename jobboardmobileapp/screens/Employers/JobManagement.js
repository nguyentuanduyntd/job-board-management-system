import React, { useState, useEffect, useCallback } from 'react';
import { 
    View, Text, FlatList, TouchableOpacity, ActivityIndicator, 
    RefreshControl, Alert, Modal, ScrollView, KeyboardAvoidingView, Platform 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TextInput, Button, HelperText } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { useStripe } from '@stripe/stripe-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

import { authApi, endpoints } from '../../configs/Apis';
import styles, { Colors } from './Styles';
import usePagination from '../../hooks/usePagination';
import Paginator from '../../components/Paginator';

const PAGE_SIZE = 5;

const FORM_FIELDS = [
    { key: 'title',        label: 'Tiêu đề *',             keyboard: 'default' },
    { key: 'company_id',   label: 'Công ty đăng tuyển *',   type: 'company_picker' },
    { key: 'category_id',  label: 'Danh mục *',             type: 'picker' },
    { key: 'location',     label: 'Địa điểm',               keyboard: 'default' },
    { key: 'salary_min',   label: 'Lương tối thiểu',        keyboard: 'numeric' },
    { key: 'salary_max',   label: 'Lương tối đa',           keyboard: 'numeric' },
    { key: 'quantity',     label: 'Số lượng tuyển',         keyboard: 'numeric' },
    { key: 'deadline',     label: 'Hạn nộp *',              type: 'date' },
    { key: 'description',  label: 'Mô tả công việc',        multiline: true },
    { key: 'requirements', label: 'Yêu cầu',                multiline: true },
    { key: 'benefits',     label: 'Quyền lợi',              multiline: true },
];

const EMPTY_FORM = {
    title: '', description: '', requirements: '', benefits: '',
    location: '', salary_min: '', salary_max: '', quantity: '',
    deadline: '', category_id: '', company_id: '',
};

const APPROVAL_CONFIG = {
    pending:  { color: '#F59E0B', bg: '#FFFBEB', text: 'Chờ duyệt' },
    approved: { color: '#10B981', bg: '#ECFDF5', text: 'Đã duyệt' },
    rejected: { color: '#EF4444', bg: '#FEF2F2', text: 'Bị từ chối' },
};

const JobFormModal = ({ visible, onClose, onSuccess, editJob = null, myCompanies = [] }) => {
    const [form, setForm]           = useState(EMPTY_FORM);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading]     = useState(false);
    const [err, setErr]             = useState('');
    
    const [showDatePicker, setShowDatePicker] = useState(false);

    useEffect(() => {
        if (!visible) return;
        authApi().get(endpoints['categories'])
            .then(res => setCategories(res.data?.results ?? res.data))
            .catch(ex => console.error('Lỗi load danh mục:', ex));
    }, [visible]);
 
    useEffect(() => {
        if (editJob) {
            setForm({
                ...editJob,
                salary_min:  String(editJob.salary_min  ?? ''),
                salary_max:  String(editJob.salary_max  ?? ''),
                quantity:    String(editJob.quantity    ?? ''),
                category_id: String(editJob.category?.id ?? ''),
                company_id:  String(editJob.company?.id  ?? ''),
                deadline:    editJob.deadline || '',
            });
        } else {
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
                ...form,
                title: form.title.trim(),
                salary_min:  form.salary_min  ? Number(form.salary_min)  : null,
                salary_max:  form.salary_max  ? Number(form.salary_max)  : null,
                quantity:    form.quantity    ? Number(form.quantity)    : null,
                category_id: Number(form.category_id),
                company_id:  Number(form.company_id),
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
                <KeyboardAvoidingView 
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
                    style={{ flex: 1 }}
                >
                    <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                        <Text style={styles.jobFormTitle}>
                            {editJob ? 'CHỈNH SỬA BÀI ĐĂNG' : 'ĐĂNG TIN TUYỂN DỤNG'}
                        </Text>
                        {!!err && <HelperText type="error" visible>{err}</HelperText>}

                        {FORM_FIELDS.map(f => {
                            if (f.type === 'company_picker') {
                                return (
                                    <View key={f.key} style={[styles.jobPickerContainer, { marginVertical: 8 }]}>
                                        <Text style={styles.jobPickerLabel}>{f.label}</Text>
                                        <View style={{ borderWidth: 1, borderColor: '#3B5BDB', borderRadius: 4, backgroundColor: '#fff', overflow: 'hidden' }}>
                                            <Picker selectedValue={form[f.key]} onValueChange={val => update(f.key, val)} style={{ height: 50 }}>
                                                <Picker.Item label="-- Chọn công ty của bạn --" value="" color="#888" />
                                                {myCompanies.map(comp => (
                                                    <Picker.Item key={comp.id} label={comp.name} value={String(comp.id)} color="#000" />
                                                ))}
                                            </Picker>
                                        </View>
                                    </View>
                                );
                            }

                            if (f.type === 'picker') {
                                return (
                                    <View key={f.key} style={[styles.jobPickerContainer, { marginVertical: 8 }]}>
                                        <Text style={styles.jobPickerLabel}>{f.label}</Text>
                                        <View style={{ borderWidth: 1, borderColor: '#3B5BDB', borderRadius: 4, backgroundColor: '#fff', overflow: 'hidden' }}>
                                            <Picker selectedValue={form[f.key]} onValueChange={val => update(f.key, val)} style={{ height: 50 }}>
                                                <Picker.Item label="-- Chọn danh mục --" value="" color="#888" />
                                                {categories.map(cat => (
                                                    <Picker.Item key={cat.id} label={cat.name} value={String(cat.id)} color="#000" />
                                                ))}
                                            </Picker>
                                        </View>
                                    </View>
                                );
                            }

                            if (f.type === 'date') {
                                return (
                                    <View key={f.key} style={{ marginVertical: 4 }}>
                                        <TouchableOpacity onPress={() => setShowDatePicker(true)} activeOpacity={0.7}>
                                            <View pointerEvents="none">
                                                <TextInput
                                                    label={f.label}
                                                    value={form[f.key]}
                                                    mode="outlined"
                                                    style={styles.jobFormInput}
                                                    outlineColor="#3B5BDB"
                                                    activeOutlineColor="#3B5BDB"
                                                    editable={false}
                                                    right={<TextInput.Icon icon="calendar" onPress={() => setShowDatePicker(true)} />}
                                                />
                                            </View>
                                        </TouchableOpacity>

                                        {showDatePicker && (
                                            <DateTimePicker
                                                value={form[f.key] ? new Date(form[f.key]) : new Date()}
                                                mode="date"
                                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                                minimumDate={new Date()}
                                                onChange={onDateChange}
                                            />
                                        )}
                                        {Platform.OS === 'ios' && showDatePicker && (
                                            <Button mode="text" compact onPress={() => setShowDatePicker(false)}>Xác nhận ngày</Button>
                                        )}
                                    </View>
                                );
                            }

                            return (
                                <TextInput
                                    key={f.key} label={f.label} value={form[f.key]}
                                    onChangeText={t => update(f.key, t)}
                                    mode="outlined" style={styles.jobFormInput}
                                    outlineColor="#3B5BDB" activeOutlineColor="#3B5BDB"
                                    keyboardType={f.keyboard || 'default'}
                                    multiline={!!f.multiline} numberOfLines={f.multiline ? 3 : 1}
                                />
                            );
                        })}

                        <Button mode="contained" loading={loading} disabled={loading} onPress={handleSubmit} style={styles.jobFormSubmitBtn}>
                            {editJob ? 'LƯU THAY ĐỔI' : 'ĐĂNG TIN'}
                        </Button>
                        <Button mode="text" onPress={onClose} textColor="#888" style={{ marginTop: 8 }}>Hủy</Button>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </Modal>
    );
};

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

const JobCard = ({ job, onEdit, onDelete, onBoost }) => {
    const approval  = APPROVAL_CONFIG[job.status] || APPROVAL_CONFIG.pending;
    const isFeatured = Boolean(job.is_featured);

    return (
        <View style={[styles.jobCard, isFeatured ? styles.jobCardFeatured : {}]}>
            {isFeatured && (
                <View style={styles.featuredRibbon}>
                    <Text style={styles.featuredRibbonText}>NỔI BẬT</Text>
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
                        <Text style={styles.boostBtnText}>Đẩy tin</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

export default function JobManagement() {
    const { data: jobs, setData: setJobs, loading, refreshing, page, totalPages, load, refresh, goTo } =
        usePagination(endpoints['my-jobs'], PAGE_SIZE);

    const [showForm, setShowForm] = useState(false);
    const [editJob, setEditJob]   = useState(null);
    const [showBoost, setShowBoost] = useState(false);
    const [boostJob, setBoostJob]   = useState(null);
    const [myCompanies, setMyCompanies] = useState([]);

    const [stats, setStats] = useState({
        totalJobs: 0,
        totalApps: 0,
        avgRating: 0,
        ratio: 0,
    });
    const [loadingStats, setLoadingStats] = useState(true);

    const fetchDashboardStats = useCallback(async () => {
        try {
            setLoadingStats(true);
            const token = await AsyncStorage.getItem('token');
            const res = await authApi(token).get(endpoints['employer-dashboard']);
            
            const overview = res.data?.overview || {};
            const totalJobs = overview.total_jobs_posted || 0;
            const totalApps = overview.total_applications || 0;
            const avgRating = overview.avg_candidate_rating || 0;
            const ratio = totalJobs > 0 ? (totalApps / totalJobs).toFixed(1) : 0;

            setStats({ totalJobs, totalApps, avgRating, ratio });
        } catch (ex) {
            console.error("Lỗi nạp dữ liệu thống kê Dashboard:", ex.message);
        } finally {
            setLoadingStats(false);
        }
    }, []);

    const fetchMyCompanies = useCallback(async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const res = await authApi(token).get(endpoints['my-companies']);
            const cData = res.data;
            setMyCompanies(Array.isArray(cData) ? cData : cData?.results || []);
        } catch (ex) {
            console.error('Lỗi nạp danh sách công ty:', ex.message);
        }
    }, []);

    const handleRefreshAll = useCallback(async () => {
        await Promise.all([refresh(), fetchDashboardStats(), fetchMyCompanies()]);
    }, [refresh, fetchDashboardStats, fetchMyCompanies]);

    useEffect(() => { 
        load(1); 
        fetchDashboardStats();
        fetchMyCompanies();
    }, [load, fetchDashboardStats, fetchMyCompanies]);

    const handleEdit   = (job) => { setEditJob(job); setShowForm(true); };
    const handleBoost  = (job) => { setBoostJob(job); setShowBoost(true); };
    const handleCreate = () => { 
        if (myCompanies.length === 0) {
            return Alert.alert('Thông báo', 'Bạn cần tạo hồ sơ doanh nghiệp trước khi đăng tuyển công việc!');
        }
        setEditJob(null); 
        setShowForm(true); 
    };

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
                        fetchDashboardStats();
                    } catch { Alert.alert('Lỗi', 'Không thể xóa tin. Vui lòng thử lại sau!'); }
                },
            },
        ]);
    };

    const StatCard = ({ title, value, color }) => (
        <View style={{
            flex: 1,
            backgroundColor: '#fff',
            borderRadius: 8,
            padding: 12,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: '#E5E7EB',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
            elevation: 2,
        }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: color, marginBottom: 4 }}>{value}</Text>
            <Text style={{ fontSize: 11, color: '#6B7280', fontWeight: '500', textAlign: 'center' }} numberOfLines={2}>{title}</Text>
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
            {loading && !refreshing ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={Colors.accent} />
                </View>
            ) : (
                <FlatList
                    contentContainerStyle={styles.listContent}
                    data={jobs}
                    keyExtractor={item => item.id.toString()}
                    renderItem={({ item }) => (
                        <JobCard job={item} onEdit={handleEdit} onDelete={handleDelete} onBoost={handleBoost} />
                    )}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={handleRefreshAll} />
                    }
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Text style={styles.emptyIconWrap}></Text>
                            <Text style={styles.emptyText}>
                                Bạn chưa có bài đăng nào.{'\n'}Nhấn "+ Đăng tin" để bắt đầu!
                            </Text>
                        </View>
                    }
                    ListFooterComponent={
                        <View style={{ paddingBottom: 16 }}>
                            <Paginator page={page} totalPages={totalPages} onGoTo={goTo} />
                        </View>
                    }
                />
            )}

            <JobFormModal
                visible={showForm}
                onClose={() => setShowForm(false)}
                onSuccess={handleRefreshAll} 
                editJob={editJob}
                myCompanies={myCompanies}
            />
            <BoostJobModal
                visible={showBoost}
                onClose={() => setShowBoost(false)}
                job={boostJob}
                onSuccess={handleRefreshAll}
            />
        </SafeAreaView>
    );
}