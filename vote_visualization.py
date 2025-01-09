# -*- coding: utf-8 -*-
import pandas as pd
from pyecharts import options as opts
from pyecharts.charts import Bar
from pyecharts.commons.utils import JsCode
import json
from pyecharts.globals import ThemeType

# 读取CSV文件
print("正在读取CSV文件...")
df = pd.read_csv('01-Female.csv', encoding='utf-8')
print("CSV文件读取完成。")

# 将'-'替换为0，并将得票数转换为数值型
print("正在处理得票数数据...")
df['得票数'] = pd.to_numeric(df['得票数'].replace('-', '0'))
print("得票数数据处理完成。")

# 筛选出有实际得票数的角色并按得票数降序排序
print("正在筛选和排序数据...")
df_voted = df[df['得票数'] > 0].sort_values('得票数', ascending=False)
print("数据筛选和排序完成。")

# 准备数据
print("正在准备图表数据...")
ranks = [str(i+1) for i in range(len(df_voted))]
votes = df_voted['得票数'].tolist()
labels = [f"{role}（{anime}）" for role, anime in zip(df_voted['角色'], df_voted['作品'])]
avatars = df_voted['头像'].tolist()

# 删除图片路径打印部分
print("\n图表数据准备完成。")

# 准备数据
voted_data = votes[::-1]  
advance_data = [v if i >= 20 else None for i, v in enumerate(voted_data)]  
eliminate_data = [v if i < 20 else None for i, v in enumerate(voted_data)] 

# 创建图表
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
        
        document.querySelector('#vote_chart').style.margin = '0 auto';
        document.querySelector('#vote_chart').style.textAlign = 'center';

        var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '1500');
        svg.setAttribute('height', '70');  
        svg.style.position = 'absolute';
        svg.style.top = '5px';
        svg.style.left = '0';
        svg.style.pointerEvents = 'none';
        
        // 创建主标题
        var title = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        title.textContent = '12.31-1.7 - 恒星组提名-女性组别';
        title.setAttribute('x', '750');
        title.setAttribute('y', '25');
        title.setAttribute('text-anchor', 'middle');
        title.setAttribute('font-size', '24');
        title.setAttribute('font-weight', 'bold');
        
        // 创建副标题
        var subtitle = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        subtitle.textContent = '前52名晋级至主赛事恒星组预选赛阶段';
        subtitle.setAttribute('x', '750');
        subtitle.setAttribute('y', '50');
        subtitle.setAttribute('text-anchor', 'middle');
        subtitle.setAttribute('font-size', '14');
        subtitle.setAttribute('fill', '#9370DB');
        
        // 创建渐变
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
        
        document.querySelector('#vote_chart').appendChild(svg);
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

# 生成图表
print("正在生成图表...")
bar.render('恒星女子组提名.html', encoding="utf-8")
print("图表生成完成。") 