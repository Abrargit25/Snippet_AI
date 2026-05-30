const TO_FULL: Record<string, string> = {
  JS: 'JavaScript', TS: 'TypeScript', SQL: 'SQL',
};
const TO_BADGE: Record<string, string> = {
  JavaScript: 'JS', TypeScript: 'TS', SQL: 'SQL', Python: 'PY', Dart: 'DA', Go: 'GO',
  Java: 'JA', 'C#': 'C#', PHP: 'PHP', Ruby: 'RB', Other: '??',
};

export function normalizeLang(lang?: string): string {
  if (!lang) return '';
  const key = lang.trim();
  return TO_FULL[key.toUpperCase()] ?? key;
}

export function langToBadge(lang: string): string {
  return TO_BADGE[lang] ?? lang.slice(0, 3).toUpperCase();
}
