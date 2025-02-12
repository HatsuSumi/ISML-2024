document.addEventListener('DOMContentLoaded', async function() {

    const ipChart = echarts.init(document.getElementById('ipDistribution'));
    const genderChart = echarts.init(document.getElementById('genderDistribution'));
    const cvChart = echarts.init(document.getElementById('cvDistribution'));
    const yearChart = echarts.init(document.getElementById('yearDistribution'));
    const studioChart = echarts.init(document.getElementById('studioChart'));
    const sourceChart = echarts.init(document.getElementById('sourceChart'));
    const moeMeterChart = echarts.init(document.getElementById('moeMeterChart'));
    
    const darkTheme = {
        backgroundColor: '#2a2a2a',
        textStyle: { color: '#fff' },
        title: { textStyle: { color: '#fff' } },
        legend: { textStyle: { color: '#fff' } }
    };

    document.querySelectorAll('input[name="group"]').forEach(radio => {
        radio.addEventListener('change', function() {
            const isNova = this.value === 'nova';
            const novaFilters = document.getElementById('nova-filters');
            
            if (isNova) {
                novaFilters.classList.remove('hidden');
                requestAnimationFrame(() => {
                    novaFilters.style.maxHeight = novaFilters.scrollHeight + 'px';
                    novaFilters.style.opacity = '1';
                });
            } else {
                novaFilters.style.maxHeight = '0';
                novaFilters.style.opacity = '0';
                setTimeout(() => {
                    novaFilters.classList.add('hidden');
                }, 300); 
            }
            
            updateCharts();
        });
    });

    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', updateCharts);
    });

    function getFilters() {
        return {
            group: document.querySelector('input[name="group"]:checked').value,
            gender: Array.from(document.querySelectorAll('input[name="gender"]:checked')).map(cb => cb.value),
            seasons: Array.from(document.querySelectorAll('input[name="season"]:checked')).map(cb => cb.value),
            status: Array.from(document.querySelectorAll('input[name="status"]:checked')).map(cb => cb.value)
        };
    }

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
            if (filters.seasons && filters.gender) {
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
        }

        return characters.filter(char => {
            if (filters.status.length === 0) {
                return true;
            }

            const status = char.status || '';
            return filters.gender.includes(char.gender) && (
                (filters.status.includes('advance') && status === '晋级') ||
                (filters.status.includes('eliminate') && status === '未晋级')
            );
        });
    }

    async function updateCharts() {
        try {
            const data = await fetch(
                location.hostname === "hatsusumi.github.io" 
                    ? "/ISML-2024/data/statistics/nomination-stats.json"
                    : "../../data/statistics/nomination-stats.json"
            ).then(r => r.json());

            const filters = getFilters();

            const filteredData = filterCharacters(data, filters);
            
            updateIPDistribution(ipChart, filteredData);
            updateGenderDistribution(genderChart, filteredData);
            updateCVDistribution(cvChart, filteredData);
            updateYearDistribution(yearChart, filteredData);
            updateStudioDistribution(studioChart);
            updateSourceDistribution(sourceChart);
            updateMoeMeterDistribution(moeMeterChart);
        } catch (error) {
            console.error('图表更新失败：', error);
        }
    }

    function updateIPDistribution(chart, characters) {
        const ipCount = {};
        characters.forEach(char => {
            if (!ipCount[char.ip]) {
                ipCount[char.ip] = { female: 0, male: 0, total: 0 };
            }
            ipCount[char.ip][char.gender]++;
            ipCount[char.ip].total++;
        });

        const topIPs = Object.entries(ipCount)
            .sort((a, b) => b[1].total - a[1].total)
            .slice(0, 5);

        chart.setOption({
            ...darkTheme,
            tooltip: {
                trigger: 'item',
                formatter: function(params) {
                    const count = ipCount[params.name];
                    return `${params.name}<br/>
                        女性角色：${count.female}人<br/>
                        男性角色：${count.male}人<br/>
                        总计：${params.value}人<br/>
                        占比：${params.percent}%`;
                }
            },
            legend: {
                type: 'scroll',
                orient: 'vertical',
                right: 10,
                top: 20,
                bottom: 20,
                textStyle: { color: '#fff' }
            },
            series: [{
                type: 'pie',
                radius: '75%',
                center: ['40%', '50%'],
                data: topIPs.map(([ip, count]) => ({
                    name: ip,
                    value: count.total
                })),
                label: {
                    show: true,
                    position: 'inside', 
                    formatter: '{b}\n{c}人',
                    color: '#fff', 
                    fontSize: 14,   
                    lineHeight: 20  
                },
                labelLine: {
                    show: false 
                }
            }]
        });
    }

    function updateGenderDistribution(chart, characters) {
        const selectedGenders = Array.from(document.querySelectorAll('input[name="gender"]:checked')).map(cb => cb.value);
        
        const genderCount = {
            '女性': selectedGenders.includes('female') ? characters.filter(char => char.gender === 'female').length : 0,
            '男性': selectedGenders.includes('male') ? characters.filter(char => char.gender === 'male').length : 0
        };

        const total = Object.values(genderCount).reduce((a, b) => a + b, 0);

        chart.setOption({
            ...darkTheme,
            tooltip: {
                trigger: 'item',
                formatter: function(params) {
                    const percentage = ((params.value / total) * 100).toFixed(1);
                    return `${params.name}<br/>
                            数量：${params.value}<br/>
                            占比：${percentage}%`;
                }
            },
            legend: {
                data: ['女性', '男性'], 
                textStyle: { color: '#fff' }
            },
            series: [{
                type: 'pie',
                radius: ['40%', '70%'],
                center: ['50%', '50%'],
                data: Object.entries(genderCount)
                    .filter(([_, value]) => value > 0)
                    .map(([name, value]) => ({ 
                        name, 
                        value
                    })),
                label: {
                    show: true,
                    position: 'inside',
                    formatter: '{b}\n{c}人',
                    color: '#fff',
                    fontSize: 14,
                    lineHeight: 20
                },
                labelLine: {
                    show: false
                }
            }, {
                type: 'pie',
                radius: '30%',
                center: ['50%', '50%'],
                silent: true,
                label: {
                    show: true,
                    position: 'center',
                    formatter: `总计\n${total}人`,
                    color: '#fff',
                    fontSize: 16,
                    lineHeight: 30,
                    fontWeight: 'bold'
                },
                data: [{
                    value: 1,
                    name: '总计',
                    itemStyle: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }],
                tooltip: { show: false }
            }]
        });
    }

    function updateCVDistribution(chart, characters) {
        const cvCount = {};
        characters.forEach(char => {
            if (char.cv) {
                cvCount[char.cv] = (cvCount[char.cv] || 0) + 1;
            }
        });

        const data = Object.entries(cvCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);

        const total = Object.values(cvCount).reduce((a, b) => a + b, 0);

        chart.setOption({
            ...darkTheme,
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'shadow' },
                formatter: function(params) {
                    const percentage = ((params[0].value / total) * 100).toFixed(1);
                    return `${params[0].name}<br/>
                            数量：${params[0].value}<br/>
                            占比：${percentage}%`;
                }
            },
            grid: {
                left: '10%',
                right: '4%',
                bottom: '15%',
                top: '10%',
                containLabel: true
            },
            xAxis: {
                type: 'category',
                data: data.map(item => item[0]),
                axisLabel: {
                    rotate: 45,
                    interval: 0,
                    margin: 15,
                    color: '#fff'
                }
            },
            yAxis: { 
                type: 'value',
                axisLabel: {
                    color: '#fff'  
                }
            },
            series: [{
                type: 'bar',
                data: data.map(item => item[1]),
                label: {
                    show: true,
                    position: 'top',
                    color: '#fff',
                    fontSize: 12
                }
            }]
        });
    }

    function updateYearDistribution(chart, characters) {
        const yearSeasonCount = {};
        const seasons = {
            1: '冬季(1月)', 
            4: '春季(4月)', 
            7: '夏季(7月)', 
            10: '秋季(10月)'
        };
        
        characters.forEach(char => {
            if (char.ip_year && char.ip_season) {
                const year = char.ip_year;
                const season = char.ip_season;
                if (!yearSeasonCount[year]) {
                    yearSeasonCount[year] = {1: 0, 4: 0, 7: 0, 10: 0, total: 0};
                }
                yearSeasonCount[year][season]++;
                yearSeasonCount[year].total++;
            }
        });

        const years = Object.entries(yearSeasonCount)
            .sort((a, b) => b[1].total - a[1].total)
            .slice(0, 10)
            .map(([year]) => year);

        const series = [1, 4, 7, 10].map(season => ({
            name: seasons[season],
            type: 'bar',
            stack: 'total',
            data: years.map(year => yearSeasonCount[year][season])
        }));

        // 修复总数计算
        const total = Object.values(yearSeasonCount)
            .reduce((acc, curr) => acc + curr.total, 0);

        chart.setOption({
            ...darkTheme,
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'shadow' },
                formatter: function(params) {
                    let year = params[0].axisValue;
                    let result = `${year}年<br/>`;
                    let subtotal = 0;
                    params.forEach(param => {
                        if (param.value > 0) {
                            const seasonName = param.seriesName.split('(')[0];
                            result += `${seasonName}：${param.value}部<br/>`;
                            subtotal += param.value;
                        }
                    });
                    const percentage = ((subtotal / total) * 100).toFixed(1);
                    result += `总计：${subtotal}部<br/>`;
                    result += `占比：${percentage}%`;
                    return result;
                }
            },
            legend: {
                data: ['冬季(1月)', '春季(4月)', '夏季(7月)', '秋季(10月)'],
                top: 10,
                textStyle: { color: '#fff' }
            },
            grid: {
                left: '10%',
                right: '4%',
                bottom: '15%',
                top: '15%',
                containLabel: true
            },
            xAxis: {
                type: 'category',
                data: years,
                axisLabel: {
                    rotate: 45,
                    interval: 0,
                    color: '#fff' 
                }
            },
            yAxis: { 
                type: 'value',
                name: '作品数量',
                nameTextStyle: { color: '#fff' },
                axisLabel: {
                    color: '#fff' 
                }
            },
            series: series.map(s => ({
                ...s,
                label: {
                    show: true,
                    position: 'inside',
                    color: '#fff',
                    fontSize: 12
                }
            }))
        });
    }

    function updateStudioDistribution(chart) {
        chart.setOption({
            ...darkTheme,
            title: {
                text: '动画公司分布（待补充）',
                textStyle: {
                    color: '#fff',
                    fontSize: 16
                },
                left: 'center',
                top: '45%'
            }
        });
    }

    function updateSourceDistribution(chart) {
        chart.setOption({
            ...darkTheme,
            title: {
                text: '原作类型分布（待补充）',
                textStyle: {
                    color: '#fff',
                    fontSize: 16
                },
                left: 'center',
                top: '45%'
            }
        });
    }

    function updateMoeMeterDistribution(chart) {
        chart.setOption({
            ...darkTheme,
            title: {
                text: '萌属性分布（待补充）',
                textStyle: {
                    color: '#fff',
                    fontSize: 16
                },
                left: 'center',
                top: '45%'
            }
        });
    }

    updateCharts();

    window.addEventListener('resize', () => {
        [ipChart, genderChart, cvChart, yearChart, studioChart, sourceChart, moeMeterChart].forEach(chart => chart.resize());
    });

    document.querySelectorAll('.view-more').forEach(el => {
        el.addEventListener('click', function() {
            const chartContainer = this.closest('.chart-container');
            const chartElement = chartContainer.querySelector('.chart');

            switch(chartElement.id) {
                case 'ipDistribution':
                    window.location.href = '../statistics/table/ip-distribution.html';
                    break;
                case 'cvDistribution':
                    window.location.href = '../statistics/table/cv-distribution.html';
                    break;
                case 'yearDistribution':
                    window.location.href = '../statistics/table/year-distribution.html';
                    break;
            }
        });
    });
}); 