import json
import os
import logging

def update_nomination_status(characters_details_path, characters_stats_path, output_path):
    # 配置日志
    logging.basicConfig(level=logging.INFO, 
                        format='%(asctime)s - %(levelname)s: %(message)s',
                        handlers=[
                            logging.FileHandler('nomination_status_update.log', encoding='utf-8'),
                            logging.StreamHandler()
                        ])

    # 读取角色详细信息
    with open(characters_details_path, 'r', encoding='utf-8') as f:
        characters_details = json.load(f)

    # 读取角色状态信息
    with open(characters_stats_path, 'r', encoding='utf-8') as f:
        characters_stats = json.load(f)

    # 创建一个深拷贝，以便不修改原始数据
    updated_characters_details = json.loads(json.dumps(characters_details))

    # 创建一个映射字典，用于更灵活的匹配
    name_to_status = {}
    for group in ['stellar', 'nova']:
        for gender in ['female', 'male']:
            # 处理不同的嵌套结构
            if group == 'stellar':
                characters_list = characters_stats.get(group, {}).get(gender, [])
            else:
                characters_list = characters_stats.get(group, {}).get('winter', {}).get(gender, []) + \
                                  characters_stats.get(group, {}).get('spring', {}).get(gender, []) + \
                                  characters_stats.get(group, {}).get('summer', {}).get(gender, []) + \
                                  characters_stats.get(group, {}).get('autumn', {}).get(gender, [])
            
            for character in characters_list:
                name_to_status[character['name']] = character.get('status', '')

    # 更新提名赛轮次的结果
    unmatched_characters = []
    for char_id, char_data in updated_characters_details['characters'].items():
        matched = False
        
        # 尝试通过ID匹配
        for group in ['stellar', 'nova']:
            for gender in ['female', 'male']:
                if group == 'stellar':
                    characters_list = characters_stats.get(group, {}).get(gender, [])
                else:
                    characters_list = characters_stats.get(group, {}).get('winter', {}).get(gender, []) + \
                                      characters_stats.get(group, {}).get('spring', {}).get(gender, []) + \
                                      characters_stats.get(group, {}).get('summer', {}).get(gender, []) + \
                                      characters_stats.get(group, {}).get('autumn', {}).get(gender, [])
                
                if any(c['id'] == char_id for c in characters_list):
                    matched_char = next(c for c in characters_list if c['id'] == char_id)
                    status = matched_char.get('status', '')
                    result = '晋级' if '已晋级' in status else '未晋级'
                    
                    # 处理提名赛轮次
                    for round_info in char_data['rounds']:
                        if '提名' in round_info['round']:
                            # 只处理数字名次的提名赛轮次
                            if round_info.get('名次') and str(round_info['名次']).isdigit():
                                round_info['结果'] = result
                                
                                # 如果是淘汰，只保留当前提名赛轮次
                                if result == '未晋级':
                                    char_data['rounds'] = [round_info]
                                break
                    
                    matched = True
                    break
            
            if matched:
                break
        
        # 如果ID匹配失败，尝试通过名字匹配
        if not matched:
            name = char_data['basic']['name']
            if name in name_to_status:
                status = name_to_status[name]
                result = '晋级' if '已晋级' in status else '未晋级'
                
                for round_info in char_data['rounds']:
                    if '提名' in round_info['round']:
                        # 只处理数字名次的提名赛轮次
                        if round_info.get('名次') and str(round_info['名次']).isdigit():
                            round_info['结果'] = result
                            
                            # 如果是淘汰，只保留当前提名赛轮次
                            if result == '未晋级':
                                char_data['rounds'] = [round_info]
                            break
                matched = True
            else:
                unmatched_characters.append(name)
    
    # 记录未匹配的角色
    if unmatched_characters:
        logging.warning(f"未匹配的角色: {unmatched_characters}")

    # 保存更新后的文件
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(updated_characters_details, f, ensure_ascii=False, indent=4)

    logging.info(f"Successfully created updated characters details file at {output_path}")

if __name__ == "__main__":
    base_dir = r'f:\ISML\ISML2024-github'
    characters_details_path = os.path.join(base_dir, 'data', 'characters', 'characters-details.json')
    characters_stats_path = os.path.join(base_dir, 'data', 'characters', 'stats', 'ISML2024-characters.json')
    output_path = os.path.join(base_dir, 'data', 'characters', 'characters-details-updated.json')
    
    update_nomination_status(characters_details_path, characters_stats_path, output_path)