const { UserNode, ProductNode, RelationshipEdge, GraphStat } = require('../models/Graph');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Cart = require('../models/Cart');

class GraphService {
  // 初始化或更新用户节点
  async upsertUserNode(user) {
    try {
      const orders = await Order.find({ user: user._id });
      const totalSpent = orders.reduce((sum, order) => sum + order.totalAmount, 0);
      const purchaseCount = orders.length;
      
      const userNode = await UserNode.findOneAndUpdate(
        { user: user._id },
        {
          user: user._id,
          username: user.username,
          properties: {
            registrationDate: user.createdAt,
            totalSpent: totalSpent,
            purchaseCount: purchaseCount,
            lastActive: user.updatedAt || new Date(),
            valueScore: this.calculateUserValueScore(totalSpent, purchaseCount)
          },
          updatedAt: new Date()
        },
        { upsert: true, new: true }
      );
      
      return userNode;
    } catch (error) {
      console.error('更新用户节点失败:', error);
      throw error;
    }
  }
  
  // 计算用户价值评分
  calculateUserValueScore(totalSpent, purchaseCount) {
    // 简化的价值评分算法
    const spendingScore = Math.min(100, totalSpent / 10);
    const frequencyScore = Math.min(100, purchaseCount * 10);
    return Math.round((spendingScore * 0.6 + frequencyScore * 0.4));
  }
  
  // 初始化或更新商品节点
  async upsertProductNode(product) {
    try {
      // 获取商品的销售数据
      const orders = await Order.find({ 'items.product': product._id });
      let totalSold = 0;
      orders.forEach(order => {
        order.items.forEach(item => {
          if (item.product.toString() === product._id.toString()) {
            totalSold += item.quantity;
          }
        });
      });
      
      const productNode = await ProductNode.findOneAndUpdate(
        { product: product._id },
        {
          product: product._id,
          name: product.name,
          properties: {
            category: product.category,
            price: product.price,
            totalSold: totalSold,
            viewCount: 0, // 简化处理，实际应有浏览记录
            popularityScore: this.calculateProductPopularityScore(totalSold),
            createdAt: product.createdAt
          },
          updatedAt: new Date()
        },
        { upsert: true, new: true }
      );
      
      return productNode;
    } catch (error) {
      console.error('更新商品节点失败:', error);
      throw error;
    }
  }
  
  // 计算商品受欢迎度评分
  calculateProductPopularityScore(totalSold) {
    // 简化的受欢迎度评分算法
    return Math.min(100, totalSold);
  }
  
  // 创建或更新用户-商品购买关系
  async upsertPurchaseRelationship(userNode, productNode, orderItem) {
    try {
      const edge = await RelationshipEdge.findOneAndUpdate(
        {
          source: userNode._id,
          sourceModel: 'UserNode',
          target: productNode._id,
          targetModel: 'ProductNode',
          relationshipType: 'purchased'
        },
        {
          $inc: {
            weight: 0.1,
            'properties.interactionCount': 1
          },
          $set: {
            'properties.quantity': orderItem.quantity,
            'properties.price': orderItem.price,
            'properties.timestamp': new Date(),
            updatedAt: new Date()
          }
        },
        { upsert: true, new: true }
      );
      
      return edge;
    } catch (error) {
      console.error('更新购买关系失败:', error);
      throw error;
    }
  }
  
  // 创建或更新用户-商品浏览关系
  async upsertViewRelationship(userNode, productNode) {
    try {
      const edge = await RelationshipEdge.findOneAndUpdate(
        {
          source: userNode._id,
          sourceModel: 'UserNode',
          target: productNode._id,
          targetModel: 'ProductNode',
          relationshipType: 'viewed'
        },
        {
          $inc: {
            weight: 0.01,
            'properties.interactionCount': 1
          },
          $set: {
            'properties.timestamp': new Date(),
            updatedAt: new Date()
          }
        },
        { upsert: true, new: true }
      );
      
      return edge;
    } catch (error) {
      console.error('更新浏览关系失败:', error);
      throw error;
    }
  }
  
  // 创建或更新用户-商品加购关系
  async upsertCartRelationship(userNode, productNode) {
    try {
      const edge = await RelationshipEdge.findOneAndUpdate(
        {
          source: userNode._id,
          sourceModel: 'UserNode',
          target: productNode._id,
          targetModel: 'ProductNode',
          relationshipType: 'added_to_cart'
        },
        {
          $inc: {
            weight: 0.05,
            'properties.interactionCount': 1
          },
          $set: {
            'properties.timestamp': new Date(),
            updatedAt: new Date()
          }
        },
        { upsert: true, new: true }
      );
      
      return edge;
    } catch (error) {
      console.error('更新加购关系失败:', error);
      throw error;
    }
  }
  
