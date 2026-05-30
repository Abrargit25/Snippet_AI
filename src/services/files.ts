/**
 * files.ts — Local file-system service for DevSnippets AI
 * Uses the LEGACY expo-file-system API:
 *   FileSystem.writeAsStringAsync / readDirectoryAsync / deleteAsync /
 *   moveAsync / copyAsync / downloadAsync / getInfoAsync
 */
import * as FileSystem from 'expo-file-system/legacy';

// ── Root paths ────────────────────────────────────────────────────────────────

const APP_DIR  = FileSystem.documentDirectory + 'DevSnippets/';
const EXPORTS  = APP_DIR + 'exports/';
const SCREENSHOTS = APP_DIR + 'screenshots/';

export type FolderKey = 'exports' | 'screenshots';

export const FOLDERS: Record<FolderKey, string> = {
  exports:     EXPORTS,
  screenshots: SCREENSHOTS,
};

// ── Bootstrap ─────────────────────────────────────────────────────────────────

export async function ensureAppDirs(): Promise<void> {
  for (const dir of [APP_DIR, EXPORTS, SCREENSHOTS]) {
    const info = await FileSystem.getInfoAsync(dir);
    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    }
  }
}

// ── Starter files (seeded once) ───────────────────────────────────────────────

async function seedStarters(): Promise<void> {
  const starters: [string, string][] = [
    ['QuickSortDemo.js',
`// QuickSort — O(n log n) average
function quickSort(arr) {
  if (arr.length <= 1) return arr;
  const pivot = arr[arr.length - 1];
  const left  = arr.slice(0, -1).filter(x => x <= pivot);
  const right = arr.slice(0, -1).filter(x => x >  pivot);
  return [...quickSort(left), pivot, ...quickSort(right)];
}
console.log(quickSort([3, 6, 8, 10, 1, 2, 1]));
// → [1, 1, 2, 3, 6, 8, 10]`],

    ['MySQLSchema.sql',
`-- DevSnippets schema
CREATE TABLE IF NOT EXISTS snippets (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  title        VARCHAR(255) NOT NULL,
  code_content TEXT,
  language     VARCHAR(64),
  tags         VARCHAR(512),
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE FULLTEXT INDEX idx_search ON snippets(title, code_content);`],

    ['ReactNativeButton.tsx',
`import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';

interface Props {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}
export default function PrimaryButton({ label, onPress, loading, disabled }: Props) {
  return (
    <TouchableOpacity onPress={onPress} disabled={disabled || loading}
      style={{ backgroundColor: '#7C3AED', padding: 14, borderRadius: 12, alignItems: 'center' }}>
      {loading ? <ActivityIndicator color="#FFF" /> : <Text style={{ color: '#FFF', fontWeight: '700' }}>{label}</Text>}
    </TouchableOpacity>
  );
}`],
  ];

  for (const [name, content] of starters) {
    const path = EXPORTS + name;
    const info = await FileSystem.getInfoAsync(path);
    if (!info.exists) {
      await FileSystem.writeAsStringAsync(path, content, { encoding: FileSystem.EncodingType.UTF8 });
    }
  }

  // Also seed all templates from the template catalog out-of-the-box
  for (const t of TEMPLATE_CATALOG) {
    const path = EXPORTS + t.filename;
    const info = await FileSystem.getInfoAsync(path);
    if (!info.exists) {
      await FileSystem.writeAsStringAsync(path, t.content, { encoding: FileSystem.EncodingType.UTF8 });
    }
  }
}

// ── File entry type ───────────────────────────────────────────────────────────

export type FileEntry = {
  name:        string;
  uri:         string;
  folder:      FolderKey;
  isDirectory: boolean;
  size?:       number;
  modTime?:    number;
};

// ── Read directory ────────────────────────────────────────────────────────────

