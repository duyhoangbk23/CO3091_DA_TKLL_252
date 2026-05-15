# Indexing Lab: MySQL vs MongoDB

Bộ file này dựng sẵn hai database bằng Docker để kiểm thử các tiêu chí so sánh indexing giữa MySQL và MongoDB.

## 1. Thành phần

```text
indexing-lab/
├─ docker-compose.yml
├─ mysql/
│  ├─ init/01_schema_and_seed.sql
│  └─ tests/all_tests.sql
├─ mongo/
│  ├─ init/01_seed.js
│  └─ tests/all_tests.js
├─ scripts/
│  ├─ run-all.sh
│  └─ run-all.ps1
└─ README.md
```

## 2. Dataset được tạo

| Nhóm dữ liệu | MySQL | MongoDB | Mục đích |
|---|---:|---:|---|
| `products` | 20.000 dòng | 20.000 document | Test primary/_id, secondary/field, composite/compound, covering/covered, text index |
| `users` | 5.000 dòng | 5.000 document | Test truy vấn theo email và join/lookup |
| `orders` | 50.000 dòng | 50.000 document | Test join/lookup, partial index, write cost |
| `product_tags` / `tags` | Bảng phụ | Array field | So sánh dữ liệu mảng và multikey index |
| `stores` | 1.000 dòng | 1.000 document | Test spatial/geospatial index |

## 3. Cách chạy nhanh

### Cách 1: Git Bash / WSL / Linux / macOS

```bash
cd indexing-lab
chmod +x scripts/run-all.sh
./scripts/run-all.sh
```

### Cách 2: Windows PowerShell

```powershell
cd indexing-lab
powershell -ExecutionPolicy Bypass -File .\scripts\run-all.ps1
```

Kết quả sẽ được lưu tại:

```text
mysql_result.txt
mongo_result.txt
```

## 4. Reset database để chạy lại từ đầu

Docker chỉ chạy file trong `init/` khi volume rỗng. Nếu muốn tạo lại dữ liệu từ đầu:

```bash
docker compose down -v
docker compose up -d
```

Sau đó chạy lại script test.

## 5. Chạy riêng MySQL

### Git Bash / WSL

```bash
docker compose up -d mysql
docker compose exec -T mysql mysql -uroot -proot indexing_lab < mysql/tests/all_tests.sql
```

### PowerShell

```powershell
Get-Content .\mysql\tests\all_tests.sql | docker compose exec -T mysql mysql -uroot -proot indexing_lab
```

## 6. Chạy riêng MongoDB

```bash
docker compose up -d mongo
docker compose exec -T mongo mongosh --quiet -u root -p root --authenticationDatabase admin /tests/all_tests.js
```

## 7. Các kịch bản test chính

| STT | Tiêu chí | MySQL | MongoDB | Cách đọc kết quả |
|---:|---|---|---|---|
| 1 | Index mặc định | `PRIMARY KEY` trên `product_id` | `_id` index | MySQL dùng primary/clustered index, MongoDB dùng `_id_` |
| 2 | Secondary index / field index | `idx_products_sku` | `idx_products_sku` | So sánh trước và sau khi tạo index |
| 3 | Composite / compound index | `(category_id, price)` | `{categoryId: 1, price: 1}` | Query có leftmost field tốt hơn query chỉ lọc `price` |
| 4 | Covering / covered query | `(sku, name)` | `{sku: 1, name: 1}` + projection bỏ `_id` | MongoDB lý tưởng có `totalDocsExamined = 0`; MySQL giảm đọc lại bảng |
| 5 | Partial index | Mô phỏng bằng functional index | `partialFilterExpression` | MongoDB tự nhiên hơn; MySQL phải viết query theo expression mới dễ dùng index |
| 6 | JOIN / `$lookup` | `JOIN users - orders` | `$lookup users - orders` | MySQL là hướng tự nhiên hơn cho quan hệ |
| 7 | Array / multikey | Bảng phụ `product_tags` | Array `tags` + multikey index | MongoDB index trực tiếp trên array field |
| 8 | Text index | `FULLTEXT` | `text index` | Cả hai đều có specialized index cho tìm kiếm văn bản |
| 9 | Spatial / geospatial | `SPATIAL INDEX` | `2dsphere` | MongoDB dùng GeoJSON document khá tự nhiên |
| 10 | Chi phí ghi | Bảng ít index vs nhiều index | Collection ít index vs nhiều index | Nhiều index thường làm insert chậm hơn |


## 8. Lưu ý

- Mục tiêu chính là kiểm chứng query plan.
- Nếu chạy lại nhiều lần, index cũ có thể còn trong database. Script test đã cố gắng drop các index phụ trước khi chạy.
