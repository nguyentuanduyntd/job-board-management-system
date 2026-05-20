import React, { useState, useCallback, useEffect } from 'react';
import {
    View, Text, Image, ScrollView, TouchableOpacity,
    ActivityIndicator, Modal, TextInput, Alert, Linking,
    KeyboardAvoidingView, Platform // Thêm KeyboardAvoidingView và Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import Apis, { authApi, endpoints } from '../../configs/Apis';
import { useMyUser } from '../../configs/Contexts';
import styles from './Styles';
import axios from "axios";
import { Ionicons } from '@expo/vector-icons';

// ====== CÁC COMPONENT CON ĐƯỢC TÁCH RA NGOÀI ======

const DescriptionTab = ({ job }) => (
    <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>Thông tin chung</Text>
        <View style={styles.infoGrid}>
            <View style={styles.infoGridItem}>
                <Text style={styles.infoGridLabel}>Loại hình</Text>
                <Text style={styles.infoGridValue}>
                    {job.job_type === 'FT' ? 'Toàn thời gian'
                        : job.job_type === 'PT' ? 'Bán thời gian'
                            : job.job_type === 'RE' ? 'Từ xa'
                                : 'Freelance'}
                </Text>
            </View>
            <View style={styles.infoGridItem}>
                <Text style={styles.infoGridLabel}>Số lượng</Text>
                <Text style={styles.infoGridValue}>{job.quantity ?? 1} người</Text>
            </View>
            <View style={styles.infoGridItem}>
                <Text style={styles.infoGridLabel}>Ngày đăng</Text>
                <Text style={styles.infoGridValue}>
                    {new Date(job.created_at).toLocaleDateString('vi-VN')}
                </Text>
            </View>
            <View style={styles.infoGridItem}>
                <Text style={styles.infoGridLabel}>Kinh nghiệm</Text>
                <Text style={styles.infoGridValue}>
                    {job.experience_required ?? 'Không yêu cầu'}
                </Text>
            </View>
        </View>

        {job.skills?.length > 0 && (
            <>
                <Text style={styles.sectionTitle}>Kỹ năng yêu cầu</Text>
                <View style={styles.skillRow}>
                    {job.skills.map(skill => (
                        <View key={skill.id} style={styles.skillTag}>
                            <Text style={styles.skillText}>{skill.name ?? ''}</Text>
                        </View>
                    ))}
                </View>
            </>
        )}
        {!!job.description && (
            <>
                <Text style={styles.sectionTitle}>Mô tả công việc</Text>
                <Text style={styles.contentText}>{job.description}</Text>
            </>
        )}
        {!!job.requirements && (
            <>
                <Text style={styles.sectionTitle}>Yêu cầu ứng viên</Text>
                <Text style={styles.contentText}>{job.requirements}</Text>
            </>
        )}
        {!!job.benefits && (
            <>
                <Text style={styles.sectionTitle}>Chế độ đãi ngộ</Text>
                <Text style={styles.contentText}>{job.benefits}</Text>
            </>
        )}
        <View style={{ height: 100 }} />
    </ScrollView>
);

const CompanyTab = ({ job }) => (
    <ScrollView style={styles.content}>
        <Image
            source={{ uri: job.company?.logo_url || 'https://via.placeholder.com/80' }}
            style={styles.companyDetailLogo}
        />
        <Text style={styles.companyDetailName}>{job.company?.name ?? ''}</Text>

        {!!job.company?.address && (
            <View style={styles.companyInfoRow}>
                <Text style={styles.companyInfoIcon}></Text>
                <Text style={styles.companyInfoText}>{job.company.address}</Text>
            </View>
        )}
        {!!job.company?.website && (
            <View style={styles.companyInfoRow}>
                <Text style={styles.companyInfoIcon}></Text>
                <TouchableOpacity onPress={() => Linking.openURL(job.company.website)}>
                    <Text style={styles.websiteText}>{job.company.website}</Text>
                </TouchableOpacity>
            </View>
        )}
        {!!job.company?.description && (
            <>
                <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Giới thiệu công ty</Text>
                <Text style={styles.contentText}>{job.company.description}</Text>
            </>
        )}
        <View style={{ height: 100 }} />
    </ScrollView>
);

// ─── Apply Modal (ĐÃ ĐƯỢC TỐI ƯU CHỐNG CHE KHUẤT BÀN PHÍM) ─────────────────────
const ApplyModal = ({ visible, onClose, cvFile, setCvFile, coverLetter, setCoverLetter, onPickCV, onSubmit, submitting }) => (
    <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={onClose}
    >
        {/* ✅ FIX BÀN PHÍM CHE KHUẤT: Bọc toàn bộ ruột Modal bằng KeyboardAvoidingView */}
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                    {/* Thêm ScrollView để nội dung modal có thể cuộn linh hoạt khi bàn phím đẩy lên */}
                    <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="always">
                        <Text style={styles.modalTitle}>Nộp đơn ứng tuyển</Text>

                        {/* ── Tải CV lên ── */}
                        <Text style={styles.modalLabel}>
                            Tải CV lên <Text style={{ color: '#E53E3E' }}>*</Text>
                        </Text>

                        <TouchableOpacity
                            style={[
                                styles.cvUploadBtn,
                                cvFile && styles.cvUploadBtnSelected,
                            ]}
                            onPress={onPickCV}
                        >
                            <Text style={styles.cvUploadIcon}><Ionicons name="attach" size={14} color="#6B7280" style={{ marginRight: 8 }} /></Text>
                            <Text
                                style={[
                                    styles.cvUploadText,
                                    cvFile && styles.cvUploadTextSelected,
                                ]}
                                numberOfLines={1}
                                ellipsizeMode="middle"
                            >
                                {cvFile ? cvFile.name : 'Chọn file CV (PDF, DOC, DOCX · tối đa 5MB)'}
                            </Text>
                            {cvFile && (
                                <TouchableOpacity
                                    onPress={() => setCvFile(null)}
                                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                >
                                    <Text style={styles.cvRemoveIcon}>✕</Text>
                                </TouchableOpacity>
                            )}
                        </TouchableOpacity>

                        {/* ── Thư xin việc (tùy chọn) ── */}
                        <Text style={styles.modalLabel}>Thư xin việc (tùy chọn)</Text>
                        <TextInput
                            style={styles.modalInput}
                            placeholder="Viết thư xin việc của bạn..."
                            placeholderTextColor="#9CA3AF"
                            value={coverLetter}
                            onChangeText={setCoverLetter}
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                        />

                        {/* ── Submit & Cancel Buttons ── */}
                        <TouchableOpacity
                            style={[styles.submitBtn, submitting && { opacity: 0.7 }, { marginTop: 16 }]}
                            onPress={onSubmit}
                            disabled={submitting}
                        >
                            {submitting
                                ? <ActivityIndicator color="#fff" />
                                : <Text style={styles.submitBtnText}>Xác nhận nộp đơn</Text>
                            }
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.cancelBtn}
                            onPress={onClose}
                        >
                            <Text style={styles.cancelBtnText}>Huỷ</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </View>
        </KeyboardAvoidingView>
    </Modal>
);

