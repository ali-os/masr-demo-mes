import psycopg2
from pyxlsb import open_workbook
import uuid

DB_TARGET = "postgresql://postgres:admin@localhost:5432/masr_mes"

def ingest_excel(filepath):
    try:
        conn = psycopg2.connect(DB_TARGET)
        cur = conn.cursor()
        
        # Get or Create Line F1 and F2 IDs
        cur.execute("INSERT INTO \"Line\" (id, name) VALUES (%s, %s) ON CONFLICT DO NOTHING RETURNING id", (str(uuid.uuid4()), "Line F1"))
        cur.execute("SELECT id FROM \"Line\" WHERE name = 'Line F1'")
        line_f1_id = cur.fetchone()[0]

        with open_workbook(filepath) as wb:
            # 1. Products & MPS Targets
            if 'MPS Jan' in wb.sheets:
                print("Processing Products & Plan...")
                with wb.get_sheet('MPS Jan') as sheet:
                    for i, row in enumerate(sheet.rows()):
                        if i < 2: continue
                        cells = [c.v for c in row]
                        if len(cells) > 9 and isinstance(cells[1], (int, float)):
                            sku = str(int(cells[1]))
                            brand = str(cells[2])
                            fam = str(cells[3])
                            desc = str(cells[4])
                            pack_size = int(cells[5]) if cells[5] else 0
                            target = int(cells[8]) if cells[8] else 0
                            
                            # Insert Product
                            cur.execute("""
                                INSERT INTO "Product" (id, "skuCode", "nameEn", "nameAr", family, "packSize", uom)
                                VALUES (%s, %s, %s, %s, %s, %s, %s)
                                ON CONFLICT ("skuCode") DO UPDATE SET "nameEn" = EXCLUDED."nameEn"
                                RETURNING id
                            """, (str(uuid.uuid4()), sku, brand + " " + fam, desc, fam, pack_size, 'pcs'))
                            product_id = cur.fetchone()[0]

                            # Insert Plan
                            cur.execute("""
                                INSERT INTO "Plan" (id, "lineId", "targetQty", status)
                                VALUES (%s, %s, %s, %s)
                            """, (str(uuid.uuid4()), line_f1_id, target, 'RELEASED'))

            # 2. Production Facts
            if 'Production 1' in wb.sheets:
                print("Processing Production Facts...")
                # We need a dummy Machine for the facts
                cur.execute("INSERT INTO \"Machine\" (id, \"machineCode\", name, \"lineId\", \"stationRole\") VALUES (%s, %s, %s, %s, %s) ON CONFLICT DO NOTHING", 
                            (str(uuid.uuid4()), "MC-F1-GEN", "General Filler F1", line_f1_id, "FILLER"))
                cur.execute("SELECT id FROM \"Machine\" WHERE \"machineCode\" = 'MC-F1-GEN'")
                machine_id = cur.fetchone()[0]

                # We need a dummy WorkOrder for the facts
                cur.execute("SELECT id FROM \"Plan\" LIMIT 1")
                plan_id = cur.fetchone()[0]
                cur.execute("INSERT INTO \"WorkOrder\" (id, \"planId\", status) VALUES (%s, %s, %s) RETURNING id", (str(uuid.uuid4()), plan_id, 'COMPLETED'))
                wo_id = cur.fetchone()[0]

                with wb.get_sheet('Production 1') as sheet:
                    for i, row in enumerate(sheet.rows()):
                        if i < 15: continue
                        cells = [c.v for c in row]
                        if len(cells) > 10 and isinstance(cells[0], (int, float)):
                            total_prod = int(cells[7]) if cells[7] else 0
                            if total_prod > 0:
                                cur.execute("""
                                    INSERT INTO "ProductionFact" (id, "workOrderId", "machineId", count, "sourceTag")
                                    VALUES (%s, %s, %s, %s, %s)
                                """, (str(uuid.uuid4()), wo_id, machine_id, total_prod, 'IMPORTED'))

        conn.commit()
        conn.close()
        print("Success: Database fully synchronized with Professional Schema.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    ingest_excel(r"c:\Users\DELL\Documents\masr_demo1\Daily Prod Report Mar 2026.xlsb")
