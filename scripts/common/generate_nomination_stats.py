import json
import os
import pandas as pd

def load_json(file_path):
    """加载JSON文件"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading {file_path}: {e}")
        return None

def save_json(data, file_path):
    """保存JSON文件"""
    try:
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=4)
        print(f"Successfully saved to {file_path}")
    except Exception as e:
        print(f"Error saving {file_path}: {e}")

def load_excel(file_path):
    """加载Excel文件"""
    try:
        return pd.read_excel(file_path)
    except Exception as e:
        print(f"Error loading Excel {file_path}: {e}")
        return None

def get_mapped_status(status):
    """状态映射函数"""
    status_mapping = {
        '已晋级至预选赛': '晋级',
        # 可以添加其他状态映射
    }
    return status_mapping.get(status, status)

def get_status_by_votes(votes, is_male=False):
    """根据得票数判断晋级状态"""
    if votes == '-': 
        return '晋级'
    try:
        vote_count = int(votes)
        if is_male:
            return '晋级' if vote_count >= 11 else '未晋级'
        else:
            return '晋级' if vote_count >= 29 else '未晋级'
    except ValueError:
        return '未知'

def process_nomination_data():
    # 基础路径
    base_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    # 输入文件路径
    female_path = os.path.join(base_path, 'data', 'nomination', 'stellar', 'female', '01-female-nomination.json')
    male_excel_path = os.path.join(base_path, 'data', 'nomination', 'stellar', 'male', '02-male-nomination.xlsx')
    
    # 输出文件路径
    stats_path = os.path.join(base_path, 'data', 'statistics', 'nomination-stats.json')
    
    # 加载数据
    female_data = load_json(female_path)
    male_df = load_excel(male_excel_path)
    if not female_data or male_df is None:
        return
    
    # 打印 Excel 列名
    print("\nExcel 列名：")
    print(male_df.columns.tolist())
    
    # 打印 JSON 结构
    print("\nJSON 数据结构：")
    if female_data and 'data' in female_data:
        print(json.dumps(female_data['data'][0], ensure_ascii=False, indent=2))
    
    # 加载 characters-data.xlsx 获取 IP 年份信息
    characters_path = os.path.join(base_path, 'data', 'characters', 'base', 'characters-data.xlsx')
    characters_df = load_excel(characters_path)
    
    # 创建 IP 年份映射
    ip_info = {}
    if characters_df is not None:
        for _, row in characters_df.iterrows():
            if pd.notna(row['IP首映年份']):
                ip_info[row['IP']] = {
                    'year': int(row['IP首映年份']),
                    'season': int(row['IP首映季度'])
                }
    
    print("\n找不到IP年份信息的作品：")
    missing_ip_info = set()  # 用集合去重
    
    # 创建新的统计数据结构
    stats_data = {
        "stellar": {"female": [], "male": []},
        "nova": {
            "winter": {"female": [], "male": []},
            "spring": {"female": [], "male": []},
            "summer": {"female": [], "male": []},
            "autumn": {"female": [], "male": []}
        }
    }
    
    # 处理女性提名数据
    for item in female_data['data']:
        stats_character = {
            "name": item["name"],
            "ip": item["ip"],
            "cv": item["cv"],
            "status": get_status_by_votes(str(item["votes"]), is_male=False),
            "avatar": item.get("avatar", ""),
            "votes": str(item["votes"])
        }
        # 添加 IP 年份信息
        if item["ip"] in ip_info:
            stats_character["ip_year"] = ip_info[item["ip"]]["year"]
            stats_character["ip_season"] = ip_info[item["ip"]]["season"]
        else:
            missing_ip_info.add(item["ip"])
        
        stats_data["stellar"]["female"].append(stats_character)
    
    # 处理男性提名数据
    for _, row in male_df.iterrows():
        stats_character = {
            "name": row["角色"],
            "ip": row["IP"],
            "cv": row["CV"],
            "status": get_status_by_votes(str(row["得票数"]), is_male=True),
            "avatar": "" if pd.isna(row.get("头像")) else row["头像"],
            "votes": str(row["得票数"])
        }
        # 添加 IP 年份信息
        if row["IP"] in ip_info:
            stats_character["ip_year"] = ip_info[row["IP"]]["year"]
            stats_character["ip_season"] = ip_info[row["IP"]]["season"]
        else:
            missing_ip_info.add(row["IP"])
        
        stats_data["stellar"]["male"].append(stats_character)
    
    # 输出缺失信息
    if missing_ip_info:
        print("\n以下作品缺少年份信息：")
        for ip in sorted(missing_ip_info):
            print(f"- {ip}")
    else:
        print("\n所有作品都有年份信息")
    
    # 保存统计数据
    save_json(stats_data, stats_path)

if __name__ == "__main__":
    process_nomination_data()
    print("Data processing completed!") 