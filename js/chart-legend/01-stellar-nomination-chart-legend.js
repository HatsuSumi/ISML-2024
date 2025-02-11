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
                    
                    if (text === '未晋级') {
                        window.location.href = `${baseUrl}-nomination-advance.html`;
                    } else if (text === '晋级') {
                        window.location.href = `${baseUrl}-nomination-eliminate.html`;
                    }
                });
            });
        }
    }, 1000);
}); 