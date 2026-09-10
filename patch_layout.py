import re

with open('src/components/NewHireView.tsx', 'r') as f:
    code = f.read()

# 1. Replace Insights Toggle Tab
old_insights_toggle = """            {/* Insights Drawer Toggle */}
            <div className="flex justify-start mt-2 pb-2 relative z-10 pl-4">
              <button 
                type="button"
                onClick={() => setIsInsightsExpanded(!isInsightsExpanded)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-all cursor-pointer text-[10px] font-bold uppercase tracking-widest shadow-sm backdrop-blur-md"
              >
                {isInsightsExpanded ? <ChevronUp className="w-3.5 h-3.5 text-cyan-400" /> : <ChevronDown className="w-3.5 h-3.5 text-cyan-400" />}
                {isHindi ? "इंसाइड्स देखें" : "Insights"}
              </button>
            </div>"""

new_insights_toggle = """            {/* Left Edge Tab for Insights */}
            <div className="fixed left-0 top-[40%] -translate-y-1/2 z-50">
              <button 
                type="button"
                onClick={() => setIsInsightsExpanded(!isInsightsExpanded)}
                className="flex flex-col items-center gap-1.5 p-1.5 py-4 rounded-r-xl bg-cyan-600/90 border border-l-0 border-white/20 text-white shadow-lg backdrop-blur-md cursor-pointer hover:bg-cyan-500 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5 text-white" />
                <span className="[writing-mode:vertical-lr] rotate-180 text-[10px] font-black uppercase tracking-widest">
                  {isHindi ? "इंसाइड्स" : "Insights"}
                </span>
              </button>
            </div>"""
code = code.replace(old_insights_toggle, new_insights_toggle)

# 2. Wrap insights content in a fixed left drawer
old_insights_wrapper_start = """            {isInsightsExpanded && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-200">"""

new_insights_wrapper_start = """            {/* Left Edge Drawer for Insights */}
            <div className={`fixed inset-y-0 left-0 w-72 bg-[#1b1e26]/95 backdrop-blur-xl border-r border-white/10 shadow-2xl z-[60] transform transition-transform duration-300 ${isInsightsExpanded ? "translate-x-0" : "-translate-x-full"} flex flex-col`}>
              <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/20">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  {isHindi ? "इंसाइड्स" : "Insights"}
                </h3>
                <button onClick={() => setIsInsightsExpanded(false)} className="p-1.5 rounded-full text-slate-400 hover:text-white bg-white/5 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4 overflow-y-auto space-y-6 flex-1 pt-6">"""
code = code.replace(old_insights_wrapper_start, new_insights_wrapper_start)

# 3. Replace Buddy Card with Right Edge Tab
buddy_start = "            {/* 3. BUDDY VIKRAM CARD (GLASSMORPHIC STYLING) */}"
buddy_end = "            {/* 4. JOB READY & ROADMAP CARD */}"
idx_start = code.find(buddy_start)
idx_end = code.find(buddy_end)

if idx_start != -1 and idx_end != -1:
    new_buddy_tab = """            {/* Right Edge Tab for Buddy Chat */}
            <div className="fixed right-0 top-[40%] -translate-y-1/2 z-50">
              <button 
                type="button"
                onClick={() => setActiveSection("buddy")}
                className="flex flex-col items-center gap-1.5 p-1.5 py-4 rounded-l-xl bg-emerald-600/90 border border-r-0 border-white/20 text-white shadow-lg backdrop-blur-md cursor-pointer hover:bg-emerald-500 transition-all"
              >
                <Phone className="w-3.5 h-3.5 text-white" />
                <span className="[writing-mode:vertical-lr] text-[10px] font-black uppercase tracking-widest">
                  {isHindi ? "बुडी चैट" : "Buddy"}
                </span>
              </button>
            </div>

"""
    code = code[:idx_start] + new_buddy_tab + code[idx_end:]
else:
    print("Could not find buddy card bounds")

with open('src/components/NewHireView.tsx', 'w') as f:
    f.write(code)

print("Patched successfully")
