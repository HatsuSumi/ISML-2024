import pandas as pd
import mysql.connector
from mysql.connector import Error

def get_characters_from_db():
    """从MySQL数据库读取角色信息"""
    try:
        # 连接数据库
        connection = mysql.connector.connect(
            host='localhost',
            database='votes_data',
            user='root',
            password='123456'
        )
        
        if connection.is_connected():
            # 读取characters表
            query = """
                SELECT 
                    character_name as 角色,
                    ip as 作品,
                    cv as CV,
                    character_english_name as 角色（英）,
                    '' as 头像
                FROM characters
                WHERE character_name NOT LIKE '%+%'
            """
            db_df = pd.read_sql(query, connection)
            print(f"从数据库读取了 {len(db_df)} 条角色记录")
            return db_df
            
    except Error as e:
        print(f"❌ 连接数据库时出错: {e}")
        return pd.DataFrame()
        
    finally:
        if 'connection' in locals() and connection.is_connected():
            connection.close()

def merge_with_excel():
    """合并数据库和Excel的角色信息"""
    try:
        # 读取Excel文件
        excel_df = pd.read_excel('data/ISML2024_characters_merged.xlsx')
        
        # 读取数据库中的角色
        db_df = get_characters_from_db()
        
        if not db_df.empty:
            # 合并数据
            merged_df = pd.concat([excel_df, db_df], ignore_index=True)
            
            # 处理空值
            merged_df = merged_df.fillna('')
            
            # 处理所有字符串列的空格
            for column in merged_df.columns:
                if merged_df[column].dtype == 'object':
                    merged_df[column] = merged_df[column].astype(str).str.strip()
            
            # 去重，保留第一次出现的记录
            merged_df = merged_df.drop_duplicates(subset=['角色', '作品'], keep='first')
            
            # 按作品名和角色名排序
            merged_df = merged_df.sort_values(['作品', '角色'])
            
            # 保存为Excel文件
            output_file = 'data/ISML2024_characters_merged_with_db.xlsx'
            merged_df.to_excel(output_file, index=False)
            print(f"✅ 已合并数据并保存至: {output_file}")
            
            # 打印统计信息
            total = len(merged_df)
            new_characters = total - len(excel_df)
            print(f"\n统计信息:")
            print(f"原有角色数: {len(excel_df)}")
            print(f"新增角色数: {new_characters}")
            print(f"总角色数: {total}")
            
        else:
            print("❌ 未能从数据库读取角色信息")
            
    except Exception as e:
        print(f"❌ 合并文件时出错: {str(e)}")

def main():
    print("正在合并数据库角色信息...")
    merge_with_excel()

if __name__ == '__main__':
    main() 