const database = db.getSiblingDB('indexing_lab');
database.dropDatabase();

function insertInBatches(collectionName, total, batchSize, factory) {
  const collection = database.getCollection(collectionName);
  for (let start = 1; start <= total; start += batchSize) {
    const batch = [];
    const end = Math.min(start + batchSize - 1, total);
    for (let i = start; i <= end; i++) {
      batch.push(factory(i));
    }
    collection.insertMany(batch, { ordered: false });
  }
}

insertInBatches('categories', 20, 1000, (i) => ({
  _id: i,
  name: `Category ${i}`
}));

const tagPool = ['organic', 'food', 'drink', 'travel', 'wireless', 'smart', 'kitchen', 'sport'];
const colorPool = ['red', 'blue', 'green', 'black', 'white'];
const typePool = ['Wireless', 'Organic', 'Travel', 'Kitchen', 'Sport', 'Smart'];

insertInBatches('products', 20000, 1000, (i) => {
  const tags = [];
  if (i % 3 === 0) tags.push('organic');
  if (i % 4 === 0) tags.push('food');
  if (i % 5 === 0) tags.push('drink');
  if (i % 7 === 0) tags.push('travel');
  if (i % 11 === 0) tags.push('wireless');
  if (tags.length === 0) tags.push(tagPool[i % tagPool.length]);

  return {
    _id: i,
    sku: `SKU${String(i).padStart(6, '0')}`,
    categoryId: (i % 20) + 1,
    price: ((i * 37) % 990000) + 10000,
    name: `Product ${i} ${typePool[i % typePool.length]}`,
    description: `Description for product ${i}. This item is useful for wireless organic travel kitchen sport smart search demo.`,
    tags,
    attributes: {
      color: colorPool[i % colorPool.length],
      size: ['S', 'M', 'L', 'XL'][i % 4]
    },
    createdAt: new Date(2025, 0, (i % 28) + 1)
  };
});

insertInBatches('users', 5000, 1000, (i) => ({
  _id: i,
  email: `user${i}@example.com`,
  fullName: `User ${i}`,
  createdAt: new Date(2025, 0, (i % 28) + 1)
}));

insertInBatches('orders', 50000, 1000, (i) => ({
  _id: i,
  userId: (i % 5000) + 1,
  orderDate: new Date(2025, i % 12, (i % 28) + 1, i % 24, i % 60, i % 60),
  status: (i % 10 <= 5) ? 'ACTIVE' : ((i % 10 <= 7) ? 'CLOSED' : 'CANCELLED'),
  totalAmount: ((i * 123) % 5000000) / 10,
  note: `Order note ${i}`,
  items: [
    { productId: (i % 20000) + 1, quantity: (i % 5) + 1 },
    { productId: ((i + 17) % 20000) + 1, quantity: (i % 3) + 1 }
  ]
}));

insertInBatches('stores', 1000, 1000, (i) => ({
  _id: i,
  name: `Store ${i}`,
  location: {
    type: 'Point',
    coordinates: [106.60 + ((i % 100) / 1000), 10.70 + ((i % 100) / 1000)]
  }
}));

print('MongoDB seed finished');
printjson({
  products: database.products.countDocuments(),
  users: database.users.countDocuments(),
  orders: database.orders.countDocuments(),
  stores: database.stores.countDocuments()
});
