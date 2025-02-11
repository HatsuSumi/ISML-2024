import pandas as pd
import shutil
from datetime import datetime
from pathlib import Path

def create_backup(filename):
    """创建文件备份"""
    source = Path(filename)
    if not source.exists():
        return
    
    backup_dir = Path('data/backups')
    backup_dir.mkdir(exist_ok=True)
    
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_name = f"{source.stem}_{timestamp}{source.suffix}"
    backup_path = backup_dir / backup_name
    
    shutil.copy2(source, backup_path)
    print(f"✅ 已创建备份: {backup_path}")

def create_name_mapping():
    """从txt文件创建中英文名对照字典"""
    name_map = {}
    try:
        # 读取中文名列表
        with open('data/cn_names.txt', 'r', encoding='utf-8') as f:
            cn_names = [line.strip().split('\t')[1] for line in f if line.strip() and not line.startswith('排名')]
        
        # 读取英文名列表
        with open('data/en_names.txt', 'r', encoding='utf-8') as f:
            en_names = [line.strip().split('\t')[1] for line in f if line.strip() and not line.startswith('Rank')]
        
        # 创建映射
        for cn, en in zip(cn_names, en_names):
            if cn and en:  # 确保名字不为空
                name_map[cn.strip()] = en.strip()
                print(f"添加映射: {cn} -> {en}")
    except Exception as e:
        print(f"❌ 读取名字文件时出错: {str(e)}")
    return name_map

def update_nomination_file(nomination_file, name_map):
    """更新提名文件中的英文名"""
    try:
        # 读取Excel文件
        df = pd.read_excel(nomination_file)
        
        # 记录更新数量
        update_count = 0
        
        # 遍历每一行
        for index, row in df.iterrows():
            name = str(row['角色']).strip()
            current_en = row['角色（英）']
            
            # 如果当前英文名为空且能找到对应的英文名
            if (pd.isna(current_en) or str(current_en).strip() == '') and name in name_map:
                df.at[index, '角色（英）'] = name_map[name]
                update_count += 1
                print(f"更新: {name} -> {name_map[name]}")
        
        # 生成新的文件名
        source_path = Path(nomination_file)
        output_file = source_path.parent / f"{source_path.stem}_updated{source_path.suffix}"
        
        # 保存更新后的文件
        df.to_excel(output_file, index=False)
        print(f"✅ 已更新 {update_count} 个角色的英文名，保存至: {output_file}")
        
    except Exception as e:
        print(f"❌ 更新文件时出错: {str(e)}")

def main():
    nomination_file = 'data/01-female-nomination.xlsx'
    
    # 创建备份
    create_backup(nomination_file)
    
    # 从文本文件创建映射
    print("正在创建名字映射...")
    name_map = create_name_mapping()
    
    if not name_map:
        print("❌ 无法创建名字映射，程序终止")
        return
    
    # 更新提名文件
    print("正在更新提名文件...")
    update_nomination_file(nomination_file, name_map)

if __name__ == '__main__':
    main() 