const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { updateUserProfile } = require('./profileController');

// 用户注册
const register = async (req, res) => {
  try {
    const { username, email, password, role, profile, addresses } = req.body;
    
    // 检查用户是否已存在
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: '用户名或邮箱已存在' });
    }
    
    // 创建新用户
    const user = new User({ 
      username, 
      email, 
      password,
      role: role || 'user', // 默认为普通用户，允许注册为卖家
      profile: profile || {},
      addresses: addresses || []
    });
    await user.save();
    
    // 生成JWT令牌
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
    
    res.status(201).json({
      message: '用户注册成功',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        profile: user.profile,
        addresses: user.addresses
      }
    });
  } catch (err) {
    res.status(500).json({ message: '服务器错误', error: err.message });
  }
};

// 用户登录
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // 查找用户
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: '邮箱或密码错误' });
    }
    
    // 验证密码
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: '邮箱或密码错误' });
    }
    
    // 生成JWT令牌
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
    
    res.json({
      message: '登录成功',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        profile: user.profile,
        addresses: user.addresses
      }
    });
  } catch (err) {
    res.status(500).json({ message: '服务器错误', error: err.message });
  }
};

// 获取用户信息
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: '服务器错误', error: err.message });
  }
};

// 更新用户信息
const updateProfile = async (req, res) => {
  try {
    const { profile, addresses } = req.body;
    
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: '用户未找到' });
    }
    
    // 更新个人信息
    if (profile) {
      user.profile = { ...user.profile, ...profile };
    }
    
    // 更新地址信息
    if (addresses) {
      user.addresses = addresses;
    }
    
    await user.save();
    
    res.json({
      message: '用户信息更新成功',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        profile: user.profile,
        addresses: user.addresses
      }
    });
  } catch (err) {
    res.status(500).json({ message: '服务器错误', error: err.message });
  }
};

// 添加地址
const addAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: '用户未找到' });
    }
    
    const newAddress = req.body;
    user.addresses.push(newAddress);
    await user.save();
    
    res.json({
      message: '地址添加成功',
      addresses: user.addresses
    });
  } catch (err) {
    res.status(500).json({ message: '服务器错误', error: err.message });
  }
};

// 更新地址
const updateAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const updatedAddress = req.body;
    
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: '用户未找到' });
    }
    
    const addressIndex = user.addresses.findIndex(
      addr => addr._id.toString() === addressId
    );
    
    if (addressIndex === -1) {
      return res.status(404).json({ message: '地址未找到' });
    }
    
    user.addresses[addressIndex] = updatedAddress;
    await user.save();
    
    res.json({
      message: '地址更新成功',
      addresses: user.addresses
    });
  } catch (err) {
    res.status(500).json({ message: '服务器错误', error: err.message });
  }
};

// 删除地址
const deleteAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: '用户未找到' });
    }
    
    user.addresses = user.addresses.filter(
      addr => addr._id.toString() !== addressId
    );
    
    await user.save();
    
    res.json({
      message: '地址删除成功',
      addresses: user.addresses
    });
  } catch (err) {
    res.status(500).json({ message: '服务器错误', error: err.message });
  }
};

module.exports = { 
  register, 
  login, 
  getProfile, 
  updateProfile, 
  addAddress, 
  updateAddress, 
  deleteAddress 
};