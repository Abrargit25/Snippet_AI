import { getDb } from './db';
import { langToBadge } from '../utils/language';
import type { SnippetListItem } from '../models/snippetTypes';

type Row = {
  id: number;
  title: string;
  code_content: string;
  language: string;
  ai_explanation: string | null;
  image_uri: string | null;
  is_favorite: number;
  created_at: string;
  tags: string;
};

function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return `Updated ${Math.max(mins, 1)}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Updated ${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return days === 1 ? 'Updated yesterday' : `Updated ${days}d ago`;
}

function toItem(row: Row): SnippetListItem {
  return {
    id: String(row.id),
    title: row.title,
    language: langToBadge(row.language),
    languageFull: row.language,
    codeContent: row.code_content,
    tags: JSON.parse(row.tags || '[]'),
    timeAgo: timeAgo(row.created_at),
    createdAt: row.created_at,
    isFavorited: row.is_favorite === 1,
    aiExplanation: row.ai_explanation ?? undefined,
    imageUri: row.image_uri ?? undefined,
  };
}

export async function toggleFavorite(id: number, favorited: boolean): Promise<void> {
  await getDb().runAsync('UPDATE snippets SET is_favorite=? WHERE id=?', favorited ? 1 : 0, id);
}

export async function listSnippets(): Promise<SnippetListItem[]> {
  const rows = await getDb().getAllAsync<Row>('SELECT * FROM snippets ORDER BY id DESC');
  return rows.map(toItem);
}

export async function getSnippet(id: number): Promise<SnippetListItem | null> {
  const row = await getDb().getFirstAsync<Row>('SELECT * FROM snippets WHERE id=?', id);
  return row ? toItem(row) : null;
}

export async function saveAiExplanation(id: number, text: string): Promise<void> {
  await getDb().runAsync('UPDATE snippets SET ai_explanation=? WHERE id=?', text, id);
}

export async function saveSnippet(data: {
  id?: number;
  title: string;
  language: string;
  codeContent: string;
  tags: string[];
  isFavorite?: boolean;
  createdAt?: string;
  imageUri?: string;
}): Promise<void> {
  const tags = JSON.stringify(data.tags);
  const fav = data.isFavorite ? 1 : 0;
  const img = data.imageUri ?? null;
  if (data.id) {
    await getDb().runAsync(
      'UPDATE snippets SET title=?, code_content=?, language=?, is_favorite=?, tags=?, image_uri=? WHERE id=?',
      data.title, data.codeContent, data.language, fav, tags, img, data.id,
    );
    return;
  }
  await getDb().runAsync(
    'INSERT INTO snippets (title, code_content, language, is_favorite, created_at, tags, image_uri) VALUES (?,?,?,?,?,?,?)',
    data.title, data.codeContent, data.language, fav, data.createdAt ?? new Date().toISOString(), tags, img,
  );
}

export async function deleteSnippet(id: number): Promise<void> {
  await getDb().runAsync('DELETE FROM snippets WHERE id=?', id);
}

export type { SnippetListItem };
