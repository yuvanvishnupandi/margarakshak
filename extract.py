import json
import os
import re

transcript_path = r"C:\Users\yuvan\.gemini\antigravity-ide\brain\95820d47-1b39-4e5d-8eee-11c74937b3e3\.system_generated\logs\transcript_full.jsonl"
targets = ["Login.jsx", "PoliceCommand.jsx", "CitizenDashboard.jsx", "MyChallans.jsx"]
extracted = {t: None for t in targets}

with open(transcript_path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            entry = json.loads(line)
        except:
            continue
            
        if entry.get("type") == "TOOL_RESPONSE" and "view_file" in entry.get("content", ""):
            content = entry["content"]
            for target in targets:
                if target in content and extracted[target] is None:
                    # Look for "Showing lines 1 to " and grab the content below
                    if "The following code has been modified to include a line number" in content:
                        # Extract original code by removing the line numbers
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
                                # Remove line number format "<number>: "
                                m = re.match(r'^\d+:\s(.*)$', l)
                                if m:
                                    code_lines.append(m.group(1))
                                else:
                                    code_lines.append(l) # fallback
                        extracted[target] = '\n'.join(code_lines)

# Write them to scratch dir to verify
os.makedirs("scratch", exist_ok=True)
for k, v in extracted.items():
    if v:
        with open(f"scratch/{k}.txt", "w", encoding='utf-8') as f:
            f.write(v)
        print(f"Extracted {k}: {len(v)} chars")
    else:
        print(f"Failed to find {k}")
