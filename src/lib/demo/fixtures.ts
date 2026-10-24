import type { PlayerRole } from "@/lib/fantasy/types";

/** Every name, team and outcome in this module is fictional for UI/mechanics demonstration. */
export const demoManagers = [
  { id: "m1", name: "Night Owls", initials: "NO" },
  { id: "m2", name: "Boundary Club", initials: "BC" },
  { id: "m3", name: "Wicket Wizards", initials: "WW" },
  { id: "m4", name: "Powerplay", initials: "PP" },
  { id: "m5", name: "Pace Attack", initials: "PA" },
  { id: "m6", name: "Spin Kings", initials: "SK" },
] as const;

export type DemoPlayer = { id: string; name: string; role: PlayerRole; team: string };
export const demoPlayers: DemoPlayer[] = [
  { id: "p01", name: "Dev Shah", role: "BAT", team: "Westport" },
  { id: "p02", name: "Liam Carter", role: "BOWL", team: "Bayshore" },
  { id: "p03", name: "Ayaan Qureshi", role: "ALL", team: "Metro" },
  { id: "p04", name: "Nico Silva", role: "WK", team: "Valley" },
  { id: "p05", name: "Arjun Mehta", role: "BAT", team: "Metro" },
  { id: "p06", name: "Ishaan Patel", role: "BOWL", team: "Harbor" },
  { id: "p07", name: "Michael Tan", role: "ALL", team: "Westport" },
  { id: "p08", name: "Kabir Rao", role: "WK", team: "Harbor" },
  { id: "p09", name: "Jay Singh", role: "BAT", team: "Valley" },
  { id: "p10", name: "Omar Khan", role: "BOWL", team: "Metro" },
  { id: "p11", name: "Ethan Park", role: "ALL", team: "Bayshore" },
  { id: "p12", name: "Rohan Kapoor", role: "BAT", team: "Harbor" },
  { id: "p13", name: "Alex Reed", role: "BOWL", team: "Valley" },
  { id: "p14", name: "Zain Ali", role: "ALL", team: "Harbor" },
  { id: "p15", name: "Aarav Joshi", role: "BAT", team: "Bayshore" },
  { id: "p16", name: "Finn Baker", role: "BOWL", team: "Westport" },
  { id: "p17", name: "Sameer Das", role: "WK", team: "Metro" },
  { id: "p18", name: "Theo Roy", role: "ALL", team: "Valley" },
];
