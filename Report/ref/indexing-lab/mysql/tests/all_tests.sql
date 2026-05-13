USE indexing_lab;

SET SESSION cte_max_recursion_depth = 100000;

DELIMITER //
DROP PROCEDURE IF EXISTS drop_index_if_exists//
CREATE PROCEDURE drop_index_if_exists(IN p_table VARCHAR(64), IN p_index VARCHAR(64))
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.statistics
        WHERE table_schema = DATABASE()
          AND table_name = p_table
          AND index_name = p_index
    ) THEN
        SET @sql = CONCAT('DROP INDEX `', p_index, '` ON `', p_table, '`');
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END//
DELIMITER ;

CALL drop_index_if_exists('products', 'idx_products_sku');
CALL drop_index_if_exists('products', 'idx_products_category_price');
CALL drop_index_if_exists('products', 'idx_products_sku_name');
CALL drop_index_if_exists('products', 'idx_products_text');
CALL drop_index_if_exists('orders', 'idx_orders_user_id');
CALL drop_index_if_exists('orders', 'idx_orders_active_user_expr');
CALL drop_index_if_exists('users', 'idx_users_email');
CALL drop_index_if_exists('product_tags', 'idx_product_tags_tag_product');

SELECT 'DATASET SIZE' AS section;
SELECT
    (SELECT COUNT(*) FROM products) AS products,
    (SELECT COUNT(*) FROM users) AS users,
    (SELECT COUNT(*) FROM orders) AS orders,
    (SELECT COUNT(*) FROM product_tags) AS product_tags,
    (SELECT COUNT(*) FROM stores) AS stores;

SELECT '1. DEFAULT INDEX: PRIMARY KEY / CLUSTERED INDEX IN INNODB' AS section;
EXPLAIN ANALYZE
SELECT *
FROM products
WHERE product_id = 123;

SELECT '2A. SECONDARY INDEX - BEFORE creating index on sku, likely table scan' AS section;
EXPLAIN ANALYZE
SELECT *
FROM products
WHERE sku = 'SKU000123';

SELECT '2B. SECONDARY INDEX - AFTER creating index on sku' AS section;
CREATE INDEX idx_products_sku ON products(sku);
EXPLAIN ANALYZE
SELECT *
FROM products
WHERE sku = 'SKU000123';

SELECT '3A. COMPOSITE INDEX (category_id, price) - query matches leftmost prefix' AS section;
CREATE INDEX idx_products_category_price ON products(category_id, price);
EXPLAIN ANALYZE
SELECT product_id, category_id, price, name
FROM products
WHERE category_id = 3
  AND price BETWEEN 100000 AND 500000
ORDER BY price;

SELECT '3B. COMPOSITE INDEX (category_id, price) - query only on price, less optimal because price is not leftmost' AS section;
EXPLAIN ANALYZE
SELECT product_id, category_id, price, name
FROM products
WHERE price BETWEEN 100000 AND 500000
ORDER BY price;

SELECT '4. COVERING INDEX - SELECT and WHERE columns are inside the same index' AS section;
CALL drop_index_if_exists('products', 'idx_products_sku');
CREATE INDEX idx_products_sku_name ON products(sku, name);
EXPLAIN ANALYZE
SELECT sku, name
FROM products
WHERE sku = 'SKU000123';

SELECT '5A. MYSQL PARTIAL-INDEX EMULATION - typical query may NOT use expression index directly' AS section;
CREATE INDEX idx_orders_active_user_expr
ON orders ((CASE WHEN status = 'ACTIVE' THEN user_id ELSE NULL END));
EXPLAIN ANALYZE
SELECT order_id, user_id, status, order_date
FROM orders
WHERE status = 'ACTIVE'
  AND user_id = 123;

SELECT '5B. MYSQL PARTIAL-INDEX EMULATION - expression query can use the functional index' AS section;
EXPLAIN ANALYZE
SELECT order_id, user_id, status, order_date
FROM orders
WHERE (CASE WHEN status = 'ACTIVE' THEN user_id ELSE NULL END) = 123;

