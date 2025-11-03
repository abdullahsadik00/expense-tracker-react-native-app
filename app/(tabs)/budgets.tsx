// app/budgets.tsx
import AddBudgetModal from '@/components/AddBudgetModal';
import Header from '@/components/Header';
import { BankAccount, Budget, Category, db, Person } from '@/lib/database';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
// import Header from '../components/Header';
// import AddBudgetModal from '../components/AddBudgetModal';
// import { Budget, Category, db, Person, BankAccount } from '../lib/database';

const COLORS = {
  primary: '#1e3a8a',
  secondary: '#10b981',
  accent: '#f59e0b',
  background: '#f8fafc',
  surface: '#ffffff',
  text: '#1f2937',
  textLight: '#6b7280',
  danger: '#ef4444',
  border: '#e5e7eb',
  warning: '#f59e0b',
};

export default function BudgetsScreen() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [persons, setPersons] = useState<Person[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddBudget, setShowAddBudget] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [budgetsData, categoriesData, personsData, accountsData] = await Promise.all([
        db.getBudgets(),
        db.getCategories(),
        db.getPersons(),
        db.getBankAccounts()
      ]);
      setBudgets(budgetsData);
      setCategories(categoriesData);
      setPersons(personsData);
      setBankAccounts(accountsData);
    } catch (error) {
      console.error('Error loading budgets:', error);
      Alert.alert('Error', 'Failed to load budgets');
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  const handleBudgetAdded = () => {
    loadData();
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return 'All Categories';
    const category = categories.find(c => c.id === categoryId);
    return category?.name || 'Unknown Category';
  };

  const getPersonName = (personId: string) => {
    const person = persons.find(p => p.id === personId);
    return person?.name || 'Unknown Person';
  };

  const getBankAccountName = (accountId: string | null) => {
    if (!accountId) return 'All Accounts';
    const account = bankAccounts.find(a => a.id === accountId);
    return account?.bank_name || 'Unknown Account';
  };

  const getProgressPercentage = (spent: number, total: number) => {
    if (total === 0) return 0;
    return Math.min((spent / total) * 100, 100);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return COLORS.danger;
    if (percentage >= 80) return COLORS.warning;
    return COLORS.secondary;
  };

  const getStatusText = (percentage: number) => {
    if (percentage >= 100) return 'Over Budget';
    if (percentage >= 80) return 'Almost There';
    return 'On Track';
  };

  const formatMonth = (monthString: string) => {
    try {
      return new Date(monthString).toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric' 
      });
    } catch {
      return monthString;
    }
  };

  // Show loading indicator
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
        <Header title="Budgets" subtitle="Manage your spending limits" />
        <View style={styles.loadingContainer}>
          <MaterialCommunityIcons name="loading" size={48} color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading budgets...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <Header title="Budgets" subtitle="Manage your spending limits" />
      
      <ScrollView 
        style={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Monthly Budgets</Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => setShowAddBudget(true)}
            >
              <MaterialCommunityIcons name="plus" size={20} color="#fff" />
              <Text style={styles.addButtonText}>Add Budget</Text>
            </TouchableOpacity>
          </View>

          {budgets.length > 0 ? (
            budgets.map((budget) => {
              const progress = getProgressPercentage(budget.spent_amount, budget.amount);
              const progressColor = getProgressColor(progress);
              const statusText = getStatusText(progress);
              const remaining = budget.amount - budget.spent_amount;
              
              return (
                <View key={budget.id} style={styles.budgetCard}>
                  <View style={styles.budgetHeader}>
                    <View style={styles.budgetInfo}>
                      <Text style={styles.budgetName}>
                        {getCategoryName(budget.category_id??null)}
                      </Text>
                      <Text style={styles.budgetMeta}>
                        {getPersonName(budget.person_id)} • {getBankAccountName(budget.bank_account_id ?? null)}
                      </Text>
                      <Text style={styles.budgetMonth}>
                        {formatMonth(budget.month)}
                      </Text>
                    </View>
                    <View style={styles.budgetAmounts}>
                      <Text style={styles.spentAmount}>₹{budget.spent_amount.toLocaleString()}</Text>
                      <Text style={styles.totalAmount}>/ ₹{budget.amount.toLocaleString()}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.progressContainer}>
                    <View style={styles.progressBackground}>
                      <View 
                        style={[
                          styles.progressFill,
                          { width: `${progress}%`, backgroundColor: progressColor }
                        ]} 
                      />
                    </View>
                    <Text style={styles.progressText}>{progress.toFixed(0)}%</Text>
                  </View>
                  
                  <View style={styles.budgetFooter}>
                    <View style={styles.footerLeft}>
                      <Text style={styles.remainingText}>
                        ₹{remaining.toLocaleString()} remaining
                      </Text>
                      <Text style={[styles.statusText, { color: progressColor }]}>
                        {statusText}
                      </Text>
                    </View>
                    <View style={styles.footerRight}>
                      {budget.rollover_unused && (
                        <MaterialCommunityIcons 
                          name="autorenew" 
                          size={16} 
                          color={COLORS.primary} 
                        />
                      )}
                      {budget.notifications_enabled && (
                        <MaterialCommunityIcons 
                          name="bell-outline" 
                          size={16} 
                          color={COLORS.accent} 
                          style={styles.footerIcon}
                        />
                      )}
                    </View>
                  </View>
                </View>
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="chart-pie" size={64} color={COLORS.textLight} />
              <Text style={styles.emptyTitle}>No Budgets Set</Text>
              <Text style={styles.emptySubtitle}>
                Create budgets to track your spending and save money
              </Text>
              <TouchableOpacity 
                style={styles.createBudgetButton}
                onPress={() => setShowAddBudget(true)}
              >
                <Text style={styles.createBudgetText}>Create Your First Budget</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Budget Tips */}
        {budgets.length > 0 && (
          <View style={styles.tipsSection}>
            <Text style={styles.tipsTitle}>Budgeting Tips</Text>
            <View style={styles.tipItem}>
              <MaterialCommunityIcons name="lightbulb-outline" size={20} color={COLORS.accent} />
              <Text style={styles.tipText}>Set realistic budgets based on your past spending</Text>
            </View>
            <View style={styles.tipItem}>
              <MaterialCommunityIcons name="lightbulb-outline" size={20} color={COLORS.accent} />
              <Text style={styles.tipText}>Review and adjust budgets monthly</Text>
            </View>
            <View style={styles.tipItem}>
              <MaterialCommunityIcons name="lightbulb-outline" size={20} color={COLORS.accent} />
              <Text style={styles.tipText}>Use rollover for flexible categories</Text>
            </View>
          </View>
        )}
      </ScrollView>

      <AddBudgetModal
        visible={showAddBudget}
        onClose={() => setShowAddBudget(false)}
        onBudgetAdded={handleBudgetAdded}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textLight,
  },
  section: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  budgetCard: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  budgetInfo: {
    flex: 1,
  },
  budgetName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  budgetMeta: {
    fontSize: 12,
    color: COLORS.textLight,
    marginBottom: 2,
  },
  budgetMonth: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  budgetAmounts: {
    alignItems: 'flex-end',
  },
  spentAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  totalAmount: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  progressBackground: {
    flex: 1,
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textLight,
    minWidth: 30,
  },
  budgetFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLeft: {
    flex: 1,
  },
  remainingText: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 2,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerIcon: {
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
    marginBottom: 24,
  },
  createBudgetButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createBudgetText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  tipsSection: {
    padding: 20,
    backgroundColor: COLORS.surface,
    margin: 20,
    borderRadius: 12,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
});