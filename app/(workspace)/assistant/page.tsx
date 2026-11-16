"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  Bot,
  Check,
  ChevronDown,
  CornerDownLeft,
  Plus,
  Send,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Surface } from "@/components/ui";
import { apiRequest } from "@/lib/api/client";

type Message = { role: "assistant" | "student"; text: string };
type ChatSession = {
  id: number;
  title: string;
  updated_at: string;
};
type ApiChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

const suggestions = [
  "What scholarships can I apply for this month?",
  "How do I write a strong personal statement?",
  "What documents should I prepare?",
];

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [busySessionId, setBusySessionId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const loadSessions = useCallback(async () => {
    const result = await apiRequest<{ sessions: ChatSession[] }>(
      "/api/ai/sessions?limit=100",
    );
    if (!Array.isArray(result.sessions)) {
      throw new Error("The conversation list response is invalid.");
    }
    setSessions(result.sessions);
  }, []);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      void loadSessions()
        .catch((cause: unknown) => {
          if (active) {
            setError(
              cause instanceof Error
                ? cause.message
                : "Unable to load conversations.",
            );
          }
        })
        .finally(() => {
          if (active) setIsLoadingSessions(false);
        });
    }, 0);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [loadSessions]);

  async function openSession(session: ChatSession) {
    setBusySessionId(session.id);
    setError("");
    try {
      const result = await apiRequest<{
        messages: ApiChatMessage[];
      }>(`/api/ai/sessions/${session.id}`);
      setActiveSessionId(session.id);
      setMessages(
        result.messages
          .filter(
            (message) => message.role === "assistant" || message.role === "user",
          )
          .map((message) => ({
            role: message.role === "user" ? "student" : "assistant",
            text: message.content,
          })),
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to open this conversation.",
      );
    } finally {
      setBusySessionId(null);
    }
  }

  async function deleteSession(sessionId: number) {
    if (!window.confirm("Delete this saved conversation?")) return;
    setBusySessionId(sessionId);
    setError("");
    try {
      await apiRequest<{ success: boolean }>(`/api/ai/sessions/${sessionId}`, {
        method: "DELETE",
      });
      setSessions((current) => current.filter((session) => session.id !== sessionId));
      if (activeSessionId === sessionId) {
        setActiveSessionId(null);
        setMessages([]);
      }
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to delete this conversation.",
      );
    } finally {
      setBusySessionId(null);
    }
  }

  async function sendQuestion(question: string) {
    const trimmed = question.trim();
    if (!trimmed || isSending) return;
    setMessages((current) => [...current, { role: "student", text: trimmed }]);
    setInput("");
    setIsSending(true);
    setError("");
    try {
      const result = await apiRequest<{
        answer?: string;
        response?: string;
      }>("/api/ai/chat", {
        method: "POST",
        body: JSON.stringify({
          message: trimmed,
          ...(activeSessionId ? { session_id: activeSessionId } : {}),
        }),
      });
      const answer = result.answer ?? result.response;
      if (!answer) {
        throw new Error("The assistant returned an empty response.");
      }
      setMessages((current) => [...current, { role: "assistant", text: answer }]);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "The assistant could not answer this question.",
      );
    } finally {
      setIsSending(false);
    }
  }

  function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendQuestion(input);
  }

  function chooseSuggestion(question: string) {
    void sendQuestion(question);
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6366f1]">
            Your scholarship sidekick
          </p>
          <h1 className="mt-1 text-[27px] font-extrabold tracking-tighter text-[#0f172a] dark:text-white sm:text-[31px]">
            Ask ScholarAI
          </h1>
          <p className="mt-2 text-[12px] text-[#858c9e]">
            Review saved conversations and send questions through the chat API.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setActiveSessionId(null);
            setMessages([]);
            setError("");
          }}
          className="inline-flex items-center gap-2 rounded-xl border border-[#ddd6fe] bg-white px-3 py-2 text-[10px] font-semibold text-[#6e758a] hover:border-[#e0e7ff] hover:text-[#6366f1]"
        >
          <Plus size={14} /> New conversation
        </button>
      </div>
      <div className="grid gap-4 xl:grid-cols-[1fr_260px]">
        <Surface className="flex min-h-142.5 flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#ddd6fe] px-4 py-3.5 sm:px-5">
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-xl bg-linear-to-br from-[#6366f1] to-[#312e81] text-white">
                <Bot size={19} />
              </span>
              <div>
                <p className="text-[11px] font-bold text-[#0f172a] dark:text-white">
                  ScholarAI Assistant
                </p>
                <p className="mt-0.5 flex items-center gap-1 text-[9px] text-[#6366f1]">
                  <span className={`size-1.5 rounded-full ${isSending ? "animate-pulse bg-amber-500" : "bg-[#6366f1]"}`} />
                  {isSending ? "Sending request" : "API-backed chat"}
                </p>
              </div>
              <p className="border-b border-amber-100 bg-amber-50 px-4 py-2 text-[10px] leading-5 text-amber-800">
                Chat responses are currently unavailable: the API returns 503 until
                grounded retrieval and citations are implemented.
              </p>
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
              {activeSessionId
                ? sessions.find((session) => session.id === activeSessionId)?.title
                : "New conversation"}
            </div>
            {error && (
              <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[10px] leading-5 text-rose-700" role="alert">
                {error}
              </p>
            )}
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
                </div>
                {message.role === "student" && (
                  <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-[#ede9fe] text-[9px] font-bold text-[#626984]">
                    JD
                  </span>
                )}
              </div>
            ))}
            {messages.length === 0 && (
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
                disabled={!input.trim() || isSending}
                aria-label="Send message"
                className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#6366f1] text-white transition hover:bg-[#312e81] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Send size={14} />
              </button>
            </label>
            <p className="mt-2 text-center text-[9px] text-[#a0a6b4]">
              <Sparkles size={10} className="mr-1 inline" /> Assistant responses
              are subject to available service configuration; verify details
              with official scholarship sources.
            </p>
          </form>
        </Surface>

        <aside className="space-y-4">
          <Surface className="p-4">
            <h2 className="text-[11px] font-bold text-[#0f172a] dark:text-white">
              Recent conversations
            </h2>
            <div className="mt-3 space-y-1">
              {isLoadingSessions && (
                <p className="px-2 py-2 text-[10px] text-[#858c9e]" role="status">
                  Loading conversations…
                </p>
              )}
              {!isLoadingSessions && sessions.length === 0 && (
                <p className="px-2 py-2 text-[10px] leading-5 text-[#858c9e]">
                  No saved conversations yet.
                </p>
              )}
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={`flex items-center gap-1 rounded-lg px-2.5 ${activeSessionId === session.id ? "bg-[#e0e7ff]" : "hover:bg-[#f5f3ff]"}`}
                >
                  <button
                    type="button"
                    disabled={busySessionId === session.id}
                    onClick={() => void openSession(session)}
                    className="min-w-0 flex-1 truncate py-2.5 text-left text-[10px] font-medium text-[#555d71] disabled:opacity-50"
                  >
                    {session.title}
                  </button>
                  <button
                    type="button"
                    disabled={busySessionId === session.id}
                    onClick={() => void deleteSession(session.id)}
                    aria-label={`Delete ${session.title}`}
                    className="rounded p-1.5 text-[#9299aa] hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          </Surface>
          <Surface className="bg-linear-to-br from-[#e0e7ff] to-white p-4 dark:from-[#17172f] dark:to-[#17172f]">
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
