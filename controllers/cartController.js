const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { updateUserProfile } = require('./profileController');
const graphService = require('../services/graphService');

// 获取用户购物车
const getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id }).populate({
      path: 'items.product',
      select: 'name price quantity imageUrl'
    });

    if (!cart) {
      // 如果购物车不存在，创建一个空的购物车
      cart = new Cart({
        user: req.user._id,
        items: []
      });
      await cart.save();
    }

    res.json(cart);
  } catch (err) {
    console.error('获取购物车失败:', err);
    res.status(500).json({ 
      message: '服务器错误', 
      error: process.env.NODE_ENV === 'development' ? err.message : '获取购物车失败'
    });
  }
};

// 添加商品到购物车
const addToCart = async (req, res) => {
  try {
    // 检查请求体是否存在
    if (!req.body) {
      return res.status(400).json({ message: '请求体不能为空' });
    }
    
    const { productId, quantity = 1 } = req.body;
    
    // 验证参数
    if (!productId) {
      return res.status(400).json({ message: '商品ID不能为空' });
    }
    
    if (quantity <= 0) {
      return res.status(400).json({ message: '商品数量必须大于0' });
    }
    
    // 检查商品是否存在
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: '商品未找到' });
    }

    // 检查库存
    if (product.quantity < quantity) {
      return res.status(400).json({ 
        message: `商品库存不足，仅剩 ${product.quantity} 件` 
      });
    }

    // 查找或创建购物车
    let cart = await Cart.findOne({ user: req.user._id });
    
    if (!cart) {
      cart = new Cart({
        user: req.user._id,
        items: []
      });
    }

    // 检查商品是否已在购物车中
    const existingItemIndex = cart.items.findIndex(
      item => item.product.toString() === productId
    );

    if (existingItemIndex > -1) {
      // 如果商品已在购物车中，更新数量
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      // 如果商品不在购物车中，添加新项目
      cart.items.push({
        product: productId,
        quantity
      });
    }

    // 检查添加后的数量是否超过库存
    const updatedItem = cart.items.find(item => item.product.toString() === productId);
    if (updatedItem && updatedItem.quantity > product.quantity) {
      return res.status(400).json({ 
        message: `商品库存不足，仅剩 ${product.quantity} 件` 
      });
    }

    await cart.save();
    await cart.populate({
      path: 'items.product',
      select: 'name price quantity imageUrl'
    });
    
    // 更新用户画像
    await updateUserProfile(req.user._id);
    
    // 更新图谱数据
    try {
      const userNode = await graphService.upsertUserNode(req.user);
      const productNode = await graphService.upsertProductNode(product);
      await graphService.upsertCartRelationship(userNode, productNode);
    } catch (graphError) {
      console.error('更新图谱数据失败:', graphError);
      // 不中断主流程，仅记录错误
    }
    
    res.json(cart);
  } catch (err) {
    console.error('添加商品到购物车失败:', err);
    res.status(500).json({ 
      message: '服务器错误', 
      error: process.env.NODE_ENV === 'development' ? err.message : '添加商品到购物车失败'
    });
  }
};

// 更新购物车商品数量
const updateCartItem = async (req, res) => {
  try {
    // 检查请求体是否存在
    if (!req.body) {
      return res.status(400).json({ message: '请求体不能为空' });
    }
    
    const { productId, quantity } = req.body;
    
    // 验证参数
    if (!productId) {
      return res.status(400).json({ message: '商品ID不能为空' });
    }
    
    if (quantity === undefined || quantity <= 0) {
      return res.status(400).json({ message: '商品数量必须大于0' });
    }
    
    // 检查商品是否存在
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: '商品未找到' });
    }
    
    // 检查库存
    if (product.quantity < quantity) {
      return res.status(400).json({ 
        message: `商品库存不足，仅剩 ${product.quantity} 件` 
      });
    }
    
    // 查找购物车
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: '购物车未找到' });
    }
    
    // 查找购物车中的商品项
    const itemIndex = cart.items.findIndex(
      item => item.product.toString() === productId
    );
    
    if (itemIndex === -1) {
      return res.status(404).json({ message: '购物车中未找到该商品' });
    }
    
    // 更新商品数量
    cart.items[itemIndex].quantity = quantity;
    
    await cart.save();
    await cart.populate({
      path: 'items.product',
      select: 'name price quantity imageUrl'
    });
    
    res.json(cart);
  } catch (err) {
    console.error('更新购物车商品数量失败:', err);
    res.status(500).json({ 
      message: '服务器错误', 
      error: process.env.NODE_ENV === 'development' ? err.message : '更新购物车商品数量失败'
    });
  }
};

// 从购物车移除商品
const removeFromCart = async (req, res) => {
  try {
    // 检查请求体是否存在
    if (!req.body) {
      return res.status(400).json({ message: '请求体不能为空' });
    }
    
    const { productId } = req.body;
    
    // 验证参数
    if (!productId) {
      return res.status(400).json({ message: '商品ID不能为空' });
    }
    
    // 查找购物车
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: '购物车未找到' });
    }
    
    // 过滤掉要移除的商品
    cart.items = cart.items.filter(
      item => item.product.toString() !== productId
    );
    
    await cart.save();
    await cart.populate({
      path: 'items.product',
      select: 'name price quantity imageUrl'
    });
    
    res.json(cart);
  } catch (err) {
    console.error('从购物车移除商品失败:', err);
    res.status(500).json({ 
      message: '服务器错误', 
      error: process.env.NODE_ENV === 'development' ? err.message : '从购物车移除商品失败'
    });
  }
};

// 清空购物车
const clearCart = async (req, res) => {
  try {
    // 查找购物车
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: '购物车未找到' });
    }
    
    // 清空购物车项目
    cart.items = [];
    
    await cart.save();
    
    res.json({ message: '购物车已清空' });
  } catch (err) {
    console.error('清空购物车失败:', err);
    res.status(500).json({ 
      message: '服务器错误', 
      error: process.env.NODE_ENV === 'development' ? err.message : '清空购物车失败'
    });
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
};