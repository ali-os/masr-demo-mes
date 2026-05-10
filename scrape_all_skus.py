from pyxlsb import open_workbook
import re

def scrape_all_skus(xlsb_path):
    all_skus = {}
    sku_pattern = re.compile(r'^\d{8}$') # 8-digit code

    try:
        with open_workbook(xlsb_path) as wb:
            for sheet_name in wb.sheets:
                with wb.get_sheet(sheet_name) as sheet:
                    print(f"Scraping sheet: {sheet_name}")
                    for row in sheet.rows():
                        cells = [c.v for c in row]
                        for i, cell in enumerate(cells):
                            if cell and isinstance(cell, (int, float, str)):
                                val = str(int(float(cell))) if isinstance(cell, (float, int)) else str(cell)
                                if sku_pattern.match(val):
                                    # Found a candidate SKU. Try to find a name nearby.
                                    name = "Unknown"
                                    # Usually name is in the next few columns
                                    for j in range(i+1, min(i+5, len(cells))):
                                        if cells[j] and isinstance(cells[j], str) and len(cells[j]) > 3:
                                            name = cells[j]
                                            break
                                    all_skus[val] = name

        print(f"Total Unique SKUs Found: {len(all_skus)}")
        with open('all_scraped_skus.txt', 'w', encoding='utf-8') as f:
            for sku, name in sorted(all_skus.items()):
                f.write(f"{sku} | {name}\n")
                
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    scrape_all_skus(r"c:\Users\DELL\Documents\masr_demo1\Daily Prod Report Mar 2026.xlsb")
