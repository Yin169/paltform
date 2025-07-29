const Order = require('../models/Order');
const Product = require('../models/Product');
const { updateUserProfile, updateProductProfile } = require('./profileController');

// 创建订单
const createOrder = async (req, res) => {
  try {
    const { items, shippingAddress } = req.body;
    
    // 计算总金额并验证商品
    let totalAmount = 0;
    const orderItems = [];
    
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ message: `商品 ${item.product} 未找到` });
      }
      
      if (product.quantity < item.quantity) {
        return res.status(400).json({ 
          message: `商品 ${product.name} 库存不足，仅剩 ${product.quantity} 件` 
        });
      }
      
      // 更新商品库存
      product.quantity -= item.quantity;
      await product.save();
      
      const orderItem = {
        product: item.product,
        quantity: item.quantity,
        price: product.price
      };
      
      orderItems.push(orderItem);
      totalAmount += product.price * item.quantity;
    }
    
    // 创建订单
    const order = new Order({
      user: req.user._id,
      items: orderItems,
      totalAmount,
      shippingAddress
    });
    
    const savedOrder = await order.save();
    await savedOrder.populate([
      { path: 'user', select: 'username email' },
      { path: 'items.product', select: 'name price' }
    ]);
    
    // 更新用户和商品画像
    await updateUserProfile(req.user._id);
    for (const item of orderItems) {
      await updateProductProfile(item.product);
    }
    
    res.status(201).json(savedOrder);
  } catch (err) {
    res.status(500).json({ message: '服务器错误', error: err.message });
  }
};

// 获取用户订单
const getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate([
        { path: 'user', select: 'username email' },
        { path: 'items.product', select: 'name price' }
      ])
      .sort({ createdAt: -1 });
    
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: '服务器错误', error: err.message });
  }
};

// 获取所有订单（管理员功能）
const getAllOrders = async (req, res) => {
  try {
    // 检查是否为管理员
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: '无权限访问此资源' });
    }
    
    const orders = await Order.find()
      .populate([
        { path: 'user', select: 'username email' },
        { path: 'items.product', select: 'name price' }
      ])
      .sort({ createdAt: -1 });
    
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: '服务器错误', error: err.message });
  }
};

// 获取订单详情
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate([
        { path: 'user', select: 'username email' },
        { path: 'items.product', select: 'name price' }
      ]);
    
    if (!order) {
      return res.status(404).json({ message: '订单未找到' });
    }
    
    // 检查是否是订单所有者
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: '无权限查看此订单' });
    }
    
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: '服务器错误', error: err.message });
  }
};

// 更新订单状态（管理员功能）
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: '订单未找到' });
    }
    
    // 只有管理员或订单所有者可以更新订单状态
    if (req.user.role !== 'admin' && order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: '无权限更新此订单' });
    }
    
    // 验证状态值
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: '无效的订单状态' });
    }
    
    order.status = status;
    await order.save();
    
    await order.populate([
      { path: 'user', select: 'username email' },
      { path: 'items.product', select: 'name price' }
    ]);
    
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: '服务器错误', error: err.message });
  }
};

module.exports = {
  createOrder,
  getUserOrders,
  getAllOrders,
  getOrderById,
  updateOrderStatus
};