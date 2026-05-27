import { useEffect, useState } from 'react';
import {
    View, Text, FlatList, TextInput,
    TouchableOpacity, Image, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Apis, { endpoints } from '../../configs/Apis';
import styles from './Styles';
import Paginator from '../../components/Paginator';

const PAGE_SIZE = 10;

export default function CompaniesList({ navigation }) {
    const [companies, setCompanies] = useState([]);
    const [keyword, setKeyword] = useState('');
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    const loadCompanies = async () => {
        try {
            setLoading(true);
            let url = `${endpoints['companies']}?page=${page}`;
            
            if (keyword) {
                url += `&name__icontains=${encodeURIComponent(keyword.trim())}`;
            }
            let res = await Apis.get(url);
            const count = res.data?.count ?? 0;
            const data = res.data?.results ?? (Array.isArray(res.data) ? res.data : []);
            setTotalCount(count);
            setTotalPages(Math.ceil(count / PAGE_SIZE));

            setCompanies(data.map(c => ({ ...c, job_count: null })));

            const withCounts = await Promise.all(
                data.map(async (company) => {
                    try {
                        const jobRes = await Apis.get(
                            `${endpoints['jobs']}?company=${company.id}&page_size=1`
                        );
                        return { ...company, job_count: jobRes.data?.count ?? 0 };
                    } catch {
                        return { ...company, job_count: 0 };
                    }
                })
            );
            
            setCompanies(withCounts);
        } catch (ex) {
            console.error('Load companies error:', ex.message);
            setCompanies([]);
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        let timer = setTimeout(() => {
            if (page > 0) loadCompanies();
        }, 500);
        return () => clearTimeout(timer);
    }, [keyword, page]);

    const handlePageChange = (newPage) => {
        if (newPage < 1 || newPage > totalPages) 
            return;
        setPage(newPage);
    };

    const CompanyCard = ({ company }) => (
        <TouchableOpacity
            style={styles.companyCard}
            onPress={() => navigation.navigate('CompanyDetail', { companyId: company.id })}
        >
            <Image
                source={{ uri: company.logo_url || 'https://via.placeholder.com/80' }}
                style={styles.companyLogo}
            />
            <View style={styles.companyCardInfo}>
                <Text style={styles.companyCardName} numberOfLines={2}>
                    {company.name ?? ''}
                </Text>
                <Text style={styles.companyJobCount}>
                    {company.job_count === null ? '...' : `${company.job_count} việc làm`}
                </Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.searchContainer}>
                <View style={styles.searchRow}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Text style={styles.backBtnText}>‹</Text>
                    </TouchableOpacity>

                    <TextInput
                        style={[styles.searchInput, { flex: 1 }]}
                        placeholder="Tìm công ty..."
                        value={keyword}
                        onChangeText={setKeyword}
                        returnKeyType="search"
                    />
                </View>
            </View>

            <View style={[styles.sectionHeader, { marginTop: 12 }]}>
                <Text style={styles.sectionTitle}>Tất cả công ty</Text>
                {totalCount > 0 && (
                    <Text style={styles.totalCount}>{totalCount} công ty</Text>
                )}
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#3B5BDB" style={{ marginTop: 40 }} />
            ) : companies.length === 0 ? (
                <Text style={styles.emptyText}>Không tìm thấy công ty nào</Text>
            ) : (
            <FlatList
                data={companies}
                keyExtractor={item => item.id.toString()}
                renderItem={({ item }) => <CompanyCard company={item} />}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
            />
            )}
            {!loading && companies.length > 0 && (
                <Paginator
                    page={page}
                    totalPages={totalPages}
                    onGoTo={handlePageChange}
                />
            )}
        </SafeAreaView>
    );
}