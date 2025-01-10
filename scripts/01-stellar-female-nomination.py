import pandas as pd
from pyecharts import options as opts
from pyecharts.charts import Bar
from pyecharts.commons.utils import JsCode
import json
from pyecharts.globals import ThemeType
import os

# 获取当前脚本所在目录的上级目录（项目根目录）
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def log_path(path, prefix=""):
    print(f"{prefix}路径: {os.path.abspath(path)}")
    print(f"{prefix}是否存在: {os.path.exists(path)}")
    if os.path.exists(path):
        print(f"{prefix}是目录: {os.path.isdir(path)}")
        print(f"{prefix}是文件: {os.path.isfile(path)}")

# 确保输出目录存在
print("\n检查输出目录...")
visualization_dir = os.path.join(ROOT_DIR, 'pages', 'visualization')
log_path(visualization_dir, "输出目录")
os.makedirs(visualization_dir, exist_ok=True)

print("\n正在读取CSV文件...")
csv_path = os.path.join(ROOT_DIR, 'data', '01-female-nomination.csv')
log_path(csv_path, "CSV文件")
df = pd.read_csv(csv_path, encoding='utf-8')
print("CSV文件读取完成。")

print("正在处理得票数数据...")
df['得票数'] = pd.to_numeric(df['得票数'].replace('-', '0'))
print("得票数数据处理完成。")

print("正在筛选和排序数据...")
df_voted = df[df['得票数'] > 0].sort_values('得票数', ascending=False)
print("数据筛选和排序完成。")

print("正在准备图表数据...")
ranks = [str(i+1) for i in range(len(df_voted))]
votes = df_voted['得票数'].tolist()
labels = [f"{role}（{anime}）" for role, anime in zip(df_voted['角色'], df_voted['作品'])]
avatars = df_voted['头像'].tolist()

print("\n图表数据准备完成。")

voted_data = votes[::-1]  
advance_data = [v if i >= 20 else None for i, v in enumerate(voted_data)]  
eliminate_data = [v if i < 20 else None for i, v in enumerate(voted_data)] 

