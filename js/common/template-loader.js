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
                    setActiveNavLink();
                }
                
                // 替换基础路径和配置值
                text = text
                    .replace(/\{\{defaultInterval\}\}/g, (5 / 1000 / 60).toFixed(1))
                    .replace(/\{\{minSpeed\}\}/g, 50)
                    .replace(/\{\{maxSpeed\}\}/g, 200)
                    .replace(/\{\{defaultSpeed\}\}/g, 100);
                
                // 使用正则表达式提取 head 内容
                const headMatch = text.match(/<head>([\s\S]*?)<\/head>/i);
                
                if (headMatch) {
                    const headContent = headMatch[1];
                    
                    // 创建临时 div 解析 head 内容
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = headContent;
                    
                    Array.from(tempDiv.children).forEach(node => {
                        // 特殊处理 favicon
                        if (node.tagName === 'LINK' && node.getAttribute('rel') === 'icon') {
                            // 移除已存在的 favicon
                            const existingFavicon = document.head.querySelector('link[rel="icon"]');
                            if (existingFavicon) {
                                existingFavicon.remove();
                            }
                        }
    
                        // 避免重复添加
                        const existingElements = Array.from(document.head.children);
                        const isDuplicate = existingElements.some(el => 
                            el.isEqualNode(node)
                        );
                        
                        if (!isDuplicate) {
                            document.head.appendChild(node.cloneNode(true));
                        }
                    });
                }
                
                // 插入模板内容
                const bodyMatch = text.match(/<body>([\s\S]*?)<\/body>/i);
                const contentToInsert = bodyMatch ? bodyMatch[1] : text;
                
                element.insertAdjacentHTML('afterend', contentToInsert);
                element.remove();
            } catch (error) {
                console.error('include处理失败:', file, error);
            }
        }
    
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

    function setActiveNavLink() {
        setTimeout(() => {
            const currentPath = window.location.pathname;
            console.log('当前路径:', currentPath);
    
            const navLinks = document.querySelectorAll('a[data-page]');
            console.log('导航链接数量:', navLinks.length);
            
            // 详细的路径匹配规则
            const matchLink = (link) => {
                const page = link.dataset.page;
                const href = link.href;
                
                // 详细日志
                console.log('检查链接:', {
                    href,
                    page,
                    currentPath
                });
    
                // 复杂的匹配逻辑
                const matchConditions = [
                    // 首页匹配
                    page === 'home' && (
                        currentPath === '/' || 
                        currentPath === '/ISML-2024/' || 
                        currentPath.includes('/index.html')
                    ),
                    
                    // Schedule 页面匹配
                    page === 'schedule' && currentPath.includes('/schedule/'),
                    
                    // 其他页面精确匹配
                    page === 'events-data' && currentPath.includes('/events-data/'),
                    page === 'characters-data' && currentPath.includes('/characters-data/'),
                    page === 'gallery' && currentPath.includes('/gallery/'),
                    page === 'about' && currentPath.includes('/about/'),
                    
                    // 下拉菜单特殊处理
                    page === 'schedule' && href.includes('schedule.html')
                ];
    
                const matched = matchConditions.some(condition => condition);
                
                if (matched) {
                    console.log('匹配成功:', {
                        href,
                        page,
                        currentPath
                    });
                }
    
                return matched;
            };
    
            // 先移除所有高亮
            navLinks.forEach(link => link.classList.remove('active'));
    
            // 找到并高亮匹配链接
            const matchedLink = Array.from(navLinks).find(matchLink);
    
            if (matchedLink) {
                console.log('添加高亮:', matchedLink.href);
                matchedLink.classList.add('active');
            } else {
                console.warn('未找到匹配的导航链接');
            }
        }, 100);
    }

    await processIncludes();
    await processSpecialComponents();

    const emailScript = document.createElement('script');
    emailScript.src = "js/common/copy-email.js";
    document.body.appendChild(emailScript);
}); 