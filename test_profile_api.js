// 测试脚本：验证profile相关的API调用

// 模拟localStorage中的token（需要替换为实际的有效token）
const token = 'your_valid_token_here'; // 替换为实际的有效token

async function testAPIs() {
    console.log('测试开始...');
    
    try {
        // 测试用户资料API
        console.log('1. 测试 /api/users/profile');
        const userResponse = await fetch('http://localhost:3000/api/users/profile', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        console.log('   状态码:', userResponse.status);
        
        // 测试用户画像API
        console.log('2. 测试 /api/profiles/user');
        const profileResponse = await fetch('http://localhost:3000/api/profiles/user', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        console.log('   状态码:', profileResponse.status);
        
        // 测试订单API
        console.log('3. 测试 /api/orders');
        const ordersResponse = await fetch('http://localhost:3000/api/orders', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        console.log('   状态码:', ordersResponse.status);
        
        console.log('测试完成');
    } catch (error) {
        console.error('测试过程中出错:', error);
    }
}

testAPIs();