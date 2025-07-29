const mongoose = require('mongoose');

// 用户节点
const userNodeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  username: {
    type: String,
    required: true
  },
  nodeType: {
    type: String,
    default: 'user'
  },
  properties: {
    registrationDate: Date,
    totalSpent: {
      type: Number,
      default: 0
    },
    purchaseCount: {
      type: Number,
      default: 0
    },
    lastActive: Date,
    valueScore: {
      type: Number,
      default: 0
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// 商品节点
const productNodeSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  nodeType: {
    type: String,
    default: 'product'
  },
  properties: {
    category: String,
    price: Number,
    totalSold: {
      type: Number,
      default: 0
    },
    viewCount: {
      type: Number,
      default: 0
    },
    popularityScore: {
      type: Number,
      default: 0
    },
    createdAt: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// 关系边
const relationshipEdgeSchema = new mongoose.Schema({
  source: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'sourceModel'
  },
  sourceModel: {
    type: String,
    required: true,
    enum: ['UserNode', 'ProductNode']
  },
  target: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'targetModel'
  },
  targetModel: {
    type: String,
    required: true,
    enum: ['UserNode', 'ProductNode']
  },
  relationshipType: {
    type: String,
    required: true,
    enum: [
      'purchased',     // 购买
      'viewed',        // 浏览
      'added_to_cart', // 加入购物车
      'wishlist',      // 收藏
      'similar_to',    // 相似商品
      'recommended'    // 推荐
    ]
  },
  weight: {
    type: Number,
    default: 1.0
  },
  properties: {
    timestamp: {
      type: Date,
      default: Date.now
    },
    quantity: Number,
    price: Number,
    interactionCount: {
      type: Number,
      default: 1
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// 图谱统计
const graphStatSchema = new mongoose.Schema({
  statType: {
    type: String,
    required: true,
    enum: [
      'user_count',
      'product_count',
      'purchase_relationship_count',
      'view_relationship_count',
      'cart_relationship_count'
    ]
  },
  value: {
    type: Number,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const UserNode = mongoose.model('UserNode', userNodeSchema);
const ProductNode = mongoose.model('ProductNode', productNodeSchema);
const RelationshipEdge = mongoose.model('RelationshipEdge', relationshipEdgeSchema);
const GraphStat = mongoose.model('GraphStat', graphStatSchema);

module.exports = {
  UserNode,
  ProductNode,
  RelationshipEdge,
  GraphStat
};