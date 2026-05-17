import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authApi, endpoints } from '../../configs/Apis';
import styles, { Colors } from './Styles';;
import AsyncStorage from '@react-native-async-storage/async-storage';
export default function EmployerDashboardScreen({ navigation }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Period cho từng section (month, quarter, year)
  const [appPeriod, setAppPeriod] = useState('month');
  const [jobPeriod, setJobPeriod] = useState('month');

  //   LOAD DATA  
  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);

      const token = await AsyncStorage.getItem("token");
      const res = await authApi(token).get(endpoints['employer-statistics']);
      
      setData(res.data);
    } catch (ex) {
      console.error('Load employer dashboard error:', ex.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  //   HELPERS  
  const formatNumber = (value) => {
    if (!value && value !== 0) return '—';
    return value.toLocaleString('vi-VN');
  };

  const buildChartData = (prefix, period) => {
    if (!data) return [];
    const key = `${prefix}_by_${period}`;
    return (data[key] || []).map(item => {
      const raw = item[period];
      let label = '?';
      if (raw) {
        const d = new Date(raw);
        if (period === 'month') label = `T${d.getMonth() + 1}/${String(d.getFullYear()).slice(2)}`;
        else if (period === 'quarter') label = `Q${Math.floor(d.getMonth() / 3) + 1}/${String(d.getFullYear()).slice(2)}`;
        else label = `${d.getFullYear()}`;
      }
      return { ...item, _label: label };
    });
  };

  //   RENDER COMPONENTS  

  const OverviewCard = ({ label, value, color, iconBg, icon }) => (
    <View style={styles.overviewCard}>
      <View style={[styles.overviewIconWrap, { backgroundColor: iconBg }]}>
        <Text style={styles.overviewIcon}>{icon}</Text>
      </View>
      <Text style={[styles.overviewValue, { color }]}>{value}</Text>
      <Text style={styles.overviewLabel}>{label}</Text>
    </View>
  );

  const RatingStars = ({ rating }) => {
    const stars = Math.round(rating);
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
        {[1, 2, 3, 4, 5].map(i => (
          <Text key={i} style={{ fontSize: 14, color: i <= stars ? '#F59F00' : '#DEE2E6' }}>
            ★
          </Text>
        ))}
        <Text style={{ marginLeft: 6, fontSize: 13, fontWeight: '600', color: '#495057' }}>
          {rating > 0 ? rating.toFixed(1) : '0'}
        </Text>
      </View>
    );
  };

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

  const SimpleBarChart = ({ data, valueKey, color }) => {
    if (!data || data.length === 0) return <Text style={styles.emptyText}>Chưa có dữ liệu</Text>;
    const maxVal = Math.max(...data.map(d => d[valueKey] || 0)) || 1;

    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chartScroll}>
        {data.map((item, i) => {
          const val = item[valueKey] || 0;
          const barH = Math.max(4, Math.round(100 * (val / maxVal)));
          return (
            <View key={i} style={styles.barColumn}>
              <Text style={styles.barValueLabel}>{val}</Text>
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

  // MAIN RENDER
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3B5BDB" />
      </View>
    );
  }

  const ov = data?.overview || {};
  const convRate = ov.total_jobs_posted > 0
    ? (ov.total_applications / ov.total_jobs_posted).toFixed(1)
    : '0';

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Thống kê của tôi</Text>
          <Text style={styles.headerSub}>Hoạt động tuyển dụng</Text>
        </View>
        <TouchableOpacity style={styles.refreshIconBtn} onPress={() => fetchData(true)}>
            <Text style={styles.refreshIconText}>↻</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll} // Quan trọng: Đưa padding vào đây
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} />
        }
      >
        {/* Overview Grid */}
        <View style={styles.overviewGrid}>
          <OverviewCard 
            label="Tin đã đăng" 
            value={ov.total_jobs_posted || 0} 
            color={Colors.accent} 
            iconBg="#EFF6FF" 
            icon="📋" 
          />
          <OverviewCard 
            label="Đơn ứng tuyển" 
            value={ov.total_applications || 0} 
            color={Colors.green} 
            iconBg="#F0FDF4" 
            icon="📨" 
          />
        </View>

        {/* Meta Row (Rating & Tỷ lệ) */}
        <View style={styles.metaRow}>
          <View style={styles.metaCard}>
            <Text style={styles.metaCardTitle}>⭐ ĐÁNH GIÁ TB</Text>
            <RatingStars rating={ov.avg_candidate_rating || 0} />
          </View>
          <View style={styles.metaCard}>
            <Text style={styles.metaCardTitle}>📊 ĐƠN / TIN</Text>
            <Text style={[styles.metaBigNum, { color: Colors.purple }]}>{convRate}</Text>
          </View>
        </View>

        {/* Các Section Thống Kê */}
        <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionDot, {backgroundColor: Colors.green}]} />
              <Text style={styles.sectionTitle}>Đơn ứng tuyển nhận được</Text>
            </View>
            <PeriodToggle value={appPeriod} onChange={setAppPeriod} />
            <SimpleBarChart 
                data={buildChartData('applications', appPeriod)} 
                valueKey="total" color={Colors.green} 
            />
        </View>

        <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionDot, {backgroundColor: Colors.accent}]} />
              <Text style={styles.sectionTitle}>Tin tuyển dụng đã đăng</Text>
            </View>
            <PeriodToggle value={jobPeriod} onChange={setJobPeriod} />
            <SimpleBarChart 
                data={buildChartData('jobs', jobPeriod)} 
                valueKey="total" color={Colors.accent} 
            />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}