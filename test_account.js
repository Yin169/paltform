const http = require('http');

// 发送请求到/account并检查响应
const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/account',
  method: 'GET'
};

const req = http.request(options, (res) => {
  console.log(`状态码: ${res.statusCode}`);
  console.log(`响应头: ${JSON.stringify(res.headers)}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    // 检查响应内容中是否包含账号管理相关文本
    if (data.includes('账号管理') && data.includes('account.html')) {
      console.log('成功：/account页面返回正确内容');
      
      // 提取页面标题
      const titleMatch = data.match(/<title>(.*?)<\/title>/);
      if (titleMatch) {
        console.log('页面标题:', titleMatch[1]);
      }
      
      // 输出响应内容的前1000个字符用于验证
      console.log('响应内容（前1000字符）：');
      console.log(data.substring(0, 1000));
    } else {
      console.log('失败：/account页面未返回预期内容');
      
      // 提取页面标题
      const titleMatch = data.match(/<title>(.*?)<\/title>/);
      console.log('页面标题:', titleMatch ? titleMatch[1] : '未找到标题');
      
      // 输出响应内容的前1000个字符用于调试
      console.log('响应内容（前1000字符）：');
      console.log(data.substring(0, 1000));
    }
  });
});

req.on('error', (error) => {
  console.error('请求出错:', error);
});

req.end();