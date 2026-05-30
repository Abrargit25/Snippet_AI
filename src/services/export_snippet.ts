/**
 * export_snippet.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Handles sharing and local-file-saving for snippets.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import * as Sharing from 'expo-sharing';
import { Directory } from 'expo-file-system';
import type { SnippetListItem, ExportFormat } from '../models/snippetTypes';
import {
  appRoot,
  ensureAppDirs,
  saveTextFile,
  saveCodeToFiles as saveCode,
  getFolder,
} from './files';

// ── Build file content ────────────────────────────────────────────────────────

function buildContent(
  snippet: SnippetListItem,
  format: ExportFormat,
): { body: string; name: string } {
  const base = (snippet.title || 'snippet').replace(/[^a-zA-Z0-9_\-. ]/g, '_').trim();

  if (format === 'json') {
    return {
      name: `${base}.json`,
      body: JSON.stringify(
        {
          title:    snippet.title,
          language: snippet.languageFull,
          code:     snippet.codeContent,
          tags:     snippet.tags,
          createdAt: snippet.createdAt,
        },
        null,
        2,
      ),
    };
  }

  if (format === 'js') {
    return { name: `${base}.js`, body: snippet.codeContent };
  }

  // txt
  return {
    name: `${base}.txt`,
    body: [
      snippet.title,
      `Language: ${snippet.languageFull}`,
      `Tags: ${snippet.tags.join(', ')}`,
      '',
      snippet.codeContent,
    ].join('\n'),
  };
}

// ── Export & share via system sheet ──────────────────────────────────────────

export async function exportAndShare(
  snippet: SnippetListItem,
  format: ExportFormat,
): Promise<void> {
  ensureAppDirs();
  const { body, name } = buildContent(snippet, format);
  const file = saveTextFile(getFolder('exports'), name, body);
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri);
  }
}

// ── Save code locally (to exports/ folder) ───────────────────────────────────

export function saveCodeToFiles(
  title: string,
  language: string,
  code: string,
): void {
  saveCode(title, language, code);
}
