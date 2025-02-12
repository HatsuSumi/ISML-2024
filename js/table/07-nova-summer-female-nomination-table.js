// 导入别名配置
import { SERIES_ALIASES } from '/ISML-2024/js/aliases/aliases.js';

// 下拉菜单功能
window.toggleDropdown = function() {
    document.getElementById("downloadDropdown").classList.toggle("show");
}

window.onclick = function(event) {
    if (!event.target.matches('.download-btn')) {
        const dropdowns = document.getElementsByClassName("dropdown-content");
        for (let dropdown of dropdowns) {
            if (dropdown.classList.contains('show')) {
                dropdown.classList.remove('show');
            }
        }
    }
}

// 下载功能
window.downloadFile = function(format) {
    const filePath = 
    location.hostname === "hatsusumi.github.io"
        ? `/ISML-2024/data/nomination/nova/summer/female/07-nova-summer-female-nomination.${format}`
        : `../../data/nomination/nova/summer/female/07-nova-summer-female-nomination.${format}`;
    fetch(filePath)
        .then(response => {
            if (format === 'csv') {
                return response.text();
            } else if (format === 'json') {
                return response.json();
            } else {
                return response.blob();  
            }
        })
        .then(data => {
            let blob;
            if (format === 'csv') {
                blob = new Blob([data], { type: 'text/csv' });
            } else if (format === 'json') {
                blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            } else {
                blob = data;  
            }
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `新星组夏季赛提名-女性组别.${format}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        });
}

// 下载功能
window.downloadCurrentTable = function(format) {
    const table = document.querySelector('table');
    const headers = Array.from(table.querySelectorAll('th'))
        .map(th => th.textContent.trim());
    
    const visibleRows = Array.from(table.querySelectorAll('tbody tr'))
        .filter(row => row.style.display !== 'none')
        .map(row => Array.from(row.cells).map((cell, index) => {
            const img = cell.querySelector('img');
            return img ? img.src : cell.textContent.trim();
        }));

    const columnOrder = [0, 1, 2, 4, 5, 6, 7, 3];
    const reorderedHeaders = columnOrder.map(i => headers[i]);
    const reorderedRows = visibleRows.map(row => columnOrder.map(i => row[i]));
    
    if (format === 'json') {
        const jsonData = reorderedRows.map(row => {
            const obj = {};
            reorderedHeaders.forEach((header, index) => {
                obj[header] = row[index];
            });
            return obj;
        });
        
        const blob = new Blob([JSON.stringify(jsonData, null, 2)], { 
            type: 'application/json;charset=utf-8' 
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = '新星组夏季赛提名-女性组别-当前视图.json';
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(url);
        document.body.removeChild(a);
    } else if (format === 'csv') {
        const csvContent = [
            reorderedHeaders.join(','),
            ...reorderedRows.map(row => row.join(','))
        ].join('\n');
        
        const blob = new Blob(['\ufeff' + csvContent], { 
            type: 'text/csv;charset=utf-8' 
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = '新星组夏季赛提名-女性组别-当前视图.csv';
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(url);
        document.body.removeChild(a);
    } else {
        try {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('新星组夏季赛提名-女性组别');
            worksheet.columns = [
                { header: '排名', width: 5 },
                { header: '日期', width: 15 },
                { header: '赛事名称', width: 30 },
                { header: '角色', width: 30 },
                { header: 'IP', width: 50 },
                { header: 'CV', width: 20 },
                { header: '得票数', width: 15 },
                { header: '头像链接', width: 100 }
            ];

            worksheet.addRows(reorderedRows);
            
            worksheet.eachRow(row => {
                row.height = 30; 
                row.eachCell((cell) => {
                    cell.font = {
                        name: '楷体',
                        size: 12
                    };
                    cell.alignment = {
                        vertical: 'middle',
                        horizontal: 'center'
                    };
                    cell.border = {
                        top: { style: 'none' },
                        left: { style: 'none' },
                        bottom: { style: 'none' },
                        right: { style: 'none' }
                    };
                });
            });
            
            workbook.xlsx.writeBuffer().then(buffer => {
                const blob = new Blob([buffer], { 
                    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = '新星组夏季赛提名-女性组别-当前视图.xlsx';
                document.body.appendChild(a);
                a.click();
                URL.revokeObjectURL(url);
                document.body.removeChild(a);
            });
        } catch (error) {
            console.error('Excel 导出错误:', error);
            alert('导出 Excel 时发生错误，请稍后重试');
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    // 绑定排序事件
    const sortableColumns = [4, 5, 6, 7]; 
    document.querySelectorAll('th').forEach((th, index) => {
        if (sortableColumns.includes(index)) {
            th.dataset.sortable = "true";
            th.addEventListener('click', () => sortTable(index));
        }
    });

    // 加载CSV数据
    // 检查保存的排序状态
    const savedColumn = localStorage.getItem('tableSortColumn');
    const savedDirection = localStorage.getItem('tableSortDirection');
    
    if (savedColumn && savedDirection) {
        // 使用保存的排序状态
        const columnIndex = parseInt(savedColumn);
        const isAsc = savedDirection === 'asc';
        // 设置表头排序状态
        document.querySelectorAll('th').forEach(header => {
            header.classList.remove('sort-asc', 'sort-desc');
        });
        document.getElementsByTagName('th')[columnIndex].classList.add(isAsc ? 'sort-asc' : 'sort-desc');
        loadAndSortData(columnIndex, isAsc);
    } else {
        // 直接加载数据,保持CSV中的排序
        loadAndSortData();
    }

    // 绑定事件监听器
    const searchType = document.getElementById('searchType');
    const searchInput = document.getElementById('searchInput');
    const statusFilter = document.getElementById('statusFilter');

    // 初始化时隐藏搜索框
    searchInput.style.display = 'none';

    searchType.addEventListener('change', function() {
        localStorage.setItem('searchType', this.value);
        updateSearchInput();
        filterTable();
    });

    statusFilter.addEventListener('change', function() {
        localStorage.setItem('statusFilter', this.value);
        filterTable();
    });

    searchInput.addEventListener('input', filterTable);
    document.getElementById('minVotes').addEventListener('input', filterTable);
    document.getElementById('maxVotes').addEventListener('input', filterTable);

    document.querySelector('.reset-btn').addEventListener('click', () => {
        // 先移除旧的动画类
        const resetBtn = document.querySelector('.reset-btn i');
        resetBtn.classList.remove('rotate-animation');
        
        // 强制重绘
        void resetBtn.offsetWidth;
        
        // 添加新的动画类
        resetBtn.classList.add('rotate-animation');
        
        // 重置搜索和筛选
        document.getElementById('searchType').value = 'none';
        document.getElementById('searchInput').value = '';
        document.getElementById('votesRange').style.display = 'none';
        document.getElementById('statusFilter').value = 'all';
        
        // 重置排序状态
        localStorage.removeItem('tableSortColumn');
        localStorage.removeItem('tableSortDirection');
        // 移除所有表头的排序状态
        document.querySelectorAll('th').forEach(header => {
            header.classList.remove('sort-asc', 'sort-desc');
        });    
        // 重新加载数据
        loadAndSortData();
    });
});

// 筛选功能
function filterTable() {
    const searchValue = document.getElementById('searchInput').value.toLowerCase();
    const searchType = document.getElementById('searchType').value;
    const statusValue = document.getElementById('statusFilter').value;
    const minVotes = parseInt(document.getElementById('minVotes').value) || 0;
    const maxVotes = parseInt(document.getElementById('maxVotes').value) || Infinity;

    const rows = document.querySelectorAll('#tableBody tr');
    const tableBody = document.getElementById('tableBody');

    // 只在有实际筛选条件时执行动画
    const hasFilter = searchValue || 
                     statusValue !== 'all' || 
                     (searchType === 'votes' && (minVotes > 0 || maxVotes < Infinity)) ||
                     (searchType === 'rank' && (minVotes > 0 || maxVotes < Infinity));

    if (hasFilter) {
        tableBody.style.opacity = '0';
        tableBody.style.animation = 'none';
        tableBody.offsetHeight; // 触发重排
        tableBody.style.animation = 'tableLoadIn 0.5s ease-out forwards';
    }

    // 让select失焦，重置箭头状态
    document.getElementById('searchType').blur();
    document.getElementById('statusFilter').blur();

    rows.forEach(row => {
        let show = true;
        const votes = parseInt(row.querySelector('.votes').textContent);
        const rank = parseInt(row.querySelector('.rank').textContent);

        // 状态筛选
        if (statusValue === 'advance' && row.dataset.advanced !== 'true') show = false;
        if (statusValue === 'eliminate' && row.dataset.advanced !== 'false') show = false;

        // 票数/排名范围筛选
        if (searchType === 'votes' && (votes < minVotes || votes > maxVotes)) show = false;
        if (searchType === 'rank' && (rank < minVotes || rank > maxVotes)) show = false;

        // 文本搜索
        if (searchType !== 'none' && searchType !== 'votes' && searchType !== 'rank' && searchValue) {
            const keywords = searchValue.split(/[\s,]+/);
            const columnIndex = searchType === 'character' ? 4 : 
                              searchType === 'anime' ? 5 : 
                              searchType === 'cv' ? 6 : -1;
            
            if (columnIndex !== -1) {
                const text = row.cells[columnIndex].textContent.toLowerCase();
                // 如果是IP搜索，检查别名
                if (searchType === 'anime') {
                    const aliases = SERIES_ALIASES[text] || [];
                    show = keywords.every(keyword => 
                        text.includes(keyword) || 
                        aliases.some(alias => alias.toLowerCase().includes(keyword))
                    );
                } else {
                    show = keywords.every(keyword => text.includes(keyword));
                }
            }
        }

        row.style.display = show ? '' : 'none';
    });
}

function smoothScrollToTop(duration = 500) {
    const startPosition = window.scrollY;
    const startTime = performance.now();

    function easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    function scrollStep(currentTime) {
        const timeElapsed = currentTime - startTime;
        const progress = Math.min(timeElapsed / duration, 1);

        window.scrollTo(0, startPosition * (1 - easeOutCubic(progress)));

        if (progress < 1) {
            requestAnimationFrame(scrollStep);
        }
    }

    requestAnimationFrame(scrollStep);
}

function updateSearchInput() {
    const searchType = document.getElementById('searchType').value;
    const searchInput = document.getElementById('searchInput');
    const votesRange = document.getElementById('votesRange');
    const isRangeFilter = searchType === 'votes' || searchType === 'rank';
    const isNoFilter = searchType === 'none';

    votesRange.style.display = isRangeFilter ? 'flex' : 'none';
    searchInput.style.display = isRangeFilter || isNoFilter ? 'none' : 'block';

    // 当选择不筛选时，清空搜索框的值
    if (isNoFilter) {
        searchInput.value = '';
    }

    // 更新范围输入框的提示文本
    if (isRangeFilter) {
        document.getElementById('minVotes').placeholder = searchType === 'votes' ? '最小票数' : '最小排名';
        document.getElementById('maxVotes').placeholder = searchType === 'votes' ? '最大票数' : '最大排名';
    }

    if (!isNoFilter && !isRangeFilter) {
        searchInput.placeholder = `请输入${
            searchType === 'character' ? '角色' : 
            searchType === 'anime' ? 'IP' :
            searchType === 'cv' ? '声优' : ''
        }名称（多个关键词用空格或逗号分隔）...`;
    }
}

// 排序功能
function sortTable(columnIndex) {
    const th = document.getElementsByTagName('th')[columnIndex];
    // 总是执行排序，第一次点击默认降序
    const isAsc = th.classList.contains('sort-desc');

    // 更新表头排序状态
    requestAnimationFrame(() => {
        document.querySelectorAll('th').forEach(header => {
            header.classList.remove('sort-asc', 'sort-desc');
        });
        th.classList.add(isAsc ? 'sort-asc' : 'sort-desc');
    });

    // 保存排序状态
    localStorage.setItem('tableSortColumn', columnIndex);
    localStorage.setItem('tableSortDirection', isAsc ? 'asc' : 'desc');

    // 重新加载并排序数据
    loadAndSortData(columnIndex, isAsc);
}

// 应用排序
function applySorting(data, columnIndex, isAsc) {
    // 创建数据副本
    const sortedData = [...data];
    
    // 如果没有指定排序参数，直接返回原始数据
    if (columnIndex === undefined || isAsc === undefined) {
        return sortedData;
    }

    const sortFunction = (a, b) => {
        if (columnIndex === 7) {  // 票数排序
            return isAsc ? a.votes - b.votes : b.votes - a.votes;
        } else {  // 其他列按文本排序
            // 调整列索引以匹配实际数据
            const getColumnValue = (row, index) => {
                switch(index) {
                    case 4: return row.columns[2];  // 角色
                    case 5: 
                        // 使用别名配置处理IP名称
                        const ip = row.columns[3];
                        return SERIES_ALIASES[ip] || ip;  // 如果有别名就用别名，没有就用原名
                    case 6: return row.columns[4];  // CV
                    default: return row.columns[index];
                }
            };
            const aValue = getColumnValue(a, columnIndex);
            const bValue = getColumnValue(b, columnIndex);
            return isAsc ? 
                aValue.localeCompare(bValue, 'zh-CN') : 
                bValue.localeCompare(aValue, 'zh-CN');
        }
    };

    // 执行排序
    sortedData.sort(sortFunction);
    return sortedData;
}

// 加载并排序数据
function loadAndSortData(columnIndex, isAsc) {
    fetch(
        location.hostname === "hatsusumi.github.io"
            ? "/ISML-2024/data/nomination/nova/summer/female/07-nova-summer-female-nomination.csv"
            : "../../data/nomination/nova/summer/female/07-nova-summer-female-nomination.csv"
    )
        .then(response => response.text())
        .then(data => {
            const rows = data.split('\n').slice(1);
            const tableBody = document.getElementById('tableBody');
            const processedData = rows
                .filter(row => row.trim())
                .map(row => {
                    const columns = row.split(',').map(col => col.trim());
                    return {
                        columns: columns,
                        votes: parseInt(columns[5]) || 0, 
                        isAdvanced: columns[7] === "True",
                        rank: parseInt(columns[9]) || 0, 
                    };
                });

            // 应用排序并获取排序后的数据
            const sortedData = applySorting(processedData, columnIndex, isAsc);

            // 渲染表格
            renderTable(sortedData);
        });
}

// 渲染表格
function renderTable(data) {
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = '';

    data.forEach(row => {
        // 创建表格行
        const tr = document.createElement('tr');
        tr.dataset.advanced = row.isAdvanced.toString();
        tr.innerHTML = `
            <td class="rank">${row.rank}</td>
            <td>${row.columns[0]}</td>
            <td>${row.columns[1]}</td>
            <td>${row.columns[8] ? `<img src="${row.columns[8]}" alt="${row.columns[2]}" width="50">` : ''}</td>
            <td>${row.columns[2]}</td>
            <td>${row.columns[3]}</td>
            <td>${row.columns[4]}</td>
            <td class="votes">${row.votes}</td>
        `;
        tableBody.appendChild(tr);
    });

    // 添加动画效果
    document.querySelectorAll('#tableBody tr').forEach(row => {
        row.classList.add('fade-in');
    });

    // 添加回到顶部按钮的事件监听
    const backToTop = document.querySelector('.back-to-top');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            backToTop.classList.add('show');
        } else {
            backToTop.classList.remove('show');
        }
    });

    backToTop.addEventListener('click', () => {
        smoothScrollToTop(500);
    });

    // 初始化搜索和筛选状态
    const savedSearchType = localStorage.getItem('searchType');
    const savedStatusFilter = localStorage.getItem('statusFilter');

    // 设置默认值
    if (!savedStatusFilter) {
        localStorage.setItem('statusFilter', 'all');
    }
    document.getElementById('statusFilter').value = savedStatusFilter || 'all';

    if (savedSearchType) {
        document.getElementById('searchType').value = savedSearchType;
        updateSearchInput();
    }
}
