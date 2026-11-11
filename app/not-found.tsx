import Link from "next/link";
import { ArrowLeft, Compass, Search } from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f8fafc] px-5 py-10">
      <div className="w-full max-w-[430px] rounded-[24px] border border-[#e2e8f0] bg-white p-8 text-center shadow-[0_20px_70px_rgba(47,48,100,0.06)]">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#d1fae5] text-[#059669]"><Search size={20} /></span>
        <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.15em] text-[#059669]">404 · Page not found</p>
        <h1 className="mt-2 text-[22px] font-extrabold tracking-[-0.05em] text-[#0f172a]">This opportunity has moved.</h1>
        <p className="mt-2 text-[11px] leading-5 text-[#858c9e]">The page you’re looking for isn’t available. Explore current scholarships or head back to your workspace.</p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Link href="/scholarships" className="inline-flex items-center gap-2 rounded-xl bg-[#059669] px-4 py-2.5 text-[10px] font-bold text-white hover:bg-[#047857]"><Compass size={13} /> Explore scholarships</Link>
          <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-xl border border-[#e2e8f0] px-4 py-2.5 text-[10px] font-semibold text-[#6d7489] hover:bg-[#d1fae5]"><ArrowLeft size={13} /> Dashboard</Link>
        </div>
      </div>
    </main>
  );
}
