function toggleDropdown() {
    document.getElementById("downloadDropdown").classList.toggle("show");
}

// 点击下拉菜单外部时关闭
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

function downloadFile(format) {
    const filePath = format === 'csv' ? '../../data/01-female-nomination.csv' : '../../data/01-female-nomination.xlsx';
    fetch(filePath)
        .then(response => {
            if (format === 'csv') {
                return response.text();
            } else {
                return response.blob();  
            }
        })
        .then(data => {
            let blob;
            if (format === 'csv') {
                blob = new Blob([data], { type: 'text/csv' });
            } else {
                blob = data;  
            }
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `恒星组提名赛-女子组.${format === 'csv' ? 'csv' : 'xlsx'}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        });
}

function sortTable(columnIndex) {
    const tableBody = document.getElementById('tableBody');
    const rows = Array.from(tableBody.getElementsByTagName('tr'));
    const th = document.getElementsByTagName('th')[columnIndex];
    const isAsc = !th.classList.contains('sort-asc');

    // 清除所有排序标记
    document.querySelectorAll('th').forEach(header => {
        header.classList.remove('sort-asc', 'sort-desc');
    });

    // 添加新的排序标记
    th.classList.add(isAsc ? 'sort-asc' : 'sort-desc');

    // 将自动晋级的行分开处理
    const autoPromotedRows = rows.filter(row => row.cells[7].textContent === '自动晋级');
    const normalRows = rows.filter(row => row.cells[7].textContent !== '自动晋级');

    // 只对非自动晋级的行进行排序
    normalRows.sort((a, b) => {
        let aValue = a.cells[columnIndex].textContent;
        let bValue = b.cells[columnIndex].textContent;

        // 处理数字列（排名和得票数）
        if (columnIndex === 0 || columnIndex === 7) {
            aValue = parseInt(aValue);
            bValue = parseInt(bValue);
            return isAsc ? aValue - bValue : bValue - aValue;
        }

        // 处理文本列
        return isAsc ? 
            aValue.localeCompare(bValue, 'zh-CN') : 
            bValue.localeCompare(aValue, 'zh-CN');
    });

    // 重新插入排序后的行
    // 先插入自动晋级的行，再插入其他行
    autoPromotedRows.forEach(row => tableBody.appendChild(row));
    normalRows.forEach(row => tableBody.appendChild(row));
}

fetch('../../data/01-female-nomination.csv')
.then(response => response.text())
.then(data => {
    const rows = data.split('\n').slice(1); // 跳过表头
    const tableBody = document.getElementById('tableBody');
    let rankCounter = 1; // 添加排名计数器
    
    rows.forEach((row, index) => {
        const columns = row.split(',').map(col => col.trim());
        if (columns[2] && columns[2].trim() !== '') {
            const tr = document.createElement('tr');
            const isAutoPromoted = columns[7] === 'True';
            const rank = columns[5] === '-' ? '-' : rankCounter++;
            tr.innerHTML = `
                <td class="rank">${rank}</td>
                <td>${columns[0]}</td>
                <td>${columns[1]}</td>
                <td><img src="${columns[8]}" alt="${columns[2]}" width="50"></td>
                <td>${columns[2]}</td>
                <td>${columns[3]}</td>
                <td>${columns[4]}</td>
                <td class="votes">${columns[5] === '-' ? '自动晋级' : columns[5]}</td>
            `;
            tableBody.appendChild(tr);
        }
    });
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
                                (statusFilter === 'normal' && !isAutoPromoted);
            row.style.display = matchesStatus ? '' : 'none';
        });
        return;
    }
    const searchTerms = document.getElementById('searchInput').value
        .toLowerCase()
        .split(/[\s,，]+/)  // 用空格、英文逗号或中文逗号分隔
        .map(term => term.replace(/[!！?？.。,，]/g, ''))  // 移除标点符号
        .filter(term => term.length > 0);  // 过滤掉空字符串
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
                             searchType === 'date' ? 1 :
                             searchType === 'event' ? 2 :
                             searchType === 'anime' ? 5 : 
                             searchType === 'cv' ? 6 : -1;
            const cellText = row.cells[cellIndex].textContent
                .toLowerCase()
                .replace(/[!！?？.。,，]/g, '');  // 移除标点符号
            // 任一搜索词匹配即可
            matchesSearch = searchTerms.some(term => cellText.includes(term));
        }

        const matchesStatus = statusFilter === 'all' || 
                            (statusFilter === 'auto' && isAutoPromoted) || 
                            (statusFilter === 'normal' && !isAutoPromoted);

        row.style.display = matchesSearch && matchesStatus ? '' : 'none';
    });
}

function updateSearchInput() {
    const searchType = document.getElementById('searchType').value;
    const searchInput = document.getElementById('searchInput');
    const votesRange = document.getElementById('votesRange');

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
            searchType === 'date' ? '日期' :
            searchType === 'event' ? '赛事' :
            searchType === 'character' ? '角色' : 
            searchType === 'anime' ? '作品' : '声优'
        }名称（多个关键词用空格、逗号分隔）...`;
    }
    // 清空搜索框和范围输入
    searchInput.value = '';
    document.getElementById('minVotes').value = '';
    document.getElementById('maxVotes').value = '';
    // 立即触发筛选
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
    updateSearchInput();
}); 