import json
import requests
from typing import Dict, List, Tuple, Optional

def check_image_url(url: str) -> Tuple[str, bool, Optional[str]]:
    try:
        response = requests.get(url, timeout=10, allow_redirects=True)
        
        if response.status_code == 200:
            content_type = response.headers.get('content-type', '')
            if content_type.startswith('image/'):
                return url, True, None
            return url, False, f"Invalid content type: {content_type}"
        
        if response.history:
            final_url = response.url
            return url, False, f"Redirect failed: {final_url} ({response.status_code})"
            
        return url, False, f"Invalid status code: {response.status_code}"
        
    except requests.exceptions.Timeout:
        return url, False, "Request timed out"
    except requests.exceptions.RequestException as e:
        return url, False, str(e)

def process_character_images(data: Dict) -> List[Tuple[str, str, str]]:
    problems = []
    
    def check_character(char: Dict, location: str) -> None:
        if image_url := char.get('image'):
            url, valid, error = check_image_url(image_url)
            if not valid:
                problems.append((location, url, error))

    for group in ['stellar', 'nova']:
        if group == 'stellar':
            for gender in ['female', 'male']:
                for i, char in enumerate(data[group][gender]):
                    check_character(char, f"{group}.{gender}[{i}]")
        else:
            for season in ['winter', 'spring', 'summer', 'autumn']:
                for gender in ['female', 'male']:
                    for i, char in enumerate(data[group][season][gender]):
                        check_character(char, f"{group}.{season}.{gender}[{i}]")
    
    return problems

def main():
    with open('data/common/ISML2024_characters.json', 'r', encoding='utf-8') as f:
        data = json.load(f)

    problems = process_character_images(data)
    
    if problems:
        print("\n❌ Found problems with image URLs:")
        for location, url, error in problems:
            print(f"Location: {location}")
            print(f"URL: {url}")
            print(f"Error: {error}\n")
    else:
        print("\n✅ All image URLs are valid!")

if __name__ == '__main__':
    main() 