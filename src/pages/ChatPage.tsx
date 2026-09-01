/**
 * The chat screen — the main way to put anything into the system.
 *
 * Messages live in threads, so "New chat" starts a clean one and past chats
 * stay in the sidebar. Threads also give the agents short-term memory: when
 * they ask how big a portion was, your reply lands in the same thread and is
 * understood as the answer.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { chatApi } from '@/api';
import { errorMessage } from '@/api/http';
import { useServiceNotice } from '@/context/StatusContext';
import { InlineNotice } from '@/components/ui/Notices';
import { Composer } from '@/components/chat/Composer';
import { ConversationList } from '@/components/chat/ConversationList';
import { MessageTurn, UserBubble } from '@/components/chat/MessageTurn';
import { Spinner } from '@/components/ui/States';
import { PlusIcon, SparkIcon, HistoryIcon, CloseIcon } from '@/components/ui/Icons';
import type { AgentRun, AiStatus, Conversation, PageInfo, ThreadPageInfo } from '@/types';

const SUGGESTIONS = [
  'I spent ₹200 on food and ₹100 on Rapido',
  'I had two rotis, dal and paneer for dinner',
  'Invested ₹10,000 through SIP this month',
  'How much did I spend on food this month?'
];

/** Hidden by default — most of the time you just want the conversation. */
const HISTORY_KEY = 'saarthios.chatHistoryOpen';

