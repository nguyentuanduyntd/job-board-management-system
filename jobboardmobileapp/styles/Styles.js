import { StyleSheet, Platform } from 'react-native';

export const GlobalColors = {
    primary: '#3B5BDB',       // Màu xanh chủ đạo của hệ thống
    bg: '#F5F7FA',            // Màu nền app
    surface: '#FFFFFF',       // Màu nền card/trắng
    border: '#EAECF0',        // Màu viền nhẹ
    text: '#111827',           // Màu chữ chính
    textSec: '#6B7280',        // Màu chữ phụ
    textMuted: '#9AA5B4',     
    danger: '#EF4444',       
    dangerBg: '#FEF2F2',
};

export default StyleSheet.create({
    // Cấu hình chung cho thanh phân trang Paginator toàn hệ thống
    paginatorWrap: { 
        flexDirection: 'row', 
        justifyContent: 'center', 
        alignItems: 'center', 
        paddingVertical: 16, 
        gap: 6, 
        backgroundColor: GlobalColors.surface, 
        borderTopWidth: 1, 
        borderTopColor: GlobalColors.border 
    },
    pageBtn: { 
        minWidth: 36, 
        height: 36, 
        borderRadius: 8, 
        borderWidth: 1, 
        borderColor: GlobalColors.border, 
        justifyContent: 'center', 
        alignItems: 'center', 
        paddingHorizontal: 10, 
        backgroundColor: GlobalColors.surface,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 1 },
            android: { elevation: 1 }
        })
    },
    pageBtnActive: { 
        backgroundColor: GlobalColors.primary, 
        borderColor: GlobalColors.primary 
    },
    pageBtnDisabled: { 
        opacity: 0.35 
    },
    pageBtnText: { 
        fontSize: 14, 
        fontWeight: '600', 
        color: GlobalColors.text 
    },
    pageBtnTextActive: { 
        color: '#fff' 
    },
    pageDots: { 
        fontSize: 14, 
        color: GlobalColors.textMuted, 
        paddingHorizontal: 4 
    },

    // Trạng thái trống/Không tìm thấy dữ liệu
    emptyText: {
        textAlign: 'center',
        marginTop: 40,
        color: GlobalColors.textMuted,
        fontSize: 15,
    }
});