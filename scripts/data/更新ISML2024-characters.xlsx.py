import pandas as pd
import json
import os
from datetime import datetime

def load_json_data(file_path):
    """加载JSON文件"""
    with open(file_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def generate_id(df, gender, is_eliminated):
    """生成ID"""
    prefix = ''
    if is_eliminated:
        prefix = 'ENFSU' if gender == 'female' else 'ENMSU'
    else:
        prefix = 'NFSU' if gender == 'female' else 'NMSU'
    
    # 获取相同前缀的最大编号
    same_prefix = df[df['ID'].str.startswith(prefix)]['ID']
    if len(same_prefix) == 0:
        return f"{prefix}001"
    
    max_num = max([int(id[-3:]) for id in same_prefix])
    return f"{prefix}{(max_num + 1):03d}"

def add_summer_characters():
    # 文件路径
    excel_path = 'data/characters/stats/ISML2024-characters.xlsx'
    female_json = 'data/nomination/nova/summer/female/07-nova-summer-female-nomination.json'
    male_json = 'data/nomination/nova/summer/male/08-nova-summer-male-nomination.json'
    
    # 读取Excel文件
    df = pd.read_excel(excel_path)
    
    # 加载夏季赛数据
    female_data = load_json_data(female_json)
    male_data = load_json_data(male_json)
    
    # 新角色列表
    new_characters = []
    
    # 处理女性角色
    for char in female_data['data']:
        if not df[df['角色'] == char['name']].empty:
            continue
            
        is_eliminated = not char['is_advanced'] 
        new_char = {
            'ID': generate_id(df, 'female', is_eliminated),
            '角色': char['name'],
            'IP': char['ip'],
            'CV': char.get('cv', ''),
            '头像': char.get('avatar', ''),
            '状态': '已晋级至夏季赛预选赛' if char['is_advanced'] else '未晋级',
            '分组': 'nova',
            '季节': 'summer',
            '性别': 'female'
        }
        new_characters.append(new_char)
        df = pd.concat([df, pd.DataFrame([new_char])], ignore_index=True)
    
    # 处理男性角色
    for char in male_data['data']:
        if not df[df['角色'] == char['name']].empty:
            continue
            
        is_eliminated = char.get('eliminated', False)  
        new_char = {
            'ID': generate_id(df, 'male', is_eliminated),
            '角色': char['name'],
            'IP': char['ip'],
            'CV': char.get('cv', ''),
            '头像': char.get('avatar', ''),
            '状态': '已晋级至夏季赛预选赛' if char['is_advanced'] else '未晋级',
            '分组': 'nova',
            '季节': 'summer',
            '性别': 'male'
        }
        new_characters.append(new_char)
        df = pd.concat([df, pd.DataFrame([new_char])], ignore_index=True)
    
    # 如果有新角色，添加到DataFrame
    if new_characters:
        # 生成新文件名
        file_name = f'ISML2024-characters_{datetime.now().strftime("%Y%m%d")}.xlsx'
        output_path = os.path.join('data/characters/stats', file_name)
        
        # 保存到新文件
        df.to_excel(output_path, index=False)
        print(f'已添加 {len(new_characters)} 个新角色')
        print(f'新文件已保存: {output_path}')
    else:
        print('没有新角色需要添加')

if __name__ == '__main__':
    add_summer_characters() 