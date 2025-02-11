import json
import os

def get_project_root():
    return os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def load_json(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def update_nomination_rank():
    root_dir = get_project_root()
    details_file = os.path.join(root_dir, 'data', 'characters', 'characters-details.json')
    
    # 加载数据
    details_data = load_json(details_file)
    
    # 更新所有角色的轮次信息
    updated = 0
    for char_id, char_info in details_data['characters'].items():
        for round_info in char_info['rounds']:
            # 只处理提名轮次
            if '提名' in round_info['round']:
                # 删除字段
                for field in ['visualization', 'table', 'rules']:
                    if field in round_info:
                        del round_info[field]
                        updated += 1
    
    # 保存更新后的数据
    with open(details_file, 'w', encoding='utf-8') as f:
        json.dump(details_data, f, ensure_ascii=False, indent=4)
    
    print(f"已删除 {updated} 个字段")

if __name__ == "__main__":
    try:
        update_nomination_rank()
    except Exception as e:
        print(f"发生错误: {e}")
