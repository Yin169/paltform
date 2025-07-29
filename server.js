const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const adminRoutes = require('./routes/adminRoutes');
const profileRoutes = require('./routes/profileRoutes');
const graphRoutes = require('./routes/graphRoutes');
const simulationRoutes = require('./routes/simulationRoutes');
const sellerRoutes = require('./routes/sellerRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(express.json());
app.use(express.static('public'));

// 数据库连接
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('MongoDB连接成功');
}).catch(err => {
  console.error('MongoDB连接失败:', err);
});

// 增加连接事件监听器
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to DB');
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected');
});

// 当应用关闭时断开数据库连接
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('Mongoose disconnected through app termination');
  process.exit(0);
});

// 路由
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/graph', graphRoutes);
app.use('/api/simulation', simulationRoutes);
app.use('/api/seller', sellerRoutes);

// 添加静态页面路由
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/seller', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'seller.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
});