const express = require('express');
const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const { auth, sellerAuth } = require('../middleware/auth');

const router = express.Router();

// 获取卖家自己的商品
router.get('/products', auth, sellerAuth, async (req, res) => {
  try {
    const products = await Product.find({ seller: req.user._id });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: '服务器错误', error: err.message });
  }
});

// 获取卖家自己的订单
router.get('/orders', auth, sellerAuth, async (req, res) => {
  try {
    // 查找包含当前卖家商品的订单
    const orders = await Order.find({
      'items.product': { $in: await Product.find({ seller: req.user._id }).distinct('_id') }
    }).populate('user', 'username email').populate('items.product');
    
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: '服务器错误', error: err.message });
  }
});

// 获取卖家统计信息
router.get('/stats', auth, sellerAuth, async (req, res) => {
  try {
    // 获取卖家的商品数量
    const productCount = await Product.countDocuments({ seller: req.user._id });
    
    // 获取卖家的所有商品
    const sellerProducts = await Product.find({ seller: req.user._id });
    const productIds = sellerProducts.map(p => p._id);
    
    // 获取包含卖家商品的订单
    const orders = await Order.find({ 
      'items.product': { $in: productIds } 
    }).populate('items.product').populate('user');
    
    // 计算总销售额
    let totalSales = 0;
    orders.forEach(order => {
      order.items.forEach(item => {
        if (productIds.includes(item.product._id)) {
          totalSales += item.price * item.quantity;
        }
      });
    });
    
    // 获取客户数量
    const customerIds = [...new Set(orders.map(order => order.user._id.toString()))];
    const customerCount = customerIds.length;
    
    res.json({
      productCount,
      totalSales,
      totalOrders: orders.length,
      customerCount
    });
  } catch (err) {
    res.status(500).json({ message: '服务器错误', error: err.message });
  }
});

// 获取购买过卖家商品的客户画像
router.get('/customer-profiles', auth, sellerAuth, async (req, res) => {
  try {
    // 获取卖家的所有商品
    const sellerProducts = await Product.find({ seller: req.user._id });
    const productIds = sellerProducts.map(p => p._id);
    
    // 如果没有商品，返回空数组
    if (productIds.length === 0) {
      return res.json([]);
    }
    
    // 获取包含卖家商品的订单
    const orders = await Order.find({ 
      'items.product': { $in: productIds } 
    }).populate('user');
    
    // 获取所有客户
    const customers = [...new Map(orders.map(order => [order.user._id, order.user])).values()];
    
    // 构建客户画像数据
    const customerProfiles = customers.map(customer => {
      // 获取该客户的所有订单
      const customerOrders = orders.filter(order => order.user._id.equals(customer._id));
      
      // 计算总消费金额
      let totalSpent = 0;
      let totalItems = 0;
      const categoryMap = {};
      
      customerOrders.forEach(order => {
        order.items.forEach(item => {
          if (productIds.includes(item.product)) {
            totalSpent += item.price * item.quantity;
            totalItems += item.quantity;
            
            // 获取商品分类信息（简化处理）
            const product = sellerProducts.find(p => p._id.equals(item.product));
            if (product && product.category) {
              if (categoryMap[product.category]) {
                categoryMap[product.category] += item.quantity;
              } else {
                categoryMap[product.category] = item.quantity;
              }
            }
          }
        });
      });
      
      // 找出最偏好的分类
      const preferredCategories = Object.entries(categoryMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(entry => entry[0]);
      
      return {
        user: {
          _id: customer._id,
          username: customer.username,
          email: customer.email
        },
        valueScore: Math.min(100, Math.round(totalSpent / 10)), // 简化的价值评分
        lifecycleStage: totalSpent > 500 ? 'vip' : totalSpent > 100 ? 'active' : 'new',
        behavior: {
          totalSpent: totalSpent,
          purchaseFrequency: customerOrders.length,
          avgOrderValue: customerOrders.length > 0 ? totalSpent / customerOrders.length : 0,
          preferredCategories: preferredCategories
        }
      };
    });
    
    res.json(customerProfiles);
  } catch (err) {
    res.status(500).json({ message: '服务器错误', error: err.message });
  }
});

// 获取特定客户的画像详情
router.get('/customer-profiles/:customerId', auth, sellerAuth, async (req, res) => {
  try {
    const customerId = req.params.customerId;
    
    // 获取卖家的所有商品
    const sellerProducts = await Product.find({ seller: req.user._id });
    const productIds = sellerProducts.map(p => p._id);
    
    // 获取包含卖家商品的订单
    const orders = await Order.find({ 
      'items.product': { $in: productIds } 
    }).populate('user');
    
    // 获取特定客户
    const customer = [...new Map(orders.map(order => [order.user._id, order.user])).values()]
      .find(c => c._id.equals(customerId));
    
    if (!customer) {
      return res.status(404).json({ message: '客户未找到' });
    }
    
    // 获取该客户的所有订单
    const customerOrders = orders.filter(order => order.user._id.equals(customerId));
    
    // 计算总消费金额
    let totalSpent = 0;
    let totalItems = 0;
    const categoryMap = {};
    
    customerOrders.forEach(order => {
      order.items.forEach(item => {
        if (productIds.includes(item.product)) {
          totalSpent += item.price * item.quantity;
          totalItems += item.quantity;
          
          // 获取商品分类信息（简化处理）
          const product = sellerProducts.find(p => p._id.equals(item.product));
          if (product && product.category) {
            if (categoryMap[product.category]) {
              categoryMap[product.category] += item.quantity;
            } else {
              categoryMap[product.category] = item.quantity;
            }
          }
        }
      });
    });
    
    // 找出最偏好的分类
    const preferredCategories = Object.entries(categoryMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(entry => entry[0]);
    
    const profile = {
      user: {
        _id: customer._id,
        username: customer.username,
        email: customer.email
      },
      valueScore: Math.min(100, Math.round(totalSpent / 10)), // 简化的价值评分
      lifecycleStage: totalSpent > 500 ? 'vip' : totalSpent > 100 ? 'active' : 'new',
      behavior: {
        totalSpent: totalSpent,
        purchaseFrequency: customerOrders.length,
        avgOrderValue: customerOrders.length > 0 ? totalSpent / customerOrders.length : 0,
        preferredCategories: preferredCategories
      }
    };
    
    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: '服务器错误', error: err.message });
  }
});

