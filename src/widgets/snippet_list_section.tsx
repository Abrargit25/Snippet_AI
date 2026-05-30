/**
 * snippet_list_section.tsx [WIDGET]
 * ─────────────────────────────────────────────────────────
 * A section that renders a list of snippet cards.
 * ─────────────────────────────────────────────────────────
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Spacing } from '../themes/palette';
import SectionHeader from '../components/section_header';
import SnippetCard, { SnippetCardProps } from '../components/snippet_card';

export interface SnippetListSectionProps {
  title: string;
  snippets: SnippetCardProps[];
  onViewAll?: () => void;
}

const SnippetListSection: React.FC<SnippetListSectionProps> = ({ title, snippets, onViewAll }) => {
  if (!snippets || snippets.length === 0) return null;

  return (
    <View style={styles.container}>
      <SectionHeader title={title} actionLabel="View all" onActionPress={onViewAll} />
      <View style={styles.listContainer}>
        {snippets.map((snippet) => (
          <SnippetCard key={snippet.id} {...snippet} />
        ))}
      </View>
    </View>
  );
};

export default SnippetListSection;

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  listContainer: {
    paddingHorizontal: 16,
  },
});