SELECT '6A. JOIN QUERY - BEFORE supporting indexes on users.email and orders.user_id' AS section;
EXPLAIN ANALYZE
SELECT o.order_id, o.order_date, o.total_amount
FROM orders o
JOIN users u ON o.user_id = u.user_id
WHERE u.email = 'user123@example.com';

SELECT '6B. JOIN QUERY - AFTER supporting indexes on users.email and orders.user_id' AS section;
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_orders_user_id ON orders(user_id);
EXPLAIN ANALYZE
SELECT o.order_id, o.order_date, o.total_amount
FROM orders o
JOIN users u ON o.user_id = u.user_id
WHERE u.email = 'user123@example.com';

SELECT '7. ARRAY-LIKE DATA IN MYSQL - normalized product_tags table needs index on tag' AS section;
CREATE INDEX idx_product_tags_tag_product ON product_tags(tag, product_id);
EXPLAIN ANALYZE
SELECT p.product_id, p.name, pt.tag
FROM product_tags pt
JOIN products p ON p.product_id = pt.product_id
WHERE pt.tag = 'organic'
LIMIT 20;

SELECT '8. SPECIALIZED INDEX - FULLTEXT search' AS section;
CREATE FULLTEXT INDEX idx_products_text ON products(name, description);
EXPLAIN ANALYZE
SELECT product_id, name
FROM products
WHERE MATCH(name, description) AGAINST('wireless organic' IN NATURAL LANGUAGE MODE)
LIMIT 20;

SELECT '9. SPECIALIZED INDEX - SPATIAL index with bounding box' AS section;
EXPLAIN ANALYZE
SELECT store_id, name
FROM stores
WHERE MBRContains(
    ST_GeomFromText('POLYGON((10.70 106.60, 10.70 106.85, 10.90 106.85, 10.90 106.60, 10.70 106.60))', 4326),
    location
)
LIMIT 20;

SELECT '10. WRITE COST - compare insert into table with few indexes vs many indexes' AS section;
DROP TABLE IF EXISTS write_light;
DROP TABLE IF EXISTS write_heavy;

CREATE TABLE write_light (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sku VARCHAR(30) NOT NULL,
    category_id INT NOT NULL,
    price INT NOT NULL,
    name VARCHAR(160) NOT NULL,
    description TEXT
) ENGINE=InnoDB;

CREATE TABLE write_heavy LIKE write_light;
CREATE INDEX idx_write_heavy_sku ON write_heavy(sku);
CREATE INDEX idx_write_heavy_category_price ON write_heavy(category_id, price);
CREATE FULLTEXT INDEX idx_write_heavy_text ON write_heavy(name, description);

SET @t0 = NOW(6);
INSERT INTO write_light(sku, category_id, price, name, description)
WITH RECURSIVE seq(n) AS (
    SELECT 1
    UNION ALL
    SELECT n + 1 FROM seq WHERE n < 3000
)
SELECT
    CONCAT('WLight', LPAD(n, 6, '0')),
    (n % 20) + 1,
    ((n * 41) % 990000) + 10000,
    CONCAT('Light write product ', n),
    CONCAT('Light description ', n)
FROM seq;
SELECT TIMESTAMPDIFF(MICROSECOND, @t0, NOW(6)) / 1000 AS write_light_ms;

SET @t0 = NOW(6);
INSERT INTO write_heavy(sku, category_id, price, name, description)
WITH RECURSIVE seq(n) AS (
    SELECT 1
    UNION ALL
    SELECT n + 1 FROM seq WHERE n < 3000
)
SELECT
    CONCAT('WHeavy', LPAD(n, 6, '0')),
    (n % 20) + 1,
    ((n * 41) % 990000) + 10000,
    CONCAT('Heavy write product ', n),
    CONCAT('Heavy description ', n)
FROM seq;
SELECT TIMESTAMPDIFF(MICROSECOND, @t0, NOW(6)) / 1000 AS write_heavy_ms;

SELECT 'DONE - MySQL indexing tests finished' AS section;
