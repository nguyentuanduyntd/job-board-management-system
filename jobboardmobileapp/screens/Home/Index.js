import { useEffect, useState } from 'react';
import {
    View, Text, FlatList, TextInput,
    TouchableOpacity, Image, ScrollView,
    ActivityIndicator, Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Apis, { endpoints } from '../../configs/Apis';
import styles from './Styles';
import { Ionicons } from '@expo/vector-icons';
const PAGE_SIZE = 10;

// Thêm lựa chọn Đề xuất (-featured_score) lên làm mặc định
const SORT_OPTIONS = [
    { label: 'Đề xuất', value: '-featured_score' },
    { label: 'Mới nhất', value: '-created_date' },
    { label: 'Cũ nhất', value: 'created_date' },
    { label: 'Lương cao → thấp', value: '-salary_max' },
    { label: 'Lương thấp → cao', value: 'salary_min' },
];

export default function HomeScreen({ navigation }) {
    const [jobs, setJobs] = useState([]);
    const [categories, setCategories] = useState([]);
    const [featuredCompanies, setFeaturedCompanies] = useState([]);
    const [keyword, setKeyword] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [sortBy, setSortBy] = useState(SORT_OPTIONS[0]); // Mặc định là "-featured_score"
    const [showSortModal, setShowSortModal] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalJobs, setTotalJobs] = useState(0);

    // ==================== LOAD JOBS ====================
    const loadJobs = async () => {
        try {
            setLoading(true);
            let url = `${endpoints['jobs']}?page=${page}&ordering=${sortBy.value}`;
            if (keyword) url += `&search=${keyword}`;
            if (selectedCategory) url += `&category=${selectedCategory}`;

            const res = await Apis.get(url);
            const count = res.data?.count ?? 0;
            setTotalJobs(count);
            setTotalPages(Math.ceil(count / PAGE_SIZE));
            setJobs(page === 1 ? res.data.results : prev => [...prev, ...res.data.results]);
        } catch (ex) {
            console.error('Load jobs error:', ex.message);
            if (page === 1) setJobs([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => { if (page > 0) loadJobs(); }, 500);
        return () => clearTimeout(timer);
    }, [keyword, selectedCategory, sortBy, page]);

    useEffect(() => { setPage(1); }, [keyword, selectedCategory, sortBy]);

    // ==================== LOAD CATEGORIES ====================
    const loadCategories = async () => {
        try {
            const res = await Apis.get(endpoints['categories']);
            setCategories(Array.isArray(res.data) ? res.data : res.data?.results ?? []);
        } catch (ex) {
            console.error('Load categories error:', ex.message);
        }
    };

    // ==================== LOAD COMPANIES ====================
    const loadFeaturedCompanies = async () => {
        try {
            const res = await Apis.get(endpoints['companies']);
            const data = Array.isArray(res.data) ? res.data : res.data?.results ?? [];
            const companies = data.slice(0, 6);
            setFeaturedCompanies(companies.map(c => ({ ...c, job_count: null })));

            const withCounts = await Promise.all(
                companies.map(async (company) => {
                    try {
                        const jobRes = await Apis.get(`${endpoints['jobs']}?company=${company.id}&page_size=1`);
                        return { ...company, job_count: jobRes.data?.count ?? 0 };
                    } catch {
                        return { ...company, job_count: 0 };
                    }
                })
            );
            setFeaturedCompanies(withCounts);
        } catch (ex) {
            console.error('Load companies error:', ex.message);
        }
    };

    useEffect(() => {
        loadCategories();
        loadFeaturedCompanies();
    }, []);

    // ==================== PAGINATOR ====================
    const handlePageChange = (newPage) => {
        if (newPage < 1 || newPage > totalPages) return;
        setPage(newPage);
    };

    const Paginator = () => {
        if (totalPages <= 1) return null;
        const getPageNumbers = () => {
            const pages = [];
            const start = Math.max(1, page - 2);
            const end = Math.min(totalPages, page + 2);
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
                    onPress={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                >
                    <Text style={[styles.pageBtnText, page === 1 && styles.pageBtnTextDisabled]}>‹</Text>
                </TouchableOpacity>

                {getPageNumbers().map((p, index) =>
                    p === '...' ? (
                        <Text key={`dot-${index}`} style={styles.pageDots}>...</Text>
                    ) : (
                        <TouchableOpacity
                            key={p}
                            style={[styles.pageBtn, page === p && styles.pageBtnActive]}
                            onPress={() => handlePageChange(p)}
                        >
                            <Text style={[styles.pageBtnText, page === p && styles.pageBtnTextActive]}>{p}</Text>
                        </TouchableOpacity>
                    )
                )}

                <TouchableOpacity
                    style={[styles.pageBtn, page === totalPages && styles.pageBtnDisabled]}
                    onPress={() => handlePageChange(page + 1)}
                    disabled={page === totalPages}
                >
                    <Text style={[styles.pageBtnText, page === totalPages && styles.pageBtnTextDisabled]}>›</Text>
                </TouchableOpacity>
            </View>
        );
    };

    // ==================== JOB CARD ====================
    const JobCard = ({ job }) => {
        const isFeatured = Boolean(job.is_featured);

        return (
            <TouchableOpacity
                style={[styles.card, isFeatured ? styles.cardFeatured : {}]}
                onPress={() => navigation.navigate('JobDetail', { jobId: job.id })}
            >
                {/* Dải băng Nổi Bật */}
                {isFeatured && (
                    <View style={styles.featuredRibbon}>   
                        <Text style={styles.featuredRibbonText}>
                            <Ionicons name="flame" size={10} color="#fff" /> NỔI BẬT
                        </Text>
                    </View>
                )}

                <View style={styles.cardHeader}>
                    <Image source={{ uri: job.company_logo }} style={styles.logo} />
                    <View style={styles.cardInfo}>
                        <Text style={styles.jobTitle} numberOfLines={2}>{job.title ?? ''}</Text>
                        <Text style={styles.companyName} numberOfLines={1}>{job.company_name ?? ''}</Text>
                        <Text style={styles.salary}>
                            {job.salary_min && job.salary_max
                                ? `${(job.salary_min / 1e6).toFixed(0)}–${(job.salary_max / 1e6).toFixed(0)} triệu`
                                : 'Thỏa thuận'}
                            {job.location ? ` | ${job.location}` : ''}
                        </Text>
                    </View>
                </View>

                <View style={styles.cardFooter}>
                    <View style={styles.tag}>
                        <Text style={styles.tagText}>
                            {job.job_type === 'FT' ? 'Full-time'
                                : job.job_type === 'PT' ? 'Part-time'
                                : job.job_type === 'RE' ? 'Remote'
                                : 'Freelance'}
                        </Text>
                    </View>
                    {!!job.category_name && (
                        <View style={[styles.tag, { marginLeft: 8 }]}>
                            <Text style={styles.tagText}>{job.category_name}</Text>
                        </View>
                    )}
                    {!!job.deadline && (
                        <View style={[styles.tag, { marginLeft: 8 }]}>
                            <Text style={styles.tagText}>
                                HSD: {new Date(job.deadline).toLocaleDateString('vi-VN')}
                            </Text>
                        </View>
                    )}
                </View>

                {job.skills?.length > 0 && (
                    <View style={styles.skillRow}>
                        {job.skills.slice(0, 3).map(skill => (
                            <View key={skill.id} style={styles.skillTag}>
                                <Text style={styles.skillText}>{skill.name ?? ''}</Text>
                            </View>
                        ))}
                        {job.skills.length > 3 && (
                            <Text style={styles.moreSkills}>+{job.skills.length - 3}</Text>
                        )}
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    // ==================== COMPANY CARD ====================
    const FeaturedCompanyCard = ({ company }) => (
        <TouchableOpacity
            style={styles.companyCard}
            onPress={() => navigation.navigate('CompanyDetail', { companyId: company.id })}
        >
            <Image
                source={{ uri: company.logo_url || 'https://via.placeholder.com/80' }}
                style={styles.companyLogo}
            />
            <Text style={styles.companyCardName} numberOfLines={2}>{company.name ?? ''}</Text>
            <Text style={styles.companyJobCount}>
                {company.job_count === null ? '...' : `${company.job_count} việc làm`}
            </Text>
        </TouchableOpacity>
    );

    // ==================== SORT MODAL ====================
    const SortModal = () => (
        <Modal transparent visible={showSortModal} animationType="fade" onRequestClose={() => setShowSortModal(false)}>
            <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowSortModal(false)}>
                <View style={styles.modalBox}>
                    <Text style={styles.modalTitle}>Sắp xếp theo</Text>
                    {SORT_OPTIONS.map(opt => (
                        <TouchableOpacity
                            key={opt.value}
                            style={[styles.modalOption, sortBy.value === opt.value && styles.modalOptionActive]}
                            onPress={() => { setSortBy(opt); setShowSortModal(false); }}
                        >
                            <Text style={[styles.modalOptionText, sortBy.value === opt.value && styles.modalOptionTextActive]}>
                                {opt.label}
                            </Text>
                            {sortBy.value === opt.value && <Text style={styles.modalCheck}>✓</Text>}
                        </TouchableOpacity>
                    ))}
                </View>
            </TouchableOpacity>
        </Modal>
    );

    // ==================== RENDER ====================
    return (
        <SafeAreaView style={styles.container}>
            {/* Header: Search + Sort */}
            <View style={styles.searchContainer}>
                <View style={styles.searchRow}>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Tìm việc làm..."
                        value={keyword}
                        onChangeText={setKeyword}
                        returnKeyType="search"
                    />
                    <TouchableOpacity style={styles.sortBtn} onPress={() => setShowSortModal(true)}>
                        <Text style={styles.sortBtnIcon}>⇅</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <SortModal />

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Categories */}
                {categories.length > 0 && (
                    <>
                        <Text style={[styles.sectionTitle, { marginTop: 12 }]}>Ngành nghề</Text>
                        <FlatList
                            horizontal
                            data={categories}
                            keyExtractor={item => item.id.toString()}
                            showsHorizontalScrollIndicator={false}
                            style={styles.categoryList}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[styles.categoryItem, selectedCategory === item.id && styles.categoryItemActive]}
                                    onPress={() => setSelectedCategory(selectedCategory === item.id ? null : item.id)}
                                >
                                    <Text style={[styles.categoryText, selectedCategory === item.id && styles.categoryTextActive]}>
                                        {item.name}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        />
                    </>
                )}

                {/* Job list header */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Việc làm nổi bật</Text>
                    <View style={styles.jobHeaderRight}>
                        {totalJobs > 0 && <Text style={styles.totalCount}>{totalJobs} việc làm</Text>}
                        <TouchableOpacity style={styles.sortChip} onPress={() => setShowSortModal(true)}>
                            <Text style={styles.sortChipText}>{sortBy.label} ▾</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Jobs */}
                {loading ? (
                    <ActivityIndicator size="large" color="#3B5BDB" style={{ marginTop: 40 }} />
                ) : jobs.length === 0 ? (
                    <Text style={styles.emptyText}>Không tìm thấy việc làm nào</Text>
                ) : (
                    jobs.map(job => <JobCard key={job.id.toString()} job={job} />)
                )}

                {!loading && <Paginator />}

                {/* Featured Companies */}
                {featuredCompanies.length > 0 && (
                    <>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Nhà tuyển dụng tiêu biểu</Text>
                            <TouchableOpacity onPress={() => navigation.navigate('CompaniesList')}>
                                <Text style={styles.seeAll}>Xem tất cả ›</Text>
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            horizontal
                            data={featuredCompanies}
                            keyExtractor={item => item.id.toString()}
                            showsHorizontalScrollIndicator={false}
                            style={styles.categoryList}
                            renderItem={({ item }) => <FeaturedCompanyCard company={item} />}
                        />
                    </>
                )}

                <View style={{ height: 20 }} />
            </ScrollView>
        </SafeAreaView>
    );
}