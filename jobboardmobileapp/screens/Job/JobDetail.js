import { useEffect, useState } from "react";
import {
    View, Text, Image, ScrollView, TouchableOpacity,
    ActivityIndicator, Modal, TextInput, Alert, Linking
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Apis, {authApi, endpoints} from '../../configs/Apis';
import {useMyUser} from '../../configs/Contexts';
import styles from './Styles';

export default function JobDetail({ route, navigation}){

    const {jobId} = route.params;
    const user = useMyUser();

    const [job,setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('description')
    const [showApplyModal, setShowApplyModal] = useState(false);
    const [coverLetter, setCoverLetter] = useState('');
    const [cvOption, setCvOption] = useState('profile');
    const [submitting, setSubmitting] = useState(false);
    const [hasApplied, setHasApplied] = useState(false);

    //Load job detail
    const loadJob = async () =>{
        try {
            setLoading(true);
            let res = await Apis.get(endpoints['job-detail'](jobId));
            setJob(res.data);
        } catch (ex){
            console.error('Loading job error:', ex.message);
            Alert.alert('Lỗi','Không thể tải thông tin việc làm');
        } finally {
            setLoading(false);
        }
    };

    //Kiểm tra đã ứng tuyển chưa
    const checkApplied = async () =>{
        if (!user) return;
        try{
            let res = await authApi(user.token).get(endpoints['applications']);
            const apps = res.data?.results ?? res.data ?? [];
            const applied = apps.some(a => a.job?.id === jobId);
            setHasApplied(applied);
        } catch (ex){
            console.error('Check applied error:', ex.message);
        }
    };

    useEffect(() => {
        loadJob();
        checkApplied();
    },[jobId]);

    const handleApply = async () =>{
        if (!user){
            Alert.alert('Thông báo','Vui lòng đăng nhập để ứng tuyển');
            navigation.navigate('Login');
            return;
        }
        setSubmitting(true);
        try{
            let formData = new FormData();
            formData.append('job_id', jobId);
            if (coverLetter.trim()){
                formData.append('cover_letter', coverLetter.trim());
            }
            await authApi(user.token).post(endpoints['applications'], formData,{
                headers: {'Content-Type':'multipart/form-data'}
            });
            setHasApplied(true);
            setShowApplyModal(false);
            Alert.alert('Thành công','Nộp đơn ứng tuyển thành công!');
        } catch (ex){
            const errMsg = ex.response?.data ? Object.values(ex.response.data).flat().join('\n') : 'Có lỗi xảy ra';
            Alert.alert('Lỗi', errMsg);
        } finally{
            setSubmitting(false);
        }
    };
    //Tab mô tả
    const DescriptionTab = () => (
        <ScrollView style={styles.content}>
            <Text style={styles.sectionTitle}>Thông tin chung</Text>
            <View style={styles.infoGrid}>
                <View style={styles.infoGridItem}>
                    <Text style={styles.infoGridLabel}>Loại hình</Text>
                    <Text style={styles.infoGridValue}>
                        {job.job_type === 'FT' ? 'Toàn thời gian'
                            : job.job_type === 'PT' ? 'Bán thời gian'
                            : job.job_type === 'RE' ? 'Từ xa'
                            : 'Freelance'}
                    </Text>
                </View>
                <View style={styles.infoGridItem}>
                    <Text style={styles.infoGridLabel}>Số lượng</Text>
                    <Text style={styles.infoGridValue}>{job.quantity ?? 1} người</Text>
                </View>
                <View style={styles.infoGridItem}>
                    <Text style={styles.infoGridLabel}>Ngày đăng</Text>
                    <Text style={styles.infoGridValue}>
                        {new Date(job.created_at).toLocaleDateString('vi-VN')}
                    </Text>
                </View>
                <View style={styles.infoGridItem}>
                    <Text style={styles.infoGridLabel}>Kinh nghiệm</Text>
                    <Text style={styles.infoGridValue}>
                        {job.experience_required ?? 'Không yêu cầu'}
                    </Text>
                </View>
            </View>

            {/*Kỹ năng*/}
            {job.skills?.length > 0 && (
                <>
                    <Text style={styles.sectionTitle}>Kỹ năng yêu cầu</Text>
                    <View style={styles.skillRow}>
                        {job.skills.map(skill => (
                            <View key={skill.id} style={styles.skillTag}>
                                <Text style={styles.skillText}>{skill.name ?? ''}</Text>
                            </View>
                        ))}
                    </View>
                </>
            )}
            {/*Mô tả*/}
            {!!job.description && (
                <>
                    <Text style={styles.sectionTitle}>Mô tả công việc</Text>
                    <Text style={styles.contentText}>{job.description}</Text>
                </>
            )}
            {/*Yêu cầu*/}
            {!!job.requirements && (
                <>
                    <Text style={styles.sectionTitle}>Yêu cầu ứng viên</Text>
                    <Text style={styles.contentText}>{job.requirements}</Text>
                </>
            )}
            {/*Phúc lợi*/}
            {!!job.benefits && (
                <>
                    <Text style={styles.sectionTitle}>Chế độ đãi ngộ</Text>
                    <Text style={styles.contentText}>{job.benefits}</Text>
                </>
            )}
            <View style={{ height: 100 }} />
        </ScrollView>
    );
    // Tab Công ty
    const CompanyTab = () => (
        <ScrollView style={styles.content}>
            <Image
                source={{ uri: job.company?.logo_url || 'https://via.placeholder.com/80' }}
                style={styles.companyDetailLogo}
            />
            <Text style={styles.companyDetailName}>{job.company?.name ?? ''}</Text>

            {!!job.company?.address && (
                <View style={styles.companyInfoRow}>
                    <Text style={styles.companyInfoIcon}></Text>
                    <Text style={styles.companyInfoText}>{job.company.address}</Text>
                </View>
            )}
            {!!job.company?.website && (
                <View style={styles.companyInfoRow}>
                    <Text style={styles.companyInfoIcon}></Text>
                    <TouchableOpacity onPress={() => Linking.openURL(job.company.website)}>
                        <Text style={styles.websiteText}>{job.company.website}</Text>
                    </TouchableOpacity>
                </View>
            )}
            {!!job.company?.description && (
                <>
                    <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Giới thiệu công ty</Text>
                    <Text style={styles.contentText}>{job.company.description}</Text>
                </>    
            )}
            <View style={{ height: 100 }} />
        </ScrollView>
    );

    //Modal nộp đơn
    const ApplyModal = () => (
        <Modal
            visible={showApplyModal}
            transparent
            animationType="slide"
            onRequestClose={() => setShowApplyModal(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                    <Text style={styles.modalTitle}>Nộp đơn ứng tuyển</Text>

                    {/*CV option*/}
                    <Text style={styles.modalLabel}>Chọn CV</Text>
                    <TouchableOpacity
                        style={[styles.cvOption, cvOption === 'profile' && styles.cvOptionActive]}
                        onPress={() => setCvOption('profile')}
                    >
                        <Text style={styles.companyInfoIcon}></Text>
                        <Text style={[
                            styles.cvOptionText,
                            cvOption === 'profile' && styles.cvOptionTextActive
                        ]}>
                            Dùng CV từ hồ sơ của tôi
                        </Text>
                        {cvOption === 'profile' && <Text>✓</Text>}
                    </TouchableOpacity>

                    {/*Cover letter*/}
                    <Text style={styles.modalLabel}>Thư xin việc (tùy chọn)</Text>
                    <TextInput
                        style={styles.modalInput}
                        placeholder="Viết thư xin việc của bạn..."
                        value={coverLetter}
                        onChangeText={setCoverLetter}
                        multiline
                        numberOfLines={4}
                    />

                    {/*Submit*/}
                    <TouchableOpacity
                        style={[styles.submitBtn, submitting && { opacity: 0.7}]}
                        onPress={handleApply}
                        disabled={submitting}
                    >
                        {submitting
                            ? <ActivityIndicator color="#fff"/>
                            : <Text style={styles.submitBtnText}>Xác nhận nộp đơn</Text>
                        }
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.cancelBtn}
                        onPress={() => setShowApplyModal(false)}
                    >
                        <Text style={styles.cancelBtnText}>Huỷ</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#3B5BDB"/>
            </SafeAreaView>
        );
    }

    if (!job) return null;

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView stickyHeaderIndices={[1]} showsHorizontalScrollIndicator={false}>
                {/*Header*/}
                <View style={styles.header}>
                    {job.is_featured && (
                        <View>
                            <Text style={styles.featuredBadgeText}>Tin nổi bật</Text>
                        </View>
                    )}
                    <Text style={styles.jobTitle}>{job.title ?? ''}</Text>

                    {/* Company */}
                    <View style={styles.companyRow}>
                        <Image
                            source={{ uri: job.company?.logo_url || 'https://via.placeholder.com/48' }}
                            style={styles.companyLogo}
                        />
                        <Text style={styles.companyName}>{job.company?.name ?? ''}</Text>
                    </View>

                     {/* Salary */}
                    <View style={styles.infoRow}>
                        <Text style={styles.infoIcon}></Text>
                        <View>
                            <Text style={styles.infoLabel}>Mức lương: </Text>
                            <Text style={styles.infoValueBlue}>
                                {job.salary_min && job.salary_max
                                    ? `${(job.salary_min / 1e6).toFixed(0)}-${(job.salary_max / 1e6).toFixed(0)} triệu`
                                    : 'Thỏa thuận'}
                            </Text>
                        </View>
                    </View>
                    {/* Deadline */}
                    {!!job.deadline && (
                        <View style={styles.infoRow}>
                            <Text style={styles.infoIcon}></Text>
                            <View>
                                <Text style={styles.infoLabel}>Hạn nộp: </Text>
                                <Text style={styles.infoValue}>
                                    {new Date(job.deadline).toLocaleDateString('vi-VN')}
                                </Text>
                            </View>
                        </View>
                    )}
                    {/* Location */}
                    {!!job.location && (
                        <View style={styles.infoRow}>
                            <Text style={styles.infoIcon}></Text>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.infoLabel}>Địa điểm: </Text>
                                <Text style={styles.infoValue}>{job.location}</Text>
                            </View>
                        </View>
                    )}
                    {/* Category */}
                    {!!job.category?.name && (
                        <View style={styles.infoRow}>
                            <Text style={styles.infoIcon}>🏷</Text>
                            <View>
                                <Text style={styles.infoLabel}>Ngành nghề: </Text>
                                <Text style={styles.infoValue}>{job.category.name}</Text>
                            </View>
                        </View>
                    )}
                </View>
                {/* Tabs — sticky */}
                <View style={styles.tabContainer}>
                    {[
                        { key: 'description', label: 'Mô tả' },
                        { key: 'company', label: 'Công ty' },
                    ].map(tab => (
                        <TouchableOpacity
                            key={tab.key}
                            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
                            onPress={() => setActiveTab(tab.key)}
                        >
                            <Text style={[
                                styles.tabText,
                                activeTab === tab.key && styles.tabTextActive
                            ]}>
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/*Tab content*/}
                {activeTab === 'description' ? <DescriptionTab/> : <CompanyTab/>}
            </ScrollView>
            {/* Apply button */}
            <View style={styles.applyContainer}>
                <TouchableOpacity
                    style={[styles.applyBtn, hasApplied && styles.applyBtnDisabled]}
                    onPress={() => !hasApplied && setShowApplyModal(true)}
                    disabled={hasApplied}
                >
                    <Text style={styles.applyBtnText}>
                        {hasApplied ? ' Đã ứng tuyển' : 'Nộp đơn ứng tuyển'}
                    </Text>
                </TouchableOpacity>
            </View>

            <ApplyModal />
        </SafeAreaView>
    );
}