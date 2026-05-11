// Deterministic avatar colors based on name hash
const AVATAR_COLORS = [
  { bg: "hsl(221, 83%, 53%)", fg: "hsl(0, 0%, 100%)" },     // blue
  { bg: "hsl(262, 52%, 47%)", fg: "hsl(0, 0%, 100%)" },     // purple
  { bg: "hsl(346, 77%, 50%)", fg: "hsl(0, 0%, 100%)" },     // rose
  { bg: "hsl(199, 89%, 48%)", fg: "hsl(0, 0%, 100%)" },     // sky
  { bg: "hsl(142, 71%, 35%)", fg: "hsl(0, 0%, 100%)" },     // green
  { bg: "hsl(25, 95%, 53%)", fg: "hsl(0, 0%, 100%)" },      // orange
  { bg: "hsl(271, 91%, 65%)", fg: "hsl(0, 0%, 100%)" },     // violet
  { bg: "hsl(0, 0%, 15%)", fg: "hsl(0, 0%, 100%)" },        // charcoal
];

function hashName(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function getAvatarColor(name: string) {
  return AVATAR_COLORS[hashName(name) % AVATAR_COLORS.length];
}
