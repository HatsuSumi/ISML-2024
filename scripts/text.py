import random
import string

def generate_random_class_name(length=8):
    # 生成由小写字母和数字组成的随机字符串
    characters = string.ascii_lowercase + string.digits
    return ''.join(random.choice(characters) for _ in range(length))

def generate_multiple_class_names(count=10, length=8):
    # 生成多个随机类名
    return [generate_random_class_name(length) for _ in range(count)]

if __name__ == "__main__":
    # 生成10个长度为8的随机类名
    class_names = generate_multiple_class_names(count=10, length=8)
    for class_name in class_names:
        print(class_name)