const database = db.getSiblingDB('indexing_lab');
const tagPool = ['organic', 'food', 'drink', 'travel', 'wireless', 'smart', 'kitchen', 'sport'];

function section(title) {
  print('\n========== ' + title + ' ==========');
}

function dropIndexIfExists(collectionName, indexName) {
  const collection = database.getCollection(collectionName);
  const exists = collection.getIndexes().some((idx) => idx.name === indexName);
  if (exists) {
    collection.dropIndex(indexName);
  }
}

function showFindExplain(label, cursor) {
  print('\n--- ' + label + ' ---');
  const e = cursor.explain('executionStats');
  printjson({
    nReturned: e.executionStats.nReturned,
    totalKeysExamined: e.executionStats.totalKeysExamined,
    totalDocsExamined: e.executionStats.totalDocsExamined,
    executionTimeMillis: e.executionStats.executionTimeMillis,
    winningPlan: e.queryPlanner.winningPlan
  });
}

function showAggregateExplain(label, collectionName, pipeline) {
  print('\n--- ' + label + ' ---');
  const e = database.getCollection(collectionName).explain('executionStats').aggregate(pipeline);
  printjson(e);
}

const existingCollections = new Set(database.getCollectionNames());
['products', 'orders', 'users', 'stores', 'write_light', 'write_heavy'].forEach((name) => {
  if (!existingCollections.has(name)) {
    return;
  }
  const collection = database.getCollection(name);
  collection.getIndexes().forEach((idx) => {
    if (idx.name !== '_id_') {
      collection.dropIndex(idx.name);
    }
  });
});

section('DATASET SIZE');
printjson({
  products: database.products.countDocuments(),
  users: database.users.countDocuments(),
  orders: database.orders.countDocuments(),
  stores: database.stores.countDocuments()
});

section('1. DEFAULT INDEX: _id INDEX');
showFindExplain('Find product by _id', database.products.find({ _id: 123 }));

section('2A. FIELD INDEX - BEFORE creating index on sku, likely COLLSCAN');
showFindExplain('Find product by sku without index', database.products.find({ sku: 'SKU000123' }));

section('2B. FIELD INDEX - AFTER creating index on sku');
database.products.createIndex({ sku: 1 }, { name: 'idx_products_sku' });
showFindExplain('Find product by sku with field index', database.products.find({ sku: 'SKU000123' }));

section('3A. COMPOUND INDEX {categoryId: 1, price: 1} - query matches leftmost prefix');
database.products.createIndex({ categoryId: 1, price: 1 }, { name: 'idx_products_category_price' });
showFindExplain(
  'Filter by categoryId and price range, then sort by price',
  database.products.find({ categoryId: 3, price: { $gte: 100000, $lte: 500000 } }).sort({ price: 1 })
);

section('3B. COMPOUND INDEX {categoryId: 1, price: 1} - query only on price, less optimal');
showFindExplain(
  'Filter only by price, price is not the leftmost field',
  database.products.find({ price: { $gte: 100000, $lte: 500000 } }).sort({ price: 1 })
);

section('4. COVERED QUERY - filter and projection are inside the same index; _id is excluded');
dropIndexIfExists('products', 'idx_products_sku');
database.products.createIndex({ sku: 1, name: 1 }, { name: 'idx_products_sku_name' });
showFindExplain(
  'Covered query on sku/name projection',
  database.products.find({ sku: 'SKU000123' }, { _id: 0, sku: 1, name: 1 })
);

section('5A. PARTIAL INDEX - ACTIVE orders are indexed');
database.orders.createIndex(
  { userId: 1, orderDate: -1 },
  { name: 'idx_active_orders_user_date', partialFilterExpression: { status: 'ACTIVE' } }
);
showFindExplain(
  'ACTIVE orders by userId should be able to use partial index',
  database.orders.find({ status: 'ACTIVE', userId: 123 }).sort({ orderDate: -1 })
);

section('5B. PARTIAL INDEX - CLOSED orders are outside the partial index');
showFindExplain(
  'CLOSED orders by userId should not use the ACTIVE partial index',
  database.orders.find({ status: 'CLOSED', userId: 123 }).sort({ orderDate: -1 })
);

section('6. MULTIKEY INDEX - array field tags');
showFindExplain('Find products by tag before multikey index', database.products.find({ tags: 'organic' }));
database.products.createIndex({ tags: 1 }, { name: 'idx_products_tags' });
showFindExplain('Find products by tag after multikey index', database.products.find({ tags: 'organic' }));

section('7. RELATIONAL-LIKE QUERY WITH $lookup - supported, but not usually the main MongoDB design style');
database.users.createIndex({ email: 1 }, { name: 'idx_users_email' });
database.orders.createIndex({ userId: 1 }, { name: 'idx_orders_user_id' });
showAggregateExplain('User by email + lookup orders', 'users', [
  { $match: { email: 'user123@example.com' } },
  {
    $lookup: {
      from: 'orders',
      localField: '_id',
      foreignField: 'userId',
      as: 'orders'
    }
  },
  {
    $project: {
      email: 1,
      orderCount: { $size: '$orders' }
    }
  }
]);

section('8. SPECIALIZED INDEX - text index');
database.products.createIndex({ name: 'text', description: 'text' }, { name: 'idx_products_text' });
showFindExplain(
  'Text search on products',
  database.products.find({ $text: { $search: 'wireless organic' } }, { score: { $meta: 'textScore' }, name: 1 }).sort({ score: { $meta: 'textScore' } })
);

section('9. SPECIALIZED INDEX - 2dsphere geospatial index');
database.stores.createIndex({ location: '2dsphere' }, { name: 'idx_stores_location' });
showFindExplain(
  'Find stores near a point',
  database.stores.find({
    location: {
      $near: {
        $geometry: { type: 'Point', coordinates: [106.70, 10.78] },
        $maxDistance: 5000
      }
    }
  })
);

section('10. WRITE COST - compare insert into collection with few indexes vs many indexes');
database.write_light.drop();
database.write_heavy.drop();
database.createCollection('write_light');
database.createCollection('write_heavy');
database.write_heavy.createIndex({ sku: 1 }, { name: 'idx_write_heavy_sku' });
database.write_heavy.createIndex({ categoryId: 1, price: 1 }, { name: 'idx_write_heavy_category_price' });
database.write_heavy.createIndex({ tags: 1 }, { name: 'idx_write_heavy_tags' });
database.write_heavy.createIndex({ name: 'text', description: 'text' }, { name: 'idx_write_heavy_text' });

function benchmarkInsert(collectionName, total, batchSize) {
  const collection = database.getCollection(collectionName);
  const t0 = Date.now();
  for (let start = 1; start <= total; start += batchSize) {
    const batch = [];
    const end = Math.min(start + batchSize - 1, total);
    for (let i = start; i <= end; i++) {
      batch.push({
        sku: `${collectionName}_${String(i).padStart(6, '0')}`,
        categoryId: (i % 20) + 1,
        price: ((i * 41) % 990000) + 10000,
        name: `${collectionName} product ${i}`,
        description: `Description ${i} for write benchmark`,
        tags: [tagPool[i % tagPool.length], tagPool[(i + 3) % tagPool.length]]
      });
    }
    collection.insertMany(batch, { ordered: false });
  }
  return Date.now() - t0;
}

const lightMs = benchmarkInsert('write_light', 3000, 1000);
const heavyMs = benchmarkInsert('write_heavy', 3000, 1000);
printjson({ write_light_ms: lightMs, write_heavy_ms: heavyMs });

section('DONE - MongoDB indexing tests finished');
