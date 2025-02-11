const seasonMap = {
    'winter': 1,
    'spring': 4,
    'summer': 7,
    'autumn': 10
};

const seasonNames = {
    'winter': '冬季',
    'spring': '春季',
    'summer': '夏季',
    'autumn': '秋季',
    'total': '全部'
};

document.addEventListener('DOMContentLoaded', async function() {
    let currentPage = 1;
    const pageSize = 20;
    let sortColumn = 'total';
    let sortDirection = 'desc';
    let filteredData = [];
    let originalData = null;
    let previousPage = 1; 
    let matchedIndexes = [];  
    let currentMatchIndex = 0;  
    let matchedCharacters = new Map(); 
    let lastSearchText = '';
    let initialPage = 1;

    // 获取弹窗相关的 DOM 元素
    const modal = document.getElementById('characterModal');
    const modalTitle = document.getElementById('modalTitle');
    const characterList = document.getElementById('characterList');
    const closeBtn = modal.querySelector('.close-btn');

    // 获取筛选条件
    function getFilters() {
        return {
            group: document.querySelector('input[name="group"]:checked').value,
            gender: Array.from(document.querySelectorAll('input[name="gender"]:checked')).map(cb => cb.value),
            seasons: Array.from(document.querySelectorAll('input[name="season"]:checked')).map(cb => cb.value),
            status: Array.from(document.querySelectorAll('input[name="status"]:checked')).map(cb => cb.value)
        };
    }

    // 过滤角色数据
    function filterCharacters(data, filters) {
        let characters = [];
        
        if (filters.group === 'stellar') {
            filters.gender.forEach(gender => {
                if (data.stellar[gender]) {
                    characters = characters.concat(
                        data.stellar[gender].map(char => ({
                            ...char,
                            gender: gender
                        }))
                    );
                }
            });
        } else {
            filters.seasons.forEach(season => {
                filters.gender.forEach(gender => {
                    if (data.nova[season]?.[gender]) {
                        characters = characters.concat(
                            data.nova[season][gender].map(char => ({
                                ...char,
                                gender: gender,
                                season: season
                            }))
                        );
                    }
                });
            });
        }

        return characters.filter(char => {
            if (filters.status.length === 0) return true;
            return filters.status.includes(char.status === '晋级' ? 'advance' : 'eliminate');
        });
    }

    // 获取年份统计数据
    function getYearStats(characters) {
        const yearMap = new Map();
        let totalCharacters = 0;

        characters.forEach(char => {
            if (!char.ip_year) return;  

            totalCharacters++;
            const year = char.ip_year;
            const season = char.ip_season;

            const yearData = yearMap.get(year) || {
                year: year,
                winter: 0,
                spring: 0,
                summer: 0,
                autumn: 0,
                total: 0,
                characters: new Map() 
            };

            // 根据季节增加计数
            switch(season) {
                case 1: yearData.winter++; break;
                case 4: yearData.spring++; break;
                case 7: yearData.summer++; break;
                case 10: yearData.autumn++; break;
            }

            // 更新总数
            yearData.total++;

            // 按季节存储角色
            const seasonKey = season === 1 ? 'winter' : 
                            season === 4 ? 'spring' : 
                            season === 7 ? 'summer' : 'autumn';
            
            if (!yearData.characters.has(seasonKey)) {
                yearData.characters.set(seasonKey, []);
            }
            yearData.characters.get(seasonKey).push(char);

            yearMap.set(year, yearData);
        });

        return Array.from(yearMap.values()).map(year => ({
            ...year,
            percentage: ((year.total / totalCharacters) * 100).toFixed(1) + '%'
        }));
    }

    // 排序数据
    function sortData(data) {
        return data.sort((a, b) => {
            let aValue = a[sortColumn];
            let bValue = b[sortColumn];

            if (sortColumn === 'percentage') {
                aValue = parseFloat(aValue);
                bValue = parseFloat(bValue);
            }

            return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
        });
    }

    // 更新表格
    function updateTable() {
        const tbody = document.querySelector('#yearTable tbody');
        const start = (currentPage - 1) * pageSize;
        const paginatedData = filteredData.slice(start, start + pageSize);

        tbody.innerHTML = paginatedData.map(year => `
            <tr>
                <td>${year.year}</td>
                <td ${year.winter > 0 ? `onclick="showCharacterDetails(${year.year}, 'winter')"` : ''} 
                    data-value="${year.winter}">${year.winter || 0}</td>
                <td ${year.spring > 0 ? `onclick="showCharacterDetails(${year.year}, 'spring')"` : ''} 
                    data-value="${year.spring}">${year.spring || 0}</td>
                <td ${year.summer > 0 ? `onclick="showCharacterDetails(${year.year}, 'summer')"` : ''} 
                    data-value="${year.summer}">${year.summer || 0}</td>
                <td ${year.autumn > 0 ? `onclick="showCharacterDetails(${year.year}, 'autumn')"` : ''} 
                    data-value="${year.autumn}">${year.autumn || 0}</td>
                <td ${year.total > 0 ? `onclick="showCharacterDetails(${year.year}, 'total')"` : ''} 
                    data-value="${year.total}">${year.total}</td>
                <td>${year.percentage}</td>
            </tr>
        `).join('');

        updatePagination();
    }

    // 更新分页
    function updatePagination() {
        const totalPages = Math.ceil(filteredData.length / pageSize);
        const pagination = document.createElement('div');
        pagination.className = 'pagination';

        pagination.innerHTML = `
            <button ${currentPage === 1 ? 'disabled' : ''} onclick="changePage(1)">首页</button>
            <button ${currentPage === 1 ? 'disabled' : ''} onclick="changePage(${currentPage - 1})">上一页</button>
            <span>第 ${currentPage} / ${totalPages} 页</span>
            <button ${currentPage === totalPages ? 'disabled' : ''} onclick="changePage(${currentPage + 1})">下一页</button>
            <button ${currentPage === totalPages ? 'disabled' : ''} onclick="changePage(${totalPages})">末页</button>
        `;

        const tableSection = document.querySelector('.table-section');
        const oldPagination = tableSection.querySelector('.pagination');
        if (oldPagination) {
            tableSection.removeChild(oldPagination);
        }
        tableSection.appendChild(pagination);
    }

    // 切换页码
    window.changePage = function(page) {
        currentPage = page;
        updateTable();
    };

    // 初始化表格
    async function initTable() {
        try {
            const response = await fetch('../../../data/statistics/nomination-stats.json');
            originalData = await response.json();
            
            // 添加事件监听
            document.querySelectorAll('input[name="group"]').forEach(radio => {
                radio.addEventListener('change', function() {
                    const novaFilters = document.getElementById('nova-filters');
                    novaFilters.classList.toggle('hidden', this.value !== 'nova');
                    updateFilters();
                });
            });

            document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
                checkbox.addEventListener('change', updateFilters);
            });

            document.querySelectorAll('th[data-column]').forEach(th => {
                th.addEventListener('click', () => {
                    const column = th.dataset.column;
                    if (sortColumn === column) {
                        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
                    } else {
                        sortColumn = column;
                        sortDirection = 'desc';
                    }
                    
                    document.querySelectorAll('th').forEach(header => {
                        header.classList.remove('sort-asc', 'sort-desc');
                    });
                    th.classList.add(`sort-${sortDirection}`);

                    // 先清空搜索框
                    if (lastSearchText) {
                        searchInput.value = '';
                        clearHighlights();  // 确保清除高亮和计数
                    }
                    
                    // 最后填充搜索文本
                    if (lastSearchText) {
                        setTimeout(() => {
                            searchInput.value = lastSearchText;
                            // 不要触发新的搜索
                        }, 100);
                    }

                    // 排序时更新 previousPage 为初始页码
                    previousPage = initialPage;

                    updateFilters();
                });
            });

            // 搜索功能
            const searchInput = document.getElementById('searchInput');
            const searchBtn = document.getElementById('searchBtn');

            // 将 handleSearch 函数移到外面，并修改搜索逻辑顺序
            function handleSearch() {
                // 1. 先记录当前页码
                previousPage = currentPage;
                
                // 2. 执行搜索（不要更新筛选）
                searchAndHighlight();
            }

            searchBtn.addEventListener('click', handleSearch);

            // 修改回车键事件也使用 handleSearch
            searchInput.addEventListener('keyup', e => {
                if (e.key === 'Enter') {
                    if (matchedIndexes.length === 0) {
                        // 新搜索时使用 handleSearch
                        handleSearch();
                    } else {
                        // 已有结果时切换到下一个
                        if (e.shiftKey) {
                            currentMatchIndex = (currentMatchIndex - 1 + matchedIndexes.length) % matchedIndexes.length;
                        } else {
                            currentMatchIndex = (currentMatchIndex + 1) % matchedIndexes.length;
                        }
                        searchAndHighlight(true);
                    }
                }
            });

            // 添加 input 事件处理
            searchInput.addEventListener('input', e => {
                if (e.target.value === '') {
                    clearHighlights();
                    matchedIndexes = [];
                    currentMatchIndex = 0;
                    // 清空搜索时回到之前的页面
                    if (currentPage !== previousPage) {
                        currentPage = previousPage;
                        updateTable();
                    }
                    lastSearchText = '';
                    updateFilters();
                }
            });

            updateFilters();
        } catch (error) {
            console.error('Error loading data:', error);
        }
    }

    // 更新筛选结果
    function updateFilters() {
        const filters = getFilters();
        const searchValue = document.getElementById('searchInput').value.toLowerCase();
        
        const characters = filterCharacters(originalData, filters);
        let yearStats = getYearStats(characters);
        
        // 不再在这里筛选数据，保留所有数据
        filteredData = sortData(yearStats);
        updateTable();
    }

    // 显示角色详情
    async function showCharacterDetails(year, season) {
        const filters = getFilters();
        const characters = filterCharacters(originalData, filters);
        
        let seasonCharacters;
        if (season === 'total') {
            // 如果是总计列，显示该年份所有季节的角色
            seasonCharacters = characters.filter(char => 
                char.ip_year === year
            );
        } else {
            // 如果是季节列，只显示该季节的角色
            seasonCharacters = characters.filter(char => 
                char.ip_year === year && 
                char.ip_season === seasonMap[season]
            );
        }

        modalTitle.textContent = `${year}年${season === 'total' ? '全部' : seasonNames[season]}角色列表`;

        const existingLegend = document.querySelector('.status-legend');
        if (existingLegend) {
            existingLegend.remove();
        }

        // 添加图例说明
        const legendHtml = `
            <div class="status-legend">
                <div class="legend-item">
                    <span class="legend-color promoted"></span>
                    <span class="legend-text">晋级</span>
                </div>
                <div class="legend-item">
                    <span class="legend-color eliminated"></span>
                    <span class="legend-text">未晋级</span>
                </div>
            </div>
        `;

        modalTitle.insertAdjacentHTML('afterend', legendHtml);

        characterList.innerHTML = seasonCharacters.map((char, index) => `
            <li style="transition-delay: ${0.1 + index * 0.05}s"
                class="${char.status === '晋级' ? 'promoted' : 'eliminated'}">
                ${char.avatar ? `<img src="${char.avatar}" class="character-avatar" alt="${char.name}">` : 
                              '<div class="character-avatar"></div>'}
                <div class="character-info">
                    <div class="character-name">${char.name}</div>
                    <div class="ip-info">${char.ip}</div>
                    ${char.cv ? `<div class="character-cv">CV: ${char.cv}</div>` : ''}
                    ${char.votes === '-' ? 
                        '<div class="auto-promote">自动晋级</div>' : 
                        `<div class="character-votes">提名得票数: ${char.votes}</div>`
                    }
                </div>
            </li>
        `).join('');

        modal.style.display = 'block';
        modal.offsetHeight;
        modal.classList.add('show');
    }

    // 关闭弹窗
    function closeModal() {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }

    // 点击关闭按钮关闭弹窗
    closeBtn.addEventListener('click', closeModal);

    // 点击弹窗外部关闭弹窗
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });

    // 将 showCharacterDetails 函数添加到全局作用域
    window.showCharacterDetails = showCharacterDetails;

    // 清理搜索文本，移除标点符号和括号
    function cleanSearchText(text) {
        return text.toLowerCase()
            .replace(/[（）()[\]【】「」『』《》〈〉""'']/g, '')  
            .replace(/[、，。！？：；]/g, '')  
            .replace(/[.,!?:;]/g, '') 
            .replace(/\s+/g, '');  
    }

    // 修改搜索逻辑
    function matchYearName(year, searchText, characters) {
        // 清理年份
        const cleanedYear = cleanSearchText(year.toString());
        
        // 直接匹配年份
        if (cleanedYear.includes(searchText)) {
            matchedCharacters.set(year, null); // null 表示整行高亮
            return true;
        }

        // 检查角色名
        const matchedChar = characters.find(char => 
            char.ip_year === year && cleanSearchText(char.name).includes(searchText)
        );
        if (matchedChar) {
            matchedCharacters.set(year, {
                gender: matchedChar.gender,
                season: matchedChar.ip_season === 1 ? 'winter' :
                        matchedChar.ip_season === 4 ? 'spring' :
                        matchedChar.ip_season === 7 ? 'summer' : 'autumn',
                name: matchedChar.name
            });
            return true;
        }

        return false;
    }

    // 修改 clearHighlights 函数
    function clearHighlights() {
        document.querySelectorAll('.highlight').forEach(el => {
            el.classList.remove('highlight');
        });
        matchedCharacters.clear();
        currentMatchIndex = 0;
        // 清除搜索计数显示
        const searchCount = document.querySelector('.search-count');
        searchCount.textContent = '';
        searchCount.classList.remove('no-results');
        searchCount.style.display = 'none';
    }

    // 修改搜索函数
    function searchAndHighlight(moveToNext = false) {
        const searchText = cleanSearchText(document.getElementById('searchInput').value);
        lastSearchText = searchText;

        if (!searchText) {
            clearHighlights();
            // 清空搜索时回到之前的页面
            if (currentPage !== previousPage) {
                currentPage = previousPage;
                updateTable();
            }
            return;
        }

        // 获取当前筛选条件下的所有角色
        const filters = getFilters();
        const characters = filterCharacters(originalData, filters);

        // 重置匹配记录
        matchedCharacters.clear();

        // 在所有数据中查找所有匹配项
        const sortedData = sortData(filteredData);
        matchedIndexes = sortedData.reduce((acc, item, index) => {
            if (matchYearName(item.year, searchText, characters)) {
                acc.push(index);
            }
            return acc;
        }, []);

        if (matchedIndexes.length > 0) {
            // 处理切换到下一个匹配项
            if (moveToNext) {
                currentMatchIndex = (currentMatchIndex + 1) % matchedIndexes.length;
            } else {
                currentMatchIndex = 0;
            }

            const currentIndex = matchedIndexes[currentMatchIndex];
            const targetPage = Math.floor(currentIndex / pageSize) + 1;
            currentPage = targetPage;
            updateTable();

            // 更新搜索计数
            updateSearchCount(currentMatchIndex + 1, matchedIndexes.length);

            // 等待表格更新完成后高亮匹配项
            setTimeout(() => {
                const rows = document.querySelectorAll('#yearTable tbody tr');
                matchedIndexes.forEach(index => {
                    if (Math.floor(index / pageSize) + 1 === currentPage) {
                        const targetIndex = index % pageSize;
                        const row = rows[targetIndex];
                        if (row) {
                            const year = sortedData[index].year;
                            const matchInfo = matchedCharacters.get(year);
                            
                            if (matchInfo === null) {
                                // 年份匹配，整行高亮
                                row.classList.add('highlight');
                            } else {
                                // 角色名匹配，只高亮年份列和对应季节列
                                const cells = row.cells;
                                cells[0].classList.add('highlight'); // 年份列
                                
                                // 根据季节选择正确的列
                                const seasonMap = {
                                    'winter': 1,
                                    'spring': 2,
                                    'summer': 3,
                                    'autumn': 4
                                };
                                const seasonColumn = seasonMap[matchInfo.season];
                                if (seasonColumn) {
                                    cells[seasonColumn].classList.add('highlight');
                                }
                            }
                        }
                    }
                });

                // 滚动到当前匹配项
                const currentRow = rows[currentIndex % pageSize];
                if (currentRow) {
                    currentRow.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center'
                    });
                }
            }, 100);
        } else {
            clearHighlights();
            // 修改这里：直接使用 clearHighlights 而不是 updateSearchCount
            const searchCount = document.querySelector('.search-count');
            searchCount.textContent = '0/0';
            searchCount.classList.add('no-results');
            searchCount.style.display = 'inline';
        }
    }

    // 修改 updateSearchCount 函数
    function updateSearchCount(current, total) {
        const searchCount = document.querySelector('.search-count');
        if (!document.getElementById('searchInput').value.trim()) {
            // 如果搜索框为空，清除计数显示
            searchCount.textContent = '';
            searchCount.classList.remove('no-results');
            searchCount.style.display = 'none';
        } else if (total > 0) {
            // 有搜索结果
            searchCount.textContent = `${current}/${total}`;
            searchCount.classList.remove('no-results');
            searchCount.style.display = 'inline';
        } else {
            // 无搜索结果
            searchCount.textContent = '0/0';
            searchCount.classList.add('no-results');
            searchCount.style.display = 'inline';
        }
    }

    // 初始化
    initTable();
    document.querySelector(`th[data-column="${sortColumn}"]`)?.classList.add(`sort-${sortDirection}`);
});