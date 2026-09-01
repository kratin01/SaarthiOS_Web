/** The list of past chats, with "New chat" on top. */
import { useState } from 'react';
import type { Conversation } from '@/types';
import { formatRelativeDay } from '@/lib/format';
import { PlusIcon, TrashIcon } from '@/components/ui/Icons';

interface Props {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
}

export function ConversationList({ conversations, activeId, onSelect, onNew, onDelete }: Props) {
  const [confirming, setConfirming] = useState<string | null>(null);

  return (
    <div className="flex h-full flex-col">
      <div className="p-3">
        <button type="button" className="btn-ghost w-full justify-start" onClick={onNew}>
          <PlusIcon className="h-4 w-4" />
          New chat
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
        {conversations.length === 0 ? (
          <p className="px-2 py-6 text-center text-xs text-muted">
            Your past chats will appear here.
          </p>
        ) : (
          <ul className="space-y-0.5">
            {conversations.map((c) => (
              <li key={c._id} className="group relative">
                <button
                  type="button"
                  onClick={() => onSelect(c._id)}
                  className={`w-full rounded-xl px-3 py-2 pr-8 text-left transition ${
                    c._id === activeId ? 'bg-brand-50 text-brand-700' : 'text-muted hover:bg-canvas'
                  }`}
                >
                  <span className="block truncate text-sm font-medium">{c.title}</span>
                  <span className="block text-[11px] text-muted">
                    {formatRelativeDay(c.lastMessageAt)}
                  </span>
                </button>

                {confirming === c._id ? (
                  <span className="absolute right-1.5 top-1.5 flex gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        onDelete(c._id);
                        setConfirming(null);
                      }}
                      className="rounded-lg bg-expense px-2 py-1 text-[11px] font-medium text-white"
                    >
                      Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirming(null)}
                      className="rounded-lg px-1.5 py-1 text-[11px] text-muted hover:text-ink"
                    >
                      No
                    </button>
                  </span>
                ) : (
                  <button
                    type="button"
                    aria-label={`Delete chat: ${c.title}`}
                    onClick={() => setConfirming(c._id)}
                    className="absolute right-2 top-2.5 rounded-lg p-1 text-muted opacity-0 transition hover:bg-surface hover:text-expense focus-visible:opacity-100 group-hover:opacity-100"
                  >
                    <TrashIcon className="h-3.5 w-3.5" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
