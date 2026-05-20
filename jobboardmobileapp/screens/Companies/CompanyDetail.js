import { useEffect, useState } from 'react';
import {
    View, Text, Image, ScrollView, TouchableOpacity,
    ActivityIndicator, StyleSheet, Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Apis, { endpoints } from '../../configs/Apis';
import styles from './Styles'
import { Ionicons } from '@expo/vector-icons';

const PRIMARY = '#3B5BDB';
const PAGE_SIZE = 10;

function CompanyDetail({ route, navigation }) {
    const { companyId } = route.params;

    const [company, setCompany]     = useState(null);
    const [jobs, setJobs]           = useState([]);
    const [loading, setLoading]     = useState(true);
    const [jobLoading, setJobLoading] = useState(false);
    const [page, setPage]           = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalJobs, setTotalJobs] = useState(0);

    // ==================== LOAD COMPANY ====================
    const loadCompany = async () => {
        try {
            const res = await Apis.get(`${endpoints['companies']}${companyId}/`);
            setCompany(res.data);
        } catch (ex) {
            console.error('Load company error:', ex.message);
        } finally {
            setLoading(false);
        }
    };

    // ==================== LOAD JOBS ====================
    const loadJobs = async (p = 1) => {
        try {
            setJobLoading(true);
            const res = await Apis.get(
                `${endpoints['jobs']}?company=${companyId}&page=${p}`
            );
            const count = res.data?.count ?? 0;
            setTotalJobs(count);
            setTotalPages(Math.ceil(count / PAGE_SIZE));
            setJobs(res.data?.results ?? []);
            setPage(p);
        } catch (ex) {
            console.error('Load jobs error:', ex.message);
        } finally {
            setJobLoading(false);
        }
    };

    useEffect(() => {
        loadCompany();
        loadJobs(1);
    }, [companyId]);

    // ==================== PAGINATOR ====================
    const Paginator = () => {
        if (totalPages <= 1) return null;

        const getPages = () => {
            let pages = [];
            let start = Math.max(1, page - 2);
            let end   = Math.min(totalPages, page + 2);
            if (start > 1) pages.push(1);
            if (start > 2) pages.push('...');
            for (let i = start; i <= end; i++) pages.push(i);
            if (end < totalPages - 1) pages.push('...');
            if (end < totalPages) pages.push(totalPages);
            return pages;
        };

        return (
            <View style={styles.paginatorContainer}>
                <TouchableOpacity
                    style={[styles.pageBtn, page === 1 && styles.pageBtnDisabled]}
                    onPress={() => loadJobs(page - 1)}
                    disabled={page === 1}
                >
                    <Text style={[styles.pageBtnText, page === 1 && styles.pageBtnTextDisabled]}>‹</Text>
                </TouchableOpacity>

                {getPages().map((p2, i) =>
                    p2 === '...' ? (
                        <Text key={`dot-${i}`} style={styles.pageDots}>...</Text>
                    ) : (
                        <TouchableOpacity
                            key={p2}
                            style={[styles.pageBtn, page === p2 && styles.pageBtnActive]}
                            onPress={() => loadJobs(p2)}
                        >
                            <Text style={[styles.pageBtnText, page === p2 && styles.pageBtnTextActive]}>
                                {p2}
                            </Text>
                        </TouchableOpacity>
                    )
                )}

                <TouchableOpacity
                    style={[styles.pageBtn, page === totalPages && styles.pageBtnDisabled]}
                    onPress={() => loadJobs(page + 1)}
                    disabled={page === totalPages}
                >
                    <Text style={[styles.pageBtnText, page === totalPages && styles.pageBtnTextDisabled]}>›</Text>
                </TouchableOpacity>
            </View>
        );
    };

    // ==================== JOB CARD ====================
    const JobCard = ({ job }) => (
        <TouchableOpacity
            style={[styles.jobCard, job.is_featured && styles.featuredCard]}
            onPress={() => navigation.navigate('JobDetail', { jobId: job.id })}
        >
            {job.is_featured && (
                <View style={styles.featuredBadge}>
                    <Text style={styles.featuredBadgeText}>⭐ Nổi bật</Text>
                </View>
            )}

            <Text style={styles.jobTitle} numberOfLines={2}>{job.title ?? ''}</Text>

            <Text style={styles.jobSalary}>
                {job.salary_min && job.salary_max
                    ? `${(job.salary_min / 1e6).toFixed(0)}–${(job.salary_max / 1e6).toFixed(0)} triệu`
                    : 'Thỏa thuận'}
                {job.location ? `  ·  ${job.location}` : ''}
            </Text>

            <View style={styles.tagRow}>
                <View style={styles.tag}>
                    <Text style={styles.tagText}>
                        {job.job_type === 'FT' ? 'Full-time'
                            : job.job_type === 'PT' ? 'Part-time'
                            : job.job_type === 'RE' ? 'Remote'
                            : 'Freelance'}
                    </Text>
                </View>
                {!!job.category_name && (
                    <View style={styles.tag}>
                        <Text style={styles.tagText}>{job.category_name}</Text>
                    </View>
                )}
                {!!job.deadline && (
                    <View style={styles.tag}>
                        <Text style={styles.tagText}>
                            HSD: {new Date(job.deadline).toLocaleDateString('vi-VN')}
                        </Text>
                    </View>
                )}
            </View>

            {job.skills?.length > 0 && (
                <View style={styles.skillRow}>
                    {job.skills.slice(0, 3).map(s => (
                        <View key={s.id} style={styles.skillTag}>
                            <Text style={styles.skillText}>{s.name}</Text>
                        </View>
                    ))}
                    {job.skills.length > 3 && (
                        <Text style={styles.moreSkills}>+{job.skills.length - 3}</Text>
                    )}
                </View>
            )}
        </TouchableOpacity>
    );

    // ==================== LOADING ====================
    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <ActivityIndicator size="large" color={PRIMARY} style={{ marginTop: 60 }} />
            </SafeAreaView>
        );
    }

    if (!company) {
        return (
            <SafeAreaView style={styles.container}>
                <Text style={styles.emptyText}>Không tìm thấy công ty.</Text>
            </SafeAreaView>
        );
    }

    // ==================== RENDER ====================
    return (
        <SafeAreaView style={styles.container}>
            {/* Header bar */}
            <View style={styles.headerBar}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Text style={styles.backBtnText}>‹</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>Chi tiết công ty</Text>
                <View style={{ width: 36 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Company hero */}
                <View style={styles.hero}>
                    <Image
                        source={{ uri: company.logo_url || 'https://via.placeholder.com/100' }}
                        style={styles.heroLogo}
                    />
                    <Text style={styles.heroName}>{company.name}</Text>

                    {!!company.address && (
                        <View style={styles.heroMeta}>
                            <Text style={styles.heroMetaText}>
                                <Ionicons name="location" size={14} color="#6B7280" style={{ marginRight: 8 }}/>
                                {company.address}
                            </Text>
                        </View>
                    )}

                    {!!company.website && (
                        <TouchableOpacity onPress={() => Linking.openURL(company.website)}>
                            <Text style={styles.websiteLink}>🌐 {company.website}</Text>
                        </TouchableOpacity>
                    )}

                    <View style={styles.jobCountBadge}>
                        <Text style={styles.jobCountText}>{totalJobs} việc làm đang tuyển</Text>
                    </View>
                </View>

                {/* Description */}
                {!!company.description && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Giới thiệu công ty</Text>
                        <Text style={styles.descText}>{company.description}</Text>
                    </View>
                )}

                {/* Jobs */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Việc làm đang tuyển</Text>
                        {totalJobs > 0 && (
                            <Text style={styles.totalCount}>{totalJobs} việc</Text>
                        )}
                    </View>

                    {jobLoading ? (
                        <ActivityIndicator size="large" color={PRIMARY} style={{ marginTop: 24 }} />
                    ) : jobs.length === 0 ? (
                        <Text style={styles.emptyText}>Công ty chưa có việc làm nào.</Text>
                    ) : (
                        jobs.map(job => <JobCard key={job.id.toString()} job={job} />)
                    )}

                    {!jobLoading && <Paginator />}
                </View>

                <View style={{ height: 24 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

export default CompanyDetail;