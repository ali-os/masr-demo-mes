import zipfile
import xml.etree.ElementTree as ET
import sys

def extract_text(docx_file):
    try:
        with zipfile.ZipFile(docx_file, 'r') as docx:
            xml_content = docx.read('word/document.xml')
            tree = ET.fromstring(xml_content)
            
            namespaces = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
            text_run_blocks = []
            
            for p in tree.findall('.//w:p', namespaces):
                texts = [node.text for node in p.findall('.//w:t', namespaces) if node.text]
                if texts:
                    text_run_blocks.append(''.join(texts))
            
            return '\n'.join(text_run_blocks)
    except Exception as e:
        return str(e)

if __name__ == '__main__':
    text = extract_text(sys.argv[1])
    with open('output.txt', 'w', encoding='utf-8') as f:
        f.write(text)
