const express = require('express');
const {
  register,
  login,
  getProfile,
  updateProfile,
  addAddress,
  updateAddress,
  deleteAddress
} = require('../controllers/userController');
const { auth } = require('../middleware/auth');
const User = require('../models/User');
const Product = require('../models/Product');
const jwt = require('jsonwebtoken');

const router = express.Router();

// 用户注册
router.post('/register', register);

// 卖家注册
router.post('/seller/register', async (req, res) => {
  try {
    const { username, email, password, description } = req.body;
    
    // 检查必填字段
    if (!username || !email || !password) {
      return res.status(400).json({ message: '请填写所有必填字段' });
    }
    
    // 检查密码长度
    if (password.length < 6) {
      return res.status(400).json({ message: '密码长度至少为6位' });
    }
    
    // 检查邮箱格式
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: '请输入有效的邮箱地址' });
    }
    
    // 检查用户名长度
    if (username.length < 3 || username.length > 30) {
      return res.status(400).json({ message: '用户名长度必须在3-30个字符之间' });
    }
    
    // 检查用户是否已存在
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({ message: '该邮箱已被注册' });
      }
      if (existingUser.username === username) {
        return res.status(400).json({ message: '该用户名已被使用' });
      }
    }
    
    // 创建卖家用户
    const user = new User({
      username,
      email,
      password,
      role: 'seller',
      profile: {
        description: description || ''
      }
    });
    
    await user.save();
    
    // 生成JWT令牌
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
    
    res.status(201).json({
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        profile: user.profile
      }
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ message: '数据验证失败', errors: messages });
    }
    res.status(500).json({ message: '服务器错误', error: err.message });
  }
});

// 用户登录
router.post('/login', login);

// 获取用户信息（需要认证）
router.get('/profile', auth, getProfile);

// 获取特定用户信息（公开接口）
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: '用户未找到' });
    }
    
    res.json(user);
  } catch (err) {
    console.error('获取用户信息失败:', err);
    if (err.name === 'CastError') {
      return res.status(400).json({ message: '无效的用户ID' });
    }
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取所有卖家（公开接口）
router.get('/sellers/public', async (req, res) => {
  try {
    // 查找所有有商品的用户（即卖家）
    const sellers = await User.find({ 
      _id: { $in: await Product.distinct('seller') },
      role: 'seller'
    }).select('-password');
    
    // 为每个卖家添加统计信息
    const sellersWithStats = await Promise.all(sellers.map(async (seller) => {
      // 获取卖家的商品数量
      const productCount = await Product.countDocuments({ seller: seller._id });
      
      return {
        ...seller.toObject(),
        profile: {
          ...seller.profile,
          productCount
        }
      };
    }));
    
    res.json(sellersWithStats);
  } catch (err) {
    console.error('获取卖家信息失败:', err);
    res.status(500).json({ message: '服务器错误', error: err.message });
  }
});

// 更新用户信息（需要认证）
router.put('/profile', auth, updateProfile);

// 地址管理
router.post('/addresses', auth, addAddress);
router.put('/addresses/:addressId', auth, updateAddress);
router.delete('/addresses/:addressId', auth, deleteAddress);

module.exports = router;