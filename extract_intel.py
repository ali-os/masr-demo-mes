from pyxlsb import open_workbook
import json

def extract_product_intelligence(xlsb_path):
    product_map = {}

    try:
        with open_workbook(xlsb_path) as wb:
            # We look at W-1, W-2, W-3 for the most detailed line mapping
            for sheet_name in ['W-1', 'W-2', 'W-3']:
                if sheet_name in wb.sheets:
                    with wb.get_sheet(sheet_name) as sheet:
                        for i, row in enumerate(sheet.rows()):
                            if i < 4: continue # Skip headers
                            cells = [c.v for c in row]
                            if len(cells) > 8 and cells[0]: # SKU Code
                                sku = str(int(cells[0]))
                                line = str(cells[5]) if cells[5] else "Unknown"
                                target = float(cells[6]) if cells[6] else 0
                                bulk_kg = float(cells[7]) if cells[7] else 0
                                
                                # Calculate ratio (KG per Unit)
                                ratio = bulk_kg / target if target > 0 else 0
                                
                                if sku not in product_map:
                                    product_map[sku] = {
                                        "compatible_lines": set(),
                                        "bulk_ratio": 0
                                    }
                                product_map[sku]["compatible_lines"].add(line)
                                if ratio > 0:
                                    product_map[sku]["bulk_ratio"] = round(ratio, 4)

        # Convert sets to lists for JSON
        for sku in product_map:
            product_map[sku]["compatible_lines"] = list(product_map[sku]["compatible_lines"])

        with open('product_intelligence.json', 'w') as f:
            json.dump(product_map, f, indent=2)
            
        print(f"Success: Extracted intelligence for {len(product_map)} products.")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    extract_product_intelligence(r"c:\Users\DELL\Documents\masr_demo1\Daily Prod Report Mar 2026.xlsb")