  // 构建相似商品关系
  async buildSimilarProductRelationships() {
    try {
      // 获取所有商品节点
      const productNodes = await ProductNode.find();
      
      // 基于类别构建相似关系
      for (let i = 0; i < productNodes.length; i++) {
        for (let j = i + 1; j < productNodes.length; j++) {
          // 如果两个商品属于同一类别，则建立相似关系
          if (productNodes[i].properties.category === productNodes[j].properties.category) {
            await RelationshipEdge.findOneAndUpdate(
              {
                source: productNodes[i]._id,
                sourceModel: 'ProductNode',
                target: productNodes[j]._id,
                targetModel: 'ProductNode',
                relationshipType: 'similar_to'
              },
              {
                weight: 0.5,
                'properties.timestamp': new Date(),
                updatedAt: new Date()
              },
              { upsert: true, new: true }
            );
            
            // 双向关系
            await RelationshipEdge.findOneAndUpdate(
              {
                source: productNodes[j]._id,
                sourceModel: 'ProductNode',
                target: productNodes[i]._id,
                targetModel: 'ProductNode',
                relationshipType: 'similar_to'
              },
              {
                weight: 0.5,
                'properties.timestamp': new Date(),
                updatedAt: new Date()
              },
              { upsert: true, new: true }
            );
          }
        }
      }
    } catch (error) {
      console.error('构建相似商品关系失败:', error);
      throw error;
    }
  }
  
  // 获取用户的推荐商品（基于图谱）
  async getRecommendationsForUser(userId, limit = 10) {
    try {
      // 1. 获取用户节点
      const userNode = await UserNode.findOne({ user: userId });
      if (!userNode) {
        return [];
      }
      
      // 2. 查找用户购买过的商品
      const purchaseEdges = await RelationshipEdge.find({
        source: userNode._id,
        sourceModel: 'UserNode',
        relationshipType: 'purchased'
      }).populate({
        path: 'target',
        model: 'ProductNode'
      });
      
      // 3. 获取购买过的商品ID列表
      const purchasedProductIds = purchaseEdges.map(edge => edge.target._id);
      
      // 4. 查找与购买商品相似的商品
      const similarEdges = await RelationshipEdge.find({
        source: { $in: purchasedProductIds },
        sourceModel: 'ProductNode',
        relationshipType: 'similar_to'
      }).populate({
        path: 'target',
        model: 'ProductNode'
      });
      
      // 5. 过滤掉已购买的商品，并按权重排序
      const recommendedProducts = similarEdges
        .filter(edge => !purchasedProductIds.includes(edge.target._id))
        .sort((a, b) => b.weight - a.weight)
        .slice(0, limit)
        .map(edge => edge.target);
      
      // 6. 如果推荐商品不足，补充热门商品
      if (recommendedProducts.length < limit) {
        const popularProducts = await ProductNode.find({
          _id: { $nin: purchasedProductIds }
        })
        .sort({ 'properties.popularityScore': -1 })
        .limit(limit - recommendedProducts.length);
        
        recommendedProducts.push(...popularProducts);
      }
      
      return recommendedProducts;
    } catch (error) {
      console.error('获取推荐商品失败:', error);
      throw error;
    }
  }
  
