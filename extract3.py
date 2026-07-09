import json
import re

transcript_path = r"C:\Users\yuvan\.gemini\antigravity-ide\brain\95820d47-1b39-4e5d-8eee-11c74937b3e3\.system_generated\logs\transcript_full.jsonl"
targets = ["Login.jsx", "MyChallans.jsx", "PoliceCommand.jsx"]

extracted_files = {}

with open(transcript_path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            entry = json.loads(line)
        except:
            continue
            
        content = entry.get("content", "")
        if not isinstance(content, str):
            continue
            
        # Check if this is a view_file response
        if "The following code has been modified to include a line number" in content:
            for target in targets:
                if target in content and target not in extracted_files:
                    lines = content.split('\n')
                    code_lines = []
                    is_code = False
                    for l in lines:
                        if "The following code has been modified" in l:
                            is_code = True
                            continue
                        if "The above content shows the entire, complete file" in l or "The above content does NOT show" in l:
                            is_code = False
                            break
                        if is_code:
                            m = re.match(r'^\d+:\s(.*)$', l)
                            if m:
                                code_lines.append(m.group(1))
                            else:
                                if l.strip() == "":
                                    code_lines.append("")
                                else:
                                    code_lines.append(l)
                    extracted_files[target] = '\n'.join(code_lines)

for k, v in extracted_files.items():
    with open(f"original_{k}", "w", encoding="utf-8") as out:
        out.write(v)
    print(f"Extracted {k}")

if not extracted_files:
    print("Could not find any files.")
