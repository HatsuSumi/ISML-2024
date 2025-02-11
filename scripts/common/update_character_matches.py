import json
from datetime import datetime

def load_schedule():
    """加载赛程数据"""
    with open('data/common/schedule.json', 'r', encoding='utf-8') as f:
        return json.load(f)

def load_existing_matches():
    """加载现有的角色比赛数据"""
    try:
        with open('data/common/character_matches.json', 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        return {"matches": {}}

def get_match_result(match_date):
    """根据比赛日期判断结果"""
    end_date = datetime.strptime(match_date['end'], '%Y-%m-%d %H:%M:%S')
    now = datetime.now()
    if now > end_date:
        return "已结束"
    return "未开始"

def update_character_matches():
    """更新角色比赛数据"""
    schedule = load_schedule()
    existing_data = load_existing_matches()
    
    # 获取所有比赛
    all_matches = []
    for phase in schedule['phases'].values():
        all_matches.extend(phase['matches'])
    
    # 更新每个角色的比赛记录
    for match in all_matches:
        if 'participants' in match.get('details', {}):
            result = get_match_result(match['dateRange'])
            
            # 处理每个参与者
            for character_name in match['details'].get('characters', []):
                character_id = str(hash(character_name) & 0xffffffff)  # 生成唯一ID
                
                if character_id not in existing_data['matches']:
                    existing_data['matches'][character_id] = {
                        "name": character_name,
                        "matches": []
                    }
                
                # 检查是否已存在这场比赛
                match_exists = False
                for existing_match in existing_data['matches'][character_id]['matches']:
                    if existing_match['title'] == match['title']:
                        existing_match['result'] = result
                        match_exists = True
                        break
                
                # 如果是新比赛，添加到列表中
                if not match_exists:
                    existing_data['matches'][character_id]['matches'].append({
                        "title": match['title'],
                        "result": result
                    })
    
    # 保存更新后的数据
    with open('data/common/character_matches.json', 'w', encoding='utf-8') as f:
        json.dump(existing_data, f, ensure_ascii=False, indent=2)

if __name__ == '__main__':
    update_character_matches()
    print("角色比赛数据已更新") 