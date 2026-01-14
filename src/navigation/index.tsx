import { createStaticNavigation, StaticParamList } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import Home from '@screens/Home';
import List from '@screens/List';
import Detail from '@screens/Detail';
import { BackButton } from '@components/BackButton';

// User type for API response
export type User = {
  id: number;
  gender: string;
  date_of_birth: string;
  job: string;
  city: string;
  zipcode: string;
  latitude: number;
  profile_picture: string;
  first_name: string;
  email: string;
  last_name: string;
  phone: string;
  street: string;
  state: string;
  country: string;
  longitude: number;
};

// Legacy Item type (keeping for compatibility)
export type Item = {
  id: number;
  title: string;
  subtitle: string;
  image: any;
};

// Tab Navigator
const TabNavigator = createBottomTabNavigator({
  screens: {
    HomeTab: {
      screen: Home,
      options: {
        title: 'HomeTab',
        tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
      },
    },
    ListTab: {
      screen: List,
      options: {
        title: 'Danh sách Người dùng',
        tabBarIcon: ({ color, size }) => (
          <Ionicons name="people-outline" size={size} color={color} />
        ),
      },
    },
  },
});

// Root Stack Navigator (Tab + Detail)
const RootStack = createNativeStackNavigator({
  screens: {
    MainTabs: {
      screen: TabNavigator,
      options: {
        headerShown: false,
      },
    },
    Detail: {
      screen: Detail,
      options: ({ navigation }) => ({
        title: 'Chi Tiết Người dùng',
        headerLeft: () => <BackButton onPress={navigation.goBack} />,
      }),
    },
  },
});

// Type definitions
export type RootStackParamList = {
  MainTabs: undefined;
  Detail: { item: Item } | { user: User };
};

type RootNavigatorParamList = StaticParamList<typeof RootStack>;

declare global {
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface RootParamList extends RootNavigatorParamList {}
  }
}

const Navigation = createStaticNavigation(RootStack);
export default Navigation;
