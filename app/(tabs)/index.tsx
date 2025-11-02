import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View
} from 'react-native';

import { backupService } from '../../lib/backup';
import { db, Transaction } from '../../lib/database';

// Import Components
import AddExpenseModal from '../../components/AddExpenseModal';
import BalanceCard from '../../components/BalanceCard';
import BottomNav from '../../components/BottomNav';
import CategoryBreakdown from '../../components/CategoryBreakdown';
import ExpenseItem from '../../components/ExpenseItem';
import Header from '../../components/Header';
import StatsCard from '../../components/StatsCard';

// Import Tab Screens
import BudgetsScreen from './budgets';
// import SavingsScreen from './savings';
import ImportScreen from './import';
import InvestmentsScreen from './investments';
import LoansScreen from './loans';

const COLORS = {
  background: '#f8fafc',
  surface: '#ffffff',
  text: '#1f2937',
  textLight: '#6b7280',
};

const EXPENSE_CATEGORIES = [
  { id: '1', name: 'Food', icon: 'food', color: '#f59e0b' },
  { id: '2', name: 'Transport', icon: 'car', color: '#8b5cf6' },
  { id: '3', name: 'Shopping', icon: 'shopping', color: '#ec4899' },
  { id: '4', name: 'Bills', icon: 'receipt', color: '#3b82f6' },
  { id: '5', name: 'Entertainment', icon: 'movie', color: '#06b6d4' },
  { id: '6', name: 'Health', icon: 'hospital-box', color: '#10b981' },
  { id: '7', name: 'Other', icon: 'dots-horizontal', color: '#6b7280' },
];

export default function MainApp() {
  const params = useLocalSearchParams();
  const initialTab = params.tab as string || 'home';
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [activeTab, setActiveTab] = useState(initialTab);
  const [showAddExpense, setShowAddExpense] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const transactionsData = await db.getTransactions();
      setTransactions(transactionsData);
    } catch (error) {
      Alert.alert('Error', 'Failed to load data');
      console.error('Load error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleAddExpense = async ({ amount, description, categoryId }: { amount: string; description: string; categoryId: string }) => {
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    try {
      const transactionData = {
        bank_account_id: 'default_account',
        category_id: categoryId,
        person_id: 'default_user',
        transaction_date: new Date().toISOString().split('T')[0],
        amount: -numericAmount,
        type: 'expense',
        description: description,
        merchant: '',
        is_recurring: false,
        is_investment: false,
        is_verified: true,
      } as const;

      const newTransaction = await db.createTransaction(transactionData);
      setTransactions(prev => [newTransaction, ...prev]);
      setShowAddExpense(false);
      Alert.alert('Success', 'Expense added successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to add expense');
    }
  };

  const handleDeleteExpense = async (id: string) => {
    Alert.alert(
      'Delete Expense',
      'Are you sure you want to delete this expense?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await db.deleteTransaction(id);
              setTransactions(prev => prev.filter(t => t.id !== id));
            } catch (error) {
              Alert.alert('Error', 'Failed to delete expense');
            }
          },
        },
      ]
    );
  };

  const exportData = async () => {
    try {
      await backupService.exportData();
    } catch (error) {
      Alert.alert('Error', 'Failed to export data');
    }
  };

  // Calculations for home screen
  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const averageExpense = transactions.length > 0 ? totalExpenses / transactions.length : 0;
  const highestExpense = transactions.length > 0 ? 
    Math.max(...transactions.map(e => Math.abs(e.amount))) : 0;

  const categoryStats = EXPENSE_CATEGORIES.map(cat => ({
    id: cat.id,
    name: cat.name,
    color: cat.color,
    total: transactions
      .filter(exp => exp.category_id === cat.id)
      .reduce((sum, exp) => sum + Math.abs(exp.amount), 0),
    count: transactions.filter(exp => exp.category_id === cat.id).length
  }));

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'home':
        return (
          <ScrollView 
            style={styles.scroll} 
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            <BalanceCard totalExpenses={totalExpenses} />

            {/* Quick Stats */}
            <View style={styles.statsContainer}>
              <StatsCard 
                icon="chart-pie" 
                value={transactions.length.toString()} 
                label="Transactions" 
              />
              <StatsCard 
                icon="trending-up" 
                value={`$${averageExpense.toFixed(0)}`} 
                label="Average" 
                color="#10b981"
              />
              <StatsCard 
                icon="calendar" 
                value={`$${highestExpense.toFixed(0)}`} 
                label="Highest" 
                color="#f59e0b"
              />
            </View>

            {/* Recent Expenses */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Expenses</Text>
                <Text style={styles.seeAll} onPress={() => setActiveTab('list')}>
                  See all
                </Text>
              </View>

              {transactions.length > 0 ? (
                transactions.slice(0, 5).map((transaction) => (
                  <ExpenseItem
                    key={transaction.id}
                    id={transaction.id}
                    amount={transaction.amount}
                    description={transaction.description}
                    categoryId={transaction.category_id}
                    date={transaction.transaction_date}
                  />
                ))
              ) : (
                <Text style={styles.emptyText}>No expenses yet</Text>
              )}
            </View>

            {/* Category Breakdown */}
            <CategoryBreakdown categories={categoryStats} />
          </ScrollView>
        );

      case 'budgets':
        return <BudgetsScreen />;
      
      // case 'savings':
      //   return <SavingsScreen />;
      
      case 'investments':
        return <InvestmentsScreen />;
      
      case 'loans':
        return <LoansScreen />;
      
      case 'import':
        return <ImportScreen />;
      
      case 'list':
        return (
          <ScrollView 
            style={styles.scroll}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>All Transactions</Text>
                <Text style={styles.seeAll} onPress={exportData}>
                  Export
                </Text>
              </View>
              {transactions.length > 0 ? (
                transactions.map((transaction) => (
                  <ExpenseItem
                    key={transaction.id}
                    id={transaction.id}
                    amount={transaction.amount}
                    description={transaction.description}
                    categoryId={transaction.category_id}
                    date={transaction.transaction_date}
                    showDelete={true}
                    onDelete={handleDeleteExpense}
                  />
                ))
              ) : (
                <Text style={styles.emptyText}>No transactions to display</Text>
              )}
            </View>
          </ScrollView>
        );

      default:
        return (
          <View style={styles.centerContainer}>
            <Text style={styles.emptyText}>Screen not found</Text>
          </View>
        );
    }
  };

  if (loading && !refreshing && activeTab === 'home') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1e3a8a" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading your finances...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1e3a8a" />
      
      {/* Show header only on home and list screens */}
      {(activeTab === 'home' || activeTab === 'list') && (
        <Header title="Expense Tracker" subtitle="Manage your finances" />
      )}

      {renderActiveScreen()}

      {/* Add Expense Modal */}
      <AddExpenseModal
        visible={showAddExpense}
        onClose={() => setShowAddExpense(false)}
        onAddExpense={handleAddExpense}
      />

      {/* Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onAddExpense={() => setShowAddExpense(true)}
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
    paddingBottom: 80,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 28,
    gap: 12,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  seeAll: {
    fontSize: 14,
    color: '#1e3a8a',
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
    marginVertical: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.textLight,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});