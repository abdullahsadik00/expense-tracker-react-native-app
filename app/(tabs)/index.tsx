// app/(tabs)/index.tsx
import AddTransactionModal from '@/components/AddTransactionModal';
import Header from '@/components/Header';
import { BankAccount, Budget, db, Transaction } from '@/lib/database';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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
  income: '#10b981',
  expense: '#ef4444',
};

export default function HomeScreen() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAddTransaction, setShowAddTransaction] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [transactionsData, accountsData, budgetsData] = await Promise.all([
        db.getTransactions(),
        db.getBankAccounts(),
        db.getBudgets()
      ]);
      setTransactions(transactionsData);
      setBankAccounts(accountsData);
      setBudgets(budgetsData);
    } catch (error) {
      console.error('Load error:', error);
      if (!loading) {
        Alert.alert('Error', 'Failed to load data');
      }
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  const handleTransactionAdded = () => {
    loadData();
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Calculate dashboard metrics
  const totalBalance = bankAccounts.reduce((sum, account) => sum + account.current_balance, 0);
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const netSavings = totalIncome - totalExpenses;

  // Recent transactions (last 5)
  const recentTransactions = transactions.slice(0, 5);

  // Budget progress
  const activeBudgets = budgets.filter(budget => {
    const budgetMonth = new Date(budget.month).getMonth();
    const currentMonth = new Date().getMonth();
    return budgetMonth === currentMonth;
  });

  // Show loading indicator
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
        <Header title="Home" subtitle="Your financial overview" />
        <View style={styles.loadingContainer}>
          <MaterialCommunityIcons name="loading" size={48} color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
    <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
    <Header title="Home" subtitle="Your financial overview" />
    
    <ScrollView 
      style={styles.scroll}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => setShowAddTransaction(true)}
          >
            <MaterialCommunityIcons name="plus-circle" size={24} color={COLORS.primary} />
            <Text style={styles.quickActionText}>Add Transaction</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionButton}>
            <MaterialCommunityIcons name="chart-pie" size={24} color={COLORS.accent} />
            <Text style={styles.quickActionText}>Budgets</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionButton}>
            <MaterialCommunityIcons name="trending-up" size={24} color={COLORS.secondary} />
            <Text style={styles.quickActionText}>Reports</Text>
          </TouchableOpacity>
        </View>

        {/* Dashboard Cards */}
        <View style={styles.dashboardSection}>
          <Text style={styles.sectionTitle}>Financial Overview</Text>
          <View style={styles.dashboardGrid}>
            <View style={styles.dashboardCard}>
              <MaterialCommunityIcons name="wallet" size={24} color={COLORS.primary} />
              <Text style={styles.dashboardValue}>₹{totalBalance.toLocaleString()}</Text>
              <Text style={styles.dashboardLabel}>Total Balance</Text>
            </View>
            <View style={styles.dashboardCard}>
              <MaterialCommunityIcons name="arrow-down" size={24} color={COLORS.income} />
              <Text style={styles.dashboardValue}>₹{totalIncome.toLocaleString()}</Text>
              <Text style={styles.dashboardLabel}>Income</Text>
            </View>
            <View style={styles.dashboardCard}>
              <MaterialCommunityIcons name="arrow-up" size={24} color={COLORS.expense} />
              <Text style={styles.dashboardValue}>₹{totalExpenses.toLocaleString()}</Text>
              <Text style={styles.dashboardLabel}>Expenses</Text>
            </View>
            <View style={styles.dashboardCard}>
              <MaterialCommunityIcons 
                name="piggy-bank" 
                size={24} 
                color={netSavings >= 0 ? COLORS.secondary : COLORS.danger} 
              />
              <Text style={[
                styles.dashboardValue,
                { color: netSavings >= 0 ? COLORS.secondary : COLORS.danger }
              ]}>
                ₹{Math.abs(netSavings).toLocaleString()}
              </Text>
              <Text style={styles.dashboardLabel}>
                {netSavings >= 0 ? 'Savings' : 'Deficit'}
              </Text>
            </View>
          </View>
        </View>

        {/* Budget Progress */}
        {activeBudgets.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Current Budgets</Text>
              <TouchableOpacity>
                <Text style={styles.seeAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            {activeBudgets.slice(0, 3).map((budget) => {
              const progress = (budget.spent_amount / budget.amount) * 100;
              const progressColor = progress >= 100 ? COLORS.danger : progress >= 80 ? COLORS.warning : COLORS.secondary;
              
              return (
                <View key={budget.id} style={styles.budgetItem}>
                  <View style={styles.budgetInfo}>
                    <Text style={styles.budgetName}>Budget Category</Text>
                    <Text style={styles.budgetAmount}>
                      ₹{budget.spent_amount.toLocaleString()} / ₹{budget.amount.toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.progressContainer}>
                    <View style={styles.progressBackground}>
                      <View 
                        style={[
                          styles.progressFill,
                          { width: `${Math.min(progress, 100)}%`, backgroundColor: progressColor }
                        ]} 
                      />
                    </View>
                    <Text style={styles.progressText}>{Math.min(progress, 100).toFixed(0)}%</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Recent Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity onPress={() => router.push('/transactions')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {recentTransactions.length > 0 ? (
            recentTransactions.map((transaction) => (
              <View key={transaction.id} style={styles.transactionCard}>
                <View style={styles.transactionIcon}>
                  <MaterialCommunityIcons 
                    name={transaction.type === 'income' ? 'arrow-down' : 'arrow-up'} 
                    size={20} 
                    color={transaction.type === 'income' ? COLORS.income : COLORS.expense} 
                  />
                </View>
                <View style={styles.transactionDetails}>
                  <Text style={styles.transactionDescription} numberOfLines={1}>
                    {transaction.description}
                  </Text>
                  <Text style={styles.transactionMeta}>
                    {transaction.merchant && `${transaction.merchant} • `}
                    {new Date(transaction.transaction_date).toLocaleDateString()}
                  </Text>
                </View>
                <Text style={[
                  styles.transactionAmount,
                  transaction.type === 'income' ? styles.income : styles.expense
                ]}>
                  {transaction.type === 'income' ? '+' : '-'}₹{Math.abs(transaction.amount).toLocaleString()}
                </Text>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="receipt" size={48} color={COLORS.textLight} />
              <Text style={styles.emptyTitle}>No Transactions</Text>
              <Text style={styles.emptySubtitle}>
                Start by adding your first transaction
              </Text>
              <TouchableOpacity 
                style={styles.addButton}
                onPress={() => setShowAddTransaction(true)}
              >
                <Text style={styles.addButtonText}>Add Transaction</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Bank Accounts Summary */}
        {bankAccounts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Bank Accounts</Text>
            {bankAccounts.map((account) => (
              <View key={account.id} style={styles.accountCard}>
                <MaterialCommunityIcons name="bank" size={20} color={COLORS.primary} />
                <View style={styles.accountInfo}>
                  <Text style={styles.accountName}>{account.bank_name}</Text>
                  <Text style={styles.accountNumber}>{account.account_number}</Text>
                </View>
                <Text style={styles.accountBalance}>₹{account.current_balance.toLocaleString()}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Add Transaction Modal */}
      <AddTransactionModal
        visible={showAddTransaction}
        onClose={() => setShowAddTransaction(false)}
        onTransactionAdded={handleTransactionAdded}
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
  quickActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  quickActionText: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
  dashboardSection: {
    padding: 20,
  },
  section: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  dashboardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  dashboardCard: {
    width: '48%',
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 0,
    marginLeft:0
  },
  dashboardValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginVertical: 8,
  },
  dashboardLabel: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  budgetItem: {
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
  budgetInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  budgetName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  budgetAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textLight,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBackground: {
    flex: 1,
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textLight,
    minWidth: 30,
  },
  transactionCard: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  transactionMeta: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  income: {
    color: COLORS.income,
  },
  expense: {
    color: COLORS.expense,
  },
  accountCard: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  accountInfo: {
    flex: 1,
    marginLeft: 12,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  accountNumber: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  accountBalance: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
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
  addButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});