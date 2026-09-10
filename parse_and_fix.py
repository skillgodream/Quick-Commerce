import re

with open('src/components/NewHireView.tsx', 'r') as f:
    code = f.read()

# I will find the EXACT string that is wrong at line 756
bad_str1 = """              );
            })()}
              </div>
            </div>
            {/* Left Edge Tab for Insights */}"""

fix1 = """              );
            })()}
            {/* Left Edge Tab for Insights */}"""

code = code.replace(bad_str1, fix1)

# Now, at the end of the Yesterday -> Today section:
bad_str2 = """                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">{isHindi ? "आज" : "TODAY"}</span>
                    <p className="text-[13px] font-semibold text-white leading-snug">{status.action}</p>
                  </div>
                </div>
              );
            })()}
              </div>
            </div>
            {/* Next Best Action Section */}"""

fix2 = """                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">{isHindi ? "आज" : "TODAY"}</span>
                    <p className="text-[13px] font-semibold text-white leading-snug">{status.action}</p>
                  </div>
                </div>
              );
            })()}
              </div>
            </div>
            {/* Next Best Action Section */}"""

# Wait, if bad_str1 removes `</div> </div>`, it means the Insights Drawer wrapper opened TWO divs.
# `div.fixed` and `div.p-4`.
# So they NEED to be closed at the end of Yesterday -> Today!
# So `fix2` is actually correct as it is!
# Let's just apply fix1 and see what happens.

with open('src/components/NewHireView.tsx', 'w') as f:
    f.write(code)

