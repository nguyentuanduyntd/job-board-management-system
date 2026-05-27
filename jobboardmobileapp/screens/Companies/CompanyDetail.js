import { useEffect, useState } from 'react';
import {
    View, Text, Image, TouchableOpacity,
    ActivityIndicator, ScrollView, Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Apis, { endpoints } from '../../configs/Apis';
import styles from './Styles';
import { Ionicons } from '@expo/vector-icons';

const PRIMARY = '#3B5BDB';

function CompanyDetail({ route, navigation }) {
    const { companyId } = route.params;

    const [company, setCompany] = useState(null);
    const [jobs, setJobs]       = useState([]);
    const [loading, setLoading] = useState(true);
    const [jobLoading, setJobLoading] = useState(false);
    const [totalJobs, setTotalJobs]   = useState(0);

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

    const loadJobs = async () => {
        try {
            setJobLoading(true);
            const res = await Apis.get(
                `${endpoints['jobs']}?company=${companyId}&page_size=100`
            );
            const data = res.data?.results ?? (Array.isArray(res.data) ? res.data : []);
            const count = res.data?.count ?? data.length;
            setJobs(data);
            setTotalJobs(count);
        } catch (ex) {
            console.error('Load jobs error:', ex.message);
        } finally {
            setJobLoading(false);
        }
    };

    useEffect(() => {
        loadCompany();
        loadJobs();
    }, [companyId]);

    const JobCard = ({ job }) => (
        <TouchableOpacity
            style={[styles.jobCard, job.is_featured && styles.featuredCard]}
            onPress={() => navigation.navigate('JobDetail', { jobId: job.id })}
        >
            {job.is_featured && (
                <View style={styles.featuredBadge}>
                    <Text style={styles.featuredBadgeText}>Nổi bật</Text>
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

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.headerBar}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Text style={styles.backBtnText}>‹</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>Chi tiết công ty</Text>
                <View style={{ width: 36 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.hero}>
                    <Image
                        source={{ uri: company.logo_url || 'https://via.placeholder.com/100' }}
                        style={styles.heroLogo}
                    />
                    <Text style={styles.heroName}>{company.name}</Text>

                    {!!company.address && (
                        <View style={styles.heroMeta}>
                            <Ionicons name="location" size={14} color="#6B7280" />
                            <Text style={[styles.heroMetaText, { marginLeft: 4 }]}>
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

                {!!company.description && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Giới thiệu công ty</Text>
                        <Text style={styles.descText}>{company.description}</Text>
                    </View>
                )}

                <View style={[styles.sectionHeader, { marginHorizontal: 16, marginTop: 16, marginBottom: 8 }]}>
                    <Text style={styles.sectionTitle}>Việc làm đang tuyển</Text>
                    {totalJobs > 0 && (
                        <Text style={styles.totalCount}>{totalJobs} việc</Text>
                    )}
                </View>

                {jobLoading ? (
                    <ActivityIndicator size="large" color={PRIMARY} style={{ paddingVertical: 20 }} />
                ) : jobs.length === 0 ? (
                    <Text style={[styles.emptyText, { marginBottom: 30 }]}>
                        Công ty chưa có việc làm nào.
                    </Text>
                ) : (
                    <View style={{ paddingHorizontal: 16, paddingBottom: 30 }}>
                        {jobs.map(job => (
                            <JobCard key={job.id.toString()} job={job} />
                        ))}
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

export default CompanyDetail;