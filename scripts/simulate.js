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

// 运行模拟
async function run() {
  try {
    console.log('开始运行模拟...');
    
    // 获取命令行参数
    const args = process.argv.slice(2);
    const options = {};
    
    // 解析参数
    for (let i = 0; i < args.length; i += 2) {
      const key = args[i].replace('--', '');
      const value = args[i + 1];
      
      switch (key) {
        case 'users':
          options.userCount = parseInt(value);
          break;
        case 'products':
          options.productCount = parseInt(value);
          break;
        case 'views':
          options.viewProbability = parseFloat(value);
          break;
        case 'carts':
          options.cartProbability = parseFloat(value);
          break;
        case 'orders':
          options.orderProbability = parseFloat(value);
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