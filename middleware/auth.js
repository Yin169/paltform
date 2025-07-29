const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: '访问被拒绝。未提供令牌。' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ message: '令牌无效。未找到用户。' });
    }
    
    // 检查账户是否激活
    if (!user.isActive) {
      return res.status(401).json({ message: '账户已被禁用。' });
    }
    
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: '令牌已过期。请重新登录。' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: '令牌格式无效。' });
    }
    console.error('认证错误:', err);
    res.status(500).json({ message: '认证过程中发生错误。', error: err.message });
  }
};

const adminAuth = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: '访问被拒绝。需要管理员权限。' });
  }
  next();
};

const sellerAuth = (req, res, next) => {
  if (req.user.role !== 'seller' && req.user.role !== 'admin') {
    return res.status(403).json({ message: '访问被拒绝。需要卖家权限。' });
  }
  next();
};

module.exports = { auth, adminAuth, sellerAuth };