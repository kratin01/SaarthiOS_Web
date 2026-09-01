/**
 * Every icon used in the app, as small inline SVGs.
 * Inline keeps the bundle tiny and avoids an icon-library dependency.
 * All of them inherit `currentColor` and accept normal className sizing.
 */
type Props = { className?: string };

const base = 'h-5 w-5';

const Svg = ({ className, children }: Props & { children: React.ReactNode }) => (
  <svg
    className={className ?? base}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.6}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

export const HomeIcon = (p: Props) => (
  <Svg {...p}>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9.8V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.8" />
  </Svg>
);

export const ChatIcon = (p: Props) => (
  <Svg {...p}>
    <path d="M21 12a8 8 0 0 1-8 8H5l-2 2v-9a8 8 0 0 1 8-8h2a8 8 0 0 1 8 7Z" />
    <path d="M9 11h6M9 15h4" />
  </Svg>
);

export const WalletIcon = (p: Props) => (
  <Svg {...p}>
    <path d="M3 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2" />
    <path d="M3 8v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3" />
    <path d="M21 11h-4a2 2 0 0 0 0 4h4v-4Z" />
  </Svg>
);

export const LeafIcon = (p: Props) => (
  <Svg {...p}>
    <path d="M4 20c0-8 5-14 16-14 0 9-5 14-11 14a5 5 0 0 1-5-5Z" />
    <path d="M9 15c1.5-3 4-5.5 7-7" />
  </Svg>
);

export const TrendIcon = (p: Props) => (
  <Svg {...p}>
    <path d="M3 17l5.5-5.5 3.5 3.5L21 6" />
    <path d="M15 6h6v6" />
  </Svg>
);

export const SettingsIcon = (p: Props) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1Z" />
  </Svg>
);

export const SendIcon = (p: Props) => (
  <Svg {...p}>
    <path d="M4 12 20 4l-8 16-2-6-6-2Z" />
  </Svg>
);

export const PlusIcon = (p: Props) => (
  <Svg {...p}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);

export const UploadIcon = (p: Props) => (
  <Svg {...p}>
    <path d="M12 16V4" />
    <path d="M8 8l4-4 4 4" />
    <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
  </Svg>
);

export const TrashIcon = (p: Props) => (
  <Svg {...p}>
    <path d="M4 7h16M10 11v6M14 11v6" />
    <path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </Svg>
);

export const PencilIcon = (p: Props) => (
  <Svg {...p}>
    <path d="M4 20h4l10.5-10.5a2.12 2.12 0 0 0-3-3L5 17v3Z" />
    <path d="M13.5 6.5l4 4" />
  </Svg>
);

export const CheckIcon = (p: Props) => (
  <Svg {...p}>
    <path d="M4 12.5 9 17.5 20 6.5" />
  </Svg>
);

export const CloseIcon = (p: Props) => (
  <Svg {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Svg>
);

export const MenuIcon = (p: Props) => (
  <Svg {...p}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </Svg>
);

export const HistoryIcon = (p: Props) => (
  <Svg {...p}>
    <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
    <path d="M3 4v4h4" />
    <path d="M12 8v4l3 2" />
  </Svg>
);

export const SparkIcon = (p: Props) => (
  <Svg {...p}>
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" />
  </Svg>
);

export const LogoutIcon = (p: Props) => (
  <Svg {...p}>
    <path d="M15 17l5-5-5-5" />
    <path d="M20 12H9M12 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h6" />
  </Svg>
);

export const SunIcon = (p: Props) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4" />
  </Svg>
);

export const MoonIcon = (p: Props) => (
  <Svg {...p}>
    <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" />
  </Svg>
);

/**
 * The icons a custom agent can pick from. The keys match CUSTOM_AGENT_ICONS on
 * the server, so anything saved there can always be drawn here.
 */
export const AGENT_ICONS = {
  spark: SparkIcon,
  leaf: LeafIcon,
  trend: TrendIcon,
  wallet: WalletIcon,
  home: HomeIcon,
  chat: ChatIcon
} as const;

export const agentIcon = (name: string) =>
  AGENT_ICONS[name as keyof typeof AGENT_ICONS] ?? SparkIcon;
