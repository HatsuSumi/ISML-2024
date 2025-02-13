document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
        if (!chart_vote_chart) {
            console.error('Chart not initialized');
            return;
        }

        const currentPath = window.location.pathname;
        
        if (!currentPath.includes('-advance.html') && !currentPath.includes('-eliminate.html')) {
            const legendItems = document.querySelectorAll('.legend-item');
            const baseUrl = currentPath.includes('01-stellar-female') ? '01-stellar-female' : '02-stellar-male';
            
            const currentFrom = new URLSearchParams(window.location.search).get('from');
            const fromParam = currentFrom ? `?from=${currentFrom}` : '';
            
            legendItems.forEach((item) => {
                item.style.cursor = 'pointer';
                item.addEventListener('click', function() {
                    const text = item.querySelector('.legend-text').textContent;
                    
                    let targetUrl = '';
                    if (text === '未晋级') {
                        targetUrl = `pages/visualization/${baseUrl}-nomination-advance.html${fromParam}`;
                    } else if (text === '晋级') {
                        targetUrl = `pages/visualization/${baseUrl}-nomination-eliminate.html${fromParam}`;
                    }

                    if (targetUrl) {
                        window.location.href = targetUrl;
                    }
                });
            });
        }
    }, 1000);
}); 