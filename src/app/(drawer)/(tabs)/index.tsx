/**
 * (tabs)/index.tsx  [ROUTE — Home Tab Entry]
 * ─────────────────────────────────────────────────────────
 * Route entrypoint for the Home Tab.
 * Simply renders the core, reusable HomeScreen component.
 * ─────────────────────────────────────────────────────────
 */
import React from 'react';
import HomeScreen from '../../../ui/screens/home_screen';

export default function HomeTabRoute() {
  return <HomeScreen />;
}
