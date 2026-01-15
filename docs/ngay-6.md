# 📱 Ngày 6: Detail + POST (mutation) + Optimistic UI + Chặn Spam Click

## 🎯 Mục tiêu
Màn Detail gọi GET + có nút hành động gọi POST/PUT mock, có trạng thái submit + feedback. Chặn double tap, optimistic UI để UX mượt mà.

## 📚 Kiến thức nền tảng

### 1. Mutation Flow (Luồng thay đổi dữ liệu)

#### Tại sao cần mutation flow?
```typescript
// ❌ Trước: Nhấn button → API call → Không feedback gì
const handleLike = async () => {
  await api.post('/like'); // User không biết đang làm gì
};

// ✅ Sau: Clear flow với loading + success/fail feedback
const handleLike = async () => {
  setIsLoading(true);     // Show loading
  try {
    await api.post('/like');
    showSuccess('Liked!'); // Success feedback
  } catch (error) {
    showError('Failed');   // Error feedback
  } finally {
    setIsLoading(false);   // Hide loading
  }
};
```

#### isSubmitting Pattern
```typescript
const [isSubmitting, setIsSubmitting] = useState(false);

// Prevent multiple submissions
const handleSubmit = async () => {
  if (isSubmitting) return; // Block double clicks

  setIsSubmitting(true);
  try {
    await submitData();
  } finally {
    setIsSubmitting(false);
  }
};

// UI reflects loading state
<Button disabled={isSubmitting}>
  {isSubmitting ? <Spinner /> : 'Submit'}
</Button>
```

### 2. Optimistic UI (Cập nhật giao diện lạc quan)

#### Concept: Update UI trước, rollback nếu fail
```typescript
const handleLike = async () => {
  // 1. OPTIMISTIC: Update UI immediately
  setLiked(true); // User sees instant feedback

  try {
    // 2. API call in background
    await api.post('/like');
    // Success: Keep the optimistic update
  } catch (error) {
    // 3. ROLLBACK: Revert on failure
    setLiked(false); // User sees it "undo"
    showError('Failed to like');
  }
};
```

#### Benefits:
- **Instant feedback**: App feels fast
- **Better UX**: No waiting for network
- **Graceful fallback**: Rollback on errors

### 3. Prevent Double Tap (Chặn spam click)

#### State-based locking
```typescript
const [isProcessing, setIsProcessing] = useState(false);

const handleAction = async () => {
  if (isProcessing) {
    console.log('Blocked: Already processing');
    return; // Ignore subsequent taps
  }

  setIsProcessing(true);
  try {
    await doSomething();
  } finally {
    setIsProcessing(false);
  }
};
```

#### UI feedback
```typescript
<TouchableOpacity
  disabled={isProcessing}
  style={{ opacity: isProcessing ? 0.5 : 1 }}
>
  {isProcessing ? <Spinner /> : <Icon />}
</TouchableOpacity>
```

### 4. Feedback Patterns (Alert vs Toast)

#### Platform-specific feedback
```typescript
import { Alert, ToastAndroid, Platform } from 'react-native';

const showFeedback = (message: string, isError = false) => {
  if (Platform.OS === 'android') {
    // Toast for Android
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    // Alert for iOS
    Alert.alert(
      isError ? 'Error' : 'Success',
      message,
      [{ text: 'OK' }]
    );
  }
};
```

#### When to use what:
- **Toast**: Quick success messages, non-critical
- **Alert**: Errors, important confirmations, iOS style

## 🔧 Implementation trong App

### 1. Store với Mutations

