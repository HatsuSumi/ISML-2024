import { EVENT_LINKS } from '/ISML-2024/js/aliases/aliases.js';

async function checkPageExists(url) {
    try {
        const response = await fetch(url, { method: 'HEAD' });
        return response.ok;
    } catch {
        return false;
    }
}

async function generateDropdownMenu() {
    const currentPath = window.location.pathname;
    const currentPage = currentPath.split('/').pop().replace('.html', '');
    const currentPhase = EVENT_LINKS[currentPage]?.phase;
    
    const getTargetUrl = (id) => {
        const basePath = 'pages/visualization/';
        const currentFrom = new URLSearchParams(window.location.search).get('from');
        const fromParam = currentFrom ? `?from=${currentFrom}` : '';
        
        if (isTablePage) {
            return `${basePath}${id}-table.html${fromParam}`;
        }
        return `${basePath}${id}.html${fromParam}`;
    };
    
    const dropdown = document.createElement('div');
    dropdown.className = 'events-dropdown';
    
    const button = document.createElement('button');
    button.className = 'other-events-btn';
    button.textContent = '同阶段其他赛事';
    dropdown.appendChild(button);
    
    const content = document.createElement('div');
    content.className = 'events-dropdown-content';
    
    const linkPromises = Object.entries(EVENT_LINKS)
        .filter(([id, info]) => {
            const isTargetTable = id.includes('-table');
            return id !== currentPage && 
                   info.phase === currentPhase && 
                   isTargetTable === isTablePage;
        })
        .map(async ([id, info]) => {
            const pageUrl = getTargetUrl(id.replace('-table', ''));
            const exists = await checkPageExists(pageUrl);
            return { id, info, exists, pageUrl };
        });
    
    const results = await Promise.all(linkPromises);
    
    results.forEach(({ id, info, exists, pageUrl }) => {
        if (exists) {
            const link = document.createElement('a');
            link.href = pageUrl;
            link.textContent = info.name;
            content.appendChild(link);
        }
    });
    
    dropdown.appendChild(content);

    if (isTablePage) {
        const visualizationBtn = document.querySelector('.visualization-btn');
        visualizationBtn.after(dropdown);
    } else {
        const sizeControls = document.querySelector('.size-controls');
        sizeControls.after(dropdown);
    }
}

document.addEventListener('DOMContentLoaded', generateDropdownMenu);