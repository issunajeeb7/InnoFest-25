import os
import time
from playwright.sync_api import sync_playwright, TimeoutError
from supabase import create_client, Client

# --- Supabase Credentials ---
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

# --- Initialize Supabase Client ---
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def scrape_and_update_all_pages():
    """Scrapes ALL pages of the SIH website and upserts the data to Supabase."""
    
    print("Starting full scraper for all pages...")
    all_data_to_upsert = []
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        try:
            print("Navigating to the SIH page...")
            page.goto("https://sih.gov.in/sih2025PS", timeout=60000)

            # --- Main pagination loop ---
            page_count = 1
            while True:
                print(f"\n--- Scraping Page {page_count} ---")
                
                # Wait for the table on the current page to be ready
                print("Waiting for table content to appear...")
                page.wait_for_selector("#dataTablePS > tbody > tr", timeout=45000)
                time.sleep(3) # Extra delay for rendering
                
                rows = page.locator("#dataTablePS > tbody > tr").all()
                print(f"Found {len(rows)} rows on this page.")
                
                # Scrape data from each row on the current page
                for row in rows:
                    cells = row.locator("> td").all()
                    if len(cells) >= 6:
                        ps_number = cells[4].text_content().strip()
                        idea_count = cells[5].text_content().strip()
                        
                        if ps_number and idea_count:
                            all_data_to_upsert.append({
                                "ps_number": ps_number,
                                "idea_count": idea_count
                            })
                
                # --- Handle moving to the next page ---
                next_button = page.locator("#dataTablePS_next")
                
                # Check if the 'Next' button is disabled (i.e., we are on the last page)
                if "disabled" in (next_button.get_attribute("class") or ""):
                    print("\nLast page reached. Finished scraping all pages.")
                    break
                
                # Click the 'Next' button
                print("Clicking 'Next' button...")
                next_button.click()
                page_count += 1

        except Exception as e:
            print(f"❌ An error occurred during scraping: {e}")
        finally:
            browser.close()

    if not all_data_to_upsert:
        print("Scraping finished, but no data was extracted. Exiting.")
        return

    print(f"\nTotal records scraped from all pages: {len(all_data_to_upsert)}. Upserting to Supabase...")

    try:
        # Perform one large upsert operation with all the collected data
        response = supabase.table('sih_live_stats').upsert(all_data_to_upsert).execute()
        print("✅ Supabase upsert successful!")
    except Exception as e:
        print(f"❌ Error updating Supabase: {e}")

if __name__ == "__main__":
    scrape_and_update_all_pages()