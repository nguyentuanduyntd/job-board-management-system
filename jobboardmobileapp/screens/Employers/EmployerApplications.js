import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, FlatList, TouchableOpacity,
    ActivityIndicator, RefreshControl, Alert, Modal, TextInput, Linking, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { authApi, endpoints } from '../../configs/Apis';
import styles, { Colors } from './Styles'; 
import { Ionicons } from '@expo/vector-icons';

const VIP_CONFIG = {
    1: { border: '#F59E0B', bg: '#FFFBEB', text: '#D97706', icon: <Ionicons name="medal" size={16} color="#B45309" />, label: 'VIP 1' },
    2: { border: '#0EA5E9', bg: '#F0F9FF', text: '#0369A1', icon: <Ionicons name="medal" size={16} color="#9CA3AF" />, label: 'VIP 2' },
    3: { border: '#A855F7', bg: '#FAF5FF', text: '#7E22CE', icon: <Ionicons name="medal" size={16} color="#F59E0B" />, label: 'VIP 3' },
};
const PAGE_SIZE = 5;

export default function EmployerApplication() {
    const [applications, setApplications] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [page, setPage] = useState(1);
    const [hasNext, setHasNext] = useState(true);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedApp, setSelectedApp] = useState(null);
    const [note, setNote] = useState('');
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const token = await AsyncStorage.getItem("token");
                const res = await authApi(token).get(endpoints['categories']);
                setCategories(res.data.results || res.data);
            } catch (ex) {
                console.error("Lỗi load danh mục:", ex);
            }
        };
        fetchCategories();
    }, []);

    const loadApplications = useCallback(async (pageNumber = 1, category = selectedCategory, isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else if (pageNumber === 1) setLoading(true);
        else setLoadingMore(true);

        try {
            const token = await AsyncStorage.getItem("token");
            let url = `${endpoints['applications']}?page=${pageNumber}&page_size=${PAGE_SIZE}`;
            if (category) url += `&job__category=${category}`;

            const res = await authApi(token).get(url);
            const newData = res.data.results || [];
            
            setApplications(newData);
            const total = res.data.count || 0;
            setTotalPages(Math.ceil(total / PAGE_SIZE));
            setPage(pageNumber);
        } catch (error) {
            console.error("Lỗi load applications:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [selectedCategory]);

    useEffect(() => {
        loadApplications(1, selectedCategory);
    }, [selectedCategory, loadApplications]);

    const handleEvaluate = async (newStatus) => {
        if (!selectedApp) return;

        // Chặn UI: Không cho ACCEPTED nếu job tương ứng của đơn này đã đầy chỉ tiêu trước đó
        if (newStatus === 'ACCEPTED') {
            const currentAccepted = Number(selectedApp.job?.accepted_count || 0);
            const targetQuantity = Number(selectedApp.job?.quantity || 1);

            if (currentAccepted >= targetQuantity) {
                Alert.alert("Không thể phê duyệt", "Vị trí tuyển dụng này đã tuyển đạt tối đa số lượng chỉ tiêu!");
                return;
            }
        }

        setProcessing(true);
        try {
            const token = await AsyncStorage.getItem("token");

            if (note !== (selectedApp.employer_note || '')) {
                await authApi(token).patch(
                    endpoints['application-add-note'](selectedApp.id),
                    { employer_note: note }
                );
            }

            await authApi(token).patch(
                endpoints['application-update-status'](selectedApp.id),
                { status: newStatus }
            );

            Alert.alert("Thành công", "Đã cập nhật đánh giá hồ sơ!");
            setSelectedApp(null);
            loadApplications(1, selectedCategory, true);
        } catch (error) {
            Alert.alert("Lỗi", error.response?.data?.error || "Không thể cập nhật trạng thái.");
        } finally {
            setProcessing(false);
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'ACCEPTED': return { color: Colors.green, bg: '#F0FDF4' };
            case 'REJECTED': return { color: Colors.red, bg: '#FEF2F2' };
            case 'REVIEWING': return { color: Colors.yellow, bg: '#FEFCE8' };
            default: return { color: Colors.textSub, bg: '#F3F4F6' };
        }
    };

    const renderAppItem = ({ item }) => {
        const statusStyle = getStatusStyle(item.status);
        const isVip = item.is_priority_active;
        const vipLevel = item.priority_level || 1;
        const vipStyle = VIP_CONFIG[vipLevel] || VIP_CONFIG[1];

        return (
            <TouchableOpacity 
                style={[
                    styles.card,
                    isVip && styles.cardFeatured,
                    isVip && { borderColor: vipStyle.border, backgroundColor: vipStyle.bg, shadowColor: vipStyle.border }
                ]}
                onPress={() => {
                    setSelectedApp(item);
                    setNote(item.employer_note || '');
                }}
            >
                {isVip && (
                    <View style={styles.vipRow}>
                        <View style={[styles.vipBadge, { backgroundColor: vipStyle.border, flexDirection: 'row', alignItems: 'center' }]}>
                            {vipStyle.icon}
                            <Text style={[styles.vipBadgeText, { marginLeft: 4 }]}>{vipStyle.label}</Text>
                        </View>
                        <Text style={[styles.vipLabel, { color: vipStyle.text }]}>Hồ sơ nổi bật</Text>
                    </View>
                )}
                
                <Text style={styles.candidateName}>{item.candidate?.username || 'Ẩn danh'}</Text>
                <Text style={styles.jobTitleText}>Ứng tuyển: {item.job?.title}</Text>
                <Text style={styles.dateText}>Nộp lúc: {new Date(item.created_at).toLocaleDateString('vi-VN')}</Text>
                
                <View style={[styles.statusWrap, { backgroundColor: statusStyle.bg }]}>
                    <Text style={[styles.statusText, { color: statusStyle.color }]}>{item.status}</Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.root}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>Đơn ứng tuyển</Text>
                    <Text style={styles.headerSub}>Quản lý và xét duyệt hồ sơ</Text>
                </View>
            </View>

            <View style={styles.filterContainer}>
                <View style={styles.pickerWrapper}>
                    <Picker
                        selectedValue={selectedCategory}
                        onValueChange={(val) => setSelectedCategory(val)}
                        style={styles.picker}
                    >
                        <Picker.Item label="Tất cả danh mục công việc" value="" color={Colors.textSub} />
                        {categories.map(cat => (
                            <Picker.Item key={cat.id} label={cat.name} value={String(cat.id)} color={Colors.text} />
                        ))}
                    </Picker>
                </View>
            </View>

            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={Colors.accent} />
                </View>
            ) : (
                <FlatList
                    contentContainerStyle={styles.listContent}
                    data={applications}
                    keyExtractor={item => item.id.toString()}
                    renderItem={renderAppItem}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={() => loadApplications(1, selectedCategory, true)} />
                    }
                    ListEmptyComponent={<Text style={styles.emptyText}>Không tìm thấy đơn ứng tuyển nào.</Text>}
                />
            )}

            <Modal visible={!!selectedApp} animationType="slide" transparent={true}>
                <View style={styles.interview.modalOverlay}>
                    <View style={styles.interview.modalSheet}>
                        <View style={styles.interview.handleBar} />
                        <Text style={styles.interview.modalTitle}>Đánh giá ứng viên</Text>
                        
                        {selectedApp && (
                            <ScrollView showsVerticalScrollIndicator={false}>
                                <Text style={styles.modalRow}>
                                    Ứng viên: <Text style={styles.modalValue}>{selectedApp.candidate?.username}</Text>
                                </Text>
                                <Text style={styles.modalJob}>Công việc: {selectedApp.job?.title}</Text>
                                
                                <TouchableOpacity 
                                    style={styles.cvBtn}
                                    onPress={() => {
                                        const url = selectedApp.cv_file_url || selectedApp.candidate?.profile?.cv_file_url;
                                        if (!url) {
                                            Alert.alert("Thông báo", "Ứng viên chưa đính kèm CV");
                                            return;
                                        }
                                        Linking.openURL(url);
                                    }}
                                >
                                    <Text style={styles.cvBtnText}>📥 Mở CV đính kèm</Text>
                                </TouchableOpacity>

                                <Text style={styles.noteLabel}>Ghi chú nội bộ (Chỉ bạn thấy):</Text>
                                <TextInput
                                    style={styles.noteInput}
                                    placeholder="Ghi chú về ứng viên..."
                                    placeholderTextColor={Colors.textMuted}
                                    multiline
                                    value={note}
                                    onChangeText={setNote}
                                />

                                <Text style={styles.decisionLabel}>Quyết định trạng thái:</Text>
                                <View style={styles.decisionRow}>
                                    <TouchableOpacity 
                                        style={[styles.btnAction, { backgroundColor: Colors.yellow }]} 
                                        onPress={() => handleEvaluate('REVIEWING')} disabled={processing}
                                    >
                                        <Text style={styles.btnActionText}>XEM XÉT</Text>
                                    </TouchableOpacity>
                                    
                                    <TouchableOpacity 
                                        style={[styles.btnAction, { backgroundColor: Colors.green }]} 
                                        onPress={() => handleEvaluate('ACCEPTED')} disabled={processing}
                                    >
                                        <Text style={styles.btnActionText}>DUYỆT</Text>
                                    </TouchableOpacity>
                                    
                                    <TouchableOpacity 
                                        style={[styles.btnAction, { backgroundColor: Colors.red }]} 
                                        onPress={() => handleEvaluate('REJECTED')} disabled={processing}
                                    >
                                        <Text style={styles.btnActionText}>TỪ CHỐI</Text>
                                    </TouchableOpacity>
                                </View>

                                <TouchableOpacity 
                                    style={styles.btnClose} 
                                    onPress={() => setSelectedApp(null)} 
                                    disabled={processing}
                                >
                                    <Text style={styles.btnCloseText}>ĐÓNG</Text>
                                </TouchableOpacity>
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}