// ====== COMPONENT CHÍNH ======

export default function JobDetail({ route, navigation }) {
    const { jobId } = route.params;
    const user = useMyUser();

    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('description')
    const [showApplyModal, setShowApplyModal] = useState(false);
    const [coverLetter, setCoverLetter] = useState('');
    const [cvFile, setCvFile] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [hasApplied, setHasApplied] = useState(false);

    //Load job detail
    const loadJob = async () => {
        try {
            setLoading(true);
            let res = await Apis.get(endpoints['job-detail'](jobId));
            setJob(res.data);
        } catch (ex) {
            console.error('Loading job error:', ex.message);
            Alert.alert('Lỗi', 'Không thể tải thông tin việc làm');
        } finally {
            setLoading(false);
        }
    };

    //Kiểm tra đã ứng tuyển chưa
    const checkApplied = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) return; // Nếu không có token tức là chưa đăng nhập, bỏ qua không check

            const url = endpoints['check-applied']?.(jobId) ?? `${endpoints['applications']}?job_id=${jobId}`;
            let res = await authApi(token).get(url); // Dùng token từ AsyncStorage

            if (typeof res.data?.has_applied === 'boolean') {
                setHasApplied(res.data.has_applied);
            } else {
                const apps = res.data?.results ?? res.data ?? [];
                setHasApplied(Array.isArray(apps) && apps.length > 0);
            }
        } catch (ex) {
            const status = ex.response?.status;
            if (status === 401) {
                console.warn('checkApplied: token het han');
            } else if (status === 403) {
                console.warn('checkApplied: khong co quyen');
            } else {
                console.warn('checkApplied loi, bo qua:', status, ex.message);
            }
        }
    };

    useEffect(() => {
        loadJob();
        checkApplied();
    }, [jobId]);

    // Chọn file CV từ thiết bị
    const handlePickCV = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf',
                    'application/msword',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
                copyToCacheDirectory: true,
            });

            if (result.canceled) return;

            const file = result.assets[0];
            if (file.size && file.size > 5 * 1024 * 1024) {
                Alert.alert('Lỗi', 'File CV không được vượt quá 5MB');
                return;
            }
            setCvFile(file);
        } catch (ex) {
            console.error('Pick CV error:', ex.message);
            Alert.alert('Lỗi', 'Không thể chọn file');
        }
    };

    const handleApply = async () => {
        const token = await AsyncStorage.getItem('token');

        // Nếu không tìm thấy token trong máy, nghĩa là thực sự chưa đăng nhập
        if (!token || !user) {
            Alert.alert(
                'Thông báo',
                'Vui lòng đăng nhập tài khoản Ứng viên để ứng tuyển',
                [
                    { text: 'Hủy', style: 'cancel' },
                    {
                        text: 'Đăng nhập',
                        onPress: () => {
                            // Vì màn hình Login nằm trong Tab 'Tài khoản', ta chuyển hướng user sang Tab đó để họ đăng nhập mượt mà không bị sập app
                            navigation.navigate('Tài khoản');
                        }
                    }
                ]
            );
            return;
        }

        if (!cvFile) {
            Alert.alert('Thông báo', 'Vui lòng tải lên CV của bạn');
            return;
        }
        setSubmitting(true);
        try {
            let formData = new FormData();
            formData.append('job_id', jobId);
            formData.append('cv_file', {
                uri: cvFile.uri,
                name: cvFile.name,
                type: cvFile.mimeType ?? 'application/octet-stream',
            });
            if (coverLetter.trim()) {
                formData.append('cover_letter', coverLetter.trim());
            }

            // Gửi request kèm token chuẩn từ AsyncStorage
            await authApi(token).post(endpoints['applications'], formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setHasApplied(true);
            setShowApplyModal(false);
            Alert.alert('Thành công', 'Nộp đơn ứng tuyển thành công!');
        } catch (ex) {
            const errMsg = ex.response?.data ? Object.values(ex.response.data).flat().join('\n') : 'Có lỗi xảy ra';
            Alert.alert('Lỗi', errMsg);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#3B5BDB" />
            </SafeAreaView>
        );
    }

    if (!job) return null;

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView stickyHeaderIndices={[1]} showsHorizontalScrollIndicator={false}>

                {/*Header*/}
                <View style={styles.header}>
                    {job.is_featured && (
                        <View>
                            <Text style={styles.featuredBadgeText}>Tin nổi bật</Text>
                        </View>
                    )}
                    <Text style={styles.jobTitle}>{job.title ?? ''}</Text>

                    {/* Company */}
                    <View style={styles.companyRow}>
                        <Image
                            source={{ uri: job.company?.logo_url || 'https://via.placeholder.com/48' }}
                            style={styles.companyLogo}
                        />
                        <Text style={styles.companyName}>{job.company?.name ?? ''}</Text>
                    </View>

                    {/* Salary */}
                    <View style={styles.infoRow}>
                        <Ionicons name="cash" size={14} color="#6B7280" style={{ marginRight: 8 }} />
                        <View>
                            <Text style={styles.infoLabel}>Mức lương: </Text>
                            <Text style={styles.infoValueBlue}>
                                {job.salary_min && job.salary_max
                                    ? `${(job.salary_min / 1e6).toFixed(0)}–${(job.salary_max / 1e6).toFixed(0)} triệu`
                                    : 'Thỏa thuận'}
                            </Text>
                        </View>
                    </View>

                    {/* Deadline */}
                    {!!job.deadline && (
                        <View style={styles.infoRow}>
                            <Ionicons name="calendar" size={14} color="#6B7280" style={{ marginRight: 8 }} />
                            <View>
                                <Text style={styles.infoLabel}>Hạn nộp: </Text>
                                <Text style={styles.infoValue}>
                                    {new Date(job.deadline).toLocaleDateString('vi-VN')}
                                </Text>
                            </View>
                        </View>
                    )}

                    {/* Location */}
                    {!!job.location && (
                        <View style={styles.infoRow}>
                            <Ionicons name="location" size={14} color="#6B7280" style={{ marginRight: 8 }} />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.infoLabel}>Địa điểm: </Text>
                                <Text style={styles.infoValue}>{job.location}</Text>
                            </View>
                        </View>
                    )}

                    {/* Category */}
                    {!!job.category?.name && (
                        <View style={styles.infoRow}>
                            <Ionicons name="briefcase" size={14} color="#6B7280" style={{ marginRight: 8 }} />
                            <View>
                                <Text style={styles.infoLabel}>Ngành nghề: </Text>
                                <Text style={styles.infoValue}>{job.category.name}</Text>
                            </View>
                        </View>
                    )}
                </View>

                {/* Tabs — sticky */}
                <View style={styles.tabContainer}>
                    {[
                        { key: 'description', label: 'Mô tả' },
                        { key: 'company', label: 'Công ty' },
                    ].map(tab => (
                        <TouchableOpacity
                            key={tab.key}
                            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
                            onPress={() => setActiveTab(tab.key)}
                        >
                            <Text style={[
                                styles.tabText,
                                activeTab === tab.key && styles.tabTextActive
                            ]}>
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Tab content */}
                {activeTab === 'description' ? <DescriptionTab job={job} /> : <CompanyTab job={job} />}

            </ScrollView>

            {/* Apply button */}
            <View style={styles.applyContainer}>
                <TouchableOpacity
                    style={[styles.applyBtn, hasApplied && styles.applyBtnDisabled]}
                    onPress={() => !hasApplied && setShowApplyModal(true)}
                    disabled={hasApplied}
                >
                    <Text style={styles.applyBtnText}>
                        {hasApplied ? ' Đã ứng tuyển' : 'Nộp đơn ứng tuyển'}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Modal Nộp Đơn */}
            <ApplyModal
                visible={showApplyModal}
                onClose={() => setShowApplyModal(false)}
                cvFile={cvFile}
                setCvFile={setCvFile}
                coverLetter={coverLetter}
                setCoverLetter={setCoverLetter}
                onPickCV={handlePickCV}
                onSubmit={handleApply}
                submitting={submitting}
            />
        </SafeAreaView>
    );
}