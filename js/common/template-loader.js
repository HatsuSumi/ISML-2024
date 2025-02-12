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
            
            const pageMap = {
                '/': 'home',
                '/index.html': 'home',
                '/ISML-2024/': 'home',
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
    
            console.log('页面映射:', pageMap);
            
            // 先移除所有高亮
            navLinks.forEach(link => {
                console.log('重置链接:', link.href, 'data-page:', link.dataset.page);
                link.classList.remove('active');
            });
            
            // 精确匹配
            const matchedLink = Array.from(navLinks).find(link => {
                const page = link.dataset.page;
                
                // 更复杂的匹配逻辑
                const matchConditions = [
                    // 精确路径匹配
                    Object.entries(pageMap).some(([path, mappedPage]) => 
                        currentPath.includes(path) && page === mappedPage
                    ),
                    // 特殊处理 schedule 页面
                    (page === 'schedule' && currentPath.includes('/schedule/') && 
                     link.dataset.page === 'schedule'),
                    // 处理下拉菜单中的 schedule 链接
                    (page === 'schedule' && currentPath.includes('/schedule/') && 
                     link.href.includes('schedule'))
                ];
    
                const isMatched = matchConditions.some(condition => condition);
                
                if (isMatched) {
                    console.log('匹配成功:', {
                        currentPath,
                        linkHref: link.href,
                        linkPage: page
                    });
                }
                
                return isMatched;
            });
    
            // 只高亮一个链接
            if (matchedLink) {
                console.log('添加高亮:', matchedLink.href, 'data-page:', matchedLink.dataset.page);
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