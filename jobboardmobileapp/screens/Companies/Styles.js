import { StyleSheet } from 'react-native';
const PRIMARY = '#3B5BDB';

export default StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },

    // Header bar
    headerBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: PRIMARY,
        paddingHorizontal: 12,
        paddingVertical: 12,
        justifyContent: 'space-between',
    },
    backBtn: {
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backBtnText: {
        color: '#fff',
        fontSize: 28,
        lineHeight: 32,
        fontWeight: '300',
    },
    headerTitle: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '600',
        flex: 1,
        textAlign: 'center',
    },

    // Hero
    hero: {
        backgroundColor: '#fff',
        alignItems: 'center',
        paddingVertical: 28,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    heroLogo: {
        width: 90,
        height: 90,
        borderRadius: 16,
        backgroundColor: '#eee',
        marginBottom: 14,
    },
    heroName: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111',
        textAlign: 'center',
        marginBottom: 8,
    },
    heroMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    heroMetaText: {
        fontSize: 13,
        color: '#555',
        textAlign: 'center',
    },
    websiteLink: {
        fontSize: 13,
        color: PRIMARY,
        marginBottom: 14,
        textDecorationLine: 'underline',
    },
    jobCountBadge: {
        backgroundColor: '#EEF2FF',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 6,
        marginTop: 4,
    },
    jobCountText: {
        fontSize: 13,
        color: PRIMARY,
        fontWeight: '600',
    },

    // Section
    section: {
        marginTop: 12,
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111',
        marginBottom: 10,
    },
    totalCount: {
        fontSize: 13,
        color: '#888',
    },
    descText: {
        fontSize: 14,
        color: '#444',
        lineHeight: 22,
    },

    // Job card
    jobCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#eee',
        padding: 14,
        marginBottom: 10,
    },
    featuredCard: {
        borderLeftWidth: 4,
        borderLeftColor: '#F59E0B',
    },
    featuredBadge: {
        alignSelf: 'flex-start',
        backgroundColor: '#FEF3C7',
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 2,
        marginBottom: 8,
    },
    featuredBadgeText: {
        fontSize: 11,
        color: '#D97706',
        fontWeight: '600',
    },
    jobTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#222',
        marginBottom: 4,
    },
    jobSalary: {
        fontSize: 13,
        color: PRIMARY,
        marginBottom: 8,
    },
    tagRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginBottom: 8,
    },
    tag: {
        backgroundColor: '#EEF2FF',
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    tagText: {
        fontSize: 12,
        color: PRIMARY,
    },
    skillRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    skillTag: {
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 3,
    },
    skillText: {
        fontSize: 11,
        color: '#555',
    },
    moreSkills: {
        fontSize: 11,
        color: '#888',
        alignSelf: 'center',
    },

    // Paginator (copy từ Styles.js)
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
        backgroundColor: PRIMARY,
        borderColor: PRIMARY,
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
    pageBtnTextActive: {
        color: '#fff',
    },
    pageBtnTextDisabled: {
        color: '#ccc',
    },
    pageDots: {
        fontSize: 14,
        color: '#888',
        paddingHorizontal: 4,
    },

    emptyText: {
        textAlign: 'center',
        marginTop: 24,
        color: '#888',
        fontSize: 14,
    },

    // ==================== THANH TÌM KIẾM ====================
  searchContainer: {
    backgroundColor: '#3B5BDB',
    padding: 16,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
  },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#333',
  },

  // ==================== TIÊU ĐỀ PHÂN ĐOẠN ====================
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
  },
  totalCount: {
    fontSize: 13,
    color: '#888',
  },

  // Trạng thái trống hoặc lỗi
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    color: '#888',
    fontSize: 15,
  },

  // ==================== THẺ CÔNG TY (COMPANY CARD) ====================
  // Tối ưu hóa layout dạng list hàng dọc
  companyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 12,
    flexDirection: 'row', // Hiển thị theo hàng ngang
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  companyLogo: {
    width: 64,
    height: 64,
    borderRadius: 10,
    backgroundColor: '#eee',
  },
  // Khối bọc text nằm bên phải Logo
  companyCardInfo: {
    flex: 1, // Chiếm hết không gian còn lại
    marginLeft: 14,
    justifyContent: 'center',
  },
  companyCardName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#222',
    // Cài đặt để văn bản không tràn ra ngoài
    flexWrap: 'wrap', // Cho phép xuống dòng
    numberOfLines: 2, // Hiển thị tối đa 2 dòng
    // ellipseMode: 'tail', // Cắt bớt phần văn bản thừa và thêm dấu ba chấm
  },
  companyJobCount: {
    fontSize: 13,
    color: '#3B5BDB',
    fontWeight: '500',
  },

  // ==================== PHÂN TRANG (PAGINATOR) ====================
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
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
  pageBtnTextActive: {
    color: '#fff',
  },
  pageBtnTextDisabled: {
    color: '#ccc',
  },
  pageDots: {
    fontSize: 14,
    color: '#888',
    paddingHorizontal: 4,
  },
});