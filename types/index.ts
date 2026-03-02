// ── Database types (will expand as schema grows) ──

export type ProjectCategory =
  | "Meme coin"
  | "DeFi"
  | "Gaming / GameFi"
  | "Protocol"
  | "Trading bot"
  | "AI + Crypto"
  | "NFT"
  | "Casino / Gambling"
  | "Infrastructure"
  | "Other";

export type ProjectStage = "Pre-launch" | "Just launched" | "Early growth" | "Established";

export type PartnershipGoal =
  | "Co-marketing campaigns"
  | "Token integration"
  | "Liquidity sharing"
  | "KOL introductions"
  | "Technical integration"
  | "Community cross-pollination";

export interface Project {
  id: string;
  user_id: string;
  name: string;
  category: ProjectCategory;
  narrative: string;
  stage: ProjectStage;
  goals: PartnershipGoal[];
  twitter_handle?: string;
  telegram_handle?: string;
  website?: string;
  created_at: string;
  updated_at: string;
}

export interface DiscoveredProject {
  id: string;
  name: string;
  category: string;
  narrative: string;
  twitter_handle?: string;
  telegram_handle?: string;
  twitter_followers?: number;
  telegram_members?: number;
  last_active?: string;
  source: "twitter" | "telegram" | "both";
  raw_data?: Record<string, unknown>;
  created_at: string;
}

export interface Match {
  id: string;
  project_id: string;
  discovered_project_id: string;
  score: number;
  reasoning: string;
  category_match: boolean;
  stage_compatible: boolean;
  reviewed: boolean;
  created_at: string;
  discovered_project?: DiscoveredProject;
}

export interface Alert {
  id: string;
  user_id: string;
  project_id: string;
  type: "new_project" | "narrative_shift" | "collab_signal" | "scan_complete";
  title: string;
  description: string;
  read: boolean;
  created_at: string;
}
