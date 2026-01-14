# Ngày 1 — UI nền tảng + Layout chuẩn RN

## Tổng quan dự án
Dự án này là một ứng dụng React Native cơ bản được xây dựng với Expo, minh họa các khái niệm UI nền tảng và navigation. Ứng dụng bao gồm 3 màn hình chính:
- **Home**: Màn hình đơn giản hiển thị văn bản ở giữa, minh họa layout căn giữa cơ bản.
- **List**: Màn hình danh sách sản phẩm sử dụng FlatList để render 30 item mock, với chức năng tìm kiếm (UI) và navigation đến Detail.
- **Detail**: Màn hình chi tiết sản phẩm, hiển thị thông tin của item được chọn từ List.

**Cấu trúc dự án**:
- Sử dụng React Navigation v6+ với Bottom Tab Navigator cho Home/List và Stack Navigator cho Detail.
- Component Card được tạo nhưng chưa được sử dụng đầy đủ trong screens (screens tự implement card inline).
- Tech stack: TypeScript, Expo SDK, React Navigation, Expo Vector Icons.

**Cơ chế hoạt động**:
- Navigation: Bottom tabs cho Home và List, stack để push Detail với params (item object).
- Data flow: Mock data trong List.tsx, truyền item qua navigation params đến Detail.
- Performance: FlatList với virtualization cho danh sách lớn, StyleSheet.create để tối ưu styles.

## Mục tiêu
Dựng khung UI 3 màn (Home/List/Detail) + hiểu Flexbox + dùng FlatList đúng chỗ + cơ bản về Navigation.

## Kiến thức phải nắm

### 1. Primitive UI
Các component cơ bản trong React Native cung cấp nền tảng cho việc xây dựng giao diện:

- **View**: Container cơ bản để nhóm các component khác, tương tự như `<div>` trong HTML. Nó không hiển thị gì trực quan nhưng dùng để layout và styling. View có thể chứa các View con và hỗ trợ tất cả props styling như backgroundColor, borderRadius, shadow, etc. Trong code, toàn bộ layout đều dựa trên View.

- **Text**: Component duy nhất để hiển thị text. Tất cả text phải được wrap trong Text component. Text hỗ trợ styling như fontSize, fontWeight, color, textAlign. Không thể đặt text trực tiếp trong View mà không có Text.

- **Image**: Hiển thị ảnh từ local (require) hoặc URL (uri). Sử dụng source prop: `source={require('@assets/icon.png')}` hoặc `source={{uri: 'https://example.com/image.jpg'}}`. Hỗ trợ resizeMode (cover, contain, stretch, center), width/height, borderRadius.

- **Pressable**: Thay thế TouchableOpacity (deprecated), dùng cho các element có thể nhấn. Hỗ trợ onPress, onLongPress, onPressIn, onPressOut. Pressable cho phép custom press feedback và accessibility tốt hơn. Trong List.tsx, mỗi card item là Pressable để navigate đến Detail.

- **TextInput**: Cho phép nhập text. Props quan trọng: placeholder, value, onChangeText (callback khi text thay đổi), secureTextEntry (cho password), keyboardType (numeric, email, etc.), autoCapitalize. Trong List.tsx, search box là TextInput nhưng chưa có logic tìm kiếm.

**Khi nào dùng ScrollView vs FlatList**:
- **ScrollView**: Dùng cho danh sách nhỏ, ít item (dưới 20-30) hoặc content tĩnh không thay đổi. Nó render tất cả item cùng lúc, không có virtualization, phù hợp cho forms, settings, hoặc content dài nhưng ít dynamic.
- **FlatList**: Dùng cho danh sách lớn (>30 item) hoặc dynamic. Có virtualization tự động: chỉ render item hiển thị trên màn hình + buffer, cải thiện performance đáng kể trên mobile. Hỗ trợ pagination, pull-to-refresh, infinite scroll. Luôn dùng FlatList cho data từ API.

Ví dụ từ code hiện tại (List.tsx):
```
<FlatList
    data={mockData}  // Array 30 items mock
    keyExtractor={(item) => item.id.toString()}  // Unique key cho mỗi item
    renderItem={renderItem}  // Function render từng item
    contentContainerStyle={styles.listContainer}  // Style cho container của list
/>
```
Ở đây, renderItem trả về TouchableOpacity với Image, Text cho title/subtitle, và action buttons.

### 2. Flexbox RN
React Native sử dụng Flexbox cho layout, tương tự CSS Flexbox nhưng có một số khác biệt (không có float, inline-block). Tất cả layout trong RN đều dựa trên Flexbox.

