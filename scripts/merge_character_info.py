import json
import os

def get_project_root():
    return os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def load_json(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def merge_character_info():
    root_dir = get_project_root()
    old_file = os.path.join(root_dir, 'data', 'characters', 'characterData_old.json')
    base_json = os.path.join(root_dir, 'data', 'characters', 'base', 'characters-data.json')
    
    # 加载数据
    old_data = load_json(old_file)
    base_data = load_json(base_json)
    
    # 创建角色信息映射
    char_info = {}
    for char_id, char_data in old_data.items():
        key = f"{char_data['name']}@{char_data['ip']}"
        company = char_data.get('company', '')
        if isinstance(company, list):
            company = '，'.join(company)
        char_info[key] = {
            'company': company,
            'birthday': char_data.get('birthday', '')
        }
    
    # 更新 base_data，保持原有结构
    updated = 0
    new_data = {}
    for key, char in base_data.items():
        new_char = {
            'name': char['name'],
            'ip': char['ip'],
            'name_en': char['name_en'],
            'cv': char['cv'],
            'avatar': char['avatar'],
            'ip_year': char['ip_year'],
            'ip_season': char['ip_season'],
            'company': '',  # 默认添加空值
            'birthday': ''  # 默认添加空值
        }
        
        # 如果有数据则更新
        if key in char_info:
            if char_info[key]['company']:
                new_char['company'] = char_info[key]['company']
                updated += 1
            if char_info[key]['birthday']:
                new_char['birthday'] = char_info[key]['birthday']
                updated += 1
        
        new_data[key] = new_char
    
    # 保存为新文件
    output_json = os.path.join(root_dir, 'data', 'characters', 'base', 'characters-data-new.json')
    with open(output_json, 'w', encoding='utf-8') as f:
        json.dump(new_data, f, ensure_ascii=False, indent=4)
    
    print(f"已为 {updated} 个字段补充了信息")

if __name__ == "__main__":
    try:
        merge_character_info()
    except Exception as e:
        print(f"发生错误: {e}") 