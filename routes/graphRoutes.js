const express = require('express');
const {
  buildGraph,
  getRecommendations,
  getRelatedProducts,
  getGraphStats,
  getGraphData
} = require('../controllers/graphController');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// 管理员构建图谱
router.post('/build', auth, adminAuth, buildGraph);

// 用户获取推荐商品
router.get('/recommendations', auth, getRecommendations);

// 获取相关商品
router.get('/related/:productId', auth, getRelatedProducts);

// 获取图谱统计数据
router.get('/stats', auth, adminAuth, getGraphStats);

// 获取图谱数据（用于可视化）
router.get('/data', auth, adminAuth, getGraphData);

module.exports = router;