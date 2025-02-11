document.addEventListener('DOMContentLoaded', async function() {
    let currentPage = 1;
    const pageSize = 20;
    let sortColumn = 'total';
    let sortDirection = 'desc';
    let filteredData = [];
    let originalData = null;
    let previousPage = 1;  // 保存搜索前的页码
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

    // 获取声优统计数据
    function getCVStats(characters) {
        const cvMap = new Map();
        let totalCharacters = 0;

        characters.forEach(char => {
            if (!char.cv) return;  // 跳过没有声优的角色

            totalCharacters++;
            const cvData = cvMap.get(char.cv) || {
                name: char.cv,
                female: 0,
                male: 0,
                total: 0,
                characters: []
            };

            cvData[char.gender]++;
            cvData.total++;
            cvData.characters.push(char);
            cvMap.set(char.cv, cvData);
        });

        return Array.from(cvMap.values()).map(cv => ({
            ...cv,
            percentage: ((cv.total / totalCharacters) * 100).toFixed(2) + '%'
        }));
    }

    // 排序数据
    function sortData(data) {
        return data.sort((a, b) => {
            let aValue = a[sortColumn];
            let bValue = b[sortColumn];

            if (sortColumn === 'name') {
                return sortDirection === 'asc' ? 
                    aValue.localeCompare(bValue) : 
                    bValue.localeCompare(aValue);
            }

            if (sortColumn === 'percentage') {
                aValue = parseFloat(aValue);
                bValue = parseFloat(bValue);
            }

            return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
        });
    }

    // 更新表格
    function updateTable() {
        const tbody = document.querySelector('#cvTable tbody');
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const pageData = sortData(filteredData).slice(startIndex, endIndex);

        tbody.innerHTML = pageData.map(item => `
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

    // 显示角色详情
    function showCharacterDetails(cv, gender) {
        const cvData = filteredData.find(item => item.name === cv);
        if (!cvData) return;

        const characters = cvData.characters.filter(char => 
            gender === 'total' || char.gender === gender
        );

        modalTitle.textContent = `${cv} 配音的${gender === 'female' ? '女性' : gender === 'male' ? '男性' : ''}角色`;

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

        characterList.innerHTML = characters.map((char, index) => `
            <li style="transition-delay: ${0.1 + index * 0.05}s"
                class="${char.status === '晋级' ? 'promoted' : 'eliminated'}">
                ${char.avatar ? `<img src="${char.avatar}" class="character-avatar" alt="${char.name}">` : 
                              '<div class="character-avatar"></div>'}
                <div class="character-info">
                    <div class="character-name">${char.name}</div>
                    <div class="ip-info">${char.ip}</div>
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

    // 初始化
    async function initTable() {
        try {
            const data = await fetch('../../../data/statistics/nomination-stats.json').then(r => r.json());
            originalData = data;
            const filters = getFilters();
            const characters = filterCharacters(data, filters);
            filteredData = getCVStats(characters);
            updateTable();
        } catch (error) {
            console.error('表格初始化失败：', error);
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

    // 修改表头点击事件
    document.querySelectorAll('#cvTable th').forEach(th => {
        th.addEventListener('click', function() {
            const column = this.dataset.column;
            if (sortColumn === column) {
                sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                sortColumn = column;
                sortDirection = 'desc';
            }

            document.querySelectorAll('#cvTable th').forEach(header => {
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

    // 清理搜索文本
    function cleanSearchText(text) {
        return text.toLowerCase().trim();
    }

    // 清除所有高亮
    function clearHighlights() {
        document.querySelectorAll('.highlight, .highlight-current').forEach(cell => {
            cell.classList.remove('highlight', 'highlight-current');
        });
        currentSearchResults = [];
        currentMatchIndex = -1;
    }

    // 搜索声优和角色
    function searchCVAndCharacters(searchText) {
        const searchResults = [];
        
        filteredData.forEach((item, index) => {
            let matched = false;
            
            // 匹配声优名称
            if (cleanSearchText(item.name).includes(searchText)) {
                searchResults.push({
                    index,
                    type: 'cv',
                    name: item.name
                });
                matched = true;
            }
            
            // 继续匹配角色名称
            for (const char of item.characters) {
                if (cleanSearchText(char.name).includes(searchText)) {
                    if (!matched) {
                        searchResults.push({
                            index,
                            type: 'character',
                            gender: char.gender,
                            name: item.name
                        });
                        matched = true;
                    }
                }
            }
        });
        
        return searchResults;
    }

    // 高亮搜索结果
    function highlightSearchResults(searchResults) {
        currentSearchResults = searchResults; // 存储搜索结果对象而不是DOM元素
        
        // 先清除所有高亮
        document.querySelectorAll('.highlight, .highlight-current').forEach(cell => {
            cell.classList.remove('highlight', 'highlight-current');
        });
        
        // 如果没有搜索结果，直接返回
        if (searchResults.length === 0) {
            currentMatchIndex = -1;
            return;
        }
        
        // 找出当前页的搜索结果
        const currentPageResults = searchResults.filter(result => 
            Math.floor(result.index / pageSize) === (currentPage - 1)
        );
        
        // 设置当前匹配索引
        if (currentPageResults.length > 0) {
            // 如果当前页有结果，设置为当前页第一个结果的索引
            currentMatchIndex = searchResults.indexOf(currentPageResults[0]);
        } else {
            // 如果当前页没有结果，设置为第一个结果的索引
            currentMatchIndex = 0;
            // 自动跳转到第一个结果所在的页面
            const firstResultPage = Math.floor(searchResults[0].index / pageSize) + 1;
            if (currentPage !== firstResultPage) {
                currentPage = firstResultPage;
                updateTable();
                // 等待表格更新完成后再执行高亮
                setTimeout(() => {
                    highlightSearchResults(searchResults);
                }, 0);
                return;
            }
        }
        
        // 高亮当前页的结果
        searchResults.forEach(result => {
            const pageIndex = Math.floor(result.index / pageSize);
            if (pageIndex === currentPage - 1) {
                const rowIndex = result.index % pageSize;
                const row = document.querySelectorAll('#cvTable tbody tr')[rowIndex];
                
                if (!row) {
                    return;
                }
                
                if (result.type === 'cv') {
                    Array.from(row.cells).forEach(cell => {
                        cell.classList.add('highlight');
                    });
                } else {
                    const cvCell = row.cells[0];
                    const genderCell = row.cells[result.gender === 'female' ? 1 : 2];
                    
                    cvCell.classList.add('highlight');
                    genderCell.classList.add('highlight');
                }
                
                // 如果是当前匹配的结果，添加当前高亮
                if (searchResults.indexOf(result) === currentMatchIndex) {
                    highlightCurrentRow(row);
                }
            }
        });
        
        updateSearchCount();
    }

    // 高亮当前行
    function highlightCurrentRow(row) {
        Array.from(row.cells).forEach(cell => {
            if (cell.classList.contains('highlight')) {
                cell.classList.remove('highlight');
                cell.classList.add('highlight-current');
            }
        });
    }

    // 切换到下一个搜索结果
    function moveToNextResult() {
        if (!currentSearchResults || currentSearchResults.length === 0 || currentMatchIndex === -1) {
            return;
        }
        
        const rows = document.querySelectorAll('#cvTable tbody tr');
        
        try {
            const currentResult = currentSearchResults[currentMatchIndex];
            if (!currentResult) {
                return;
            }
            
            const currentPageIndex = Math.floor(currentResult.index / pageSize);
            
            if (currentPageIndex === currentPage - 1) {
                const rowIndex = currentResult.index % pageSize;
                const currentRow = rows[rowIndex];
                if (currentRow) {
                    Array.from(currentRow.cells).forEach(cell => {
                        if (cell.classList.contains('highlight-current')) {
                            cell.classList.remove('highlight-current');
                            cell.classList.add('highlight');
                        }
                    });
                }
            }
            
            currentMatchIndex = (currentMatchIndex + 1) % currentSearchResults.length;
            const nextResult = currentSearchResults[currentMatchIndex];
            if (!nextResult) {
                return;
            }
            
            const nextPageIndex = Math.floor(nextResult.index / pageSize);
            
            if (nextPageIndex !== currentPage - 1) {
                currentPage = nextPageIndex + 1;
                updateTable();
                highlightSearchResults(currentSearchResults);
            } else {
                const nextRowIndex = nextResult.index % pageSize;
                const nextRow = rows[nextRowIndex];
                if (nextRow) {
                    highlightCurrentRow(nextRow);
                }
            }
            
            updateSearchCount();
        } catch (error) {
            clearHighlights();
            updateSearchCount();
        }
    }

    // 主搜索函数
    function searchAndHighlight() {
        previousPage = currentPage;
        
        const searchText = cleanSearchText(searchInput.value);
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
        
        clearHighlights();
        const searchResults = searchCVAndCharacters(searchText);
        highlightSearchResults(searchResults);
        updateSearchCount();
    }

    // 事件监听器
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

    searchBtn.addEventListener('click', searchAndHighlight);

    searchInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (currentSearchResults.length === 0) {
                searchAndHighlight();
            } else {
                moveToNextResult();
            }
        }
    });

    // 更新搜索计数
    function updateSearchCount() {
        const searchCount = document.querySelector('.search-count');
        if (!searchCount) return;

        const searchText = searchInput.value.trim();
        
        if (!searchText) {
            // 搜索框为空时清空计数
            searchCount.textContent = '';
        } else if (currentSearchResults.length === 0) {
            // 有搜索内容但没有结果
            searchCount.textContent = '0/0';
            searchCount.classList.add('no-results');
        } else {
            // 有搜索结果
            searchCount.textContent = `${currentMatchIndex + 1}/${currentSearchResults.length}`;
            searchCount.classList.remove('no-results');
        }
    }

    // 弹窗相关
    const modal = document.getElementById('characterModal');
    const closeBtn = document.querySelector('.close-btn');
    const modalTitle = document.getElementById('modalTitle');
    const characterList = document.getElementById('characterList');

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

    // 添加分页功能
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

    // 修改 changePage 函数
    window.changePage = function(page) {
        currentPage = page;
        updateTable();
        
        // 如果有搜索结果，需要重新高亮当前页的结果
        if (currentSearchResults && currentSearchResults.length > 0) {
            // 等待表格更新完成后再执行高亮
            setTimeout(() => {
                // 找出当前页的搜索结果
                const currentPageResults = currentSearchResults.filter(result => 
                    Math.floor(result.index / pageSize) === (page - 1)
                );
                
                if (currentPageResults.length > 0) {
                    // 如果当前页有搜索结果，高亮它们
                    const rows = document.querySelectorAll('#cvTable tbody tr');
                    
                    currentSearchResults.forEach(result => {
                        const pageIndex = Math.floor(result.index / pageSize);
                        if (pageIndex === page - 1) {
                            const rowIndex = result.index % pageSize;
                            const row = rows[rowIndex];
                            
                            if (row) {
                                if (result.type === 'cv') {
                                    Array.from(row.cells).forEach(cell => {
                                        cell.classList.add('highlight');
                                    });
                                } else {
                                    const cvCell = row.cells[0];
                                    const genderCell = row.cells[result.gender === 'female' ? 1 : 2];
                                    
                                    cvCell.classList.add('highlight');
                                    genderCell.classList.add('highlight');
                                }
                                
                                // 如果是当前匹配的结果，添加当前高亮
                                if (currentSearchResults.indexOf(result) === currentMatchIndex) {
                                    highlightCurrentRow(row);
                                }
                            }
                        }
                    });
                } else {
                    // 如果当前页没有搜索结果，清除所有高亮
                    document.querySelectorAll('.highlight, .highlight-current').forEach(cell => {
                        cell.classList.remove('highlight', 'highlight-current');
                    });
                }
                
                updateSearchCount();
            }, 0);
        }
    };

    // 初始化
    initTable();
    document.querySelector(`th[data-column="${sortColumn}"]`)?.classList.add(`sort-${sortDirection}`);
}); 