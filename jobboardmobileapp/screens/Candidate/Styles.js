import { StyleSheet } from 'react-native';

export default StyleSheet.create({

    // ── Layout ────────────────────────────────────────────────
    container: {
        flex: 1,
        backgroundColor: '#F0F4FF',
    },

    // ── Header ───────────────────────────────────────────────
    header: {
        backgroundColor: '#3B5BDB',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        gap: 10,
    },
    backBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    backIcon: {
        color: '#fff',
        fontSize: 22,
        fontWeight: '600',
        lineHeight: 26,
    },
    headerTitle: {
        flex: 1,
        color: '#fff',
        fontSize: 17,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
    countBubble: {
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 3,
        minWidth: 28,
        alignItems: 'center',
    },
    countText: {
        color: '#3B5BDB',
        fontSize: 13,
        fontWeight: '700',
    },

    // ── Tab bar ───────────────────────────────────────────────
    tabBar: {
        backgroundColor: '#fff',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#E8EDFF',
        flexGrow: 0,
    },
    tab: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 20,
        backgroundColor: '#F0F4FF',
        gap: 5,
    },
    tabActive: {
        backgroundColor: '#3B5BDB',
    },
    tabText: {
        fontSize: 13,
        color: '#555',
        fontWeight: '500',
    },
    tabTextActive: {
        color: '#fff',
        fontWeight: '700',
    },
    tabBadge: {
        backgroundColor: '#dde3f8',
        borderRadius: 10,
        paddingHorizontal: 6,
        paddingVertical: 1,
        minWidth: 20,
        alignItems: 'center',
    },
    tabBadgeActive: {
        backgroundColor: 'rgba(255,255,255,0.3)',
    },
    tabBadgeText: {
        fontSize: 11,
        color: '#3B5BDB',
        fontWeight: '700',
    },
    tabBadgeTextActive: {
        color: '#fff',
    },

    // ── Card ──────────────────────────────────────────────────
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        flexDirection: 'row',
        overflow: 'hidden',
        elevation: 3,
        shadowColor: '#3B5BDB',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
    },
    stripe: {
        width: 4,
    },
    cardBody: {
        flex: 1,
        padding: 14,
        gap: 10,
    },

    // ── Top row ───────────────────────────────────────────────
    topRow: {
        flexDirection: 'row',
        gap: 12,
        alignItems: 'flex-start',
    },
    logo: {
        width: 56,
        height: 56,
        borderRadius: 10,
        backgroundColor: '#f0f0f0',
    },
    jobInfo: {
        flex: 1,
        gap: 2,
    },
    jobTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1a1a2e',
        lineHeight: 20,
    },
    company: {
        fontSize: 13,
        color: '#555',
    },
    salary: {
        fontSize: 13,
        color: '#3B5BDB',
        fontWeight: '600',
        marginTop: 2,
    },

    // ── Status badge ──────────────────────────────────────────
    badge: {
        borderRadius: 10,
        paddingHorizontal: 8,
        paddingVertical: 5,
        alignItems: 'center',
        gap: 2,
        minWidth: 76,
    },
    badgeIcon: {
        fontSize: 14,
    },
    badgeLabel: {
        fontSize: 11,
        fontWeight: '700',
        textAlign: 'center',
    },

    // ── Meta row ──────────────────────────────────────────────
    metaRow: {
        flexDirection: 'row',
        gap: 16,
        flexWrap: 'wrap',
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaIcon: { fontSize: 12 },
    metaText: { fontSize: 12, color: '#777' },

    // ── Employer note ─────────────────────────────────────────
    noteBox: {
        backgroundColor: '#F8F9FF',
        borderRadius: 8,
        padding: 10,
        borderLeftWidth: 3,
        borderLeftColor: '#3B5BDB',
        gap: 4,
    },
    noteLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: '#3B5BDB',
    },
    noteText: {
        fontSize: 12,
        color: '#444',
        lineHeight: 18,
    },

    // ── Cover letter preview ──────────────────────────────────
    coverPreview: {
        fontSize: 12,
        color: '#888',
        fontStyle: 'italic',
        lineHeight: 18,
        borderLeftWidth: 3,
        borderLeftColor: '#E0E7FF',
        paddingLeft: 10,
    },

    // ── Cancel button ─────────────────────────────────────────
    cancelBtn: {
        alignSelf: 'flex-end',
        borderWidth: 1.5,
        borderColor: '#EF4444',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 6,
    },
    cancelBtnText: {
        fontSize: 13,
        color: '#EF4444',
        fontWeight: '600',
    },

    // ── Info note (REVIEWING) ─────────────────────────────────
    infoNote: {
        backgroundColor: '#EEF2FF',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 7,
        alignSelf: 'flex-start',
    },
    infoNoteText: {
        fontSize: 12,
        color: '#3B5BDB',
    },

    // ── Empty state ───────────────────────────────────────────
    empty: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
        gap: 10,
    },
    emptyIcon: {
        fontSize: 52,
        marginBottom: 8,
    },
    emptyTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#222',
        textAlign: 'center',
    },
    emptyDesc: {
        fontSize: 14,
        color: '#888',
        textAlign: 'center',
        lineHeight: 20,
    },
    findJobBtn: {
        marginTop: 12,
        backgroundColor: '#3B5BDB',
        borderRadius: 24,
        paddingHorizontal: 28,
        paddingVertical: 12,
    },
    findJobBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
    },

    // ── Cancel modal ──────────────────────────────────────────
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    dialog: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 24,
        width: '100%',
        alignItems: 'center',
        gap: 10,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
    },
    dialogIcon: { fontSize: 38, marginBottom: 4 },
    dialogTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1a1a2e',
    },
    dialogDesc: {
        fontSize: 14,
        color: '#555',
        textAlign: 'center',
        lineHeight: 21,
    },
    dialogBtns: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
        width: '100%',
    },
    dialogBtnSecondary: {
        flex: 1,
        borderWidth: 1.5,
        borderColor: '#ddd',
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: 'center',
    },
    dialogBtnSecondaryText: {
        fontSize: 14,
        color: '#555',
        fontWeight: '600',
    },
    dialogBtnDanger: {
        flex: 1,
        backgroundColor: '#EF4444',
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: 'center',
    },
    dialogBtnDangerText: {
        fontSize: 14,
        color: '#fff',
        fontWeight: '700',
    },
});