import { useCallback, useContext, useRef, useState } from 'react';
import {
    ActivityIndicator, Alert, Animated, FlatList, Image,
    Modal, RefreshControl, ScrollView, Text,
    TouchableOpacity, View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native'; 
import { authApi, endpoints } from '../../configs/Apis';
import { MyUserContext } from '../../configs/Contexts';
import styles from './Styles';
import { useStripe } from '@stripe/stripe-react-native';
import { Ionicons } from '@expo/vector-icons';
const STATUS_CONFIG = {
    PENDING:   { label: 'Chờ duyệt',    color: '#F59E0B', bg: '#FEF3C7', icon: <Ionicons name="hourglass" size={16} color="#F59E0B" style={{ marginRight: 6 }} />},
    REVIEWING: { label: 'Đang xem xét', color: '#3B5BDB', bg: '#EEF2FF', icon: <Ionicons name="eye" size={16} color="#3B5BDB" style={{ marginRight: 6 }} /> },
    ACCEPTED:  { label: 'Đã chấp nhận', color: '#10B981', bg: '#D1FAE5', icon: <Ionicons name="checkmark-circle" size={16} color="#10B981" style={{ marginRight: 6 }} /> },
    REJECTED:  { label: 'Từ chối',      color: '#EF4444', bg: '#FEE2E2', icon: <Ionicons name="close-circle" size={16} color="#EF4444" style={{ marginRight: 6 }} /> },
};

const getStatus = (key) =>
    STATUS_CONFIG[key?.toUpperCase()] ??
    { label: key ?? '—', color: '#888', bg: '#F3F4F6', icon: '•' };

const canCancel = (status) => status?.toUpperCase() === 'PENDING';

const fmtDate = (d) =>
    d ? new Date(d).toLocaleDateString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric'
    }) : '—';

const fmtSalary = (min, max) =>
    min && max
        ? `${(min / 1e6).toFixed(0)}–${(max / 1e6).toFixed(0)} triệu`
        : 'Thỏa thuận';

const fmtPrice = (price) =>
    new Intl.NumberFormat('vi-VN').format(price) + 'đ';

const LEVEL_LABELS = { 1: 'VIP 1', 2: 'VIP 2', 3: 'VIP 3' };
const LEVEL_COLORS = {
    1: { bg: '#FEF3C7', border: '#F59E0B', text: '#92400E', badge: '🥉' },
    2: { bg: '#E0F2FE', border: '#0EA5E9', text: '#075985', badge: '🥈' },
    3: { bg: '#F3E8FF', border: '#A855F7', text: '#6B21A8', badge: '🥇' },
};

const TABS = [
    { key: 'ALL',       label: 'Tất cả'    },
    { key: 'PENDING',   label: 'Chờ duyệt' },
    { key: 'REVIEWING', label: 'Đang xét'  },
    { key: 'ACCEPTED',  label: 'Chấp nhận' },
    { key: 'REJECTED',  label: 'Từ chối'   },
];

const PackageCard = ({ pkg, selected, onSelect }) => {
    const lv = LEVEL_COLORS[pkg.level] ?? LEVEL_COLORS[1];
    const isSelected = selected?.id === pkg.id;

    return (
        <TouchableOpacity
            style={[
                styles.pkgCard,
                { borderColor: lv.border, backgroundColor: isSelected ? lv.bg : '#FAFAFA' },
                isSelected && styles.pkgCardSelected,
            ]}
            onPress={() => onSelect(pkg)}
            activeOpacity={0.8}
        >
            <View style={styles.pkgHeader}>
                <Text style={styles.pkgBadge}>{lv.badge}</Text>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.pkgName, { color: lv.text }]}>{pkg.name}</Text>
                    <Text style={styles.pkgDuration}>⏱ {pkg.duration_days} ngày</Text>
                </View>
                <Text style={[styles.pkgPrice, { color: lv.text }]}>{fmtPrice(pkg.price)}</Text>
            </View>
            {!!pkg.description && (
                <Text style={styles.pkgDesc} numberOfLines={2}>{pkg.description}</Text>
            )}
            {isSelected && (
                <View style={[styles.pkgCheckmark, { backgroundColor: lv.border }]}>
                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>✓ Đã chọn</Text>
                </View>
            )}
        </TouchableOpacity>
    );
};

