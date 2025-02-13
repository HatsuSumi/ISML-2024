document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
        if (!chart_vote_chart) {
            console.error('Chart not initialized');
            return;
        }

        const currentPage = window.location.pathname;
        
        const currentFrom = new URLSearchParams(window.location.search).get('from');
        const fromParam = currentFrom ? `?from=${currentFrom}` : '';

        if (!currentPage.includes('-advance.html') && !currentPage.includes('-eliminate.html')) {
            const legendItems = document.querySelectorAll('.legend-item');
            
            const seasonMap = {
                'winter': '03-04',
                'spring': '05-06',
                'summer': '07-08',
                'autumn': '09-10'
            };
            
            let baseUrl = '';
            for (const [season, prefix] of Object.entries(seasonMap)) {
                if (currentPage.includes(`-${season}-`)) {
                    const prefixArr = prefix.split('-');
                    baseUrl = currentPage.includes('-female-') ? 
                        `${prefixArr[0]}-nova-${season}-female` : 
                        `${prefixArr[1]}-nova-${season}-male`;
                    break;
                }
            }
            
            legendItems.forEach((item) => {
                item.style.cursor = 'pointer';
                item.addEventListener('click', function() {
                    const text = item.querySelector('.legend-text').textContent;
                    
                    if (text === '未晋级') {
                        window.location.href = `/ISML-2024/pages/visualization/${baseUrl}-nomination-advance.html${fromParam}`;
                    } else if (text === '晋级') {
                        window.location.href = `/ISML-2024/pages/visualization/${baseUrl}-nomination-eliminate.html${fromParam}`;
                    }
                });
            });
        }
    }, 1000);
});