import pandas as pd
import json
import os

def update_nomination_stats():
    # 获取项目根目录
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    # 读取Excel和JSON文件
    excel_path = os.path.join(project_root, 'data', 'characters', 'base', 'characters-data.xlsx')
    json_path = os.path.join(project_root, 'data', 'statistics', 'nomination-stats.json')
    
    print(f"正在读取文件：\n{excel_path}\n{json_path}")
    
    try:
        # 读取Excel和JSON
        df = pd.read_excel(excel_path)
        with open(json_path, 'r', encoding='utf-8') as f:
            json_data = json.load(f)
        
        # 更新JSON数据
        for group_name, group in json_data.items():  # stellar/nova
            if isinstance(group, dict):
                for season_name, characters in group.items():  # winter/spring/summer/autumn 或 female/male
                    if isinstance(characters, list):
                        for char in characters:
                            # 在Excel中查找对应角色
                            mask = (df['角色'] == char['name']) & (df['IP'] == char['ip'])
                            if mask.any():
                                row = df[mask].iloc[0]
                                # 只添加年份和季度信息
                                if pd.notna(row['IP首映年份']):
                                    char['ip_year'] = int(row['IP首映年份'])
                                if pd.notna(row['IP首映季度']):
                                    char['ip_season'] = int(row['IP首映季度'])
        
        # 保存更新后的文件
        output_path = json_path.replace('.json', '_update.json')
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(json_data, f, ensure_ascii=False, indent=4)
        
        print(f"\n已保存到：{output_path}")
        
    except FileNotFoundError as e:
        print(f"错误：找不到文件\n{str(e)}")
    except Exception as e:
        print(f"错误：{str(e)}")

if __name__ == "__main__":
    update_nomination_stats() 