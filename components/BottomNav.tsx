import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const COLORS = {
  primary: '#1e3a8a',
  surface: '#ffffff',
  textLight: '#6b7280',
  border: '#e5e7eb',
};

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onAddExpense: () => void;
}

export default function BottomNav({ activeTab, onTabChange, onAddExpense }: BottomNavProps) {
  const tabs = [
    { key: 'home', label: 'Home', icon: 'home' },
    { key: 'budgets', label: 'Budgets', icon: 'chart-pie' },
    { key: 'savings', label: 'Savings', icon: 'piggy-bank' },
    { key: 'investments', label: 'Investments', icon: 'trending-up' },
    { key: 'loans', label: 'Loans', icon: 'cash' },
    { key: 'import', label: 'Import', icon: 'import' },
  ];

  return (
    <View style={styles.bottomNav}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={styles.navItem}
          onPress={() => onTabChange(tab.key)}
        >
          <MaterialCommunityIcons
            name={tab.icon as any}
            size={22}
            color={activeTab === tab.key ? COLORS.primary : COLORS.textLight}
          />
          <Text style={[styles.navLabel, activeTab === tab.key && styles.navLabelActive]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
      
      <TouchableOpacity
        style={[styles.navItem, styles.addButton]}
        onPress={onAddExpense}
      >
        <MaterialCommunityIcons name="plus" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
    backgroundColor: COLORS.surface,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    height: '100%',
  },
  addButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    marginBottom: 8,
  },
  navLabel: {
    fontSize: 10,
    color: COLORS.textLight,
    marginTop: 4,
  },
  navLabelActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
});