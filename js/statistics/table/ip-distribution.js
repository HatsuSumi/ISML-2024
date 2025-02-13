import { SERIES_ALIASES } from '/ISML-2024/js/aliases/aliases.js';

document.addEventListener('DOMContentLoaded', async function() {
    let currentPage = 1;
    const pageSize = 20;
    let sortColumn = 'total'; 
    let sortDirection = 'desc'; 
    let filteredData = [];
    let originalData = null;  
    let previousPage = 1;  
    let currentMatchIndex = 0;  
    let currentSearchResults = [];
    let lastSearchText = '';
    let initialPage = 1;

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
                                gender: gender
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

    // 统计作品数据
    function getIPStats(characters) {
        const ipMap = new Map();
        
        characters.forEach(char => {
            const ip = normalizeSeriesName(char.ip);
            if (!ipMap.has(ip)) {
                ipMap.set(ip, {
                    name: ip,
                    female: 0,
                    male: 0,
                    total: 0
                });
            }
            ipMap.get(ip)[char.gender]++;
            ipMap.get(ip).total++;
        });

        return Array.from(ipMap.values()).map(({ name, female, male, total }) => ({
            name,
            female,
            male,
            total,
            percentage: ((total / characters.length) * 100).toFixed(1) + '%'
        }));
    }

    // 标准化作品名称
    function normalizeSeriesName(name) {
        // 先检查是否是别名
        for (const [originalName, aliases] of Object.entries(SERIES_ALIASES)) {
            if (aliases.includes(name)) {
                return originalName;
            }
        }
        return name;
    }

    // 排序数据
    function sortData(data) {
        return data.sort((a, b) => {
            let aValue = a[sortColumn];
            let bValue = b[sortColumn];
            
            // 如果是文本列，使用字符串比较
            if (sortColumn === 'name') {
                return sortDirection === 'asc' 
                    ? aValue.localeCompare(bValue)
                    : bValue.localeCompare(aValue);
            }
            
            // 如果是百分比，需要去掉 % 符号再转换为数字
            if (sortColumn === 'percentage') {
                aValue = parseFloat(aValue);
                bValue = parseFloat(bValue);
            }
            
            return sortDirection === 'asc' 
                ? aValue - bValue 
                : bValue - aValue;
        });
    }

    // 更新表格
    function updateTable() {
        const tbody = document.querySelector('#ipTable tbody');
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const pageData = sortData(filteredData).slice(startIndex, endIndex);

        tbody.innerHTML = pageData.map((item, index) => `
            <tr>
                <td>${item.name}</td>
                <td onclick="${item.female > 0 ? `showCharacterDetails('${item.name}', 'female')` : ''}" 
                    data-value="${item.female}">${item.female}</td>
                <td onclick="${item.male > 0 ? `showCharacterDetails('${item.name}', 'male')` : ''}" 
                    data-value="${item.male}">${item.male}</td>
                <td onclick="${item.total > 0 ? `showCharacterDetails('${item.name}', 'total')` : ''}" 
                    data-value="${item.total}">${item.total}</td>
                <td>${item.percentage}</td>
            </tr>
        `).join('');

        updatePagination();
    }

    // 更新分页控制器
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
            // 获取数据
            const data = await fetch("data/statistics/nomination-stats.json").then(r => r.json());
            originalData = data;
            
            // 初始化搜索计数
            const searchCount = document.querySelector('.search-count');
            if (searchCount) {
                searchCount.textContent = '';  
            }

            const filters = getFilters();
            const characters = filterCharacters(originalData, filters);
            filteredData = getIPStats(characters);
            updateTable();
        } catch (error) {
            console.error('Error:', error);
        }
    }

    // 添加事件监听
    document.querySelectorAll('input[name="group"]').forEach(radio => {
        radio.addEventListener('change', function() {
            const isNova = this.value === 'nova';
            const novaFilters = document.getElementById('nova-filters');
            
            if (isNova) {
                novaFilters.classList.remove('hidden');
            } else {
                novaFilters.classList.add('hidden');
            }
            
            initTable();
        });
    });

    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', initTable);
    });

    document.querySelectorAll('#ipTable th').forEach(th => {
        th.addEventListener('click', function() {
            const column = this.dataset.column;
            if (sortColumn === column) {
                sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                sortColumn = column;
                sortDirection = 'desc';
            }

            document.querySelectorAll('#ipTable th').forEach(header => {
                header.classList.remove('sort-asc', 'sort-desc');
            });
            this.classList.add(`sort-${sortDirection}`);

            // 先清空搜索框
            if (lastSearchText) {
                searchInput.value = '';
            }
            
            // 再清除搜索状态和更新计数
            clearHighlights();
            updateSearchCount();
            
            // 最后填充搜索文本
            if (lastSearchText) {
                setTimeout(() => {
                    searchInput.value = lastSearchText;
                }, 100);
            }

            // 排序时更新 previousPage 为初始页码
            previousPage = initialPage;

            updateTable();
        });
    });

    // 搜索功能
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');

    searchInput.addEventListener('input', function() {
        if (!this.value.trim()) {
            clearHighlights();
            if (currentPage !== previousPage) {
                currentPage = previousPage;
                updateTable();
            }
            updateSearchCount();
        }
    });

    function handleSearch() {
        previousPage = currentPage;  // 记录搜索前的页码
        updateFilters();
        searchAndHighlight();
    }

    searchBtn.addEventListener('click', handleSearch);

    // 处理回车键事件
    searchInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();  // 阻止默认行为
            
            if (currentSearchResults.length === 0) {
                // 如果还没有搜索结果，先执行搜索
                searchAndHighlight();
            } else {
                // 已有搜索结果，执行切换
                // 移除当前的强高亮
                document.querySelectorAll('.highlight, .highlight-current').forEach(cell => {
                    cell.classList.remove('highlight', 'highlight-current');
                });

                // 切换到下一个结果
                currentMatchIndex = (currentMatchIndex + 1) % currentSearchResults.length;
                
                // 获取当前匹配的行
                const currentCell = currentSearchResults[currentMatchIndex];
                const currentRow = currentCell.parentElement;
                
                // 添加新的强高亮
                currentCell.classList.remove('highlight');
                currentCell.classList.add('highlight-current');
                
                // 如果是角色匹配，也要强高亮对应的性别列
                const searchText = cleanSearchText(searchInput.value.trim());
                const filters = getFilters();
                const characters = filterCharacters(originalData, filters);
                const ipCharacters = characters.filter(char => char.ip === currentRow.cells[0].textContent);
                
                for (const char of ipCharacters) {
                    if (char.name.toLowerCase().includes(searchText.toLowerCase())) {
                        const columnIndex = char.gender === 'female' ? 1 : 2;
                        currentRow.cells[columnIndex].classList.remove('highlight');
                        currentRow.cells[columnIndex].classList.add('highlight-current');
                        break;
                    }
                }
                
                // 更新计数
                updateSearchCount();
                           
            }
        }
    });

    // 初始化搜索计数显示
    const searchInputWrapper = document.querySelector('.search-input-wrapper');
    const searchCount = document.createElement('span');
    searchCount.className = 'search-count';
    searchInputWrapper.appendChild(searchCount);

    // 搜索函数
    function searchAndHighlight() {
        previousPage = currentPage;
        
        const searchText = cleanSearchText(searchInput.value.trim());
        lastSearchText = searchText;
        
        if (!searchText) {
            clearHighlights();
            if (currentPage !== previousPage) {
                currentPage = previousPage;
                updateTable();
            }
            updateSearchCount();
            return;
        }
        
        // 重置搜索结果和高亮
        currentSearchResults = [];
        currentMatchIndex = 0;
        
        // 移除之前的所有高亮
        document.querySelectorAll('.highlight, .highlight-current').forEach(cell => {
            cell.classList.remove('highlight', 'highlight-current');
        });

        // 重新获取筛选条件和数据
        const filters = getFilters();
        const characters = filterCharacters(originalData, filters);
        
        // 在所有数据中搜索
        const searchResults = [];
        filteredData.forEach((item, index) => {
            let matched = false;

            // 检查IP名称和别名
            const aliases = SERIES_ALIASES[item.name] || [];
            if (item.name.toLowerCase().includes(searchText.toLowerCase()) || 
                aliases.some(alias => alias.toLowerCase().includes(searchText.toLowerCase()))) {
                searchResults.push({ index, type: 'ip' });
                matched = true;
            }
            
            // 如果IP名称未匹配，检查角色名
            if (!matched) {
                const ipCharacters = characters.filter(char => char.ip === item.name);
                for (const char of ipCharacters) {
                    if (char.name.toLowerCase().includes(searchText.toLowerCase())) {
                        searchResults.push({ 
                            index, 
                            type: 'character',
                            gender: char.gender 
                        });
                        break;  // 找到一个角色就退出
                    }
                }
            }
        });

        if (searchResults.length > 0) {
            // 跳转到包含第一个搜索结果的页面
            const firstResultIndex = searchResults[0].index;
            currentPage = Math.floor(firstResultIndex / pageSize) + 1;
            updateTable();

            // 等待表格更新完成后添加高亮
            setTimeout(() => {
                const rows = document.querySelectorAll('#ipTable tbody tr');
                searchResults.forEach(result => {
                    const rowIndex = result.index % pageSize;
                    const row = rows[rowIndex];
                    if (row) {
                        if (result.type === 'ip') {
                            // 作品名匹配时高亮整行
                            Array.from(row.cells).forEach(cell => {
                                cell.classList.add('highlight');
                            });
                            currentSearchResults.push(row.cells[0]);
                        } else {
                            // 角色名匹配时保持原样
                            row.cells[0].classList.add('highlight');
                            const columnIndex = result.gender === 'female' ? 1 : 2;
                            row.cells[columnIndex].classList.add('highlight');
                            currentSearchResults.push(row.cells[0]);
                        }
                    }
                });

                // 添加当前选中的强高亮
                if (currentSearchResults.length > 0) {
                    const currentCell = currentSearchResults[currentMatchIndex];
                    const currentRow = currentCell.parentElement;
                    
                    // 移除普通高亮，添加强高亮
                    if (searchResults[currentMatchIndex].type === 'ip') {
                        // 作品名匹配时整行强高亮
                        Array.from(currentRow.cells).forEach(cell => {
                            cell.classList.remove('highlight');
                            cell.classList.add('highlight-current');
                        });
                    } else {
                        // 角色名匹配保持原样
                        currentCell.classList.remove('highlight');
                        currentCell.classList.add('highlight-current');
                        
                        const columnIndex = searchResults[currentMatchIndex].gender === 'female' ? 1 : 2;
                        currentRow.cells[columnIndex].classList.remove('highlight');
                        currentRow.cells[columnIndex].classList.add('highlight-current');
                    }
                }

                updateSearchCount();
            }, 0);
        } else {
            updateSearchCount();
        }
    }

    // 更新搜索计数
    function updateSearchCount() {
        const searchCount = document.querySelector('.search-count');
        if (!searchCount) return;

        const total = currentSearchResults.length;
        const current = currentMatchIndex + 1;
        
        if (!searchInput.value.trim()) {  // 如果搜索框为空
            searchCount.textContent = '';  // 清空计数显示
            searchCount.classList.remove('no-results');
        } else if (total === 0) {  // 有搜索内容但没有结果
            searchCount.textContent = '0/0';
            searchCount.classList.add('no-results');
        } else {  // 有搜索结果
            searchCount.textContent = `${current}/${total}`;
            searchCount.classList.remove('no-results');
        }
    }

    // 更新筛选结果
    function updateFilters() {
        const filters = getFilters();
        
        const characters = filterCharacters(originalData, filters);
        let ipStats = getIPStats(characters);
        
        // 不再在这里筛选数据，保留所有数据
        filteredData = sortData(ipStats);
        updateTable();
    }

    // 清理搜索文本，移除标点符号和括号
    function cleanSearchText(text) {
        return text.toLowerCase()
            .replace(/[（）()[\]【】「」『』《》〈〉""'']/g, '')  
            .replace(/[、，。！？：；]/g, '')  
            .replace(/[.,!?:;]/g, '') 
            .replace(/\s+/g, '');  
    }

    // 弹窗相关变量
    const modal = document.getElementById('characterModal');
    const closeBtn = document.querySelector('.ip-close-btn');
    const modalTitle = document.getElementById('modalTitle');
    const femaleList = document.getElementById('femaleList');
    const maleList = document.getElementById('maleList');

    // 显示角色详情
    function showCharacterDetails(ip, gender) {
        const characters = filteredData.find(item => item.name === ip);
        if (!characters) return;

        // 检查点击的性别是否有角色
        if (gender === 'female' && characters.female === 0) return;
        if (gender === 'male' && characters.male === 0) return;

        modalTitle.textContent = ip;

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

        // 在标题后面插入图例
        modalTitle.insertAdjacentHTML('afterend', legendHtml);
        
        // 获取该作品的所有角色
        const allCharacters = filterCharacters(originalData, getFilters())
            .filter(char => char.ip === ip);
        
        // 根据点击的列显示不同内容
        if (gender === 'total') {
            // 只显示有角色的性别列表
            femaleList.parentElement.style.display = characters.female > 0 ? 'block' : 'none';
            maleList.parentElement.style.display = characters.male > 0 ? 'block' : 'none';
            document.querySelector('.character-lists').style.gridTemplateColumns = 
                characters.female > 0 && characters.male > 0 ? 'repeat(2, 1fr)' : '1fr';
        } else {
            const showFemale = gender === 'female';
            femaleList.parentElement.style.display = showFemale ? 'block' : 'none';
            maleList.parentElement.style.display = showFemale ? 'none' : 'block';
            document.querySelector('.character-lists').style.gridTemplateColumns = '1fr';
        }
        
        // 分别获取男女角色并排序
        const femaleChars = allCharacters
            .filter(char => char.gender === 'female')
            .sort((a, b) => {
                // 自动晋级优先（votes 为 "-" 的排在前面）
                if (a.votes === '-' && b.votes !== '-') return -1;
                if (b.votes === '-' && a.votes !== '-') return 1;
                // 然后按得票数降序
                return (parseInt(b.votes) || 0) - (parseInt(a.votes) || 0);
            });

        const maleChars = allCharacters
            .filter(char => char.gender === 'male')
            .sort((a, b) => {
                // 自动晋级优先（votes 为 "-" 的排在前面）
                if (a.votes === '-' && b.votes !== '-') return -1;
                if (b.votes === '-' && a.votes !== '-') return 1;
                // 然后按得票数降序
                return (parseInt(b.votes) || 0) - (parseInt(a.votes) || 0);
            });

        // 更新列表显示
        femaleList.innerHTML = femaleChars.map((char, index) => `
            <li style="transition-delay: ${0.1 + index * 0.05}s" 
                class="${char.status === '晋级' ? 'promoted' : 'eliminated'}">
                ${char.avatar ? `<img src="${char.avatar}" class="character-avatar" alt="${char.name}">` : 
                              '<div class="character-avatar"></div>'}
                <div class="character-info">
                    <div class="character-name">${char.name}</div>
                    ${char.cv ? `<div class="character-cv">CV: ${char.cv}</div>` : ''}
                    ${char.votes === '-' ? 
                        '<div class="auto-promote">自动晋级</div>' : 
                        `<div class="character-votes">提名得票数: ${char.votes}</div>`
                    }
                </div>
            </li>
        `).join('');

        maleList.innerHTML = maleChars.map((char, index) => `
            <li style="transition-delay: ${0.1 + index * 0.05}s"
                class="${char.status === '晋级' ? 'promoted' : 'eliminated'}">
                ${char.avatar ? `<img src="${char.avatar}" class="character-avatar" alt="${char.name}">` : 
                              '<div class="character-avatar"></div>'}
                <div class="character-info">
                    <div class="character-name">${char.name}</div>
                    ${char.cv ? `<div class="character-cv">CV: ${char.cv}</div>` : ''}
                    ${char.votes === '-' ? 
                        '<div class="auto-promote">自动晋级</div>' : 
                        `<div class="character-votes">提名得票数: ${char.votes}</div>`
                    }
                </div>
            </li>
        `).join('');
        
        // 先显示弹窗但不显示内容
        modal.style.display = 'block';
        // 强制重绘
        modal.offsetHeight;
        // 然后添加 show 类来触发动画
        modal.classList.add('show');
    }

    // 关闭弹窗
    function closeModal() {
        modal.classList.remove('show');
        // 等待动画结束后隐藏弹窗
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300); // 与 CSS 动画时长相同
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

    // 初始化
    initTable();

    // 初始化时设置默认排序状态
    document.querySelector(`th[data-column="${sortColumn}"]`)?.classList.add(`sort-${sortDirection}`);

    // 添加 clearHighlights 函数
    function clearHighlights() {
        document.querySelectorAll('.highlight, .highlight-current').forEach(cell => {
            cell.classList.remove('highlight', 'highlight-current');
        });
        currentSearchResults = [];
        currentMatchIndex = -1;
    }
}); 