import pandas as pd
import os

# 获取脚本所在目录的绝对路径
script_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.dirname(os.path.dirname(script_dir))

# 输入和输出文件路径
input_file = os.path.join(root_dir, 'data', 'nomination', 'nova', 'winter', 'male', 'male.txt')
input_file_en = os.path.join(root_dir, 'data', 'nomination', 'nova', 'winter', 'male', 'male-en.txt')
base_excel = os.path.join(root_dir, 'data', 'nomination', 'nova', 'winter', 'male', '04-nova-winter-male-nomination.xlsx')
output_file = os.path.join(root_dir, 'data', 'nomination', 'nova', 'winter', 'male', '04-nova-winter-male-nomination-updated.xlsx')

# 读取txt文件
df = pd.read_csv(input_file, sep='\t', encoding='utf-8')
df_en = pd.read_csv(input_file_en, sep='\t', encoding='utf-8')

# 读取现有的Excel文件
excel_df = pd.read_excel(base_excel)

# 更新数据
excel_df['角色'] = df['姓名']
excel_df['IP'] = df['作品']
excel_df['得票数'] = df['得票数']
excel_df['角色（英）'] = df_en['Name']

# 保存更新后的Excel文件
excel_df.to_excel(output_file, index=False)

print(f"数据已成功保存到: {output_file}") 