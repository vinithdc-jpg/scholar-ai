import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  BookOpenCheck,
  Check,
  ChevronRight,
  GraduationCap,
  HeartHandshake,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";

const featureItems = [
  {
    icon: Target,
    title: "Made for your goals",
    description:
      "Recommendations shaped around your studies, strengths, and the future you want.",
    color: "bg-[#e0e7ff] text-[#6366f1]",
  },
  {
    icon: ShieldCheck,
    title: "Sources you can trust",
    description:
      "Every opportunity is checked and linked to its official application source.",
    color: "bg-[#eef2ff] text-[#312e81]",
  },
  {
    icon: BookOpenCheck,
    title: "One clear next step",
    description:
      "Know what you qualify for, what you need, and when it is due.",
    color: "bg-[#fef3c7] text-[#f59e0b]",
  },
];

export default function LandingPage() {
  return (
    <main className="overflow-hidden bg-white text-[#0f172a]">
      <header className="relative z-10 mx-auto flex max-w-310 items-center justify-between px-5 py-5 sm:px-8 lg:px-10">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-linear-to-br from-[#6366f1] to-[#312e81] text-white shadow-md shadow-indigo-200">
            <GraduationCap size={21} />
          </span>
          <span className="text-[18px] font-extrabold tracking-tighter">
            scholar<span className="text-[#6366f1]">ai</span>
          </span>
        </Link>
        <nav
          className="hidden items-center gap-8 text-[13px] font-medium text-[#737b91] md:flex"
          aria-label="Main navigation"
        >
          <a href="#how-it-works" className="transition hover:text-[#312e81]">
            How it works
          </a>
          <a href="#why-scholarai" className="transition hover:text-[#312e81]">
            Why ScholarAI
          </a>
          <Link
            href="/scholarships"
            className="transition hover:text-[#312e81]"
          >
            Explore
          </Link>
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/login"
            className="hidden rounded-xl px-4 py-2.5 text-[12px] font-semibold text-[#50576c] transition hover:bg-[#f5f3ff] sm:inline-flex"
          >
            Log in
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-xl bg-[#6366f1] px-4 py-2.5 text-[12px] font-semibold text-white shadow-lg shadow-[#6366f1]/20 transition hover:-translate-y-0.5 hover:bg-[#312e81]"
          >
            Get started <ArrowRight size={14} />
          </Link>
        </div>
      </header>

      <section className="relative mx-auto grid max-w-310 items-center gap-12 px-5 pb-20 pt-10 sm:px-8 sm:pb-24 sm:pt-14 lg:grid-cols-[1.04fr_0.96fr] lg:gap-6 lg:px-10 lg:pb-28 lg:pt-16">
        <div className="pointer-events-none absolute -left-44 top-0 size-125 rounded-full bg-[#e0e7ff] opacity-70 blur-[90px]" />
        <div className="relative z-10 max-w-150">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#e0e7ff] bg-[#e0e7ff] px-3 py-1.5 text-[11px] font-semibold text-[#6366f1]">
            <span className="grid size-5 place-items-center rounded-full bg-white">
              <Sparkles size={12} />
            </span>
            Your next opportunity starts here
          </div>
          <h1 className="text-[43px] font-extrabold leading-[1.09] tracking-[-0.065em] text-[#0f172a] sm:text-[58px] lg:text-[68px]">
            Your future is
            <br />
            <span className="bg-linear-to-r from-[#6366f1] via-[#6366f1] to-[#6366f1] bg-clip-text text-transparent">
              worth investing in.
            </span>
          </h1>
          <p className="mt-6 max-w-127.5 text-[15px] leading-7 text-[#737b91] sm:text-[16px]">
            Find scholarships that fit your story, make sense of the details,
            and take your next step with confidence.
          </p>
          <form
            action="/scholarships"
            className="mt-8 flex max-w-135 flex-col gap-2 rounded-2xl border border-[#ddd6fe] bg-white p-2 shadow-[0_14px_45px_rgba(48,52,111,0.09)] sm:flex-row"
          >
            <label className="flex min-h-12 flex-1 items-center gap-3 px-3">
              <Search size={18} className="shrink-0 text-[#9ba1b2]" />
              <input
                name="q"
                placeholder="What are you studying?"
                aria-label="What are you studying?"
                className="min-w-0 flex-1 bg-transparent text-[13px] text-[#0f172a] outline-none placeholder:text-[#a3a9b8]"
              />
            </label>
            <button
              type="submit"
              className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#6366f1] px-6 text-[12px] font-bold text-white transition hover:bg-[#312e81]"
            >
              Find scholarships <ArrowRight size={15} />
            </button>
          </form>
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-[#82899b]">
            <span className="flex items-center gap-1.5">
              <Check size={13} className="text-[#312e81]" /> Verified
              opportunities
            </span>
            <span className="flex items-center gap-1.5">
              <Check size={13} className="text-[#312e81]" /> Personalized
              matches
            </span>
            <span className="flex items-center gap-1.5">
              <Check size={13} className="text-[#312e81]" /> Always free to
              explore
            </span>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-135 lg:ml-auto">
          <div className="absolute -right-10 -top-8 size-36 rounded-full bg-[#e0e7ff] blur-3xl" />
          <div className="absolute -bottom-5 -left-7 size-36 rounded-full bg-[#e0e7ff] blur-3xl" />
          <div className="relative rounded-[30px] border border-[#ddd6fe] bg-linear-to-br from-white via-[#f5f3ff] to-[#f5f3ff] p-5 shadow-[0_30px_70px_rgba(15,23,42,0.10)] sm:p-7">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-[#858ba0]">
                  Your scholarship snapshot
                </p>
                <p className="mt-1 text-[18px] font-bold tracking-[-0.04em] text-[#0f172a]">
                  A great place to start
                </p>
              </div>
              <span className="grid size-10 place-items-center rounded-xl bg-white text-[#6366f1] shadow-sm">
                <Sparkles size={18} />
              </span>
            </div>
            <div className="mt-6 flex items-end justify-between rounded-2xl bg-white p-4 shadow-sm sm:p-5">
              <div>
                <p className="text-[11px] text-[#9298a9]">
                  Potential awards for you
                </p>
                <p className="mt-1 text-[32px] font-extrabold tracking-[-0.06em] text-[#0f172a] sm:text-[38px]">
                  $24,500
                  <span className="text-[13px] font-semibold text-[#8d94a6]">
                    +
                  </span>
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-[10px] text-[#312e81]">
                  <BadgeCheck size={13} /> Based on your profile
                </p>
              </div>
              <div
                className="flex h-18.75 items-end gap-1.5"
                aria-label="Illustrative rising scholarship match chart"
              >
                {[24, 35, 29, 48, 41, 58, 52, 69, 63, 85].map(
                  (height, index) => (
                    <span
                      key={index}
                      className={`w-2.5 rounded-t-full ${index === 9 ? "bg-[#6366f1]" : "bg-[#e0e7ff]"}`}
                      style={{ height: `${height}%` }}
                    />
                  ),
                )}
              </div>
            </div>
            <div className="mt-3 rounded-2xl bg-white p-4 shadow-sm sm:p-5">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-[12px] font-bold text-[#0f172a]">
                  Your top matches
                </p>
                <span className="text-[10px] font-semibold text-[#6366f1]">
                  See all
                </span>
              </div>
              {[
                {
                  logo: "HF",
                  color: "bg-[#6366f1]",
                  name: "Bright Futures Fellowship",
                  match: "98% match",
                  amount: "$12,000",
                },
                {
                  logo: "N",
                  color: "bg-[#818cf8]",
                  name: "Future STEM Leaders Award",
                  match: "94% match",
                  amount: "$8,500",
                },
              ].map((item) => (
                <div
                  key={item.logo}
                  className="flex items-center gap-3 border-t border-[#ede9fe] py-3 first:border-0 first:pt-0 last:pb-0"
                >
                  <span
                    className={`grid size-9 place-items-center rounded-xl ${item.color} text-[10px] font-bold text-white`}
                  >
                    {item.logo}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-bold text-[#0f172a]">
                      {item.name}
                    </p>
                    <p className="mt-1 text-[10px] text-[#312e81]">
                      {item.match}
                    </p>
                  </div>
                  <p className="text-[12px] font-bold text-[#0f172a]">
                    {item.amount}
                  </p>
                </div>
              ))}
            </div>
            <div className="absolute -left-5 top-[40%] hidden items-center gap-2 rounded-xl border border-[#e0e7ff] bg-white px-3 py-2.5 shadow-[0_8px_24px_rgba(36,39,88,0.12)] sm:flex">
              <span className="grid size-8 place-items-center rounded-lg bg-[#eef2ff] text-[#312e81]">
                <HeartHandshake size={16} />
              </span>
              <div>
                <p className="text-[10px] font-bold text-[#0f172a]">
                  Made for you
                </p>
                <p className="text-[9px] text-[#8e95a6]">Real opportunities</p>
              </div>
            </div>
            <div className="absolute -right-3 bottom-[20%] hidden items-center gap-2 rounded-xl border border-[#e0e7ff] bg-white px-3 py-2.5 shadow-[0_8px_24px_rgba(36,39,88,0.12)] sm:flex">
              <span className="grid size-8 place-items-center rounded-lg bg-[#fef3c7] text-[#f59e0b]">
                <GraduationCap size={16} />
              </span>
              <div>
                <p className="text-[10px] font-bold text-[#0f172a]">
                  Next step ready
                </p>
                <p className="text-[9px] text-[#8e95a6]">Deadline in 12 days</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[#ede9fe] bg-[#f5f3ff] py-7">
        <div className="mx-auto flex max-w-310 flex-wrap items-center justify-center gap-x-10 gap-y-5 px-5 text-center sm:px-8 lg:justify-between lg:px-10">
          {[
            { value: "12k+", label: "opportunities to explore" },
            { value: "$3.2B", label: "in education funding" },
            { value: "98%", label: "students find a match" },
            { value: "100%", label: "free to get started" },
          ].map((stat) => (
            <div key={stat.label} className="min-w-32.5">
              <p className="text-[20px] font-extrabold tracking-[-0.04em] text-[#0f172a]">
                {stat.value}
              </p>
              <p className="mt-1 text-[10px] text-[#858c9e]">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section
        id="why-scholarai"
        className="mx-auto max-w-310 px-5 py-20 sm:px-8 sm:py-24 lg:px-10"
      >
        <div className="mx-auto max-w-142.5 text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#6366f1]">
            A little less searching. A lot more possibility.
          </p>
          <h2 className="mt-3 text-[31px] font-extrabold leading-tight tracking-tighter text-[#0f172a] sm:text-[40px]">
            A clearer path to the support you deserve.
          </h2>
          <p className="mt-4 text-[13px] leading-6 text-[#81889a]">
            Scholarship applications can feel overwhelming. We bring the right
            opportunities and the right next steps together, so you can focus on
            where you’re going.
          </p>
        </div>
        <div className="mt-11 grid gap-4 md:grid-cols-3">
          {featureItems.map(({ icon: Icon, title, description, color }) => (
            <article
              key={title}
              className="rounded-2xl border border-[#ddd6fe] bg-white p-6 transition hover:-translate-y-1 hover:shadow-lg hover:shadow-[#33355c]/5"
            >
              <span
                className={`grid size-11 place-items-center rounded-xl ${color}`}
              >
                <Icon size={20} />
              </span>
              <h3 className="mt-5 text-[15px] font-bold text-[#0f172a]">
                {title}
              </h3>
              <p className="mt-2 text-[12px] leading-6 text-[#858c9e]">
                {description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="bg-[#f5f3ff] py-20 sm:py-24">
        <div className="mx-auto grid max-w-310 gap-12 px-5 sm:px-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:px-10">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#6366f1]">
              Simple by design
            </p>
            <h2 className="mt-3 max-w-105 text-[32px] font-extrabold leading-tight tracking-tighter text-[#0f172a] sm:text-[40px]">
              Three small steps. A future of possibilities.
            </h2>
            <p className="mt-4 max-w-97.5 text-[13px] leading-6 text-[#81889a]">
              A little about you is all we need to point you in the right
              direction.
            </p>
            <Link
              href="/register"
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#6366f1] px-5 py-3 text-[12px] font-bold text-white transition hover:bg-[#312e81]"
            >
              Find your starting point <ArrowRight size={14} />
            </Link>
          </div>
          <div className="space-y-3">
            {[
              {
                number: "01",
                title: "Tell us what matters to you",
                description:
                  "Add your field of study, goals, and what makes your story yours.",
                icon: GraduationCap,
              },
              {
                number: "02",
                title: "Explore your personal matches",
                description:
                  "See relevant, verified scholarships with clear eligibility details.",
                icon: Sparkles,
              },
              {
                number: "03",
                title: "Move forward with confidence",
                description:
                  "Track applications, stay ahead of deadlines, and ask questions as you go.",
                icon: ArrowUpRight,
              },
            ].map(({ number, title, description, icon: Icon }) => (
              <div
                key={number}
                className="flex gap-4 rounded-2xl border border-[#ddd6fe] bg-white p-5 sm:gap-5 sm:p-6"
              >
                <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#e0e7ff] text-[#6366f1]">
                  <Icon size={19} />
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-x-2">
                    <span className="text-[10px] font-bold tracking-widest text-[#6366f1]">
                      {number}
                    </span>
                    <h3 className="text-[13px] font-bold text-[#0f172a]">
                      {title}
                    </h3>
                  </div>
                  <p className="mt-1.5 text-[11px] leading-5 text-[#8a91a1]">
                    {description}
                  </p>
                </div>
                <ChevronRight
                  className="mt-2 hidden text-[#c2c6d1] sm:block"
                  size={17}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-310 px-5 py-16 sm:px-8 sm:py-20 lg:px-10">
        <div className="relative overflow-hidden rounded-[26px] bg-linear-to-br from-[#312e81] via-[#6366f1] to-[#6366f1] px-6 py-10 text-white sm:px-12 sm:py-12 lg:px-16">
          <div className="absolute -right-12 -top-28 size-80 rounded-full border border-white/10" />
          <div className="absolute -right-2 -top-16 size-60 rounded-full border border-white/10" />
          <div className="relative z-10 max-w-145">
            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-indigo-100">
              Your next chapter is closer than you think
            </p>
            <h2 className="mt-3 text-[30px] font-extrabold leading-tight tracking-tighter sm:text-[39px]">
              Let’s find the support that moves you forward.
            </h2>
            <p className="mt-3 max-w-115 text-[12px] leading-6 text-indigo-100">
              Create your free profile and discover opportunities that are as
              individual as you are.
            </p>
            <Link
              href="/register"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-[12px] font-bold text-[#312e81] transition hover:bg-indigo-50"
            >
              Get started for free <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#ddd6fe] bg-[#f5f3ff]">
        <div className="mx-auto flex max-w-310 flex-col gap-5 px-5 py-7 text-[10px] text-[#868d9e] sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
          <Link
            href="/"
            className="flex items-center gap-2 text-[13px] font-extrabold tracking-[-0.04em] text-[#0f172a]"
          >
            <span className="grid size-7 place-items-center rounded-lg bg-[#6366f1] text-white">
              <GraduationCap size={16} />
            </span>
            scholar<span className="-ml-2 text-[#6366f1]">ai</span>
          </Link>
          <p>© 2026 ScholarAI. Built for your next big step.</p>
          <div className="flex gap-5">
            <Link href="/login" className="hover:text-[#6366f1]">
              Log in
            </Link>
            <Link href="/scholarships" className="hover:text-[#6366f1]">
              Explore scholarships
            </Link>
            <Link
              href="/assistant"
              className="inline-flex items-center gap-1 hover:text-[#6366f1]"
            >
              Get help <ArrowUpRight size={11} />
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
