import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '@/constants/colors';

interface StatusBadgeProps {
  status: 'active' | 'inactive' | 'warning' | 'success';
  text: string;
}

export function StatusBadge({ status, text }: StatusBadgeProps) {
  return (
    <View style={[styles.badge, styles[status]]}>
      <Text style={[styles.text, styles[`${status}Text`]]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
  
  active: {
    backgroundColor: COLORS.success,
  },
  activeText: {
    color: COLORS.white,
  },
  
  inactive: {
    backgroundColor: COLORS.gray300,
  },
  inactiveText: {
    color: COLORS.gray700,
  },
  
  warning: {
    backgroundColor: COLORS.warning,
  },
  warningText: {
    color: COLORS.white,
  },
  
  success: {
    backgroundColor: COLORS.success,
  },
  successText: {
    color: COLORS.white,
  },
});