import pandas as pd

def generate_rank(input_file, output_file):
    df = pd.read_excel(input_file)
    
    df_sorted = df.sort_values(by=['是否晋级', '得票数'], ascending=[False, False])
    
    def calculate_ranks(group_df, start_rank=1):
        ranks = []
        current_rank = start_rank
        previous_votes = None
        
        for votes in group_df['得票数']:
            if previous_votes is not None and votes != previous_votes:
                current_rank = start_rank + len(ranks) 
            
            ranks.append(current_rank)
            previous_votes = votes
        
        return ranks
    
    advanced = df_sorted[df_sorted['是否晋级'] == True]
    eliminated = df_sorted[df_sorted['是否晋级'] == False]
    
    advanced_ranks = calculate_ranks(advanced, 1) 
    eliminated_ranks = calculate_ranks(eliminated, len(advanced) + 1) 
    
    advanced['排名'] = advanced_ranks
    eliminated['排名'] = eliminated_ranks
    df_final = pd.concat([advanced, eliminated])

    df_final.to_excel(output_file, index=False)
    print(f"已生成排名并保存到: {output_file}")

def main():
    input_file = 'data/nomination/nova/summer/female/07-nova-summer-female-nomination.xlsx'
    output_file = 'data/nomination/nova/summer/female/07-nova-summer-female-nomination.xlsx-with-rank.xlsx'
    
    try:
        generate_rank(input_file, output_file)
    except Exception as e:
        print(f"发生错误: {e}")

if __name__ == '__main__':
    main() 