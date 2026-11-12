"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Bot,
  Check,
  ChevronDown,
  CornerDownLeft,
  FileText,
  Plus,
  Send,
  Sparkles,
} from "lucide-react";
import { Surface } from "@/components/ui";

type Message = { role: "assistant" | "student"; text: string };

const suggestions = [
  "What scholarships can I apply for this month?",
  "How do I write a strong personal statement?",
  "What documents should I prepare?",
];

const initialMessages: Message[] = [
  {
    role: "assistant",
    text: "Hi Jordan! I’m here to make the scholarship search feel a little simpler. What would you like to work on today?",
  },
];

function getReply(question: string) {
  const text = question.toLowerCase();
  if (text.includes("personal statement") || text.includes("essay")) {
    return "A strong personal statement connects a specific moment from your experience to what you hope to do next. Start with one vivid example, explain what you learned, and make the connection to this scholarship’s goals. Keep the provider’s word limit in mind.";
  }
  if (text.includes("document")) {
    return "It’s helpful to gather an up-to-date transcript, proof of enrollment, a short personal statement, and a reference contact. Requirements vary, so double-check each provider’s official checklist before you submit.";
  }
  if (text.includes("month") || text.includes("deadline")) {
    return "From your current matches, Bright Futures Fellowship is due November 23, followed by Future STEM Leaders on December 5. You can compare the details and start a checklist in your application tracker.";
  }
  return "A good next step is to open the scholarship details and compare the eligibility requirements with your profile. I’d also recommend checking the provider’s official page for current deadlines and required documents.";
}

