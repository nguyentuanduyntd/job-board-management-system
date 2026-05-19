import { useCallback, useContext, useEffect, useState } from 'react';
import {
    ActivityIndicator, Alert, FlatList, Image,
    Modal, RefreshControl, Text, TouchableOpacity, View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authApi, endpoints } from '../../configs/Apis';
import { MyUserContext } from '../../configs/Contexts';
import styles from './Styles';

// ─── Helpers ─────────────────────────────────────────────────────────────────
// Khớp chính xác với backend: PENDING | REVIEWING | ACCEPTED | REJECTED
const STATUS_CONFIG = {
    PENDING:   { label: 'Chờ duyệt',    color: '#F59E0B', bg: '#FEF3C7', icon: '⏳' },
    REVIEWING: { label: 'Đang xem xét', color: '#3B5BDB', bg: '#EEF2FF', icon: '👀' },
    ACCEPTED:  { label: 'Đã chấp nhận', color: '#10B981', bg: '#D1FAE5', icon: '✅' },
    REJECTED:  { label: 'Từ chối',      color: '#EF4444', bg: '#FEE2E2', icon: '✗'  },
};

const getStatus = (key) =>
    STATUS_CONFIG[key?.toUpperCase()] ??
    { label: key ?? '—', color: '#888', bg: '#F3F4F6', icon: '•' };

// Backend destroy() chặn ACCEPTED + REVIEWING → chỉ PENDING mới hủy được
const canCancel = (status) => status?.toUpperCase() === 'PENDING';

const fmtDate = (d) =>
    d ? new Date(d).toLocaleDateString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric'
    }) : '—';

const fmtSalary = (min, max) =>
    min && max
        ? `${(min / 1e6).toFixed(0)}–${(max / 1e6).toFixed(0)} triệu`
        : 'Thỏa thuận';

