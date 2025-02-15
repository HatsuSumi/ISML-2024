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
nomination_file = os.path.join(root_dir, 'data', 'nomination', 'nova', 'autumn', 'female', '09-nova-autumn-female-nomination.xlsx')
output_file = os.path.join(root_dir, 'data', 'nomination', 'nova', 'autumn', 'female', '09-nova-autumn-female-nomination-updated.xlsx')
characters_output = os.path.join(root_dir, 'data', 'characters', 'base', 'characters-data-updated.xlsx')

# 读取文件
characters_df = pd.read_csv(characters_file, encoding='utf-8')
nomination_df = pd.read_excel(nomination_file)

# 确保头像和CV列为字符串类型
nomination_df['头像'] = nomination_df['头像'].astype(str)
nomination_df['CV'] = nomination_df['CV'].astype(str)

# 将'nan'替换为空字符串
nomination_df['头像'] = nomination_df['头像'].replace('nan', '')
nomination_df['CV'] = nomination_df['CV'].replace('nan', '')

logging.info(f"开始处理，共有 {len(nomination_df)} 个角色需要匹配")

# 创建(角色,IP)-(头像,CV)字典
info_dict = {}
for _, row in characters_df.iterrows():
    key = (row['角色'], row['IP'])
    info_dict[key] = {
        'avatar': row['头像'],
        'cv': row['CV']
    }

matched_count = 0
unmatched_count = 0
new_characters = []

# 更新头像和CV信息
for idx, row in nomination_df.iterrows():
    key = (row['角色'], row['IP'])
    if key in info_dict:
        nomination_df.at[idx, '头像'] = info_dict[key]['avatar']
        nomination_df.at[idx, 'CV'] = info_dict[key]['cv']
        matched_count += 1
        logging.info(f"成功匹配: {row['角色']} ({row['IP']}) - CV: {info_dict[key]['cv']}")
    else:
        logging.warning(f"未找到匹配: {row['角色']} ({row['IP']})")
        unmatched_count += 1
        # 添加新角色
        new_characters.append({
            '角色': row['角色'],
            'IP': row['IP'],
            '角色（英）': row['角色（英）'],
            'CV': '',
            '头像': '',
            'IP首映年份': '',
            'IP首映季度': ''
        })

# 保存更新后的Excel文件
nomination_df.to_excel(output_file, index=False)

# 如果有新角色，添加到characters-data.csv
if new_characters:
    logging.info("\n新增角色列表:")
    logging.info("=" * 50)
    for char in new_characters:
        logging.info(f"- {char['角色']} ({char['IP']})")
    
    # 将新角色添加到DataFrame
    new_chars_df = pd.DataFrame(new_characters)
    
    # 保存更新后的characters-data
    new_chars_df.to_excel(characters_output, index=False)
    logging.info(f"\n新角色已添加到: {characters_output}")

# 打印匹配结果统计
logging.info("\n匹配结果汇总:")
logging.info("=" * 50)
logging.info(f"处理完成:")
logging.info(f"- 成功匹配: {matched_count} 个")
logging.info(f"- 未能匹配: {unmatched_count} 个")
logging.info(f"- 匹配率: {matched_count/len(nomination_df)*100:.1f}%")
logging.info("=" * 50)
logging.info(f"文件已保存到: {output_file}") 