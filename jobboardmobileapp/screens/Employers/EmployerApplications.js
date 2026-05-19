import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, FlatList, TouchableOpacity,
    ActivityIndicator, RefreshControl, Alert, Modal, TextInput, Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { authApi, endpoints } from '../../configs/Apis';
import { Colors } from './Styles';
import styles from './Styles';

export default function EmployerApplication(){
    // States cho Danh sách
    const [applications, setApplications] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    
    // States cho Phân trang
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [page, setPage] = useState(1);
    const [hasNext, setHasNext] = useState(true);

    // States cho Modal Đánh giá
    const [selectedApp, setSelectedApp] = useState(null);
    const [note, setNote] = useState('');
    const [processing, setProcessing] = useState(false);

    // Load Danh mục
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await authApi().get(endpoints['categories']);
                setCategories(res.data.results || res.data); // Tùy thuộc backend của bạn có phân trang categories không
            } catch (ex) {
                console.error("Lỗi load danh mục:", ex);
            }
        };
        fetchCategories();
    }, []);

    // Load Applications
    const loadApplications = useCallback(async (pageNumber = 1, category = selectedCategory, isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else if (pageNumber === 1) setLoading(true);
        else setLoadingMore(true);

        try {
            const token = await AsyncStorage.getItem("token");
            // Build URL với query params
            let url = `${endpoints['applications']}?page=${pageNumber}`;
            if (category) url += `&job__category=${category}`;

            const res = await authApi(token).get(url);
            
            // Xử lý dữ liệu trả về từ DRF Paginator
            const newData = res.data.results || [];
            
            if (pageNumber === 1) {
                setApplications(newData);
            } else {
                setApplications(prev => [...prev, ...newData]);
            }
            
            setHasNext(res.data.next !== null);
            setPage(pageNumber);
        } catch (error) {
            console.error("Lỗi load applications:", error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
            setRefreshing(false);
        }
    }, [selectedCategory]);

    useEffect(() => {
        loadApplications(1, selectedCategory);
    }, [selectedCategory, loadApplications]);

    const handleLoadMore = () => {
        if (hasNext && !loadingMore && !loading) {
            loadApplications(page + 1, selectedCategory);
        }
    };

    // Đánh giá - Cập nhật Status & Note
    const handleEvaluate = async (newStatus) => {
        if (!selectedApp) return;
        setProcessing(true);
        try {
            const token = await AsyncStorage.getItem("token");

            // Cập nhật note nếu có thay đổi (kể cả rỗng)
            if (note !== (selectedApp.employer_note || '')) {
                await authApi(token).patch(
                    endpoints['application-add-note'](selectedApp.id),
                    { employer_note: note }
                );
            }

            // Cập nhật status
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
        return (
            <TouchableOpacity 
                style={{ backgroundColor: Colors.surface, padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: item.is_priority_active ? 2 : 1, borderColor: item.is_priority_active ? Colors.yellow : Colors.border }}
                onPress={() => {
                    setSelectedApp(item);
                    setNote(item.employer_note || '');
                }}
            >
                {item.is_priority_active && <Text style={{ color: Colors.yellow, fontWeight: 'bold', marginBottom: 8 }}>⭐ Ứng viên ưu tiên (VIP)</Text>}
                
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: Colors.text }}>{item.candidate.username}</Text>
                <Text style={{ color: Colors.accent, marginVertical: 4 }}>Ứng tuyển: {item.job.title}</Text>
                <Text style={{ color: Colors.textSub, fontSize: 13 }}>Nộp lúc: {new Date(item.created_at).toLocaleDateString('vi-VN')}</Text>
                
                <View style={{ alignSelf: 'flex-start', backgroundColor: statusStyle.bg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, marginTop: 8 }}>
                    <Text style={{ color: statusStyle.color, fontWeight: 'bold', fontSize: 12 }}>{item.status}</Text>
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

            {/* Filter */}
            <View style={{ paddingHorizontal: 20, paddingVertical: 10, backgroundColor: Colors.surface, zIndex: 1 }}>
                <View style={{ borderWidth: 1, borderColor: Colors.border, borderRadius: 8 }}>
                    <Picker
                        selectedValue={selectedCategory}
                        onValueChange={(val) => setSelectedCategory(val)}
                        style={{ height: 50 }}
                    >
                        <Picker.Item label="Tất cả danh mục công việc" value="" />
                        {categories.map(cat => (
                            <Picker.Item key={cat.id} label={cat.name} value={String(cat.id)} />
                        ))}
                    </Picker>
                </View>
            </View>

            {/* List */}
            {loading ? (
                <View style={styles.centered}><ActivityIndicator size="large" color={Colors.accent} /></View>
            ) : (
                <FlatList
                    contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
                    data={applications}
                    keyExtractor={item => item.id.toString()}
                    renderItem={renderAppItem}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadApplications(1, selectedCategory, true)} />}
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={loadingMore ? <ActivityIndicator size="small" color={Colors.accent} style={{ marginVertical: 20 }} /> : null}
                    ListEmptyComponent={<Text style={{ textAlign: 'center', color: Colors.textMuted, marginTop: 40 }}>Không tìm thấy đơn ứng tuyển nào.</Text>}
                />
            )}

            {/* Modal Đánh Giá */}
            <Modal visible={!!selectedApp} animationType="slide" transparent={true}>
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
                    <View style={{ backgroundColor: Colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '90%' }}>
                        <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 15, color: Colors.text }}>Đánh giá ứng viên</Text>
                        
                        {selectedApp && (
                            <>
                                <Text style={{ fontWeight: '600', marginBottom: 5 }}>Ứng viên: <Text style={{ color: Colors.accent }}>{selectedApp.candidate.username}</Text></Text>
                                <Text style={{ fontWeight: '600', marginBottom: 15 }}>Công việc: {selectedApp.job.title}</Text>
                                
                                <TouchableOpacity 
                                    style={{ backgroundColor: '#EFF6FF', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 20 }}
                                    onPress={() =>{
                                        const url = selectedApp.cv_file_url || selectedApp.candidate.profile?.cv_file_url;
                                        if (!url) {
                                            Alert.alert("Thông báo", "Ứng viên chưa đính kèm CV")
                                            return;
                                        }
                                        Linking.openURL(url);
                                    }}
                                >
                                    <Text style={{ color: Colors.accent, fontWeight: 'bold' }}>📥 Mở CV đính kèm</Text>
                                </TouchableOpacity>

                                <Text style={{ fontWeight: 'bold', marginBottom: 8, color: Colors.textSub }}>Ghi chú nội bộ (Chỉ bạn thấy):</Text>
                                <TextInput
                                    style={{ borderWidth: 1, borderColor: Colors.border, borderRadius: 8, padding: 12, minHeight: 80, backgroundColor: Colors.bg, marginBottom: 20 }}
                                    placeholder="Ghi chú về ứng viên..."
                                    multiline
                                    value={note}
                                    onChangeText={setNote}
                                />

                                <Text style={{ fontWeight: 'bold', marginBottom: 10, color: Colors.textSub }}>Quyết định trạng thái:</Text>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
                                    <TouchableOpacity style={{ flex: 1, backgroundColor: Colors.yellow, padding: 12, borderRadius: 8, alignItems: 'center' }} onPress={() => handleEvaluate('REVIEWING')} disabled={processing}>
                                        <Text style={{ color: 'white', fontWeight: 'bold' }}>XEM XÉT</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={{ flex: 1, backgroundColor: Colors.green, padding: 12, borderRadius: 8, alignItems: 'center' }} onPress={() => handleEvaluate('ACCEPTED')} disabled={processing}>
                                        <Text style={{ color: 'white', fontWeight: 'bold' }}>DUYỆT</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={{ flex: 1, backgroundColor: Colors.red, padding: 12, borderRadius: 8, alignItems: 'center' }} onPress={() => handleEvaluate('REJECTED')} disabled={processing}>
                                        <Text style={{ color: 'white', fontWeight: 'bold' }}>TỪ CHỐI</Text>
                                    </TouchableOpacity>
                                </View>

                                <TouchableOpacity style={{ marginTop: 20, padding: 15, alignItems: 'center' }} onPress={() => setSelectedApp(null)} disabled={processing}>
                                    <Text style={{ color: Colors.textMuted, fontWeight: 'bold' }}>ĐÓNG</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}