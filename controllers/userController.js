const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { updateUserProfile } = require('./profileController');

// 用户注册
const register = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    
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
    
    // 检查角色是否有效
    const validRoles = ['user', 'seller'];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({ message: '无效的用户角色' });
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
    
    // 创建用户
    const user = new User({
      username,
      email,
      password,
      role: role || 'user' // 默认为普通用户
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
        role: user.role
      }
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ message: '数据验证失败', errors: messages });
    }
    res.status(500).json({ message: '服务器错误', error: err.message });
  }
};

// 用户登录
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // 检查必填字段
    if (!email || !password) {
      return res.status(400).json({ message: '请提供邮箱和密码' });
    }
    
    // 查找用户
    const user = await User.findOne({ email });
    if (!user) {
      console.log(`登录失败: 未找到邮箱为 ${email} 的用户`);
      return res.status(401).json({ message: '邮箱或密码错误' });
    }
    
    // 验证密码
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log(`登录失败: 邮箱 ${email} 的密码不匹配`);
      return res.status(401).json({ message: '邮箱或密码错误' });
    }
    
    // 检查账户是否激活
    if (!user.isActive) {
      console.log(`登录失败: 邮箱 ${email} 的账户已被禁用`);
      return res.status(401).json({ message: '账户已被禁用' });
    }
    
    // 生成JWT令牌
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
    
    console.log(`用户 ${user.username} (${user.email}) 登录成功`);
    
    res.json({
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('登录过程中发生错误:', err);
    res.status(500).json({ message: '服务器错误', error: err.message });
  }
};

// 获取用户信息
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ message: '用户未找到' });
    }
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