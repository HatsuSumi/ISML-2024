import pandas as pd
from pyecharts import options as opts
from pyecharts.charts import Bar
from pyecharts.commons.utils import JsCode
import json
from pyecharts.globals import ThemeType
import os

script_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.dirname(os.path.dirname(script_dir))
csv_path = os.path.join(root_dir, 'data', 'nomination', 'stellar', 'male', '02-male-nomination.csv')

df = pd.read_csv(csv_path, encoding='utf-8')
df['得票数'] = pd.to_numeric(df['得票数'].replace('-', '0'))

df_voted = df[df['得票数'] > 0].sort_values('得票数', ascending=False)
df_advance = df_voted.head(99)  

total_count = len(df_advance)
votes = df_advance['得票数'].tolist()[::-1] 
labels = [f"{role}（{anime}）" for role, anime in zip(df_advance['角色'], df_advance['IP'])][::-1]  

votes_original = votes[::-1] 
current_rank = 1
prev_votes = None
skip_count = 0
ranks = []
for i, vote in enumerate(votes_original):  
    if vote == 0: 
        ranks.append('-')
        continue
        
    if prev_votes is not None and vote != prev_votes:
        current_rank += skip_count + 1
        skip_count = 0
    elif prev_votes is not None:
        skip_count += 1
        
    ranks.append(str(current_rank))
    prev_votes = vote

ranks = ranks[::-1]  

bar = Bar(init_opts=opts.InitOpts(
    theme=ThemeType.DARK,
    chart_id="vote_chart",
    bg_color="#1a1a1a",
))

bar.set_global_opts(
    title_opts=opts.TitleOpts(title=""),
    legend_opts=opts.LegendOpts(is_show=False),
    xaxis_opts=opts.AxisOpts(
        position="center",
        name="得票数",
        name_location="end",
        axislabel_opts=opts.LabelOpts(
            font_size=12,
            font_family="Microsoft YaHei"
        ),
        splitline_opts=opts.SplitLineOpts(
            is_show=True,
            linestyle_opts=opts.LineStyleOpts(
                type_="dashed",
                opacity=0.3
            )
        )
    ),
    yaxis_opts=opts.AxisOpts(
        position="center",
        name="排名",
        axislabel_opts=opts.LabelOpts(
            formatter="{value}",
            interval=0,
            font_family="Microsoft YaHei"
        ),
        type_="category",
        axisline_opts=opts.AxisLineOpts(
            linestyle_opts=opts.LineStyleOpts(color="#333")
        )
    ),
    tooltip_opts=opts.TooltipOpts(
        textstyle_opts=opts.TextStyleOpts(
            color="#a6c1ee",
            font_size=14,
            font_family="Microsoft YaHei"
        ),
        background_color="rgba(50, 50, 50, 0.9)",
        border_color="rgba(50, 50, 50, 0.9)",
        border_width=0,
        trigger="axis", 
        formatter=JsCode("""
            function(params) {
                var labels = JSON.parse('%s');
                var ranks = JSON.parse('%s');
                for (var i = 0; i < params.length; i++) {
                    if (params[i].value !== null && !isNaN(params[i].value)) {
                        params = params[i];
                        break;
                    }
                }
                if (params.dataIndex >= labels.length) {
                    return '';
                }
                if (!params.value || isNaN(params.value)) return '';
                return params.seriesName + '<br/>' +
                       labels[params.dataIndex] + '<br/>' +
                       '得票数：' + params.value + '票<br/>' +
                       '排名：' + ranks[params.dataIndex];
            }
        """ % (json.dumps(labels, ensure_ascii=False),
               json.dumps(ranks, ensure_ascii=False)))
    )
)

bar.add_xaxis(ranks)
bar.add_yaxis(
    "晋级",
    votes,
    gap="0%",
    category_gap="40%",
    label_opts=opts.LabelOpts(
        position="right",
        formatter=JsCode("""
            function(params) {
                var labels = JSON.parse('%s');
                if (params.value === null) return '';
                return '{vote|' + params.value + '票}{name| - ' + labels[params.dataIndex] + '}';
            }
        """ % json.dumps(labels, ensure_ascii=False)),
        rich={
            "vote": {
                "color": "#ff7875",
                "fontSize": 13,
                "fontWeight": "bold",
                "padding": [0, 5, 0, 5]
            },
            "name": {
                "color": "#a6c1ee",
                "fontSize": 12
            }
        }
    ),
    itemstyle_opts=opts.ItemStyleOpts(
        color=JsCode("""
            new echarts.graphic.LinearGradient(0, 0, 1, 0, [{
                offset: 0,
                color: '#3d7644'
            }, {
                offset: 0.5,
                color: '#3e9d65'
            }, {
                offset: 1,
                color: '#3e9d65'
            }])
        """)
    )
)
bar.reversal_axis()

