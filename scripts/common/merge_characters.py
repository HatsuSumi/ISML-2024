import pandas as pd

def merge_characters():
    """合并角色信息"""
    try:
        # 读取三个CSV文件
        cv_df = pd.read_csv('data/ISML2024_characters_cv.csv')
        img_df = pd.read_csv('data/ISML2024_characters_img.csv')
        en_df = pd.read_csv('data/ISML2024_characters_en.csv')
        
        # 以角色列为基准合并数据
        # 先合并CV和作品信息
        merged_df = pd.merge(cv_df[['角色', 'CV', '作品']], 
                           img_df[['角色', '头像', '作品']], 
                           on='角色', 
                           how='outer',
                           suffixes=('', '_img'))
        
        # 再合并英文名信息
        merged_df = pd.merge(merged_df, 
                           en_df[['角色', '角色（英）', '作品']], 
                           on='角色', 
                           how='outer',
                           suffixes=('', '_en'))
        
        # 合并作品信息
        # 优先使用cv.csv的作品，然后是img.csv，最后是en.csv
        merged_df['作品'] = merged_df['作品'].fillna(merged_df['作品_img'])
        merged_df['作品'] = merged_df['作品'].fillna(merged_df['作品_en'])
        
        # 删除多余的作品列
        merged_df = merged_df.drop(['作品_img', '作品_en'], axis=1, errors='ignore')
        
        # 整理列的顺序
        final_df = merged_df[['角色', '作品', 'CV', '角色（英）', '头像']]
        
        # 处理空值
        final_df = final_df.fillna('')
        
        # 处理所有字符串列的空格
        for column in final_df.columns:
            if final_df[column].dtype == 'object':  # 只处理字符串类型的列
                final_df[column] = final_df[column].astype(str).str.strip()
        
        # 去重，保留第一次出现的记录
        final_df = final_df.drop_duplicates(subset=['角色', '作品'], keep='first')
        
        # 按作品名和角色名排序
        final_df = final_df.sort_values(['作品', '角色'])
        
        # 保存为Excel文件
        output_file = 'data/ISML2024_characters_merged.xlsx'
        final_df.to_excel(output_file, index=False)
        print(f"✅ 已合并数据并保存至: {output_file}")
        
        # 打印统计信息
        total = len(final_df)
        complete = len(final_df.dropna())
        duplicates = len(merged_df) - len(final_df)
        print(f"\n统计信息:")
        print(f"总角色数: {total}")
        print(f"完整信息角色数: {complete}")
        print(f"缺失信息角色数: {total - complete}")
        print(f"去除重复数: {duplicates}")
        
    except Exception as e:
        print(f"❌ 合并文件时出错: {str(e)}")

def main():
    print("正在合并角色信息...")
    merge_characters()

if __name__ == '__main__':
    main() 