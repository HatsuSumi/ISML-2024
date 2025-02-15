import pandas as pd
import os

# 获取脚本所在目录的绝对路径
script_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.dirname(os.path.dirname(script_dir))

# 输入和输出文件路径
input_file = os.path.join(root_dir, 'data', 'nomination', 'nova', 'autumn', 'male', 'male.txt') 
input_file_en = os.path.join(root_dir, 'data', 'nomination', 'nova', 'autumn', 'male', 'male_en.txt')
excel_file = os.path.join(root_dir, 'data', 'nomination', 'nova', 'autumn', 'male', '10-nova-autumn-male-nomination.xlsx')
output_file = os.path.join(root_dir, 'data', 'nomination', 'nova', 'autumn', 'male', '10-nova-autumn-male-nomination-updated.xlsx')

# 读取txt文件
df = pd.read_csv(input_file, sep='\t', encoding='utf-8')
df_en = pd.read_csv(input_file_en, sep='\t', encoding='utf-8')

# 读取现有的Excel文件
excel_df = pd.read_excel(excel_file)

# 更新需要的列
excel_df['排名'] = df['排名']
excel_df['角色'] = df['姓名']
excel_df['IP'] = df['作品']
excel_df['得票数'] = df['得票数']
excel_df['角色（英）'] = df_en['Name']

# 按排名排序
excel_df = excel_df.sort_values('排名', ascending=True)

# 保存为新的Excel文件
excel_df.to_excel(output_file, index=False)

print(f"数据已成功保存到: {output_file}") 