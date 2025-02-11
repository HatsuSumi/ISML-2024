import json
import os

def get_project_root():
    return os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def load_json(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_json(data, file_path):
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)

def update_character_info():
    root_dir = get_project_root()
    old_file = os.path.join(root_dir, 'data', 'characters', 'characterData_old.json')
    new_file = os.path.join(root_dir, 'data', 'characters', 'characterData.json')
    
    old_data = load_json(old_file)
    new_data = load_json(new_file)
    
    # 遍历新数据中的所有角色
    for char_id, char_info in new_data['characters'].items():
        # 为每个角色添加新字段（如果不存在）
        if 'company' not in char_info['basic']:
            char_info['basic']['company'] = ''
        if 'birthday' not in char_info['basic']:
            char_info['basic']['birthday'] = ''
            
        # 在旧数据中查找匹配的角色
        for old_char in old_data.values():
            # 通过名字和作品名匹配
            if (old_char['name'] == char_info['basic']['name'] and 
                old_char['ip'] == char_info['basic']['ip']):
                # 如果旧数据中有这些字段，则更新
                if 'company' in old_char:
                    char_info['basic']['company'] = old_char['company']
                if 'birthday' in old_char:
                    char_info['basic']['birthday'] = old_char['birthday']
                break
    
    # 保存更新后的数据
    save_json(new_data, new_file)
    print("角色信息更新完成")

if __name__ == "__main__":
    try:
        update_character_info()
    except Exception as e:
        print(f"发生错误: {e}") 