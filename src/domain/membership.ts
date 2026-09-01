export const ACCESS_ROLES = ["brother", "officer", "admin"] as const;
export type AccessRole = (typeof ACCESS_ROLES)[number];

export const MEMBERSHIP_STATUSES = [
  "on_yard",
  "alumni",
  "chapter_invisible",
] as const;
export type MembershipStatus = (typeof MEMBERSHIP_STATUSES)[number];

export const LEADERSHIP_POSITIONS = [
  "polemarch",
  "vice_polemarch",
  "keeper_of_records",
  "keeper_of_exchequer",
  "strategus",
] as const;
export type LeadershipPosition = (typeof LEADERSHIP_POSITIONS)[number];

export function canBrotherChooseMembershipStatus(
  status: MembershipStatus,
): boolean {
  return status === "on_yard" || status === "alumni";
}

export function hasMemberManagementAccess(role: AccessRole): boolean {
  return role === "officer" || role === "admin";
}
