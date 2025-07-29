const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const UserProfile = require('../models/UserProfile');
const ProductProfile = require('../models/ProductProfile');

// 更新用户画像
const updateUserProfile = async (userId) => {
  try {
    // 获取用户基本信息
    const user = await User.findById(userId);
    if (!user) return null;

    // 获取用户订单历史
    const orders = await Order.find({ user: userId }).sort({ createdAt: -1 });
    
    // 获取购物车信息
    const cart = await Cart.findOne({ user: userId });
    
    // 计算用户行为指标
    const userProfileData = calculateUserBehaviorMetrics(user, orders, cart);
    
    // 更新或创建用户画像
    let userProfile = await UserProfile.findOne({ user: userId });
    if (!userProfile) {
      userProfile = new UserProfile({ user: userId, ...userProfileData });
    } else {
      Object.assign(userProfile, userProfileData);
    }
    
    await userProfile.save();
    return userProfile;
  } catch (err) {
    console.error('更新用户画像失败:', err);
    return null;
  }
};

// 计算用户行为指标
const calculateUserBehaviorMetrics = (user, orders, cart) => {
  const behavior = {
    purchaseFrequency: 0,
    avgOrderValue: 0,
    totalSpent: 0,
    lastPurchaseDate: null,
    preferredCategories: [],
    cartAbandonmentRate: 0
  };
  
  const preferences = {
    preferredCategories: [],
    priceSensitivity: 'medium'
  };
  
  // 计算总消费和订单数
  if (orders && orders.length > 0) {
    behavior.lastPurchaseDate = orders[0].createdAt;
    behavior.totalSpent = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    behavior.avgOrderValue = behavior.totalSpent / orders.length;
    behavior.purchaseFrequency = orders.length; // 简化处理，实际应按时间计算频率
    
    // 分析偏好类别
    const categoryMap = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        if (item.product && item.product.category) {
          categoryMap[item.product.category] = (categoryMap[item.product.category] || 0) + 1;
        }
      });
    });
    
    // 获取前3个偏好类别
    preferences.preferredCategories = Object.entries(categoryMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(entry => entry[0]);
  }
  
  // 计算购物车放弃率（简化处理）
  if (cart && cart.items && cart.items.length > 0) {
    // 如果用户有购物车但没有最近的订单，认为是放弃了购物车
    behavior.cartAbandonmentRate = orders.length > 0 ? 0 : 1;
  }
  
  // 确定价格敏感度（简化处理）
  if (behavior.avgOrderValue > 1000) {
    preferences.priceSensitivity = 'low'; // 高价值客户
  } else if (behavior.avgOrderValue < 100) {
    preferences.priceSensitivity = 'high'; // 价格敏感客户
  }
  
  // 计算用户价值评分（简化算法）
  let valueScore = 0;
  if (behavior.totalSpent > 0) valueScore += Math.min(50, behavior.totalSpent / 100);
  if (orders.length > 0) valueScore += Math.min(30, orders.length * 5);
  if (preferences.preferredCategories.length > 0) valueScore += 20;
  
  // 确定生命周期阶段
  let lifecycleStage = 'new';
  if (orders.length > 10) {
    lifecycleStage = 'vip';
  } else if (orders.length > 2) {
    lifecycleStage = 'active';
  } else if (orders.length === 0 && cart) {
    lifecycleStage = 'at_risk';
  }
  
  return {
    demographics: {
      location: user.shippingAddress
    },
    behavior,
    preferences,
    valueScore: Math.min(100, Math.round(valueScore)),
    lifecycleStage
  };
};

// 更新商品画像
const updateProductProfile = async (productId) => {
  try {
    // 获取商品基本信息
    const product = await Product.findById(productId).populate('seller');
    if (!product) return null;
    
    // 获取包含该商品的订单
    const orders = await Order.find({ 'items.product': productId })
      .populate('user');
    
    // 获取商品评价（如果有评价系统）
    // 这里暂时留空，因为当前模型没有评价字段
    
    // 计算商品表现指标
    const productProfileData = calculateProductMetrics(product, orders);
    
    // 更新或创建商品画像
    let productProfile = await ProductProfile.findOne({ product: productId });
    if (!productProfile) {
      productProfile = new ProductProfile({ product: productId, ...productProfileData });
    } else {
      Object.assign(productProfile, productProfileData);
    }
    
    await productProfile.save();
    return productProfile;
  } catch (err) {
    console.error('更新商品画像失败:', err);
    return null;
  }
};

