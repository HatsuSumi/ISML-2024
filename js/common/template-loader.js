import { CONFIG } from '/ISML-2024/js/common/config.js';

document.addEventListener('DOMContentLoaded', async function() {    
    async function processIncludes() {
        const includes = document.querySelectorAll('include');
        if (includes.length === 0) return;
    
        for (const element of includes) {
            const file = element.getAttribute('src');
    
            try {
                const response = await fetch(file);
                let text = await response.text();
                
                // 创建临时容器解析 HTML
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = text;
                
                // 处理 head 内容
                const headContent = tempDiv.querySelector('head');
                if (headContent) {
                    headContent.childNodes.forEach(node => {
                        if (node.nodeType === 1) {  // 元素节点
                            // 避免重复添加
                            const existingElements = Array.from(document.head.children);
                            const isDuplicate = existingElements.some(el => 
                                el.isEqualNode(node)
                            );
                            
                            if (!isDuplicate) {
                                document.head.appendChild(node.cloneNode(true));
                            }
                        }
                    });
                }
                
                // 插入模板内容
                const bodyContent = tempDiv.querySelector('body');
                element.insertAdjacentHTML('afterend', bodyContent ? bodyContent.innerHTML : text);
                element.remove();
            } catch (error) {
                console.error('include处理失败:', file, error);
            }
        }
    
        // 递归调用，处理嵌套的 include
        await processIncludes();
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
        import { DanmakuGenerator } from '${
            location.hostname === "hatsusumi.github.io"
                ? '/ISML-2024/js/common/danmaku-generator.js'
                : danmakuPath
        }';
        
        const container = document.querySelector('.animation-container');
        if (container) {
            new DanmakuGenerator(container);
        } else {
            console.error('找不到弹幕容器!');
        }
    `;
        document.body.appendChild(script);
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
    emailScript.src = "js/common/copy-email.js";
    document.body.appendChild(emailScript);
}); 