#### `src/store/store.ts`
```typescript
interface UsersState {
  // Existing states...
  favorites: Set<number>;
  reactions: Map<number, 'like' | 'dislike'>; // NEW: Like/dislike reactions
  comments: Comment[];
  isFavoriting: boolean;
  isLiking: boolean; // NEW: Loading state for reactions
  isCommenting: boolean;

  // Mutation functions
  toggleFavorite: (userId: number) => Promise<void>;
  toggleReaction: (userId: number, type: 'like' | 'dislike') => Promise<void>; // NEW
  addComment: (userId: number, commentText: string) => Promise<void>;
}

export const useUsersStore = create<UsersState>((set, get) => ({
  // Initial states...
  favorites: new Set<number>(),
  reactions: new Map<number, 'like' | 'dislike'>(), // NEW
  comments: [],
  isFavoriting: false,
  isLiking: false, // NEW
  isCommenting: false,

  // toggleReaction implementation
  toggleReaction: async (userId: number, type: 'like' | 'dislike') => {
    const { reactions, isLiking } = get();

    // Prevent double tap
    if (isLiking) {
      console.log('🛡️ Prevented double tap - already reacting');
      return;
    }

    const currentReaction = reactions.get(userId);
    const isSameReaction = currentReaction === type;

    console.log(`🚀 Starting ${type} toggle for user ${userId} (current: ${currentReaction || 'none'})`);
    set({ isLiking: true });

    // OPTIMISTIC UI: Update immediately
    const newReactions = new Map(reactions);

    if (isSameReaction) {
      // Remove reaction if same type
      newReactions.delete(userId);
      console.log(`✨ Optimistic: User ${userId} ${type} removed`);
    } else {
      // Set new reaction (replaces any existing)
      newReactions.set(userId, type);
      console.log(`✨ Optimistic: User ${userId} ${type} added`);
    }

    set({ reactions: newReactions });

    try {
      // Mock API call with 30% fail rate
      console.log(`📡 API call: POST /users/${userId}/reactions (${type})`);
      await usersService.toggleReaction(userId, type);

      console.log(`✅ API success: User ${userId} reaction ${type} confirmed`);
    } catch (error: any) {
      // ROLLBACK on failure
      console.log(`❌ API failed: Rolling back ${type} for user ${userId}`, error.message);
      const rollbackReactions = new Map(reactions);

      if (isSameReaction) {
        // Add back the removed reaction
        rollbackReactions.set(userId, type);
        console.log(`🔄 Rolling back: User ${userId} ${type} added back`);
      } else {
        // Remove the added reaction and restore previous
        rollbackReactions.delete(userId);
        if (currentReaction) {
          rollbackReactions.set(userId, currentReaction);
          console.log(`🔄 Rolling back: User ${userId} restored to ${currentReaction}`);
        } else {
          console.log(`🔄 Rolling back: User ${userId} reaction removed`);
        }
      }

      set({ reactions: rollbackReactions });
    } finally {
      set({ isLiking: false });
      console.log(`🔒 Reaction buttons unlocked for user ${userId}`);
    }
  },

  // Other mutation functions...
}));
```

**Cách hoạt động:**
- **State management**: reactions Map lưu trạng thái like/dislike cho mỗi user
- **isLiking**: Loading state để chặn double tap
- **Optimistic update**: Thay đổi UI ngay lập tức
- **Rollback logic**: Khôi phục trạng thái cũ nếu API fail
- **Console logs**: Debug từng bước của mutation flow

### 2. Mock API với Fail Simulation

#### `src/services/users.ts`
```typescript
export const usersService = {
  // Existing functions...

  /**
   * Toggle reaction (like/dislike) for a user (Day 6: Mock API with 30% fail rate)
   */
  toggleReaction: async (userId: number, type: 'like' | 'dislike'): Promise<{ success: boolean }> => {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // 30% chance of failure for testing rollback
      if (Math.random() < 0.3) {
        console.log('🎲 Random failure triggered (30% chance)');
        throw new Error(`Failed to ${type} - network error`);
      }

      // Mock successful response
      return { success: true };
    } catch (error) {
      throw error;
    }
  },

  // Other functions...
};
```

**Cách hoạt động:**
- **Network simulation**: 500ms delay giả lập API call
- **30% fail rate**: Math.random() < 0.3 để test rollback
- **Error handling**: Throw error để trigger rollback trong store

