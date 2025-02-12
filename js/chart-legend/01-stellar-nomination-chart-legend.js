document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
        if (!chart_vote_chart) {
            console.error('Chart not initialized');
            return;
        }

        const currentPage = window.location.pathname;
        
        if (!currentPage.includes('-advance.html') && !currentPage.includes('-eliminate.html')) {
            const legendItems = document.querySelectorAll('.legend-item');
            const baseUrl = currentPage.includes('01-stellar-female') ? '01-stellar-female' : '02-stellar-male';
            
            legendItems.forEach((item) => {
                item.style.cursor = 'pointer';
                item.addEventListener('click', function() {
                    const text = item.querySelector('.legend-text').textContent;
                    
                    let targetUrl = '';
                    if (text === '未晋级') {
                        targetUrl = `pages/visualization/${baseUrl}-nomination-advance.html`;
                    } else if (text === '晋级') {
                        targetUrl = `pages/visualization/${baseUrl}-nomination-eliminate.html`;
                    }

                    if (targetUrl) {
                        window.location.href = targetUrl;
                    }
                });
            });
        }
    }, 1000);
}); 