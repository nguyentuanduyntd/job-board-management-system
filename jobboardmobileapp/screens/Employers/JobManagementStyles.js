import { StyleSheet } from 'react-native';
import { Colors } from './Styles';

// ─── Form Modal styles ────────────────────────────────────────────────────────
export const formStyles = StyleSheet.create({
    title: {
        fontSize: 20,
        fontWeight: '800',
        color: Colors.text,
        textAlign: 'center',
        marginBottom: 20,
    },
    input: {
        marginBottom: 12,
        backgroundColor: Colors.surface,
    },
    submitBtn: {
        marginTop: 8,
        borderRadius: 10,
        backgroundColor: Colors.accent,
    },
});

// ─── Job Card styles ──────────────────────────────────────────────────────────
export const cardStyles = StyleSheet.create({
    card: {
        backgroundColor: Colors.surface,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: Colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 10,
    },
    title: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 2,
    },
    company: {
        fontSize: 13,
        color: Colors.textSub,
    },
    badge: {
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
        marginLeft: 8,
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '700',
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    info: {
        fontSize: 12,
        color: Colors.textSub,
    },
    actions: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 12,
    },
    editBtn: {
        flex: 1,
        backgroundColor: '#EFF6FF',
        borderRadius: 8,
        paddingVertical: 8,
        alignItems: 'center',
    },
    editBtnText: {
        color: Colors.accent,
        fontWeight: '700',
        fontSize: 13,
    },
    deleteBtn: {
        flex: 1,
        backgroundColor: '#FEF2F2',
        borderRadius: 8,
        paddingVertical: 8,
        alignItems: 'center',
    },
    deleteBtnText: {
        color: Colors.red,
        fontWeight: '700',
        fontSize: 13,
    },
});

// ─── Add Button styles ────────────────────────────────────────────────────────
export const addBtnStyles = StyleSheet.create({
    btn: {
        backgroundColor: Colors.accent,
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 8,
    },
    text: {
        color: Colors.surface,
        fontWeight: '700',
        fontSize: 14,
    },
});

// ─── Screen / List styles ─────────────────────────────────────────────────────
export const listStyles = StyleSheet.create({
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },
    emptyWrap: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 80,
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: 12,
    },
    emptyText: {
        fontSize: 15,
        color: Colors.textMuted,
        textAlign: 'center',
        lineHeight: 22,
    },
});