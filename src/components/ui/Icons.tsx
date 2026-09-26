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

export const DownloadIcon = (p: Props) => (
  <Svg {...p}>
    <path d="M12 4v12" />
    <path d="M8 12l4 4 4-4" />
    <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
  </Svg>
);

export const ChevronDownIcon = (p: Props) => (
  <Svg {...p}>
    <path d="M6 9l6 6 6-6" />
  </Svg>
);

export const ChevronLeftIcon = (p: Props) => (
  <Svg {...p}>
    <path d="M15 6l-6 6 6 6" />
  </Svg>
);

export const ChevronRightIcon = (p: Props) => (
  <Svg {...p}>
    <path d="M9 6l6 6-6 6" />
  </Svg>
);

export const CalendarIcon = (p: Props) => (
  <Svg {...p}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 10h18M8 3v4M16 3v4" />
  </Svg>
);

export const RepeatIcon = (p: Props) => (
  <Svg {...p}>
    <path d="M17 2l4 4-4 4" />
    <path d="M3 12V10a4 4 0 0 1 4-4h14" />
    <path d="M7 22l-4-4 4-4" />
    <path d="M21 12v2a4 4 0 0 1-4 4H3" />
  </Svg>
);

export const MicIcon = (p: Props) => (
  <Svg {...p}>
    <rect x="9" y="2" width="6" height="12" rx="3" />
    <path d="M5 11a7 7 0 0 0 14 0" />
    <path d="M12 18v3" />
  </Svg>
);

export const StopIcon = (p: Props) => (
  <Svg {...p}>
    <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" stroke="none" />
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

export const EyeIcon = (p: Props) => (
  <Svg {...p}>
    <path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12Z" />
    <circle cx="12" cy="12" r="2.8" />
  </Svg>
);

export const EyeOffIcon = (p: Props) => (
  <Svg {...p}>
    <path d="M10.6 6.1A9.7 9.7 0 0 1 12 6c6.5 0 10 6 10 6a17 17 0 0 1-3 3.6M6.6 6.8A16.6 16.6 0 0 0 2 12s3.5 6 10 6a9.9 9.9 0 0 0 4.2-.9" />
    <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    <path d="m3 3 18 18" />
  </Svg>
);

/* Icons only custom agents use. Kept clear of the ones in the sidebar, or a
   custom agent ends up looking exactly like Expenses or Health. */

export const DumbbellIcon = (p: Props) => (
  <Svg {...p}>
    <path d="M6.5 6.5v11M3.5 9v6M17.5 6.5v11M20.5 9v6M6.5 12h11" />
  </Svg>
);

export const BookIcon = (p: Props) => (
  <Svg {...p}>
    <path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H19v15H5.5A1.5 1.5 0 0 0 4 19.5Z" />
    <path d="M4 19.5A1.5 1.5 0 0 1 5.5 21H19v-3" />
  </Svg>
);

export const DropletIcon = (p: Props) => (
  <Svg {...p}>
    <path d="M12 3s6 6.2 6 10a6 6 0 0 1-12 0c0-3.8 6-10 6-10Z" />
  </Svg>
);

export const HeartIcon = (p: Props) => (
  <Svg {...p}>
    <path d="M12 20s-7-4.4-7-9.3A4.2 4.2 0 0 1 12 8a4.2 4.2 0 0 1 7 2.7c0 4.9-7 9.3-7 9.3Z" />
  </Svg>
);

export const TargetIcon = (p: Props) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <circle cx="12" cy="12" r="4.5" />
    <circle cx="12" cy="12" r="1" />
  </Svg>
);

export const MusicIcon = (p: Props) => (
  <Svg {...p}>
    <path d="M9 18V6l11-2v12" />
    <circle cx="6.5" cy="18" r="2.5" />
    <circle cx="17.5" cy="16" r="2.5" />
  </Svg>
);

export const BrushIcon = (p: Props) => (
  <Svg {...p}>
    <path d="M4 20c0-2.5 1.5-3.5 3-3.5S9.5 18 9.5 20c-1.5 1-4 1-5.5 0Z" />
    <path d="M8 15.5 18.5 5a2.1 2.1 0 0 1 3 3L11 18.5" />
  </Svg>
);

export const PawIcon = (p: Props) => (
  <Svg {...p}>
    <circle cx="7" cy="8.5" r="1.8" />
    <circle cx="12" cy="6.5" r="1.8" />
    <circle cx="17" cy="8.5" r="1.8" />
    <path d="M12 11c3 0 5 2.2 5 4.5S15 20 12 20s-5-2.2-5-4.5S9 11 12 11Z" />
  </Svg>
);

/**
 * The icons a custom agent can pick from. The keys match CUSTOM_AGENT_ICONS on
 * the server, so anything saved there can always be drawn here.
 */
export const AGENT_ICONS = {
  spark: SparkIcon,
  dumbbell: DumbbellIcon,
  book: BookIcon,
  droplet: DropletIcon,
  heart: HeartIcon,
  target: TargetIcon,
  music: MusicIcon,
  brush: BrushIcon,
  paw: PawIcon,
  moon: MoonIcon
} as const;

/**
 * Agents saved before the set above existed still carry a sidebar icon name,
 * so those keep resolving even though the picker no longer offers them.
 */
const LEGACY_AGENT_ICONS: Record<string, (p: Props) => JSX.Element> = {
  leaf: LeafIcon,
  trend: TrendIcon,
  wallet: WalletIcon,
  home: HomeIcon,
  chat: ChatIcon
};

export const agentIcon = (name: string) =>
  AGENT_ICONS[name as keyof typeof AGENT_ICONS] ?? LEGACY_AGENT_ICONS[name] ?? SparkIcon;