// 计算商品表现指标
const calculateProductMetrics = (product, orders) => {
  const salesMetrics = {
    totalSold: 0,
    avgMonthlySales: 0,
    salesTrend: 'new'
  };
  
  const userBehavior = {
    viewCount: 0, // 简化处理，实际应有浏览记录
    addToCartCount: 0, // 简化处理，实际应有购物车记录
    purchaseCount: 0,
    conversionRate: 0
  };
  
  // 计算销售数据
  if (orders && orders.length > 0) {
    // 计算总销量
    orders.forEach(order => {
      order.items.forEach(item => {
        if (item.product.toString() === product._id.toString()) {
          salesMetrics.totalSold += item.quantity;
          userBehavior.purchaseCount += 1;
        }
      });
    });
    
    // 计算平均月销量（简化处理）
    const firstOrderDate = new Date(orders[orders.length - 1].createdAt);
    const monthsDiff = Math.max(1, 
      (new Date().getFullYear() - firstOrderDate.getFullYear()) * 12 + 
      (new Date().getMonth() - firstOrderDate.getMonth())
    );
    salesMetrics.avgMonthlySales = salesMetrics.totalSold / monthsDiff;
    
    // 确定销售趋势
    if (monthsDiff >= 3) {
      // 简化趋势分析
      salesMetrics.salesTrend = salesMetrics.avgMonthlySales > 0 ? 'stable' : 'decline';
    }
  }
  
  // 计算转化率（简化处理）
  if (userBehavior.viewCount > 0) {
    userBehavior.conversionRate = userBehavior.purchaseCount / userBehavior.viewCount;
  }
  
  // 计算受欢迎度评分（简化算法）
  let popularityScore = 0;
  if (salesMetrics.totalSold > 0) popularityScore += Math.min(50, salesMetrics.totalSold);
  if (userBehavior.purchaseCount > 0) popularityScore += Math.min(30, userBehavior.purchaseCount * 2);
  if (product.quantity > 0) popularityScore += 20; // 有库存加分
  
  // 商品生命周期阶段
  const daysInMarket = Math.floor((Date.now() - new Date(product.createdAt)) / (1000 * 60 * 60 * 24));
  let lifecycleStage = 'introduction';
  if (daysInMarket > 180 && salesMetrics.avgMonthlySales > 10) {
    lifecycleStage = 'maturity';
  } else if (daysInMarket > 30) {
    lifecycleStage = 'growth';
  }
  
  return {
    salesMetrics,
    userBehavior,
    inventoryMetrics: {
      daysOfSupply: product.quantity > salesMetrics.avgMonthlySales ? 
        Math.floor((product.quantity / salesMetrics.avgMonthlySales) * 30) : 0
    },
    tags: [product.category], // 简化处理，实际应有更复杂的标签系统
    lifecycle: {
      stage: lifecycleStage,
      daysInMarket
    },
    popularityScore: Math.min(100, Math.round(popularityScore))
  };
};

// 获取用户画像
const getUserProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // 更新用户画像
    await updateUserProfile(userId);
    
    // 获取用户画像
    const userProfile = await UserProfile.findOne({ user: userId });
    
    if (!userProfile) {
      return res.status(404).json({ message: '用户画像未找到' });
    }
    
    res.json(userProfile);
  } catch (err) {
    res.status(500).json({ message: '服务器错误', error: err.message });
  }
};

// 获取商品画像
const getProductProfile = async (req, res) => {
  try {
    const productId = req.params.id;
    
    // 更新商品画像
    await updateProductProfile(productId);
    
    // 获取商品画像
    const productProfile = await ProductProfile.findOne({ product: productId });
    
    if (!productProfile) {
      return res.status(404).json({ message: '商品画像未找到' });
    }
    
    res.json(productProfile);
  } catch (err) {
    res.status(500).json({ message: '服务器错误', error: err.message });
  }
};

// 获取推荐商品（基于用户画像）
const getRecommendedProducts = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // 获取用户画像
    const userProfile = await UserProfile.findOne({ user: userId });
    
    if (!userProfile) {
      // 如果没有画像，返回随机商品
      const products = await Product.find().limit(10).populate('seller', 'username');
      return res.json(products);
    }
    
    // 基于用户偏好类别推荐商品
    let recommendedProducts = [];
    
    if (userProfile.behavior.preferredCategories && 
        userProfile.behavior.preferredCategories.length > 0) {
      // 查找用户偏好类别的热门商品
      recommendedProducts = await Product.find({
        category: { $in: userProfile.behavior.preferredCategories }
      })
      .populate('seller', 'username')
      .limit(10);
    } else {
      // 如果没有偏好类别，返回热门商品
      const popularProducts = await ProductProfile.find()
        .sort({ popularityScore: -1 })
        .limit(10)
        .populate({
          path: 'product',
          populate: { path: 'seller', select: 'username' }
        });
      
      recommendedProducts = popularProducts.map(pp => pp.product);
    }
    
    res.json(recommendedProducts);
  } catch (err) {
    res.status(500).json({ message: '服务器错误', error: err.message });
  }
};

module.exports = {
  getUserProfile,
  getProductProfile,
  getRecommendedProducts,
  updateUserProfile,
  updateProductProfile
};