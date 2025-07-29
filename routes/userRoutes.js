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

const router = express.Router();

// 用户注册
router.post('/register', register);

// 用户登录
router.post('/login', login);

// 获取用户信息（需要认证）
router.get('/profile', auth, getProfile);

// 更新用户信息（需要认证）
router.put('/profile', auth, updateProfile);

// 地址管理
router.post('/addresses', auth, addAddress);
router.put('/addresses/:addressId', auth, updateAddress);
router.delete('/addresses/:addressId', auth, deleteAddress);

module.exports = router;