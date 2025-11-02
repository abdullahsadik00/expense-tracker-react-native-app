import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const COLORS = {
  primary: '#1e3a8a',
  secondary: '#10b981',
  danger: '#ef4444',
  text: '#1f2937',
  textLight: '#6b7280',
  border: '#e5e7eb',
};

interface ExpenseItemProps {
  id: string;
  amount: number;
  description: string;
  categoryId: string;
  date: string;
  category?: {
    name: string;
    icon: string;
    color: string;
  };
  showDelete?: boolean;
  onDelete?: (id: string) => void;
}

const EXPENSE_CATEGORIES = [
  { id: '1', name: 'Food', icon: 'food', color: '#f59e0b' },
  { id: '2', name: 'Transport', icon: 'car', color: '#8b5cf6' },
  { id: '3', name: 'Shopping', icon: 'shopping', color: '#ec4899' },
  { id: '4', name: 'Bills', icon: 'receipt', color: '#3b82f6' },
  { id: '5', name: 'Entertainment', icon: 'movie', color: '#06b6d4' },
  { id: '6', name: 'Health', icon: 'hospital-box', color: '#10b981' },
  { id: '7', name: 'Other', icon: 'dots-horizontal', color: '#6b7280' },
];

export default function ExpenseItem({ 
  id, 
  amount, 
  description, 
  categoryId, 
  date, 
  category,
  showDelete = false,
  onDelete 
}: ExpenseItemProps) {
  const cat = category || EXPENSE_CATEGORIES.find(c => c.id === categoryId);
  const isExpense = amount < 0;
  const displayAmount = Math.abs(amount);

  return (
    <View style={styles.expenseItem}>
      <View style={[styles.categoryIcon, { backgroundColor: cat?.color + '20' }]}>
        <MaterialCommunityIcons name={cat?.icon as any} size={24} color={cat?.color} />
      </View>
      <View style={styles.expenseDetails}>
        <Text style={styles.expenseTitle}>{description}</Text>
        <Text style={styles.expenseCategory}>
          {showDelete ? date : cat?.name}
        </Text>
      </View>
      <View style={styles.expenseActions}>
        <Text style={[
          styles.expenseAmount,
          { color: isExpense ? COLORS.danger : COLORS.secondary }
        ]}>
          {isExpense ? '-' : '+'}${displayAmount.toFixed(2)}
        </Text>
        {showDelete && onDelete && (
          <TouchableOpacity onPress={() => onDelete(id)}>
            <MaterialCommunityIcons name="delete" size={20} color={COLORS.danger} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  expenseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  expenseDetails: {
    flex: 1,
  },
  expenseTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  expenseCategory: {
    fontSize: 13,
    color: COLORS.textLight,
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  expenseActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
});