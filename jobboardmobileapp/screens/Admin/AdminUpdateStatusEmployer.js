import React, { useState, useCallback, useEffect } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl,
    Modal, Alert, StyleSheet, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi, endpoints } from '../../configs/Apis';
import { Colors as C, approvalStyles as s } from './Styles';
import { Ionicons } from '@expo/vector-icons';

// ─── Employer Detail Modal (Đồng bộ với JobDetailModal) ─────────────────────────
const EmployerDetailModal = ({ visible, employer, onClose, onApprove, onReject, actionLoading }) => {
    if (!employer) return null;

    const userInfo = employer.user || {};
    const companyInfo = employer.company || {};

    const InfoRow = ({ label, value }) => (
        value ? (
            <View style={s.infoRow}>
                <Text style={s.infoLabel}>{label}</Text>
                <Text style={s.infoValue}>{value}</Text>
            </View>
        ) : null
    );

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={s.detailOverlay}>
                <View style={s.detailCard}>
                    {/* Handle bar */}
                    <View style={s.handleBar} />

                    {/* Header */}
                    <View style={s.detailHeader}>
                        <View style={{ flex: 1 }}>
                            <Text style={s.detailTitle} numberOfLines={2}>
                                {companyInfo.name || 'Chưa thiết lập tên công ty'}
                            </Text>
                            <Text style={s.detailCompany}>
                                <Ionicons name="people" size={16} color="#3d3c3a" style={{ marginRight: 6 }} />
                                Đại diện: {userInfo.username || '—'}
                            </Text>
                        </View>
                        <TouchableOpacity style={s.closeBtn} onPress={onClose}>
                            <Text style={s.closeBtnText}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={s.detailScroll} showsVerticalScrollIndicator={false}>
                        {/* Info grid */}
                        <View style={s.infoGrid}>
                            <InfoRow 
                                icon={<Ionicons name="mail" size={14} color="#6B7280" />} 
                                label="Email liên hệ" 
                                value={userInfo.email} 
                            />
                            <InfoRow 
                                icon={<Ionicons name="call" size={14} color="#6B7280" />} 
                                label="Số điện thoại" 
                                value={userInfo.phone} 
                            />
                            <InfoRow 
                                icon={<Ionicons name="briefcase" size={14} color="#6B7280" />} 
                                label="Chức vụ đại diện" 
                                value={employer.position} 
                            />
                            <InfoRow 
                                icon={<Ionicons name="globe" size={14} color="#6B7280" />} 
                                label="Website" 
                                value={companyInfo.website} 
                            />
                            <InfoRow 
                                icon={<Ionicons name="location" size={14} color="#6B7280" />} 
                                label="Trụ sở công ty" 
                                value={companyInfo.address} 
                            />
                        </View>

                        {/* Bio / Giới thiệu */}
                        {employer.bio ? (
                            <View style={s.detailSection}>
                                <Text style={s.detailSectionTitle}>Giới thiệu nhà tuyển dụng</Text>
                                <Text style={s.detailBody}>{employer.bio}</Text>
                            </View>
                        ) : null}

                        {/* Company Description */}
                        {companyInfo.description ? (
                            <View style={s.detailSection}>
                                <Text style={s.detailSectionTitle}>Mô tả công ty</Text>
                                <Text style={s.detailBody}>{companyInfo.description}</Text>
                            </View>
                        ) : null}

                        <View style={{ height: 24 }} />
                    </ScrollView>

                    {/* Action buttons — chỉ hiển thị khi chưa xác minh */}
                    {!employer.is_verified && (
                        <View style={s.detailActions}>
                            <TouchableOpacity
                                style={s.detailRejectBtn}
                                onPress={() => onReject(employer)}
                                disabled={actionLoading}
                            >
                                <Text style={s.detailRejectBtnText}> Từ chối</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[s.detailApproveBtn, actionLoading && { opacity: 0.6 }]}
                                onPress={() => onApprove(employer)}
                                disabled={actionLoading}
                            >
                                {actionLoading
                                    ? <ActivityIndicator size="small" color="#fff" />
                                    : <Text style={s.detailApproveBtnText}> Duyệt tài khoản</Text>
                                }
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>
        </Modal>
    );
};