export default function MyApplications({ navigation }) {
    const user = useContext(MyUserContext);
    const { initPaymentSheet, presentPaymentSheet } = useStripe(); 

    const [applications, setApplications] = useState([]);
    const [loading, setLoading]           = useState(true);
    const [refreshing, setRefreshing]     = useState(false);
    const [activeTab, setActiveTab]       = useState('ALL');
    const [cancelTarget, setCancelTarget] = useState(null);
    const [cancelling, setCancelling]     = useState(false);

    const [priorityTarget, setPriorityTarget]     = useState(null);
    const [packages, setPackages]                 = useState([]);
    const [loadingPkgs, setLoadingPkgs]           = useState(false);
    const [selectedPkg, setSelectedPkg]           = useState(null);
    const [purchasing, setPurchasing]             = useState(false);
    const [showPriorityModal, setShowPriorityModal] = useState(false);

    const highlightAnims = useRef({}).current;

    const getHighlightAnim = (id) => {
        if (!highlightAnims[id]) {
            highlightAnims[id] = new Animated.Value(0);
        }
        return highlightAnims[id];
    };

    const triggerHighlight = (id) => {
        const anim = getHighlightAnim(id);
        anim.setValue(0);
        Animated.sequence([
            Animated.timing(anim, { toValue: 1, duration: 400, useNativeDriver: false }),
            Animated.delay(1200),
            Animated.timing(anim, { toValue: 0, duration: 600, useNativeDriver: false }),
        ]).start();
    };

    const loadApplications = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const api = authApi(user?.token);
            const res = await api.get(endpoints['applications']);
            const data = Array.isArray(res.data)
                ? res.data
                : res.data?.results ?? [];
            setApplications(data);
            return data;
        } catch (ex) {
            console.error('Load applications error:', ex.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user?.token]);

    useFocusEffect(
        useCallback(() => {
            loadApplications();
        }, [loadApplications])
    );

    const onRefresh = () => { setRefreshing(true); loadApplications(true); };
    const loadPackages = async () => {
        setLoadingPkgs(true);
        try {
            const api = authApi(user?.token);
            const res = await api.get(endpoints['packages'], {
                params: { package_type: 'priority_application' }
            });
            const data = Array.isArray(res.data) ? res.data : res.data?.results ?? [];
            setPackages(data);
        } catch (ex) {
            Alert.alert('Lỗi', 'Không thể tải danh sách gói. Vui lòng thử lại.');
        } finally {
            setLoadingPkgs(false);
        }
    };

    const openPriorityModal = async (application) => {
        setPriorityTarget(application);
        setSelectedPkg(null);
        setShowPriorityModal(true);
        await loadPackages();
    };

    const closePriorityModal = () => {
        if (purchasing) return;
        setShowPriorityModal(false);
        setPriorityTarget(null);
        setSelectedPkg(null);
        setPackages([]);
    };

    const handlePurchase = async () => {
        if (!selectedPkg || !priorityTarget) return;
        setPurchasing(true);

        try {
            const api = authApi(user?.token);

            const res = await api.post(endpoints['create-payment-intent'], {
                payment_type: 'priority_application',
                package:      selectedPkg.id,
                application:  priorityTarget.id,
                method:       'stripe'
            });

            const { payment_intent_client_secret, ephemeral_key, customer_id } = res.data;

            const { error: initError } = await initPaymentSheet({
                merchantDisplayName: 'JobApp Candidate',
                customerId:          customer_id,
                customerEphemeralKeySecret: ephemeral_key,
                paymentIntentClientSecret:  payment_intent_client_secret,
                allowsDelayedPaymentMethods: false,
            });
            if (initError) throw new Error(initError.message);

            const { error: payError } = await presentPaymentSheet();
            if (payError) {
                if (payError.code !== 'Canceled') {
                    Alert.alert('Thanh toán thất bại', payError.message);
                }
                return;
            }

            setTimeout(() => {
                Alert.alert(
                    'Thanh toán thành công!',
                    `Hồ sơ của bạn đang được hệ thống nâng cấp lên ưu tiên ${LEVEL_LABELS[selectedPkg.level]}.`,
                    [{ 
                        text: 'OK', 
                        onPress: async () => { 
                            const targetId = priorityTarget.id;
                            closePriorityModal(); 
                            await loadApplications(true);  
                            triggerHighlight(targetId);         
                        }
                    }]
                );
                setPurchasing(false);
            }, 2500);

        } catch (ex) {
            const msg = ex.response?.data?.detail
                ?? ex.response?.data?.error
                ?? ex.message
                ?? 'Có lỗi xảy ra. Vui lòng thử lại.';
            Alert.alert('Lỗi thanh toán', msg);
            setPurchasing(false);
        }
    };

    const doCancel = async () => {
        if (!cancelTarget) return;
        setCancelling(true);
        try {
            const api = authApi(user?.token);
            await api.delete(`${endpoints['applications']}${cancelTarget.id}/`);
            setApplications(prev => prev.filter(a => a.id !== cancelTarget.id));
            setCancelTarget(null);
        } catch (ex) {
            const msg = ex.response?.data?.error ?? 'Không thể hủy đơn. Vui lòng thử lại.';
            Alert.alert('Không thể hủy', msg);
        } finally {
            setCancelling(false);
        }
    };

    const filtered = activeTab === 'ALL'
        ? applications
        : applications.filter(a => a.status?.toUpperCase() === activeTab);

    const AppCard = ({ item }) => {
        const st       = getStatus(item.status);
        const job      = typeof item.job === 'object' && item.job !== null ? item.job : {};
        const isPriActive  = item.is_priority_active === true || (
            item.is_priority && item.priority_expired_at &&
            new Date(item.priority_expired_at) > new Date()
        );
        const priLevel = item.priority_level ?? 0;
        const lv       = LEVEL_COLORS[priLevel];

        const highlightAnim = getHighlightAnim(item.id);

        const animatedBorderColor = highlightAnim.interpolate({
            inputRange:  [0, 0.5, 1],
            outputRange: ['transparent', '#22C55E', '#22C55E'],
        });
        const animatedBg = highlightAnim.interpolate({
            inputRange:  [0, 0.5, 1],
            outputRange: ['#fff', '#F0FDF4', '#F0FDF4'],
        });

        return (
            <Animated.View
                style={[
                    styles.card,
                    isPriActive && styles.cardPriority,
                    { borderColor: animatedBorderColor, backgroundColor: animatedBg },
                ]}
            >
                {isPriActive && (
                    <View style={[styles.stripe, { backgroundColor: '#22C55E' }]} />
                )}
                {!isPriActive && (
                    <View style={[styles.stripe, { backgroundColor: st.color }]} />
                )}

                <TouchableOpacity
                    style={styles.cardBody}
                    activeOpacity={0.85}
                    onPress={() => navigation.navigate('JobDetail', { jobId: job.id ?? item.job })}
                >
                    {isPriActive && lv && (
                        <View style={[styles.priBanner, { backgroundColor: lv.bg, borderColor: lv.border }]}>
                            <Text style={styles.priBannerText}>
                                {lv.badge} Hồ sơ ưu tiên · {LEVEL_LABELS[priLevel]}
                            </Text>
                            <Text style={[styles.priExpiry, { color: lv.text }]}>
                                HSD: {fmtDate(item.priority_expired_at)}
                            </Text>
                        </View>
                    )}

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

                    <View style={styles.metaRow}>
                        <View style={styles.metaItem}>
                            <Text style={styles.metaIcon}><Ionicons name="calendar" size={16} color="#3d3c3a" style={{ marginRight: 6 }} /></Text>
                            <Text style={styles.metaText}>Nộp: {fmtDate(item.created_at)}</Text>
                        </View>
                        {!!job.location && (
                            <View style={styles.metaItem}>
                                <Text style={styles.metaIcon}><Ionicons name="location" size={16} color="#3d3c3a" style={{ marginRight: 6 }} /></Text>
                                <Text style={styles.metaText} numberOfLines={1}>{job.location}</Text>
                            </View>
                        )}
                    </View>

                    {!!item.employer_note && (
                        <View style={styles.noteBox}>
                            <Text style={styles.noteLabel}>
                                <Ionicons name="chatbubble-ellipses" size={16} color="#3d3c3a" style={{ marginRight: 6 }} />
                                Ghi chú từ NTD:
                            </Text>
                            <Text style={styles.noteText} numberOfLines={3}>
                                {item.employer_note}
                            </Text>
                        </View>
                    )}

                    {!!item.cover_letter && (
                        <Text style={styles.coverPreview} numberOfLines={2}>
                            "{item.cover_letter}"
                        </Text>
                    )}

                    <View style={styles.actionRow}>
                        {item.status?.toUpperCase() === 'PENDING' && !isPriActive && (
                            <TouchableOpacity
                                style={styles.priorityBtn}
                                onPress={(e) => {
                                    e.stopPropagation?.();
                                    openPriorityModal(item);
                                }}
                            >
                                <Text style={styles.priorityBtnIcon}><Ionicons name="flash" size={16} color="#9f3907" style={{ marginRight: 6 }} /></Text>
                                <Text style={styles.priorityBtnText}>Hồ sơ ưu tiên</Text>
                            </TouchableOpacity>
                        )}

                        {canCancel(item.status) && (
                            <TouchableOpacity
                                style={styles.cancelBtn}
                                onPress={(e) => {
                                    e.stopPropagation?.();
                                    setCancelTarget(item);
                                }}
                            >
                                <Text style={styles.cancelBtnText}>✕  Hủy đơn</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {item.status?.toUpperCase() === 'REVIEWING' && (
                        <View style={styles.infoNote}>
                            <Text style={styles.infoNoteText}>
                                <Ionicons name="information-circle" size={16} color="#3B5BDB" style={{ marginRight: 6 }} />
                                Đơn đang được xét duyệt, không thể hủy
                            </Text>
                        </View>
                    )}
                </TouchableOpacity>
            </Animated.View>
        );
    };

    const EmptyState = () => (
        <View style={styles.empty}>
            <Text style={styles.emptyIcon}><Ionicons name="document-text" size={50} color="#2563EB" style={{ marginRight: 8 }}/></Text>
            <Text style={styles.emptyTitle}>Chưa có đơn ứng tuyển</Text>
            <Text style={styles.emptyDesc}>
                {activeTab === 'ALL'
                    ? 'Bạn chưa ứng tuyển vào vị trí nào.'
                    : `Không có đơn nào ở trạng thái "${getStatus(activeTab).label}".`}
            </Text>
            {activeTab === 'ALL' && (
                <TouchableOpacity
                    style={styles.findJobBtn}
                    onPress={() => navigation.navigate('Trang chủ')}
                >
                    <Text style={styles.findJobBtnText}>Tìm việc ngay</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    const PriorityModal = () => {
        const jobTitle = typeof priorityTarget?.job === 'object'
            ? priorityTarget?.job?.title
            : '—';

        return (
            <Modal
                transparent
                visible={showPriorityModal}
                animationType="slide"
                onRequestClose={closePriorityModal}
            >
                <View style={styles.overlay}>
                    <View style={styles.priorityDialog}>
                        <View style={styles.handleBar} />
                        <Text style={styles.priorityDialogTitle}>
                            <Ionicons name="flash" size={16} color="#F59E0B" style={{ marginRight: 6 }} />
                            Nâng cấp hồ sơ ưu tiên
                        </Text>
                        <Text style={styles.priorityDialogSub} numberOfLines={2}>
                            Vị trí: <Text style={{ fontWeight: '700', color: '#1a1a2e' }}>{jobTitle}</Text>
                        </Text>
                        <View style={styles.priorityDivider} />

                        {loadingPkgs ? (
                            <ActivityIndicator size="large" color="#3B5BDB" style={{ marginVertical: 32 }} />
                        ) : packages.length === 0 ? (
                            <Text style={styles.noPkgText}>Không có gói nào.</Text>
                        ) : (
                            <ScrollView style={{ width: '100%' }} contentContainerStyle={{ gap: 10, paddingBottom: 8 }} showsVerticalScrollIndicator={false}>
                                {packages.map(pkg => (
                                    <PackageCard key={pkg.id} pkg={pkg} selected={selectedPkg} onSelect={setSelectedPkg} />
                                ))}
                            </ScrollView>
                        )}

                        <View style={styles.priorityDialogBtns}>
                            <TouchableOpacity style={styles.dialogBtnSecondary} onPress={closePriorityModal} disabled={purchasing}>
                                <Text style={styles.dialogBtnSecondaryText}>Hủy</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.priorityConfirmBtn, (!selectedPkg || purchasing) && styles.priorityConfirmBtnDisabled]}
                                onPress={handlePurchase} disabled={!selectedPkg || purchasing}
                            >
                                {purchasing ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.priorityConfirmBtnText}>
                                        {selectedPkg ? `Thanh toán ${fmtPrice(selectedPkg.price)}` : 'Chọn gói để tiếp tục'}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        );
    };

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
                        <Text style={styles.dialogIcon}><Ionicons name="trash" size={16} color="#EF4444" style={{ marginRight: 6 }} /></Text>
                        <Text style={styles.dialogTitle}>Hủy đơn ứng tuyển?</Text>
                        <Text style={styles.dialogDesc}>
                            Bạn sắp hủy đơn ứng tuyển vào vị trí{'\n'}
                            <Text style={{ fontWeight: '700', color: '#222' }}>{jobTitle}</Text>.{'\n'}Hành động này không thể hoàn tác.
                        </Text>
                        <View style={styles.dialogBtns}>
                            <TouchableOpacity style={styles.dialogBtnSecondary} onPress={() => setCancelTarget(null)} disabled={cancelling}>
                                <Text style={styles.dialogBtnSecondaryText}>Giữ lại</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.dialogBtnDanger} onPress={doCancel} disabled={cancelling}>
                                {cancelling ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.dialogBtnDangerText}>Xác nhận hủy</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Text style={styles.backIcon}>‹</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Đơn ứng tuyển của tôi</Text>
                <View style={styles.countBubble}>
                    <Text style={styles.countText}>{applications.length}</Text>
                </View>
            </View>

            <FlatList
                horizontal data={TABS} keyExtractor={t => t.key} showsHorizontalScrollIndicator={false}
                style={styles.tabBar} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
                renderItem={({ item: tab }) => {
                    const count = tab.key === 'ALL'
                        ? applications.length
                        : applications.filter(a => a.status?.toUpperCase() === tab.key).length;
                    const active = activeTab === tab.key;
                    return (
                        <TouchableOpacity style={[styles.tab, active && styles.tabActive]} onPress={() => setActiveTab(tab.key)}>
                            <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab.label}</Text>
                            {count > 0 && (
                                <View style={[styles.tabBadge, active && styles.tabBadgeActive]}>
                                    <Text style={[styles.tabBadgeText, active && styles.tabBadgeTextActive]}>{count}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    );
                }}
            />

            {loading ? (
                <ActivityIndicator size="large" color="#3B5BDB" style={{ marginTop: 60 }} />
            ) : (
                <FlatList
                    data={filtered} keyExtractor={item => item.id.toString()}
                    contentContainerStyle={filtered.length === 0 ? { flex: 1 } : { padding: 16, gap: 12 }}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B5BDB" />}
                    ListEmptyComponent={<EmptyState />}
                    renderItem={({ item }) => <AppCard item={item} />}
                />
            )}

            <PriorityModal />
            <CancelModal />
        </SafeAreaView>
    );
}