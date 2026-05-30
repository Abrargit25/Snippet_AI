import React, { useCallback, useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';
import SafeContainer from '../../widgets/safe_container';
import PrimaryButton from '../../components/primary_button';
import { useAppTheme } from '../../themes/AppThemeContext';
import { getSnippet, saveAiExplanation } from '../../database/snippet_repo';
import type { SnippetListItem } from '../../models/snippetTypes';
import { explainSnippet, explainSnippetLocal, AiQuotaError } from '../../services/ai';
import { saveTextFile } from '../../services/files';
import { Spacing, Radius, FontSize, FontWeight } from '../../themes/palette';

// ── Parsing ───────────────────────────────────────────────────────────────────

interface ParsedInsight {
  summary:     string;
  explanation: string;
  suggestions: string[];
}

function parseInsight(text: string): ParsedInsight {
  if (!text) return { summary: '', explanation: '', suggestions: [] };

  const summaryM     = text.match(/Summary\n([\s\S]*?)(?=\n\n(?:Explanation|Suggestions|$))/i);
  const explanationM = text.match(/Explanation\n([\s\S]*?)(?=\n\n(?:Summary|Suggestions|$))/i);
  const suggestionsM = text.match(/Suggestions\n([\s\S]*?)(?=\n\n(?:Summary|Explanation|$))/i);

  if (!summaryM && !explanationM && !suggestionsM) {
    return { summary: '', explanation: text.trim(), suggestions: [] };
  }

  const rawBullets = suggestionsM?.[1]?.trim() ?? '';
  const bullets = rawBullets
    .split(/\n+/)
    .map((l) => l.replace(/^[\d]+\.\s*|^[•\-\*]\s*/, '').trim())
    .filter(Boolean);

  return {
    summary:     summaryM?.[1]?.trim()     ?? '',
    explanation: explanationM?.[1]?.trim() ?? '',
    suggestions: bullets,
  };
}

// ── Language colours ──────────────────────────────────────────────────────────

const LANG_COLOR: Record<string, string> = {
  JavaScript: '#F7DF1E', TypeScript: '#3178C6', Python: '#3776AB',
  SQL: '#336791', Dart: '#00B4D8', Go: '#00ADD8', Java: '#ED8B00',
  'C#': '#512BD4', PHP: '#8892BF', Ruby: '#CC342D',
};
function langColor(lang: string) { return LANG_COLOR[lang] ?? '#7C3AED'; }

// ── InsightCard ───────────────────────────────────────────────────────────────

function InsightCard({
  icon, iconColor, title, children, bg, border,
}: {
  icon: string; iconColor: string; title: string;
  children: React.ReactNode; bg: string; border: string;
}) {
  return (
    <View style={[styles.card, { backgroundColor: bg, borderColor: border }]}>
      <View style={styles.cardHeader}>
        <View style={[styles.cardIconWrap, { backgroundColor: iconColor + '1A' }]}>
          <Ionicons name={icon as any} size={18} color={iconColor} />
        </View>
        <Text style={[styles.cardTitle, { color: '#FFFFFF' }]}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

// ── SuggestionBullet ──────────────────────────────────────────────────────────

function SuggestionBullet({
  text, index, accent, textColor,
}: { text: string; index: number; accent: string; textColor: string }) {
  return (
    <View style={styles.bulletRow}>
      <View style={[styles.bulletNum, { backgroundColor: accent + '22', borderColor: accent + '44' }]}>
        <Text style={[styles.bulletNumText, { color: accent }]}>{index + 1}</Text>
      </View>
      <Text style={[styles.bulletText, { color: textColor }]}>{text}</Text>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function AiInsightScreen({ id }: { id: string }) {
  const router = useRouter();
  const { colors, fontSize } = useAppTheme();

  const [snippet, setSnippet] = useState<SnippetListItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiText,  setAiText]  = useState('');

  const load = useCallback(async () => {
    const s = await getSnippet(Number(id));
    if (s) { setSnippet(s); setAiText(s.aiExplanation || ''); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const applyAiResult = async (
    result: { summary: string; explanation: string; suggestions: string },
  ) => {
    if (!snippet) return;
    const combined = [
      result.summary     && `Summary\n${result.summary}`,
      result.explanation && `Explanation\n${result.explanation}`,
      result.suggestions && `Suggestions\n${result.suggestions}`,
    ].filter(Boolean).join('\n\n');

    setAiText(combined);
    await saveAiExplanation(Number(snippet.id), combined);
    try {
      await saveTextFile('exports', `${snippet.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_ai.txt`, combined);
    } catch { /* non-critical */ }
  };

  const runOffline = async () => {
    if (!snippet) return;
    setLoading(true);
    try {
      await applyAiResult(explainSnippetLocal(snippet.codeContent, snippet.languageFull, snippet.title));
    } catch (e) { Alert.alert('Offline error', String(e)); }
    finally { setLoading(false); }
  };

  const generate = async () => {
    if (!snippet) return;
    setAiText('');
    const net = await NetInfo.fetch();
    if (net.isConnected === false && net.isInternetReachable === false) {
      Alert.alert('Offline', 'Use offline summary instead?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Offline summary', onPress: runOffline },
      ]);
      return;
    }
    setLoading(true);
    try {
      await applyAiResult(await explainSnippet(snippet.codeContent, snippet.languageFull));
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      if (e instanceof AiQuotaError) {
        Alert.alert('Quota reached', msg, [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Offline summary', onPress: runOffline },
          { text: 'Configure AI Key', onPress: () => router.push('/settings/ai-providers') },
        ]);
      } else {
        Alert.alert('AI Request Failed', msg);
      }
    } finally { setLoading(false); }
  };

  if (!snippet) {
    return (
      <SafeContainer edges={['bottom']} style={[styles.center, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </SafeContainer>
    );
  }

  const parsed = parseInsight(aiText);
  const dot    = langColor(snippet.languageFull);

  return (
    <SafeContainer edges={['bottom']} style={[styles.screen, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Snippet header card ── */}
        <View style={[styles.headerCard, { backgroundColor: colors.surface, borderColor: colors.overlay }]}>
          <View style={[styles.langBar, { backgroundColor: dot }]} />
          <View style={{ flex: 1, gap: 3 }}>
            <Text
              numberOfLines={1}
              style={[styles.headerTitle, { color: colors.textPrimary, fontSize: fontSize.md }]}
            >
              {snippet.title}
            </Text>
            <View style={styles.headerMeta}>
              <Text style={[styles.headerLang, { color: dot, fontSize: fontSize.xs }]}>
                {snippet.languageFull}
              </Text>
              <Text style={[{ color: colors.textMuted, fontSize: fontSize.xs }]}>
                {' '}· AI Analysis
              </Text>
            </View>
          </View>
          <View style={[styles.headerBadge, { backgroundColor: colors.accent + '22' }]}>
            <Ionicons name="sparkles" size={16} color={colors.accent} />
          </View>
        </View>

        {/* ── Loading ── */}
        {loading && (
          <View style={[styles.loadingCard, { backgroundColor: colors.surface, borderColor: colors.overlay }]}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={[styles.loadingTitle, { color: colors.textPrimary, fontSize: fontSize.md }]}>
              Generating AI Insights…
            </Text>
            <Text style={[styles.loadingSub, { color: colors.textMuted, fontSize: fontSize.sm }]}>
              Analysing code structure, logic, and improvement opportunities
            </Text>
          </View>
        )}

        {/* ── Empty state ── */}
        {!loading && !aiText && (
          <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.overlay }]}>
            <View style={[styles.emptyIconWrap, { backgroundColor: colors.accent + '1A' }]}>
              <Ionicons name="sparkles-outline" size={36} color={colors.accent} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary, fontSize: fontSize.lg }]}>
              No Insights Yet
            </Text>
            <Text style={[styles.emptyBody, { color: colors.textMuted, fontSize: fontSize.sm }]}>
              Generate AI insights to get a concise summary, a plain-English explanation of how the code works, and numbered improvement suggestions.
            </Text>
            <PrimaryButton label="Generate AI Insights" onPress={generate} style={styles.generateBtn} />
          </View>
        )}

        {/* ── Results ── */}
        {!loading && !!aiText && (
          <>
            {/* 1. Summary */}
            {!!parsed.summary && (
              <InsightCard icon="bookmark" iconColor="#9B59F5" title="Summary" bg={colors.surface} border={colors.overlay}>
                <Text style={[styles.summaryText, { color: colors.textSecondary, fontSize: fontSize.base }]}>
                  {parsed.summary}
                </Text>
              </InsightCard>
            )}

            {/* 2. Explanation */}
            {!!parsed.explanation && (
              <InsightCard icon="bulb" iconColor="#FF9F0A" title="How It Works" bg={colors.surface} border={colors.overlay}>
                <Text style={[styles.explanationText, { color: colors.textSecondary, fontSize: fontSize.sm }]}>
                  {parsed.explanation}
                </Text>
              </InsightCard>
            )}

            {/* 3. Suggestions — numbered bullets */}
            {parsed.suggestions.length > 0 && (
              <InsightCard icon="checkmark-circle" iconColor="#00E676" title="Suggestions" bg={colors.surface} border={colors.overlay}>
                <View style={styles.bulletList}>
                  {parsed.suggestions.map((tip, i) => (
                    <SuggestionBullet
                      key={i}
                      text={tip}
                      index={i}
                      accent="#00E676"
                      textColor={colors.textSecondary}
                    />
                  ))}
                </View>
              </InsightCard>
            )}

            {/* Regenerate */}
            <View style={styles.regenRow}>
              <PrimaryButton label="Regenerate" onPress={generate} icon="refresh-outline" style={{ flex: 1 }} />
            </View>
          </>
        )}

      </ScrollView>
    </SafeContainer>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: Spacing.base, gap: Spacing.md, paddingBottom: Spacing.xxxl },

  // header card
  headerCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    padding: Spacing.md, borderRadius: Radius.lg, borderWidth: 1,
  },
  langBar:    { width: 4, height: 44, borderRadius: 2, flexShrink: 0 },
  headerTitle:{ fontWeight: FontWeight.bold },
  headerMeta: { flexDirection: 'row', alignItems: 'center' },
  headerLang: { fontWeight: FontWeight.bold },
  headerBadge:{
    width: 36, height: 36, borderRadius: Radius.sm,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },

  // loading
  loadingCard: {
    padding: Spacing.xxl, borderRadius: Radius.xl, borderWidth: 1,
    alignItems: 'center', gap: Spacing.md,
  },
  loadingTitle: { fontWeight: FontWeight.bold, textAlign: 'center', marginTop: Spacing.sm },
  loadingSub:   { textAlign: 'center', lineHeight: 20 },

  // empty
  emptyCard: {
    padding: Spacing.xl, borderRadius: Radius.xl, borderWidth: 1,
    alignItems: 'center', gap: Spacing.md, marginTop: Spacing.md,
  },
  emptyIconWrap: {
    width: 72, height: 72, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  emptyTitle: { fontWeight: FontWeight.bold, textAlign: 'center' },
  emptyBody:  { textAlign: 'center', lineHeight: 22, paddingHorizontal: Spacing.md },
  generateBtn: { width: '100%', marginTop: Spacing.sm },

  // insight card
  card: {
    borderRadius: Radius.lg, borderWidth: 1,
    padding: Spacing.base, gap: Spacing.md,
  },
  cardHeader:  { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  cardIconWrap:{
    width: 34, height: 34, borderRadius: Radius.sm,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  cardTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold, flex: 1 },

  // text blocks
  summaryText: {
    lineHeight: 26, fontWeight: FontWeight.medium, letterSpacing: 0.15,
  },
  explanationText: {
    lineHeight: 22, letterSpacing: 0.1,
  },

  // bullet list
  bulletList: { gap: Spacing.md },
  bulletRow:  { flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start' },
  bulletNum: {
    width: 26, height: 26, borderRadius: Radius.sm,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, flexShrink: 0, marginTop: 1,
  },
  bulletNumText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  bulletText: { flex: 1, fontSize: FontSize.sm, lineHeight: 20, letterSpacing: 0.1 },

  // regen
  regenRow: { flexDirection: 'row', marginTop: Spacing.sm },
});
