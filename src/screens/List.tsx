import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useState, useMemo } from 'react';
import {
  AppState,
  StyleSheet,
  View,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from 'react-native';
import { User, RootStackParamList } from '@navigation/index';
import { StackNavigationProp } from '@react-navigation/stack';
import { useUsersStore } from '@store/store';
import { ErrorView } from '@components/ErrorView';
import { EmptyView } from '@components/EmptyView';
import { UserCard } from '@components/UserCard';
import { UserSkeleton } from '@components/UserSkeleton';
import { SearchBar } from '@components/SearchBar';
import { FilterChip } from '@components/FilterChip';

export default function List() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { users, loading, refreshing, error, fetchUsers, refreshUsers, startPolling, stopPolling } =
    useUsersStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'All' | 'Fav' | 'Recent'>('All');

  const filteredUsers = useMemo(() => {
    let filtered = users;
    console.log(`📋 List: Starting filter with ${users.length} total users`);

    // Apply search filter
    if (searchQuery) {
      const beforeSearch = filtered.length;
      filtered = filtered.filter(user =>
        `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.job.toLowerCase().includes(searchQuery.toLowerCase())
      );
      console.log(`📋 List: Search "${searchQuery}" filtered ${beforeSearch} -> ${filtered.length} users`);
    }

    // Apply chip filter
    if (activeFilter === 'Fav') {
      const beforeFav = filtered.length;
      filtered = filtered.filter(user => user.job.includes('Engineer'));
      console.log(`📋 List: Fav filter applied: ${beforeFav} -> ${filtered.length} users (Engineers only)`);
    } else if (activeFilter === 'Recent') {
      const beforeRecent = filtered.length;
      filtered = filtered.slice(0, 5);
      console.log(`📋 List: Recent filter applied: ${beforeRecent} -> ${filtered.length} users (first 5)`);
    } else {
      console.log(`📋 List: All filter applied: ${filtered.length} users`);
    }

    console.log(`📋 List: Final filtered result: ${filtered.length} users`);
    return filtered;
  }, [users, searchQuery, activeFilter]);

  const handleUserPress = useCallback((userId: number) => {
    console.log(`👆 Selected user: ID=${userId}`);
    navigation.navigate('Detail', { userId });
  }, [navigation]);

  const handleSearch = useCallback((query: string) => {
    console.log(`📋 List: Search triggered with query "${query}"`);
    setSearchQuery(query);
  }, []);

  // Focus effect: fetch when screen becomes focused, start polling
  useFocusEffect(
    useCallback(() => {
      console.log('📱 List screen focused - fetching users and starting polling');
      const controller = new AbortController();
      fetchUsers(controller.signal);
      startPolling();

      return () => {
        console.log('📱 List screen blurred - stopping polling and cancelling requests');
        stopPolling();
      };
    }, [fetchUsers, startPolling, stopPolling])
  );

  // App state effect: handle background/foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'background') {
        console.log('📱 App went to background - stopping polling to save battery');
        stopPolling();
      } else if (nextAppState === 'active') {
        // Only resume polling if screen is still focused
        if (navigation.isFocused()) {
          console.log('📱 App came to foreground - resuming polling');
          startPolling();
        } else {
          console.log('📱 App foreground but screen not focused - not starting polling');
        }
      }
    });

    return () => {
      console.log('🧹 Cleaning up AppState listener');
      subscription.remove();
    };
  }, [navigation, startPolling, stopPolling]);

  const renderItem = useCallback(({ item }: { item: User }) => (
    <UserCard
      user={item}
      onPress={handleUserPress}
    />
  ), [handleUserPress]);

  if (loading) {
    return (
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.loadingContainer}>
          {Array.from({ length: 5 }).map((_, index) => (
            <UserSkeleton key={index} />
          ))}
        </View>
      </KeyboardAvoidingView>
    );
  }

  if (error) {
    return <ErrorView message={error} onRetry={fetchUsers} />;
  }

  if (users.length === 0) {
    return <EmptyView message="Không có người dùng nào" error={error || undefined} />;
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <SearchBar
        placeholder="Tìm kiếm người dùng"
        onSearch={handleSearch}
      />
      <View style={styles.filterContainer}>
        <FilterChip
          label="All"
          isActive={activeFilter === 'All'}
          onPress={() => {
            console.log('🏷️ FilterChip: All pressed');
            setActiveFilter('All');
          }}
        />
        <FilterChip
          label="Fav"
          isActive={activeFilter === 'Fav'}
          onPress={() => {
            console.log('🏷️ FilterChip: Fav pressed');
            setActiveFilter('Fav');
          }}
        />
        <FilterChip
          label="Recent"
          isActive={activeFilter === 'Recent'}
          onPress={() => {
            console.log('🏷️ FilterChip: Recent pressed');
            setActiveFilter('Recent');
          }}
        />
      </View>
      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshUsers}
            colors={['#2196F3']}
            tintColor="#2196F3"
          />
        }
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
});
