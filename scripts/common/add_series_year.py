import json
import os

def load_json(file_path):
    """加载JSON文件"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading {file_path}: {e}")
        return None

def save_json(data, file_path):
    """保存JSON文件"""
    try:
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=4)
        print(f"Successfully saved to {file_path}")
    except Exception as e:
        print(f"Error saving {file_path}: {e}")

# 作品年份和季度数据
SERIES_INFO = {
    "BanG Dream!": {"year": 2017, "season": 1}, 
    "小林家的龙女仆": {"year": 2017, "season": 1},
    "轻音少女": {"year": 2009, "season": 10},  
    "中二病也要谈恋爱！": {"year": 2012, "season": 10},  
    "孤独摇滚！": {"year": 2022, "season": 10},
    "刀剑神域": {"year": 2012, "season": 7},
    "青春猪头少年不会梦到兔女郎学姐": {"year": 2018, "season": 10},
    "NO GAME NO LIFE 游戏人生": {"year": 2014, "season": 4},
    "Charlotte": {"year": 2015, "season": 7},
    "玉子市场": {"year": 2013, "season": 1},
    "Re:从零开始的异世界生活": {"year": 2016, "season": 4},
    "樱花庄的宠物女孩": {"year": 2012, "season": 10},
    "86 -不存在的战区-": {"year": 2021, "season": 4},
    "五等分的新娘": {"year": 2019, "season": 1},
    "莉可丽丝": {"year": 2022, "season": 7},
    "更衣人偶坠入爱河": {"year": 2022, "season": 1},
    "葬送的芙莉莲": {"year": 2023, "season": 10},
    "关于我在无意间被隔壁的天使变成废柴这件事": {"year": 2023, "season": 1},
    "别当欧尼酱了！": {"year": 2023, "season": 1},
    "间谍过家家": {"year": 2022, "season": 4},
    "我的青春恋爱物语果然有问题。": {"year": 2013, "season": 4},
    "天使降临到我身边！": {"year": 2019, "season": 1},
    "【我推的孩子】": {"year": 2023, "season": 4},
    "看得见的女孩": {"year": 2021, "season": 10},
    "魔法禁书目录": {"year": 2008, "season": 10},
    "请问您今天要来点兔子吗？": {"year": 2014, "season": 4},
    "魔卡少女樱": {"year": 1998, "season": 4},
    "约会大作战": {"year": 2013, "season": 4},
    "Another": {"year": 2012, "season": 1},
    "白圣女与黑牧师": {"year": 2023, "season": 7},
    "名侦探柯南": {"year": 1996, "season": 1},
    "堀与宫村": {"year": 2021, "season": 1},
    "LoveLive!系列": {"year": 2013, "season": 1},
    "路人女主的养成方法": {"year": 2015, "season": 1},
    "AIR": {"year": 2005, "season": 1},
    "辉夜大小姐想让我告白～天才们的恋爱头脑战～": {"year": 2019, "season": 1},
    "VOCALOID": {"year": 2007, "season": 7},
    "罪恶王冠": {"year": 2011, "season": 10},
    "无职转生": {"year": 2021, "season": 1},
    "境界的彼方": {"year": 2013, "season": 10},
    "吹响！上低音号": {"year": 2015, "season": 4},
    "Fate系列": {"year": 2006, "season": 1},
    "伪恋": {"year": 2014, "season": 1},
    "新世纪福音战士": {"year": 1995, "season": 10},
    "药屋少女的呢喃": {"year": 2023, "season": 10},
    "月刊少女野崎君": {"year": 2014, "season": 7},
    "凉宫春日的忧郁": {"year": 2006, "season": 4},
    "声之形": {"year": 2016, "season": 7},
    "Darling in the FranXX": {"year": 2018, "season": 1},
    "末日时在做什么？有没有空？可以来拯救吗？": {"year": 2017, "season": 4},
    "赛马娘 Pretty Derby": {"year": 2018, "season": 4},
    "幸运☆星": {"year": 2007, "season": 4},
    "魔法少女小圆": {"year": 2011, "season": 1},
    "天气之子": {"year": 2019, "season": 7},
    "缘之空": {"year": 2010, "season": 10},
    "我心里危险的东西": {"year": 2023, "season": 4},
    "总之就是非常可爱": {"year": 2020, "season": 10},
    "空之境界": {"year": 2013, "season": 7},
    "我的妹妹哪有这么可爱！": {"year": 2010, "season": 10},
    "擅长捉弄的高木同学": {"year": 2018, "season": 1},
    "你的名字。": {"year": 2016, "season": 7},
    "埃罗芒阿老师": {"year": 2017, "season": 4},
    "冰菓": {"year": 2012, "season": 4},
    "龙与虎": {"year": 2008, "season": 10},
    "命运石之门": {"year": 2011, "season": 4},
    "CLANNAD": {"year": 2007, "season": 10},
    "四月是你的谎言": {"year": 2014, "season": 10},
    "为美好的世界献上祝福！": {"year": 2016, "season": 1},
    "Angel Beats!": {"year": 2010, "season": 4},
    "可塑性记忆": {"year": 2015, "season": 4},
    "进击的巨人": {"year": 2013, "season": 4},
    "夏目友人帐": {"year": 2008, "season": 7},
    "Code Geass": {"year": 2006, "season": 10},
    "火影忍者": {"year": 2002, "season": 10},
    "夏日重现": {"year": 2022, "season": 4},
    "死亡笔记": {"year": 2006, "season": 10},
    "蜡笔小新": {"year": 1992, "season": 4},
    "鬼灭之刃": {"year": 2019, "season": 4},
    "路人超能100": {"year": 2016, "season": 7},
    "剑风传奇": {"year": 1997, "season": 10},
    "BLEACH": {"year": 2004, "season": 10},
    "星际牛仔": {"year": 1998, "season": 4},
    "School Days": {"year": 2007, "season": 7},
    "排球少年！！": {"year": 2014, "season": 4},
    "Rewrite": {"year": 2016, "season": 7},
    "灼眼的夏娜": {"year": 2005, "season": 10},
    "黑之契约者": {"year": 2007, "season": 4},
    "工作细胞": {"year": 2018, "season": 7},
    "犬夜叉": {"year": 2000, "season": 10},
    "SSSS.DYNAZENON": {"year": 2021, "season": 4},
    "这个美术社大有问题！": {"year": 2016, "season": 7},
    "暗杀教室": {"year": 2015, "season": 1},
    "浪客剑心": {"year": 1996, "season": 1},
    "哆啦A梦": {"year": 1973, "season": 4},
    "终结的炽天使": {"year": 2015, "season": 4},
    "笨蛋、测验、召唤兽": {"year": 2010, "season": 1},
    "Dr.STONE 石纪元": {"year": 2019, "season": 7},
    "龙珠": {"year": 1986, "season": 1},
    "海贼王": {"year": 1999, "season": 10},
    "超超超超超喜欢你的100个女朋友": {"year": 2023, "season": 10},
    "碧蓝之海": {"year": 2018, "season": 7},
    "寄生兽": {"year": 2014, "season": 10},
    "Little Busters!": {"year": 2012, "season": 10},
    "齐木楠雄的灾难": {"year": 2016, "season": 7},
    "宝可梦": {"year": 1997, "season": 4},
    "月色真美": {"year": 2017, "season": 4},
    "甘城光辉游乐园": {"year": 2014, "season": 10},
    "野良神": {"year": 2014, "season": 1},
    "斩·赤红之瞳！": {"year": 2014, "season": 7},
    "银魂": {"year": 2006, "season": 4},
    "想要成为影之实力者！": {"year": 2022, "season": 10},
    "JoJo的奇妙冒险": {"year": 2012, "season": 10},
    "咒术回战": {"year": 2020, "season": 10},
    "文豪野犬": {"year": 2016, "season": 4},
    "东京食尸鬼": {"year": 2014, "season": 7},
    "物语系列": {"year": 2009, "season": 7},
    "魔术快斗": {"year": 2010, "season": 4},
    "欢迎来到实力至上主义的教室": {"year": 2017, "season": 7},
    "紫罗兰永恒花园": {"year": 2018, "season": 1},
}

def add_series_info(data):
    """添加作品年份和季度信息"""
    if isinstance(data, dict):
        if 'ip' in data and data['ip'] in SERIES_INFO:
            info = SERIES_INFO[data['ip']]
            data['series_year'] = info['year']
            data['series_season'] = info['season']
        for value in data.values():
            if isinstance(value, (dict, list)):
                add_series_info(value)
    elif isinstance(data, list):
        for item in data:
            add_series_info(item)

def process_file():
    base_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    stats_path = os.path.join(base_path, 'data', 'statistics', 'nomination-stats.json')
    update_path = os.path.join(base_path, 'data', 'statistics', 'nomination-stats_update.json')
    
    if os.path.exists(stats_path):
        data = load_json(stats_path)
        if data:
            add_series_info(data)
            save_json(data, update_path)
            print(f"已保存到 {update_path}")

if __name__ == "__main__":
    process_file()