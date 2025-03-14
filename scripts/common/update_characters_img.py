import pandas as pd
from pathlib import Path

def create_img_mapping():
    """从提名文件创建角色图片信息的字典"""
    img_map = {}
    try:
        # 从IP文件读取作品信息
        ip_df = pd.read_excel('data/IP.xlsx')
        # 创建角色到作品的映射
        series_map = {row['角色'].strip(): row['作品'].strip() 
                     for _, row in ip_df.iterrows() 
                     if pd.notna(row['角色']) and pd.notna(row['作品'])}
        
        # 从原始提名文件读取图片信息
        df = pd.read_excel('data/01-female-nomination.xlsx')
        
        # 遍历每一行
        for _, row in df.iterrows():
            name = str(row['角色']).strip()
            img = str(row['头像']).strip() if pd.notna(row['头像']) else ''
            if name and img:
                img_map[name] = {
                    '图片': img,
                    '作品': series_map.get(name, '')
                }
                print(f"添加角色图片: {name} -> {img}")
    except Exception as e:
        print(f"❌ 读取文件时出错: {str(e)}")
    return img_map

def update_characters_img(characters_file, img_map):
    """更新角色图片文件"""
    try:
        # 从IP文件读取作品信息
        ip_df = pd.read_excel('data/IP.xlsx')
        # 创建角色到作品的映射
        series_map = {row['角色'].strip(): row['作品'].strip() 
                     for _, row in ip_df.iterrows() 
                     if pd.notna(row['角色']) and pd.notna(row['作品'])}
        
        # 读取现有的Excel文件
        try:
            df = pd.read_excel(characters_file)
            # 如果没有"作品"列，添加一个空的
            if '作品' not in df.columns:
                df['作品'] = ''
        except FileNotFoundError:
            df = pd.DataFrame(columns=['角色', '图片', '作品'])
        
        # 更新现有数据
        updated_count = 0
        for index, row in df.iterrows():
            name = str(row['角色']).strip()
            # 如果角色在映射中且当前作品为空
            if pd.isna(row['作品']) or str(row['作品']).strip() == '':
                if name in series_map:
                    df.at[index, '作品'] = series_map[name]
                    print(f"更新作品: {name} -> {series_map[name]}")
                    updated_count += 1
        
        # 添加新角色
        new_characters = []
        for name, info in img_map.items():
            # 检查是否存在相同角色名和作品名的组合
            # 先处理空值和类型转换
            mask_name = df['角色'].fillna('').astype(str).str.strip() == name
            existing = df[mask_name].empty
            if existing:
                new_characters.append({
                    '角色': name,
                    '图片': info['图片'],
                    '作品': info['作品']
                })
                print(f"添加新角色: {name} -> 图片: {info['图片']}")
        
        if new_characters or updated_count > 0:
            # 添加新角色到DataFrame
            if new_characters:
                df_new = pd.DataFrame(new_characters)
                df = pd.concat([df, df_new], ignore_index=True)
            
            # 生成新的文件名
            source_path = Path(characters_file)
            output_file = source_path.parent / f"{source_path.stem}_updated{source_path.suffix}"
            
            # 保存更新后的文件
            df.to_excel(output_file, index=False)
            print(f"✅ 已添加 {len(new_characters)} 个新角色，更新 {updated_count} 个现有角色的作品信息，保存至: {output_file}")
        else:
            print("✨ 没有需要更新的信息")
        
    except Exception as e:
        print(f"❌ 更新文件时出错: {str(e)}")

def main():
    characters_file = 'data/ISML2024_characters_img.xlsx'
    
    # 从文本文件创建映射
    print("正在创建图片映射...")
    img_map = create_img_mapping()
    
    if not img_map:
        print("❌ 无法创建图片映射，程序终止")
        return
    
    # 更新角色文件
    print("正在更新角色文件...")
    update_characters_img(characters_file, img_map)

if __name__ == '__main__':
    main() 