### 3. UserCard với Optimistic Like/Dislike

#### `src/components/UserCard.tsx`
```typescript
import React from 'react';
import { StyleSheet, View, TouchableOpacity, Image, Text, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { User } from '../navigation/index';
import { useUsersStore } from '../store/store';

type UserCardProps = {
    user: User;
    onPress: (userId: number) => void;
};

export const UserCard = React.memo(({ user, onPress }: UserCardProps) => {
    const { reactions, isLiking, toggleReaction } = useUsersStore();

    const userReaction = reactions.get(user.id);

    console.log(`👤 UserCard: Rendered for user ${user.first_name} ${user.last_name} (ID: ${user.id}), reaction: ${userReaction || 'none'}`);

    const handleLike = () => {
        console.log(`👍 Like button pressed for user ${user.id}`);
        toggleReaction(user.id, 'like');
    };

    const handleDislike = () => {
        console.log(`👎 Dislike button pressed for user ${user.id}`);
        toggleReaction(user.id, 'dislike');
    };

    return (
        <TouchableOpacity style={styles.card} onPress={() => onPress(user.id)}>
            <Image source={{ uri: user.profile_picture }} style={styles.cardImage} />
            <Text style={styles.cardTitle}>{`${user.first_name} ${user.last_name}`}</Text>
            <Text style={styles.cardSubtitle}>{user.email}</Text>
            <Text style={styles.cardJob}>{user.job}</Text>
            <View style={styles.actionButtons}>
                <TouchableOpacity
                    style={[styles.actionButton, isLiking && styles.actionButtonDisabled]}
                    onPress={handleLike}
                    disabled={isLiking}
                >
                    {isLiking ? (
                        <ActivityIndicator size="small" color="#4CAF50" />
                    ) : (
                        <Ionicons
                            name={userReaction === 'like' ? "thumbs-up" : "thumbs-up-outline"}
                            size={24}
                            color={userReaction === 'like' ? "#4CAF50" : "#666"}
                        />
                    )}
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionButton, isLiking && styles.actionButtonDisabled]}
                    onPress={handleDislike}
                    disabled={isLiking}
                >
                    {isLiking ? (
                        <ActivityIndicator size="small" color="#F44336" />
                    ) : (
                        <Ionicons
                            name={userReaction === 'dislike' ? "thumbs-down" : "thumbs-down-outline"}
                            size={24}
                            color={userReaction === 'dislike' ? "#F44336" : "#666"}
                        />
                    )}
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );
});
```

**Cách hoạt động:**
- **Direct store connection**: Sử dụng useUsersStore thay vì props
- **Reaction state**: `reactions.get(user.id)` lấy trạng thái hiện tại
- **Visual feedback**: Icon thay đổi color + fill dựa trên reaction
- **Loading states**: ActivityIndicator khi isLiking = true
- **Disabled buttons**: Prevent interaction khi đang process

### 4. Detail Screen với Favorite + Comments

#### `src/screens/Detail.tsx`
```typescript
export default function Detail() {
  const { favorites, comments, isFavoriting, isCommenting, toggleFavorite, addComment } = useUsersStore();
  const [commentText, setCommentText] = useState('');

  const userId = params.userId;
  const isFavorited = favorites.has(userId);

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

    // Platform-specific feedback
    if (Platform.OS === 'android') {
      ToastAndroid.show('Bình luận đã được đăng!', ToastAndroid.SHORT);
      console.log('🔔 Success toast shown (Android)');
    } else {
      Alert.alert('Thành công', 'Bình luận đã được đăng!');
      console.log('🔔 Success alert shown (iOS)');
    }
  }, [userId, commentText, addComment]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        {/* User info... */}

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

        {/* Comments Section */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Bình luận ({comments.filter(c => c.userId === userId).length})</Text>

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
          {comments.filter(c => c.userId === userId).map((comment) => (
            <View key={comment.id} style={styles.commentItem}>
              <Text style={styles.commentText}>{comment.text}</Text>
              <Text style={styles.commentDate}>
                {comment.createdAt.toLocaleString('vi-VN')}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
```

