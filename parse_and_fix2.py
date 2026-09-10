import re

with open('src/components/NewHireView.tsx', 'r') as f:
    code = f.read()

# I will find the exact index of "Left Edge Tab for Insights"
idx = code.find("{/* Left Edge Tab for Insights */}")

# Before this index, there should be "})()}" followed by some divs.
idx_before = code.rfind("})()}", 0, idx)

if idx_before != -1:
    between = code[idx_before+5:idx]
    print(repr(between))
    
    # Let's replace the between text with just newlines
    new_code = code[:idx_before+5] + "\n            " + code[idx:]
    with open('src/components/NewHireView.tsx', 'w') as f:
        f.write(new_code)
    print("Fixed!")
