// Mirrors the communities / community_domains tables (migrations/0007).
// Used for labels and for the local demo's school-email check; with a
// backend connected, the database decides what a valid school email is.

export const COLUMBIA_BARNARD = 'columbia-barnard'

export const COMMUNITIES: Record<string, { name: string }> = {
  [COLUMBIA_BARNARD]: { name: 'Columbia & Barnard' },
}

export const COMMUNITY_DOMAINS: { domain: string; communityId: string; schoolName: string }[] = [
  { domain: 'columbia.edu', communityId: COLUMBIA_BARNARD, schoolName: 'Columbia University' },
  { domain: 'barnard.edu', communityId: COLUMBIA_BARNARD, schoolName: 'Barnard College' },
]

// Subdomains count (cumc.columbia.edu -> Columbia), same as the SQL check.
export function matchSchoolDomain(email: string) {
  const domain = email.trim().toLowerCase().split('@')[1] ?? ''
  return COMMUNITY_DOMAINS.find((d) => domain === d.domain || domain.endsWith(`.${d.domain}`)) ?? null
}

export function communityName(communityId: string | null): string | null {
  return communityId ? (COMMUNITIES[communityId]?.name ?? null) : null
}
