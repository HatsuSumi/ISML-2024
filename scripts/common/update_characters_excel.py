import pandas as pd
import os
import sys
import json

# 添加项目根目录到 Python 路径
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(current_dir)
sys.path.append(project_root)

def update_characters_excel():
    # 获取项目根目录
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    # 读取原始Excel文件
    excel_path = os.path.join(project_root, 'data', 'characters', 'stats', 'ISML2024-characters.xlsx')
    df = pd.read_excel(excel_path)
    
    # 处理未晋级的女性角色
    df = process_eliminated_characters(df, 'female')
    
    # 处理未晋级的男性角色
    df = process_eliminated_characters(df, 'male')
    
    # 保存更新后的Excel文件
    output_excel_path = os.path.join(project_root, 'data', 'characters', 'stats', 'ISML2024-characters_update.xlsx')
    df.to_excel(output_excel_path, index=False)
    
    # 转换为JSON格式
    characters_json = []
    for _, row in df.iterrows():
        character = {
            'id': row['ID'],
            'name': row['角色'],
            'ip': row['IP'],
            'cv': row['CV'],
            'img': row['头像'],
            'status': row['状态'],
            'group': row['分组'],
            'season': row['季节'],
            'gender': row['性别']
        }
        characters_json.append(character)
    
    # 保存JSON文件
    output_json_path = os.path.join(project_root, 'data', 'characters', 'stats', 'ISML2024-characters.json')
    with open(output_json_path, 'w', encoding='utf-8') as f:
        json.dump(characters_json, f, ensure_ascii=False, indent=4)
    
    print(f"已保存Excel文件到：{output_excel_path}")
    print(f"已保存JSON文件到：{output_json_path}")

def process_eliminated_characters(df, gender):
    # 获取项目根目录
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    # 读取提名数据
    file_name = '01-female-nomination.csv' if gender == 'female' else '02-male-nomination.csv'
    nomination_path = os.path.join(project_root, 'data', 'nomination', 'stellar', gender, file_name)
    nomination_df = pd.read_csv(nomination_path)
    
    # 筛选出未晋级的角色
    eliminated_characters = []
    id_prefix = 'ESF' if gender == 'female' else 'ESM'
    count = 1
    
    # 按得票数降序排序
    nomination_df = nomination_df.sort_values('得票数', ascending=False)
    
    # 根据性别设置晋级线
    threshold = 29 if gender == 'female' else 11
    
    for _, row in nomination_df.iterrows():
        # 如果得票数是数字且小于晋级线，就是未晋级角色
        try:
            votes = int(row['得票数'])
            if votes < threshold:  # 根据性别使用不同的晋级线
                eliminated_characters.append({
                    'ID': f'{id_prefix}{str(count).zfill(3)}',
                    '角色': row['角色'],
                    'IP': row['IP'],
                    'CV': row['CV'],
                    '头像': row['头像'],
                    '状态': '未晋级',
                    '分组': 'stellar',
                    '季节': '-',
                    '性别': gender
                })
                count += 1
        except ValueError:
            # 跳过得票数不是数字的情况（比如'-'）
            continue
    
    # 创建未晋级角色的DataFrame，只保留指定的列
    eliminated_df = pd.DataFrame(eliminated_characters)[['ID', '角色', 'IP', 'CV', '头像', '状态', '分组', '季节', '性别']]
    
    # 直接追加到原DataFrame后面
    df = pd.concat([df, eliminated_df], ignore_index=True)
    
    print(f"处理{gender}角色:")
    print(f"新增未晋级角色数：{len(eliminated_characters)}")
    print(f"当前总角色数：{len(df)}\n")
    
    return df

if __name__ == "__main__":
    update_characters_excel() 