import pandas as pd
import json
import os

# 获取脚本所在目录的绝对路径
script_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.dirname(os.path.dirname(script_dir))

def convert_nova_to_excel():
    # 读取JSON文件
    json_file = os.path.join(root_dir, 'data', 'characters', 'stats', 'ISML2024-characters.json')
    with open(json_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # 准备新星组数据
    nova_data = []
    seasons = ['winter', 'spring', 'summer', 'autumn']
    genders = ['female', 'male']
    
    for season in seasons:
        for gender in genders:
            characters = data['nova'][season][gender]
            for char in characters:
                nova_data.append({
                    'ID': char['id'],
                    '角色': char['name'],
                    'IP': char['ip'],
                    'CV': char['cv'],
                    '头像': char['avatar'],
                    '状态': char['status'],
                    '分组': 'nova',
                    '季节': season,
                    '性别': gender
                })
    
    # 创建DataFrame
    df = pd.DataFrame(nova_data)
    
    # 设置列的顺序
    columns = ['ID', '角色', 'IP', 'CV', '头像', '状态', '分组', '季节', '性别']
    df = df[columns]
    
    # 保存为Excel
    output_file = os.path.join(root_dir, 'data', 'characters', 'ISML2024-characters.xlsx')
    try:
        with pd.ExcelWriter(output_file, engine='openpyxl', mode='a') as writer:
            df.to_excel(writer, sheet_name='Nova', index=False)
            print(f"新星组数据已添加到: {output_file}")
    except FileNotFoundError:
        with pd.ExcelWriter(output_file, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name='Nova', index=False)
            print(f"已创建新文件并保存数据: {output_file}")

if __name__ == "__main__":
    convert_nova_to_excel() 