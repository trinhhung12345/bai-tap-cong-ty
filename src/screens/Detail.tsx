import { RouteProp, useRoute, useFocusEffect } from '@react-navigation/native';
import {
  StyleSheet,
  Text,
  View,
  Image,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  ToastAndroid,
  FlatList
} from 'react-native';
import { useCallback, useState, useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '@navigation/index';
import { useUsersStore } from '@store/store';
import { ErrorView } from '@components/ErrorView';

type DetailScreenRouteProp = RouteProp<RootStackParamList, 'Detail'>;

export default function Detail() {
  const route = useRoute<DetailScreenRouteProp>();
  const params = route.params;
  const {
    userDetail,
    userDetailLoading,
    userDetailError,
    fetchUserById,
    favorites,
    comments,
    isFavoriting,
    isCommenting,
    toggleFavorite,
    addComment
  } = useUsersStore();

  const [commentText, setCommentText] = useState('');

  const userId = params.userId;

  // Computed values
  const isFavorited = favorites.has(userId);
  const userComments = useMemo(() =>
    comments.filter(c => c.userId === userId),
    [comments, userId]
  );

  // Handlers
  const handleFavoritePress = useCallback(async () => {
    console.log(`💖 Favorite button pressed for user ${userId}`);
    await toggleFavorite(userId);
  }, [userId, toggleFavorite]);

  const handleCommentSubmit = useCallback(async () => {
    if (!commentText.trim()) {
      console.log('❌ Comment validation failed: empty text');
      Alert.alert('Lỗi', 'Vui lòng nhập nội dung bình luận');
      return;
    }

    console.log(`💬 Submitting comment for user ${userId}: "${commentText}"`);
    await addComment(userId, commentText);
    setCommentText(''); // Clear input on success

    // Show success feedback
    if (Platform.OS === 'android') {
      ToastAndroid.show('Bình luận đã được đăng!', ToastAndroid.SHORT);
      console.log('🔔 Success toast shown (Android)');
    } else {
      Alert.alert('Thành công', 'Bình luận đã được đăng!');
      console.log('🔔 Success alert shown (iOS)');
    }
  }, [userId, commentText, addComment]);

  const showErrorFeedback = useCallback((message: string) => {
    console.log(`⚠️ Showing error feedback: ${message}`);
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.LONG);
    } else {
      Alert.alert('Lỗi', message);
    }
  }, []);

  // Focus effect: fetch user detail when screen becomes focused
  useFocusEffect(
    useCallback(() => {
      console.log('📱 Detail screen focused - fetching user detail');
      const controller = new AbortController();
      fetchUserById(userId, controller.signal);

      return () => {
        console.log('📱 Detail screen blurred - cancelling user detail request');
        controller.abort();
      };
    }, [userId, fetchUserById])
  );

  if (userDetailLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  if (userDetailError) {
    return <ErrorView message={userDetailError} onRetry={() => fetchUserById(userId)} />;
  }

  if (!userDetail) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Không tìm thấy thông tin người dùng</Text>
      </View>
    );
  }

  const user = userDetail;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Image source={{ uri: user.profile_picture }} style={styles.image} />
        <Text style={styles.name}>{`${user.first_name} ${user.last_name}`}</Text>
        <Text style={styles.email}>{user.email}</Text>
        <Text style={styles.job}>{user.job}</Text>

        {/* Favorite Button */}
        <TouchableOpacity
          style={[styles.favoriteButton, isFavoriting && styles.favoriteButtonDisabled]}
          onPress={handleFavoritePress}
          disabled={isFavoriting}
        >
          <Ionicons
            name={isFavorited ? "heart" : "heart-outline"}
            size={28}
            color={isFavorited ? "#FF6B6B" : "#666"}
          />
          <Text style={[styles.favoriteText, isFavorited && styles.favoriteTextActive]}>
            {isFavorited ? 'Đã yêu thích' : 'Yêu thích'}
          </Text>
          {isFavoriting && (
            <ActivityIndicator size="small" color="#FF6B6B" style={styles.favoriteLoading} />
          )}
        </TouchableOpacity>

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

        {/* Comments Section */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Bình luận ({userComments.length})</Text>

          {/* Comment Form */}
          <View style={styles.commentForm}>
            <TextInput
              style={[styles.commentInput, isCommenting && styles.commentInputDisabled]}
              placeholder="Viết bình luận của bạn..."
              placeholderTextColor="#999"
              value={commentText}
              onChangeText={setCommentText}
              multiline
              numberOfLines={3}
              editable={!isCommenting}
            />
            <TouchableOpacity
              style={[styles.commentButton, isCommenting && styles.commentButtonDisabled]}
              onPress={handleCommentSubmit}
              disabled={isCommenting}
            >
              {isCommenting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="send" size={16} color="#fff" />
                  <Text style={styles.commentButtonText}>Gửi</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Comments List */}
          {userComments.length > 0 && (
            <View style={styles.commentsList}>
              {userComments.map((comment) => (
                <View key={comment.id} style={styles.commentItem}>
                  <Text style={styles.commentText}>{comment.text}</Text>
                  <Text style={styles.commentDate}>
                    {comment.createdAt.toLocaleString('vi-VN')}
                  </Text>
                </View>
              ))}
            </View>
          )}
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
  favoriteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  favoriteButtonDisabled: {
    opacity: 0.6,
  },
  favoriteText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 8,
    fontWeight: '500',
  },
  favoriteTextActive: {
    color: '#FF6B6B',
  },
  favoriteLoading: {
    marginLeft: 8,
  },
  commentForm: {
    marginBottom: 16,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlignVertical: 'top',
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  commentInputDisabled: {
    backgroundColor: '#f5f5f5',
    opacity: 0.7,
  },
  commentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  commentButtonDisabled: {
    backgroundColor: '#ccc',
  },
  commentButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  commentsList: {
    marginTop: 16,
  },
  commentItem: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  commentText: {
    fontSize: 14,
    color: '#000',
    marginBottom: 4,
  },
  commentDate: {
    fontSize: 12,
    color: '#666',
  },
});
