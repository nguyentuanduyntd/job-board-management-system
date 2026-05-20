import { StyleSheet, Dimensions, Platform } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CONTAINER_PADDING = 20;

export const Colors = {
    bg:         '#F5F7FA',
    surface:    '#FFFFFF',
    border:     '#EAECF0',
    accent:     '#2563EB',
    accentLight:'#EFF6FF', 
    accentBdr:  '#C5D0FF', // Được bổ sung thêm cho CompanyInfo
    green:      '#16A34A',
    yellow:     '#D97706',
    red:        '#DC2626',
    danger:     '#EF4444', // Bổ sung
    dangerBg:   '#FEF2F2', // Bổ sung
    dangerBdr:  '#FECACA', // Bổ sung
    purple:     '#7C3AED',
    text:       '#111827',
    textMuted:  '#9AA5B4',
    textSub:    '#6B7280',
    textPrimary:'#111827',
    textSec:    '#6B7280',
    pending:    '#D97706', 
    pendingBg:  '#FEF3C7',
    pendingBdr: '#FDE68A',
    approved:   '#16A34A',
    approvedBg: '#F0FDF4',
    rejected:   '#DC2626',
    rejectedBg: '#FEF2F2',
};

export default StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: Colors.bg,
    },

    // ─── Header Dashboard Cũ ───────────────────────────
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: CONTAINER_PADDING,
        paddingTop: Platform.OS === 'ios' ? 60 : 20,
        paddingBottom: 20,
        backgroundColor: Colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        zIndex: 10,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: Colors.text,
        letterSpacing: -0.5,
    },
    headerSub: {
        fontSize: 13,
        color: Colors.textMuted,
        marginTop: 2,
    },
    refreshIconBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.accentLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    refreshIconText: {
        fontSize: 20,
        color: Colors.accent,
        fontWeight: '600',
    },

    // ─── Header CompanyInfo (Dùng SafeAreaView) ───────
    pageHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: Colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    pageHeaderTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.text,
    },
    pageHeaderSub: {
        fontSize: 13,
        color: Colors.textSec,
        marginTop: 2,
    },
    addBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.accent,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // ─── Layout & Scroll ────────────────────────────
    scroll: {
        paddingHorizontal: CONTAINER_PADDING,
        paddingTop: 20,
        paddingBottom: 40,
    },
    centered: {
        flex: 1,
        backgroundColor: Colors.bg,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyText: {
        color: Colors.textMuted,
        fontSize: 14,
        textAlign: 'center',
        paddingVertical: 30,
    },

    // ─── Company Info Card & List ─────────────────────
    listContent: {
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    card: {
        backgroundColor: Colors.surface,
        borderRadius: 16,
        marginBottom: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    },
    cardTop: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    cardLogo: {
        width: 52,
        height: 52,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    cardLogoPlaceholder: {
        width: 52,
        height: 52,
        borderRadius: 12,
        backgroundColor: Colors.accentLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardLogoText: {
        fontSize: 22,
        fontWeight: '700',
        color: Colors.accent,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text,
    },
    cardSub: {
        fontSize: 13,
        color: Colors.textSec,
        marginTop: 3,
    },
    cardActions: {
        flexDirection: 'row',
        gap: 8,
    },
    editBtn: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: Colors.accentLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    deleteBtn: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: Colors.dangerBg,
        justifyContent: 'center',
        alignItems: 'center',
    },
    divider: {
        height: 1,
        backgroundColor: Colors.border,
        marginVertical: 12,
    },
    infoGrid: {
        gap: 10,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
    },
    infoIconWrap: {
        width: 30,
        height: 30,
        borderRadius: 8,
        backgroundColor: Colors.accentLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 2,
    },
    infoLabel: {
        fontSize: 11,
        color: Colors.textMuted,
        fontWeight: '500',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    infoValue: {
        fontSize: 14,
        color: Colors.text,
        marginTop: 1,
    },
    descWrap: {
        marginTop: 14,
        backgroundColor: Colors.bg,
        borderRadius: 10,
        padding: 12,
    },
    descLabel: {
        fontSize: 11,
        color: Colors.textMuted,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 6,
    },
    descText: {
        fontSize: 14,
        color: Colors.textSec,
        lineHeight: 20,
    },

    // ─── Empty State Company ──────────────────────────
    empty: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 80,
        paddingHorizontal: 32,
    },
    emptyIconWrap: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: Colors.accentLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text,
        textAlign: 'center',
    },
    emptyDesc: {
        fontSize: 14,
        color: Colors.textSec,
        textAlign: 'center',
        marginTop: 8,
        lineHeight: 21,
    },
    emptyBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: Colors.accent,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
        marginTop: 24,
    },
    emptyBtnText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 15,
    },

    // ─── Overlay / Modals Common ──────────────────────
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    formOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },

    // ─── Form Modal ───────────────────────────────────
    formCard: {
        backgroundColor: Colors.surface,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '90%',
        paddingHorizontal: 20,
        paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    },
    handleBar: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: Colors.border,
        alignSelf: 'center',
        marginTop: 12,
        marginBottom: 4,
    },
    formHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
    },
    formTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text,
    },
    closeBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: Colors.bg,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // ─── Logo Picker ──────────────────────────────────
    logoPicker: {
        alignItems: 'center',
        marginBottom: 20,
    },
    logoCircle: {
        width: 90,
        height: 90,
        borderRadius: 45,
        overflow: 'hidden',
        position: 'relative',
    },
    logoImg: {
        width: 90,
        height: 90,
        borderRadius: 45,
    },
    logoPlaceholder: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: Colors.accentLight,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: Colors.accentBdr,
        borderStyle: 'dashed',
    },
    logoPlaceholderText: {
        fontSize: 12,
        color: Colors.accent,
        marginTop: 4,
    },
    logoEditBadge: {
        position: 'absolute',
        bottom: 4,
        right: 4,
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: Colors.accent,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // ─── Fields ───────────────────────────────────────
    fieldWrap: {
        marginBottom: 14,
    },
    fieldLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.text,
        marginBottom: 6,
    },
    fieldInput: {
        backgroundColor: Colors.bg,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 10,
        fontSize: 14,
        color: Colors.text,
    },
    fieldInputMulti: {
        height: 100,
        paddingTop: 10,
    },

    // ─── Form Actions ─────────────────────────────────
    formActions: {
        flexDirection: 'row',
        gap: 12,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    cancelBtn: {
        flex: 1,
        paddingVertical: 13,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.border,
        alignItems: 'center',
    },
    cancelBtnText: {
        fontSize: 15,
        color: Colors.textSec,
        fontWeight: '600',
    },
    saveBtn: {
        flex: 2,
        paddingVertical: 13,
        borderRadius: 12,
        backgroundColor: Colors.accent,
        alignItems: 'center',
    },
    saveBtnText: {
        fontSize: 15,
        color: '#fff',
        fontWeight: '700',
    },

    // ─── Delete Modal ─────────────────────────────────
    deleteCard: {
        backgroundColor: Colors.surface,
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        width: '100%',
    },
    deleteIconWrap: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: Colors.dangerBg,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    deleteTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 8,
    },
    deleteSub: {
        fontSize: 14,
        color: Colors.textSec,
        textAlign: 'center',
        lineHeight: 21,
        marginBottom: 24,
    },
    deleteActions: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    deleteConfirmBtn: {
        flex: 2,
        paddingVertical: 13,
        borderRadius: 12,
        backgroundColor: Colors.danger,
        alignItems: 'center',
    },
    deleteConfirmBtnText: {
        fontSize: 15,
        color: '#fff',
        fontWeight: '700',
    },

    // ─── Overview Grid (Thẻ ngang hàng) - Dashboard ───
    overviewGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 20,
    },
    overviewCard: {
        width: (SCREEN_WIDTH - (CONTAINER_PADDING * 2) - 12) / 2, 
        backgroundColor: Colors.surface,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: Colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    overviewIconWrap: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    overviewIcon: {
        fontSize: 18,
    },
    overviewValue: {
        fontSize: 22, 
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    overviewLabel: {
        fontSize: 12,
        color: Colors.textMuted,
        fontWeight: '600',
        marginTop: 4,
    },

    // ─── Meta Row (Hàng thống kê phụ) - Dashboard ─────
    metaRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    metaCard: {
        flex: 1,
        backgroundColor: Colors.surface,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    metaCardTitle: {
        fontSize: 11,
        fontWeight: '700',
        color: Colors.textMuted,
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    metaBigNum: {
        fontSize: 30,
        fontWeight: '800',
        letterSpacing: -1,
    },

    // ─── Section Thống kê biểu đồ - Dashboard ─────────
    section: {
        backgroundColor: Colors.surface,
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: Colors.border,
        marginBottom: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 8,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text,
    },

    // ─── Period Toggle - Dashboard ────────────────────
    periodRow: {
        flexDirection: 'row',
        backgroundColor: Colors.bg,
        borderRadius: 10,
        padding: 4,
        marginBottom: 20,
        alignSelf: 'flex-start',
    },
    periodBtn: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 8,
    },
    periodBtnActive: {
        backgroundColor: Colors.surface,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
    },
    periodBtnText: {
        fontSize: 13,
        color: Colors.textMuted,
        fontWeight: '600',
    },
    periodBtnTextActive: {
        color: Colors.accent,
        fontWeight: '700',
    },

    // ─── Biểu Đồ - Dashboard ──────────────────────────
    chartScroll: {
        flexDirection: 'row',
    },
    barColumn: {
        alignItems: 'center',
        width: 55, 
        marginRight: 8,
    },
    barValueLabel: {
        fontSize: 10,
        fontWeight: '600',
        color: Colors.textSub,
        marginBottom: 4,
    },
    barTrack: {
        height: 100,
        width: 16,
        backgroundColor: '#F8F9FA',
        borderRadius: 8,
        justifyContent: 'flex-end',
    },
    barFill: {
        width: '100%',
        borderRadius: 8,
    },
    barXLabel: {
        fontSize: 10,
        color: Colors.textMuted,
        marginTop: 8,
        textAlign: 'center',
    },
});