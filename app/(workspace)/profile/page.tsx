"use client";

import { useState, type FormEvent } from "react";
import {
  BadgeCheck,
  Camera,
  Check,
  ChevronDown,
  GraduationCap,
  MapPin,
  Save,
  UserRound,
} from "lucide-react";
import { ProgressBar, Surface } from "@/components/ui";

export default function ProfilePage() {
  const [saved, setSaved] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaved(true);
    window.setTimeout(() => setSaved(false), 3500);
  }

  return (
    <div className="mx-auto max-w-[1000px]">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6366f1]">
          Your details, your direction
        </p>
        <h1 className="mt-1 text-[27px] font-extrabold tracking-[-0.05em] text-[#0f172a] dark:text-white sm:text-[31px]">
          My profile
        </h1>
        <p className="mt-2 text-[12px] text-[#858c9e]">
          A little more about you helps us find more relevant opportunities.
        </p>
      </div>
      <div className="mt-6 grid gap-5 lg:grid-cols-[270px_1fr]">
        <aside className="space-y-4">
          <Surface className="p-5">
            <div className="flex items-center gap-3">
              <span className="grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-[#6366f1] to-[#312e81] text-[16px] font-bold text-white">
                JD
              </span>
              <div>
                <p className="text-[13px] font-bold text-[#0f172a] dark:text-white">
                  Jordan Davis
                </p>
                <p className="mt-1 text-[10px] text-[#9198a9]">
                  jordan.davis@email.com
                </p>
              </div>
            </div>
            <button
              type="button"
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-[#ddd6fe] py-2.5 text-[10px] font-semibold text-[#6f778b] hover:bg-[#e0e7ff]"
            >
              <Camera size={13} /> Update photo
            </button>
            <div className="mt-5 border-t border-[#ddd6fe] pt-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[10px] font-semibold text-[#777f93]">
                  Profile strength
                </p>
                <p className="text-[10px] font-bold text-[#6366f1]">72%</p>
              </div>
              <ProgressBar value={72} />
              <p className="mt-2 text-[9px] leading-4 text-[#969cad]">
                Add your interests and achievements to improve your matches.
              </p>
            </div>
          </Surface>
          <Surface className="p-4">
            <h2 className="text-[11px] font-bold text-[#464d63] dark:text-white">
              Profile checklist
            </h2>
            <div className="mt-3 space-y-3">
              {[
                ["Basic information", true],
                ["Education details", true],
                ["Academic interests", false],
                ["Achievements", false],
              ].map(([item, complete]) => (
                <div
                  key={String(item)}
                  className="flex items-center gap-2 text-[10px] text-[#778094]"
                >
                  <span
                    className={`grid size-4 place-items-center rounded-full ${complete ? "bg-[#eef2ff] text-[#312e81]" : "border border-[#ddd6fe] text-transparent"}`}
                  >
                    {complete && <Check size={10} />}
                  </span>
                  {String(item)}
                </div>
              ))}
            </div>
          </Surface>
        </aside>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Surface className="p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-lg bg-[#e0e7ff] text-[#6366f1]">
                <UserRound size={16} />
              </span>
              <div>
                <h2 className="text-[13px] font-bold text-[#0f172a] dark:text-white">
                  Personal information
                </h2>
                <p className="mt-0.5 text-[9px] text-[#959cad]">
                  How should we address you?
                </p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-[10px] font-semibold text-[#666e81]">
                  First name
                </span>
                <input
                  defaultValue="Jordan"
                  autoComplete="given-name"
                  className="workspace-input h-10 w-full rounded-xl border border-[#ddd6fe] bg-white px-3 text-[11px] text-[#0f172a] outline-none focus:border-[#a5b4fc]"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[10px] font-semibold text-[#666e81]">
                  Last name
                </span>
                <input
                  defaultValue="Davis"
                  autoComplete="family-name"
                  className="workspace-input h-10 w-full rounded-xl border border-[#ddd6fe] bg-white px-3 text-[11px] text-[#0f172a] outline-none focus:border-[#a5b4fc]"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[10px] font-semibold text-[#666e81]">
                  Email address
                </span>
                <input
                  defaultValue="jordan.davis@email.com"
                  type="email"
                  autoComplete="email"
                  className="workspace-input h-10 w-full rounded-xl border border-[#ddd6fe] bg-white px-3 text-[11px] text-[#0f172a] outline-none focus:border-[#a5b4fc]"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[10px] font-semibold text-[#666e81]">
                  Phone number{" "}
                  <span className="font-normal text-[#a2a8b7]">(optional)</span>
                </span>
                <input
                  placeholder="+1 (555) 000-0000"
                  type="tel"
                  autoComplete="tel"
                  className="workspace-input h-10 w-full rounded-xl border border-[#ddd6fe] bg-white px-3 text-[11px] text-[#0f172a] outline-none placeholder:text-[#b3b8c5] focus:border-[#a5b4fc]"
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-1.5 block text-[10px] font-semibold text-[#666e81]">
                  Location
                </span>
                <span className="relative block">
                  <MapPin
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a2a8b7]"
                  />
                  <input
                    defaultValue="Portland, Oregon"
                    autoComplete="address-level2"
                    className="workspace-input h-10 w-full rounded-xl border border-[#ddd6fe] bg-white pl-9 pr-3 text-[11px] text-[#0f172a] outline-none focus:border-[#a5b4fc]"
                  />
                </span>
              </label>
            </div>
          </Surface>

          <Surface className="p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-lg bg-[#fef3c7] text-[#f59e0b]">
                <GraduationCap size={16} />
              </span>
              <div>
                <h2 className="text-[13px] font-bold text-[#0f172a] dark:text-white">
                  Education
                </h2>
                <p className="mt-0.5 text-[9px] text-[#959cad]">
                  Tell us about your academic path.
                </p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-[10px] font-semibold text-[#666e81]">
                  Education level
                </span>
                <span className="relative block">
                  <select
                    defaultValue="Undergraduate"
                    className="workspace-input h-10 w-full appearance-none rounded-xl border border-[#ddd6fe] bg-white px-3 text-[11px] text-[#0f172a] outline-none focus:border-[#a5b4fc]"
                  >
                    <option>High school</option>
                    <option>Undergraduate</option>
                    <option>Graduate</option>
                    <option>Doctoral</option>
                    <option>Trade or vocational</option>
                  </select>
                  <ChevronDown
                    size={14}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#a2a8b7]"
                  />
                </span>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[10px] font-semibold text-[#666e81]">
                  Field of study
                </span>
                <span className="relative block">
                  <select
                    defaultValue="Computer Science"
                    className="workspace-input h-10 w-full appearance-none rounded-xl border border-[#ddd6fe] bg-white px-3 text-[11px] text-[#0f172a] outline-none focus:border-[#a5b4fc]"
                  >
                    <option>Computer Science</option>
                    <option>Engineering</option>
                    <option>Business</option>
                    <option>Education</option>
                    <option>Health Sciences</option>
                    <option>Arts & Humanities</option>
                  </select>
                  <ChevronDown
                    size={14}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#a2a8b7]"
                  />
                </span>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[10px] font-semibold text-[#666e81]">
                  School or institution
                </span>
                <input
                  defaultValue="Portland State University"
                  className="workspace-input h-10 w-full rounded-xl border border-[#ddd6fe] bg-white px-3 text-[11px] text-[#0f172a] outline-none focus:border-[#a5b4fc]"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[10px] font-semibold text-[#666e81]">
                  Expected graduation
                </span>
                <input
                  defaultValue="2027"
                  type="number"
                  min="2024"
                  max="2040"
                  className="workspace-input h-10 w-full rounded-xl border border-[#ddd6fe] bg-white px-3 text-[11px] text-[#0f172a] outline-none focus:border-[#a5b4fc]"
                />
              </label>
            </div>
          </Surface>
          <Surface className="flex flex-wrap items-center justify-between gap-3 p-4">
            <p className="flex items-center gap-2 text-[10px] text-[#8990a2]">
              <BadgeCheck size={14} className="text-[#312e81]" /> Your
              information helps personalize your recommendations.
            </p>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-[#6366f1] px-4 py-2.5 text-[10px] font-bold text-white hover:bg-[#312e81]"
            >
              <Save size={13} /> Save changes
            </button>
            {saved && (
              <p
                role="status"
                className="w-full text-right text-[10px] font-semibold text-[#312e81]"
              >
                Your profile changes are saved.
              </p>
            )}
          </Surface>
        </form>
      </div>
    </div>
  );
}