// ─── Employer Card (Đồng bộ với JobCard) ─────────────────────────────────────────
const EmployerCard = ({ employer, onPress, onApprove, onReject, actionLoading }) => {
    const userInfo = employer.user || {};
    const companyInfo = employer.company || {};
    
    // Đồng bộ trạng thái theo thuộc tính is_verified (Dữ liệu gốc is_active ngầm ở User)
    const isPending = !employer.is_verified;

    const statusConfig = {
        pending:  { label: 'Chờ duyệt',  color: C.pending,  bg: C.pendingBg,  bdr: C.pendingBdr },
        approved: { label: 'Đã duyệt',   color: C.approved, bg: C.approvedBg, bdr: '#BBF7D0' },
    };
    const st = employer.is_verified ? statusConfig.approved : statusConfig.pending;

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
            {/* Top row */}
            <View style={s.cardTop}>
                <View style={s.companyLogoPlaceholder}>
                    <Text style={s.companyLogoText}>
                        {(companyInfo.name || userInfo.username || '?')[0].toUpperCase()}
                    </Text>
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={s.cardTitle} numberOfLines={1}>
                        {companyInfo.name || 'Chưa cập nhật tên cty'}
                    </Text>
                    <Text style={s.cardCompany} numberOfLines={1}><Ionicons name="people" size={16} color="#3d3c3a" style={{ marginRight: 6 }} /> @{userInfo.username || '—'}</Text>
                </View>
                <View style={[s.statusBadge, { backgroundColor: st.bg, borderColor: st.bdr }]}>
                    <Text style={[s.statusBadgeText, { color: st.color }]}>{st.label}</Text>
                </View>
            </View>

            {/* Meta */}
            <View style={s.cardMeta}>
                {userInfo.email ? (
                    <Text style={s.metaTag}>
                        <Ionicons name="mail" size={12} color="#6B7280" /> {userInfo.email}
                    </Text>
                ) : null}
                
                {employer.position ? (
                    <Text style={s.metaTag}>
                        <Ionicons name="briefcase" size={12} color="#6B7280" /> {employer.position}
                    </Text>
                ) : null}
                
                {companyInfo.location || companyInfo.address ? (
                    <Text style={s.metaTag} numberOfLines={1}>
                        <Ionicons name="location" size={12} color="#6B7280" /> {companyInfo.location || companyInfo.address}
                    </Text>
                ) : null}
            </View>

            {/* Footer */}
            <View style={s.cardFooter}>
                <Text style={s.cardTime}>{timeAgo(employer.created_at)}</Text>

                {/* Quick actions khi đang chờ duyệt */}
                {isPending && (
                    <View style={s.quickActions}>
                        <TouchableOpacity
                            style={s.quickReject}
                            onPress={(e) => { e.stopPropagation?.(); onReject(employer); }}
                            disabled={actionLoading === employer.id}
                        >
                            <Text style={s.quickRejectText}>Từ chối</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[s.quickApprove, actionLoading === employer.id && { opacity: 0.6 }]}
                            onPress={(e) => { e.stopPropagation?.(); onApprove(employer); }}
                            disabled={actionLoading === employer.id}
                        >
                            {actionLoading === employer.id
                                ? <ActivityIndicator size="small" color="#fff" />
                                : <Text style={s.quickApproveText}>Duyệt</Text>
                            }
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );
};

