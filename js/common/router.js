import { CONFIG } from './config.js';

// 路由管理器
class Router {
    static getCharacterDetail(id) {
        // 当前是静态网站
        if (CONFIG.isStatic) {
            return `character-detail.html?id=${id}`;
        }
        
        // 未来改为动态网站
        return `/characters/${id}`;
    }
    
    static navigateToCharacter(id) {
        const url = this.getCharacterDetail(id);
        window.location.href = url;
    }
    
    static getCurrentCharacterId() {
        if (CONFIG.isStatic) {
            return new URLSearchParams(window.location.search).get('id');
        }
        
        // 未来从路由参数获取
        return window.location.pathname.split('/').pop();
    }
}

// 导出 Router 类
export { Router }; 