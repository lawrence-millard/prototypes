"use client";

import { useState } from "react";

type ChatMessage = { id: string; role: "user" | "assistant"; content: string };

export function TutorChat({
  chatId,
  subjectLabel,
  specLabel,
  topicName,
  initialMessages,
}: {
  chatId: string;
  subjectLabel: string;
  specLabel: string;
  topicName: string;
  initialMessages: ChatMessage[];
}) {
  const [activeChat, setActiveChat] = useState(chatId);
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = draft.trim();
    if (!content || pending) return;
    setDraft("");
    setError("");
    setPending(true);
    const userMessage: ChatMessage = { id: `local-${Date.now()}`, role: "user", content };
    const assistantId = `local-reply-${Date.now()}`;
    setMessages((current) => [...current, userMessage, { id: assistantId, role: "assistant", content: "" }]);
    try {
      const response = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "text/plain" },
        body: JSON.stringify({ chatId: activeChat, content }),
      });
      const nextChat = response.headers.get("X-Chat-Id");
      if (nextChat) setActiveChat(nextChat);
      if (!response.ok || !response.body) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null;
        setMessages((current) => current.filter((message) => message.id !== assistantId && message.id !== userMessage.id));
        setDraft(content);
        setError(payload?.message ?? "The tutor could not reply just then.");
        return;
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assembled = "";
      while (true) {
        const chunk = await reader.read();
        if (chunk.done) break;
        assembled += decoder.decode(chunk.value, { stream: true });
        const visible = assembled;
        setMessages((current) =>
          current.map((message) => (message.id === assistantId ? { ...message, content: visible } : message)),
        );
      }
    } catch {
      setError("The tutor could not reply just then.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <h1 className="text-[32px] font-bold tracking-tight">Ask Markwise</h1>
      <p className="mt-1 text-[15px] text-mute">
        {subjectLabel} · {specLabel} · {topicName}
      </p>
      <div className="mt-5 flex flex-1 flex-col gap-3">
        {messages.length === 0 ? (
          <p className="rounded-[20px] bg-white px-4 py-3 text-[15px] leading-6 text-ink">
            Ask about this topic. I will give you a hint, not the essay.
          </p>
        ) : null}
        {messages.map((message) => (
          <p
            key={message.id}
            className={
              message.role === "user"
                ? "ml-auto max-w-[88%] rounded-[20px] bg-brand px-4 py-3 text-[15px] leading-6 text-white"
                : "mr-auto max-w-[88%] rounded-[20px] bg-white px-4 py-3 text-[15px] leading-6 text-ink shadow-[0_8px_28px_rgba(40,32,80,0.04)]"
            }
          >
            {message.content || (pending ? "…" : "")}
          </p>
        ))}
      </div>
      <p className="mt-4 text-[12px] leading-5 text-mute">
        Hints only, never a full essay. If you are in crisis: Childline 0800 1111 · Samaritans 116 123.
      </p>
      {error ? <p className="mt-2 text-[14px] text-bad">{error}</p> : null}
      <form onSubmit={onSubmit} className="mt-3">
        <label className="sr-only" htmlFor="tutor-message">
          Message
        </label>
        <input
          id="tutor-message"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          maxLength={2000}
          placeholder="Ask about any topic..."
          className="h-[52px] w-full rounded-[18px] bg-white px-4 text-[15px] text-ink outline-none ring-1 ring-black/5 placeholder:text-mute"
        />
      </form>
    </div>
  );
}
