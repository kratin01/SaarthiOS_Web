/** One turn in the conversation: your message, then the reply. */
import type { AgentRun } from '@/types';
import { formatTime } from '@/lib/format';
import { AgentActivity } from './AgentActivity';

export function MessageTurn({ run }: { run: AgentRun }) {
  const failed = run.status === 'failed';
  const asking = run.intent === 'clarify';

  return (
    <div className="space-y-3 animate-fade-up">
      <UserBubble text={run.message} />

      <div className="flex justify-start">
        <div className="max-w-[90%] space-y-2 sm:max-w-[75%]">
          <div
            className={`rounded-2xl rounded-bl-md border px-4 py-2.5 text-sm ${
              failed
                ? 'border-expense/25 bg-expense/5 text-ink'
                : asking
                  ? 'border-brand-200 bg-brand-50 text-ink'
                  : 'border-line bg-surface text-ink'
            }`}
          >
            {run.reply || 'No reply.'}
          </div>

          {run.steps.length > 1 && <AgentActivity run={run} />}

          <p className="px-1 text-[11px] text-muted">{formatTime(run.createdAt)}</p>
        </div>
      </div>
    </div>
  );
}

/** Shown on its own while the agents are still working. */
export function UserBubble({ text }: { text: string }) {
  return (
    <div className="flex justify-end animate-fade-up">
      <div className="brand-solid max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md px-4 py-2.5 text-sm sm:max-w-[70%]">
        {text}
      </div>
    </div>
  );
}