print("正在创建图表...")
bar = (
    Bar(init_opts=opts.InitOpts(
        width="1500px", 
        height="1500px", 
        theme=ThemeType.DARK,
        chart_id="vote_chart",
        bg_color="#1a1a1a"
    ))
    .add_js_funcs("""
        document.body.style.backgroundColor = '#1a1a1a';
        
        // 创建标题容器
        var titleContainer = document.createElement('div');
        titleContainer.style.width = '1500px';
        titleContainer.style.margin = '0 auto';
        titleContainer.style.marginTop = '80px';
        titleContainer.style.textAlign = 'center';
        
        var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '1500');
        svg.setAttribute('height', '70');
        
        var title = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        title.textContent = '12.31-1.7 - 恒星组提名-女性组别';
        title.setAttribute('x', '750');
        title.setAttribute('y', '25');
        title.setAttribute('text-anchor', 'middle');
        title.setAttribute('font-size', '24');
        title.setAttribute('font-weight', 'bold');

        var subtitle = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        subtitle.textContent = '前52名晋级至主赛事恒星组预选赛阶段';
        subtitle.setAttribute('x', '750');
        subtitle.setAttribute('y', '50');
        subtitle.setAttribute('text-anchor', 'middle');
        subtitle.setAttribute('font-size', '14');
        subtitle.setAttribute('fill', '#9370DB');

        var gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        gradient.id = 'titleGradient';
        gradient.setAttribute('x1', '0%');
        gradient.setAttribute('y1', '0%');
        gradient.setAttribute('x2', '100%');
        gradient.setAttribute('y2', '0%');
        
        var stops = [
            {offset: '0%', color: '#ff6b6b'},
            {offset: '40%', color: '#4a90e2'},
            {offset: '100%', color: '#3eaf7c'}
        ];
        
        stops.forEach(function(stop) {
            var stopEl = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
            stopEl.setAttribute('offset', stop.offset);
            stopEl.setAttribute('stop-color', stop.color);
            gradient.appendChild(stopEl);
        });
        
        svg.appendChild(gradient);
        title.setAttribute('fill', 'url(#titleGradient)');
        svg.appendChild(title);
        svg.appendChild(subtitle);  
        
        titleContainer.appendChild(svg);
        document.querySelector('#vote_chart').parentNode.insertBefore(titleContainer, document.querySelector('#vote_chart'));
        
        // 调整图表容器样式
        document.querySelector('#vote_chart').style.margin = '0 auto';
        document.querySelector('#vote_chart').style.textAlign = 'center';
    """)
    .add_xaxis(ranks[::-1])
    .add_yaxis(
        "晋级",
        advance_data,
        label_opts=opts.LabelOpts(
            position="right",
            formatter=JsCode("""
                function(params) {
                    var labels = JSON.parse('%s');
                    var avatars = JSON.parse('%s');
                    if (params.value === null) return '';
                    return '{vote|' + params.value + '票}{name| - ' + labels[params.dataIndex] + '}';
                }
            """ % (json.dumps(labels[::-1], ensure_ascii=False), 
                   json.dumps(avatars[::-1], ensure_ascii=False))),
            rich={
                "avatar": {
                    "padding": [0, 5, 0, 0]
                },
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
    .add_yaxis(
        "未晋级",
        eliminate_data,
        label_opts=opts.LabelOpts(
            position="right",
            formatter=JsCode("""
                function(params) {
                    var labels = JSON.parse('%s');
                    var avatars = JSON.parse('%s');
                    if (params.value === null) return '';
                    return '{vote|' + params.value + '票}{name| - ' + labels[params.dataIndex] + '}';
                }
            """ % (json.dumps(labels[::-1], ensure_ascii=False), 
                   json.dumps(avatars[::-1], ensure_ascii=False))),
            rich={
                "avatar": {
                    "padding": [0, 5, 0, 0]
                },
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
                    color: '#744444'
                }, {
                    offset: 0.5,
                    color: '#a65d5d'
                }, {
                    offset: 1,
                    color: '#a65d5d'
                }])
            """)
        )
    )
    .reversal_axis()
    .set_global_opts(
        title_opts=opts.TitleOpts(
            title="",
            subtitle="",
            pos_top="5px",
            pos_left="center",
            title_textstyle_opts=opts.TextStyleOpts(
                font_size=24,
                color="transparent",
            ),
            subtitle_textstyle_opts=opts.TextStyleOpts(
                font_size=14,
                color="transparent"
            ),
            item_gap=10
        ),
        xaxis_opts=opts.AxisOpts(
            name="得票数",
            name_location="end",
            axislabel_opts=opts.LabelOpts(font_size=12),
            splitline_opts=opts.SplitLineOpts(
                is_show=True,
                linestyle_opts=opts.LineStyleOpts(
                    type_="dashed",
                    opacity=0.3
                )
            )
        ),
        yaxis_opts=opts.AxisOpts(
            name="排名",
            axislabel_opts=opts.LabelOpts(formatter="{value}"),
            axisline_opts=opts.AxisLineOpts(
                linestyle_opts=opts.LineStyleOpts(color="#333")
            )
        ),
        tooltip_opts=opts.TooltipOpts(
            formatter=JsCode("""
                function(params) {
                    var labels = JSON.parse('%s');
                    if (params.value === null) return '';
                    return params.seriesName + '<br/>' +
                           labels[params.dataIndex] + '<br/>' +
                           '得票数：' + params.value + '票<br/>' +
                           '排名：' + (72 - params.dataIndex);
                }
            """ % json.dumps(labels[::-1], ensure_ascii=False))
        ),
        datazoom_opts=opts.DataZoomOpts(
            is_show=True,
            type_="inside",
            orient="vertical",
            range_start=0,
            range_end=100
        ),
        legend_opts=opts.LegendOpts(
            type_="scroll",  
            pos_top="middle",  
            pos_right="2%", 
            orient="vertical", 
            textstyle_opts=opts.TextStyleOpts(
                color="#d3d3d3",
                font_size=12
            ),
            item_width=25,
            item_height=14,
            item_gap=10,
            selected_mode=True
        )
    )
)

print("正在生成图表...")
# 生成基础图表HTML
chart_html = bar.render_embed()

# 创建完整的HTML
html_content = f'''<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>ISML 2024 恒星组提名赛 - 女子组</title>
    <link rel="stylesheet" href="../../css/navbar.css">
    <link rel="stylesheet" href="../../css/footer.css">
    <link rel="stylesheet" href="../../css/visualization.css">
    <script src="../../js/navbar.js"></script>
    <script src="../../js/footer.js"></script>
    <script type="text/javascript" src="https://assets.pyecharts.org/assets/v5/echarts.min.js"></script>
</head>
<body>
    <!-- 导航栏会被 navbar.js 自动插入到这里 -->
    <div class="button-container">
        <a href="../../index.html" class="home-btn">返回主页</a>
        <a href="../tables/01-stellar-female-nomination-table.html" class="table-btn">查看表格</a>
    </div>
    {chart_html}
    <!-- 页尾会被 footer.js 自动插入到这里 -->
</body>
</html>'''

print("\n正在写入HTML文件...")
html_path = os.path.join(visualization_dir, '01-stellar-female-nomination.html')
log_path(html_path, "HTML文件")
with open(html_path, 'w', encoding='utf-8') as f:
    f.write(html_content)
print("图表生成完成。") 