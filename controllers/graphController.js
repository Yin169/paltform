const graphService = require('../services/graphService');

// 构建完整图谱
const buildGraph = async (req, res) => {
  try {
    await graphService.buildFullGraph();
    res.json({ message: '图谱构建成功' });
  } catch (err) {
    res.status(500).json({ message: '图谱构建失败', error: err.message });
  }
};

// 获取推荐商品
const getRecommendations = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const recommendations = await graphService.getRecommendationsForUser(req.user._id, parseInt(limit));
    res.json(recommendations);
  } catch (err) {
    res.status(500).json({ message: '获取推荐失败', error: err.message });
  }
};

// 获取相关商品
const getRelatedProducts = async (req, res) => {
  try {
    const { productId } = req.params;
    const { limit = 10 } = req.query;
    const relatedProducts = await graphService.getRelatedProducts(productId, parseInt(limit));
    res.json(relatedProducts);
  } catch (err) {
    res.status(500).json({ message: '获取相关商品失败', error: err.message });
  }
};

// 获取图谱统计数据
const getGraphStats = async (req, res) => {
  try {
    const stats = await graphService.getGraphStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: '获取图谱统计失败', error: err.message });
  }
};

// 获取图谱数据（用于可视化）
const getGraphData = async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    const graphData = await graphService.getGraphData(parseInt(limit));
    res.json(graphData);
  } catch (err) {
    res.status(500).json({ message: '获取图谱数据失败', error: err.message });
  }
};

module.exports = {
  buildGraph,
  getRecommendations,
  getRelatedProducts,
  getGraphStats,
  getGraphData
};