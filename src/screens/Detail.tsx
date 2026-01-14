import { RouteProp, useRoute } from '@react-navigation/native';
import { StyleSheet, Text, View, Image, ScrollView } from 'react-native';
import { RootStackParamList } from '@navigation/index';

type DetailScreenRouteProp = RouteProp<RootStackParamList, 'Detail'>;

export default function Detail() {
  const route = useRoute<DetailScreenRouteProp>();
  const params = route.params;

  // Handle both legacy Item and new User
  const user = 'user' in params ? params.user : null;

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Không tìm thấy thông tin người dùng</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Image source={{ uri: user.profile_picture }} style={styles.image} />
        <Text style={styles.name}>{`${user.first_name} ${user.last_name}`}</Text>
        <Text style={styles.email}>{user.email}</Text>
        <Text style={styles.job}>{user.job}</Text>

        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Giới tính:</Text>
            <Text style={styles.value}>{user.gender}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Ngày sinh:</Text>
            <Text style={styles.value}>
              {new Date(user.date_of_birth).toLocaleDateString('vi-VN')}
            </Text>
          </View>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Địa chỉ</Text>
          <Text style={styles.address}>{user.street}</Text>
          <Text style={styles.address}>{`${user.city}, ${user.state} ${user.zipcode}`}</Text>
          <Text style={styles.address}>{user.country}</Text>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Liên hệ</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Số điện thoại:</Text>
            <Text style={styles.value}>{user.phone}</Text>
          </View>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Vị trí</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Kinh độ:</Text>
            <Text style={styles.value}>{user.longitude}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Vĩ độ:</Text>
            <Text style={styles.value}>{user.latitude}</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 100,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    margin: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  image: {
    width: 150,
    height: 150,
    borderRadius: 16,
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: 8,
  },
  email: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 4,
  },
  job: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 24,
  },
  infoSection: {
    width: '100%',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  label: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  value: {
    fontSize: 14,
    color: '#000',
    flex: 1,
    textAlign: 'right',
  },
  address: {
    fontSize: 14,
    color: '#000',
    textAlign: 'center',
    marginBottom: 2,
  },
});
