const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// 路由
const userRoutes = require('../routes/userRoutes');
const productRoutes = require('../routes/productRoutes');
const orderRoutes = require('../routes/orderRoutes');
const cartRoutes = require('../routes/cartRoutes');
const profileRoutes = require('../routes/profileRoutes');
const adminRoutes = require('../routes/adminRoutes');
const graphRoutes = require('../routes/graphRoutes');
const simulationRoutes = require('../routes/simulationRoutes');
const sellerRoutes = require('../routes/sellerRoutes');

dotenv.config();

const app = express();

// Middleware
app.use(express.json());

// 静态文件服务
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/graph', graphRoutes);
app.use('/api/simulation', simulationRoutes);
app.use('/api/seller', sellerRoutes);

// 页面路由
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/login.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/register.html'));
});

app.get('/products', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/products.html'));
});

app.get('/cart', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/cart.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/admin.html'));
});

app.get('/orders', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/orders.html'));
});

app.get('/profile', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/profile.html'));
});

app.get('/seller-register', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/seller-register.html'));
});

app.get('/graph', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/graph.html'));
});

app.get('/seller', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/seller.html'));
});

// 处理所有未匹配的路由，返回首页以支持前端路由
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

const PORT = process.env.PORT || 3000;

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB连接成功'))
.catch(err => console.log('MongoDB连接失败:', err));

// 启动服务器
const server = app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
});

// 处理端口被占用的情况
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`端口 ${PORT} 已被占用，尝试使用端口 ${PORT + 1}`);
    setTimeout(() => {
      server.close();
      const newPort = parseInt(PORT) + 1;
      process.env.PORT = newPort;
      app.listen(newPort, () => {
        console.log(`服务器运行在端口 ${newPort}`);
      });
    }, 1000);
  } else {
    console.error('服务器启动错误:', err);
  }
});

module.exports = app;
