# Kịch bản kiểm thử indexing MySQL vs MongoDB

## Mục tiêu

Kiểm thử bằng dữ liệu thực nghiệm nhỏ để quan sát cách MySQL và MongoDB sử dụng index trong từng tình huống.

## Kịch bản 1: Index mặc định

- MySQL: truy vấn `products.product_id`.
- MongoDB: truy vấn `products._id`.
- Kỳ vọng: cả hai đều dùng index mặc định.

## Kịch bản 2: Secondary index / Field index

- Trước khi tạo index: truy vấn theo `sku` có xu hướng quét nhiều dữ liệu.
- Sau khi tạo index: truy vấn theo `sku` phải giảm số dòng/document phải đọc.

## Kịch bản 3: Composite index / Compound index

- Index: `(category_id, price)` trong MySQL và `{categoryId: 1, price: 1}` trong MongoDB.
- Query tốt: lọc theo `category_id/categoryId` và khoảng `price`.
- Query kém hơn: chỉ lọc theo `price` vì không dùng field đầu tiên của index.

## Kịch bản 4: Covering index / Covered query

- MySQL: index `(sku, name)`, query chỉ select `sku, name`.
- MongoDB: index `{sku: 1, name: 1}`, projection `{_id: 0, sku: 1, name: 1}`.
- Kỳ vọng: giảm hoặc tránh truy cập lại dữ liệu gốc.

## Kịch bản 5: Partial index

- MongoDB: tạo partial index cho đơn hàng `ACTIVE`.
- MySQL: mô phỏng bằng functional index.
- Kỳ vọng: MongoDB thể hiện partial index tự nhiên hơn. MySQL cần viết query khớp expression để dùng index.

## Kịch bản 6: JOIN và `$lookup`

- MySQL: join `users` và `orders` theo `user_id`.
- MongoDB: `$lookup` giữa `users` và `orders`.
- Kỳ vọng: MySQL phù hợp hơn với dữ liệu quan hệ chuẩn hóa.

## Kịch bản 7: Array / Multikey

- MySQL: dùng bảng phụ `product_tags`.
- MongoDB: field `tags` là array và dùng multikey index.
- Kỳ vọng: MongoDB tự nhiên hơn khi index field mảng.

## Kịch bản 8: Text index

- MySQL: `FULLTEXT INDEX`.
- MongoDB: `text index`.
- Kỳ vọng: cả hai hỗ trợ tìm kiếm văn bản cơ bản.

## Kịch bản 9: Spatial / Geospatial index

- MySQL: `SPATIAL INDEX` trên `POINT`.
- MongoDB: `2dsphere` trên GeoJSON.
- Kỳ vọng: MongoDB thuận tiện khi lưu vị trí trong document.

## Kịch bản 10: Chi phí ghi dữ liệu

- Tạo một bảng/collection ít index.
- Tạo một bảng/collection nhiều index.
- Insert cùng số lượng dữ liệu.
- Kỳ vọng: bảng/collection có nhiều index thường insert chậm hơn.
