# IOT

## Giới thiệu Dự án

### Giới thiệu
Dự án này tập trung vào việc tạo ra một hệ thống dựa trên IoT để giám sát và báo cáo. Mục tiêu chính là phát triển một giải pháp đáng tin cậy và hiệu quả cho việc thu thập và phân tích dữ liệu theo thời gian thực.

### Tính năng
- **Giám sát thời gian thực**: Liên tục theo dõi và báo cáo dữ liệu từ các cảm biến khác nhau.
- **Phân tích dữ liệu**: Xử lý và phân tích dữ liệu thu thập được để cung cấp những thông tin có ý nghĩa.
- **Cảnh báo và Thông báo**: Gửi cảnh báo dựa trên các điều kiện hoặc ngưỡng được định trước.
- **Giao diện người dùng**: Bảng điều khiển dựa trên web để trực quan hóa dữ liệu và quản lý hệ thống.

### Công nghệ sử dụng
- **Phần cứng**: Các cảm biến IoT ESP8266, Cảm biến nhiệt độ DHT11, cảm biến ánh sáng
- **Phần mềm**: 
    - Ngôn ngữ lập trình: Python, C++
    - Frameworks: Notejs
    - Cơ sở dữ liệu: MongoDB
    - Giao thức truyền thông: MQTT để truyền dữ liệu

### Hướng dẫn cài đặt
1. **Clone Repository**: `git clone https://github.com/tmanh/IOT-ptit.git`
2. **Cài đặt các phụ thuộc**: Điều hướng đến thư mục dự án và chạy `pip install -r requirements.txt`
3. **Cấu hình cảm biến**: Kết nối và cấu hình các cảm biến IoT theo tài liệu.
4. **Chạy ứng dụng**: Thực thi `npm start` để khởi động máy chủ.

### Sử dụng
- Truy cập bảng điều khiển web tại `http://localhost:5000` để giám sát dữ liệu và quản lý cài đặt.
- Cấu hình ngưỡng cảnh báo và cài đặt thông báo thông qua bảng điều khiển.

### Đóng góp
- Fork repository và tạo một nhánh mới cho tính năng hoặc sửa lỗi của bạn.
- Gửi pull request với mô tả chi tiết về các thay đổi của bạn.

### Giấy phép
Dự án này được cấp phép theo Giấy phép MIT. Xem tệp `LICENSE` để biết thêm chi tiết.

### Liên hệ
Để có bất kỳ câu hỏi hoặc hỗ trợ nào, vui lòng liên hệ [email của bạn].