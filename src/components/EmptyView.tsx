import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface EmptyViewProps {
  message?: string;
  error?: Error | string;
}

export function EmptyView({ message = 'Không có dữ liệu', error }: EmptyViewProps) {
  useEffect(() => {
    if (error) {
      console.log('API Error:', error);
    }
  }, [error]);

  return (
    <View style={styles.container}>
      <Ionicons name="document-outline" size={64} color="#ccc" />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 24,
  },
});
