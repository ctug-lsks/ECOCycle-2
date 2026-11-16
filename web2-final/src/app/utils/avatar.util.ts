export function getInitials(name: string): string {
  if (!name || !name.trim()) return 'U';
  const clean = name.trim().replace(/[^\p{L}\s\d]/gu, '').trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const PALETTES: [string, string][] = [
  ['#059669', '#047857'], // Emerald
  ['#2563eb', '#1d4ed8'], // Blue
  ['#7c3aed', '#6d28d9'], // Violet
  ['#db2777', '#be185d'], // Pink
  ['#d97706', '#b45309'], // Amber
  ['#0891b2', '#0e7490'], // Cyan
  ['#4f46e5', '#4338ca'], // Indigo
  ['#0d9488', '#0f766e'], // Teal
];

export function getAvatarUrl(
  avatar?: string | null,
  name = '',
  seed = '',
  role = ''
): string {
  if (
    avatar &&
    avatar.trim() &&
    !avatar.includes('photo-1535713875002-d1d0cf377fde')
  ) {
    return avatar.trim();
  }

  const initials = getInitials(name);
  let c1 = '#059669';
  let c2 = '#047857';

  if (role === 'ADMIN' || String(seed).startsWith('AD')) {
    c1 = '#065f46';
    c2 = '#022c22';
  } else {
    let hash = 0;
    const s = String(seed || name || 'default');
    for (let i = 0; i < s.length; i++) {
      hash = s.charCodeAt(i) + ((hash << 5) - hash);
    }
    const pair = PALETTES[Math.abs(hash) % PALETTES.length];
    c1 = pair[0];
    c2 = pair[1];
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${c1}"/>
        <stop offset="100%" stop-color="${c2}"/>
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="50" fill="url(#g)"/>
    <text x="50" y="50" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="38" font-weight="700" fill="#ffffff" text-anchor="middle" dominant-baseline="central">${initials}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
