import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { List, Divider, Avatar, Button } from 'react-native-paper';
import { useMyUser, useMyDispatch } from '../../configs/Contexts';
import { useNavigation } from '@react-navigation/native';
import styles from './Styles';

const Profile = () => {
    const user = useMyUser();
    const dispatch = useMyDispatch();
    const nav = useNavigation();

    const handleLogout = () => {
        Alert.alert("Xác nhận", "Bạn có chắc chắn muốn đăng xuất?", [
            { text: "Hủy", style: "cancel" },
            { 
                text: "Đăng xuất", 
                onPress: () => {
                    dispatch({ "type": "logout" });
                    nav.navigate("Home");
                },
                style: "destructive" 
            }
        ]);
    };

    // if (!user) {
    //     return (
    //         <SafeAreaView style={styles.container}>
    //             <View style={[styles.container, styles.center]}>
    //                 <Text>Bạn chưa đăng nhập.</Text>
    //                 <Button 
    //                     mode="contained" 
    //                     onPress={() => nav.navigate("Login")} 
    //                     style={styles.submitBtn}
    //                 >
    //                     Đi tới Đăng nhập
    //                 </Button>
    //             </View>
    //         </SafeAreaView>
    //     );
    // }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                
                {/* Header Profile */}
                <View style={styles.headerContainer}>
                    <Avatar.Image 
                        size={120} 
                        source={{ uri: user.avatar || 'https://via.placeholder.com/120' }} 
                        style={{ backgroundColor: '#ccc' }}
                    />
                    <Text style={styles.sectionTitle}>{user.first_name} {user.last_name}</Text>
                    <Text style={styles.subTitle}>@{user.username}</Text>
                    
                    <View style={styles.tag}>
                        <Text style={styles.tagText}>
                            {user.role === 'EM' ? 'Nhà tuyển dụng' : 'Ứng viên'}
                        </Text>
                    </View>
                </View>

                <Divider />

                {/* Thông tin chi tiết */}
                <View style={styles.infoSection}>
                    <List.Section>
                        <List.Subheader>Thông tin liên hệ</List.Subheader>
                        <List.Item
                            title="Email"
                            description={user.email || "Chưa cập nhật"}
                            left={props => <List.Icon {...props} icon="email-outline" />}
                        />
                        <List.Item
                            title="Số điện thoại"
                            description={user.phone || "Chưa cập nhật"}
                            left={props => <List.Icon {...props} icon="phone-outline" />}
                        />
                    </List.Section>

                    <Divider />

                    <List.Section>
                        <List.Subheader>Cài đặt tài khoản</List.Subheader>
                        <TouchableOpacity onPress={() => nav.navigate("EditProfile")}>
                            <List.Item
                                title="Chỉnh sửa hồ sơ"
                                left={props => <List.Icon {...props} icon="account-edit-outline" />}
                                right={props => <List.Icon {...props} icon="chevron-right" />}
                            />
                        </TouchableOpacity>
                        
                        <TouchableOpacity onPress={() => nav.navigate("ChangePassword")}>
                            <List.Item
                                title="Đổi mật khẩu"
                                left={props => <List.Icon {...props} icon="lock-reset" />}
                                right={props => <List.Icon {...props} icon="chevron-right" />}
                            />
                        </TouchableOpacity>
                    </List.Section>
                </View>

                {/* Nút đăng xuất */}
                <View style={{ padding: 20 }}>
                    <Button 
                        mode="outlined" 
                        onPress={handleLogout}
                        textColor="#fa5252"
                        style={styles.logoutBtn}
                    >
                        Đăng xuất
                    </Button>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default Profile;