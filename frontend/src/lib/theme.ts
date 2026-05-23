import { AccentTheme } from './types';
import { getProfile } from './store';

const ACCENTS: AccentTheme[] = ['indigo', 'emerald', 'slate', 'amber'];

export const ACCENT_OPTIONS: { value: AccentTheme; label: string; swatch: string }[] = [
  { value: 'indigo', label: 'Indigo', swatch: 'hsl(234 89% 64%)' },
  { value: 'emerald', label: 'Emerald', swatch: 'hsl(158 64% 42%)' },
  { value: 'slate', label: 'Slate', swatch: 'hsl(215 25% 35%)' },
  { value: 'amber', label: 'Amber', swatch: 'hsl(35 92% 50%)' },
];

export function applyAccent(accent: AccentTheme | undefined) {
  const root = document.documentElement;
  if (!accent || accent === 'indigo') {
    root.removeAttribute('data-accent');
  } else if (ACCENTS.includes(accent)) {
    root.setAttribute('data-accent', accent);
  }
}

export function applyThemeFromProfile() {
  const p = getProfile();
  if (!p) return;
  document.documentElement.classList.toggle('dark', p.theme === 'dark');
  applyAccent(p.preferences?.accentTheme);
}
