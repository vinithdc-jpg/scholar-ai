"use client";

import { useState } from "react";
import {
  Bell,
  CalendarDays,
  CheckCheck,
  ChevronRight,
  Clock3,
  FileCheck2,
  Settings2,
  Sparkles,
} from "lucide-react";
import { Pill, Surface } from "@/components/ui";

const initialNotifications = [
  {
    title: "A new match just for you",
    text: "The First Generation Scholars Fund may fit your profile.",
    time: "2 hours ago",
    icon: Sparkles,
    color: "bg-[#e0e7ff] text-[#6366f1]",
    unread: true,
  },
  {
    title: "Deadline coming up",
    text: "Bright Futures Fellowship closes in 12 days.",
    time: "Yesterday",
    icon: CalendarDays,
    color: "bg-[#fef3c7] text-[#f59e0b]",
    unread: true,
  },
  {
    title: "Application progress saved",
    text: "Your Future STEM Leaders application is ready to review.",
    time: "2 days ago",
    icon: FileCheck2,
    color: "bg-[#eef2ff] text-[#312e81]",
    unread: false,
  },
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [emailReminders, setEmailReminders] = useState(true);

  function markAllRead() {
    setNotifications((current) =>
      current.map((item) => ({ ...item, unread: false })),
    );
  }

  return (
    <div className="mx-auto max-w-237.5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6366f1]">
            Stay in the know
          </p>
          <h1 className="mt-1 text-[27px] font-extrabold tracking-tighter text-[#0f172a] dark:text-white sm:text-[31px]">
            Notifications
          </h1>
          <p className="mt-2 text-[12px] text-[#858c9e]">
            A friendly reminder when something needs your attention.
          </p>
        </div>
        <button
          type="button"
          onClick={markAllRead}
          className="inline-flex items-center gap-2 rounded-xl border border-[#ddd6fe] bg-white px-3 py-2.5 text-[10px] font-semibold text-[#747b8e] hover:border-[#e0e7ff] hover:text-[#6366f1]"
        >
          <CheckCheck size={14} /> Mark all as read
        </button>
      </div>
      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_280px]">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[13px] font-bold text-[#0f172a] dark:text-white">
              Recent updates
            </h2>
            <Pill>
              {notifications.filter((item) => item.unread).length} new
            </Pill>
          </div>
          {notifications.length > 0 ? (
            <div className="space-y-2.5">
              {notifications.map(
                ({ title, text, time, icon: Icon, color, unread }) => (
                  <Surface
                    key={title}
                    className={`flex gap-3 p-4 ${unread ? "border-[#ddd6fe] bg-[#f5f3ff]" : ""}`}
                  >
                    <span
                      className={`grid size-9 shrink-0 place-items-center rounded-xl ${color}`}
                    >
                      <Icon size={16} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-[11px] font-bold text-[#0f172a] dark:text-white">
                          {title}
                        </h3>
                        {unread && (
                          <span className="size-1.5 rounded-full bg-[#6366f1]" />
                        )}
                      </div>
                      <p className="mt-1 text-[10px] leading-5 text-[#838a9d]">
                        {text}
                      </p>
                      <p className="mt-1.5 flex items-center gap-1 text-[9px] text-[#a0a6b5]">
                        <Clock3 size={10} /> {time}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="self-center rounded-lg p-1.5 text-[#a2a8b7] hover:bg-[#f5f3ff]"
                      aria-label={`Open ${title}`}
                    >
                      <ChevronRight size={15} />
                    </button>
                  </Surface>
                ),
              )}
            </div>
          ) : (
            <Surface className="px-6 py-12 text-center">
              <Bell className="mx-auto text-[#a8adba]" size={22} />
              <p className="mt-3 text-[12px] font-semibold text-[#5b6378]">
                You’re all caught up
              </p>
              <p className="mt-1 text-[10px] text-[#8d94a4]">
                New updates will appear here.
              </p>
            </Surface>
          )}
        </section>
        <aside>
          <Surface className="p-4">
            <div className="flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-lg bg-[#e0e7ff] text-[#6366f1]">
                <Settings2 size={15} />
              </span>
              <h2 className="text-[11px] font-bold text-[#0f172a] dark:text-white">
                Notification preferences
              </h2>
            </div>
            <div className="mt-4 flex items-center justify-between gap-3 border-t border-[#ddd6fe] pt-4">
              <div>
                <p className="text-[10px] font-semibold text-[#555d71]">
                  Deadline reminders
                </p>
                <p className="mt-1 text-[9px] text-[#9299aa]">
                  Helpful email nudges
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={emailReminders}
                aria-label="Toggle deadline reminder emails"
                onClick={() => setEmailReminders((value) => !value)}
                className={`relative h-5 w-9 rounded-full transition ${emailReminders ? "bg-[#6366f1]" : "bg-[#d5d8e1]"}`}
              >
                <span
                  className={`absolute top-0.5 size-4 rounded-full bg-white shadow-sm transition-all ${emailReminders ? "left-4.5" : "left-0.5"}`}
                />
              </button>
            </div>
            <div className="mt-4 flex items-center justify-between gap-3 border-t border-[#ddd6fe] pt-4">
              <div>
                <p className="text-[10px] font-semibold text-[#555d71]">
                  Application updates
                </p>
                <p className="mt-1 text-[9px] text-[#9299aa]">
                  Status and checklist changes
                </p>
              </div>
              <span className="rounded-full bg-[#eef2ff] px-2 py-1 text-[9px] font-semibold text-[#312e81]">
                On
              </span>
            </div>
          </Surface>
          <Surface className="mt-4 bg-linear-to-br from-[#e0e7ff] to-white p-4 dark:from-[#17172f] dark:to-[#17172f]">
            <p className="flex items-center gap-2 text-[10px] font-bold text-[#0f172a] dark:text-white">
              <CalendarDays size={14} className="text-[#6366f1]" /> Coming up
            </p>
            <p className="mt-2 text-[10px] leading-5 text-[#828a9c]">
              Your next application deadline is in 12 days. You’ve got time to
              get ready.
            </p>
            <a
              href="/applications"
              className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold text-[#6366f1] hover:underline"
            >
              View application tracker <ChevronRight size={12} />
            </a>
          </Surface>
        </aside>
      </div>
    </div>
  );
}