export function ChatPage() {
  const [status, setStatus] = useState<AiStatus | null>(null);
  const chatNotice = useServiceNotice('ai');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [runs, setRuns] = useState<AgentRun[]>([]);
  /** Where the loaded window starts in the thread, for "load earlier". */
  const [thread, setThread] = useState<ThreadPageInfo | null>(null);
  const [loadingEarlier, setLoadingEarlier] = useState(false);
  const [conversationPage, setConversationPage] = useState<PageInfo | null>(null);

  const [draft, setDraft] = useState('');
  /** Your message, shown the instant you press Enter. */
  const [pending, setPending] = useState<string | null>(null);
  const [loadingThread, setLoadingThread] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(
    () => localStorage.getItem(HISTORY_KEY) === 'true'
  );

  const bottomRef = useRef<HTMLDivElement>(null);

  const toggleHistory = () => {
    setHistoryOpen((open) => {
      localStorage.setItem(HISTORY_KEY, String(!open));
      return !open;
    });
  };

  const refreshConversations = useCallback(
    () =>
      chatApi
        .conversations()
        .then((data) => {
          setConversations(data.conversations);
          setConversationPage(data.page);
        })
        .catch(() => undefined),
    []
  );

  const loadMoreConversations = async () => {
    if (!conversationPage?.hasMore) return;
    try {
      const data = await chatApi.conversations(conversations.length);
      setConversations((list) => [...list, ...data.conversations]);
      setConversationPage(data.page);
    } catch {
      // The sidebar is secondary; failing to extend it should not interrupt.
    }
  };

  useEffect(() => {
    chatApi.status().then(setStatus).catch(() => undefined);
    void refreshConversations();
  }, [refreshConversations]);

  // Opening the most recent thread is friendlier than a blank screen.
  useEffect(() => {
    if (activeId === null && conversations.length > 0 && runs.length === 0 && !pending) {
      void openConversation(conversations[0]._id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [runs, pending]);

  const openConversation = async (id: string) => {
    setLoadingThread(true);
    setError(null);
    try {
      const { runs: loaded, page } = await chatApi.conversation(id);
      setActiveId(id);
      setRuns(loaded);
      setThread(page);
    } catch (err) {
      setError(errorMessage(err, 'Could not open that chat.'));
    } finally {
      setLoadingThread(false);
    }
  };

  /** Walks backwards through a long thread, prepending older messages. */
  const loadEarlier = async () => {
    if (!activeId || !thread?.hasEarlier || loadingEarlier) return;

    setLoadingEarlier(true);
    try {
      const { runs: older, page } = await chatApi.conversation(activeId, thread.oldestIndex);
      setRuns((current) => [...older, ...current]);
      setThread(page);
    } catch (err) {
      setError(errorMessage(err, 'Could not load earlier messages.'));
    } finally {
      setLoadingEarlier(false);
    }
  };

  const startNewChat = () => {
    setActiveId(null);
    setRuns([]);
    setThread(null);
    setPending(null);
    setError(null);
  };

  const removeConversation = async (id: string) => {
    await chatApi.removeConversation(id).catch(() => undefined);
    if (id === activeId) startNewChat();
    void refreshConversations();
  };

  const send = async (text?: string) => {
    const message = (text ?? draft).trim();
    if (!message || pending) return;

    setDraft('');
    setPending(message);
    setError(null);
    try {
      const { run, conversationId } = await chatApi.send(message, activeId ?? undefined);
      setActiveId(conversationId);
      setRuns((previous) => [...previous, run]);
      void refreshConversations();
    } catch (err) {
      setError(errorMessage(err, 'The assistant could not respond.'));
      setDraft(message);
    } finally {
      setPending(null);
    }
  };

  const aiOff = !!status && !status.configured;
  const isEmpty = runs.length === 0 && !pending && !loadingThread;

  return (
    <div className="flex h-[calc(100vh-3.25rem)] lg:h-screen">
      {/* Past chats stay out of the way until asked for. */}
      {historyOpen && (
        <>
          <div
            className="fixed inset-0 z-30 bg-overlay/30 backdrop-blur-[2px] xl:hidden"
            onClick={toggleHistory}
            aria-hidden="true"
          />
          <aside className="fixed inset-y-0 left-0 z-40 flex w-72 animate-fade-up flex-col border-r border-line bg-surface xl:static xl:z-auto xl:w-64 xl:animate-none">
            <div className="flex items-center justify-between px-3 pt-3 xl:hidden">
              <span className="text-xs font-medium uppercase tracking-wide text-muted">
                Past chats
              </span>
              <button
                type="button"
                onClick={toggleHistory}
                aria-label="Hide chats"
                className="rounded-lg p-1 text-muted transition hover:bg-canvas hover:text-ink"
              >
                <CloseIcon className="h-4 w-4" />
              </button>
            </div>
            <ConversationList
              conversations={conversations}
              activeId={activeId}
              onSelect={openConversation}
              onNew={startNewChat}
              onDelete={removeConversation}
            />

            {conversationPage?.hasMore && (
              <button
                type="button"
                onClick={() => void loadMoreConversations()}
                className="mx-3 mb-3 rounded-lg px-3 py-2 text-left text-xs font-medium text-muted transition hover:bg-canvas hover:text-ink"
              >
                Load older chats ({conversationPage.total - conversations.length} more)
              </button>
            )}
          </aside>
        </>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="border-b border-line bg-canvas/85 px-4 py-3 backdrop-blur sm:px-6">
          <div className="mx-auto flex max-w-3xl items-center gap-3">
            <button
              type="button"
              onClick={toggleHistory}
              aria-label={historyOpen ? 'Hide past chats' : 'Show past chats'}
              aria-pressed={historyOpen}
              title={historyOpen ? 'Hide past chats' : 'Show past chats'}
              className={`rounded-lg p-1.5 transition hover:bg-surface hover:text-ink ${
                historyOpen ? 'bg-brand-50 text-brand-700' : 'text-muted'
              }`}
            >
              <HistoryIcon className="h-[18px] w-[18px]" />
            </button>

            <div className="min-w-0 flex-1">
              <h1 className="truncate text-base font-semibold tracking-tight text-ink">
                {conversations.find((c) => c._id === activeId)?.title ?? 'New chat'}
              </h1>
              <p className="truncate text-xs text-muted">
                {status?.configured
                  ? `${status.label} · ${status.model}`
                  : 'Describe what happened — the right agents take it from there.'}
              </p>
            </div>

            <button
              type="button"
              onClick={startNewChat}
              aria-label="New chat"
              title="New chat"
              className="rounded-lg p-1.5 text-muted transition hover:bg-surface hover:text-ink"
            >
              <PlusIcon className="h-[18px] w-[18px]" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
          <div className="mx-auto max-w-3xl space-y-5">
            {aiOff && (
              <div className="rounded-2xl border border-line bg-surface p-5 text-sm">
                <p className="font-medium text-ink">The assistant needs an AI key</p>
                <p className="mt-1 text-muted">
                  {status?.reason ?? 'No provider is set up yet.'} You can add one in Settings — no
                  redeploy needed. Until then you can still add records by hand.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link to="/settings" className="btn-primary">
                    Set up AI
                  </Link>
                  <Link to="/expenses" className="btn-ghost">
                    Add an expense
                  </Link>
                </div>
              </div>
            )}

            {/* A key exists but the provider is unhappy, or an operator said something. */}
            {!aiOff && chatNotice && <InlineNotice message={chatNotice} />}

            {loadingThread ? (
              <div className="flex justify-center py-10">
                <Spinner />
              </div>
            ) : isEmpty ? (
              <div className="py-8 text-center">
                <span className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                  <SparkIcon className="h-5 w-5" />
                </span>
                <p className="text-sm font-medium text-ink">
                  Say what happened, in your own words
                </p>
                <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
                  One message can hold an expense and a meal at the same time. The right agents pick
                  up their part.
                </p>
                <div className="mx-auto mt-6 grid max-w-lg gap-2 sm:grid-cols-2">
                  {SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      disabled={aiOff}
                      onClick={() => void send(suggestion)}
                      className="rounded-xl border border-line bg-surface px-3.5 py-2.5 text-left text-sm text-muted transition hover:border-brand-200 hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {thread?.hasEarlier && (
                  <div className="flex justify-center pb-2">
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={() => void loadEarlier()}
                      disabled={loadingEarlier}
                    >
                      {loadingEarlier && <Spinner className="h-4 w-4" />}
                      Load earlier messages
                    </button>
                  </div>
                )}

                {runs.map((run) => (
                  <MessageTurn key={run._id} run={run} />
                ))}
              </>
            )}

            {pending && (
              <div className="space-y-3">
                <UserBubble text={pending} />
                <div className="flex items-center gap-2 px-1 text-sm text-muted">
                  <span className="flex gap-1">
                    <span className="h-1.5 w-1.5 animate-breathe rounded-full bg-brand-400" />
                    <span className="h-1.5 w-1.5 animate-breathe rounded-full bg-brand-400 [animation-delay:200ms]" />
                    <span className="h-1.5 w-1.5 animate-breathe rounded-full bg-brand-400 [animation-delay:400ms]" />
                  </span>
                  Agents are working
                </div>
              </div>
            )}

            {error && (
              <p className="rounded-xl border border-expense/25 bg-expense/5 px-4 py-2.5 text-sm text-ink">
                {error}
              </p>
            )}

            <div ref={bottomRef} />
          </div>
        </div>

        <div className="border-t border-line bg-canvas/85 px-4 py-4 backdrop-blur sm:px-6">
          <div className="mx-auto max-w-3xl">
            <Composer
              value={draft}
              onChange={setDraft}
              onSend={() => void send()}
              sending={Boolean(pending)}
              disabled={aiOff}
              placeholder={aiOff ? 'Add an AI key in Settings to start chatting' : 'Tell me what happened…'}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
