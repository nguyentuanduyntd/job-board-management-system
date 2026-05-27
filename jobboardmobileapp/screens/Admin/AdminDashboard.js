import React, { useState, useEffect, useCallback } from 'react';
import {View,Text,ScrollView,TouchableOpacity,ActivityIndicator,RefreshControl,StatusBar,} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authApi, endpoints } from '../../configs/Apis';
import AsyncStorage from "@react-native-async-storage/async-storage";
import styles, {Colors} from './Styles';
import { Ionicons } from '@expo/vector-icons';

export default function AdminDashboardScreen({ navigation }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [revPeriod, setRevPeriod] = useState('month');
  const [candidatePeriod, setCandidatePeriod] = useState('month');
  const [employerPeriod, setEmployerPeriod] = useState('month');

  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);
      
      const token = await AsyncStorage.getItem("token");
      const res = await authApi(token).get(endpoints['admin-statistics']);
      setData(res.data);
    } catch (ex) {
      console.error('Load admin dashboard error:', ex.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatCurrency = (value) => {
    if (!value && value !== 0) return '—';
    if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
    return value.toLocaleString('vi-VN');
  };

  const buildChartData = (prefix, period) => {
    if (!data) return [];
    const key = `${prefix}_by_${period}`;
    return (data[key] || []).map(item => {
      const raw = item[period];
      let _label = '?';
      if (raw) {
        const d = new Date(raw);
        if (period === 'month') _label = `T${d.getMonth() + 1}/${String(d.getFullYear()).slice(2)}`;
        else if (period === 'quarter') _label = `Q${Math.floor(d.getMonth() / 3) + 1}/${String(d.getFullYear()).slice(2)}`;
        else _label = `${d.getFullYear()}`;
      }
      return { ...item, _label };
    });
  };

  const OverviewCard = ({ label, value, color, iconBg, icon }) => (
    <View style={styles.overviewCard}>
      <View style={[styles.overviewIconWrap, { backgroundColor: iconBg }]}>
        <Text style={styles.overviewIcon}>{icon}</Text>
      </View>
      <Text style={[styles.overviewValue, { color }]}>{value}</Text>
      <Text style={styles.overviewLabel}>{label}</Text>
    </View>
  );

  const PeriodToggle = ({ value, onChange }) => (
    <View style={styles.periodRow}>
      {['month', 'quarter', 'year'].map(p => (
        <TouchableOpacity
          key={p}
          style={[styles.periodBtn, value === p && styles.periodBtnActive]}
          onPress={() => onChange(p)}
        >
          <Text style={[styles.periodBtnText, value === p && styles.periodBtnTextActive]}>
            {p === 'month' ? 'Tháng' : p === 'quarter' ? 'Quý' : 'Năm'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const SimpleBarChart = ({ data, valueKey, color, unit }) => {
    if (!data || data.length === 0) return <Text style={styles.emptyText}>Chưa có dữ liệu</Text>;
    const maxVal = Math.max(...data.map(d => d[valueKey] || 0)) || 1;

    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {data.map((item, i) => {
          const val = item[valueKey] || 0;
          const barH = Math.max(4, Math.round(100 * (val / maxVal)));
          return (
            <View key={i} style={styles.barColumn}>
              <Text style={styles.barValueLabel}>{unit === 'currency' ? formatCurrency(val) : val}</Text>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { height: barH, backgroundColor: color }]} />
              </View>
              <Text style={styles.barXLabel} numberOfLines={1}>{item._label}</Text>
            </View>
          );
        })}
      </ScrollView>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3B5BDB" />
      </View>
    );
  }

  const ov = data?.overview || {};

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Hệ thống</Text>
          <Text style={styles.headerSub}>Tổng quan toàn sàn</Text>
        </View>
        <TouchableOpacity style={styles.refreshIconBtn} onPress={() => fetchData(true)}>
            <Text style={styles.refreshIconText}>↻</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} />
        }
      >
        <View style={styles.overviewGrid}>
          <OverviewCard label="Việc làm" value={ov.total_jobs || 0} color="#3B5BDB" iconBg="#EFF6FF" icon={<Ionicons name="briefcase" size={20} color="#3B5BDB" />} />
          <OverviewCard label="Ứng viên" value={ov.total_candidates || 0} color="#2F9E44" iconBg="#F0FDF4" icon={<Ionicons name="people" size={20} color="#2F9E44" />} />
          <OverviewCard label="Công ty" value={ov.total_employers || 0} color="#F59F00" iconBg="#FFFBEB" icon={<Ionicons name="business" size={20} color="#F59F00" />} />
          <OverviewCard label="Doanh thu" value={formatCurrency(ov.total_revenue || 0)} color="#7C3AED" iconBg="#F5F3FF" icon={<Ionicons name="cash" size={20} color="#7C3AED" />} />
        </View>

        <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <View style={[styles.sectionDot, {backgroundColor: '#7C3AED'}]} />
                <Text style={styles.sectionTitle}>Doanh thu hệ thống</Text>
            </View>
            <PeriodToggle value={revPeriod} onChange={setRevPeriod} />
            <SimpleBarChart 
                data={buildChartData('revenue', revPeriod)} 
                valueKey="revenue" color="#7C3AED" unit="currency" 
            />
        </View>

        <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <View style={[styles.sectionDot, {backgroundColor: '#2F9E44'}]} />
                <Text style={styles.sectionTitle}>Tăng trưởng Ứng viên</Text>
            </View>
            <PeriodToggle value={candidatePeriod} onChange={setCandidatePeriod} />
            <SimpleBarChart 
                data={buildChartData('new_candidates', candidatePeriod)} 
                valueKey="total" color="#2F9E44" 
            />
        </View>

        <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <View style={[styles.sectionDot, {backgroundColor: '#F59F00'}]} />
                <Text style={styles.sectionTitle}>Nhà tuyển dụng mới</Text>
            </View>
            <PeriodToggle value={employerPeriod} onChange={setEmployerPeriod} />
            <SimpleBarChart 
                data={buildChartData('new_employers', employerPeriod)} 
                valueKey="total" color="#F59F00" 
            />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}