// ─── Filter Tabs ──────────────────────────────────────────────────────────────
const TABS = [
    { key: 'pending',  label: 'Chờ duyệt', color: C.pending  },
    { key: 'approved', label: 'Đã duyệt',  color: C.approved },
    { key: 'all',      label: 'Tất cả',    color: C.accent   },
];

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function AdminUpdateStatusEmployer() {
    const [employers, setEmployers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState('pending');
    const [selectedEmployer, setSelectedEmployer] = useState(null);
    const [showDetail, setShowDetail] = useState(false);
    const [actionLoading, setActionLoading] = useState(null); // Lưu employer.id khi kích hoạt loading

    // ── Fetch dữ liệu (Filter phía client đồng bộ với file mẫu để mượt chuyển tab) ──
    const fetchEmployers = useCallback(async (isRefresh = false) => {
        try {
            isRefresh ? setRefreshing(true) : setLoading(true);
            const token = await AsyncStorage.getItem('token');
            
            // Gọi API lấy toàn bộ danh sách để phân tách Client-side tab giống file Job
            const res = await authApi(token).get(endpoints['admin-pending-employers']);
            setEmployers(res.data || []);
        } catch (ex) {
            console.error('Fetch admin employers error:', ex.message);
            Alert.alert('Lỗi', 'Không thể tải danh sách tài khoản.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchEmployers();
    }, [fetchEmployers]);

    // ── Xử lý Duyệt tài khoản ───────────────────────────────────────────────────
    const handleApprove = useCallback(async (employer) => {
        try {
            setActionLoading(employer.id);
            const token = await AsyncStorage.getItem('token');
            await authApi(token).patch(endpoints['admin-employer-approve'](employer.id));
            
            // Cập nhật state cục bộ ngay lập tức
            setEmployers(prev => prev.map(e => e.id === employer.id ? { ...e, is_verified: true } : e));
            if (showDetail) setSelectedEmployer(prev => prev ? { ...prev, is_verified: true } : prev);
            
            Alert.alert('✓ Thành công', `Tài khoản đại diện "${employer.user?.username}" đã được kích hoạt thành công.`);
        } catch (ex) {
            const msg = ex?.response?.data?.error || 'Không thể duyệt tài khoản này.';
            Alert.alert('Lỗi', msg);
        } finally {
            setActionLoading(null);
        }
    }, [showDetail]);

    // ── Xử lý Từ chối tài khoản ──────────────────────────────────────────────────
    const handleReject = useCallback((employer) => {
        setShowDetail(false);
        Alert.alert(
            "Xác nhận từ chối",
            `Bạn có chắc chắn muốn từ chối kích hoạt tài khoản của "${employer.user?.username}"?`,
            [
                { text: "Hủy", style: "cancel" },
                { 
                    text: "Xác nhận khóa", 
                    style: "destructive",
                    onPress: async () => {
                        try {
                            setActionLoading(employer.id);
                            const token = await AsyncStorage.getItem('token');
                            await authApi(token).patch(endpoints['admin-employer-reject'](employer.id));
                            
                            // Loại bỏ hoặc cập nhật trạng thái tùy theo logic xóa/khóa của bạn
                            setEmployers(prev => prev.filter(e => e.id !== employer.id));
                            Alert.alert('Đã xử lý', 'Đã từ chối cấp quyền hoạt động thành công.');
                        } catch (ex) {
                            Alert.alert('Lỗi', 'Không thể hoàn tất thao tác từ chối.');
                        } finally {
                            setActionLoading(null);
                        }
                    }
                }
            ]
        );
    }, []);

    // ── Bộ lọc danh sách dựa trên Tab hoạt động ───────────────────────────────────
    const filtered = activeTab === 'all' 
        ? employers 
        : employers.filter(e => activeTab === 'approved' ? e.is_verified : !e.is_verified);

    const countByStatus = (st) => {
        if (st === 'approved') return employers.filter(e => e.is_verified).length;
        return employers.filter(e => !e.is_verified).length;
    };

    // ── Empty State Giao diện trống ──────────────────────────────────────────────
    const EmptyState = () => (
        <View style={s.empty}>
            {activeTab === 'pending' ? (
                <Ionicons name="celebrate" size={48} color="#FFD700" /> 
            ) : (
                <Ionicons name="folder-open-outline" size={48} color="#A9A9A9" />
            )}
            <Text style={s.emptyTitle}>
                {activeTab === 'pending' ? 'Tất cả hồ sơ đăng ký mới đã được phê duyệt. 🎉' : 'Danh sách trống'}
            </Text>
            <Text style={s.emptyDesc}>
                {activeTab === 'pending' ? 'Hồ sơ đã được xử lý thành công.' : 'Hệ thống chưa ghi nhận tài khoản mới.'}
            </Text>
        </View>
    );

    if (loading) {
        return (
            <View style={s.centered}>
                <ActivityIndicator size="large" color={C.accent} />
                <Text style={[s.emptyDesc, { marginTop: 12 }]}>Đang tải danh sách tài khoản...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={s.root}>
            {/* ── Header ── */}
            <View style={s.header}>
                <View>
                    <Text style={s.headerTitle}>Duyệt doanh nghiệp</Text>
                    <Text style={s.headerSub}>
                        {countByStatus('pending')} tài khoản đang chờ kích hoạt
                    </Text>
                </View>
                <TouchableOpacity style={s.refreshBtn} onPress={() => fetchEmployers(true)}>
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
                    const count = tab.key === 'all' ? employers.length : countByStatus(tab.key);
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
                    <RefreshControl refreshing={refreshing} onRefresh={() => fetchEmployers(true)} />
                }
            >
                {filtered.length === 0 ? <EmptyState /> : (
                    filtered.map(emp => (
                        <EmployerCard
                            key={emp.id}
                            employer={emp}
                            onPress={(e) => { setSelectedEmployer(e); setShowDetail(true); }}
                            onApprove={handleApprove}
                            onReject={handleReject}
                            actionLoading={actionLoading}
                        />
                    ))
                )}
                <View style={{ height: 32 }} />
            </ScrollView>

            {/* ── Detail Modal ── */}
            <EmployerDetailModal
                visible={showDetail}
                employer={selectedEmployer}
                onClose={() => setShowDetail(false)}
                onApprove={(e) => { setShowDetail(false); handleApprove(e); }}
                onReject={(e) => handleReject(e)}
                actionLoading={actionLoading !== null && actionLoading !== 'modal'}
            />
        </SafeAreaView>
    );
}