import { SERIES_ALIASES } from '/ISML-2024/js/aliases/aliases.js';

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

window.downloadFile = function(format, event) {
    event.preventDefault();
    event.stopPropagation();
    const filePath = `data/nomination/stellar/male/02-male-nomination.${format}`;

    fetch(filePath)
        .then(response => {
            if (!response.ok) {
                throw new Error('网络响应错误');
            }
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
            a.style.display = 'none';
            a.href = url;
            a.download = `恒星组提名-男性组别.${format}`;
            document.body.appendChild(a);
            a.click();
            
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        })
        .catch(error => {
            console.error('下载文件时出错:', error);
            alert('下载文件失败，请检查控制台日志');
        });
}

window.sortTable = function(columnIndex, initialDirection = null) {
    const tableBody = document.getElementById('tableBody');
    const rows = Array.from(tableBody.getElementsByTagName('tr'));
    const th = document.getElementsByTagName('th')[columnIndex];
    const isAsc = initialDirection !== null ? initialDirection === 'asc' : !th.classList.contains('sort-asc');

    document.querySelectorAll('th').forEach(header => {
        header.classList.remove('sort-asc', 'sort-desc');
    });

    th.classList.add(isAsc ? 'sort-asc' : 'sort-desc');

    localStorage.setItem('tableSortColumn', columnIndex);
    localStorage.setItem('tableSortDirection', isAsc ? 'asc' : 'desc');

    const autoPromotedRows = rows.filter(row => row.cells[7].textContent === '自动晋级');
    const normalRows = rows.filter(row => row.cells[7].textContent !== '自动晋级');

    normalRows.sort((a, b) => {
        let aValue = a.cells[columnIndex].textContent;
        let bValue = b.cells[columnIndex].textContent;

        if (columnIndex === 0 || columnIndex === 7) {
            aValue = parseInt(aValue);
            bValue = parseInt(bValue);
            return isAsc ? aValue - bValue : bValue - aValue;
        }

        return isAsc ? 
            aValue.localeCompare(bValue, 'zh-CN') : 
            bValue.localeCompare(aValue, 'zh-CN');
    });

    const sortedRows = [...autoPromotedRows, ...normalRows];
    
    tableBody.classList.add('sorting');

        tableBody.innerHTML = '';
        sortedRows.forEach(row => {
            tableBody.appendChild(row);
        });

    setTimeout(() => {
        tableBody.classList.remove('sorting');
    }, 300);
}

