/**
 * snippet_card.tsx [COMPONENT]
 * ─────────────────────────────────────────────────────────
 * A high-fidelity card representing a single snippet in the list.
 * Exactly matches the reference design:
 *   • Left: Colored language badge (e.g. JS, TS, SQL)
 *   • Center: Bold title, hash tags row, and "Updated X ago" timestamp
 *   • Right: Favorite Star (filled/outline) + vertical options ellipsis
 * ─────────────────────────────────────────────────────────
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FontSize, FontWeight, Spacing, Radius } from '../themes/palette';
import { useAppTheme } from '../themes/AppThemeContext';

export interface SnippetCardProps {
  id: string;
  title: string;
  language: string; // e.g. JS, TS, SQL
  timeAgo: string;   // e.g. "Updated 2h ago"
  tags?: string[];   // e.g. ["auth", "api", "react"]
  isFavorited?: boolean;
  onPress?: () => void;
  onStarPress?: () => void;
  onMorePress?: () => void;
}

const SnippetCard: React.FC<SnippetCardProps> = ({
  title,
  language,
  timeAgo,
  tags = [],
  isFavorited = false,
  onPress,
  onStarPress,
  onMorePress,
}) => {
  const { colors } = useAppTheme();

  const getLanguageStyle = (lang: string) => {
    const normalized = lang.toUpperCase();
    switch (normalized) {
      case 'JS':
      case 'JAVASCRIPT':
        return { bg: '#E5C158', text: '#000000', label: 'JS' };
      case 'TS':
      case 'TYPESCRIPT':
        return { bg: '#0A84FF', text: '#FFFFFF', label: 'TS' };
      case 'SQL':
        return { bg: '#30D158', text: '#FFFFFF', label: 'SQL' };
      default:
        return { bg: colors.surfaceAlt, text: colors.textSecondary, label: normalized.substring(0, 3) };
    }
  };

  const langStyle = getLanguageStyle(language);

  return (
    <Pressable style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.overlay }]} onPress={onPress}>
      {/* Left: Solid Language Badge */}
      <View style={[styles.langBadge, { backgroundColor: langStyle.bg }]}>
        <Text style={[styles.langText, { color: langStyle.text }]}>{langStyle.label}</Text>
      </View>

      {/* Center: Metadata */}
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>{title}</Text>
        
        {/* Hash tags row */}
        {tags.length > 0 && (
          <View style={styles.tagsRow}>
            {tags.map((tag, idx) => (
              <Text key={idx} style={[styles.tagText, { color: colors.textSecondary }]}>#{tag}</Text>
            ))}
          </View>
        )}
        
        <Text style={[styles.timeText, { color: colors.textMuted }]}>{timeAgo}</Text>
      </View>

      {/* Right: Actions */}
      <View style={styles.actions}>
        <Pressable onPress={onStarPress} hitSlop={6} style={styles.actionBtn}>
          <Ionicons
            name={isFavorited ? 'star' : 'star-outline'}
            size={18}
            color={isFavorited ? '#FFD60A' : colors.textMuted}
          />
        </Pressable>
        <Pressable onPress={onMorePress} hitSlop={6} style={styles.actionBtn}>
          <Ionicons
            name="ellipsis-vertical"
            size={18}
            color={colors.textMuted}
          />
        </Pressable>
      </View>
    </Pressable>
  );
};

export default SnippetCard;

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: Radius.lg,
    padding: 12, // Exact 12px inside-section padding
    marginBottom: Spacing.sm,
    borderWidth: 1,
    alignItems: 'center',
    gap: 12,
  },
  langBadge: {
    width: 42,
    height: 42,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  langText: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 8,
    rowGap: 2,
  },
  tagText: {
    fontSize: FontSize.xs,
  },
  timeText: {
    fontSize: FontSize.xs,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionBtn: {
    padding: 2,
  },
});
