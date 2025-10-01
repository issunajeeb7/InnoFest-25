import os
from playwright.sync_api import sync_playwright
from supabase import create_client, Client

# --- Supabase Credentials ---
# Best Practice: Store these as environment variables, not in the code.
SUPABASE_URL = "https://ovauzeinzgrflskcitvc.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92YXV6ZWluemdyZmxza2NpdHZjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODYwNDg4MCwiZXhwIjoyMDc0MTgwODgwfQ.i5ONp-a2WSWG2yxe5CcUO6MQUnI_8OWRuiWiE6Bx_YA" # Use the service_role key for server-side operations

# --- Initialize Supabase Client ---
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def scrape_and_update():
    """Scrapes the first page of SIH website and upserts data to Supabase."""
    
    print("Starting scraper...")
    data_to_upsert = []
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("https://sih.gov.in/sih2025PS", timeout=60000)
        
        print("Page loaded. Scraping table...")
        # Scrape only the visible rows on the first page
        rows = page.locator("#dataTablePS > tbody > tr").all()
        
        for row in rows:
            cells = row.locator("> td").all()
            if len(cells) >= 6: # Ensure it's a valid data row
                ps_number = cells[4].text_content().strip()
                idea_count = cells[5].text_content().strip()
                
                if ps_number and idea_count:
                    data_to_upsert.append({
                        "ps_number": ps_number,
                        "idea_count": idea_count
                    })
        
        browser.close()

    if not data_to_upsert:
        print("No data scraped. Exiting.")
        return

    print(f"Scraped {len(data_to_upsert)} records. Upserting to Supabase...")

    # --- Use upsert to update the Supabase table ---
    try:
        # The 'ps_number' is the primary key, so upsert will use it
        # to match and update existing rows or insert new ones.
        response = supabase.table('sih_live_stats').upsert(data_to_upsert).execute()
        print("✅ Supabase upsert successful!")
    except Exception as e:
        print(f"❌ Error updating Supabase: {e}")

if __name__ == "__main__":
    scrape_and_update()