import { StyleSheet, Dimensions, Platform } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CONTAINER_PADDING = 20;

export const Colors = {
    bg:         '#F5F7FA',
    surface:    '#FFFFFF',
    border:     '#EAECF0',
    accent:     '#2563EB',
    accentLight:'#EFF6FF', 
    green:      '#16A34A',
    yellow:     '#D97706',
    red:        '#DC2626',
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

    // ─── Header ─────────────────────────────────────
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

    // ─── Overview Grid (Thẻ ngang hàng) ─────────────
    overviewGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 20,
    },
    overviewCard: {
        width: (SCREEN_WIDTH - (CONTAINER_PADDING * 2) - 12) / 2, // Tính toán chia đôi màn hình giống hệt Admin
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
        fontSize: 22, // Size 22 cho giống chuẩn bên Admin Dashboard
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    overviewLabel: {
        fontSize: 12,
        color: Colors.textMuted,
        fontWeight: '600',
        marginTop: 4,
    },

    // ─── Meta Row (Hàng thống kê phụ) ───────────────
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

    // ─── Section Thống kê biểu đồ ───────────────────
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

    // ─── Period Toggle (Tháng/Quý/Năm) ──────────────
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

    // ─── Biểu Đồ ────────────────────────────────────
    chartScroll: {
        flexDirection: 'row',
    },
    barColumn: {
        alignItems: 'center',
        width: 55, // 55 để hiển thị label ngang rõ hơn (giống Admin)
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
        width: 16, // Thanh bar chuẩn
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