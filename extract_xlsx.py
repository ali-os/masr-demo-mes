import zipfile
import xml.etree.ElementTree as ET

def extract_xlsx_strings(xlsx_path):
    strings = set()
    try:
        with zipfile.ZipFile(xlsx_path, 'r') as z:
            if 'xl/sharedStrings.xml' in z.namelist():
                content = z.read('xl/sharedStrings.xml')
                root = ET.fromstring(content)
                namespace = {'ns': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
                for t in root.findall('.//ns:t', namespace):
                    if t.text:
                        strings.add(t.text.strip())
    except Exception as e:
        print(f"Error: {e}")
    return strings

def main():
    xlsx_path = r"c:\Users\DELL\Documents\masr_demo1\OEE F1 march-2026(AutoRecovered).xlsx"
    all_strings = extract_xlsx_strings(xlsx_path)
    
    with open('oee_labels.txt', 'w', encoding='utf-8') as f:
        for c in sorted(list(all_strings)):
            f.write(f"{c}\n")
    print("Done: Labels written to oee_labels.txt")

if __name__ == "__main__":
    main()
