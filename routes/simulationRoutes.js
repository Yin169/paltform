const express = require('express');
const simulator = require('../utils/simulator');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// 运行模拟（仅管理员）
router.post('/run', auth, adminAuth, async (req, res) => {
  try {
    const options = req.body || {};
    
    // 在后台运行模拟
    setImmediate(async () => {
      await simulator.runSimulation(options);
    });
    
    res.json({ 
      message: '模拟已启动，将在后台运行',
      options: options
    });
  } catch (err) {
    res.status(500).json({ message: '启动模拟失败', error: err.message });
  }
});

// 创建随机用户
router.post('/users', auth, adminAuth, async (req, res) => {
  try {
    const user = await simulator.createRandomUser();
    if (user) {
      res.status(201).json(user);
    } else {
      res.status(500).json({ message: '创建用户失败' });
    }
  } catch (err) {
    res.status(500).json({ message: '创建用户失败', error: err.message });
  }
});

// 创建随机商品
router.post('/products', auth, adminAuth, async (req, res) => {
  try {
    // 获取当前用户作为卖家
    const seller = req.user;
    
    const product = await simulator.createRandomProduct(seller);
    if (product) {
      res.status(201).json(product);
    } else {
      res.status(500).json({ message: '创建商品失败' });
    }
  } catch (err) {
    res.status(500).json({ message: '创建商品失败', error: err.message });
  }
});

module.exports = router;