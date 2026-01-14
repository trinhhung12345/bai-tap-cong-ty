import { useNavigation } from '@react-navigation/native';
import { useEffect } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  Text,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { User, RootStackParamList } from '@navigation/index';
import { StackNavigationProp } from '@react-navigation/stack';
import { useUsersStore } from '@store/store';
import { ErrorView } from '@components/ErrorView';
import { EmptyView } from '@components/EmptyView';

export default function List() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { users, loading, error, fetchUsers } = useUsersStore();

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const renderItem = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('Detail', { user: item })}>
      <Image source={{ uri: item.profile_picture }} style={styles.cardImage} />
      <Text style={styles.cardTitle}>{`${item.first_name} ${item.last_name}`}</Text>
      <Text style={styles.cardSubtitle}>{item.email}</Text>
      <Text style={styles.cardJob}>{item.job}</Text>
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="thumbs-up-outline" size={24} color="#2196F3" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="thumbs-down-outline" size={24} color="#2196F3" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  if (error) {
    return <ErrorView message={error} onRetry={fetchUsers} />;
  }

  if (users.length === 0) {
    return <EmptyView message="Không có người dùng nào" error={error || undefined} />;
  }

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Tìm kiếm người dùng"
        placeholderTextColor="#999"
      />
      <FlatList
        data={users}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  searchInput: {
    height: 44,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 22,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardImage: {
    width: 100,
    height: 100,
    borderRadius: 16,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 4,
  },
  cardJob: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
  },
  actionButton: {
    padding: 8,
  },
});
