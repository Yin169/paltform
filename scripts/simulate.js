#!/usr/bin/env node

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const simulator = require('../utils/simulator');

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

// 显示帮助信息
function showHelp() {
  console.log(`
电商平台模拟系统

用法:
  npm run simulate [选项]

选项:
  --users <数量>              创建的普通用户数量 (默认: 10)
  --sellers <数量>            创建的卖家数量 (默认: 2)
  --products <数量>           创建的商品数量 (默认: 20)
  --views <概率>              用户浏览商品的概率 (0-1, 默认: 0.8)
  --carts <概率>              用户加购商品的概率 (0-1, 默认: 0.4)
  --orders <概率>             用户下单的概率 (0-1, 默认: 0.3)
  --cancels <概率>            用户取消订单的概率 (0-1, 默认: 0.1)
  --max-products <数量>       单个订单最大商品数量 (默认: 5)
  --help                      显示此帮助信息

示例:
  npm run simulate -- --users 20 --products 50 --orders 0.5
  `);
}

// 运行模拟
async function run() {
  try {
    console.log('开始运行模拟...');
    
    // 获取命令行参数
    const args = process.argv.slice(2);
    
    // 检查是否请求帮助
    if (args.includes('--help') || args.includes('-h')) {
      showHelp();
      process.exit(0);
    }
    
    const options = {};
    
    // 解析参数
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      
      switch (arg) {
        case '--users':
          options.userCount = parseInt(args[++i]);
          break;
        case '--sellers':
          options.sellerCount = parseInt(args[++i]);
          break;
        case '--products':
          options.productCount = parseInt(args[++i]);
          break;
        case '--views':
          options.viewProbability = parseFloat(args[++i]);
          break;
        case '--carts':
          options.cartProbability = parseFloat(args[++i]);
          break;
        case '--orders':
          options.orderProbability = parseFloat(args[++i]);
          break;
        case '--cancels':
          options.cancelProbability = parseFloat(args[++i]);
          break;
        case '--max-products':
          options.maxProductsPerOrder = parseInt(args[++i]);
          break;
      }
    }
    
    console.log('模拟参数:', options);
    
    // 运行模拟
    await simulator.runSimulation(options);
    
    console.log('模拟完成!');
    process.exit(0);
  } catch (error) {
    console.error('模拟过程中出现错误:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本，则执行模拟
if (require.main === module) {
  run();
}

module.exports = run;