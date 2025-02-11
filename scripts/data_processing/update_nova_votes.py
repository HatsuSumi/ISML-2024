import json
import os

# 获取脚本所在目录的绝对路径
script_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.dirname(os.path.dirname(script_dir))

# 读取源数据和目标文件
female_votes_file = os.path.join(root_dir, 'data', 'nomination', 'nova', 'winter', 'female', '03-nova-winter-female-nomination.json')
male_votes_file = os.path.join(root_dir, 'data', 'nomination', 'nova', 'winter', 'male', '04-nova-winter-male-nomination.json')
stats_file = os.path.join(root_dir, 'data', 'statistics', 'nomination-stats-updated.json')
output_file = os.path.join(root_dir, 'data', 'statistics', 'nomination-stats-updated-votes.json')

def update_nova_votes():
    # 读取文件
    with open(female_votes_file, 'r', encoding='utf-8') as f:
        female_votes_data = json.load(f)
    with open(male_votes_file, 'r', encoding='utf-8') as f:
        male_votes_data = json.load(f)
    with open(stats_file, 'r', encoding='utf-8') as f:
        stats_data = json.load(f)
    
    # 将恒星组的votes转成数字类型
    for gender in ['female', 'male']:
        for char in stats_data['stellar'][gender]:
            if char['votes'] != '-':
                char['votes'] = int(char['votes'])
    
    # 创建票数映射
    female_votes_info = {}
    male_votes_info = {}
    for char in female_votes_data['data']:
        female_votes_info[char['name']] = char['votes']
    for char in male_votes_data['data']:
        male_votes_info[char['name']] = char['votes']
    
    # 更新票数
    for char in stats_data['nova']['winter']['female']:
        if char['name'] in female_votes_info:
            char['votes'] = female_votes_info[char['name']]
   
    for char in stats_data['nova']['winter']['male']:
        if char['name'] in male_votes_info:
            char['votes'] = male_votes_info[char['name']]
    
    # 保存更新后的文件
    with open(output_file, 'w', encoding='utf-8', newline='\n') as f:
        json.dump(stats_data, f, ensure_ascii=False, indent=4)
    
    print(f"新星组票数已更新并保存到: {output_file}")

if __name__ == "__main__":
    update_nova_votes() 