fetch("data/nomination/stellar/male/02-male-nomination.csv")
.then(response => response.text())
.then(data => {
    const rows = data.split('\n').slice(1); 
    const tableBody = document.getElementById('tableBody');
    
    // 设置可排序的表头
    const sortableColumns = [0, 4, 5, 6, 7]; // 排名、角色、IP、CV、得票数
    document.querySelectorAll('th').forEach((th, index) => {
        if (sortableColumns.includes(index)) {
            th.dataset.sortable = "true";
            th.addEventListener('click', () => sortTable(index));
        }
    });
    
    const autoPromoted = [];
    const normalData = [];
    
    rows.forEach((row, index) => {
        const columns = row.split(',').map(col => col.trim());
        if (columns[2] && columns[2].trim() !== '') {
            const data = {
                votes: columns[5] === '-' ? -1 : parseInt(columns[5]),
                columns: columns
            };
            if (data.votes === -1) {
                autoPromoted.push(data);
            } else {
                normalData.push(data);
            }
        }
    });

    // 先对普通选手按票数排序
    normalData.sort((a, b) => b.votes - a.votes);
    // 合并自动晋级和普通选手数据
    const sortedData = [...autoPromoted, ...normalData];

    // 设置初始排序状态（如果没有保存的排序状态）
    if (!localStorage.getItem('tableSortColumn')) {
        const votesColumn = document.getElementsByTagName('th')[7]; // 票数列
        votesColumn.classList.add('sort-desc');
        localStorage.setItem('tableSortColumn', '7');
        localStorage.setItem('tableSortDirection', 'desc');
    }
    
    let currentRank = 1;
    let previousVotes = null;
    let skipCount = 0;
    
    sortedData.forEach((data, index) => {
        if (data.votes === -1) {
            const tr = document.createElement('tr');
            const avatarHtml = data.columns[8] ? 
                `<img src="${data.columns[8]}" alt="${data.columns[2]}" width="50">` : 
                '';
            tr.innerHTML = `
                <td class="rank">-</td>
                <td>${data.columns[0]}</td>
                <td>${data.columns[1]}</td>
                <td>${avatarHtml}</td>
                <td>${data.columns[2]}</td>
                <td>${data.columns[3]}</td>
                <td>${data.columns[4]}</td>
                <td class="votes">自动晋级</td>
            `;
            tableBody.appendChild(tr);
        } else {
            if (previousVotes !== null && data.votes !== previousVotes) {
                currentRank += skipCount + 1;
                skipCount = 0;
            } else if (previousVotes !== null) {
                skipCount++;
            }
            
            previousVotes = data.votes;
            
            const tr = document.createElement('tr');
            const avatarHtml = data.columns[8] ? 
                `<img src="${data.columns[8]}" alt="${data.columns[2]}" width="50">` : 
                '';
            tr.innerHTML = `
                <td class="rank">${currentRank}</td>
                <td>${data.columns[0]}</td>
                <td>${data.columns[1]}</td>
                <td>${avatarHtml}</td>
                <td>${data.columns[2]}</td>
                <td>${data.columns[3]}</td>
                <td>${data.columns[4]}</td>
                <td class="votes">${data.votes}</td>
            `;
            tableBody.appendChild(tr);
        }
    });
    
    const savedSearchType = localStorage.getItem('searchType');
    const savedStatusFilter = localStorage.getItem('statusFilter');
    
    if (!savedStatusFilter) {
        localStorage.setItem('statusFilter', 'all');
    }
    document.getElementById('statusFilter').value = savedStatusFilter || 'all';
    
    if (savedSearchType) {
        document.getElementById('searchType').value = savedSearchType;
        updateSearchInput();
    }
    
        filterTable();
    
    const savedColumn = localStorage.getItem('tableSortColumn');
    const savedDirection = localStorage.getItem('tableSortDirection');
    if (savedColumn !== null) {
        sortTable(parseInt(savedColumn), savedDirection);
    }

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
})
.catch(error => {
    console.error('数据加载或处理出错:', error);
}); 

function filterTable() {
    const searchType = document.getElementById('searchType').value;
    const statusFilter = document.getElementById('statusFilter').value;
    const rows = document.getElementById('tableBody').getElementsByTagName('tr');

    if (searchType === 'none') {
        Array.from(rows).forEach(row => {
            const isAutoPromoted = row.cells[7].textContent === '自动晋级';
            const matchesStatus = statusFilter === 'all' || 
                                (statusFilter === 'auto' && isAutoPromoted) || 
                                (statusFilter === 'normal' && !isAutoPromoted) ||
                                (statusFilter === 'promoted' && (isAutoPromoted || parseInt(row.cells[7].textContent) >= 11)) ||
                                (statusFilter === 'not_promoted' && !isAutoPromoted && parseInt(row.cells[7].textContent) < 11);
            row.style.display = matchesStatus ? '' : 'none';
        });
        return;
    } else {
    const searchTerms = document.getElementById('searchInput').value
        .toLowerCase()
        .split(/[\s,，]+/)  
        .map(term => term.replace(/[!！?？.。,，]/g, ''))  
        .filter(term => term.length > 0);  
    const minVotes = document.getElementById('minVotes').value;
    const maxVotes = document.getElementById('maxVotes').value;

    Array.from(rows).forEach(row => {
        const isAutoPromoted = row.cells[7].textContent === '自动晋级';
        let matchesSearch = true;

        if ((searchType === 'votes' || searchType === 'rank') && !isAutoPromoted) {
            const value = parseInt(row.cells[searchType === 'votes' ? 7 : 0].textContent);
            matchesSearch = (!minVotes || value >= minVotes) && 
                          (!maxVotes || value <= maxVotes);
        } else if (searchTerms.length > 0) {
            const cellIndex = searchType === 'character' ? 4 : 
                             searchType === 'anime' ? 5 : 
                             searchType === 'cv' ? 6 : -1;
                if (searchType === 'anime') {
                    const animeName = row.cells[cellIndex].textContent;
                    matchesSearch = searchTerms.some(term => 
                        animeName.toLowerCase().includes(term) || 
                        (SERIES_ALIASES[animeName] && 
                         SERIES_ALIASES[animeName].some(alias => 
                             alias.toLowerCase().includes(term)
                         ))
                    );
                } else {
            const cellText = row.cells[cellIndex].textContent
                .toLowerCase()
                .replace(/[!！?？.。,，]/g, ''); 
            matchesSearch = searchTerms.some(term => cellText.includes(term));
                }
        }

        const matchesStatus = statusFilter === 'all' || 
                            (statusFilter === 'auto' && isAutoPromoted) || 
                                (statusFilter === 'normal' && !isAutoPromoted) ||
                                (statusFilter === 'promoted' && (isAutoPromoted || parseInt(row.cells[7].textContent) >= 11)) ||
                                (statusFilter === 'not_promoted' && !isAutoPromoted && parseInt(row.cells[7].textContent) < 11);

        row.style.display = matchesSearch && matchesStatus ? '' : 'none';
    });
    }
}

