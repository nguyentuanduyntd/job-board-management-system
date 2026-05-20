import React, { useState, useCallback, useEffect } from 'react';
import {
    View,Text,ScrollView,TouchableOpacity,ActivityIndicator,RefreshControl,
    Modal,TextInput,Alert,StyleSheet,Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi, endpoints } from '../../configs/Apis';
import { Colors as C, approvalStyles as s } from './Styles';
import { Ionicons } from '@expo/vector-icons';

// ─── Rejection Modal ──────────────────────────────────────────────────────────
const RejectModal = ({ visible, jobTitle, onConfirm, onCancel, loading }) => {
    const [reason, setReason] = useState('');
 
    useEffect(() => {
        if (!visible) setReason('');
    }, [visible]);
 
    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
            <View style={s.overlay}>
                <View style={s.modalCard}>
                    <View style={s.modalHeader}>
                        <View style={s.modalIconWrap}>
                            <Text style={s.modalIcon}>✕</Text>
                        </View>
                        <Text style={s.modalTitle}>Từ chối bài đăng</Text>
                        <Text style={s.modalSub} numberOfLines={2}>"{jobTitle}"</Text>
                    </View>
 
                    <Text style={s.modalLabel}>Lý do từ chối *</Text>
                    <TextInput
                        style={s.modalInput}
                        placeholder="Nhập lý do để thông báo cho nhà tuyển dụng..."
                        placeholderTextColor={C.textMuted}
                        value={reason}
                        onChangeText={setReason}
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                    />
 
                    <View style={s.modalActions}>
                        <TouchableOpacity style={s.cancelBtn} onPress={onCancel}>
                            <Text style={s.cancelBtnText}>Hủy</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[s.rejectConfirmBtn, (!reason.trim() || loading) && { opacity: 0.5 }]}
                            onPress={() => reason.trim() && onConfirm(reason.trim())}
                            disabled={!reason.trim() || loading}
                        >
                            {loading
                                ? <ActivityIndicator size="small" color="#fff" />
                                : <Text style={s.rejectConfirmBtnText}>Xác nhận từ chối</Text>
                            }
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};
 
