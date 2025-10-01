import os
import time
from playwright.sync_api import sync_playwright
from supabase import create_client, Client

# --- Supabase Credentials ---
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

# --- Initialize Supabase Client ---
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def scrape_and_update():
    """Scrapes SIH website with anti-bot detection measures and better debugging."""
    
    print("Starting scraper with enhanced debugging...")
    data_to_upsert = []
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # --- FIX 1: Set a common user agent to appear more like a real browser ---
        context = browser.new_context(
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36'
        )
        page = context.new_page()
        
        try:
            print("Navigating to the SIH page...")
            page.goto("https://sih.gov.in/sih2025PS", timeout=90000)

            print("Page loaded. Waiting for the table content to appear...")
            # A single, long wait for the critical element.
            page.wait_for_selector("#dataTablePS > tbody > tr", timeout=60000)
            
            # A final brief pause for rendering.
            time.sleep(5)
            
            print("Table content is visible. Scraping rows...")
            rows = page.locator("#dataTablePS > tbody > tr").all()
            print(f"Found {len(rows)} rows.")
            
            for row in rows:
                cells = row.locator("> td").all()
                if len(cells) >= 6:
                    ps_number = cells[4].text_content().strip()
                    idea_count = cells[5].text_content().strip()
                    if ps_number and idea_count:
                        data_to_upsert.append({"ps_number": ps_number, "idea_count": idea_count})

        except Exception as e:
            # --- FIX 2: Take a screenshot for debugging when an error occurs ---
            print(f"❌ An error occurred during scraping: {e}")
            print("Saving a screenshot to debug_screenshot.png to see what went wrong.")
            page.screenshot(path='debug_screenshot.png', full_page=True)
        finally:
            browser.close()

    if not data_to_upsert:
        print("Scraping finished, but no data was extracted. Check the logs and screenshot.")
        return

    print(f"Scraped {len(data_to_upsert)} records. Upserting to Supabase...")
    try:
        supabase.table('sih_live_stats').upsert(data_to_upsert).execute()
        print("✅ Supabase upsert successful!")
    except Exception as e:
        print(f"❌ Error updating Supabase: {e}")

if __name__ == "__main__":
    scrape_and_update()