**Cách hoạt động:**
- **Favorite button**: Optimistic UI với heart icon + loading
- **Comment form**: Validation + submit với feedback
- **Platform feedback**: ToastAndroid vs Alert
- **Comments display**: Filter by userId + optimistic adds

## 🔄 Cách hoạt động

### 1. Like/Dislike Flow

#### Like Button Press:
```
👍 Like button pressed for user 1
🚀 Starting like toggle for user 1 (current: none)
✨ Optimistic: User 1 like added
📡 API call: POST /users/1/reactions (like)
✅ API success: User 1 reaction like confirmed
🔒 Reaction buttons unlocked for user 1
```

#### API Failure (30% chance):
```
👍 Like button pressed for user 1
🚀 Starting like toggle for user 1 (current: none)
✨ Optimistic: User 1 like added
📡 API call: POST /users/1/reactions (like)
🎲 Random failure triggered (30% chance)
❌ API failed: Rolling back like for user 1
🔄 Rolling back: User 1 reaction removed
🔒 Reaction buttons unlocked for user 1
```

### 2. Comment Submission Flow

#### Valid Comment:
```
💬 Submitting comment for user 1: "Great user!"
🚀 Starting comment submission for user 1
✨ Optimistic: Comment added to UI for user 1
📡 API call: POST /users/1/comments
✅ API success: Comment posted for user 1
🔔 Success toast shown (Android)
🔒 Comment button unlocked for user 1
```

#### Invalid Comment:
```
❌ Comment validation failed: empty text
[Alert shown: "Vui lòng nhập nội dung bình luận"]
```

### 3. Double Tap Prevention

#### When button is loading:
```
🛡️ Prevented double tap - already reacting
[Button press ignored]
```

### 4. Feedback System

#### Success Feedback:
```typescript
// Android: Toast notification
ToastAndroid.show('Bình luận đã được đăng!', ToastAndroid.SHORT);

// iOS: Alert dialog
Alert.alert('Thành công', 'Bình luận đã được đăng!');
```

#### Error Feedback:
```typescript
// Network errors show in console + rollback UI
console.log('❌ API failed: Rolling back like for user 1', error.message);
```

## 🎨 UX Improvements

### 1. Instant Visual Feedback

#### Trước (traditional):
```
Nhấn Like → Chờ 500ms → Icon đổi màu
User thấy lag, nghĩ app không phản hồi
```

#### Sau (optimistic):
```
Nhấn Like → Icon đổi màu ngay → API call ngầm
User thấy responsive, app mượt mà
```

### 2. Professional Loading States

#### Button loading:
```typescript
// Like button: Spinner màu xanh
{isLiking ? <ActivityIndicator color="#4CAF50" /> : <Icon />}

// Comment button: Spinner trắng
{isCommenting ? <ActivityIndicator color="#fff" /> : <Text>Gửi</Text>}
```

#### Disabled states:
```typescript
style={[styles.button, isLoading && styles.buttonDisabled]}
disabled={isLoading}
```

### 3. Error Recovery

#### Rollback pattern:
```typescript
// 1. Optimistic update
setLiked(true);

// 2. API fails
catch (error) {
  // 3. Rollback to previous state
  setLiked(false);
}
```

### 4. Platform-Appropriate Feedback

#### Android: Toast notifications
- Quick, non-intrusive
- Auto-dismiss after timeout
- Good for success confirmations

#### iOS: Alert dialogs
- Modal, requires user interaction
- Better for errors or important messages
- Native iOS UX pattern

## 🧪 Testing Scenarios

### 1. Optimistic UI Success (7 lần)
```
✅ Tap like → Icon changes immediately → API succeeds → State confirmed
✅ Tap dislike → Icon changes immediately → API succeeds
✅ Tap same button → Remove reaction immediately → Confirmed
```

