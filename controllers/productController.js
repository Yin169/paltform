const Product = require('../models/Product');
const User = require('../models/User');
const graphService = require('../services/graphService');

// 获取所有商品
const getProducts = async (req, res) => {
  try {
    // 如果提供了卖家ID，则只返回该卖家的商品
    const filter = req.query.seller ? { seller: req.query.seller } : {};
    
    const products = await Product.find(filter).populate('seller', 'username _id');
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: '服务器错误', error: err.message });
  }
};

// 获取单个商品
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('seller', 'username _id');
    
    if (!product) {
      return res.status(404).json({ message: '商品未找到' });
    }
    
    // 如果用户已登录，更新图谱中的浏览关系
    if (req.user) {
      try {
        const userNode = await graphService.upsertUserNode(await User.findById(req.user._id));
        const productNode = await graphService.upsertProductNode(product);
        await graphService.upsertViewRelationship(userNode, productNode);
      } catch (graphError) {
        console.error('更新图谱数据失败:', graphError);
        // 不中断主流程，仅记录错误
      }
    }
    
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: '服务器错误', error: err.message });
  }
};

// 创建商品
const createProduct = async (req, res) => {
  try {
    const { name, description, price, category, quantity, imageUrl } = req.body;
    
    // 验证必填字段
    if (!name || !description || price === undefined || category === undefined || quantity === undefined) {
      return res.status(400).json({ message: '请填写所有必填字段' });
    }
    
    // 验证数值字段
    if (price < 0 || quantity < 0) {
      return res.status(400).json({ message: '价格和库存不能为负数' });
    }
    
    const product = new Product({
      name,
      description,
      price,
      category,
      quantity,
      imageUrl: imageUrl || '',
      seller: req.user._id
    });
    
    const savedProduct = await product.save();
    await savedProduct.populate('seller', 'username');
    
    // 更新图谱中的商品节点
    try {
      await graphService.upsertProductNode(savedProduct);
    } catch (graphError) {
      console.error('更新图谱数据失败:', graphError);
      // 不中断主流程，仅记录错误
    }
    
    res.status(201).json(savedProduct);
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ message: '数据验证失败', errors: messages });
    }
    res.status(500).json({ message: '服务器错误', error: err.message });
  }
};

// 更新商品
const updateProduct = async (req, res) => {
  try {
    const { name, description, price, category, quantity, imageUrl } = req.body;
    
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: '商品未找到' });
    }
    
    // 检查是否是卖家或管理员
    if (product.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: '无权限更新此商品' });
    }
    
    // 更新字段（只更新提供的字段）
    if (name !== undefined) product.name = name;
    if (description !== undefined) product.description = description;
    if (price !== undefined) {
      if (price < 0) {
        return res.status(400).json({ message: '价格不能为负数' });
      }
      product.price = price;
    }
    if (category !== undefined) product.category = category;
    if (quantity !== undefined) {
      if (quantity < 0) {
        return res.status(400).json({ message: '库存不能为负数' });
      }
      product.quantity = quantity;
    }
    if (imageUrl !== undefined) product.imageUrl = imageUrl;
    
    const updatedProduct = await product.save();
    await updatedProduct.populate('seller', 'username');
    
    // 更新图谱中的商品节点
    try {
      await graphService.upsertProductNode(updatedProduct);
    } catch (graphError) {
      console.error('更新图谱数据失败:', graphError);
      // 不中断主流程，仅记录错误
    }
    
    res.json(updatedProduct);
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ message: '数据验证失败', errors: messages });
    }
    res.status(500).json({ message: '服务器错误', error: err.message });
  }
};

// 删除商品
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: '商品未找到' });
    }
    
    // 检查是否是卖家或管理员
    if (product.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: '无权限删除此商品' });
    }
    
    await product.remove();
    res.json({ message: '商品删除成功' });
  } catch (err) {
    res.status(500).json({ message: '服务器错误', error: err.message });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};