  // 获取与指定商品相关的商品（协同过滤）
  async getRelatedProducts(productId, limit = 10) {
    try {
      // 1. 获取商品节点
      const productNode = await ProductNode.findOne({ product: productId });
      if (!productNode) {
        return [];
      }
      
      // 2. 查找购买过此商品的用户
      const purchaseEdges = await RelationshipEdge.find({
        target: productNode._id,
        targetModel: 'ProductNode',
        relationshipType: 'purchased'
      }).populate({
        path: 'source',
        model: 'UserNode'
      });
      
      // 3. 获取购买此商品的用户ID列表
      const userIds = purchaseEdges.map(edge => edge.source._id);
      
      // 4. 查找这些用户购买的其他商品
      const otherPurchaseEdges = await RelationshipEdge.find({
        source: { $in: userIds },
        sourceModel: 'UserNode',
        relationshipType: 'purchased'
      }).populate({
        path: 'target',
        model: 'ProductNode'
      });
      
      // 5. 过滤掉当前商品，并统计其他商品的出现次数和总权重
      const productStats = {};
      otherPurchaseEdges.forEach(edge => {
        if (edge.target.product.toString() !== productId.toString()) {
          const targetProductId = edge.target.product.toString();
          if (!productStats[targetProductId]) {
            productStats[targetProductId] = {
              count: 0,
              totalWeight: 0
            };
          }
          productStats[targetProductId].count += 1;
          productStats[targetProductId].totalWeight += edge.weight;
        }
      });
      
      // 6. 按综合得分排序（考虑出现次数和权重）
      const sortedProducts = Object.entries(productStats)
        .map(([productId, stats]) => ({
          productId,
          score: stats.count * 0.7 + stats.totalWeight * 0.3 // 综合得分
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
      
      // 7. 获取商品详细信息
      const productIds = sortedProducts.map(p => p.productId);
      const products = await ProductNode.find({
        'product': { $in: productIds }
      });
      
      return products;
    } catch (error) {
      console.error('获取相关商品失败:', error);
      throw error;
    }
  }
  
  // 构建完整的图谱数据
  async buildFullGraph() {
    try {
      console.log('开始构建图谱数据...');
      
      // 1. 处理所有用户节点
      const users = await User.find();
      console.log(`处理 ${users.length} 个用户...`);
      
      for (const user of users) {
        await this.upsertUserNode(user);
      }
      
      // 2. 处理所有商品节点
      const products = await Product.find();
      console.log(`处理 ${products.length} 个商品...`);
      
      for (const product of products) {
        await this.upsertProductNode(product);
      }
      
      // 3. 处理订单关系
      const orders = await Order.find().populate([
        { path: 'user' },
        { path: 'items.product' }
      ]);
      console.log(`处理 ${orders.length} 个订单...`);
      
      for (const order of orders) {
        // 获取用户节点
        const userNode = await UserNode.findOne({ user: order.user._id });
        if (!userNode) continue;
        
        // 处理每个订单项
        for (const item of order.items) {
          const productNode = await ProductNode.findOne({ product: item.product._id });
          if (!productNode) continue;
          
          // 创建购买关系
          await this.upsertPurchaseRelationship(userNode, productNode, item);
        }
      }
      
      // 4. 构建相似商品关系
      console.log('构建相似商品关系...');
      await this.buildSimilarProductRelationships();
      
      // 5. 更新图谱统计
      await this.updateGraphStats();
      
      console.log('图谱数据构建完成');
    } catch (error) {
      console.error('构建图谱数据失败:', error);
      throw error;
    }
  }
  
  // 更新图谱统计信息
  async updateGraphStats() {
    try {
      const userCount = await UserNode.countDocuments();
      const productCount = await ProductNode.countDocuments();
      const purchaseRelationshipCount = await RelationshipEdge.countDocuments({ relationshipType: 'purchased' });
      const viewRelationshipCount = await RelationshipEdge.countDocuments({ relationshipType: 'viewed' });
      const cartRelationshipCount = await RelationshipEdge.countDocuments({ relationshipType: 'added_to_cart' });
      const similarRelationshipCount = await RelationshipEdge.countDocuments({ relationshipType: 'similar_to' });
      
      await GraphStat.findOneAndUpdate(
        { statType: 'user_count' },
        { value: userCount },
        { upsert: true }
      );
      
      await GraphStat.findOneAndUpdate(
        { statType: 'product_count' },
        { value: productCount },
        { upsert: true }
      );
      
      await GraphStat.findOneAndUpdate(
        { statType: 'purchase_relationship_count' },
        { value: purchaseRelationshipCount },
        { upsert: true }
      );
      
      await GraphStat.findOneAndUpdate(
        { statType: 'view_relationship_count' },
        { value: viewRelationshipCount },
        { upsert: true }
      );
      
      await GraphStat.findOneAndUpdate(
        { statType: 'cart_relationship_count' },
        { value: cartRelationshipCount },
        { upsert: true }
      );
      
      await GraphStat.findOneAndUpdate(
        { statType: 'similar_relationship_count' },
        { value: similarRelationshipCount },
        { upsert: true }
      );
      
      // 计算平均用户价值评分
      const userNodes = await UserNode.find({}, { 'properties.valueScore': 1 });
      const avgValueScore = userNodes.length > 0 
        ? userNodes.reduce((sum, node) => sum + (node.properties.valueScore || 0), 0) / userNodes.length
        : 0;
      
      await GraphStat.findOneAndUpdate(
        { statType: 'avg_user_value_score' },
        { value: Math.round(avgValueScore) },
        { upsert: true }
      );
      
      // 计算平均商品受欢迎度评分
      const productNodes = await ProductNode.find({}, { 'properties.popularityScore': 1 });
      const avgPopularityScore = productNodes.length > 0
        ? productNodes.reduce((sum, node) => sum + (node.properties.popularityScore || 0), 0) / productNodes.length
        : 0;
      
      await GraphStat.findOneAndUpdate(
        { statType: 'avg_product_popularity_score' },
        { value: Math.round(avgPopularityScore) },
        { upsert: true }
      );
    } catch (error) {
      console.error('更新图谱统计失败:', error);
      throw error;
    }
  }
  
  // 获取图谱统计信息
  async getGraphStats() {
    try {
      const stats = await GraphStat.find();
      const statsObj = {};
      stats.forEach(stat => {
        statsObj[stat.statType] = stat.value;
      });
      return statsObj;
    } catch (error) {
      console.error('获取图谱统计失败:', error);
      throw error;
    }
  }
  
  // 获取图谱节点和边（用于可视化）
  async getGraphData(limit = 100) {
    try {
      // 获取节点数据
      const userNodes = await UserNode.find().limit(limit);
      const productNodes = await ProductNode.find().limit(limit);
      
      // 获取边数据
      const edges = await RelationshipEdge.find()
        .populate([
          { path: 'source', select: 'username name nodeType properties' },
          { path: 'target', select: 'username name nodeType properties' }
        ])
        .limit(limit);
      
      return {
        nodes: [...userNodes, ...productNodes],
        edges: edges
      };
    } catch (error) {
      console.error('获取图谱数据失败:', error);
      throw error;
    }
  }
}

module.exports = new GraphService();