from pyxlsb import open_workbook

def extract_taxonomy(xlsb_path):
    brands = set()
    families = set()
    machines = set()

    try:
        with open_workbook(xlsb_path) as wb:
            if 'MPS Jan' in wb.sheets:
                with wb.get_sheet('MPS Jan') as sheet:
                    for i, row in enumerate(sheet.rows()):
                        if i < 2: continue
                        cells = [c.v for c in row]
                        if len(cells) > 8:
                            if cells[2]: brands.add(str(cells[2]))
                            if cells[3]: families.add(str(cells[3]))
                            if cells[7]: machines.add(str(cells[7]))
            
            # Extract from Production sheets for machine names
            if 'Production 1' in wb.sheets:
                with wb.get_sheet('Production 1') as sheet:
                    # Look for machine header row (usually row 12 or 14)
                    for i, row in enumerate(sheet.rows()):
                        if i == 14: # Potential machine row
                            cells = [c.v for c in row]
                            # Look for names like 'sh 1', 'sh 2' and their parents
    except Exception as e:
        print(f"Error: {e}")

    print("=== FINAL TAXONOMY TEMPLATE ===")
    print(f"BRANDS: {sorted(list(brands))}")
    print(f"FAMILIES: {sorted(list(families))}")
    print(f"MACHINES: {sorted(list(machines))}")

if __name__ == "__main__":
    extract_taxonomy(r"c:\Users\DELL\Documents\masr_demo1\Daily Prod Report Mar 2026.xlsb")
