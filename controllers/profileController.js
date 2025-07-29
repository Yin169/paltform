const UserProfile = require('../models/UserProfile');
const ProductProfile = require('../models/ProductProfile');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Cart = require('../models/Cart');

// 获取用户画像
const getUserProfile = async (req, res) => {
  try {
    let profile = await UserProfile.findOne({ user: req.user._id });
    
    if (!profile) {
      // 如果画像不存在，创建一个默认画像
      profile = new UserProfile({
        user: req.user._id,
        demographics: {
          gender: 'unknown',
          ageGroup: 'unknown'
        },
        behavior: {
          totalSpent: 0,
          purchaseFrequency: 0,
          avgOrderValue: 0,
          cartAbandonmentRate: 0,
          preferredCategories: [],
          activeDays: 0
        },
        preferences: {
          priceSensitivity: 'medium',
          favoriteBrands: [],
          preferredPaymentMethods: [],
          preferredShoppingChannels: ['web'],
          communicationPreferences: {
            email: true,
            sms: false,
            push: false
          }
        },
        lifecycleStage: 'new',
        valueScore: 0
      });
      await profile.save();
    }
    
    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: '服务器错误', error: err.message });
  }
};

// 获取商品画像
const getProductProfile = async (req, res) => {
  try {
    const profile = await ProductProfile.findOne({ product: req.params.id });
    
    if (!profile) {
      return res.status(404).json({ message: '商品画像未找到' });
    }
    
    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: '服务器错误', error: err.message });
  }
};

// 获取推荐商品
const getRecommendedProducts = async (req, res) => {
  try {
    // 获取用户画像
    let userProfile = await UserProfile.findOne({ user: req.user._id });
    
    if (!userProfile) {
      // 如果没有画像，返回随机商品
      const products = await Product.find().limit(10);
      return res.json(products);
    }
    
    // 基于用户偏好类别推荐商品
    const preferredCategories = userProfile.behavior.preferredCategories;
    
    let products = [];
    if (preferredCategories && preferredCategories.length > 0) {
      // 根据用户偏好类别推荐
      products = await Product.find({ 
        category: { $in: preferredCategories } 
      }).limit(10);
    }
    
    // 如果没有基于偏好的推荐，返回热门商品
    if (products.length === 0) {
      // 获取商品画像，按受欢迎度排序
      const productProfiles = await ProductProfile.find()
        .sort({ popularityScore: -1 })
        .limit(10)
        .populate('product');
      
      products = productProfiles.map(profile => profile.product);
    }
    
    // 如果仍然没有商品，返回随机商品
    if (products.length === 0) {
      products = await Product.find().limit(10);
    }
    
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: '服务器错误', error: err.message });
  }
};

// 更新用户画像
const updateUserProfile = async (userId) => {
  try {
    // 获取用户信息
    const user = await User.findById(userId);
    if (!user) return;
    
    // 获取用户订单
    const orders = await Order.find({ user: userId }).sort({ createdAt: -1 });
    
    // 获取购物车信息
    const cart = await Cart.findOne({ user: userId });
    
    // 计算行为数据
    const totalSpent = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const purchaseFrequency = orders.length;
    const avgOrderValue = purchaseFrequency > 0 ? totalSpent / purchaseFrequency : 0;
    
    // 计算购物车放弃率（简化实现）
    let cartAbandonmentRate = 0;
    if (cart && cart.items.length > 0) {
      // 这里只是一个示例计算，实际应该基于创建购物车和完成购买的对比
      cartAbandonmentRate = 0.5; // 简化处理
    }
    
    // 收集偏好类别
    const categoryMap = new Map();
    orders.forEach(order => {
      order.items.forEach(item => {
        if (item.product && item.product.category) {
          const category = item.product.category;
          const count = categoryMap.get(category) || 0;
          categoryMap.set(category, count + 1);
        }
      });
    });
    
    const preferredCategories = Array.from(categoryMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(entry => entry[0]);
    
    // 确定生命周期阶段
    let lifecycleStage = 'new';
    if (purchaseFrequency >= 10) {
      lifecycleStage = 'vip';
    } else if (purchaseFrequency >= 3) {
      lifecycleStage = 'active';
    } else if (purchaseFrequency > 0) {
      lifecycleStage = 'active';
    }
    
    // 计算价值评分（简化算法）
    const spendingScore = Math.min(100, totalSpent / 10);
    const frequencyScore = Math.min(100, purchaseFrequency * 10);
    const valueScore = Math.round(spendingScore * 0.6 + frequencyScore * 0.4);
    
    // 更新或创建用户画像
    const profile = await UserProfile.findOneAndUpdate(
      { user: userId },
      {
        user: userId,
        demographics: {
          gender: 'unknown', // 默认值，实际应从用户资料获取
          ageGroup: 'unknown' // 默认值，实际应从用户资料获取
        },
        behavior: {
          totalSpent,
          purchaseFrequency,
          avgOrderValue,
          cartAbandonmentRate,
          preferredCategories,
          lastPurchaseDate: orders.length > 0 ? orders[0].createdAt : null,
          firstPurchaseDate: orders.length > 0 ? orders[orders.length - 1].createdAt : null,
          activeDays: orders.length > 0 ? 
            Math.ceil((new Date() - orders[orders.length - 1].createdAt) / (1000 * 60 * 60 * 24)) : 0
        },
        preferences: {
          priceSensitivity: 'medium', // 默认值
          favoriteBrands: [], // 需要从商品数据中提取
          preferredPaymentMethods: [],
          preferredShoppingChannels: ['web'],
          communicationPreferences: {
            email: true,
            sms: false,
            push: false
          }
        },
        lifecycleStage,
        valueScore,
        lastUpdated: new Date()
      },
      { upsert: true, new: true }
    );
    
    return profile;
  } catch (err) {
    console.error('更新用户画像失败:', err);
    throw err;
  }
};

// 更新商品画像
const updateProductProfile = async (productId) => {
  try {
    // 获取商品信息
    const product = await Product.findById(productId);
    if (!product) return;
    
    // 获取包含此商品的订单
    const orders = await Order.find({ 'items.product': productId });
    
    // 计算销售指标
    let totalSold = 0;
    orders.forEach(order => {
      order.items.forEach(item => {
        if (item.product.toString() === productId.toString()) {
          totalSold += item.quantity;
        }
      });
    });
    
    // 计算受欢迎度评分
    const popularityScore = Math.min(100, totalSold);
    
    // 确定生命周期阶段（简化）
    let lifecycleStage = 'introduction';
    if (totalSold > 100) {
      lifecycleStage = 'maturity';
    } else if (totalSold > 10) {
      lifecycleStage = 'growth';
    }
    
    // 更新或创建商品画像
    const profile = await ProductProfile.findOneAndUpdate(
      { product: productId },
      {
        product: productId,
        salesMetrics: {
          totalSold,
          avgMonthlySales: totalSold / 12, // 简化计算
          salesTrend: 'stable' // 简化处理
        },
        userBehavior: {
          viewCount: 0, // 需要实际的浏览数据
          addToCartCount: 0, // 需要实际的加购数据
          purchaseCount: totalSold,
          conversionRate: 0.05 // 简化处理
        },
        popularityScore,
        lifecycle: {
          stage: lifecycleStage
        },
        lastUpdated: new Date()
      },
      { upsert: true, new: true }
    );
    
    return profile;
  } catch (err) {
    console.error('更新商品画像失败:', err);
    throw err;
  }
};

module.exports = {
  getUserProfile,
  getProductProfile,
  getRecommendedProducts,
  updateUserProfile,
  updateProductProfile
};