function updateSearchInput() {
    const searchType = document.getElementById('searchType').value;
    const searchInput = document.getElementById('searchInput');
    const votesRange = document.getElementById('votesRange');

    localStorage.setItem('searchType', searchType);

    document.getElementById('searchType').blur();

    if (searchType === 'none') {
        searchInput.style.display = 'none';
        votesRange.style.display = 'none';
    } else if (searchType === 'votes' || searchType === 'rank') {
        searchInput.style.display = 'none';
        votesRange.style.display = 'flex';
        document.getElementById('minVotes').placeholder = searchType === 'votes' ? '最小票数' : '最小排名';
        document.getElementById('maxVotes').placeholder = searchType === 'votes' ? '最大票数' : '最大排名';
    } else {
        searchInput.style.display = 'block';
        votesRange.style.display = 'none';
        searchInput.placeholder = `请输入${
            searchType === 'character' ? '角色' : 
            searchType === 'anime' ? 'IP' : '声优'
        }名称（多个关键词用空格或逗号分隔）...`;
    }
    searchInput.value = '';
    document.getElementById('minVotes').value = '';
    document.getElementById('maxVotes').value = '';
    filterTable();
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('searchType').addEventListener('change', () => {
        updateSearchInput();
    });
    document.getElementById('searchInput').addEventListener('input', filterTable);
    document.getElementById('statusFilter').addEventListener('change', filterTable);
    document.getElementById('minVotes').addEventListener('input', filterTable);
    document.getElementById('maxVotes').addEventListener('input', filterTable);
   
    const statusFilter = document.getElementById('statusFilter');
    const selectWrapper = statusFilter.parentElement;
    let isChanging = false;
    
    statusFilter.addEventListener('focus', () => {
        selectWrapper.classList.add('active');
    });
    
    statusFilter.addEventListener('blur', () => {
        if (!isChanging) {
            selectWrapper.classList.remove('active');
        }
    });

    statusFilter.addEventListener('change', () => {
        isChanging = true;
        // 状态筛选时使用fade动画
        document.querySelectorAll('#tableBody tr').forEach(row => {
            row.classList.add('fade-out');
        });
        localStorage.setItem('statusFilter', statusFilter.value);
        setTimeout(() => {
        filterTable();
            document.querySelectorAll('#tableBody tr').forEach(row => {
                row.classList.remove('fade-out');
                row.classList.add('fade-in');
            });
        }, 300);
        
        requestAnimationFrame(() => {
            selectWrapper.classList.remove('active');
            statusFilter.blur();
            isChanging = false;
        });
    });

    // 恢复初始状态按钮
    document.querySelector('.reset-btn').addEventListener('click', () => {
        // 添加旋转动画
        const resetBtn = document.querySelector('.reset-btn');
        resetBtn.classList.add('rotating');

        // 动画结束后移除类
        setTimeout(() => {
            resetBtn.classList.remove('rotating');
        }, 300);

        // 添加淡出动画
        document.querySelectorAll('#tableBody tr').forEach(row => {
            row.classList.add('fade-out');
        });

        // 清除localStorage
        localStorage.removeItem('searchType');
        localStorage.removeItem('statusFilter');
        localStorage.removeItem('tableSortColumn');
        localStorage.removeItem('tableSortDirection');

        // 重置筛选条件
        document.getElementById('searchType').value = 'none';
        document.getElementById('statusFilter').value = 'all';
        document.getElementById('searchInput').value = '';
        document.getElementById('minVotes').value = '';
        document.getElementById('maxVotes').value = '';

        // 更新搜索框显示状态
        updateSearchInput();

        // 重置表头样式
        document.querySelectorAll('th').forEach(th => {
            th.classList.remove('sort-asc', 'sort-desc');
        });

        // 等淡出动画完成后重新加载数据
        setTimeout(() => {
            fetch("data/nomination/stellar/male/02-male-nomination.csv")
                .then(response => response.text())
                .then(data => {
                    const tableBody = document.getElementById('tableBody');
                    tableBody.innerHTML = '';
                    
                    // 重新渲染数据
                    const rows = data.split('\n').slice(1); 
                    const autoPromoted = [];
                    const normalData = [];
                    
                    rows.forEach((row, index) => {
                        const columns = row.split(',').map(col => col.trim());
                        if (columns[2] && columns[2].trim() !== '') {
                            const data = {
                                votes: columns[5] === '-' ? -1 : parseInt(columns[5]),
                                columns: columns
                            };
                            if (data.votes === -1) {
                                autoPromoted.push(data);
                            } else {
                                normalData.push(data);
                            }
                        }
                    });

                    // 先对普通选手按票数排序
                    normalData.sort((a, b) => b.votes - a.votes);
                    // 合并自动晋级和普通选手数据
                    const sortedData = [...autoPromoted, ...normalData];
                    
                    // 设置初始排序状态
                    const votesColumn = document.getElementsByTagName('th')[7]; // 票数列
                    votesColumn.classList.add('sort-desc');
                    localStorage.setItem('tableSortColumn', '7');
                    localStorage.setItem('tableSortDirection', 'desc');

                    let currentRank = 1;
                    let previousVotes = null;
                    let skipCount = 0;
                    
                    sortedData.forEach((data, index) => {
                        if (data.votes === -1) {
                            const tr = document.createElement('tr');
                            const avatarHtml = data.columns[8] ? 
                                `<img src="${data.columns[8]}" alt="${data.columns[2]}" width="50">` : 
                                '';
                            tr.innerHTML = `
                                <td class="rank">-</td>
                                <td>${data.columns[0]}</td>
                                <td>${data.columns[1]}</td>
                                <td>${avatarHtml}</td>
                                <td>${data.columns[2]}</td>
                                <td>${data.columns[3]}</td>
                                <td>${data.columns[4]}</td>
                                <td class="votes">自动晋级</td>
                            `;
                            tableBody.appendChild(tr);
                        } else {
                            if (previousVotes !== null && data.votes !== previousVotes) {
                                currentRank += skipCount + 1;
                                skipCount = 0;
                            } else if (previousVotes !== null) {
                                skipCount++;
                            }
                            
                            previousVotes = data.votes;
                            
                            const tr = document.createElement('tr');
                            const avatarHtml = data.columns[8] ? 
                                `<img src="${data.columns[8]}" alt="${data.columns[2]}" width="50">` : 
                                '';
                            tr.innerHTML = `
                                <td class="rank">${currentRank}</td>
                                <td>${data.columns[0]}</td>
                                <td>${data.columns[1]}</td>
                                <td>${avatarHtml}</td>
                                <td>${data.columns[2]}</td>
                                <td>${data.columns[3]}</td>
                                <td>${data.columns[4]}</td>
                                <td class="votes">${data.votes}</td>
                            `;
                            tableBody.appendChild(tr);
                        }
                    });

                    // 添加淡入动画
                    document.querySelectorAll('#tableBody tr').forEach(row => {
                        row.classList.add('fade-in');
                    });
                });
        }, 300);
    });
}); 

window.downloadCurrentTable = function(format, event) {
    event.preventDefault();
    event.stopPropagation();
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
        a.download = '恒星组提名-男性组别-当前视图.json';
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
        a.download = '恒星组提名-男性组别-当前视图.csv';
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(url);
        document.body.removeChild(a);
    } else {
        try {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('恒星组提名-男性组别');

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
                a.download = '恒星组提名-男性组别-当前视图.xlsx';
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