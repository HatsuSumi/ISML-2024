import pandas as pd
import os
import logging

# 设置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

# 获取脚本所在目录的绝对路径
script_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.dirname(os.path.dirname(script_dir))

# 输入和输出文件路径
characters_file = os.path.join(root_dir, 'data', 'characters', 'base', 'characters-data.xlsx')
nomination_file = os.path.join(root_dir, 'data', 'nomination', 'nova', 'winter', 'male', '04-nova-winter-male-nomination.xlsx')
output_file = os.path.join(root_dir, 'data', 'characters', 'base', 'characters-data-updated.xlsx')

# 读取文件
characters_df = pd.read_excel(characters_file)
nomination_df = pd.read_excel(nomination_file)

# 创建(角色,IP)集合
existing_chars = set()
for _, row in characters_df.iterrows():
    key = (row['角色'], row['IP'])
    existing_chars.add(key)

# 找出需要添加的新角色
new_chars = []
for _, row in nomination_df.iterrows():
    key = (row['角色'], row['IP'])
    if key not in existing_chars:
        new_chars.append({
            '角色': row['角色'],
            'IP': row['IP'],
            '角色（英）': row['角色（英）'],
            'CV': '',  # 待补充
            '头像': '',  # 待补充
            'IP首映年份': '',  # 待补充
            'IP首映季度': ''  # 待补充
        })

# 创建新角色的DataFrame
new_chars_df = pd.DataFrame(new_chars)

# 合并到现有Excel文件
updated_df = pd.concat([characters_df, new_chars_df], ignore_index=True)
updated_df.to_excel(output_file, index=False)

logging.info(f"找到 {len(new_chars)} 个新角色")
logging.info(f"已保存到: {output_file}")

# 打印新增的角色列表
if len(new_chars) > 0:
    logging.info("\n新增角色列表:")
    for char in new_chars:
        logging.info(f"- {char['角色']} ({char['IP']})") 