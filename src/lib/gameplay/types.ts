import type {
  MatchPointBreakdown,
  PlayerMatchStats,
  PlayerRole,
} from "@/lib/fantasy/types";

export type LineupSelection = { slotId: string; playerId: string };
export type GameTeam = {
  id: string;
  managerId: string;
  managerName: string;
  name: string;
  draftPosition: number | null;
  seed: number | null;
  rank: number;
  wins: number;
  losses: number;
  draws: number;
  pointsFor: number;
  pointsAgainst: number;
  rosterCount: number;
};
export type GamePlayer = {
  id: string;
  name: string;
  role: PlayerRole;
  roleSource: string;
  franchiseId: string;
  franchiseName: string;
  franchiseCode: string;
  appearances: number;
  runs: number;
  wickets: number;
  fantasyPoints: number;
  averagePoints: number;
  ownerTeamId: string | null;
};
export type GamePick = {
  id: string;
  pickNumber: number;
  round: number;
  teamId: string;
  playerId: string;
  automatic: boolean;
  selectedAt: string;
};
export type GameRound = {
  id: string;
  number: number;
  name: string;
  stage: "regular" | "semifinal" | "final";
  status: "scheduled" | "open" | "completed";
  startsOn: string;
  endsOn: string;
  lockedAt: string | null;
  completedAt: string | null;
  matchIds: string[];
};
export type GameContribution = {
  teamId: string;
  playerId: string;
  slotId: string;
  score: number;
  appearances: number;
};
export type GameMatchup = {
  id: string;
  roundId: string;
  homeTeamId: string;
  awayTeamId: string | null;
  homeScore: number | null;
  awayScore: number | null;
  status: "scheduled" | "final";
  result: "home" | "away" | "draw" | null;
  homeSeed: number | null;
  awaySeed: number | null;
  contributions: GameContribution[];
};
export type GameLineup = {
  teamId: string;
  roundId: string;
  submittedAt: string | null;
  slots: LineupSelection[];
};
export type GameMatch = {
  id: string;
  roundId: string;
  sourceId: string;
  date: string;
  teamAName: string;
  teamBName: string;
  venue: string;
  status: "final";
  sourceUrl: string;
};
export type LeagueGameSnapshot = {
  serverNow: string;
  league: {
    id: string;
    name: string;
    status: "lobby" | "drafting" | "active" | "completed";
    seasonId: string;
    seasonName: string;
    seasonYear: number;
    mode: "historical";
    settingsVersion: number;
    scoringVersion: string;
    squadSize: number;
    starterCount: number;
    benchCount: number;
    capacity: number;
    championTeamId: string | null;
  };
  me: { userId: string; teamId: string; isCommissioner: boolean };
  teams: GameTeam[];
  players: GamePlayer[];
  draft: {
    id: string;
    status: "drafting" | "completed";
    rounds: number;
    pickNumber: number;
    totalPicks: number;
    secondsPerPick: number;
    deadlineAt: string | null;
    currentTeamId: string | null;
    revision: number;
  } | null;
  picks: GamePick[];
  rounds: GameRound[];
  currentRoundId: string | null;
  lineups: GameLineup[];
  matchups: GameMatchup[];
  matches: GameMatch[];
  attribution: {
    provider: string;
    url: string;
    licenseUrl: string;
    checksum: string;
    rolePolicy: string;
    warnings: string[];
  } | null;
};
export type PlayerHistory = {
  playerId: string;
  scoringVersion: string;
  appearances: {
    matchId: string;
    date: string;
    opponent: string;
    franchiseName: string;
    stats: PlayerMatchStats;
    points: number;
    breakdown: MatchPointBreakdown;
    sourceUrl: string;
  }[];
};
