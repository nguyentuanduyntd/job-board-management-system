import { StyleSheet, Dimensions } from 'react-native';
const { width: SCREEN_WIDTH } = Dimensions.get('window');
export default StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: '#f5f5f5' 
    },

    // ==================== SEARCH ====================
    searchContainer: {
        backgroundColor: '#3B5BDB',
        padding: 16,
    },
    searchRow: {
        flexDirection: 'row',
        gap: 8,
        alignItems: 'center',
    },
    searchInput: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 25,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 15,
    },
    sortBtn: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 25,
        width: 42,
        height: 42,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sortBtnIcon: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },

    // ==================== CATEGORIES ====================
    categoryList: { 
        paddingHorizontal: 16, 
        marginVertical: 12 
    },
    categoryItem: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 12,
        marginRight: 12,
        alignItems: 'center',
        minWidth: 80,
    },
    categoryItemActive: {
        backgroundColor: '#3B5BDB',
        borderColor: '#3B5BDB',
    },
    categoryText: { 
        fontSize: 13, 
        color: '#333', 
        marginTop: 4 
    },
    categoryTextActive: { color: '#fff' },

    // ==================== SECTION HEADER ====================
    sectionTitle: {
        fontSize: 18, 
        fontWeight: 'bold',
        marginHorizontal: 16, 
        marginBottom: 8
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginHorizontal: 16,
        marginBottom: 8,
        marginTop: 4,
    },
    jobHeaderRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    totalCount: {
        fontSize: 13,
        color: '#888',
    },
    seeAll: {
        fontSize: 13,
        color: '#3B5BDB',
        fontWeight: '500',
    },

    // ==================== SORT CHIP ====================
    sortChip: {
        backgroundColor: '#EEF2FF',
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    sortChipText: {
        fontSize: 12,
        color: '#3B5BDB',
        fontWeight: '600',
    },

    // ==================== EMPTY / LOADING ====================
    emptyText: {
        textAlign: 'center',
        marginTop: 40,
        color: '#888',
        fontSize: 15,
    },

    // ==================== JOB CARD ====================
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        marginHorizontal: 16,
        marginBottom: 12,
        padding: 12,
        elevation: 2,
        borderWidth: 1.5,
        borderColor: '#eee',
        position: 'relative',
        overflow: 'hidden' // Giúp ribbon ko bị lồi ra ngoài góc bo tròn
    },
    // STYLE KHI CÓ TIN NỔI BẬT
    cardFeatured: {
        backgroundColor: '#F0FDF4', 
        borderColor: '#22C55E',     
    },
    // DẢI BĂNG GÓC TRÊN CÙNG
    featuredRibbon: { 
        position: 'absolute', 
        top: 0, 
        right: 0, 
        backgroundColor: '#F59E0B', 
        paddingHorizontal: 12, 
        paddingVertical: 5, 
        borderBottomLeftRadius: 12, 
        borderTopRightRadius: 10, 
        zIndex: 99,
    },
    featuredRibbonText: { 
        color: '#FFFFFF', 
        fontSize: 10, 
        fontWeight: '900', 
        textTransform: 'uppercase' 
    },
    cardHeader: { 
        flexDirection: 'row',
        marginTop: 6 // Cân chỉnh lại sau khi có Ribbon
    },
    logo: { 
        width: 60, 
        height: 60, 
        borderRadius: 8, 
        backgroundColor: '#eee' 
    },
    cardInfo: { 
        flex: 1, 
        marginLeft: 12 
    },
    jobTitle: { 
        fontSize: 15, 
        fontWeight: '600', 
        color: '#222',
        paddingRight: 20 // Tránh text dài bị chèn vào dải băng
    },
    companyName: { 
        fontSize: 13, 
        color: '#555', 
        marginTop: 2 
    },
    salary: { 
        fontSize: 13, 
        color: '#3B5BDB', 
        marginTop: 4 
    },
    cardFooter: { 
        flexDirection: 'row', 
        marginTop: 8,
        flexWrap: 'wrap',
        gap: 6
    },
    tag: {
        backgroundColor: '#EEF2FF',
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    tagText: { 
        fontSize: 12, 
        color: '#3B5BDB' 
    },
    skillRow: { flexDirection: 'row', marginTop: 8, flexWrap: 'wrap', gap: 6 },
    skillTag: {
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 3,
    },
    skillText: { fontSize: 11, color: '#555' },
    moreSkills: { fontSize: 11, color: '#888', alignSelf: 'center' },

    // ==================== PAGINATOR ====================
    paginatorContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 16,
        gap: 6,
    },
    pageBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        elevation: 1,
    },
    pageBtnActive: {
        backgroundColor: '#3B5BDB',
        borderColor: '#3B5BDB',
    },
    pageBtnDisabled: {
        backgroundColor: '#f5f5f5',
        borderColor: '#eee',
    },
    pageBtnText: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
    },
    pageBtnTextActive: { color: '#fff' },
    pageBtnTextDisabled: { color: '#ccc' },
    pageDots: {
        fontSize: 14,
        color: '#888',
        paddingHorizontal: 4,
    },

    // ==================== COMPANY CARD ====================
    companyCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 12,
        marginRight: 12,
        alignItems: 'center',
        width: 130,
        elevation: 2,
    },
    companyLogo: {
        width: 70,
        height: 70,
        borderRadius: 10,
        backgroundColor: '#eee',
        marginBottom: 8,
    },
    companyCardName: {
        fontSize: 13,
        fontWeight: '600',
        color: '#222',
        textAlign: 'center',
    },
    companyJobCount: {
        fontSize: 12,
        color: '#3B5BDB',
        marginTop: 4,
    },

    // ==================== SORT MODAL ====================
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.35)',
        justifyContent: 'flex-end',
    },
    modalBox: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 32,
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#222',
        marginBottom: 16,
    },
    modalOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 13,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    modalOptionActive: {
    },
    modalOptionText: {
        fontSize: 15,
        color: '#444',
    },
    modalOptionTextActive: {
        color: '#3B5BDB',
        fontWeight: '600',
    },
    modalCheck: {
        fontSize: 16,
        color: '#3B5BDB',
        fontWeight: '700',
    },
    
    // STYLE CHO CHỨC NĂNG SO SÁNH VIỆC LÀM 
    cardBottomRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
    },
    compareCheckBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        backgroundColor: '#FCFDFF',
    },
    compareCheckBtnActive: {
        borderColor: '#3B5BDB',
        backgroundColor: '#EFF6FF',
    },
    compareCheckText: {
        fontSize: 12,
        color: '#4B5563',
    },
    compareCheckTextActive: {
        color: '#3B5BDB',
        fontWeight: '600',
    },
    floatingCompareBar: {
        position: 'absolute',
        bottom: 16,
        left: 16,
        right: 16,
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    floatingCompareText: {
        fontSize: 14,
        color: '#1F2937',
        fontWeight: '500',
    },
    floatingCompareSub: {
        fontSize: 11,
        color: '#9CA3AF',
        marginTop: 2,
    },
    clearCompareBtn: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
    },
    clearCompareText: {
        fontSize: 13,
        color: '#4B5563',
    },
    actionCompareBtn: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: '#3B5BDB',
    },
    actionCompareText: {
        fontSize: 13,
        color: '#FFFFFF',
        fontWeight: '600',
    },
    compareHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        backgroundColor: '#FFF',
    },
    compareCloseBtn: {
        padding: 4,
    },
    compareHeaderTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827',
    },
    compareScrollRow: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    compareColumn: {
        width: SCREEN_WIDTH * 0.45,
        paddingHorizontal: 12,
        alignItems: 'center',
    },
    compareLogo: {
        width: 44,
        height: 44,
        borderRadius: 8,
        backgroundColor: '#F3F4F6',
        marginBottom: 8,
    },
    compareJobTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#1F2937',
        textAlign: 'center',
        lineHeight: 18,
    },
    compareCompanyName: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2,
        textAlign: 'center',
    },
    compareSectionTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#4B5563',
        backgroundColor: '#F8FAFC',
        paddingVertical: 6,
        paddingHorizontal: 16,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    compareItemValue: {
        fontSize: 13,
        color: '#111827',
        fontWeight: '500',
        textAlign: 'center',
    },
    compareLongText: {
        fontSize: 12,
        color: '#374151',
        lineHeight: 18,
        textAlign: 'justify',
    },
});