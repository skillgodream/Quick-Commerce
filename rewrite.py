import re
import sys

with open('src/components/NewHireView.tsx', 'r') as f:
    code = f.read()

# 1. Add state hooks
hook_addition = """
  // Drawer states
  const [isInsightsDrawerOpen, setIsInsightsDrawerOpen] = useState<boolean>(false);
  const [isBuddyDrawerOpen, setIsBuddyDrawerOpen] = useState<boolean>(false);
"""
code = code.replace("const [isInsightsExpanded, setIsInsightsExpanded] = useState<boolean>(false);", hook_addition)

# 2. Extract Insights block and remove from hero banner
insights_start = "{/* Insights Drawer Toggle */}"
insights_end = "{/* Next Best Action Section */}"
idx_start = code.find(insights_start)
idx_end = code.find(insights_end)
if idx_start == -1 or idx_end == -1:
    print("Could not find Insights block")
    sys.exit(1)

insights_block = code[idx_start:idx_end]
# We need to grab the content INSIDE the expanded area
# Wait, I will just do a simpler regex or manual extraction