export default function AssistantPage() {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");

  function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const question = input.trim();
    if (!question) return;
    setMessages((current) => [
      ...current,
      { role: "student", text: question },
      { role: "assistant", text: getReply(question) },
    ]);
    setInput("");
  }

  function chooseSuggestion(question: string) {
    setMessages((current) => [
      ...current,
      { role: "student", text: question },
      { role: "assistant", text: getReply(question) },
    ]);
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6366f1]">
            Your scholarship sidekick
          </p>
          <h1 className="mt-1 text-[27px] font-extrabold tracking-[-0.05em] text-[#0f172a] dark:text-white sm:text-[31px]">
            Ask ScholarAI
          </h1>
          <p className="mt-2 text-[12px] text-[#858c9e]">
            Get clear, grounded answers as you explore your next step.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setMessages(initialMessages)}
          className="inline-flex items-center gap-2 rounded-xl border border-[#ddd6fe] bg-white px-3 py-2 text-[10px] font-semibold text-[#6e758a] hover:border-[#e0e7ff] hover:text-[#6366f1]"
        >
          <Plus size={14} /> New conversation
        </button>
      </div>
      <div className="grid gap-4 xl:grid-cols-[1fr_260px]">
        <Surface className="flex min-h-[570px] flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#ddd6fe] px-4 py-3.5 sm:px-5">
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-[#6366f1] to-[#312e81] text-white">
                <Bot size={19} />
              </span>
              <div>
                <p className="text-[11px] font-bold text-[#0f172a] dark:text-white">
                  ScholarAI Assistant
                </p>
                <p className="mt-0.5 flex items-center gap-1 text-[9px] text-[#6366f1]">
                  <span className="size-1.5 rounded-full bg-[#6366f1]" /> Ready
                  to help
                </p>
              </div>
            </div>
            <button
              type="button"
              className="rounded-lg p-2 text-[#959bad] hover:bg-[#f5f3ff]"
              aria-label="Conversation options"
            >
              <ChevronDown size={16} />
            </button>
          </div>
          <div
            className="flex-1 space-y-5 overflow-y-auto bg-[#f5f3ff] p-4 sm:p-6"
            aria-live="polite"
          >
            <div className="text-center text-[9px] text-[#a2a8b7]">
              Today · Demo conversation
            </div>
            {messages.map((message, index) => (
              <div
                key={`${index}-${message.role}`}
                className={`flex gap-2.5 ${message.role === "student" ? "justify-end" : "justify-start"}`}
              >
                {message.role === "assistant" && (
                  <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-[#e0e7ff] text-[#6366f1]">
                    <Bot size={15} />
                  </span>
                )}
                <div
                  className={`max-w-[min(88%,570px)] rounded-2xl px-4 py-3 text-[11px] leading-5 sm:text-[12px] ${message.role === "assistant" ? "rounded-tl-md border border-[#ddd6fe] bg-white text-[#626a7f]" : "rounded-tr-md bg-[#6366f1] text-white"}`}
                >
                  <p>{message.text}</p>
                  {message.role === "assistant" && index > 0 && (
                    <div className="mt-3 border-t border-[#ddd6fe] pt-2.5">
                      <p className="mb-1.5 flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide text-[#9ba1b0]">
                        <FileText size={11} /> Sources to explore
                      </p>
                      <Link
                        href="/scholarships"
                        className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#6366f1] hover:underline"
                      >
                        Scholarship matches and deadlines{" "}
                        <ArrowUpRight size={11} />
                      </Link>
                    </div>
                  )}
                </div>
                {message.role === "student" && (
                  <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-[#ede9fe] text-[9px] font-bold text-[#626984]">
                    JD
                  </span>
                )}
              </div>
            ))}
            {messages.length === 1 && (
              <div className="pt-4">
                <p className="mb-2 text-[10px] font-semibold text-[#9097a8]">
                  A few things we can work on
                </p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => chooseSuggestion(suggestion)}
                      className="rounded-xl border border-[#ddd6fe] bg-white px-3 py-2 text-left text-[10px] text-[#697186] transition hover:border-[#e0e7ff] hover:bg-[#e0e7ff] hover:text-[#312e81]"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <form
            onSubmit={sendMessage}
            className="border-t border-[#ddd6fe] bg-white p-3 sm:p-4"
          >
            <label className="flex items-center gap-2 rounded-xl border border-[#ddd6fe] bg-[#f5f3ff] px-3 py-1.5 focus-within:border-[#a5b4fc]">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                aria-label="Ask ScholarAI a question"
                placeholder="Ask a question about scholarships..."
                className="workspace-input h-9 min-w-0 flex-1 bg-transparent text-[11px] text-[#0f172a] outline-none placeholder:text-[#a0a6b5]"
              />
              <span className="hidden items-center gap-1 text-[9px] text-[#a4a9b6] sm:flex">
                <CornerDownLeft size={11} /> Enter
              </span>
              <button
                type="submit"
                disabled={!input.trim()}
                aria-label="Send message"
                className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#6366f1] text-white transition hover:bg-[#312e81] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Send size={14} />
              </button>
            </label>
            <p className="mt-2 text-center text-[9px] text-[#a0a6b4]">
              <Sparkles size={10} className="mr-1 inline" /> Answers are a
              helpful starting point. Verify details with official scholarship
              sources.
            </p>
          </form>
        </Surface>

        <aside className="space-y-4">
          <Surface className="p-4">
            <h2 className="text-[11px] font-bold text-[#0f172a] dark:text-white">
              Recent conversations
            </h2>
            <div className="mt-3 space-y-1">
              {[
                "Finding STEM scholarships",
                "Application essay tips",
                "Understanding eligibility",
              ].map((item, index) => (
                <button
                  key={item}
                  type="button"
                  onClick={() =>
                    setMessages([
                      {
                        role: "assistant",
                        text: `Let’s pick up where you left off: ${item.toLowerCase()}. What would you like to explore?`,
                      },
                    ])
                  }
                  className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2.5 text-left text-[10px] ${index === 0 ? "bg-[#e0e7ff] font-semibold text-[#6366f1]" : "text-[#777f93] hover:bg-[#f5f3ff]"}`}
                >
                  <span className="size-1.5 rounded-full bg-[#6366f1]" />
                  {item}
                </button>
              ))}
            </div>
          </Surface>
          <Surface className="bg-gradient-to-br from-[#e0e7ff] to-white p-4">
            <span className="grid size-8 place-items-center rounded-lg bg-white text-[#6366f1] shadow-sm">
              <Sparkles size={16} />
            </span>
            <h2 className="mt-3 text-[11px] font-bold text-[#0f172a] dark:text-white">
              Tips for better answers
            </h2>
            <ul className="mt-2 space-y-2 text-[10px] leading-4 text-[#838a9d]">
              <li className="flex gap-2">
                <Check size={12} className="mt-0.5 shrink-0 text-[#312e81]" />{" "}
                Ask one question at a time
              </li>
              <li className="flex gap-2">
                <Check size={12} className="mt-0.5 shrink-0 text-[#312e81]" />{" "}
                Share your field or goals
              </li>
              <li className="flex gap-2">
                <Check size={12} className="mt-0.5 shrink-0 text-[#312e81]" />{" "}
                Confirm details with the provider
              </li>
            </ul>
          </Surface>
        </aside>
      </div>
    </div>
  );
}
