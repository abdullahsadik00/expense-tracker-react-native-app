import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const COLORS = {
  primary: '#1e3a8a',
  secondary: '#10b981',
  surface: '#ffffff',
  textLight: '#6b7280',
};

interface BalanceCardProps {
  totalExpenses: number;
  period?: string;
}

export default function BalanceCard({ totalExpenses, period = 'This month' }: BalanceCardProps) {
  return (
    <View style={styles.balanceCard}>
      <View>
        <Text style={styles.balanceLabel}>Total Expenses</Text>
        <Text style={styles.balanceAmount}>${totalExpenses.toFixed(2)}</Text>
        <Text style={styles.balanceDate}>{period}</Text>
      </View>
      <MaterialCommunityIcons name="wallet" size={60} color={COLORS.secondary} />
    </View>
  );
}

const styles = StyleSheet.create({
  balanceCard: {
    marginHorizontal: 20,
    marginTop: -30,
    marginBottom: 24,
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  balanceLabel: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 4,
  },
  balanceDate: {
    fontSize: 12,
    color: COLORS.textLight,
  },
});