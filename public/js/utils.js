// 公共工具函数

// 检查用户登录状态
async function checkUserStatus() {
    const token = localStorage.getItem('token');
    const userActions = document.getElementById('user-actions');
    
    if (token) {
        try {
            const response = await fetch('/api/users/profile', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const user = await response.json();
                userActions.innerHTML = `
                    <span><i class="fas fa-user"></i> ${user.username}</span>
                    <a href="#" onclick="logout()"><i class="fas fa-sign-out-alt"></i> 登出</a>
                    ${user.role === 'admin' ? '<a href="/admin"><i class="fas fa-cog"></i> 管理后台</a>' : ''}
                    <a href="/orders"><i class="fas fa-list"></i> 我的订单</a>
                    <a href="/profile"><i class="fas fa-user-circle"></i> 我的</a>
                `;
            } else {
                // 如果用户状态检查失败，可能是因为令牌无效
                if (response.status === 401) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                }
            }
        } catch (error) {
            console.error('检查用户状态失败:', error);
        }
    }
}

// 用户退出
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
}

// 更新购物车数量
async function updateCartCount() {
    const token = localStorage.getItem('token');
    const cartCountElement = document.getElementById('cart-count');
    
    if (token && cartCountElement) {
        try {
            const response = await fetch('/api/cart', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const cart = await response.json();
                const totalItems = cart.items.reduce((total, item) => total + item.quantity, 0);
                cartCountElement.textContent = totalItems;
            }
        } catch (error) {
            console.error('更新购物车数量失败:', error);
        }
    }
}

// 格式化价格
function formatPrice(price) {
    return new Intl.NumberFormat('zh-CN', {
        style: 'currency',
        currency: 'CNY'
    }).format(price);
}

// 格式化日期
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}