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
      <h1 className="text-[26px] tracking-tight">Tutor</h1>
      <p className="mt-1 text-[14px] text-mute">
        {subjectLabel} · {specLabel} · {topicName}
      </p>
      <div className="mt-5 flex flex-1 flex-col gap-3">
        {messages.map((message) => (
          <p
            key={message.id}
            className={
              message.role === "user"
                ? "ml-auto max-w-[88%] rounded-[10px] bg-brand px-4 py-3 text-[15px] leading-6 text-on-brand"
                : "mr-auto max-w-[88%] rounded-[10px] border border-line bg-surface px-4 py-3 text-[15px] leading-6 text-ink "
            }
          >
            {message.content || (pending ? "…" : "")}
          </p>
        ))}
      </div>
      <p className="mt-4 text-[12px] leading-5 text-mute">Crisis: Childline 0800 1111, Samaritans 116 123.</p>
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
          placeholder="Message"
          className="h-[52px] w-full rounded-[8px] border border-line bg-surface px-4 text-[15px] text-ink outline-none border border-line placeholder:text-mute"
        />
      </form>
    </div>
  );
}
