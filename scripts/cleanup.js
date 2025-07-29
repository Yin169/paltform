#!/usr/bin/env node

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const { UserNode, ProductNode, RelationshipEdge, GraphStat } = require('../models/Graph');

// 加载环境变量
dotenv.config();

// 连接到MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB连接成功'))
.catch(err => {
  console.error('MongoDB连接失败:', err);
  process.exit(1);
});

// 清理模拟数据
async function cleanup() {
  try {
    console.log('开始清理模拟数据...');
    
    // 获取命令行参数
    const args = process.argv.slice(2);
    const force = args.includes('--force') || args.includes('-f');
    
    if (!force) {
      const answer = await question('确定要清理所有模拟数据吗？这将删除所有用户、商品、订单等数据。(yes/no): ');
      if (answer.toLowerCase() !== 'yes' && answer.toLowerCase() !== 'y') {
        console.log('取消清理操作');
        process.exit(0);
      }
    }
    
    // 删除所有数据
    await User.deleteMany({ username: { $regex: /^user_|^client_|^customer_|^buyer_|^shopper_/ } });
    console.log('已删除模拟用户数据');
    
    await Product.deleteMany({ name: { $regex: /^(品牌A|品牌B|品牌C|品牌D)/ } });
    console.log('已删除模拟商品数据');
    
    await Order.deleteMany({});
    console.log('已删除订单数据');
    
    await Cart.deleteMany({});
    console.log('已删除购物车数据');
    
    // 删除图谱数据
    await UserNode.deleteMany({});
    await ProductNode.deleteMany({});
    await RelationshipEdge.deleteMany({});
    await GraphStat.deleteMany({});
    console.log('已删除图谱数据');
    
    console.log('模拟数据清理完成！');
    process.exit(0);
  } catch (error) {
    console.error('清理过程中出现错误:', error);
    process.exit(1);
  }
}

// 简单的命令行询问函数
function question(query) {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise(resolve => {
    rl.question(query, answer => {
      rl.close();
      resolve(answer);
    });
  });
}

// 如果直接运行此脚本，则执行清理
if (require.main === module) {
  cleanup();
}

module.exports = cleanup;