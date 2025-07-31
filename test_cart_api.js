// 测试脚本：验证购物车API

// 模拟localStorage中的token（需要替换为实际的有效token）
const token = 'your_valid_token_here'; // 替换为实际的有效token

async function testCartAPI() {
    console.log('测试购物车API...');
    
    try {
        // 测试购物车API
        console.log('1. 测试 /api/cart (GET)');
        const response = await fetch('http://localhost:3000/api/cart', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        console.log('   状态码:', response.status);
        
        if (response.ok) {
            const cart = await response.json();
            console.log('   购物车数据:', JSON.stringify(cart, null, 2));
        } else {
            const error = await response.json();
            console.log('   错误信息:', JSON.stringify(error, null, 2));
        }
        
        console.log('测试完成');
    } catch (error) {
        console.error('测试过程中出错:', error);
    }
}

testCartAPI();