// ─── Job Detail Modal ─────────────────────────────────────────────────────────
const JobDetailModal = ({ visible, job, onClose, onApprove, onReject, actionLoading }) => {
    if (!job) return null;
 
    const InfoRow = ({ label, value }) => (
        value ? (
            <View style={s.infoRow}>
                <Text style={s.infoLabel}>{label}</Text>
                <Text style={s.infoValue}>{value}</Text>
            </View>
        ) : null
    );
 
    const formatSalary = (min, max) => {
        const fmt = v => v ? `${(v / 1e6).toFixed(0)}M` : null;
        if (fmt(min) && fmt(max)) return `${fmt(min)} – ${fmt(max)} VNĐ`;
        if (fmt(min)) return `Từ ${fmt(min)} VNĐ`;
        if (fmt(max)) return `Đến ${fmt(max)} VNĐ`;
        return 'Thỏa thuận';
    };
 
    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={s.detailOverlay}>
                <View style={s.detailCard}>
                    {/* Handle bar */}
                    <View style={s.handleBar} />
 
                    {/* Header */}
                    <View style={s.detailHeader}>
                        <View style={{ flex: 1 }}>
                            <Text style={s.detailTitle} numberOfLines={2}>{job.title}</Text>
                            <Text style={s.detailCompany}>{job.company?.name || '—'}</Text>
                        </View>
                        <TouchableOpacity style={s.closeBtn} onPress={onClose}>
                            <Text style={s.closeBtnText}>✕</Text>
                        </TouchableOpacity>
                    </View>
 
                    <ScrollView style={s.detailScroll} showsVerticalScrollIndicator={false}>
                        {/* Info grid */}
                        <View style={s.infoGrid}>
                            <InfoRow 
                                icon={<Ionicons name="location" size={14} color="#6B7280" />} 
                                label="Địa điểm" 
                                value={job.location} 
                            />
                            <InfoRow 
                                icon={<Ionicons name="cash" size={14} color="#6B7280" />} 
                                label="Lương" 
                                value={formatSalary(job.salary_min, job.salary_max)} 
                            />
                            <InfoRow 
                                icon={<Ionicons name="calendar" size={14} color="#6B7280" />} 
                                label="Hạn nộp" 
                                value={job.deadline} 
                            />
                            <InfoRow 
                                icon={<Ionicons name="people" size={14} color="#6B7280" />} 
                                label="Số lượng" 
                                value={job.quantity ? `${job.quantity} người` : null} 
                            />
                            <InfoRow 
                                icon={<Ionicons name="time" size={14} color="#6B7280" />} 
                                label="Loại hình" 
                                value={{ FT: 'Full-time', PT: 'Part-time', RE: 'Remote', FR: 'Freelance' }[job.job_type]} 
                            />
                            <InfoRow 
                                icon={<Ionicons name="business" size={14} color="#6B7280" />} 
                                label="Địa chỉ cty" 
                                value={job.company?.address} 
                            />
                        </View>
 
                        {/* Skills */}
                        {job.skills?.length > 0 && (
                            <View style={s.detailSection}>
                                <Text style={s.detailSectionTitle}>Kỹ năng yêu cầu</Text>
                                <View style={s.skillWrap}>
                                    {job.skills.map(sk => (
                                        <View key={sk.id} style={s.skillChip}>
                                            <Text style={s.skillChipText}>{sk.name}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}
 
                        {/* Description */}
                        {job.description ? (
                            <View style={s.detailSection}>
                                <Text style={s.detailSectionTitle}>Mô tả công việc</Text>
                                <Text style={s.detailBody}>{job.description}</Text>
                            </View>
                        ) : null}
 
                        {/* Requirements */}
                        {job.requirements ? (
                            <View style={s.detailSection}>
                                <Text style={s.detailSectionTitle}>Yêu cầu</Text>
                                <Text style={s.detailBody}>{job.requirements}</Text>
                            </View>
                        ) : null}
 
                        {/* Benefits */}
                        {job.benefits ? (
                            <View style={s.detailSection}>
                                <Text style={s.detailSectionTitle}>Quyền lợi</Text>
                                <Text style={s.detailBody}>{job.benefits}</Text>
                            </View>
                        ) : null}
 
                        <View style={{ height: 24 }} />
                    </ScrollView>
 
                    {/* Action buttons — only show for pending */}
                    {job.status === 'pending' && (
                        <View style={s.detailActions}>
                            <TouchableOpacity
                                style={s.detailRejectBtn}
                                onPress={() => onReject(job)}
                                disabled={actionLoading}
                            >
                                <Text style={s.detailRejectBtnText}> Từ chối</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[s.detailApproveBtn, actionLoading && { opacity: 0.6 }]}
                                onPress={() => onApprove(job)}
                                disabled={actionLoading}
                            >
                                {actionLoading
                                    ? <ActivityIndicator size="small" color="#fff" />
                                    : <Text style={s.detailApproveBtnText}> Duyệt bài</Text>
                                }
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>
        </Modal>
    );
};
 
// ─── Job Card ─────────────────────────────────────────────────────────────────
const JobCard = ({ job, onPress, onApprove, onReject, actionLoading }) => {
    const isPending  = job.status === 'pending';
    const isApproved = job.status === 'approved';
 
    const statusConfig = {
        pending:  { label: 'Chờ duyệt', color: C.pending,  bg: C.pendingBg,  bdr: C.pendingBdr },
        approved: { label: 'Đã duyệt',  color: C.approved, bg: C.approvedBg, bdr: '#BBF7D0' },
        rejected: { label: 'Đã từ chối',color: C.rejected, bg: C.rejectedBg, bdr: '#FECACA' },
    };
    const st = statusConfig[job.status] || statusConfig.pending;
 
    const timeAgo = (dateStr) => {
        if (!dateStr) return '';
        const diff = Date.now() - new Date(dateStr).getTime();
        const h = Math.floor(diff / 3600000);
        if (h < 1) return 'Vừa xong';
        if (h < 24) return `${h} giờ trước`;
        return `${Math.floor(h / 24)} ngày trước`;
    };
 
    return (
        <TouchableOpacity style={s.card} onPress={() => onPress(job)} activeOpacity={0.75}>
            {/* Top row */}
            <View style={s.cardTop}>
                <View style={s.companyLogoPlaceholder}>
                    <Text style={s.companyLogoText}>
                        {(job.company?.name || '?')[0].toUpperCase()}
                    </Text>
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={s.cardTitle} numberOfLines={1}>{job.title}</Text>
                    <Text style={s.cardCompany} numberOfLines={1}>{job.company?.name || '—'}</Text>
                </View>
                <View style={[s.statusBadge, { backgroundColor: st.bg, borderColor: st.bdr }]}>
                    <Text style={[s.statusBadgeText, { color: st.color }]}>{st.label}</Text>
                </View>
            </View>
 
            {/* Meta */}
            <View style={s.cardMeta}>
                {job.location ? <Text style={s.metaTag}><Ionicons name="location" size={16} color="#3d3c3a" style={{ marginRight: 6 }} /> {job.location}</Text> : null}
                {job.job_type ? (
                    <Text style={s.metaTag}>
                        {{ FT: 'Full-time', PT: 'Part-time', RE: 'Remote', FR: 'Freelance' }[job.job_type]}
                    </Text>
                ) : null}
                {job.deadline ? <Text style={s.metaTag}><Ionicons name="calendar" size={16} color="#3d3c3a" style={{ marginRight: 6 }} /> {job.deadline}</Text> : null}
            </View>
 
            {/* Footer */}
            <View style={s.cardFooter}>
                <Text style={s.cardTime}>{timeAgo(job.created_at)}</Text>
 
                {/* Quick actions for pending */}
                {isPending && (
                    <View style={s.quickActions}>
                        <TouchableOpacity
                            style={s.quickReject}
                            onPress={(e) => { e.stopPropagation?.(); onReject(job); }}
                            disabled={actionLoading === job.id}
                        >
                            <Text style={s.quickRejectText}>Từ chối</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[s.quickApprove, actionLoading === job.id && { opacity: 0.6 }]}
                            onPress={(e) => { e.stopPropagation?.(); onApprove(job); }}
                            disabled={actionLoading === job.id}
                        >
                            {actionLoading === job.id
                                ? <ActivityIndicator size="small" color="#fff" />
                                : <Text style={s.quickApproveText}>Duyệt</Text>
                            }
                        </TouchableOpacity>
                    </View>
                )}
            </View>
 
            {/* Rejection reason */}
            {job.status === 'rejected' && job.rejection_reason ? (
                <View style={s.rejectionNote}>
                    <Text style={s.rejectionNoteLabel}>Lý do từ chối:</Text>
                    <Text style={s.rejectionNoteText} numberOfLines={2}>{job.rejection_reason}</Text>
                </View>
            ) : null}
        </TouchableOpacity>
    );
};
 
// ─── Filter Tabs ──────────────────────────────────────────────────────────────
const TABS = [
    { key: 'pending',  label: 'Chờ duyệt', color: C.pending  },
    { key: 'approved', label: 'Đã duyệt',  color: C.approved },
    { key: 'rejected', label: 'Đã từ chối',color: C.rejected },
    { key: 'all',      label: 'Tất cả',    color: C.accent   },
];
 
// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function AdminJobApproval() {
    const [jobs, setJobs]                   = useState([]);
    const [loading, setLoading]             = useState(true);
    const [refreshing, setRefreshing]       = useState(false);
    const [activeTab, setActiveTab]         = useState('pending');
    const [selectedJob, setSelectedJob]     = useState(null);
    const [showDetail, setShowDetail]       = useState(false);
    const [showReject, setShowReject]       = useState(false);
    const [rejectTarget, setRejectTarget]   = useState(null);
    const [actionLoading, setActionLoading] = useState(null); // job.id hoặc 'modal'
 
    // ── Fetch ──────────────────────────────────────────────────────────────────
    const fetchJobs = useCallback(async (isRefresh = false) => {
        try {
            isRefresh ? setRefreshing(true) : setLoading(true);
            const token = await AsyncStorage.getItem('token');
            // Fetch tất cả jobs, filter phía client để hỗ trợ switch tab không cần refetch
            const res = await authApi(token).get(endpoints['admin-jobs']);
            setJobs(res.data);
        } catch (ex) {
            console.error('Fetch admin jobs error:', ex.message);
            Alert.alert('Lỗi', 'Không thể tải danh sách bài đăng.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);
 
    useEffect(() => { fetchJobs(); }, [fetchJobs]);
 
    // ── Approve ────────────────────────────────────────────────────────────────
    const handleApprove = useCallback(async (job) => {
        try {
            setActionLoading(job.id);
            const token = await AsyncStorage.getItem('token');
            await authApi(token).patch(endpoints['admin-job-approve'](job.id));
            setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: 'approved' } : j));
            if (showDetail) setSelectedJob(prev => prev ? { ...prev, status: 'approved' } : prev);
            Alert.alert('✓ Đã duyệt', `Bài đăng "${job.title}" đã được duyệt và hiển thị trên app.`);
        } catch (ex) {
            const msg = ex?.response?.data?.error || 'Không thể duyệt bài đăng.';
            Alert.alert('Lỗi', msg);
        } finally {
            setActionLoading(null);
        }
    }, [showDetail]);
 
    // ── Open reject modal ──────────────────────────────────────────────────────
    const handleOpenReject = useCallback((job) => {
        setRejectTarget(job);
        setShowDetail(false);
        setShowReject(true);
    }, []);
 
    // ── Confirm reject ─────────────────────────────────────────────────────────
    const handleConfirmReject = useCallback(async (reason) => {
        if (!rejectTarget) return;
        try {
            setActionLoading('modal');
            const token = await AsyncStorage.getItem('token');
            await authApi(token).patch(endpoints['admin-job-reject'](rejectTarget.id), { reason });
            setJobs(prev => prev.map(j =>
                j.id === rejectTarget.id
                    ? { ...j, status: 'rejected', rejection_reason: reason }
                    : j
            ));
            setShowReject(false);
            setRejectTarget(null);
            Alert.alert('Đã từ chối', `Bài đăng "${rejectTarget.title}" đã bị từ chối.`);
        } catch (ex) {
            const msg = ex?.response?.data?.error || 'Không thể từ chối bài đăng.';
            Alert.alert('Lỗi', msg);
        } finally {
            setActionLoading(null);
        }
    }, [rejectTarget]);
 
    // ── Filtered list ──────────────────────────────────────────────────────────
    const filtered = activeTab === 'all' ? jobs : jobs.filter(j => j.status === activeTab);
 
    const countByStatus = (st) => jobs.filter(j => j.status === st).length;
 
    // ── Empty state ────────────────────────────────────────────────────────────
    const EmptyState = () => (
        <View style={s.empty}>
            <Text style={s.emptyIcon}>
                {activeTab === 'pending' 
                    ? <Ionicons name="sparkles" size={48} color="#F59E0B" /> 
                    : activeTab === 'approved' 
                    ? <Ionicons name="checkmark-circle-outline" size={48} color="#10B981" /> 
                    : <Ionicons name="folder-open-outline" size={48} color="#9CA3AF" />
                }
            </Text>
            <Text style={s.emptyTitle}>
                {activeTab === 'pending' ? 'Không có bài chờ duyệt' :
                 activeTab === 'approved' ? 'Chưa có bài được duyệt' : 'Chưa có bài từ chối'}
            </Text>
            <Text style={s.emptyDesc}>
                {activeTab === 'pending' ? 'Tất cả bài đăng đã được xử lý.' : 'Danh sách trống.'}
            </Text>
        </View>
    );
 
    if (loading) {
        return (
            <View style={s.centered}>
                <ActivityIndicator size="large" color={C.accent} />
                <Text style={[s.emptyDesc, { marginTop: 12 }]}>Đang tải danh sách bài đăng...</Text>
            </View>
        );
    }
 
    return (
        <SafeAreaView style={s.root}>
            {/* ── Header ── */}
            <View style={s.header}>
                <View>
                    <Text style={s.headerTitle}>Duyệt bài đăng</Text>
                    <Text style={s.headerSub}>
                        {countByStatus('pending')} bài đang chờ duyệt
                    </Text>
                </View>
                <TouchableOpacity style={s.refreshBtn} onPress={() => fetchJobs(true)}>
                    <Text style={s.refreshBtnText}>↻</Text>
                </TouchableOpacity>
            </View>
 
            {/* ── Filter Tabs ── */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={s.tabScroll}
                contentContainerStyle={s.tabContainer}
            >
                {TABS.map(tab => {
                    const count = tab.key === 'all' ? jobs.length : countByStatus(tab.key);
                    const isActive = activeTab === tab.key;
                    return (
                        <TouchableOpacity
                            key={tab.key}
                            style={[s.tab, isActive && { borderBottomColor: tab.color, borderBottomWidth: 2 }]}
                            onPress={() => setActiveTab(tab.key)}
                        >
                            <Text style={[s.tabText, isActive && { color: tab.color, fontWeight: '600' }]}>
                                {tab.label}
                            </Text>
                            {count > 0 && (
                                <View style={[s.tabBadge, { backgroundColor: isActive ? tab.color : C.border }]}>
                                    <Text style={[s.tabBadgeText, { color: isActive ? '#fff' : C.textSec }]}>
                                        {count}
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
 
            {/* ── List ── */}
            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={s.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={() => fetchJobs(true)} />
                }
            >
                {filtered.length === 0 ? <EmptyState /> : (
                    filtered.map(job => (
                        <JobCard
                            key={job.id}
                            job={job}
                            onPress={(j) => { setSelectedJob(j); setShowDetail(true); }}
                            onApprove={handleApprove}
                            onReject={handleOpenReject}
                            actionLoading={actionLoading}
                        />
                    ))
                )}
                <View style={{ height: 32 }} />
            </ScrollView>
 
            {/* ── Detail Modal ── */}
            <JobDetailModal
                visible={showDetail}
                job={selectedJob}
                onClose={() => setShowDetail(false)}
                onApprove={(j) => { setShowDetail(false); handleApprove(j); }}
                onReject={(j) => handleOpenReject(j)}
                actionLoading={actionLoading !== null && actionLoading !== 'modal'}
            />
 
            {/* ── Reject Modal ── */}
            <RejectModal
                visible={showReject}
                jobTitle={rejectTarget?.title || ''}
                onConfirm={handleConfirmReject}
                onCancel={() => { setShowReject(false); setRejectTarget(null); }}
                loading={actionLoading === 'modal'}
            />
        </SafeAreaView>
    );
}
 