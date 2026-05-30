import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing } from '../themes/palette';
import SplashScreenWidget from '../widgets/splash_screen';
import SplashLoader from '../widgets/splash_loader';
import SafeContainer from '../widgets/safe_container';
import { initDb } from '../database/db';
import { ensureAppDirs } from '../services/files';
import { isOnboardingComplete, hasSession } from '../services/storage';

export default function SplashEntry() {
  const router = useRouter();
  const [statusMessage, setStatusMessage] = useState('Booting system...');

  useEffect(() => {
    (async () => {
      try {
        setStatusMessage('Connecting to local database...');
        await initDb();
        ensureAppDirs();
        const onboarded = await isOnboardingComplete();
        if (!onboarded) {
          router.replace('/onboarding');
          return;
        }
        setStatusMessage('Checking session...');
        if (await hasSession()) router.replace('/(tabs)');
        else router.replace('/auth_screen');
      } catch (error) {
        setStatusMessage('Database failed to initialize.');
        console.error('[SplashEntry]', error);
      }
    })();
  }, [router]);

  return (
    <SafeContainer edges={['top', 'bottom']} style={styles.screen}>
      <View style={styles.brand}>
        <SplashScreenWidget />
      </View>
      <SplashLoader message={statusMessage} />
    </SafeContainer>
  );
}

const styles = StyleSheet.create({
  screen: { justifyContent: 'space-between', paddingVertical: Spacing.xxxl, paddingHorizontal: Spacing.xl },
  brand: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
