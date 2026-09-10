import re

with open('src/components/LearnerJourneyRoadmap.tsx', 'r') as f:
    code = f.read()

# 1. Replace Volume2 with Phone in lucide-react imports
code = code.replace("Volume2,", "Phone,")

# 2. Replace the compact view speaker button
compact_speaker = """          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handlePlayAudio}
              className="p-1.5 rounded-full text-slate-400 hover:text-purple-600 transition-colors cursor-pointer"
              title="Listen aloud"
            >
              <Volume2 className={`w-4 h-4 ${playingAudio ? "animate-bounce text-purple-600" : ""}`} />
            </button>"""

compact_phone = """          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onNavigateToSection && onNavigateToSection("buddy")}
              className="p-1.5 rounded-full text-slate-400 hover:text-purple-600 transition-colors cursor-pointer"
              title="Call Buddy"
            >
              <Phone className="w-4 h-4" />
            </button>"""

code = code.replace(compact_speaker, compact_phone)

# 3. Replace the non-compact view speaker button
non_compact_speaker = """        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handlePlayAudio}
            className="p-2 rounded-full bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer"
            title="Listen aloud"
          >
            <Volume2 className={`w-4 h-4 ${playingAudio ? "animate-bounce" : ""}`} />
          </button>
        </div>"""

non_compact_phone = """        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onNavigateToSection && onNavigateToSection("buddy")}
            className="p-2 rounded-full bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer"
            title="Call Buddy"
          >
            <Phone className="w-4 h-4" />
          </button>
        </div>"""

code = code.replace(non_compact_speaker, non_compact_phone)

# 4. Replace gradient color
old_gradient = "className=\"bg-gradient-to-br from-cyan-500 to-blue-600 rounded-[26px] p-4 sm:p-5 border border-white/20 shadow-xl shadow-cyan-500/10 space-y-3.5 select-none\""
new_gradient = "className=\"bg-gradient-to-br from-[#00b4fc] to-[#0062ff] rounded-[26px] p-4 sm:p-5 border border-white/20 shadow-xl shadow-blue-500/10 space-y-3.5 select-none\""

code = code.replace(old_gradient, new_gradient)

with open('src/components/LearnerJourneyRoadmap.tsx', 'w') as f:
    f.write(code)

print("Patched LearnerJourneyRoadmap.tsx")
