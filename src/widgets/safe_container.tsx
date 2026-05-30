import React from 'react';
import { StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAppTheme } from '../themes/AppThemeContext';

interface SafeContainerProps {
  children: React.ReactNode;
  bg?: string;
  barStyle?: 'light' | 'dark' | 'auto';
  style?: StyleProp<ViewStyle>;
  edges?: Array<'top' | 'bottom' | 'left' | 'right'>;
}

const SafeContainer: React.FC<SafeContainerProps> = ({
  children,
  bg,
  barStyle,
  style,
  edges = ['top', 'bottom', 'left', 'right'],
}) => {
  const { colors, theme } = useAppTheme();
  const background = bg ?? colors.bg;
  const statusStyle = barStyle ?? (theme === 'light' ? 'dark' : 'light');

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: background }, style]} edges={edges}>
      <StatusBar style={statusStyle} backgroundColor={background} />
      {children}
    </SafeAreaView>
  );
};

export default SafeContainer;

const styles = StyleSheet.create({
  container: { flex: 1 },
});