HTML_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <link rel="stylesheet" href="../../../css/visualization/visualization.css">
</head>
<body>
<include src="../../../templates/header.html"></include>
    <div class="container">
        <div class="content-wrapper">
            <div class="button-container">
                <a href="javascript:history.back()" class="home-btn">返回上一页</a>
                <a href="../tables/02-stellar-male-nomination-table.html" class="table-btn">查看表格</a>
                <div class="size-controls">
                    <div class="slider-container">
                        <label for="width-slider">宽度: <span id="width-value">1800</span>px</label>
                        <input type="range" id="width-slider" min="100" max="2500" value="1800" step="100">
                    </div>
                    <div class="slider-container">
                        <label for="height-slider">高度: <span id="height-value">2200</span>px</label>
                        <input type="range" id="height-slider" min="100" max="5000" value="2200" step="100">
                    </div>
                    <button id="reset-size" class="reset-btn">重置大小</button>
                </div>
            </div>
            <div class="content-scroll">
                <div class="chart-wrapper">
                    <div class="custom-legend">
                        <div class="legend-item">
                            <span class="legend-color advance"></span>
                            <span class="legend-text">晋级</span>
                        </div>
                    </div>
                    <div id="vote_chart" class="chart-container"></div>
                </div>
            </div>
            
            <script>
                document.addEventListener('DOMContentLoaded', function() {{
                    const widthSlider = document.getElementById('width-slider');
                    const heightSlider = document.getElementById('height-slider');
                    const widthValue = document.getElementById('width-value');
                    const heightValue = document.getElementById('height-value');
                    const chartContainer = document.querySelector('.chart-container');
                    const chartWrapper = document.querySelector('.chart-wrapper');
                    const resetBtn = document.getElementById('reset-size');

                    const defaultWidth = 1800;
                    const defaultHeight = 2200;

                    function resetSize() {{
                        widthSlider.value = defaultWidth;
                        heightSlider.value = defaultHeight;
                        widthValue.textContent = defaultWidth;
                        heightValue.textContent = defaultHeight;
                        chartContainer.style.maxWidth = `${{defaultWidth}}px`;
                        chartWrapper.style.maxWidth = `${{defaultWidth}}px`;
                        chartContainer.style.height = `${{defaultHeight}}px`;
                        if (chart_vote_chart) {{
                            chart_vote_chart.resize();
                        }}
                    }}

                    resetBtn.addEventListener('click', resetSize);

                    function updateSize() {{
                        const width = Math.min(Math.max(widthSlider.value, 100), 2500);
                        const height = Math.min(Math.max(heightSlider.value, 100), 5000);
                        widthValue.textContent = width;
                        heightValue.textContent = height;
                        chartContainer.style.maxWidth = `${{width}}px`;
                        chartWrapper.style.maxWidth = `${{width}}px`;
                        chartContainer.style.height = `${{height}}px`;
                        if (chart_vote_chart) {{
                            chart_vote_chart.resize();
                        }}
                    }}

                    widthSlider.addEventListener('input', updateSize);
                    heightSlider.addEventListener('input', updateSize);

                    var titleContainer = document.createElement('div');
                    titleContainer.className = 'title-container';
                    
                    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                    svg.style.width = '100%';
                    svg.style.height = '75px';
                    
                    var title = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                    title.textContent = '12.31-01.07 - 恒星组提名-男性组别（晋级）';
                    title.setAttribute('x', '50%');
                    title.setAttribute('y', '25');
                    title.setAttribute('text-anchor', 'middle');
                    title.style.fontSize = '24px';
                    title.setAttribute('font-weight', 'bold');

                    var subtitle = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                    subtitle.textContent = '前92名晋级至主赛事恒星组预选赛阶段';
                    subtitle.setAttribute('x', '50%');
                    subtitle.setAttribute('y', '50');
                    subtitle.setAttribute('text-anchor', 'middle');
                    subtitle.style.fontSize = '14px';
                    subtitle.setAttribute('fill', '#9370DB');

                    var gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
                    gradient.id = 'titleGradient';
                    gradient.setAttribute('x1', '0%');
                    gradient.setAttribute('y1', '0%');
                    gradient.setAttribute('x2', '100%');
                    gradient.setAttribute('y2', '0%');
                    
                    var stops = [
                        {{offset: '0%', color: '#ff6b6b'}},
                        {{offset: '40%', color: '#4a90e2'}},
                        {{offset: '100%', color: '#3eaf7c'}}
                    ];
                    
                    stops.forEach(function(stop) {{
                        var stopEl = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
                        stopEl.setAttribute('offset', stop.offset);
                        stopEl.setAttribute('stop-color', stop.color);
                        gradient.appendChild(stopEl);
                    }});
                    
                    svg.appendChild(gradient);
                    title.setAttribute('fill', 'url(#titleGradient)');
                    svg.appendChild(title);
                    svg.appendChild(subtitle);
                    
                    titleContainer.appendChild(svg);
                    document.querySelector('.chart-wrapper').insertBefore(titleContainer, document.querySelector('#vote_chart'));
                    
                    window.chart_vote_chart = echarts.init(
                        document.getElementById('vote_chart'), 'dark', {{renderer: 'canvas'}});
                    var option_vote_chart = {chart_content};
                    
                    option_vote_chart.grid = {{
                        left: '15%',
                        right: '15%',
                        top: '2%',
                        bottom: '5%',
                        containLabel: true
                    }};
                    
                    chart_vote_chart.setOption(option_vote_chart);
                    
                    window.addEventListener('resize', function() {{
                        chart_vote_chart.resize();
                    }});
                }});
            </script>
        </div>
    </div>
    <include src="../../../templates/footer.html"></include>
    <script type="module" src="../../../js/common/template-loader.js"></script>
    <script src="https://assets.pyecharts.org/assets/v5/echarts.min.js"></script>
    <script src="../../../js/visualization/visualization.js"></script>
</body>
</html>
"""

def create_vote_chart():
    chart_content = bar.dump_options()
    
    html_content = HTML_TEMPLATE.format(
        chart_content=chart_content
    )

    output_dir = os.path.join(root_dir, 'pages', 'visualization')
    os.makedirs(output_dir, exist_ok=True)
    
    output_file = os.path.join(output_dir, '02-stellar-male-nomination-advance.html')
    
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(html_content)
    
    return True

if __name__ == "__main__":
    create_vote_chart() 