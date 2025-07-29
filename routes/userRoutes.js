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

const router = express.Router();

// 用户注册
router.post('/register', register);

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