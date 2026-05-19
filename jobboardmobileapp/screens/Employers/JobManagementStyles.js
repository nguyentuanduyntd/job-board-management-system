import { StyleSheet, Dimensions } from 'react-native';
import { Colors } from './Styles';

const { width, height } = Dimensions.get('window');

// ─── Form Modal styles ────────────────────────────────────────────────────────
export const formStyles = StyleSheet.create({
    title: { fontSize: 20, fontWeight: '800', color: Colors.text, textAlign: 'center', marginBottom: 20 },
    input: { marginBottom: 12, backgroundColor: Colors.surface },
    submitBtn: { marginTop: 8, borderRadius: 10, backgroundColor: Colors.accent },
});

// ─── Job Card styles ──────────────────────────────────────────────────────────
export const cardStyles = StyleSheet.create({
    card: { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
    cardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
    title: { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: 2 },
    company: { fontSize: 13, color: Colors.textSub },
    badgeContainer: { alignItems: 'flex-end', gap: 4 },
    badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, marginLeft: 8 },
    badgeText: { fontSize: 11, fontWeight: '700' },
    featuredBadge: { backgroundColor: '#FEF3C7', borderColor: '#F59E0B', borderWidth: 1 },
    featuredBadgeText: { color: '#D97706', fontSize: 11, fontWeight: '700' },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    info: { fontSize: 12, color: Colors.textSub },
    actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
    editBtn: { flex: 1, backgroundColor: '#EFF6FF', borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
    editBtnText: { color: Colors.accent, fontWeight: '700', fontSize: 13 },
    deleteBtn: { flex: 1, backgroundColor: '#FEF2F2', borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
    deleteBtnText: { color: Colors.red, fontWeight: '700', fontSize: 13 },
    boostBtn: { flex: 1, backgroundColor: '#FFFBEB', borderColor: '#F59E0B', borderWidth: 1, borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
    boostBtnText: { color: '#D97706', fontWeight: '700', fontSize: 13 },
});

// ─── Add Button & Screen styles ───────────────────────────────────────────────
export const addBtnStyles = StyleSheet.create({
    btn: { backgroundColor: Colors.accent, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
    text: { color: Colors.surface, fontWeight: '700', fontSize: 14 },
});

export const listStyles = StyleSheet.create({
    scrollContent: { padding: 16, paddingBottom: 40 },
    emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
    emptyIcon: { fontSize: 48, marginBottom: 12 },
    emptyText: { fontSize: 15, color: Colors.textMuted, textAlign: 'center', lineHeight: 22 },
});

// ─── Boost Package Modal styles ───────────────────────────────────────────────
export const boostStyles = StyleSheet.create({
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: height * 0.8 },
    modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center', color: Colors.text },
    packageCard: { borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 15, marginBottom: 10, backgroundColor: Colors.surface },
    packageCardSelected: { borderColor: '#6366F1', backgroundColor: '#EEF2FF', borderWidth: 2 },
    packageName: { fontSize: 16, fontWeight: 'bold', color: Colors.text },
    packagePrice: { fontSize: 15, color: '#6366F1', fontWeight: 'bold', marginTop: 4 },
    packageDesc: { fontSize: 12, color: Colors.textSub, marginTop: 4 },
    stripeBtn: { backgroundColor: '#635BFF', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 15 },
    stripeBtnDisabled: { backgroundColor: '#A5A2EE' },
    stripeBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    cancelBtn: { paddingVertical: 12, alignItems: 'center', marginTop: 5 },
    cancelBtnText: { color: Colors.textSub, fontSize: 14, fontWeight: '500' }
});