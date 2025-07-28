const Product = require('../models/Product');

// 获取所有商品
const getProducts = async (req, res) => {
  try {
    const products = await Product.find().populate('seller', 'username');
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: '服务器错误', error: err.message });
  }
};

// 根据ID获取单个商品
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('seller', 'username');
    
    if (!product) {
      return res.status(404).json({ message: '商品未找到' });
    }
    
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: '服务器错误', error: err.message });
  }
};

// 创建新商品
const createProduct = async (req, res) => {
  try {
    const { name, description, price, category, quantity, imageUrl } = req.body;
    
    const product = new Product({
      name,
      description,
      price,
      category,
      quantity,
      imageUrl,
      seller: req.user._id
    });
    
    const savedProduct = await product.save();
    await savedProduct.populate('seller', 'username');
    
    res.status(201).json(savedProduct);
  } catch (err) {
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
    
    // 检查是否是商品所有者
    if (product.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: '无权限修改此商品' });
    }
    
    product.name = name || product.name;
    product.description = description || product.description;
    product.price = price || product.price;
    product.category = category || product.category;
    product.quantity = quantity || product.quantity;
    product.imageUrl = imageUrl || product.imageUrl;
    
    const updatedProduct = await product.save();
    await updatedProduct.populate('seller', 'username');
    
    res.json(updatedProduct);
  } catch (err) {
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
    
    // 检查是否是商品所有者
    if (product.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: '无权限删除此商品' });
    }
    
    await Product.findByIdAndDelete(req.params.id);
    
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