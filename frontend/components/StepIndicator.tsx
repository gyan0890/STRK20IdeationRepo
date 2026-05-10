"use client";

const STEPS = ["Input", "Analysis", "Results", "Submit"];

export default function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-2 justify-center mb-10">
      {STEPS.map((label, i) => {
        const done    = i < current;
        const active  = i === current;
        return (
          <div key={label} className="flex items-center gap-2">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  done   ? "bg-[#fa4300] text-[#0d0d0d]" :
                  active ? "bg-[rgba(200,255,0,0.12)] border border-[#fa4300] text-[#fa4300]" :
                           "bg-[#141414] border border-[#262626] text-[#616161]"
                }`}
              >
                {done ? "✓" : i + 1}
              </div>
              <span className={`text-xs hidden sm:block ${active ? "text-[#fa4300]" : done ? "text-[#888888]" : "text-[#616161]"}`}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-10 h-px mb-5 ${i < current ? "bg-[#fa4300]" : "bg-[#262626]"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
