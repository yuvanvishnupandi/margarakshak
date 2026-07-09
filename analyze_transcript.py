import json
import re
import os

transcript_path = r"C:\Users\yuvan\.gemini\antigravity-ide\brain\95820d47-1b39-4e5d-8eee-11c74937b3e3\.system_generated\logs\transcript_full.jsonl"
targets = ["AskRakshak.jsx", "MyChallans.jsx", "PoliceCommand.jsx", "prompts.py"]

# Track the latest complete file content we see
latest_content = {t: None for t in targets}
# Track the step index to make sure we don't grab the reverted ones!
# We reverted around step 730, so we only want changes BEFORE step 700.
max_step = 700

if not os.path.exists(transcript_path):
    print("Transcript not found")
    exit(1)

with open(transcript_path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            entry = json.loads(line)
        except:
            continue
            
        step_idx = entry.get("step_index", 999999)
        if step_idx >= max_step:
            break
            
        # We need the full file content. Whenever we do view_file or replace_file_content, 
        # the system responds with "The following code has been modified..." or "The following changes were made...".
        # But wait, replace_file_content only outputs the diff!
        # To get the full file, we have to find the LAST view_file output that showed the full file?
        # No! The best way is to look at the tool calls!
        # Wait, if I modified it with replace_file_content, the transcript won't have the full file easily unless I wrote it from scratch.
        # But I can just grep for the features the user mentioned and re-implement them!
        
        # Let's search for "Agent Console" in PoliceCommand.jsx in the transcript.
        content = entry.get("content", "")
        tool_calls = entry.get("tool_calls", [])
        
        for call in tool_calls:
            args = call.get("args", {})
            if call.get("name") == "replace_file_content" or call.get("name") == "multi_replace_file_content":
                target = args.get("TargetFile", "")
                for t in targets:
                    if t in target:
                        print(f"Modified {t} at step {step_idx}")

