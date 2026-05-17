import React, { useState, useCallback, useEffect } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity,
    ActivityIndicator, RefreshControl, Alert, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TextInput, Button, HelperText } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { authApi, endpoints } from '../../configs/Apis';
import { Colors } from './Styles';
import styles from './Styles';
import { formStyles, cardStyles, addBtnStyles, listStyles } from './JobManagementStyles';

// ─── Cấu hình các field trong form ───────────────────────────────────────────
const FORM_FIELDS = [
    { key: 'title',        label: 'Tiêu đề *',               keyboard: 'default'  },
{ key: 'category_id',  label: 'Danh mục *',                  type: 'picker'  },
    { key: 'location',     label: 'Địa điểm',                keyboard: 'default'  },
    { key: 'salary_min',   label: 'Lương tối thiểu',         keyboard: 'numeric'  },
    { key: 'salary_max',   label: 'Lương tối đa',            keyboard: 'numeric'  },
    { key: 'quantity',     label: 'Số lượng tuyển',          keyboard: 'numeric'  },
    { key: 'deadline',     label: 'Hạn nộp (YYYY-MM-DD)',    keyboard: 'default'  },
    { key: 'description',  label: 'Mô tả công việc',         multiline: true      },
    { key: 'requirements', label: 'Yêu cầu',                 multiline: true      },
    { key: 'benefits',     label: 'Quyền lợi',               multiline: true      },
];

const EMPTY_FORM = {
    title: '', description: '', requirements: '', benefits: '',
    location: '', salary_min: '', salary_max: '',
    quantity: '', deadline: '', category_id: '',
};

