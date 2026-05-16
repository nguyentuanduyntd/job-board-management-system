import { StyleSheet } from 'react-native';

export default StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },

    // ==================== HEADER ====================
    header: {
        backgroundColor: '#fff',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    jobTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#222',
        marginBottom: 12,
    },
    companyRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    companyLogo: {
        width: 48,
        height: 48,
        borderRadius: 8,
        backgroundColor: '#eee',
        marginRight: 12,
    },
    companyName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 10,
    },
    infoIcon: {
        fontSize: 18,
        marginRight: 8,
        marginTop: 1,
    },
    infoLabel: {
        fontSize: 14,
        color: '#666',
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#222',
    },
    infoValueBlue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#3B5BDB',
    },

    // ==================== TABS ====================
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    tab: {
        flex: 1,
        paddingVertical: 14,
        alignItems: 'center',
    },
    tabActive: {
        borderBottomWidth: 2,
        borderBottomColor: '#3B5BDB',
    },
    tabText: {
        fontSize: 15,
        color: '#888',
    },
    tabTextActive: {
        fontSize: 15,
        color: '#3B5BDB',
        fontWeight: '600',
    },

    // ==================== CONTENT ====================
    content: { padding: 16 },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#222',
        marginBottom: 12,
        marginTop: 8,
    },
    contentText: {
        fontSize: 15,
        color: '#444',
        lineHeight: 24,
    },

    // ==================== INFO GRID ====================
    infoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 12,
    },
    infoGridItem: {
        width: '47%',
        backgroundColor: '#f8f9fa',
        borderRadius: 10,
        padding: 12,
    },
    infoGridLabel: {
        fontSize: 12,
        color: '#888',
        marginBottom: 4,
    },
    infoGridValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#222',
    },

    // ==================== SKILLS ====================
    skillRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 8,
    },
    skillTag: {
        backgroundColor: '#EEF2FF',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    skillText: {
        fontSize: 13,
        color: '#3B5BDB',
    },

    // ==================== FEATURED BADGE ====================
    featuredBadge: {
        alignSelf: 'flex-start',
        backgroundColor: '#FEF3C7',
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 4,
        marginBottom: 8,
    },
    featuredBadgeText: {
        fontSize: 12,
        color: '#D97706',
        fontWeight: '600',
    },

    // ==================== COMPANY TAB ====================
    companyDetailLogo: {
        width: 80,
        height: 80,
        borderRadius: 12,
        backgroundColor: '#eee',
        marginBottom: 12,
        alignSelf: 'center',
    },
    companyDetailName: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#222',
        marginBottom: 16,
    },
    companyInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    companyInfoIcon: { fontSize: 18, marginRight: 12 },
    companyInfoText: { fontSize: 14, color: '#444', flex: 1 },
    websiteText: { fontSize: 14, color: '#3B5BDB', flex: 1 },

    // ==================== APPLY BUTTON ====================
    applyContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    applyBtn: {
        backgroundColor: '#3B5BDB',
        borderRadius: 30,
        paddingVertical: 16,
        alignItems: 'center',
    },
    applyBtnDisabled: {
        backgroundColor: '#aaa',
    },
    applyBtnText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: 'bold',
    },

    // ==================== MODAL ====================
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        maxHeight: '80%',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#222',
        marginBottom: 16,
        textAlign: 'center',
    },
    modalLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#444',
        marginBottom: 8,
        marginTop: 12,
    },
    modalInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 10,
        padding: 12,
        fontSize: 14,
        color: '#333',
        minHeight: 80,
        textAlignVertical: 'top',
    },
    cvOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 10,
        marginBottom: 8,
    },
    cvOptionActive: {
        borderColor: '#3B5BDB',
        backgroundColor: '#EEF2FF',
    },
    cvOptionText: {
        fontSize: 14,
        color: '#333',
        marginLeft: 10,
        flex: 1,
    },
    cvOptionTextActive: {
        color: '#3B5BDB',
        fontWeight: '600',
    },
    submitBtn: {
        backgroundColor: '#3B5BDB',
        borderRadius: 30,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 16,
    },
    submitBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    cancelBtn: {
        paddingVertical: 12,
        alignItems: 'center',
        marginTop: 8,
    },
    cancelBtnText: {
        color: '#888',
        fontSize: 15,
    },
});