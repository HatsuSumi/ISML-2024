import { SERIES_ALIASES } from '/ISML-2024/js/aliases/aliases.js';

document.addEventListener('DOMContentLoaded', () => {
    initializeTabs();
    loadCharacterData();
    initializeSearch();
    initStatusFilter();
});

function initializeTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', handleTabClick);
    });
}

function handleTabClick(e) {
    const btn = e.currentTarget;
    const buttonGroup = btn.closest('.tab-buttons');
    const tabContainer = btn.closest('.tab-container');
    const panelsContainer = tabContainer.nextElementSibling;
    
    buttonGroup.querySelectorAll('.tab-btn').forEach(b => {
        b.classList.remove('active');
    });
    btn.classList.add('active');
    
    const group = btn.dataset.group;
    const season = btn.dataset.season;
    const gender = btn.dataset.gender;
    
    const panelId = season ? 
        `nova-${season}-${gender}` : 
        `stellar-${gender}`;
    
    updatePanels(panelsContainer, panelId);
}

function updatePanels(container, targetId) {
    const panels = container.querySelectorAll('.character-panel');
    panels.forEach(panel => {
        if (panel.id === targetId) {
            panel.classList.add('active');
            // 先移除所有卡片的 loaded 类
            const cards = panel.querySelectorAll('.character-card');
            cards.forEach(card => {
                card.classList.remove('loaded');
            });
            
            // 立即调整布局，然后再执行动画
            requestAnimationFrame(() => {
                adjustCardLayout();  // 先调整布局
                // 强制重排
                void panel.offsetHeight;
                // 添加 loaded 类触发动画
                cards.forEach(card => {
                    card.classList.add('loaded');
                });
            });
        } else {
        panel.classList.remove('active');
        }
    });
}

// 添加全局变量
let characterData = null;

async function loadCharacterData() {
    showLoading();
    try {
        const response = await fetch("/data/characters/stats/ISML2024-characters.json");
        const data = await response.json();
        
        // 过滤掉未晋级的角色
        const filteredData = {
            stellar: {
                female: data.stellar.female.filter(char => char.status !== '未晋级'),
                male: data.stellar.male.filter(char => char.status !== '未晋级')
            },
            nova: {
                winter: {
                    female: data.nova.winter.female.filter(char => char.status !== '未晋级'),
                    male: data.nova.winter.male.filter(char => char.status !== '未晋级')
                },
                spring: {
                    female: data.nova.spring.female.filter(char => char.status !== '未晋级'),
                    male: data.nova.spring.male.filter(char => char.status !== '未晋级')
                },
                summer: {
                    female: data.nova.summer.female.filter(char => char.status !== '未晋级'),
                    male: data.nova.summer.male.filter(char => char.status !== '未晋级')
                },
                autumn: {
                    female: data.nova.autumn.female.filter(char => char.status !== '未晋级'),
                    male: data.nova.autumn.male.filter(char => char.status !== '未晋级')
                }
            }
        };
        
        // 保存到全局变量
        characterData = filteredData;
        
        renderStellarCharacters(filteredData.stellar);
        renderNovaCharacters(filteredData.nova);
        
        requestAnimationFrame(() => {
            adjustCardLayout();
            observeImages();
            animateCards();
            hideLoading();
            // 隐藏加载提示
            const loadingTip = document.querySelector('.loading-tip');
            if (loadingTip) {
                loadingTip.classList.add('hidden');
            }
        });
        
    } catch (error) {
        console.error('加载角色数据失败:', error);
        hideLoading();
        // 显示错误提示
        const loadingTip = document.querySelector('.loading-tip');
        if (loadingTip) {
            loadingTip.textContent = '加载失败，请刷新页面重试';
        }
    }
}

function renderStellarCharacters(data) {
    const femalePanel = document.getElementById('stellar-female');
    const malePanel = document.getElementById('stellar-male');
    
    // 显示所有角色
    if (femalePanel) {
        const allFemaleChars = data.female;  
        femalePanel.innerHTML = allFemaleChars.map(char => createCharacterCard(char)).join('');
        requestAnimationFrame(() => {
            const cards = femalePanel.querySelectorAll('.character-card');
            void femalePanel.offsetHeight;
            cards.forEach(card => card.classList.add('loaded'));
        });
    }
    
    if (malePanel) {
        const allMaleChars = data.male;  
        malePanel.innerHTML = allMaleChars.map(char => createCharacterCard(char)).join('');
        requestAnimationFrame(() => {
            const cards = malePanel.querySelectorAll('.character-card');
            void malePanel.offsetHeight;
            cards.forEach(card => card.classList.add('loaded'));
        });
    }
}

