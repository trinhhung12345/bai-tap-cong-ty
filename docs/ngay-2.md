# Ngày 2 — Navigation + TypeScript params

## Tổng quan dự án
Dự án này xây dựng hệ thống navigation hoàn chỉnh cho ứng dụng React Native, sử dụng React Navigation v6 với TypeScript. Ứng dụng triển khai nested navigation pattern phổ biến: Bottom Tab Navigator cho các màn hình chính (Home/List) kết hợp với Stack Navigator để điều hướng chi tiết (Detail). Điều này cho phép người dùng chuyển đổi giữa tabs chính và drill down vào chi tiết mà không mất trạng thái tab.

**Cấu trúc navigation**:
- **Bottom Tab Navigator**: Chứa Home và List tabs, với icons và labels.
- **Stack Navigator**: Bao ngoài tabs, cho phép push Detail screen với params.
- **TypeScript Integration**: Đầy đủ type safety cho navigation params và hooks.

**Cơ chế hoạt động**:
- Navigation flow: Home ↔ List (tabs) → Detail (stack push).
- Params passing: Truyền object `item` từ List đến Detail qua navigation params.
- Back navigation: Custom back button trong Detail header.
- Type safety: RootStackParamList định nghĩa types cho tất cả params.

## Mục tiêu
Đi từ Home → List → Detail, truyền id chuẩn TypeScript.

## Kiến thức phải nắm

### 1. Stack navigation
Stack navigation quản lý navigation dạng stack (ngăn xếp), nơi screens được push/pop theo thứ tự LIFO (Last In, First Out).

**Các operations cơ bản**:
- **push**: Thêm screen mới lên đỉnh stack (Detail từ List).
- **pop**: Xóa screen trên đỉnh stack (quay lại List từ Detail).
- **popToTop**: Pop về screen đầu tiên trong stack.
- **replace**: Thay thế screen hiện tại (không thêm vào stack).

**Back navigation**:
- Hardware back button (Android).
- Swipe back gesture (iOS).
- Header back button.

Ví dụ từ project (List.tsx):
```
const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

<TouchableOpacity onPress={() => navigation.navigate('Detail', { item })}>
    {/* Item content */}
</TouchableOpacity>
```
Ở đây, `navigation.navigate('Detail', { item })` push Detail screen với params lên stack.

Custom back button trong navigation/index.tsx:
```
Detail: {
    screen: Detail,
    options: ({ navigation }) => ({
        title: 'Chi Tiết Sản Phẩm',
        headerLeft: () => <BackButton onPress={navigation.goBack} />,
    }),
}
```
`navigation.goBack()` pop screen hiện tại khỏi stack.

### 2. Typed params
React Navigation với TypeScript cho phép type-safe navigation, tránh runtime errors từ params sai type.

**RootStackParamList**: Type định nghĩa params cho mỗi screen.
```
export type RootStackParamList = {
    MainTabs: undefined;  // Không có params
    Detail: { item: Item };  // Có params item
};
```

**Typed hooks**:
- **useNavigation**: Hook để navigate, typed với param list.
- **useRoute**: Hook để access params hiện tại, typed với route name.

Ví dụ typed navigation (List.tsx):
```
const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
```
`StackNavigationProp<RootStackParamList>` đảm bảo chỉ navigate đến screens có trong RootStackParamList.

Ví dụ typed route (Detail.tsx):
```
type DetailScreenRouteProp = RouteProp<RootStackParamList, 'Detail'>;

const route = useRoute<DetailScreenRouteProp>();
const { item } = route.params;  // Type-safe access
```
`RouteProp<RootStackParamList, 'Detail'>` đảm bảo params có type `{ item: Item }`.

**Lợi ích TypeScript**:
- Autocomplete cho screen names và params.
- Compile-time error nếu sai type.
- IntelliSense cho navigation methods.

