import React, { useState, useCallback, useEffect } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
    RefreshControl, Modal, Alert, TextInput, KeyboardAvoidingView, Platform, FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi, endpoints } from '../../configs/Apis';
import { Colors as C, approvalStyles as s } from './Styles';
import usePagination from '../../hooks/usePagination';
import Paginator from '../../components/Paginator';

// ─── Reject Modal ─────────────────────────────────────────────────────────────
const RejectModal = ({ visible, employerName, onConfirm, onCancel, loading }) => {
    const [reason, setReason] = useState('');
    useEffect(() => { if (!visible) setReason(''); }, [visible]);

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <View style={s.overlay}>
                    <View style={s.modalCard}>
                        <View style={s.modalHeader}>
                            <View style={s.modalIconWrap}><Text style={s.modalIcon}>✕</Text></View>
                            <Text style={s.modalTitle}>Từ chối tài khoản</Text>
                            <Text style={s.modalSub} numberOfLines={2}>"{employerName}"</Text>
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
                                {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={s.rejectConfirmBtnText}>Xác nhận từ chối</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

// ─── Employer Detail Modal ────────────────────────────────────────────────────
const EmployerDetailModal = ({ visible, employer, onClose, onApprove, onReject, actionLoading }) => {
    if (!employer) return null;
    const userInfo = employer.user || {};
    const companyInfo = employer.company || {};

    const InfoRow = ({ label, value }) => value ? (
        <View style={s.infoRow}>
            <Text style={s.infoLabel}>{label}</Text>
            <Text style={s.infoValue}>{value}</Text>
        </View>
    ) : null;

    const isPending = !employer.is_verified && !employer.is_rejected;

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={s.detailOverlay}>
                <View style={s.detailCard}>
                    <View style={s.handleBar} />
                    <View style={s.detailHeader}>
                        <View style={{ flex: 1 }}>
                            <Text style={s.detailTitle} numberOfLines={2}>{companyInfo.name || 'Chưa thiết lập tên công ty'}</Text>
                            <Text style={s.detailCompany}>Đại diện: {userInfo.username || '—'}</Text>
                        </View>
                        <TouchableOpacity style={s.closeBtn} onPress={onClose}><Text style={s.closeBtnText}>✕</Text></TouchableOpacity>
                    </View>
                    <ScrollView style={s.detailScroll} showsVerticalScrollIndicator={false}>
                        <View style={s.infoGrid}>
                            <InfoRow label="Email liên hệ" value={userInfo.email} />
                            <InfoRow label="Số điện thoại" value={userInfo.phone} />
                            <InfoRow label="Chức vụ đại diện" value={employer.position} />
                            <InfoRow label="Website" value={companyInfo.website} />
                            <InfoRow label="Trụ sở công ty" value={companyInfo.address} />
                        </View>
                        {employer.bio && (
                            <View style={s.detailSection}>
                                <Text style={s.detailSectionTitle}>Giới thiệu nhà tuyển dụng</Text>
                                <Text style={s.detailBody}>{employer.bio}</Text>
                            </View>
                        )}
                        {companyInfo.description && (
                            <View style={s.detailSection}>
                                <Text style={s.detailSectionTitle}>Mô tả công ty</Text>
                                <Text style={s.detailBody}>{companyInfo.description}</Text>
                            </View>
                        )}
                        {employer.is_rejected && employer.rejection_reason && (
                            <View style={s.detailSection}>
                                <Text style={[s.detailSectionTitle, { color: C.rejected }]}>Lý do từ chối</Text>
                                <Text style={s.detailBody}>{employer.rejection_reason}</Text>
                            </View>
                        )}
                        <View style={{ height: 24 }} />
                    </ScrollView>
                    {isPending && (
                        <View style={s.detailActions}>
                            <TouchableOpacity style={s.detailRejectBtn} onPress={() => onReject(employer)} disabled={actionLoading}>
                                <Text style={s.detailRejectBtnText}>Từ chối</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[s.detailApproveBtn, actionLoading && { opacity: 0.6 }]} onPress={() => onApprove(employer)} disabled={actionLoading}>
                                {actionLoading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={s.detailApproveBtnText}>Duyệt tài khoản</Text>}
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>
        </Modal>
    );
};

// ─── Employer Card ────────────────────────────────────────────────────────────
const EmployerCard = ({ employer, onPress, onApprove, onReject, actionLoading }) => {
    const userInfo = employer.user || {};
    const companyInfo = employer.company || {};
    const isPending = !employer.is_verified && !employer.is_rejected;
    const isApproved = employer.is_verified;
    const isRejected = employer.is_rejected && !employer.is_verified;

    const statusConfig = {
        pending: { label: 'Chờ duyệt', color: C.pending, bg: C.pendingBg, bdr: C.pendingBdr },
        approved: { label: 'Đã duyệt', color: C.approved, bg: C.approvedBg, bdr: '#BBF7D0' },
        rejected: { label: 'Đã từ chối', color: C.rejected, bg: C.rejectedBg, bdr: '#FECACA' },
    };
    const st = isApproved ? statusConfig.approved : isRejected ? statusConfig.rejected : statusConfig.pending;

    const timeAgo = (dateStr) => {
        if (!dateStr) return '';
        const diff = Date.now() - new Date(dateStr).getTime();
        const h = Math.floor(diff / 3600000);
        if (h < 1) return 'Vừa xong';
        if (h < 24) return `${h} giờ trước`;
        return `${Math.floor(h / 24)} ngày trước`;
    };

    return (
        <TouchableOpacity style={s.card} onPress={() => onPress(employer)} activeOpacity={0.75}>
            <View style={s.cardTop}>
                <View style={s.companyLogoPlaceholder}>
                    <Text style={s.companyLogoText}>{(companyInfo.name || userInfo.username || '?')[0].toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={s.cardTitle} numberOfLines={1}>{companyInfo.name || 'Chưa cập nhật tên công ty'}</Text>
                    <Text style={s.cardCompany} numberOfLines={1}>@{userInfo.username || '—'}</Text>
                </View>
                <View style={[s.statusBadge, { backgroundColor: st.bg, borderColor: st.bdr }]}>
                    <Text style={[s.statusBadgeText, { color: st.color }]}>{st.label}</Text>
                </View>
            </View>
            <View style={s.cardMeta}>
                {userInfo.email && <Text style={s.metaTag}>✉ {userInfo.email}</Text>}
                {employer.position && <Text style={s.metaTag}>💼 {employer.position}</Text>}
                {companyInfo.address && <Text style={s.metaTag} numberOfLines={1}>📍 {companyInfo.address}</Text>}
            </View>
            <View style={s.cardFooter}>
                <Text style={s.cardTime}>{timeAgo(employer.created_at)}</Text>
                {isPending && (
                    <View style={s.quickActions}>
                        <TouchableOpacity style={s.quickReject} onPress={() => onReject(employer)} disabled={actionLoading === employer.id}>
                            <Text style={s.quickRejectText}>Từ chối</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[s.quickApprove, actionLoading === employer.id && { opacity: 0.6 }]} onPress={() => onApprove(employer)} disabled={actionLoading === employer.id}>
                            {actionLoading === employer.id ? <ActivityIndicator size="small" color="#fff" /> : <Text style={s.quickApproveText}>Duyệt</Text>}
                        </TouchableOpacity>
                    </View>
                )}
            </View>
            {isRejected && employer.rejection_reason && (
                <View style={s.rejectionNote}>
                    <Text style={s.rejectionNoteLabel}>Lý do từ chối:</Text>
                    <Text style={s.rejectionNoteText} numberOfLines={2}>{employer.rejection_reason}</Text>
                </View>
            )}
        </TouchableOpacity>
    );
};

// ─── Filter Tabs ──────────────────────────────────────────────────────────────
const TABS = [
    { key: 'pending', label: 'Chờ duyệt', color: C.pending },
    { key: 'approved', label: 'Đã duyệt', color: C.approved },
    { key: 'rejected', label: 'Đã từ chối', color: C.rejected },
    { key: 'all', label: 'Tất cả', color: C.accent },
];

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function AdminUpdateStatusEmployer() {
    const [activeTab, setActiveTab] = useState('pending');
    const [selectedEmployer, setSelectedEmployer] = useState(null);
    const [showDetail, setShowDetail] = useState(false);
    const [showReject, setShowReject] = useState(false);
    const [rejectTarget, setRejectTarget] = useState(null);
    const [actionLoading, setActionLoading] = useState(null);

    // Sử dụng extraParams động dựa trên activeTab hiện tại để tích hợp phân trang từ Server
    const extraParams = activeTab !== 'all' ? `&status=${activeTab}` : '';
    
    const { data: employers, setData: setEmployers, loading, refreshing, page, totalPages, count, load, refresh } =
        usePagination(endpoints['admin-employers'], 10, extraParams);

    // Đồng bộ lại dữ liệu mỗi khi activeTab (Trạng thái lọc) thay đổi
    useEffect(() => {
        load(1);
    }, [activeTab]);

    // ── Duyệt hồ sơ ───────────────────────────────────────────────────────────
    const handleApprove = useCallback(async (employer) => {
        try {
            setActionLoading(employer.id);
            const token = await AsyncStorage.getItem('token');
            await authApi(token).patch(endpoints['admin-employer-approve'](employer.id));

            // Cập nhật state nội bộ hoặc reload lại trang hiện tại
            setEmployers(prev => prev.map(e =>
                e.id === employer.id
                    ? { ...e, is_verified: true, is_rejected: false, rejection_reason: null }
                    : e
            ));
            
            if (showDetail) {
                setSelectedEmployer(prev => prev ? { ...prev, is_verified: true, is_rejected: false } : prev);
            }
            Alert.alert('✓ Thành công', `Đã duyệt tài khoản "${employer.user?.username}".`);
            refresh(); // Làm mới trang để cập nhật số lượng badge chính xác
        } catch (ex) {
            const msg = ex?.response?.data?.error || 'Không thể duyệt tài khoản này.';
            Alert.alert('Lỗi', msg);
        } finally {
            setActionLoading(null);
        }
    }, [showDetail, refresh]);

    // ── Mở modal từ chối ──────────────────────────────────────────────────────
    const handleOpenReject = useCallback((employer) => {
        setRejectTarget(employer);
        setShowDetail(false);
        setShowReject(true);
    }, []);

    // ── Xác nhận từ chối với lý do ────────────────────────────────────────────
    const handleConfirmReject = useCallback(async (reason) => {
        if (!rejectTarget) return;
        try {
            setActionLoading('modal');
            const token = await AsyncStorage.getItem('token');
            await authApi(token).patch(endpoints['admin-employer-reject'](rejectTarget.id), { reason });
            
            setEmployers(prev => prev.map(e =>
                e.id === rejectTarget.id
                    ? { ...e, is_verified: false, is_rejected: true, rejection_reason: reason }
                    : e
            ));
            setShowReject(false);
            setRejectTarget(null);
            Alert.alert('Đã từ chối', `Tài khoản "${rejectTarget.user?.username}" đã bị từ chối.`);
            refresh(); // Đọc lại dữ liệu để cập nhật số đếm badge
        } catch (ex) {
            const msg = ex?.response?.data?.error || 'Không thể từ chối tài khoản.';
            Alert.alert('Lỗi', msg);
        } finally {
            setActionLoading(null);
        }
    }, [rejectTarget, refresh]);

    // ── Empty state ───────────────────────────────────────────────────────────
    const EmptyState = () => (
        <View style={s.empty}>
            <Text style={s.emptyIcon}>
                {activeTab === 'pending' ? '🎉' : activeTab === 'rejected' ? '✅' : '📭'}
            </Text>
            <Text style={s.emptyTitle}>
                {activeTab === 'pending' ? 'Không có tài khoản nào chờ duyệt' :
                 activeTab === 'rejected' ? 'Không có tài khoản nào bị từ chối' :
                 activeTab === 'approved' ? 'Chưa có tài khoản nào được duyệt' : 'Danh sách trống'}
            </Text>
            <Text style={s.emptyDesc}>Tất cả hồ sơ ở mục này đã được xử lý xong.</Text>
        </View>
    );

    return (
        <SafeAreaView style={s.root}>
            {/* Header */}
            <View style={s.header}>
                <View>
                    <Text style={s.headerTitle}>Duyệt doanh nghiệp</Text>
                    <Text style={s.headerSub}>
                        {activeTab === 'pending' ? `${count} hồ sơ đang chờ xử lý` : `Tìm thấy ${count} kết quả`}
                    </Text>
                </View>
                <TouchableOpacity style={s.refreshBtn} onPress={refresh}>
                    <Text style={s.refreshBtnText}>↻</Text>
                </TouchableOpacity>
            </View>

            {/* Filter Tabs */}
            <View style={{ maxHeight: 50 }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabScroll} contentContainerStyle={s.tabContainer}>
                    {TABS.map(tab => {
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
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            {/* List chính hiển thị UI phân trang */}
            {loading && !refreshing ? (
                <View style={s.centered}>
                    <ActivityIndicator size="large" color={C.accent} />
                    <Text style={[s.emptyDesc, { marginTop: 12 }]}>Đang tải danh sách tài khoản...</Text>
                </View>
            ) : (
                <FlatList
                    data={employers} // Giờ dữ liệu hiển thị đúng theo từng trang từ Server trả về
                    keyExtractor={item => item.id.toString()}
                    renderItem={({ item }) => (
                        <EmployerCard
                            employer={item}
                            onPress={(e) => { setSelectedEmployer(e); setShowDetail(true); }}
                            onApprove={handleApprove}
                            onReject={handleOpenReject}
                            actionLoading={actionLoading}
                        />
                    )}
                    contentContainerStyle={s.listContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={C.accent} />}
                    ListEmptyComponent={<EmptyState />}
                    ListFooterComponent={<View style={{ height: 16 }} />}
                />
            )}

            {/* Thanh hiển thị phân trang dưới đáy màn hình */}
            <Paginator page={page} totalPages={totalPages} onGoTo={load} />

            {/* Detail Modal */}
            <EmployerDetailModal
                visible={showDetail}
                employer={selectedEmployer}
                onClose={() => setShowDetail(false)}
                onApprove={(e) => { setShowDetail(false); handleApprove(e); }}
                onReject={(e) => handleOpenReject(e)}
                actionLoading={actionLoading !== null && actionLoading !== 'modal'}
            />

            {/* Reject Modal */}
            <RejectModal
                visible={showReject}
                employerName={rejectTarget?.user?.username || ''}
                onConfirm={handleConfirmReject}
                onCancel={() => { setShowReject(false); setRejectTarget(null); }}
                loading={actionLoading === 'modal'}
            />
        </SafeAreaView>
    );
}