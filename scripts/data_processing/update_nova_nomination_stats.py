import json
import os

# 获取脚本所在目录的绝对路径
script_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.dirname(os.path.dirname(script_dir))

# 读取源数据和目标文件
source_file = os.path.join(root_dir, 'data', 'characters', 'base', 'characters-data.json')
stats_file = os.path.join(root_dir, 'data', 'statistics', 'nomination-stats.json')
output_file = os.path.join(root_dir, 'data', 'statistics', 'nomination-stats-updated.json')
characters_file = os.path.join(root_dir, 'data', 'characters', 'stats', 'ISML2024-characters.json')

def update_nova_stats():
    # 读取文件
    with open(source_file, 'r', encoding='utf-8') as f:
        source_data = json.load(f)
    print("source_data structure:", source_data.keys())
    with open(stats_file, 'r', encoding='utf-8') as f:
        stats_data = json.load(f)
    with open(characters_file, 'r', encoding='utf-8') as f:
        characters_data = json.load(f)
    
    # 创建ip_year和ip_season的映射
    ip_info = {}
    for key, char in source_data.items():
        ip_info[char['name']] = {
            'ip_year': char['ip_year'],
            'ip_season': char['ip_season']
        }
    
    # 更新新星组冬季赛数据
    for gender in ['female', 'male']:
        stats_data['nova']['winter'][gender] = []
        for char in characters_data['nova']['winter'][gender]:
            # 如果角色不在ip_info中，打印警告并跳过
            if char['name'] not in ip_info:
                print(f"警告: 角色 {char['name']} 在characters-data.json中不存在")
                continue
            
            char_info = {
                'name': char['name'],
                'ip': char['ip'],
                'cv': char['cv'],
                'status': '晋级' if char['status'] == '已晋级至冬季赛预选赛' else char['status'],
                'avatar': char['avatar'],
                'votes': char['votes'] if 'votes' in char else '-',
                'ip_year': ip_info[char['name']]['ip_year'],
                'ip_season': ip_info[char['name']]['ip_season']
            }
            stats_data['nova']['winter'][gender].append(char_info)
    
    # 保存更新后的文件
    with open(output_file, 'w', encoding='utf-8', newline='\n') as f:
        json.dump(stats_data, f, ensure_ascii=False, indent=4)
    
    print(f"新星组统计数据已更新并保存到: {output_file}")

if __name__ == "__main__":
    update_nova_stats() 