**Cơ chế truyền params chi tiết**:
Khi user bấm vào một item trong list, thông tin của item đó được truyền sang Detail screen thông qua navigation params.

**Ví dụ thực tế**:
Giả sử trong danh sách sản phẩm, có một item với:
- Ảnh: `test.png`
- Tên: `Sản phẩm 1`
- Subtitle: `Mô tả sản phẩm 1`

Khi user bấm vào item này trong List.tsx:
```
const renderItem = ({ item }: { item: Item }) => (
    <TouchableOpacity onPress={() => navigation.navigate('Detail', { item })}>
        <Image source={item.image} />  // Hiển thị test.png
        <Text>{item.title}</Text>  // Hiển thị "Sản phẩm 1"
    </TouchableOpacity>
);
```

Object `item` (chứa image, title, subtitle) được truyền vào `navigation.navigate('Detail', { item })`.

Trong Detail.tsx, screen nhận params:
```
const route = useRoute<DetailScreenRouteProp>();
const { item } = route.params;  // item = {image: test.png, title: "Sản phẩm 1", ...}
```

Detail screen render thông tin từ `item`:
```
<Image source={item.image} />  // Hiển thị test.png
<Text>{item.title}</Text>      // Hiển thị "Sản phẩm 1"
<Text>{item.subtitle}</Text>   // Hiển thị mô tả
```

**Quy trình data flow**:
1. Mock data tạo array các item objects
2. FlatList render từng item với TouchableOpacity
3. onPress: navigate('Detail', {item: selectedItem})
4. Detail screen: route.params.item chứa đầy đủ thông tin
5. Render UI từ item data

Điều này đảm bảo mỗi Detail screen hiển thị đúng thông tin của item được chọn, không phải data tĩnh.

### 3. Nested navigation
Nested navigation kết hợp nhiều navigator types để tạo UX phức tạp. Pattern phổ biến nhất: Tab Navigator (main sections) + Stack Navigator (detail flows).

**Cách hoạt động**:
- **Tab Navigator**: Bottom tabs cho main sections (Home, List).
- **Stack Navigator**: Wrap tabs, cho phép push detail screens.
- **Header management**: Tab screens thường ẩn header (`headerShown: false`), detail screens có header với back button.

Cấu trúc trong project (navigation/index.tsx):
```
// Tab Navigator cho main tabs
const TabNavigator = createBottomTabNavigator({
    screens: {
        HomeTab: { screen: Home, options: { /* tab options */ } },
        ListTab: { screen: List, options: { /* tab options */ } },
    },
});

// Root Stack chứa tabs + detail
const RootStack = createNativeStackNavigator({
    screens: {
        MainTabs: {
            screen: TabNavigator,
            options: { headerShown: false },  // Ẩn header cho tabs
        },
        Detail: {
            screen: Detail,
            options: { /* header với back button */ },
        },
    },
});
```

**Flow navigation**:
- Trong tabs: Switch giữa Home/List (không push/pop).
- Từ List: Push Detail lên stack.
- Từ Detail: Pop về List (tab vẫn active).

**Ưu điểm**:
- Giữ tab state khi navigate detail.
- Consistent back behavior.
- Scalable cho apps phức tạp.

## Từ khóa search (đúng thứ tự)
- React Navigation native stack TypeScript RootStackParamList
- React Navigation passing params TypeScript useRoute
- React Navigation bottom tabs nested stack
- React Navigation header options
- (VN) React Navigation truyền params typescript, tab + stack lồng nhau

## Checklist code
- [x] Cài React Navigation + Native Stack (đã có trong package.json)
- [x] Type params: Detail: { item: Item } (đã implement trong navigation/index.tsx)
- [x] Bấm item list → navigate Detail (đã có trong List.tsx)

## Bài tập
- Thêm Tab (Home, List) - đã có Bottom Tab Navigator
- Trong List vẫn mở Detail bằng Stack (Tab + Stack) - đã implement nested navigation
