export default function Footer() {
  return (
    <footer className="border-t border-[#262626] mt-24">
      <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="font-black text-[#fafafa] text-sm tracking-tight">strk20</span>
          <span className="text-[#616161] text-sm">· Starknet Foundation</span>
        </div>
        <p className="text-[#616161] text-xs">
          Venice AI · CrewAI · FAISS · Starknet
        </p>
      </div>
    </footer>
  );
}