// Modal Form tạo / sửa Job 
const JobFormModal = ({ visible, onClose, onSuccess, editJob = null }) => {
    const [form, setForm]       = useState(EMPTY_FORM);
    const [loading, setLoading] = useState(false);
    const [err, setErr]         = useState('');

    const [categories, setCategories] = useState([]);
    useEffect(() => {
        const fetchCategories = async () => {
            try{
                const res = await authApi().get(endpoints['categories']);
                setCategories(res.data);
            } catch (ex){
                console.error("Lỗi load danh mục:", error);
            }
        };
        if (visible){
            fetchCategories();
        }
    }, [visible]);

    useEffect(() => {
        if (editJob) {
            setForm({
                title:        editJob.title        || '',
                description:  editJob.description  || '',
                requirements: editJob.requirements || '',
                benefits:     editJob.benefits     || '',
                location:     editJob.location     || '',
                salary_min:   editJob.salary_min   ? String(editJob.salary_min)   : '',
                salary_max:   editJob.salary_max   ? String(editJob.salary_max)   : '',
                quantity:     editJob.quantity     ? String(editJob.quantity)     : '',
                deadline:     editJob.deadline     || '',
                category_id:  editJob.category?.id ? String(editJob.category.id) : '',
            });
        } else {
            setForm(EMPTY_FORM);
        }
        setErr('');
    }, [editJob, visible]);

    const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

    const handleSubmit = async () => {
        if (!form.title || !form.category_id) {
            setErr('Vui lòng nhập tiêu đề, ID công ty và ID danh mục!');
            return;
        }
        setErr('');
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('token');
            const body  = {
                ...form,
                salary_min:  form.salary_min  ? Number(form.salary_min)  : null,
                salary_max:  form.salary_max  ? Number(form.salary_max)  : null,
                quantity:    form.quantity    ? Number(form.quantity)    : null,
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
            onSuccess();
            onClose();
        } catch (ex) {
            const data = ex?.response?.data;
            const key  = data ? Object.keys(data)[0] : null;
            setErr(key
                ? (Array.isArray(data[key]) ? data[key][0] : data[key])
                : 'Thao tác thất bại. Vui lòng thử lại!'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
            <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
                <ScrollView contentContainerStyle={{ padding: 20 }}>
                    <Text style={formStyles.title}>
                        {editJob ? 'CHỈNH SỬA BÀI ĐĂNG' : 'ĐĂNG TIN TUYỂN DỤNG'}
                    </Text>

                    {err ? <HelperText type="error" visible>{err}</HelperText> : null}

                    {FORM_FIELDS.map(f => {
                        // ĐÃ SỬA: Render Picker (Dropdown) cho trường Category
                        if (f.type === 'picker') {
                            return (
                                <View key={f.key} style={{ 
                                    borderWidth: 1, 
                                    borderColor: '#79747E', 
                                    borderRadius: 4, 
                                    marginBottom: 12, 
                                    backgroundColor: '#fff',
                                    height: 50,
                                    justifyContent: 'center'
                                }}>
                                    <Text style={{ position: 'absolute', top: -10, left: 10, backgroundColor: '#fff', paddingHorizontal: 4, fontSize: 12, color: '#49454F' }}>
                                        {f.label}
                                    </Text>
                                    <Picker
                                        selectedValue={form[f.key]}
                                        onValueChange={(val) => update(f.key, val)}
                                        style={{ height: 50 }}
                                    >
                                        <Picker.Item label="-- Chọn danh mục --" value="" color="#888" />
                                        {categories.map(cat => (
                                            <Picker.Item key={cat.id} label={cat.name} value={String(cat.id)} color="#000" />
                                        ))}
                                    </Picker>
                                </View>
                            );
                        }

                        // Render TextInput bình thường cho các trường còn lại
                        return (
                            <TextInput
                                key={f.key}
                                label={f.label}
                                value={form[f.key]}
                                onChangeText={t => update(f.key, t)}
                                mode="outlined"
                                style={formStyles.input}
                                outlineColor="#3B5BDB"
                                activeOutlineColor="#3B5BDB"
                                keyboardType={f.keyboard || 'default'}
                                multiline={!!f.multiline}
                                numberOfLines={f.multiline ? 3 : 1}
                                autoCapitalize="none"
                            />
                        );
                    })}

                    <Button
                        mode="contained"
                        loading={loading}
                        disabled={loading}
                        onPress={handleSubmit}
                        style={formStyles.submitBtn}
                    >
                        {editJob ? 'LƯU THAY ĐỔI' : 'ĐĂNG TIN'}
                    </Button>
                    <Button mode="text" onPress={onClose} textColor="#888" style={{ marginTop: 8 }}>
                        Hủy
                    </Button>
                </ScrollView>
            </SafeAreaView>
        </Modal>
    );
};

// ─── Card hiển thị từng Job ───────────────────────────────────────────────────
const JobCard = ({ job, onEdit, onDelete }) => {
    
    // Badge approval status
    const approvalConfig = {
        pending:  { color: '#F59E0B', text: 'Chờ duyệt' },
        approved: { color: '#10B981', text: 'Đã duyệt' },
        rejected: { color: '#EF4444', text: 'Bị từ chối' },
    };
    const approval = approvalConfig[job.status] || approvalConfig.pending;

    return (
        <View style={cardStyles.card}>
            <View style={cardStyles.cardHeader}>
                <View style={{ flex: 1 }}>
                    <Text style={cardStyles.title}>{job.title}</Text>
                    <Text style={cardStyles.company}>{job.company?.name || '—'}</Text>
                </View>
                {/* Badge duyệt */}
                <View style={[cardStyles.badge, { backgroundColor: approval.color + '20' }]}>
                    <Text style={[cardStyles.badgeText, { color: approval.color }]}>
                        {approval.text}
                    </Text>
                </View>
            </View>

            {/* Hiện lý do từ chối nếu có */}
            {job.status === 'rejected' && job.rejection_reason ? (
                <Text style={{ color: '#EF4444', fontSize: 12, marginBottom: 6 }}>
                    Lý do: {job.rejection_reason}
                </Text>
            ) : null}

            {/* ... phần còn lại giữ nguyên */}
        </View>
    );
};

// ─── Screen chính ─────────────────────────────────────────────────────────────
export default function JobManagement() {
    const [jobs, setJobs]             = useState([]);
    const [loading, setLoading]       = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showForm, setShowForm]     = useState(false);
    const [editJob, setEditJob]       = useState(null);

    const fetchJobs = useCallback(async (isRefresh = false) => {
        try {
            isRefresh ? setRefreshing(true) : setLoading(true);
            const token = await AsyncStorage.getItem('token');
            const res   = await authApi(token).get(endpoints['my-jobs']);
            setJobs(res.data);
        } catch (ex) {
            console.error('Fetch jobs error:', ex.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchJobs(); }, [fetchJobs]);

    const handleEdit = (job) => {
        setEditJob(job);
        setShowForm(true);
    };

    const handleDelete = (job) => {
        Alert.alert(
            'Xác nhận xóa',
            `Bạn có chắc muốn xóa "${job.title}"?`,
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Xóa',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const token = await AsyncStorage.getItem('token');
                            await authApi(token).delete(endpoints['job-detail'](job.id));
                            setJobs(prev => prev.filter(j => j.id !== job.id));
                            Alert.alert('Đã xóa', 'Bài đăng đã được xóa.');
                        } catch {
                            Alert.alert('Lỗi', 'Không thể xóa bài đăng. Vui lòng thử lại!');
                        }
                    },
                },
            ]
        );
    };

    const handleOpenCreate = () => {
        setEditJob(null);
        setShowForm(true);
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={Colors.accent} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.root}>
            {/* Header */}
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
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={() => fetchJobs(true)} />
                }
            >
                {jobs.length === 0 ? (
                    <View style={listStyles.emptyWrap}>
                        <Text style={listStyles.emptyIcon}>📋</Text>
                        <Text style={listStyles.emptyText}>
                            Bạn chưa có bài đăng nào.{'\n'}Nhấn "+ Đăng tin" để bắt đầu!
                        </Text>
                    </View>
                ) : (
                    jobs.map(job => (
                        <JobCard
                            key={job.id}
                            job={job}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                        />
                    ))
                )}
            </ScrollView>

            <JobFormModal
                visible={showForm}
                onClose={() => setShowForm(false)}
                onSuccess={fetchJobs}
                editJob={editJob}
            />
        </SafeAreaView>
    );
}