import pandas as pd
import os

# 获取脚本所在目录的绝对路径
script_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.dirname(os.path.dirname(script_dir))

# 读取文件
base_file = os.path.join(root_dir, 'data', 'characters', 'base', 'characters-data.csv')
nova_file = os.path.join(root_dir, 'data', 'nomination', 'nova', 'winter', 'female', '03-nova-winter-female-nomination.xlsx')
output_file = os.path.join(root_dir, 'data', 'nomination', 'nova', 'winter', 'female', '03-nova-winter-female-nomination-with-avatar.xlsx')

# 读取文件
base_df = pd.read_csv(base_file)
nova_df = pd.read_excel(nova_file)

# 创建角色和作品的组合键
base_df['角色作品'] = base_df['角色'] + '@' + base_df['IP']
nova_df['角色作品'] = nova_df['角色'] + '@' + nova_df['IP']

# 创建映射字典
avatar_map = dict(zip(base_df['角色作品'], base_df['头像']))

# 更新头像
nova_df['头像'] = nova_df['角色作品'].map(avatar_map)

# 删除临时列
nova_df = nova_df.drop('角色作品', axis=1)

# 保存更新后的文件
nova_df.to_excel(output_file, index=False)

print(f"头像数据已保存到新文件：{output_file}") 