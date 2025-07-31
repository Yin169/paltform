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
const cartRoutes = require('./routes/cartRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

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

// 页面路由（在静态文件服务之前定义）
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/product', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'product.html'));
});

app.get('/seller', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'seller.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// 购物车页面路由
app.get('/cart', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'cart.html'));
});

// 产品列表页面路由
app.get('/products', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'products.html'));
});

// 个人资料页面路由
app.get('/profile', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'profile.html'));
});

// 账号管理页面路由
app.get('/account', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'account.html'));
});

// 订单页面路由
app.get('/orders', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'orders.html'));
});

// 商店列表页面路由
app.get('/stores', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'stores.html'));
});

// 登录页面路由
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// 注册页面路由
app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

// 卖家注册页面路由
app.get('/seller-register', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'seller-register.html'));
});

// 用户中心页面路由
app.get('/user-center', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'user-center.html'));
});

// 数据可视化页面路由
app.get('/graph', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'graph.html'));
});


// API路由
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/graph', graphRoutes);
app.use('/api/simulation', simulationRoutes);
app.use('/api/seller', sellerRoutes);
app.use('/api/cart', cartRoutes);

// 静态文件服务（在路由之后定义）
app.use(express.static('public'));

app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
});