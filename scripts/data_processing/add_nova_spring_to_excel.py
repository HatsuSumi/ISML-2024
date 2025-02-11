import pandas as pd
import json
import os

# 获取脚本所在目录的绝对路径
script_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.dirname(os.path.dirname(script_dir))

def add_nova_spring_to_excel():
    # 准备新星组数据
    nova_data = []
    
    # 春季赛 - 女性组
    nomination_file = os.path.join(root_dir, 'data', 'nomination', 'nova', 'spring', 'female', '05-nova-spring-female-nomination.json')
    with open(nomination_file, 'r', encoding='utf-8') as f:
        nomination_data = json.load(f)
    
    spring_female = []
    advance_count = 1
    eliminate_count = 1
    for i, char in enumerate(nomination_data['data'], 1):
        status = '已晋级至春季赛预选赛' if char['is_advanced'] else '未晋级'
        char_id = f"NFSP{advance_count:03d}" if char['is_advanced'] else f"ENFSP{eliminate_count:03d}"
        if char['is_advanced']:
            advance_count += 1
        else:
            eliminate_count += 1
        spring_female.append({
            'ID': char_id,
            '角色': char['name'],
            'IP': char['ip'],
            'CV': char['cv'],
            '头像': char['avatar'],
            '状态': status,
            '分组': 'nova',
            '季节': 'spring',
            '性别': 'female'
        })
    nova_data.extend(spring_female)
    
    # 春季赛 - 男性组
    nomination_file = os.path.join(root_dir, 'data', 'nomination', 'nova', 'spring', 'male', '06-nova-spring-male-nomination.json')
    with open(nomination_file, 'r', encoding='utf-8') as f:
        nomination_data = json.load(f)
    
    spring_male = []
    advance_count = 1
    eliminate_count = 1
    for i, char in enumerate(nomination_data['data'], 1):
        status = '已晋级至春季赛预选赛' if char['is_advanced'] else '未晋级'
        char_id = f"NMS{advance_count:03d}" if char['is_advanced'] else f"ENMS{eliminate_count:03d}"
        if char['is_advanced']:
            advance_count += 1
        else:
            eliminate_count += 1
        spring_male.append({
            'ID': char_id,
            '角色': char['name'],
            'IP': char['ip'],
            'CV': char['cv'],
            '头像': char['avatar'],
            '状态': status,
            '分组': 'nova',
            '季节': 'spring',
            '性别': 'male'
        })
    nova_data.extend(spring_male)
    
    # 创建DataFrame
    df = pd.DataFrame(nova_data)
    
    # 设置列的顺序
    columns = ['ID', '角色', 'IP', 'CV', '头像', '状态', '分组', '季节', '性别']
    df = df[columns]
    
    # 保存为Excel
    output_file = os.path.join(root_dir, 'data', 'characters', 'ISML2024-characters-nova-spring.xlsx')
    with pd.ExcelWriter(output_file, engine='openpyxl') as writer:
        df.to_excel(writer, sheet_name='Nova', index=False)
    
    print(f"春季赛数据已添加到: {output_file}")

if __name__ == "__main__":
    add_nova_spring_to_excel() 