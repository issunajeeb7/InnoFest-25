import os
import time
from playwright.sync_api import sync_playwright
from supabase import create_client, Client

# --- Supabase Credentials ---
# These will be loaded from GitHub Secrets
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

# --- Initialize Supabase Client ---
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def scrape_and_update():
    """Scrapes the SIH website and upserts data to Supabase."""
    
    print("Starting scraper...")
    data_to_upsert = []
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        try:
            print("Navigating to the SIH page...")
            page.goto("https://sih.gov.in/sih2025PS", timeout=60000)

            # --- UPDATED WAITING STRATEGY ---
            # 1. Wait for the page to finish all network activity
            print("Page loaded. Waiting for network to be idle...")
            page.wait_for_load_state('networkidle', timeout=30000)

            # 2. Explicitly wait for the first table row to be visible
            print("Waiting for table content to be visible...")
            page.wait_for_selector("#dataTablePS > tbody > tr", timeout=20000)
            
            # 3. A small extra delay just in case of slow rendering
            time.sleep(3) 

            print("Table content is visible. Starting scrape...")
            rows = page.locator("#dataTablePS > tbody > tr").all()
            print(f"Found {len(rows)} rows in the table.")
            
            for row in rows:
                cells = row.locator("> td").all()
                if len(cells) >= 6:
                    ps_number = cells[4].text_content().strip()
                    idea_count = cells[5].text_content().strip()
                    
                    if ps_number and idea_count:
                        data_to_upsert.append({
                            "ps_number": ps_number,
                            "idea_count": idea_count
                        })
            
        except Exception as e:
            print(f"❌ An error occurred during scraping: {e}")
            # Take a screenshot for debugging if something goes wrong
            page.screenshot(path='debug_screenshot.png')
            # You can view this screenshot in the artifacts of the GitHub Actions run
        finally:
            browser.close()

    if not data_to_upsert:
        print("Scraping finished, but no data was extracted. Exiting.")
        return

    print(f"Scraped {len(data_to_upsert)} records. Upserting to Supabase...")

    try:
        response = supabase.table('sih_live_stats').upsert(data_to_upsert).execute()
        print("✅ Supabase upsert successful!")
    except Exception as e:
        print(f"❌ Error updating Supabase: {e}")

if __name__ == "__main__":
    scrape_and_update()