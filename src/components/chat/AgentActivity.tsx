/**
 * The collapsible trace under a reply: which agents ran and what they did.
 * This is what makes the multi-agent behaviour visible instead of magic.
 */
import { useState } from 'react';
import type { AgentRun } from '@/types';
import { CheckIcon, CloseIcon } from '@/components/ui/Icons';

const AGENT_COLOR: Record<string, string> = {
  orchestrator: '#4E7C6B',
  expense: '#C08457',
  health: '#6F9E7E',
  investment: '#6B87A8',
  analyst: '#6B87A8'
};

export function AgentActivity({ run }: { run: AgentRun }) {
  const [open, setOpen] = useState(false);
  const agentCount = run.steps.filter((s) => s.agent !== 'orchestrator').length;

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-3 px-3.5 py-2 text-left text-xs text-muted transition hover:bg-canvas"
      >
        <span className="flex items-center gap-2">
          <span className="flex -space-x-1">
            {run.steps.slice(0, 4).map((step, index) => (
              <span
                key={index}
                className="h-2 w-2 rounded-full ring-2 ring-surface"
                style={{ backgroundColor: AGENT_COLOR[step.agent] ?? '#B9C0BA' }}
              />
            ))}
          </span>
          {agentCount > 0 ? `${agentCount} agent${agentCount === 1 ? '' : 's'} ran` : 'Activity'}
          <span className="text-muted/60">· {(run.durationMs / 1000).toFixed(1)}s</span>
        </span>
        <span className="text-muted/70">{open ? 'Hide' : 'Show'}</span>
      </button>

      {open && (
        <ol className="border-t border-line px-3.5 py-3">
          {run.steps.map((step, index) => (
            <li key={index} className="relative flex gap-3 pb-3 last:pb-0">
              {index < run.steps.length - 1 && (
                <span className="absolute left-[7px] top-5 h-full w-px bg-line" />
              )}
              <span
                className="relative z-10 mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
                style={{
                  backgroundColor:
                    step.status === 'failed' ? '#C0575714' : `${AGENT_COLOR[step.agent] ?? '#B9C0BA'}1F`,
                  color: step.status === 'failed' ? '#C05757' : AGENT_COLOR[step.agent] ?? '#78827C'
                }}
              >
                {step.status === 'failed' ? (
                  <CloseIcon className="h-2.5 w-2.5" />
                ) : (
                  <CheckIcon className="h-2.5 w-2.5" />
                )}
              </span>
              <div className="min-w-0">
                <p className="text-xs font-medium text-ink">{step.label}</p>
                {step.detail && <p className="mt-0.5 text-xs text-muted">{step.detail}</p>}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
