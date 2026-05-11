import Image from "next/image";
import Link from "next/link";

export default function Header() {
  return (
    <header className="border-b border-[#262626] bg-[#0d0d0d]/90 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <Image
            src="/starknet-logo.png"
            alt="Starknet"
            width={32}
            height={32}
            className="rounded-full"
          />
          <div className="flex items-center gap-2">
            <span className="font-black text-[#fafafa] tracking-tight text-lg leading-none">strk20</span>
            <span className="text-[#262626] font-light text-lg leading-none">/</span>
            <span className="text-[#888888] text-sm font-medium leading-none">analyze or submit your pitch</span>
          </div>
        </Link>
        <a
          href="https://strk20.starknet.io/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-[#616161] hover:text-[#fa4300] transition-colors"
        >
          strk20.starknet.io ↗
        </a>
      </div>
    </header>
  );
}
