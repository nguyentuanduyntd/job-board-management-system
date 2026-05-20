import { useEffect, useState, useCallback } from 'react';
import {
    View, Text, FlatList, TextInput,
    TouchableOpacity, Image, ScrollView,
    ActivityIndicator, Modal, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Apis, { authApi, endpoints } from '../../configs/Apis';
import { useMyUser } from '../../configs/Contexts';
import styles from './Styles';
import { Ionicons } from '@expo/vector-icons';

const PAGE_SIZE = 10;

const SORT_OPTIONS = [
    { label: 'Đề xuất', value: '-featured_score' },
    { label: 'Mới nhất', value: '-created_date' },
    { label: 'Cũ nhất', value: 'created_date' },
    { label: 'Lương cao → thấp', value: '-salary_max' },
    { label: 'Lương thấp → cao', value: 'salary_min' },
];

export default function HomeScreen({ navigation }) {
    const user = useMyUser(); // Lấy thông tin người dùng hiện tại

    const [jobs, setJobs] = useState([]);
    const [categories, setCategories] = useState([]);
    const [featuredCompanies, setFeaturedCompanies] = useState([]);
    const [keyword, setKeyword] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [sortBy, setSortBy] = useState(SORT_OPTIONS[0]);
    const [showSortModal, setShowSortModal] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalJobs, setTotalJobs] = useState(0);

    // STATE PHỤC VỤ CHỨC NĂNG SO SÁNH (JOB COMPARISON)
    const [compareJobs, setCompareJobs] = useState([]); // Chứa danh sách các Job đang chọn so sánh
    const [showCompareModal, setShowCompareModal] = useState(false);

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

    // ==================== LOAD CATEGORIES & COMPANIES ====================
    const loadCategories = async () => {
        try {
            const res = await Apis.get(endpoints['categories']);
            setCategories(Array.isArray(res.data) ? res.data : res.data?.results ?? []);
        } catch (ex) {
            console.error('Load categories error:', ex.message);
        }
    };

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

    // ==================== LOGIC XỬ LÝ SO SÁNH ====================
    const toggleCompareJob = (job) => {
        if (!user || user.role !== 'candidate') {
            Alert.alert("Thông báo", "Vui lòng đăng nhập tài khoản Ứng viên để sử dụng chức năng so sánh!");
            return;
        }

        const isExist = compareJobs.some(j => j.id === job.id);
        if (isExist) {
            setCompareJobs(prev => prev.filter(j => j.id !== job.id));
            return;
        }

        if (compareJobs.length >= 5) {
            Alert.alert("Thông báo", "Bạn chỉ được phép chọn so sánh tối đa 5 công việc cùng lúc!");
            return;
        }

        if (compareJobs.length > 0 && compareJobs[0].category_id !== job.category_id) {
            Alert.alert("Không hợp lệ", "Để đối chiếu chuẩn xác, bạn cần chọn các công việc thuộc cùng một lĩnh vực/ngành nghề!");
            return;
        }

        setCompareJobs(prev => [...prev, job]);
    };

    const handleSyncAndOpenCompare = async () => {
        if (compareJobs.length < 2) {
            Alert.alert("Thông báo", "Bạn cần chọn ít nhất 2 công việc để tiến hành đối chiếu so sánh!");
            return;
        }

        try {
            const jobIds = compareJobs.map(j => j.id);
            await authApi(user.token).post(endpoints['comparison'], { job_ids: jobIds });
            setShowCompareModal(true);
        } catch (ex) {
            console.error('Sync compare error:', ex.message);
            setShowCompareModal(true);
        }
    };

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

    // JOB CARD 
    const JobCard = ({ job }) => {
        const isFeatured = Boolean(job.is_featured);
        const isBeingCompared = compareJobs.some(j => j.id === job.id);

        return (
            <View style={[styles.card, isFeatured ? styles.cardFeatured : {}]}>
                {isFeatured && (
                    <View style={styles.featuredRibbon}>   
                        <Text style={styles.featuredRibbonText}>
                            <Ionicons name="flame" size={10} color="#fff" /> NỔI BẬT
                        </Text>
                    </View>
                )}

                <TouchableOpacity 
                    style={{ flex: 1 }} 
                    onPress={() => navigation.navigate('JobDetail', { jobId: job.id })}
                >
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
                </TouchableOpacity>

                <View style={styles.cardBottomRow}>
                    <View style={styles.cardFooter}>
                        <View style={styles.tag}>
                            <Text style={styles.tagText}>
                                {{ FT: 'Full-time', PT: 'Part-time', RE: 'Remote', FR: 'Freelance' }[job.job_type] || 'Full-time'}
                            </Text>
                        </View>
                        {!!job.category_name && (
                            <View style={[styles.tag, { marginLeft: 8 }]}>
                                <Text style={styles.tagText}>{job.category_name}</Text>
                            </View>
                        )}
                    </View>

                    {(!user || user.role === 'candidate') && (
                        <TouchableOpacity 
                            style={[styles.compareCheckBtn, isBeingCompared && styles.compareCheckBtnActive]} 
                            onPress={() => toggleCompareJob(job)}
                        >
                            <Ionicons 
                                name={isBeingCompared ? "checkbox" : "square-outline"} 
                                size={18} 
                                color={isBeingCompared ? "#3B5BDB" : "#6B7280"} 
                            />
                            <Text style={[styles.compareCheckText, isBeingCompared && styles.compareCheckTextActive]}>
                                So sánh
                            </Text>
                        </TouchableOpacity>
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
            </View>
        );
    };

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

    //  Bảng so sánh các công việc
    const JobComparisonModal = () => {
        if (!showCompareModal) return null;

        return (
            <Modal visible={showCompareModal} animationType="slide" transparent={false} onRequestClose={() => setShowCompareModal(false)}>
                <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
                    {/* Header Modal */}
                    <View style={styles.compareHeader}>
                        <TouchableOpacity style={styles.compareCloseBtn} onPress={() => setShowCompareModal(false)}>
                            <Ionicons name="arrow-back" size={24} color="#222" />
                        </TouchableOpacity>
                        <Text style={styles.compareHeaderTitle}>Bảng Đối Chiếu Việc Làm</Text>
                        <TouchableOpacity onPress={() => setCompareJobs([]) || setShowCompareModal(false)}>
                            <Text style={{ color: '#E53E3E', fontWeight: '600' }}>Xóa hết</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                        
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.compareScrollRow}>
                            {compareJobs.map((item, idx) => (
                                <View key={item.id} style={[styles.compareColumn, { borderLeftWidth: idx > 0 ? 1 : 0, borderColor: '#eee' }]}>
                                    <Image source={{ uri: item.company_logo }} style={styles.compareLogo} />
                                    <Text style={styles.compareJobTitle} numberOfLines={2}>{item.title}</Text>
                                    <Text style={styles.compareCompanyName} numberOfLines={1}>{item.company_name}</Text>
                                </View>
                            ))}
                        </ScrollView>

                        {/* FIX BUG: Thay thế toàn bộ cụm job.max_salary lỗi thành item.max_salary */}
                        <Text style={styles.compareSectionTitle}>💰 Mức lương</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.compareScrollRow}>
                            {compareJobs.map((item, idx) => (
                                <View key={item.id} style={[styles.compareColumn, { borderLeftWidth: idx > 0 ? 1 : 0, borderColor: '#eee' }]}>
                                    <Text style={styles.infoValueBlue}>
                                        {item.salary_min && item.salary_max
                                            ? `${(item.salary_min / 1e6).toFixed(0)}–${(item.salary_max / 1e6).toFixed(0)} triệu`
                                            : 'Thỏa thuận'}
                                    </Text>
                                </View>
                            ))}
                        </ScrollView>

                        <Text style={styles.compareSectionTitle}>📍 Địa điểm</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.compareScrollRow}>
                            {compareJobs.map((item, idx) => (
                                <View key={item.id} style={[styles.compareColumn, { borderLeftWidth: idx > 0 ? 1 : 0, borderColor: '#eee' }]}>
                                    <Text style={styles.compareItemValue}>{item.location || 'Chưa cập nhật'}</Text>
                                </View>
                            ))}
                        </ScrollView>

                        <Text style={styles.compareSectionTitle}>⏱ Loại hình</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.compareScrollRow}>
                            {compareJobs.map((item, idx) => (
                                <View key={item.id} style={[styles.compareColumn, { borderLeftWidth: idx > 0 ? 1 : 0, borderColor: '#eee' }]}>
                                    <Text style={styles.compareItemValue}>
                                        {{ FT: 'Toàn thời gian', PT: 'Bán thời gian', RE: 'Từ xa', FR: 'Freelance' }[item.job_type] || 'Toàn thời gian'}
                                    </Text>
                                </View>
                            ))}
                        </ScrollView>

                        <Text style={styles.compareSectionTitle}>🛠 Kỹ năng yêu cầu</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.compareScrollRow}>
                            {compareJobs.map((item, idx) => (
                                <View key={item.id} style={[styles.compareColumn, { borderLeftWidth: idx > 0 ? 1 : 0, borderColor: '#eee' }]}>
                                    <View style={[styles.skillRow, { justifyContent: 'center' }]}>
                                        {item.skills && item.skills.length > 0 ? (
                                            item.skills.map(sk => (
                                                <View key={sk.id} style={styles.skillTag}>
                                                    <Text style={styles.skillText}>{sk.name}</Text>
                                                </View>
                                            ))
                                        ) : (
                                            <Text style={styles.compareItemValue}>Không yêu cầu</Text>
                                        )}
                                    </View>
                                </View>
                            ))}
                        </ScrollView>

                        {compareJobs.some(j => j.requirements) && (
                            <>
                                <Text style={styles.compareSectionTitle}>📝 Yêu cầu ứng viên</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.compareScrollRow}>
                                    {compareJobs.map((item, idx) => (
                                        <View key={item.id} style={[styles.compareColumn, { borderLeftWidth: idx > 0 ? 1 : 0, borderColor: '#eee' }]}>
                                            <Text style={styles.compareLongText}>{item.requirements || '—'}</Text>
                                        </View>
                                    ))}
                                </ScrollView>
                            </>
                        )}

                        {compareJobs.some(j => j.benefits) && (
                            <>
                                <Text style={styles.compareSectionTitle}>🎁 Chế độ đãi ngộ</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.compareScrollRow}>
                                    {compareJobs.map((item, idx) => (
                                        <View key={item.id} style={[styles.compareColumn, { borderLeftWidth: idx > 0 ? 1 : 0, borderColor: '#eee' }]}>
                                            <Text style={styles.compareLongText}>{item.benefits || '—'}</Text>
                                        </View>
                                    ))}
                                </ScrollView>
                            </>
                        )}
                    </ScrollView>
                </SafeAreaView>
            </Modal>
        );
    };

    // ==================== MAIN RENDER ====================
    return (
        <SafeAreaView style={styles.container}>
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
            <JobComparisonModal />

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

                <View style={{ height: compareJobs.length > 0 ? 80 : 20 }} />
            </ScrollView>

            {/* THANH TRẠNG THÁI NỔI CHỌN SO SÁNH (FLOATING ACTION BAR) */}
            {compareJobs.length > 0 && (
                <View style={styles.floatingCompareBar}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.floatingCompareText}>
                            Đang chọn <Text style={{ fontWeight: 'bold', color: '#3B5BDB' }}>{compareJobs.length}</Text>/5 công việc
                        </Text>
                        <Text style={styles.floatingCompareSub}>Các công việc phải thuộc cùng ngành nghề</Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                        <TouchableOpacity style={styles.clearCompareBtn} onPress={() => setCompareJobs([])}>
                            <Text style={styles.clearCompareText}>Xóa</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionCompareBtn} onPress={handleSyncAndOpenCompare}>
                            <Text style={styles.actionCompareText}>So sánh ⚖️</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </SafeAreaView>
    );
}