import json
from typing import Dict

class CharacterDataValidator:
    REQUIRED_FIELDS = ['name', 'series']
    OPTIONAL_FIELDS = ['image', 'cv']
    
    def __init__(self, data_file: str):
        self.data_file = data_file
        self.errors = []
        self.warnings = []
    
    def validate_character(self, character: Dict, location: str) -> None:
        # 检查必填字段
        for field in self.REQUIRED_FIELDS:
            if not character.get(field):
                self.errors.append(f"Missing {field} in {location}")
        
        # 检查图片URL格式
        if image_url := character.get('image'):
            if not image_url.startswith(('http://', 'https://')):
                self.errors.append(f"Invalid image URL in {location}")
        
        # 检查数据类型
        if not isinstance(character.get('name', ''), str):
            self.errors.append(f"Invalid name type in {location}")
        if not isinstance(character.get('series', ''), str):
            self.errors.append(f"Invalid series type in {location}")
    
    def validate_group(self, data: Dict, group: str) -> None:
        if group == 'stellar':
            for gender in ['female', 'male']:
                if not isinstance(data.get(gender, []), list):
                    self.errors.append(f"Invalid {group}.{gender} format")
                else:
                    for i, char in enumerate(data[gender]):
                        self.validate_character(char, f"{group}.{gender}[{i}]")
        else:  # nova
            for season in ['winter', 'spring', 'summer', 'autumn']:
                if season not in data:
                    self.errors.append(f"Missing season {season} in {group}")
                else:
                    for gender in ['female', 'male']:
                        if not isinstance(data[season].get(gender, []), list):
                            self.errors.append(f"Invalid {group}.{season}.{gender} format")
                        else:
                            for i, char in enumerate(data[season][gender]):
                                self.validate_character(char, f"{group}.{season}.{gender}[{i}]")
    
    def validate(self) -> bool:
        try:
            with open(self.data_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # 验证基本结构
            if not isinstance(data, dict):
                self.errors.append("Root must be an object")
                return False
            
            # 验证分组
            for group in ['stellar', 'nova']:
                if group not in data:
                    self.errors.append(f"Missing group {group}")
                else:
                    self.validate_group(data[group], group)
            
            # 输出验证结果
            if self.errors:
                print("Validation errors:")
                for error in self.errors:
                    print(f"❌ {error}")
            else:
                print("✅ Data validation passed!")
            
            if self.warnings:
                print("\nWarnings:")
                for warning in self.warnings:
                    print(f"⚠️ {warning}")
            
            return len(self.errors) == 0
            
        except Exception as e:
            self.errors.append(f"Failed to read data file: {str(e)}")
            return False

if __name__ == '__main__':
    validator = CharacterDataValidator('data/common/ISML2024_characters.json')
    validator.validate() 