function renderNovaCharacters(data) {
    const seasons = ['winter', 'spring', 'summer', 'autumn'];
    
    seasons.forEach(season => {
        const femalePanel = document.getElementById(`nova-${season}-female`);
        if (femalePanel && data[season] && data[season].female) {
            // 过滤掉未晋级的角色
            const advancedFemales = data[season].female.filter(char => char.status !== '未晋级');
            femalePanel.innerHTML = advancedFemales.map(char => createCharacterCard(char, true)).join('');
            // 等待DOM更新
            requestAnimationFrame(() => {
                const cards = femalePanel.querySelectorAll('.character-card');
                void femalePanel.offsetHeight;
                cards.forEach(card => card.classList.add('loaded'));
            });
        }
        
        const malePanel = document.getElementById(`nova-${season}-male`);
        if (malePanel && data[season] && data[season].male) {
            // 过滤掉未晋级的角色
            const advancedMales = data[season].male.filter(char => char.status !== '未晋级');
            malePanel.innerHTML = advancedMales.map(char => createCharacterCard(char, false)).join('');
            // 等待DOM更新
            requestAnimationFrame(() => {
                const cards = malePanel.querySelectorAll('.character-card');
                void malePanel.offsetHeight;
                cards.forEach(card => card.classList.add('loaded'));
            });
        }
    });
}

