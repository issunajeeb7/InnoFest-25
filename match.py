import pandas as pd

def merge_data(problems_file, teams_file, output_file):
    """
    Merges problem statement deadlines and idea counts into the teams file.

    Args:
        problems_file (str): Path to the CSV file with problem statements.
        teams_file (str): Path to the CSV file with team details.
        output_file (str): Path to save the merged CSV file.
    """
    try:
        # --- 1. Load the CSV files into pandas DataFrames ---
        df_problems = pd.read_csv(problems_file)
        df_teams = pd.read_csv(teams_file)
        
        print("Successfully loaded both CSV files.")
        
        # --- 2. Prepare the DataFrames for merging ---
        
        # Select only the necessary columns from the problems DataFrame for efficiency
        df_problems_subset = df_problems[['PS Number', 'Deadline for Idea Submission', 'Submitted Idea(s) Count']].copy()

        # Create a standardized 'merge_key' in both DataFrames
        # This key will contain only the numeric part of the problem number
        
        # For the problems DataFrame: remove 'SIH' prefix
        df_problems_subset['merge_key'] = df_problems_subset['PS Number'].astype(str).str.replace('SIH', '').str.strip()

        # For the teams DataFrame: ensure it's a string, then remove potential 'SIH' prefix
        df_teams['merge_key'] = df_teams['problem_statement_number'].astype(str).str.replace('SIH', '').str.strip()
        
        print("Standardized problem statement numbers for matching.")

        # --- 3. Perform the merge ---
        # A 'left' merge keeps all rows from the teams DataFrame (df_teams)
        # and adds matching data from the problems DataFrame.
        merged_df = pd.merge(df_teams, df_problems_subset, on='merge_key', how='left')
        
        print("Merge complete.")

        # --- 4. Clean up the final DataFrame ---
        
        # Rename the newly added columns as requested
        merged_df.rename(columns={
            'Deadline for Idea Submission': 'Deadline',
            'Submitted Idea(s) Count': 'Idea Count'
        }, inplace=True)
        
        # Drop the intermediate columns used for merging
        merged_df.drop(columns=['merge_key', 'PS Number'], inplace=True, errors='ignore')
        
        print("Renamed and cleaned up columns.")
        
        # --- 5. Save the result to a new CSV file ---
        merged_df.to_csv(output_file, index=False)
        
        print(f"\n✅ Success! The merged data has been saved to '{output_file}'")
        
        # Display the first few rows of the final result
        print("\n--- Preview of the final merged data ---")
        print(merged_df.head().to_string())

    except FileNotFoundError as e:
        print(f"Error: {e}. Please make sure both CSV files are in the same directory as the script.")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")

# --- Main execution block ---
if __name__ == "__main__":
    # Define the filenames
    problems_csv = 'sih_problem_statements.csv'
    teams_csv = 'Supabase Snippet Team Leaders Directory.csv'
    output_csv = 'teams_with_deadlines.csv'
    
    # Run the function
    merge_data(problems_csv, teams_csv, output_csv)