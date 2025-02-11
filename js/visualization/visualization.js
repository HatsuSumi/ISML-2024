document.addEventListener('DOMContentLoaded', function() {
    initVisualization();
});

function initVisualization() {
    const chartContainer = document.querySelector('.chart-container');
    if (chartContainer) {
        window.addEventListener('resize', function() {
            const width = Math.min(window.innerWidth * 0.9, 1500);
            chartContainer.style.width = width + 'px';
            if (window.chart_vote_chart) {
                chart_vote_chart.resize();
            }
        });
    }

    const buttons = document.querySelectorAll('.home-btn, .table-btn');
    buttons.forEach(button => {
        button.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.05)';
        });
        button.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
        });
    });
} 