// 获取卖家自己的商品画像
router.get('/product-profiles', auth, sellerAuth, async (req, res) => {
  try {
    // 获取卖家的所有商品
    const products = await Product.find({ seller: req.user._id });
    const productIds = products.map(p => p._id);
    
    // 如果没有商品，返回空数组
    if (productIds.length === 0) {
      return res.json([]);
    }
    
    // 获取包含卖家商品的订单
    const orders = await Order.find({ 
      'items.product': { $in: productIds } 
    });
    
    // 构建商品画像数据
    const productProfiles = products.map(product => {
      // 获取该商品的所有订单项
      const productOrderItems = orders.flatMap(order => 
        order.items.filter(item => item.product.equals(product._id))
      );
      
      // 计算销售指标
      const totalSold = productOrderItems.reduce((sum, item) => sum + item.quantity, 0);
      const totalRevenue = productOrderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      // 简化的生命周期阶段（基于销量）
      let lifecycleStage = 'introduction';
      if (totalSold > 100) {
        lifecycleStage = 'maturity';
      } else if (totalSold > 20) {
        lifecycleStage = 'growth';
      }
      
      // 简化的受欢迎度评分
      const popularityScore = Math.min(100, totalSold * 2);
      
      return {
        product: {
          _id: product._id,
          name: product.name,
          category: product.category,
          price: product.price
        },
        popularityScore: popularityScore,
        lifecycle: {
          stage: lifecycleStage
        },
        salesMetrics: {
          totalSold: totalSold,
          totalRevenue: totalRevenue,
          avgMonthlySales: Math.round(totalSold / 6) // 假设平台运行了6个月
        },
        userBehavior: {
          purchaseCount: productOrderItems.length,
          conversionRate: Math.min(1, productOrderItems.length / (productOrderItems.length + 5)) // 简化的转化率
        }
      };
    });
    
    res.json(productProfiles);
  } catch (err) {
    res.status(500).json({ message: '服务器错误', error: err.message });
  }
});

// 获取特定商品的画像详情
router.get('/product-profiles/:productId', auth, sellerAuth, async (req, res) => {
  try {
    const productId = req.params.productId;
    
    // 获取卖家的特定商品
    const product = await Product.findOne({ _id: productId, seller: req.user._id });
    
    if (!product) {
      return res.status(404).json({ message: '商品未找到' });
    }
    
    // 获取包含该商品的订单
    const orders = await Order.find({ 
      'items.product': productId
    });
    
    // 获取该商品的所有订单项
    const productOrderItems = orders.flatMap(order => 
      order.items.filter(item => item.product.equals(product._id))
    );
    
    // 计算销售指标
    const totalSold = productOrderItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalRevenue = productOrderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // 简化的生命周期阶段（基于销量）
    let lifecycleStage = 'introduction';
    if (totalSold > 100) {
      lifecycleStage = 'maturity';
    } else if (totalSold > 20) {
      lifecycleStage = 'growth';
    }
    
    // 简化的受欢迎度评分
    const popularityScore = Math.min(100, totalSold * 2);
    
    const profile = {
      product: {
        _id: product._id,
        name: product.name,
        category: product.category,
        price: product.price
      },
      popularityScore: popularityScore,
      lifecycle: {
        stage: lifecycleStage
      },
      salesMetrics: {
        totalSold: totalSold,
        totalRevenue: totalRevenue,
        avgMonthlySales: Math.round(totalSold / 6) // 假设平台运行了6个月
      },
      userBehavior: {
        purchaseCount: productOrderItems.length,
        conversionRate: Math.min(1, productOrderItems.length / (productOrderItems.length + 5)) // 简化的转化率
      }
    };
    
    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: '服务器错误', error: err.message });
  }
});

module.exports = router;