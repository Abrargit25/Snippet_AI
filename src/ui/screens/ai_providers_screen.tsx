import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Modal, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import SafeContainer from '../../widgets/safe_container';
import { FontWeight, Spacing, Radius } from '../../themes/palette';
import { useAppTheme } from '../../themes/AppThemeContext';
import { 
  getAllProviders, getActiveProviderId, setActiveProviderId, getProviderApiKey, deleteCustomProvider 
} from '../../services/ai_providers';
import type { AiProviderDefinition } from '../../models/aiProvider';

export default function AiProvidersScreen() {
  const router = useRouter();
  const { colors, fontSize } = useAppTheme();
  const [list, setList] = useState<AiProviderDefinition[]>([]);
  const [activeId, setActiveId] = useState('groq');
  const [hasKey, setHasKey] = useState<Record<string, boolean>>({});
  const [pendingProvider, setPendingProvider] = useState<AiProviderDefinition | null>(null);

  const load = useCallback(async () => {
    const providers = await getAllProviders();
    setList(providers);
    setActiveId(await getActiveProviderId());
    const keys: Record<string, boolean> = {};
    await Promise.all(providers.map(async (p) => {
      keys[p.id] = !!(await getProviderApiKey(p.id));
    }));
    setHasKey(keys);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const select = (provider: AiProviderDefinition) => {
    if (provider.id === activeId) return;
    setPendingProvider(provider);
  };

  const confirmSwitch = async () => {
    if (pendingProvider) {
      await setActiveProviderId(pendingProvider.id);
      setActiveId(pendingProvider.id);
      setPendingProvider(null);
    }
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert('Delete provider', `Are you sure you want to remove ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteCustomProvider(id);
          if (activeId === id) {
            await setActiveProviderId('groq');
            setActiveId('groq');
          }
          load();
        },
      },
    ]);
  };

  return (
    <SafeContainer edges={['top']} style={styles.flex}>
      <FlatList
        data={list}
        keyExtractor={(p) => p.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={[styles.sub, { color: colors.textSecondary, fontSize: fontSize.sm }]}>
              Select active provider. Tap to configure URL, model, and API key.
            </Text>
          </View>
        }
        ListFooterComponent={
          <Pressable
            style={[styles.addBtn, { backgroundColor: colors.accent }]}
            onPress={() => router.push({ pathname: '/settings/ai-provider-edit', params: { mode: 'new' } })}
          >
            <Ionicons name="add" size={22} color={colors.textPrimary} />
            <Text style={[styles.addText, { color: colors.textPrimary }]}>Add custom provider</Text>
          </Pressable>
        }
        renderItem={({ item }) => {
          const active = item.id === activeId;
          return (
            <Pressable
              style={[styles.card, { backgroundColor: colors.surface, borderColor: active ? colors.accent : colors.overlay }]}
              onPress={() => select(item)}
              onLongPress={() => router.push({ pathname: '/settings/ai-provider-edit', params: { id: item.id } })}
            >
              <View style={styles.cardTop}>
                <Ionicons name={active ? 'radio-button-on' : 'radio-button-off'} size={22} color={active ? colors.accent : colors.textMuted} />
                <View style={styles.cardBody}>
                  <Text style={[styles.name, { color: colors.textPrimary, fontSize: fontSize.base }]}>{item.name}</Text>
                  <Text style={[styles.url, { color: colors.textMuted, fontSize: fontSize.xs }]} numberOfLines={1}>{item.model}</Text>
                </View>
                <View style={styles.cardActions}>
                  <Pressable onPress={() => router.push({ pathname: '/settings/ai-provider-edit', params: { id: item.id } })} hitSlop={12} style={{ padding: 4 }}>
                    <Ionicons name="settings-outline" size={22} color={colors.textSecondary} />
                  </Pressable>
                  {!item.builtIn && (
                    <Pressable onPress={() => handleDelete(item.id, item.name)} hitSlop={12} style={{ padding: 4 }}>
                      <Ionicons name="trash-outline" size={22} color={colors.red} />
                    </Pressable>
                  )}
                </View>
              </View>
              <Text style={{ color: hasKey[item.id] ? colors.green : colors.amber, fontSize: fontSize.xs }}>
                {hasKey[item.id] ? 'API key saved' : 'No API key — tap gear to add'}
              </Text>
            </Pressable>
          );
        }}
      />

      <Modal
        visible={pendingProvider !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setPendingProvider(null)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setPendingProvider(null)}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.overlay }]}>
            <View style={styles.modalIconWrapper}>
              <Ionicons name="swap-horizontal" size={28} color={colors.accent} />
            </View>
            <Text style={[styles.modalTitle, { color: colors.textPrimary, fontSize: fontSize.lg }]}>
              Switch AI Provider
            </Text>
            <Text style={[styles.modalMessage, { color: colors.textSecondary, fontSize: fontSize.base }]}>
              Are you sure you want to switch your active AI Provider to <Text style={{ fontWeight: FontWeight.bold, color: colors.textPrimary }}>{pendingProvider?.name}</Text>?
            </Text>
            <Text style={[styles.modalSub, { color: colors.textMuted, fontSize: fontSize.xs }]}>
              Model: {pendingProvider?.model}
            </Text>

            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalBtn, styles.cancelBtn, { borderColor: colors.overlay }]}
                onPress={() => setPendingProvider(null)}
              >
                <Text style={[styles.modalBtnText, { color: colors.textSecondary, fontSize: fontSize.sm }]}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalBtn, styles.confirmBtn, { backgroundColor: colors.accent }]}
                onPress={confirmSwitch}
              >
                <Text style={[styles.modalBtnText, { color: colors.textPrimary, fontSize: fontSize.sm }]}>Confirm</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>
    </SafeContainer>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { marginBottom: Spacing.md },
  sub: { lineHeight: 20 },
  list: { padding: Spacing.base, gap: Spacing.sm, paddingBottom: Spacing.xxxl },
  card: { padding: Spacing.md, borderRadius: Radius.lg, borderWidth: 1, gap: Spacing.xs },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  cardBody: { flex: 1 },
  name: { fontWeight: FontWeight.semibold },
  url: {},
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, padding: Spacing.md, borderRadius: Radius.lg, marginTop: Spacing.lg },
  addText: { fontWeight: FontWeight.semibold },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },

  // Modal styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  modalContent: {
    width: '90%',
    maxWidth: 340,
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.md,
  },
  modalIconWrapper: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  modalTitle: {
    fontWeight: FontWeight.bold,
  },
  modalMessage: {
    textAlign: 'center',
    lineHeight: 22,
  },
  modalSub: {
    textAlign: 'center',
    marginTop: -Spacing.xs,
  },
  modalButtons: {
    flexDirection: 'row',
    width: '100%',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  modalBtn: {
    flex: 1,
    height: 44,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtn: {
    borderWidth: 1,
  },
  confirmBtn: {},
  modalBtnText: {
    fontWeight: FontWeight.semibold,
  },
});