function createCharacterCard(character) {
    return `
        <div class="character-card">
            ${character.avatar ? `
                <div class="character-image-container">
                    <img class="character-image" 
                         loading="lazy"
                         src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
                         data-src="${character.avatar}"
                         alt="${character.name}"
                         onload="this.src=this.dataset.src;this.parentElement.classList.remove('loading')"
                         onerror="this.parentElement.classList.add('error')">
                </div>
            ` : ''}
            <div class="character-info">
                <div class="character-name">${character.name}</div>
                <div class="character-series">${character.ip}</div>
                ${character.cv ? `<div class="character-cv">CV: ${character.cv}</div>` : ''}
                ${character.status ? `<div class="character-status ${
                    character.status.includes('晋级') ? 'promoted' : 
                    character.status.includes('淘汰') || character.status.includes('止步') ? 'eliminated' : 
                    'pending'
                }">${character.status}</div>` : ''}
            </div>
        </div>
    `;
}

// 添加图片观察器
function observeImages() {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                observer.unobserve(img);
            }
        });
    });

    document.querySelectorAll('.character-image[data-src]').forEach(img => {
        imageObserver.observe(img);
    });
}

// 根据屏幕宽度动态调整卡片布局
function adjustCardLayout() {
    const contentWidth = document.querySelector('.tournament-section').offsetWidth;
    
    const activePanels = document.querySelectorAll('.character-panel.active');
    let minCardWidth, gap;
    
    // 根据内容区域宽度优化卡片大小和间距
    if (contentWidth >= 2200) {
        minCardWidth = '190px';  // 11-12列
        gap = '1.1rem';
    } else if (contentWidth >= 1800) {
        minCardWidth = '175px';  // 9-10列
        gap = '1rem';
    } else if (contentWidth >= 1400) {
        minCardWidth = '165px';  // 7-8列
        gap = '0.9rem';
    } else if (contentWidth >= 1000) {
        minCardWidth = '155px';  // 5-6列
        gap = '0.8rem';
    } else {
        minCardWidth = '145px';  // 3-4列
        gap = '0.7rem';
    }
    
    activePanels.forEach(panel => {
        // 计算理想的列数
        const availableWidth = panel.offsetWidth;
        const cardWidth = parseInt(minCardWidth);
        const gapWidth = parseFloat(gap) * 16;
        const idealColumns = Math.floor((availableWidth + gapWidth) / (cardWidth + gapWidth));
        
        // 根据理想列数反向计算实际卡片宽度
        const actualCardWidth = Math.floor((availableWidth - (idealColumns - 1) * gapWidth) / idealColumns);
        
        // 使用计算出的实际宽度
        panel.style.gridTemplateColumns = `repeat(${idealColumns}, ${actualCardWidth}px)`;
        panel.style.gap = gap;
        panel.style.justifyContent = 'center';  // 居中显示
        
    });
}

// 添加防抖函数
function debounce(func, wait) {
    let timeout;
    return function executedFunction() {
        const context = this;
        const args = arguments;
        
        const later = function() {
            timeout = null;
            func.apply(context, args);
        };
        
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 优化调整布局函数
const debouncedAdjustLayout = debounce(adjustCardLayout, 250);

// 修改事件监听
window.removeEventListener('resize', adjustCardLayout);  // 移除原有监听
window.addEventListener('resize', debouncedAdjustLayout);

// 添加加载状态
function showLoading() {
    const loader = document.createElement('div');
    loader.className = 'loading-container';
    loader.innerHTML = '<div class="loading-spinner"></div>';
    document.body.appendChild(loader);
}

function hideLoading() {
    const loader = document.querySelector('.loading-container');
    if (loader) {
        loader.remove();
    }
}

// 修改动画函数
function animateCards() {
    const cards = document.querySelectorAll('.character-card:not(.loaded)');
    
    cards.forEach(card => {
        // 强制重排
        void card.offsetHeight;
        // 添加 loaded 类触发动画
        card.classList.add('loaded');
    });
}

function initializeSearch() {
    const searchContainer = document.querySelector('.search-container');
    const searchIcon = document.querySelector('.search-icon');
    const searchInput = document.getElementById('searchInput');
    
    // 添加回车键搜索
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && searchInput.value.trim()) {
            e.preventDefault();  // 阻止默认行为
            performSearch();
        }
    });
    
    // 修改点击页面任意位置收起搜索框的逻辑
    document.addEventListener('click', (e) => {
        // 如果点击的不是搜索相关的元素，则收起搜索框
        if (!searchContainer.contains(e.target) && 
            searchContainer.classList.contains('expanded')) {
            // 移除判断搜索框是否为空的条件
            searchContainer.classList.remove('expanded');
        }
    });
    
    // 阻止搜索框内的点击事件冒泡
    searchContainer.addEventListener('click', (e) => {
        e.stopPropagation();
    });
    
    // 修改点击事件处理
    const handleIconClick = () => {
        if (searchContainer.classList.contains('expanded')) {
            if (searchInput.value.trim()) {
                performSearch();
            } else {
                searchContainer.classList.remove('expanded');
            }
        } else {
            searchContainer.classList.add('expanded');
            searchInput.focus();
        }
    };
    
    searchIcon.addEventListener('click', handleIconClick);
    
    // 阻止选项面板的点击事件冒泡
    document.querySelectorAll('.search-options, .group-options').forEach(panel => {
        panel.addEventListener('mousedown', (e) => {
            e.preventDefault();  // 阻止失焦
        });
    });
    
    const searchOptions = document.querySelectorAll('.search-options input');
    const groupOptions = document.querySelectorAll('.group-options input');
    
    // 添加组选项联动
    document.querySelector('input[value="stellar"]').addEventListener('change', e => {
        const subOptions = document.querySelectorAll('.stellar-options input');
        subOptions.forEach(opt => opt.checked = e.target.checked);
    });
    
    document.querySelector('input[value="nova"]').addEventListener('change', e => {
        const subOptions = document.querySelectorAll('.nova-options input');
        subOptions.forEach(opt => opt.checked = e.target.checked);
    });
    
    // 添加季节选项联动
    ['winter', 'spring', 'summer', 'autumn'].forEach(season => {
        const seasonCheckbox = document.querySelector(`input[value="${season}"]`);
        seasonCheckbox.addEventListener('change', e => {
            const genderOptions = document.querySelectorAll(`.gender-options input[value^="${season}"]`);
            genderOptions.forEach(opt => opt.checked = e.target.checked);
        });
    });
    
    function performSearch() {
        const keyword = searchInput.value.toLowerCase();
        if (!keyword) {
            showAllCharacters();
            return;
        }
        
        const searchConfig = {
            fields: ['name', 'ip', 'cv', 'status'],  
            stellar: {
                female: document.querySelector('input[value="stellar-female"]').checked,
                male: document.querySelector('input[value="stellar-male"]').checked
            },
            nova: {
                winter: {
                    female: document.querySelector('input[value="winter-female"]').checked,
                    male: document.querySelector('input[value="winter-male"]').checked
                },
                spring: {
                    female: document.querySelector('input[value="spring-female"]').checked,
                    male: document.querySelector('input[value="spring-male"]').checked
                },
                summer: {
                    female: document.querySelector('input[value="summer-female"]').checked,
                    male: document.querySelector('input[value="summer-male"]').checked
                },
                autumn: {
                    female: document.querySelector('input[value="autumn-female"]').checked,
                    male: document.querySelector('input[value="autumn-male"]').checked
                }
            }
        };
        
        const results = searchCharacters(keyword, searchConfig);
        displaySearchResults(results);
    }
    
    searchInput.addEventListener('input', debounce(performSearch, 300));
    groupOptions.forEach(opt => opt.addEventListener('change', performSearch));
}

function searchCharacters(keyword, searchConfig) {
    
    const results = {
        stellar: [],
        nova: {}
    };
    
    // 搜索恒星组
    if (searchConfig.stellar.female || searchConfig.stellar.male) {
        if (searchConfig.stellar.female) {
            characterData.stellar.female.forEach(char => {
                if (matchesSearch(char, keyword, searchConfig.fields)) {
                    results.stellar.push(char);
                }
            });
        }
        if (searchConfig.stellar.male) {
            characterData.stellar.male.forEach(char => {
                if (matchesSearch(char, keyword, searchConfig.fields)) {
                    results.stellar.push(char);
                }
            });
        }
    }
    
    // 搜索新星组
    const seasons = ['winter', 'spring', 'summer', 'autumn'];
    seasons.forEach(season => {
        if (searchConfig.nova[season].female || searchConfig.nova[season].male) {
            results.nova[season] = [];
            if (searchConfig.nova[season].female) {
                characterData.nova[season].female.forEach(char => {
                    if (matchesSearch(char, keyword, searchConfig.fields)) {
                        results.nova[season].push(char);
                    }
                });
            }
            if (searchConfig.nova[season].male) {
                characterData.nova[season].male.forEach(char => {
                    if (matchesSearch(char, keyword, searchConfig.fields)) {
                        results.nova[season].push(char);
                    }
                });
            }
        }
    });
    
    return results;
}

// 标准化作品名称
function normalizeSeriesName(name) {
    for (const [originalName, aliases] of Object.entries(SERIES_ALIASES)) {
        if (aliases.includes(name)) {
            return originalName;
        }
    }
    return name;
}

function matchesSearch(character, keyword, fields) {
    const keywords = keyword
        .split(/[,，\s]+/)
        .map(k => k.trim())
        .filter(k => k.length > 0);
    
    const exactMatch = document.getElementById('exactMatch').checked;
    
    return keywords.some(kw => {
        const matchesAnyField = fields.some(field => {
            const value = (character[field] || '').toLowerCase();
            const aliases = field === 'ip' ? 
                [value, ...Object.entries(SERIES_ALIASES)
                    .find(([original]) => original === value)?.[1] || []] : [value];
            
            const simpleAliases = aliases.map(a => a.toLowerCase().replace(/[!！?？.。,，\s]+/g, ''));
            const simpleKeyword = kw.replace(/[!！?？.。,，\s]+/g, '');
            
            if (exactMatch) {
                return simpleAliases.some(alias => alias === simpleKeyword);
            } else {
                return simpleAliases.some(alias => alias.includes(simpleKeyword));
            }
        });
        return matchesAnyField;
    });
}

// 添加显示所有角色的函数
function showAllCharacters() {
    const container = document.querySelector('.search-results-container');
    const tournamentSection = document.querySelector('.tournament-section');
    
    container.classList.remove('visible');
    setTimeout(() => {
        container.style.display = 'none';
        tournamentSection.style.display = 'block';
        adjustCardLayout();
    }, 300);
}

function displaySearchResults(results) {
    let container = document.querySelector('.search-results-container');
    const tournamentSection = document.querySelector('.tournament-section');
    
    // 计算总结果数
    let totalResults = 0;
    if (results.stellar.length > 0) {
        totalResults += results.stellar.length;
    }
    const seasons = ['winter', 'spring', 'summer', 'autumn'];
    seasons.forEach(season => {
        if (results.nova[season]?.length > 0) {
            totalResults += results.nova[season].length;
        }
    });
    
    if (totalResults === 0) {
        // 设置无结果样式
        container.classList.add('no-results');
        container.classList.remove('has-results');
        container.innerHTML = `
            <div class="no-results-message">
                未找到匹配的角色
            </div>
        `;
        
        container.style.display = 'block';
        tournamentSection.style.display = 'none';
        
        requestAnimationFrame(() => {
            container.classList.add('visible');
        });
    } else {
        // 设置有结果样式
        container.classList.remove('no-results');
        container.classList.add('has-results');
        // 清空之前的结果
        container.innerHTML = `
            <h2 class="search-results-title">搜索结果</h2>
            <div class="search-results-content">
                <div class="stellar-results"></div>
                <div class="nova-results"></div>
            </div>
        `;
        
        // 获取新的结果容器引用
        const stellarResults = container.querySelector('.stellar-results');
        const novaResults = container.querySelector('.nova-results');
        
        // 显示恒星组结果
        if (results.stellar.length > 0) {
            totalResults += results.stellar.length;
            stellarResults.innerHTML = `
                <div class="results-section">
                    <h3>恒星组 (${results.stellar.length})</h3>
                    <div class="character-panel active">
                        ${results.stellar.map(char => createCharacterCard(char)).join('')}
                    </div>
                </div>
            `;
        }
        
        // 显示新星组结果
        const seasonNames = {
            winter: '冬季',
            spring: '春季',
            summer: '夏季',
            autumn: '秋季'
        };
        
        let novaContent = '';
        seasons.forEach(season => {
            if (results.nova[season]?.length > 0) {
                totalResults += results.nova[season].length;
                novaContent += `
                    <div class="results-section">
                        <h3>新星组 - ${seasonNames[season]} (${results.nova[season].length})</h3>
                        <div class="character-panel active">
                            ${results.nova[season].map(char => createCharacterCard(char)).join('')}
                        </div>
                    </div>
                `;
            }
        });
        novaResults.innerHTML = novaContent;
        
        // 显示结果或无结果提示
        if (totalResults > 0) {
            container.style.display = 'block';
            tournamentSection.style.display = 'none';
            requestAnimationFrame(() => {
                container.classList.add('visible');
                adjustCardLayout();
                observeImages();
                animateCards();
            });
        } else {
            container.style.minHeight = `${placeholderHeight}px`;
            container.innerHTML = `
                <div class="no-results">
                    未找到匹配的角色
                </div>
            `;
            container.style.display = 'block';
            tournamentSection.style.display = 'none';
            requestAnimationFrame(() => {
                container.classList.add('visible');
            });
        }
    }
}

// 添加状态筛选功能
function initStatusFilter() {
    const statusFilters = document.querySelectorAll('.status-filter input[type="checkbox"]');
    
    const filterCards = (division) => {
        const panel = division.querySelector('.character-panel.active');
        const cards = panel.querySelectorAll('.character-card');
        
        const isActive = division.querySelector('input[value="active"]').checked;
        const isEliminated = division.querySelector('input[value="eliminated"]').checked;

        cards.forEach(card => {
            const statusElement = card.querySelector('.character-status');
            const isPromoted = statusElement.classList.contains('promoted');
            const isElim = statusElement.classList.contains('eliminated');
            const isPending = statusElement.classList.contains('pending');
            
            const shouldShow = (isActive && (isPromoted || isPending)) || 
                               (isEliminated && isElim);

            card.removeEventListener('transitionend', card._transitionEndHandler);
            
            if (shouldShow) {
                card.classList.remove('filtered-out');
                card.classList.add('loaded');
                card.style.position = ''; 
            } else {
                card.classList.remove('loaded');
                card.classList.add('filtered-out');
                // 添加过渡结束监听器
                card._transitionEndHandler = () => {
                    card.style.position = 'absolute'; 
                };
                card.addEventListener('transitionend', card._transitionEndHandler, { once: true });
            }
        });
    };

    statusFilters.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const division = this.closest('.division');
            filterCards(division);
            requestAnimationFrame(adjustCardLayout);
        });
    });
}