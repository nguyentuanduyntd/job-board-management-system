import React, { useState, useCallback } from 'react';
import {View, Text, FlatList, TouchableOpacity, Modal, TextInput,Alert, ActivityIndicator, RefreshControl, ScrollView, Platform,Linking, Switch
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { authApi, endpoints } from '../../configs/Apis';
import { Ionicons } from '@expo/vector-icons';
import S, { Colors } from './Styles';
import usePagination from '../../hooks/usePagination'; 
import Paginator from '../../components/Paginator';

const fmtDt = (iso) => {
    if (!iso) return 'Chưa lên lịch';
    return new Date(iso).toLocaleString('vi-VN', {
        hour: '2-digit', minute: '2-digit',
        day: '2-digit', month: '2-digit', year: 'numeric'
    });
};

const EMPTY_FORM = {
    interview_location: '',
    interview_map_url:  '',
    interview_note:     '',
};

export default function InterviewManagement({ navigation }) {
    const {
        data: applications,
        loading,
        refreshing,
        page,
        totalPages,
        load: loadPaginationData,
        refresh: refreshPagination
    } = usePagination(`${endpoints['applications']}accepted/`, 10);

    const [selectedApp, setSelectedApp]     = useState(null);
    const [form, setForm]                   = useState(EMPTY_FORM);
    const [interviewDate, setInterviewDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [saving, setSaving]               = useState(false);
    const [sendEmail, setSendEmail]         = useState(true);

    useFocusEffect(
        useCallback(() => {
            loadPaginationData(1);
        }, [loadPaginationData])
    );

    const openModal = (app) => {
        setSelectedApp(app);
        setForm({
            interview_location: app.interview_location ?? '',
            interview_map_url:  app.interview_map_url  ?? '',
            interview_note:     app.interview_note     ?? '',
        });
        setInterviewDate(
            app.interview_at ? new Date(app.interview_at) : new Date()
        );
        setSendEmail(true);
    };

    const closeModal = () => {
        setSelectedApp(null);
        setForm(EMPTY_FORM);
    };

    const onDateChange = (_, date) => {
        setShowDatePicker(false);
        if (!date) return;
        const merged = new Date(interviewDate);
        merged.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
        setInterviewDate(merged);
        if (Platform.OS === 'ios') setShowTimePicker(true);
    };

    const onTimeChange = (_, time) => {
        setShowTimePicker(false);
        if (!time) return;
        const merged = new Date(interviewDate);
        merged.setHours(time.getHours(), time.getMinutes(), 0, 0);
        setInterviewDate(merged);
    };

    const handleSave = async () => {
        if (!form.interview_location.trim()) {
            Alert.alert('Thiếu thông tin', 'Vui lòng nhập địa điểm phỏng vấn.');
            return;
        }
        if (interviewDate <= new Date()) {
            Alert.alert('Thời gian không hợp lệ', 'Vui lòng chọn thời gian trong tương lai.');
            return;
        }

        setSaving(true);
        try {
            const token = await AsyncStorage.getItem('token');
            await authApi(token).patch(
                endpoints['application-schedule-interview'](selectedApp.id),
                {
                    interview_location: form.interview_location.trim(),
                    interview_at:       interviewDate.toISOString(),
                    interview_note:     form.interview_note.trim() || null,
                    interview_map_url:  form.interview_map_url.trim() || null,
                }
            );

            Alert.alert(
                'Đã lưu lịch',
                sendEmail
                    ? 'Lịch phỏng vấn đã được lưu và email đang được gửi đến ứng viên.'
                    : 'Lịch phỏng vấn đã được lưu.',
            );
            closeModal();
            loadPaginationData(page);
        } catch (err) {
            const msg = err.response?.data?.error
                ?? Object.values(err.response?.data ?? {}).flat().join('\n')
                ?? 'Không thể lưu lịch.';
            Alert.alert('Lỗi', msg);
        } finally {
            setSaving(false);
        }
    };

    const renderCard = ({ item }) => {
        const hasSchedule = !!item.interview_at;
        const candidateName = item.candidate?.username 
            || item.candidate_username 
            || item.candidate_name 
            || item.candidate?.first_name 
            || 'Ứng viên';
        return (
            <TouchableOpacity
                style={cardStyle(hasSchedule)}
                onPress={() => openModal(item)}
                activeOpacity={0.85}
            >
                <View style={S.interview.cardBadgeRow}>
                    <View style={[S.interview.badge, hasSchedule ? S.interview.badgeScheduled : S.interview.badgePending]}>
                        <Ionicons
                            name={hasSchedule ? 'calendar' : 'calendar-outline'}
                            size={12} color="#fff" style={S.interview.badgeIcon}
                        />
                        <Text style={S.interview.badgeText}>
                            {hasSchedule ? 'Đã lên lịch' : 'Chưa lên lịch'}
                        </Text>
                    </View>
                    {item.interview_notified && (
                        <View style={S.interview.badgeNotified}>
                            <Ionicons name="mail" size={12} color="#16A34A" style={S.interview.badgeIcon} />
                            <Text style={S.interview.badgeNotifiedText}>Email đã gửi</Text>
                        </View>
                    )}
                </View>

                <Text style={S.interview.cardName}>{candidateName}</Text>
                
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                    <Ionicons name="briefcase-outline" size={16} color="#4B5563" style={{ marginRight: 8 }} />
                    <Text style={S.interview.cardJob}>{item.job?.title || item.job_title}</Text>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                    <Ionicons name="business-outline" size={16} color="#4B5563" style={{ marginRight: 8 }} />
                    <Text style={S.interview.cardCompany}>{item.company_name || 'Công ty hệ thống'}</Text>
                </View>

                {hasSchedule ? (
                    <View style={S.interview.scheduleBox}>
                        <View style={S.interview.scheduleRow}>
                            <Ionicons name="time" size={14} color="#2563EB" />
                            <Text style={S.interview.scheduleTime}>{fmtDt(item.interview_at)}</Text>
                        </View>
                        <View style={S.interview.scheduleRow}>
                            <Ionicons name="location" size={14} color="#2563EB" />
                            <Text style={S.interview.scheduleLoc} numberOfLines={2}>
                                {item.interview_location}
                            </Text>
                        </View>
                        {!!item.interview_map_url && (
                            <TouchableOpacity
                                style={S.interview.mapBtn}
                                onPress={() => Linking.openURL(item.interview_map_url)}
                            >
                                <Ionicons name="map" size={13} color="#2563EB" />
                                <Text style={S.interview.mapBtnText}>Xem bản đồ</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                ) : (
                    <View style={S.interview.noScheduleHint}>
                        <Ionicons name="add-circle-outline" size={14} color="#9CA3AF" />
                        <Text style={S.interview.noScheduleText}>Nhấn để lên lịch phỏng vấn</Text>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={S.root}>
            <View style={S.interview.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={S.interview.backBtn}>
                    <Ionicons name="arrow-back" size={22} color="#fff" />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={S.interview.headerTitle}>Lịch phỏng vấn</Text>
                    <Text style={S.interview.headerSub}>Ứng viên đã được chấp nhận</Text>
                </View>
                <View style={S.interview.countBubble}>
                    <Text style={S.interview.countText}>{applications.length}</Text>
                </View>
            </View>

            {loading && applications.length === 0 ? (
                <View style={S.centered}>
                    <ActivityIndicator size="large" color={Colors.accent} />
                </View>
            ) : (
                <FlatList
                    data={applications}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 20 }}
                    refreshControl={
                        <RefreshControl 
                            refreshing={refreshing} 
                            onRefresh={refreshPagination} 
                            tintColor={Colors.accent} 
                        />
                    }
                    renderItem={renderCard}
                    ListEmptyComponent={
                        <View style={S.interview.emptyWrap}>
                            <Ionicons name="calendar" size={52} color={Colors.accentLight} />
                            <Text style={S.interview.emptyTitle}>Chưa có ứng viên được chấp nhận</Text>
                            <Text style={S.interview.emptyDesc}>Duyệt đơn ứng tuyển trước để lên lịch phỏng vấn.</Text>
                        </View>
                    }
                    ListFooterComponent={
                        <Paginator 
                            page={page} 
                            totalPages={totalPages} 
                            onGoTo={loadPaginationData} 
                        />
                    }
                />
            )}

            <Modal visible={!!selectedApp} transparent animationType="slide" onRequestClose={closeModal}>
                <View style={S.interview.modalOverlay}>
                    <View style={S.interview.modalSheet}>
                        <View style={S.interview.handleBar} />
                        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                            <Text style={S.interview.modalTitle}>Lên lịch phỏng vấn</Text>

                            {selectedApp && (
                                <View style={S.interview.summaryBox}>
                                    <Text style={S.interview.summaryName}>
                                        {selectedApp.candidate?.username 
                                            || selectedApp.candidate_username 
                                            || selectedApp.candidate_name 
                                            || 'Ứng viên'}
                                    </Text>
                                    <Text style={S.interview.summaryJob}>
                                        {selectedApp.job?.title || selectedApp.job_title}
                                    </Text>
                                </View>
                            )}

                            <Text style={S.interview.fieldLabel}>
                                Ngày & giờ phỏng vấn <Text style={S.interview.required}>*</Text>
                            </Text>
                            <View style={S.interview.dtRow}>
                                <TouchableOpacity style={S.interview.dtBtn} onPress={() => setShowDatePicker(true)}>
                                    <Ionicons name="calendar" size={16} color={Colors.accent} />
                                    <Text style={S.interview.dtBtnText}>{interviewDate.toLocaleDateString('vi-VN')}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={S.interview.dtBtn} onPress={() => setShowTimePicker(true)}>
                                    <Ionicons name="time" size={16} color={Colors.accent} />
                                    <Text style={S.interview.dtBtnText}>
                                        {interviewDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {showDatePicker && (
                                <DateTimePicker
                                    value={interviewDate}
                                    mode="date"
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    minimumDate={new Date()}
                                    onChange={onDateChange}
                                    locale="vi"
                                />
                            )}
                            {showTimePicker && (
                                <DateTimePicker
                                    value={interviewDate}
                                    mode="time"
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    onChange={onTimeChange}
                                    locale="vi"
                                />
                            )}

                            <Text style={S.interview.fieldLabel}>Địa điểm <Text style={S.interview.required}>*</Text></Text>
                            <TextInput
                                style={S.interview.fieldInput}
                                placeholder="VD: Tầng 5, 123 Nguyễn Huệ, Q.1, TP.HCM"
                                value={form.interview_location}
                                onChangeText={v => setForm(p => ({ ...p, interview_location: v }))}
                            />

                            <Text style={S.interview.fieldLabel}>Link Google Maps (tuỳ chọn)</Text>
                            <TextInput
                                style={S.interview.fieldInput}
                                placeholder="http://maps.google.com/..."
                                value={form.interview_map_url}
                                onChangeText={v => setForm(p => ({ ...p, interview_map_url: v }))}
                                autoCapitalize="none"
                                keyboardType="url"
                            />

                            <Text style={S.interview.fieldLabel}>Ghi chú (tuỳ chọn)</Text>
                            <TextInput
                                style={[S.interview.fieldInput, S.interview.fieldInputMulti]}
                                placeholder="Mang theo CCCD, hồ sơ in..."
                                value={form.interview_note}
                                onChangeText={v => setForm(p => ({ ...p, interview_note: v }))}
                                multiline
                            />

                            <View style={S.interview.toggleRow}>
                                <View style={{ flex: 1 }}>
                                    <Text style={S.interview.toggleLabel}>Gửi email thông báo cho ứng viên</Text>
                                    <Text style={S.interview.toggleSub}>Celery sẽ xử lý gửi qua Gmail</Text>
                                </View>
                                <Switch
                                    value={sendEmail}
                                    onValueChange={setSendEmail}
                                    trackColor={{ false: '#D1D5DB', true: '#BFDBFE' }}
                                    thumbColor={sendEmail ? Colors.accent : '#9CA3AF'}
                                />
                            </View>

                            <View style={S.interview.modalActions}>
                                <TouchableOpacity style={S.interview.cancelBtn} onPress={closeModal} disabled={saving}>
                                    <Text style={S.interview.cancelBtnText}>Huỷ</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[S.interview.saveBtn, saving && S.interview.saveBtnDisabled]}
                                    onPress={handleSave}
                                    disabled={saving}
                                >
                                    {saving ? <ActivityIndicator color="#fff" size="small" /> : (
                                        <>
                                            <Ionicons name="checkmark" size={18} color="#fff" />
                                            <Text style={S.interview.saveBtnText}>Lưu lịch</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>
                            <View style={S.interview.spacing} />
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const cardStyle = (hasSchedule) => ({
    backgroundColor: hasSchedule ? '#F0FDF4' : '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: hasSchedule ? '#22C55E' : Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
});