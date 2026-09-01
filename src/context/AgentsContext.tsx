/**
 * The user's own agents, loaded once and shared.
 *
 * Both the sidebar and the Settings card need this list, and creating an agent
 * in Settings has to make it appear in the sidebar straight away — which is
 * only simple if there is a single copy of the list.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { agentApi } from '@/api';
import type { CustomAgent } from '@/types';

interface AgentsValue {
  agents: CustomAgent[];
  max: number;
  loading: boolean;
  refresh: () => Promise<void>;
}

const AgentsContext = createContext<AgentsValue | null>(null);

export function AgentsProvider({ children }: { children: ReactNode }) {
  const [agents, setAgents] = useState<CustomAgent[]>([]);
  const [max, setMax] = useState(0);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await agentApi.list();
      setAgents(data.agents);
      setMax(data.max);
    } catch {
      // A failed load must not blank the sidebar; keep whatever we had.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo(() => ({ agents, max, loading, refresh }), [agents, max, loading, refresh]);

  return <AgentsContext.Provider value={value}>{children}</AgentsContext.Provider>;
}

export function useAgents() {
  const value = useContext(AgentsContext);
  if (!value) throw new Error('useAgents must be used inside AgentsProvider');
  return value;
}
