from pyxlsb import open_workbook
import sys

filepath = r"c:\Users\DELL\Documents\masr_demo1\Daily Prod Report Mar 2026.xlsb"

try:
    with open_workbook(filepath) as wb:
        lines = []
        lines.append("=== SHEET NAMES ===")
        for s in wb.sheets:
            lines.append(f"  - {s}")
        
        for sheet_name in wb.sheets[:10]:
            lines.append(f"\n=== SHEET: {sheet_name} ===")
            with wb.get_sheet(sheet_name) as sheet:
                row_count = 0
                for row in sheet.rows():
                    if row_count >= 25:
                        break
                    cells = []
                    for c in row:
                        if c.v is not None:
                            cells.append(str(c.v))
                        else:
                            cells.append('')
                    if any(cells):
                        lines.append(f"Row {row_count}: {' | '.join(cells)}")
                    row_count += 1
        
        with open('excel_structure.txt', 'w', encoding='utf-8') as f:
            f.write('\n'.join(lines))
        print("Done")
except Exception as e:
    print(f"Error: {e}", file=sys.stderr)
    import traceback
    traceback.print_exc()