export async function listFolder(folder: FolderKey): Promise<FileEntry[]> {
  const dir = FOLDERS[folder];
  const info = await FileSystem.getInfoAsync(dir);
  if (!info.exists) return [];

  const names = await FileSystem.readDirectoryAsync(dir);
  const entries: FileEntry[] = [];

  for (const name of names) {
    const uri  = dir + name;
    const meta = await FileSystem.getInfoAsync(uri, { size: true });
    entries.push({
      name,
      uri,
      folder,
      isDirectory: meta.isDirectory ?? false,
      size:    (meta as any).size,
      modTime: (meta as any).modificationTime,
    });
  }

  // Folders first, then alpha
  entries.sort((a, b) => {
    if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return entries;
}

// ── Folder stats ──────────────────────────────────────────────────────────────

export type FolderStats = { count: number; bytes: number };

export async function getFolderStats(folder: FolderKey): Promise<FolderStats> {
  const entries = await listFolder(folder);
  const files   = entries.filter((e) => !e.isDirectory);
  return {
    count: files.length,
    bytes: files.reduce((sum, e) => sum + (e.size ?? 0), 0),
  };
}

// ── Write text file ───────────────────────────────────────────────────────────

export async function saveTextFile(folder: FolderKey, name: string, content: string): Promise<string> {
  await ensureAppDirs();
  const uri = FOLDERS[folder] + name;
  await FileSystem.writeAsStringAsync(uri, content, { encoding: FileSystem.EncodingType.UTF8 });
  return uri;
}

// ── Read text file ────────────────────────────────────────────────────────────

export async function readTextFile(uri: string): Promise<string> {
  return FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.UTF8 });
}

// ── Delete ────────────────────────────────────────────────────────────────────

export async function deleteEntry(uri: string): Promise<void> {
  await FileSystem.deleteAsync(uri, { idempotent: true });
}

// ── Copy ──────────────────────────────────────────────────────────────────────

export async function copyEntry(fromUri: string, toFolder: FolderKey, fileName: string): Promise<void> {
  const toUri = FOLDERS[toFolder] + fileName;
  await FileSystem.copyAsync({ from: fromUri, to: toUri });
}

// ── Move ──────────────────────────────────────────────────────────────────────

export async function moveEntry(fromUri: string, toFolder: FolderKey, fileName: string): Promise<void> {
  const toUri = FOLDERS[toFolder] + fileName;
  await FileSystem.moveAsync({ from: fromUri, to: toUri });
}

// ── Save snippet code ─────────────────────────────────────────────────────────

function langToExt(lang: string): string {
  const l = lang.toLowerCase();
  if (l.includes('typescript')) return '.ts';
  if (l.includes('javascript')) return '.js';
  if (l.includes('python'))     return '.py';
  if (l.includes('sql'))        return '.sql';
  if (l.includes('dart'))       return '.dart';
  if (l.includes('go'))         return '.go';
  if (l.includes('java'))       return '.java';
  if (l.includes('c#'))         return '.cs';
  if (l.includes('php'))        return '.php';
  if (l.includes('ruby'))       return '.rb';
  return '.txt';
}

export async function saveCodeToFiles(title: string, language: string, code: string): Promise<string> {
  const ext      = langToExt(language);
  const safeName = title.replace(/[^a-zA-Z0-9_\-. ]/g, '_').trim() || 'snippet';
  return saveTextFile('exports', safeName + ext, code);
}

// ── Save screenshot to screenshots folder ─────────────────────────────────────

export async function saveScreenshot(fromUri: string, snippetTitle: string): Promise<string> {
  await ensureAppDirs();
  const ext      = fromUri.endsWith('.png') ? '.png' : '.jpg';
  const safeName = snippetTitle.replace(/[^a-zA-Z0-9_\-]/g, '_').toLowerCase();
  const toUri    = SCREENSHOTS + safeName + '_' + Date.now() + ext;
  await FileSystem.copyAsync({ from: fromUri, to: toUri });
  return toUri;
}

// ── Download template from URL ────────────────────────────────────────────────

export async function downloadFileFromUrl(
  url: string,
  fileName: string,
  folder: FolderKey = 'exports',
): Promise<string> {
  await ensureAppDirs();
  const toUri = FOLDERS[folder] + fileName;
  const result = await FileSystem.downloadAsync(url, toUri);
  if (result.status !== 200) throw new Error(`Download failed: HTTP ${result.status}`);
  return result.uri;
}

// ── Template catalog ──────────────────────────────────────────────────────────

export type Template = {
  id:          string;
  name:        string;
  filename:    string;
  language:    string;
  description: string;
  content:     string;
};

