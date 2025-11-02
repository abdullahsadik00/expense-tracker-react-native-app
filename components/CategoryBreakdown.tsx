import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const COLORS = {
  primary: '#1e3a8a',
  text: '#1f2937',
  textLight: '#6b7280',
  border: '#e5e7eb',
};

interface CategoryBreakdownItem {
  id: string;
  name: string;
  color: string;
  total: number;
  count: number;
}

interface CategoryBreakdownProps {
  categories: CategoryBreakdownItem[];
}

export default function CategoryBreakdown({ categories }: CategoryBreakdownProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Spending by Category</Text>
      {categories.map((cat) => (
        cat.total > 0 && (
          <View key={cat.id} style={styles.categoryBreakdown}>
            <View style={styles.categoryBreakdownLeft}>
              <View style={[styles.categoryDot, { backgroundColor: cat.color }]} />
              <View>
                <Text style={styles.categoryName}>{cat.name}</Text>
                <Text style={styles.categoryCount}>
                  {cat.count} transactions
                </Text>
              </View>
            </View>
            <Text style={styles.categoryTotal}>${cat.total.toFixed(2)}</Text>
          </View>
        )
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
  },
  categoryBreakdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  categoryBreakdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  categoryCount: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  categoryTotal: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
  },
});