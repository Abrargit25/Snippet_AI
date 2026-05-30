import { getActiveProvider, getProviderApiKey } from './ai_providers';

export type AiResult = { explanation: string; summary: string; suggestions: string };

export class AiQuotaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AiQuotaError';
  }
}

function asText(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value == null) return '';
  return JSON.stringify(value, null, 2);
}

function parseContent(text: string): AiResult {
  const trimmed = text.trim();
  try {
    const jsonStr = trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    const p = JSON.parse(jsonStr) as Record<string, unknown>;
    return { summary: asText(p.summary), explanation: asText(p.explanation), suggestions: asText(p.suggestions) };
  } catch { /* fallback */ }

  const pick = (label: string) => {
    const re = new RegExp(`${label}\\s*:?\\s*([\\s\\S]*?)(?=\\n\\s*(?:Summary|Explanation|Suggestions)\\s*:|$)`, 'i');
    return trimmed.match(re)?.[1]?.trim() ?? '';
  };
  return {
    summary: pick('summary') || trimmed.slice(0, 280),
    explanation: pick('explanation') || trimmed,
    suggestions: pick('suggestions'),
  };
}

async function readApiError(res: Response): Promise<string> {
  try {
    const body = await res.json();
    return body?.error?.message ?? body?.message ?? `HTTP ${res.status}`;
  } catch {
    return `HTTP ${res.status}`;
  }
}

export function explainSnippetLocal(code: string, language: string, title?: string): AiResult {
  const lines = code.split('\n');
  const totalLines = lines.length;
  
  // Basic code pattern matching
  const trimmedLines = lines.map(l => l.trim());
  const functions = trimmedLines.filter(l => /^(export\s+)?(async\s+)?function\s|=>|class\s|def\s|fn\s/.test(l)).length;
  const loops = trimmedLines.filter(l => /^(for|while|foreach|map|filter)\b/.test(l)).length;
  const errors = trimmedLines.filter(l => /try\b|catch\b|except\b|throw\b/.test(l)).length;
  const asyncCalls = trimmedLines.filter(l => /await\b|async\b|\.then\(/.test(l)).length;
  
  // Detect frameworks/libs
  const hasReact = code.includes('react') || code.includes('useState') || code.includes('useEffect');
  const hasRN = code.includes('react-native') || code.includes('View') || code.includes('Text');
  const hasSql = language.toLowerCase() === 'sql' || code.includes('SELECT') || code.includes('CREATE TABLE');
  
  // Dynamic Summary
  let summary = `A ${language} implementation of "${title || 'code structure'}" comprising ${totalLines} lines. `;
  if (functions > 0) summary += `Features ${functions} distinct function/class definitions. `;
  if (asyncCalls > 0) summary += `Operates asynchronously for non-blocking execution.`;
  
  // Dynamic Plain English How It Works
  let explanation = `This code block operates as follows:\n\n`;
  if (hasReact) {
    explanation += `1. React Component Context: It leverages React's hook-based state management cycle. We detect React hooks and lifecycle indicators within the source.\n`;
  }
  if (hasRN) {
    explanation += `2. Native Rendering: It imports React Native components, building a mobile UI layout optimized for iOS & Android systems.\n`;
  }
  if (hasSql) {
    explanation += `1. Schema / Queries: It executes declarative SQL relational instructions to define data structure or retrieve indexed dataset rows.\n`;
  }
  
  explanation += `2. Control Flow: Main logic is driven by ${functions} callable modules and ${loops} loop/mapping operations to process data elements.\n`;
  
  if (asyncCalls > 0) {
    explanation += `3. Async Operations: Employs async-await threads to orchestrate network or system IO efficiently without freezing the primary JS thread.\n`;
  }
  if (errors > 0) {
    explanation += `4. Error Resilience: Implements try-catch/except blocks, which helps intercept run-time exceptions gracefully instead of crashing.\n`;
  } else {
    explanation += `4. IO Flow: Executes linearly. Note that it lacks active error-catching statements, meaning unexpected inputs might cause operational halts.\n`;
  }
  
  // Dynamic Suggestions points
  const suggestionsList: string[] = [];
  
  if (errors === 0) {
    suggestionsList.push(`Add Error Handling: Wrap operations in a try/catch or try/except block to intercept runtime failures gracefully.`);
  }
  if (asyncCalls > 0 && !code.includes('catch')) {
    suggestionsList.push(`Handle Async Failures: Implement error boundaries or promise rejections for async endpoints to secure network traffic.`);
  }
  if (hasReact && !code.includes('useCallback') && !code.includes('useMemo')) {
    suggestionsList.push(`Optimize Rendering Performance: Memoize extensive event handlers and calculation arrays using React's useCallback/useMemo hook sets.`);
  }
  if (hasSql && !code.includes('INDEX')) {
    suggestionsList.push(`Create Strategic Indexes: If querying frequently on custom fields, declare an INDEX constraint to accelerate lookups on large tables.`);
  }
  if (totalLines > 50) {
    suggestionsList.push(`Refactor modularity: Split the large block (${totalLines} lines) into smaller, single-responsibility helper modules to enhance testability.`);
  }
  if (code.includes('console.log') || code.includes('print(')) {
    suggestionsList.push(`Remove Debug Logging: Clean up console.log/print outputs before pushing to production builds to keep logs organized.`);
  }
  
  // Default suggestions if none triggered
  if (suggestionsList.length === 0) {
    suggestionsList.push(`Add typings or schemas to parameters to lock down run-time object mutations.`);
    suggestionsList.push(`Document tricky logic sequences using short, concise inline comments.`);
  }
  
  // Format Suggestions
  const suggestions = suggestionsList.map((s, i) => `${i + 1}. ${s}`).join('\n');
  
  return {
    summary,
    explanation,
    suggestions,
  };
}

export async function explainSnippet(code: string, language: string): Promise<AiResult> {
  const provider = await getActiveProvider();
  const key = await getProviderApiKey(provider.id);

  if (!key) {
    throw new Error(`No API key for "${provider.name}". Settings → AI Providers → configure key.`);
  }
  if (!code.trim()) throw new Error('This snippet has no code to explain.');
  if (!provider.url.includes('http')) throw new Error('Invalid provider URL.');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90_000);
  const useJson = provider.id === 'openai';

  try {
    const payload: Record<string, unknown> = {
      model: provider.model,
      temperature: 0.3,
      max_tokens: 1200,
      messages: [
        {
          role: 'system',
          content: useJson
            ? 'JSON only: {"summary":"...","explanation":"...","suggestions":"..."}'
            : 'Explain code: Summary, Explanation, Suggestions.',
        },
        { role: 'user', content: `Language: ${language}\n\n${code.slice(0, 12_000)}` },
      ],
    };
    if (useJson) payload.response_format = { type: 'json_object' };

    const res = await fetch(provider.url, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const msg = await readApiError(res);
      if (res.status === 429) throw new AiQuotaError(`Quota/rate limit for ${provider.name}. Try another provider or Offline summary.`);
      if (res.status === 401) throw new Error(`Invalid API key for ${provider.name}. ${msg}`);
      throw new Error(msg);
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content || typeof content !== 'string') throw new Error('Empty AI response.');
    return parseContent(content);
  } catch (e) {
    if (e instanceof AiQuotaError || e instanceof Error) {
      if (e.name === 'AbortError') throw new Error('Request timed out.');
      throw e;
    }
    throw new Error('Network error.');
  } finally {
    clearTimeout(timeout);
  }
}
