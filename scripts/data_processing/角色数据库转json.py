import json
import csv
import os

# 获取脚本所在目录的绝对路径
script_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.dirname(os.path.dirname(script_dir))

# 读取源数据和目标文件
csv_file = os.path.join(root_dir, 'data', 'characters', 'base', 'characters-data.csv')
json_file = os.path.join(root_dir, 'data', 'characters', 'base', 'characters-data.json')
output_file = os.path.join(root_dir, 'data', 'characters', 'base', 'characters-data-updated.json')

def update_characters_data():
    # 读取CSV文件
    characters = {}
    # 先打印CSV的列名
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        headers = next(reader)
    
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            key = f"{row['角色']}@{row['IP']}"
            characters[key] = {
                'name': row['角色'],
                'ip': row['IP'],
                'name_en': row['角色（英）'],
                'cv': row['CV'],
                'avatar': row['头像'],
                'ip_year': int(row['IP首映年份']) if row['IP首映年份'] else 0,
                'ip_season': int(row['IP首映季度']) if row['IP首映季度'] else 0
            }
    
    # 保存为JSON文件
    with open(output_file, 'w', encoding='utf-8', newline='\n') as f:
        json.dump(characters, f, ensure_ascii=False, indent=4)
    
    print(f"角色数据已更新并保存到: {output_file}")

if __name__ == "__main__":
    update_characters_data() 