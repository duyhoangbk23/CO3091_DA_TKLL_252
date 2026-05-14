USE indexing_lab;

SET SESSION cte_max_recursion_depth = 100000;

DROP TABLE IF EXISTS product_tags;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS stores;
DROP TABLE IF EXISTS write_light;
DROP TABLE IF EXISTS write_heavy;

CREATE TABLE categories (
    category_id INT PRIMARY KEY,
    name VARCHAR(100) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE products (
    product_id INT AUTO_INCREMENT PRIMARY KEY,
    sku VARCHAR(30) NOT NULL,
    category_id INT NOT NULL,
    price INT NOT NULL,
    name VARCHAR(160) NOT NULL,
    description TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(160) NOT NULL,
    full_name VARCHAR(160) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE orders (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    order_date DATETIME NOT NULL,
    status VARCHAR(20) NOT NULL,
    total_amount DECIMAL(12,2) NOT NULL,
    note VARCHAR(255)
) ENGINE=InnoDB;

CREATE TABLE product_tags (
    product_id INT NOT NULL,
    tag VARCHAR(50) NOT NULL,
    PRIMARY KEY (product_id, tag)
) ENGINE=InnoDB;

CREATE TABLE stores (
    store_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    location POINT NOT NULL SRID 4326,
    SPATIAL INDEX idx_stores_location (location)
) ENGINE=InnoDB;

INSERT INTO categories(category_id, name)
WITH RECURSIVE seq(n) AS (
    SELECT 1
    UNION ALL
    SELECT n + 1 FROM seq WHERE n < 20
)
SELECT n, CONCAT('Category ', n)
FROM seq;

INSERT INTO products(sku, category_id, price, name, description)
WITH RECURSIVE seq(n) AS (
    SELECT 1
    UNION ALL
    SELECT n + 1 FROM seq WHERE n < 20000
)
SELECT
    CONCAT('SKU', LPAD(n, 6, '0')) AS sku,
    (n % 20) + 1 AS category_id,
    ((n * 37) % 990000) + 10000 AS price,
    CONCAT('Product ', n, ' ', ELT((n % 6) + 1, 'Wireless', 'Organic', 'Travel', 'Kitchen', 'Sport', 'Smart')) AS name,
    CONCAT('Description for product ', n, '. This item is useful for wireless organic travel kitchen sport smart search demo.') AS description
FROM seq;

INSERT INTO users(email, full_name)
WITH RECURSIVE seq(n) AS (
    SELECT 1
    UNION ALL
    SELECT n + 1 FROM seq WHERE n < 5000
)
SELECT
    CONCAT('user', n, '@example.com'),
    CONCAT('User ', n)
FROM seq;

INSERT INTO orders(user_id, order_date, status, total_amount, note)
WITH RECURSIVE seq(n) AS (
    SELECT 1
    UNION ALL
    SELECT n + 1 FROM seq WHERE n < 50000
)
SELECT
    (n % 5000) + 1 AS user_id,
    TIMESTAMP('2025-01-01') + INTERVAL (n % 365) DAY + INTERVAL (n % 86400) SECOND AS order_date,
    CASE
        WHEN n % 10 IN (0,1,2,3,4,5) THEN 'ACTIVE'
        WHEN n % 10 IN (6,7) THEN 'CLOSED'
        ELSE 'CANCELLED'
    END AS status,
    ((n * 123) % 5000000) / 10.0 AS total_amount,
    CONCAT('Order note ', n)
FROM seq;

INSERT INTO product_tags(product_id, tag)
SELECT product_id, 'organic' FROM products WHERE product_id % 3 = 0
UNION ALL
SELECT product_id, 'food' FROM products WHERE product_id % 4 = 0
UNION ALL
SELECT product_id, 'drink' FROM products WHERE product_id % 5 = 0
UNION ALL
SELECT product_id, 'travel' FROM products WHERE product_id % 7 = 0
UNION ALL
SELECT product_id, 'wireless' FROM products WHERE product_id % 11 = 0;

INSERT INTO stores(name, location)
WITH RECURSIVE seq(n) AS (
    SELECT 1
    UNION ALL
    SELECT n + 1 FROM seq WHERE n < 1000
)
SELECT
    CONCAT('Store ', n),
    ST_GeomFromText(
        CONCAT('POINT(', 10.70 + ((n % 100) / 1000), ' ', 106.60 + ((n % 100) / 1000), ')'),
        4326
    )
FROM seq;
