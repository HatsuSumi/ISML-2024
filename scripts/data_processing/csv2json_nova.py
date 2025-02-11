import pandas as pd
import json
import os

# 获取脚本所在目录的绝对路径
script_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.dirname(os.path.dirname(script_dir))

def update_json_with_nova():
    # 读取CSV文件
    csv_file = os.path.join(root_dir, 'data', 'characters', 'stats', 'ISML2024-characters.csv')
    df = pd.read_csv(csv_file).fillna('')
    
    # 读取现有的JSON文件
    json_file = os.path.join(root_dir, 'data', 'characters', 'stats', 'ISML2024-characters.json')
    with open(json_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # 添加nova结构
    data['nova'] = {
        'winter': {'female': [], 'male': []},
        'spring': {'female': [], 'male': []},
        'summer': {'female': [], 'male': []},
        'autumn': {'female': [], 'male': []}
    }
    
    # 处理nova组数据
    nova_df = df[df['分组'] == 'nova']
    for _, row in nova_df.iterrows():
        print(f"处理角色 {row['ID']}:")
        print(f"- 原始头像值: [{row['头像']}]")
        avatar = str(row['头像']) if row['头像'] else ''
        print(f"- 处理后: [{avatar}]")
        char_data = {
            'id': row['ID'],
            'name': row['角色'],
            'ip': row['IP'],
            'cv': row['CV'],
            'avatar': avatar,
            'status': row['状态']
        }
        data['nova'][row['季节']][row['性别']].append(char_data)
    
    # 保存更新后的JSON
    output_file = os.path.join(root_dir, 'data', 'characters', 'stats', 'ISML2024-characters-nova.json')
    with open(output_file, 'w', encoding='utf-8', newline='\n') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)
    
    print(f"新星组数据已保存到: {output_file}")

if __name__ == "__main__":
    update_json_with_nova() 