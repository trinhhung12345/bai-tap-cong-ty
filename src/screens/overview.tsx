import { useNavigation } from '@react-navigation/native';
import { ScreenContent } from '@components/ScreenContent';

import { StyleSheet, View } from 'react-native';

import { Button } from '@components/Button';
import { Item, RootStackParamList } from '@navigation/index';
import { StackNavigationProp } from '@react-navigation/stack';

export default function Overview() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  const sampleItem: Item = {
    id: 1,
    title: 'Sample Item',
    subtitle: 'This is a sample item for testing',
    image: require('@assets/icon.png'),
  };

  return (
    <View style={styles.container}>
      <ScreenContent path="screens/overview.tsx" title="Overview"></ScreenContent>
      <Button
        onPress={() =>
          navigation.navigate('Detail', {
            item: sampleItem,
          })
        }
        title="Show Details"
      />
    </View>
  );
}

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
});
