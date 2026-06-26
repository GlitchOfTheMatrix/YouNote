// components/ChatPanel/ChatPanel.tsx
// Per-video follow-up chat. History is keyed by videoId in localStorage via
// lib/storage.ts; answers come from lib/api.ts.

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { askQuestion } from "../../lib/api";
import {
  clearChatHistory,
  loadChatHistory,
  saveChatHistory,
  type ChatMessage,
} from "../../lib/storage";
import { Button } from "../Button/Button";
import styles from "./ChatPanel.module.css";

function getSuggestions(videoId: string | null) {
  if (!videoId) return [];
  return [
    `What are the main takeaways from this video?`,
    `Can you summarise the key points of the video?`,
    `What is the most interesting part of the video?`,
  ];
}

function makeId() {
  return crypto.randomUUID();
}

export function ChatPanel({ videoId, notes }: { videoId: string | null; notes: string | null }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmingClear, setConfirmingClear] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages(loadChatHistory(videoId));
    setError(null);
    setConfirmingClear(false);
  }, [videoId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  async function send(question: string) {
    const trimmed = question.trim();
    if (!trimmed || sending) return;

    const userMsg: ChatMessage = { id: makeId(), role: "user", text: trimmed };
    const withUser = [...messages, userMsg];
    setMessages(withUser);
    saveChatHistory(videoId, withUser);
    setInput("");
    setError(null);
    setSending(true);

    try {
      const answer = await askQuestion(notes!, trimmed);
      const assistantMsg: ChatMessage = { id: makeId(), role: "assistant", text: answer };
      const withAnswer = [...withUser, assistantMsg];
      setMessages(withAnswer);
      saveChatHistory(videoId, withAnswer);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  }

  function handleClear() {
    setMessages([]);
    clearChatHistory(videoId);
    setConfirmingClear(false);
    setError(null);
  }

  const isEmpty = messages.length === 0;

  return (
    <section className={styles.panel} aria-label="Ask follow-up questions about this video">
      <div className={styles.header}>
        <h2 className={styles.title}>Ask about this video</h2>
        {!isEmpty &&
          (confirmingClear ? (
            <div className={styles.confirmRow} role="dialog" aria-label="Confirm clear conversation">
              <span className={styles.confirmText}>Clear all messages?</span>
              <Button variant="ghost" size="sm" onClick={() => setConfirmingClear(false)}>
                Cancel
              </Button>
              <Button variant="danger" size="sm" onClick={handleClear}>
                Clear
              </Button>
            </div>
          ) : (
            <button type="button" className={styles.clearBtn} onClick={() => setConfirmingClear(true)}>
              Clear
            </button>
          ))}
      </div>

      <div className={styles.scroll} ref={scrollRef}>
        {isEmpty ? (
          <div className={styles.empty}>
            <p className={styles.emptyText}>
              Ask anything about the video — answers are grounded in the transcript.
            </p>
            <div className={styles.suggestions}>
              {getSuggestions(videoId).map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  className={styles.suggestion}
                  onClick={() => send(suggestion)}
                  disabled={!notes}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className={styles.thread}>
            {messages.map((message) => (
              <div
                key={message.id}
                className={message.role === "user" ? styles.bubbleUserRow : styles.bubbleAssistantRow}
              >
                <div className={message.role === "user" ? styles.bubbleUser : styles.bubbleAssistant}>
                  {message.text}
                </div>
              </div>
            ))}
            {sending && (
              <div className={styles.bubbleAssistantRow}>
                <div className={styles.typing} aria-label="Assistant is typing" role="status">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            )}
          </div>
        )}

        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
      </div>

      <div className={styles.inputRow}>
        <textarea
          className={styles.textarea}
          placeholder="Ask a question… (Enter to send, Shift+Enter for a new line)"
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-label="Your question"
          disabled={!videoId || !notes}
        />
        <button
          type="button"
          className={styles.send}
          onClick={() => send(input)}
          disabled={sending || !input.trim() || !videoId || !notes}
          aria-label="Send question"
        >
          <svg
            viewBox="0 0 24 24"
            width="17"
            height="17"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M22 2 11 13" />
            <path d="M22 2 15 22l-4-9-9-4 20-7Z" />
          </svg>
        </button>
      </div>
    </section>
  );
}