- **flexDirection**: Hướng chính của container (row/column). Mặc định column (dọc). Row để layout ngang.
- **justifyContent**: Căn theo hướng chính (flex-start: đầu, center: giữa, flex-end: cuối, space-between: cách đều, space-around: cách đều bao gồm đầu/cuối, space-evenly: cách đều tuyệt đối).
- **alignItems**: Căn theo hướng phụ (flex-start, center, flex-end, stretch: kéo dài, baseline: căn theo baseline text).
- **flex**: Tỷ lệ chiếm không gian (số >0). Item có flex cao hơn chiếm nhiều chỗ hơn. flex: 1 = chiếm hết không gian còn lại.
- **alignSelf**: Override alignItems cho item cụ thể.
- **flexWrap**: Cho phép wrap xuống dòng (wrap/no-wrap).

**"Container full màn": flex: 1 + padding**: Container mẹ có flex: 1 để chiếm toàn bộ màn hình, padding để tránh viền device. Ví dụ:
```
const styles = StyleSheet.create({
    container: {
        flex: 1,        // Chiếm toàn bộ không gian cha
        padding: 16,    // Padding để tránh viền
        backgroundColor: '#fff',
    },
});
```

Ví dụ từ Home.tsx (căn giữa):
```
const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',  // Căn giữa theo chiều dọc (hướng chính)
        alignItems: 'center',      // Căn giữa theo chiều ngang (hướng phụ)
        backgroundColor: '#fff',
    },
});
```
Ở đây, container chiếm full màn, justifyContent: 'center' căn Text ở giữa dọc, alignItems: 'center' căn giữa ngang.

Ví dụ từ List.tsx (card layout):
```
card: {
    alignItems: 'center',  // Căn giữa tất cả content trong card theo ngang
    // ... shadow styles
},
cardTitle: {
    textAlign: 'center',  // Căn giữa text trong title
    // ...
}
```

### 3. Style
Styling trong RN dùng StyleSheet hoặc inline styles (không khuyến khích).

- **StyleSheet.create**: Tạo styles object để tối ưu performance. Styles được parse 1 lần khi app load, không re-create mỗi render. Tất cả styles trong project đều dùng StyleSheet.create.

- **Spacing**: Dùng margin/padding để tạo khoảng cách:
  - margin: all sides
  - marginHorizontal: left/right
  - marginVertical: top/bottom
  - padding tương tự

- **Colors**: Dùng hex (#fff), rgb, rgba, named colors.
- **Fonts**: fontSize, fontWeight ('bold', 'normal'), fontFamily (custom fonts cần link).
- **Dimensions**: width, height, minWidth, maxHeight.
- **borderRadius**: Bo góc cho View/Image.

**Shadow iOS/Android**:
- iOS: shadowColor, shadowOffset (width/height), shadowOpacity (0-1), shadowRadius (blur).
- Android: elevation (số, cao hơn = bóng đậm hơn, không cần shadowColor).
- Cả hai platform dùng chung shadow props, RN tự convert.

Ví dụ shadow từ List.tsx:
```
card: {
    shadowColor: '#000',        // Màu bóng (iOS)
    shadowOffset: { width: 0, height: 2 },  // Offset bóng
    shadowOpacity: 0.1,         // Độ trong suốt bóng
    shadowRadius: 4,            // Blur radius
    elevation: 3,               // Android elevation
}
```
Ví dụ từ Detail.tsx có shadow tương tự nhưng elevation: 4 cao hơn.

**Responsive**: Dùng Dimensions API hoặc percentage/flex để responsive. Tránh hardcode pixel.

### 4. Safe area
Tránh notch (iPhone X+), status bar, home indicator.

Dùng **SafeAreaView** từ react-native-safe-area-context (thư viện riêng, không built-in trong RN core).

Wrap toàn app hoặc màn hình trong SafeAreaProvider + SafeAreaView để padding tự động theo device.

Ví dụ:
```
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

export default function App() {
    return (
        <SafeAreaProvider>
            <SafeAreaView style={{ flex: 1 }}>
                {/* Your content */}
            </SafeAreaView>
        </SafeAreaProvider>
    );
}
```
Trong project hiện tại, chưa dùng SafeAreaView (có thể gây vấn đề trên iPhone X+). Có thể wrap Navigation hoặc từng screen.



## Từ khóa search (đúng thứ tự)
- React Native Flexbox layout justifyContent alignItems flexDirection
- React Native StyleSheet.create best practices
- React Native shadow elevation iOS Android
- react-native-safe-area-context SafeAreaView
- React Native FlatList vs ScrollView when to use
- (VN) React Native flexbox căn giữa, FlatList vs ScrollView

## Checklist code
- [x] Tạo src/screens/Home.tsx, List.tsx, Detail.tsx
- [x] Tạo component Card (title/subtitle) - chưa dùng trong screens
- [x] List render 30 item mock bằng FlatList
- [x] Navigation giữa screens với params
- [x] UI search box trong List (chưa logic)

## Bài tập
- Làm UI list item: avatar + title + subtitle + icon mũi tên (đã có trong List.tsx với Image + Text + TouchableOpacity)
- Thêm search box UI (chưa cần chạy logic) - đã có TextInput trong List.tsx
- Cải thiện: Dùng SafeAreaView cho toàn app, tích hợp component Card vào List/Detail, thêm logic search cơ bản