// ─── Tabs ─────────────────────────────────────────────────────────────────────
const TABS = [
    { key: 'ALL',       label: 'Tất cả'    },
    { key: 'PENDING',   label: 'Chờ duyệt' },
    { key: 'REVIEWING', label: 'Đang xét'  },
    { key: 'ACCEPTED',  label: 'Chấp nhận' },
    { key: 'REJECTED',  label: 'Từ chối'   },
];

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function MyApplications({ navigation }) {
    const user = useContext(MyUserContext);

    const [applications, setApplications] = useState([]);
    const [loading, setLoading]           = useState(true);
    const [refreshing, setRefreshing]     = useState(false);
    const [activeTab, setActiveTab]       = useState('ALL');
    const [cancelTarget, setCancelTarget] = useState(null);
    const [cancelling, setCancelling]     = useState(false);

    // ── Fetch ─────────────────────────────────────────────────────────────────
    // Candidate dùng token → GET /applications/ tự trả về list của mình (get_queryset lọc theo role)
    const loadApplications = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const api = authApi(user?.token);
            const res = await api.get(endpoints['applications']);
            const data = Array.isArray(res.data)
                ? res.data
                : res.data?.results ?? [];
            setApplications(data);
        } catch (ex) {
            console.error('Load applications error:', ex.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user?.token]);

    useEffect(() => { loadApplications(); }, [loadApplications]);

    const onRefresh = () => { setRefreshing(true); loadApplications(true); };

    // ── Cancel ────────────────────────────────────────────────────────────────
    const doCancel = async () => {
        if (!cancelTarget) return;
        setCancelling(true);
        try {
            const api = authApi(user?.token);
            // DELETE /applications/{id}/
            await api.delete(`${endpoints['applications']}${cancelTarget.id}/`);
            setApplications(prev => prev.filter(a => a.id !== cancelTarget.id));
            setCancelTarget(null);
        } catch (ex) {
            // Hiện đúng message lỗi từ backend (vd: "Không thể rút đơn khi...")
            const msg = ex.response?.data?.error ?? 'Không thể hủy đơn. Vui lòng thử lại.';
            Alert.alert('Không thể hủy', msg);
        } finally {
            setCancelling(false);
        }
    };

    // ── Derived list ──────────────────────────────────────────────────────────
    const filtered = activeTab === 'ALL'
        ? applications
        : applications.filter(a => a.status?.toUpperCase() === activeTab);

    // ─── Card ─────────────────────────────────────────────────────────────────
    const AppCard = ({ item }) => {
        const st  = getStatus(item.status);
        // job là nested object từ JobListSerializer
        const job = typeof item.job === 'object' && item.job !== null ? item.job : {};

        return (
            <TouchableOpacity
                style={styles.card}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('JobDetail', { jobId: job.id ?? item.job })}
            >
                {/* Stripe màu trái */}
                <View style={[styles.stripe, { backgroundColor: st.color }]} />

                <View style={styles.cardBody}>
                    {/* Top: logo + tên job + badge */}
                    <View style={styles.topRow}>
                        <Image
                            source={{ uri: job.company_logo || 'https://via.placeholder.com/56' }}
                            style={styles.logo}
                        />
                        <View style={styles.jobInfo}>
                            <Text style={styles.jobTitle} numberOfLines={2}>
                                {job.title ?? '—'}
                            </Text>
                            <Text style={styles.company} numberOfLines={1}>
                                {job.company_name ?? '—'}
                            </Text>
                            <Text style={styles.salary}>
                                {fmtSalary(job.salary_min, job.salary_max)}
                            </Text>
                        </View>
                        <View style={[styles.badge, { backgroundColor: st.bg }]}>
                            <Text style={styles.badgeIcon}>{st.icon}</Text>
                            <Text style={[styles.badgeLabel, { color: st.color }]}>
                                {st.label}
                            </Text>
                        </View>
                    </View>

                    {/* Meta: ngày nộp + địa điểm */}
                    <View style={styles.metaRow}>
                        <View style={styles.metaItem}>
                            <Text style={styles.metaIcon}>📅</Text>
                            {/* Backend field là created_at */}
                            <Text style={styles.metaText}>Nộp: {fmtDate(item.created_at)}</Text>
                        </View>
                        {!!job.location && (
                            <View style={styles.metaItem}>
                                <Text style={styles.metaIcon}>📍</Text>
                                <Text style={styles.metaText} numberOfLines={1}>{job.location}</Text>
                            </View>
                        )}
                    </View>

                    {/* Employer note (field có trong serializer) */}
                    {!!item.employer_note && (
                        <View style={styles.noteBox}>
                            <Text style={styles.noteLabel}>💬 Ghi chú từ NTD:</Text>
                            <Text style={styles.noteText} numberOfLines={3}>
                                {item.employer_note}
                            </Text>
                        </View>
                    )}

                    {/* Cover letter preview */}
                    {!!item.cover_letter && (
                        <Text style={styles.coverPreview} numberOfLines={2}>
                            "{item.cover_letter}"
                        </Text>
                    )}

                    {/* Nút hủy — chỉ PENDING */}
                    {canCancel(item.status) && (
                        <TouchableOpacity
                            style={styles.cancelBtn}
                            onPress={() => setCancelTarget(item)}
                        >
                            <Text style={styles.cancelBtnText}>✕  Hủy đơn</Text>
                        </TouchableOpacity>
                    )}

                    {/* Thông báo khi đang REVIEWING (không hủy được) */}
                    {item.status?.toUpperCase() === 'REVIEWING' && (
                        <View style={styles.infoNote}>
                            <Text style={styles.infoNoteText}>
                                ℹ️  Đơn đang được xét duyệt, không thể hủy
                            </Text>
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    // ─── Empty state ──────────────────────────────────────────────────────────
    const EmptyState = () => (
        <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>Chưa có đơn ứng tuyển</Text>
            <Text style={styles.emptyDesc}>
                {activeTab === 'ALL'
                    ? 'Bạn chưa ứng tuyển vào vị trí nào.'
                    : `Không có đơn nào ở trạng thái "${getStatus(activeTab).label}".`}
            </Text>
            {activeTab === 'ALL' && (
                <TouchableOpacity
                    style={styles.findJobBtn}
                    onPress={() => navigation.navigate('Home')}
                >
                    <Text style={styles.findJobBtnText}>Tìm việc ngay</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    // ─── Cancel modal ─────────────────────────────────────────────────────────
    const CancelModal = () => {
        const jobTitle = typeof cancelTarget?.job === 'object'
            ? cancelTarget?.job?.title
            : '—';

        return (
            <Modal
                transparent
                visible={!!cancelTarget}
                animationType="fade"
                onRequestClose={() => !cancelling && setCancelTarget(null)}
            >
                <View style={styles.overlay}>
                    <View style={styles.dialog}>
                        <Text style={styles.dialogIcon}>🗑️</Text>
                        <Text style={styles.dialogTitle}>Hủy đơn ứng tuyển?</Text>
                        <Text style={styles.dialogDesc}>
                            Bạn sắp hủy đơn ứng tuyển vào vị trí{'\n'}
                            <Text style={{ fontWeight: '700', color: '#222' }}>{jobTitle}</Text>
                            .{'\n'}Hành động này không thể hoàn tác.
                        </Text>
                        <View style={styles.dialogBtns}>
                            <TouchableOpacity
                                style={styles.dialogBtnSecondary}
                                onPress={() => setCancelTarget(null)}
                                disabled={cancelling}
                            >
                                <Text style={styles.dialogBtnSecondaryText}>Giữ lại</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.dialogBtnDanger}
                                onPress={doCancel}
                                disabled={cancelling}
                            >
                                {cancelling
                                    ? <ActivityIndicator size="small" color="#fff" />
                                    : <Text style={styles.dialogBtnDangerText}>Xác nhận hủy</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        );
    };

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Text style={styles.backIcon}>‹</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Đơn ứng tuyển của tôi</Text>
                <View style={styles.countBubble}>
                    <Text style={styles.countText}>{applications.length}</Text>
                </View>
            </View>

            {/* Tab bar */}
            <FlatList
                horizontal
                data={TABS}
                keyExtractor={t => t.key}
                showsHorizontalScrollIndicator={false}
                style={styles.tabBar}
                contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
                renderItem={({ item: tab }) => {
                    const count = tab.key === 'ALL'
                        ? applications.length
                        : applications.filter(a => a.status?.toUpperCase() === tab.key).length;
                    const active = activeTab === tab.key;
                    return (
                        <TouchableOpacity
                            style={[styles.tab, active && styles.tabActive]}
                            onPress={() => setActiveTab(tab.key)}
                        >
                            <Text style={[styles.tabText, active && styles.tabTextActive]}>
                                {tab.label}
                            </Text>
                            {count > 0 && (
                                <View style={[styles.tabBadge, active && styles.tabBadgeActive]}>
                                    <Text style={[styles.tabBadgeText, active && styles.tabBadgeTextActive]}>
                                        {count}
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    );
                }}
            />

            {/* Content */}
            {loading ? (
                <ActivityIndicator size="large" color="#3B5BDB" style={{ marginTop: 60 }} />
            ) : (
                <FlatList
                    data={filtered}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={
                        filtered.length === 0 ? { flex: 1 } : { padding: 16, gap: 12 }
                    }
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor="#3B5BDB"
                        />
                    }
                    ListEmptyComponent={<EmptyState />}
                    renderItem={({ item }) => <AppCard item={item} />}
                />
            )}

            <CancelModal />
        </SafeAreaView>
    );
}