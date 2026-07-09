import json
import re

transcript_path = r"C:\Users\yuvan\.gemini\antigravity-ide\brain\95820d47-1b39-4e5d-8eee-11c74937b3e3\.system_generated\logs\transcript_full.jsonl"
target = "Login.jsx"

content_found = None

with open(transcript_path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            entry = json.loads(line)
        except:
            continue
            
        if entry.get("type") == "CODE_ACTION" and "view_file" in entry.get("content", ""):
            pass # this is the tool execution
            
        # We can look for the actual content string inside tool responses
        if entry.get("type") == "PLANNER_RESPONSE" or entry.get("type") == "MODEL" or entry.get("type") == "TOOL_RESPONSE" or entry.get("type") == "SYSTEM":
            content_str = entry.get("content", "")
            if isinstance(content_str, str) and target in content_str and "The following code has been modified" in content_str:
                content_found = content_str
                break
                
        # Also check tool calls
        tool_calls = entry.get("tool_calls", [])
        if tool_calls:
            for tc in tool_calls:
                if tc.get("name") == "view_file":
                    pass

if content_found:
    lines = content_found.split('\n')
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
                    code_lines.append(l) # fallback
                    
    with open("original_Login.jsx", "w", encoding="utf-8") as out:
        out.write('\n'.join(code_lines))
    print("Found and wrote original_Login.jsx")
else:
    print("Could not find original Login.jsx in transcript.")