### 2. Optimistic UI Failure (3 lần)
```
✅ Tap like → Icon changes → API fails → Icon reverts
✅ Tap dislike → Icon changes → API fails → Icon reverts
✅ Visual feedback shows rollback working
```

### 3. Double Tap Prevention (5 lần)
```
✅ Rapid tapping during loading → Ignored
✅ Console logs show "Prevented double tap"
✅ Buttons properly disabled during submission
```

### 4. Feedback System (4 lần)
```
✅ Android: Toast shows for success
✅ iOS: Alert shows for success
✅ Network errors logged to console
✅ Form validation shows alerts
```

### 5. Comment System (3 lần)
```
✅ Valid comment → Added to UI → API success → Toast feedback
✅ Empty comment → Validation alert
✅ Failed comment → Removed from UI → Error logged
```

## 📊 Performance Benefits

### User Experience:
- **Instant feedback**: Optimistic updates feel instant
- **Reduced perceived latency**: UI responds immediately
- **Clear loading states**: Users know when actions are processing
- **Graceful error handling**: Rollbacks prevent confusion

### Network Efficiency:
- **No duplicate requests**: Double tap prevention
- **Optimistic updates**: Better perceived performance
- **Error recovery**: Failed requests don't break UI

### Code Quality:
- **Centralized state**: Store manages all mutations
- **Consistent patterns**: Same flow for all mutations
- **Proper cleanup**: Loading states always reset
- **Type safety**: TypeScript prevents runtime errors

## 🎯 Best Practices Áp dụng

### 1. Mutation Flow Pattern
```typescript
const mutationFlow = async (action: () => Promise<void>) => {
  setIsLoading(true);
  try {
    // Optimistic update
    optimisticUpdate();

    // API call
    await action();

    // Success feedback
    showSuccess();
  } catch (error) {
    // Rollback
    rollbackUpdate();

    // Error feedback
    showError(error);
  } finally {
    setIsLoading(false);
  }
};
```

### 2. Optimistic UI Strategy
```typescript
// Decide what to optimistic update based on action type
const getOptimisticUpdate = (actionType: string) => {
  switch (actionType) {
    case 'like': return { liked: true };
    case 'comment': return { comments: [...prevComments, newComment] };
    default: return {};
  }
};

// Apply rollback based on action type
const getRollbackUpdate = (actionType: string) => {
  switch (actionType) {
    case 'like': return { liked: false };
    case 'comment': return { comments: prevComments };
    default: return {};
  }
};
```

### 3. Platform Feedback
```typescript
const showFeedback = (type: 'success' | 'error', message: string) => {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, type === 'error' ? ToastAndroid.LONG : ToastAndroid.SHORT);
  } else {
    Alert.alert(
      type === 'error' ? 'Lỗi' : 'Thành công',
      message,
      [{ text: 'OK' }]
    );
  }
};
```

### 4. Loading State Management
```typescript
// Use object for multiple loading states
const [loadingStates, setLoadingStates] = useState({
  liking: false,
  commenting: false,
  favoriting: false,
});

// Update specific loading state
setLoadingStates(prev => ({ ...prev, liking: true }));

// Check if any action is loading
const isAnyLoading = Object.values(loadingStates).some(Boolean);
```

## 🏆 Kết luận

Day 6 đã implement thành công mutation patterns professional:

- ✅ **Mutation flow**: isSubmitting states, proper loading management
- ✅ **Optimistic UI**: Instant updates với rollback on failure
- ✅ **Double tap prevention**: State-based locking mechanism
- ✅ **Feedback system**: Platform-specific Toast/Alert
- ✅ **Mock API**: 30% fail simulation cho testing
- ✅ **Console logs**: Debug mọi bước của mutation lifecycle

App giờ có interaction patterns "production-ready" với smooth UX, proper error handling, và instant visual feedback! 🚀
