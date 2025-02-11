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
characters_file = os.path.join(root_dir, 'data', 'characters', 'base', 'characters-data.csv')
nomination_file = os.path.join(root_dir, 'data', 'nomination', 'nova', 'winter', 'male', '04-nova-winter-male-nomination.xlsx')
output_file = os.path.join(root_dir, 'data', 'nomination', 'nova', 'winter', 'male', '04-nova-winter-male-nomination-updated.xlsx')

# 读取文件
characters_df = pd.read_csv(characters_file, encoding='utf-8')
nomination_df = pd.read_excel(nomination_file)

logging.info(f"开始处理，共有 {len(nomination_df)} 个角色需要匹配")

# 创建(角色,IP)-CV字典
cv_dict = {}
for _, row in characters_df.iterrows():
    key = (row['角色'], row['IP'])
    cv_dict[key] = row['CV']

matched_count = 0
unmatched_count = 0

# 更新CV信息
for idx, row in nomination_df.iterrows():
    key = (row['角色'], row['IP'])
    if key in cv_dict:
        nomination_df.at[idx, 'CV'] = cv_dict[key]
        matched_count += 1
    else:
        logging.warning(f"未找到匹配: {row['角色']} ({row['IP']})")
        unmatched_count += 1

# 保存更新后的Excel文件
nomination_df.to_excel(output_file, index=False)

logging.info(f"处理完成:")
logging.info(f"- 成功匹配: {matched_count} 个")
logging.info(f"- 未能匹配: {unmatched_count} 个")
logging.info(f"- 匹配率: {matched_count/len(nomination_df)*100:.1f}%")
logging.info(f"文件已保存到: {output_file}") 