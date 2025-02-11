import { CONFIG } from './config.js';

document.addEventListener('DOMContentLoaded', async function() {
    const depth = location.pathname.split('/').slice(1, -1).length;
    const pathToRoot = depth === 0 ? '.' : Array(depth).fill('..').join('/');
    const basePath = pathToRoot + '/';
    
    // 辅助函数：构建资源路径
    function getResourcePath(path) {
        return basePath + path;
    }

    async function processSpecialComponents() {
        // 检查弹幕功能是否开启
        if (!CONFIG.features.danmaku) {
            return;
        }

        // 添加复制提示框
        const copyTip = document.createElement('div');
        copyTip.className = 'copy-tip';
        copyTip.textContent = '复制成功';
        document.body.appendChild(copyTip);

        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = getResourcePath('css/common/animation-container.css');
        document.head.appendChild(link);
        
        // 创建弹幕容器
        const container = document.createElement('div');
        container.className = 'animation-container';
        document.body.appendChild(container);

        const script = document.createElement('script');
        script.type = 'module';
        const danmakuPath = getResourcePath('js/common/danmaku-generator.js');

        script.textContent = `
            import { DanmakuGenerator } from '${danmakuPath}';
            
            const container = document.querySelector('.animation-container');
            if (container) {
                new DanmakuGenerator(container);
            } else {
                console.error('找不到弹幕容器!');
            }
        `;
        document.body.appendChild(script);
    }

    async function processIncludes() {
        const includes = document.querySelectorAll('include');

        if (includes.length === 0) return;

        for (const element of includes) {
            const file = element.getAttribute('src');

            try {
                const filePath = getResourcePath(file);
                const response = await fetch(filePath);
                let text = await response.text();
                
                // 替换基础路径和配置值
                text = text
                    .replace(/\{\{basePath\}\}/g, pathToRoot + '/')
                    .replace(/\{\{defaultInterval\}\}/g, (CONFIG.danmaku.interval / 1000 / 60).toFixed(1))
                    .replace(/\{\{minSpeed\}\}/g, CONFIG.danmaku.minSpeed)
                    .replace(/\{\{maxSpeed\}\}/g, CONFIG.danmaku.maxSpeed)
                    .replace(/\{\{defaultSpeed\}\}/g, CONFIG.danmaku.speed);
                
                // 如果是导航栏，检查是否需要移除弹幕设置
                if (file.includes('navbar.html')) {
                    if (!CONFIG.features.danmaku) {
                        const tempDiv = document.createElement('div');
                        tempDiv.innerHTML = text;
                        const danmakuSettings = tempDiv.querySelector('.danmaku-settings-container');
                        if (danmakuSettings) {
                            danmakuSettings.remove();
                        }
                        text = tempDiv.innerHTML;
                    }
                }
                
                element.insertAdjacentHTML('afterend', text);
                element.remove();
               
                if (file.includes('navbar.html')) {
                    setActiveNavLink();
                }
            } catch (error) {
                console.error('include处理失败:', filePath, error);
            }
        }
        
        await processIncludes();
    }

    // 从navbar.js移过来的设置高亮函数
    function setActiveNavLink() {
        const currentPath = window.location.pathname;
        const navLinks = document.querySelectorAll('.nav-links a');
        
        const pageMap = {
            '/index.html': 'home',
            '/events-data/': 'events-data',
            '/visualization/': 'events-data',
            '/tables/': 'events-data',
            '/comparison/': 'comparison',
            '/gallery/': 'gallery',
            '/about/': 'about',
            '/schedule/': 'schedule',
            '/statistics/': 'statistics',
            '/characters-data/': 'characters-data',
        };
        
        navLinks.forEach(link => {
            for (const [path, page] of Object.entries(pageMap)) {
                if ((currentPath === '/' || currentPath === '/index.html') && page === 'home' || 
                    currentPath.includes(path)) {
                    if (link.dataset.page === page) {
                        link.classList.add('active');
                        break;
                    }
                }
            }
        });
    }

    await processIncludes();
    await processSpecialComponents();

    const emailScript = document.createElement('script');
    emailScript.src = basePath + 'js/common/copy-email.js';
    document.body.appendChild(emailScript);
}); 