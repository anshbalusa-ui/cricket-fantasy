export const LEAGUE_NAME_MAX_LENGTH = 60;
export const TEAM_NAME_MAX_LENGTH = 40;

export type ValidationResult = { value: string } | { error: string };

function validateName(value: unknown, label: string, maxLength: number): ValidationResult {
  if (typeof value !== "string") return { error: `${label} is required.` };
  if (/[<>\u0000-\u001f\u007f]/.test(value)) return { error: `${label} contains unsupported characters.` };
  const normalized = value.trim().replace(/\s+/g, " ");
  if (!normalized) return { error: `${label} is required.` };
  if (normalized.length > maxLength) return { error: `${label} must be ${maxLength} characters or fewer.` };
  return { value: normalized };
}

export function validateLeagueName(value: unknown): ValidationResult {
  return validateName(value, "League name", LEAGUE_NAME_MAX_LENGTH);
}

export function validateTeamName(value: unknown): ValidationResult {
  return validateName(value, "Team name", TEAM_NAME_MAX_LENGTH);
}

export function validateInvitationToken(value: unknown): ValidationResult {
  if (typeof value !== "string" || !/^[a-f0-9]{64}$/.test(value)) {
    return { error: "Enter a valid invitation link." };
  }
  return { value };
}