export const TEMPLATE_CATALOG: Template[] = [
  {
    id: 'rn-hook',
    name: 'useDebounce Hook',
    filename: 'useDebounce.ts',
    language: 'TypeScript',
    description: 'Debounce any rapidly-changing value with a clean React hook.',
    content: `import { useEffect, useState } from 'react';

export function useDebounce<T>(value: T, delayMs = 400): T {
  const [debounced, setDebounced] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}`,
  },
  {
    id: 'fetch-wrapper',
    name: 'Typed Fetch Wrapper',
    filename: 'apiFetch.ts',
    language: 'TypeScript',
    description: 'Generic fetch with timeout, error handling, and abort support.',
    content: `export async function apiFetch<T>(
  url: string,
  options?: RequestInit,
  timeoutMs = 8000,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    if (!res.ok) throw new Error(\`HTTP \${res.status}: \${res.statusText}\`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}`,
  },
  {
    id: 'sql-users',
    name: 'Users Table (SQL)',
    filename: 'users_schema.sql',
    language: 'SQL',
    description: 'Standard user table with roles, soft-delete, and timestamps.',
    content: `CREATE TABLE IF NOT EXISTS users (
  id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(255) NOT NULL,
  email      VARCHAR(255) UNIQUE NOT NULL,
  role       ENUM('admin','editor','viewer') DEFAULT 'viewer',
  deleted_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role  (role)
);`,
  },
  {
    id: 'rn-flatlist',
    name: 'FlatList Template',
    filename: 'ListScreen.tsx',
    language: 'TypeScript',
    description: 'Production-ready FlatList with loading, empty, and error states.',
    content: `import React, { useEffect, useState } from 'react';
import { FlatList, View, Text, ActivityIndicator, StyleSheet } from 'react-native';

type Item = { id: string; title: string };

export default function ListScreen() {
  const [data,    setData]    = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    fetch('https://jsonplaceholder.typicode.com/todos?_limit=10')
      .then(r => r.json()).then(setData)
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" />;
  if (error)   return <Text style={{ color: 'red', margin: 16 }}>{error}</Text>;
  return (
    <FlatList data={data} keyExtractor={i => i.id}
      renderItem={({ item }) => <Text style={styles.row}>{item.title}</Text>}
      ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 40 }}>No items</Text>}
    />
  );
}
const styles = StyleSheet.create({ row: { padding: 16, borderBottomWidth: 1, borderColor: '#eee' } });`,
  },
  {
    id: 'python-dataclass',
    name: 'Python Dataclass',
    filename: 'snippet_model.py',
    language: 'Python',
    description: 'Clean Python dataclass with validation and JSON serialisation.',
    content: `from dataclasses import dataclass, field, asdict
from datetime import datetime
from typing import List
import json

@dataclass
class Snippet:
    title:        str
    code_content: str
    language:     str
    tags:         List[str] = field(default_factory=list)
    created_at:   str       = field(default_factory=lambda: datetime.utcnow().isoformat())
    is_favorite:  bool      = False

    def to_json(self) -> str:
        return json.dumps(asdict(self), indent=2)

    @classmethod
    def from_json(cls, raw: str) -> "Snippet":
        return cls(**json.loads(raw))`,
  },
  {
    id: 'async-storage',
    name: 'AsyncStorage Helper',
    filename: 'storage_helper.ts',
    language: 'TypeScript',
    description: 'Type-safe get/set/remove wrappers over AsyncStorage.',
    content: `import AsyncStorage from '@react-native-async-storage/async-storage';

export async function storeJSON<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}
export async function loadJSON<T>(key: string): Promise<T | null> {
  const raw = await AsyncStorage.getItem(key);
  if (raw == null) return null;
  try { return JSON.parse(raw) as T; } catch { return null; }
}
export async function removeKey(key: string): Promise<void> {
  await AsyncStorage.removeItem(key);
}`,
  },
];

/** Save a template to the exports folder */
export async function downloadTemplate(template: Template): Promise<string> {
  return saveTextFile('exports', template.filename, template.content);
}

/** Save all templates at once */
export async function downloadAllTemplates(): Promise<void> {
  for (const t of TEMPLATE_CATALOG) {
    await downloadTemplate(t);
  }
}

// ── Helper: format bytes ──────────────────────────────────────────────────────

export function fmtBytes(bytes?: number): string {
  if (!bytes || bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export function fmtDate(ms?: number): string {
  if (!ms) return '';
  return new Date(ms * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
