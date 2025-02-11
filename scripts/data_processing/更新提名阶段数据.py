import json
import os
from typing import Dict, List, Any

# 获取脚本所在目录的绝对路径
script_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.dirname(os.path.dirname(script_dir))

class NominationStatsUpdater:
    def __init__(self):
        self.stats_data = self._load_json('data/statistics/nomination-stats.json')
        self.characters_data = self._load_json('data/characters/stats/ISML2024-characters.json')
        self.char_data = self._load_json('data/characters/base/characters-data.json')
        self.year_season_map = self._create_year_season_map()
        
    def _load_json(self, relative_path: str) -> Dict:
        """加载JSON文件"""
        file_path = os.path.join(root_dir, relative_path)
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
            
    def _create_year_season_map(self) -> Dict:
        """创建角色年份和季节的映射"""
        return {
            key: {
                'ip_year': char['ip_year'],
                'ip_season': char['ip_season']
            }
            for key, char in self.char_data.items()
        }
        
    def _load_votes_data(self, gender: str) -> Dict:
        """加载投票数据"""
        file_path = os.path.join(
            root_dir, 
            'data/nomination/nova/summer',
            gender,
            f'0{"7" if gender == "female" else "8"}-nova-summer-{gender}-nomination.json'
        )
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            return {f"{char['name']}_{char['ip']}": char['votes'] for char in data['data']}
            
    def _update_summer_stats(self, gender: str, votes_map: Dict) -> None:
        """更新夏季赛统计数据"""
        self.stats_data['nova']['summer'][gender] = []

        for char in self.characters_data['nova']['summer'][gender]:
            key = f"{char['name']}@{char['ip']}"
            try:
                year_season = self.year_season_map[key]
            except KeyError:
                print(f"\n找不到角色: {char['name']} ({char['ip']})")
                year_season = {'ip_year': '', 'ip_season': ''}
                
            self.stats_data['nova']['summer'][gender].append({
                'name': char['name'],
                'ip': char['ip'],
                'cv': char['cv'],
                'status': '晋级' if '已晋级' in char['status'] else '未晋级',
                'avatar': char['avatar'],
                'votes': votes_map.get(f"{char['name']}_{char['ip']}", '-'),
                'ip_year': year_season['ip_year'],
                'ip_season': year_season['ip_season']
            })
            
    def update(self) -> None:
        """更新所有统计数据"""
        # 初始化夏季赛数据结构
        self.stats_data['nova']['summer'] = {'female': [], 'male': []}
        
        # 更新女性组和男性组数据
        for gender in ['female', 'male']:
            votes_map = self._load_votes_data(gender)
            self._update_summer_stats(gender, votes_map)
        # 保存更新后的数据
        output_file = os.path.join(root_dir, 'data/statistics/nomination-stats-updated.json')
        with open(output_file, 'w', encoding='utf-8', newline='\n') as f:

            json.dump(self.stats_data, f, ensure_ascii=False, indent=4)
            
        print(f"提名统计数据已更新并保存到: {output_file}")

if __name__ == "__main__":
    updater = NominationStatsUpdater()
    updater.update()
