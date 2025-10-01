import pandas as pd
from playwright.sync_api import sync_playwright, TimeoutError

def scrape_sih_problem_statements():
    """
    Scrapes all problem statements from the SIH 2025 website,
    handling pagination to collect data from every page.
    """
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        url = "https://sih.gov.in/sih2025PS"
        print(f"Navigating to {url}...")
        page.goto(url, timeout=60000)

        all_rows_data = []

        # --- 1. Scrape the table header ---
        print("Scraping table headers...")
        # UPDATED: Use the child combinator (>) to select only the direct children.
        # This prevents grabbing headers from tables inside the hidden modals.
        header_elements = page.locator("#dataTablePS > thead > tr > th").all()
        header = [h.text_content().strip() for h in header_elements]
        print(f"Headers found: {header}")

        # --- 2. Loop through all pages ---
        page_count = 1
        while True:
            print(f"\nScraping page {page_count}...")
            page.wait_for_selector("#dataTablePS > tbody > tr", timeout=15000)
            
            # UPDATED: Use the child combinator (>) to get only the main visible rows
            # and ignore the extra rows inside the hidden modal dialogs.
            rows = page.locator("#dataTablePS > tbody > tr").all()

            if not rows:
                print("No rows found on this page. Exiting loop.")
                break

            # --- 3. Extract data from each row on the page ---
            for row in rows:
                # UPDATED: Select only direct child 'td' elements of the row.
                cells = row.locator("> td").all()
                row_data = [cell.text_content().strip() for cell in cells]
                # We only add the row if it has the same number of columns as the header
                if len(row_data) == len(header):
                    all_rows_data.append(row_data)

            print(f"Found {len(rows)} rows on page {page_count}.")

            # --- 4. Handle pagination ---
            next_button = page.locator("#dataTablePS_next")
            
            if "disabled" in (next_button.get_attribute("class") or ""):
                print("\nLast page reached. Scraping complete.")
                break
            
            print("Clicking 'Next' button for the next page...")
            try:
                next_button.click(timeout=5000)
                page.wait_for_timeout(1000) 
                page_count += 1
            except TimeoutError:
                print("Could not click the 'Next' button. Assuming end of pages.")
                break

        # --- 5. Clean up and return data ---
        browser.close()

        if all_rows_data:
            df = pd.DataFrame(all_rows_data, columns=header)
            return df
        else:
            return pd.DataFrame()

# --- Main execution block ---
if __name__ == "__main__":
    problem_statements_df = scrape_sih_problem_statements()

    if not problem_statements_df.empty:
        print("\n--- Scraping Summary ---")
        print(f"Total problem statements scraped: {len(problem_statements_df)}")
        
        print("\n--- First 10 Scraped Problem Statements ---")
        print(problem_statements_df.head(10).to_string())
        
        print("\n--- Last 10 Scraped Problem Statements ---")
        print(problem_statements_df.tail(10).to_string())

        output_filename = "sih_problem_statements.csv"
        problem_statements_df.to_csv(output_filename, index=False)
        print(f"\n✅ Data successfully saved to {output_filename}")
    else:
        print("\nNo data was scraped from the website.")