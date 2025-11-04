// app/(tabs)/reports.tsx
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Header from '../../components/Header';
import { db } from '../../lib/database';

const { width } = Dimensions.get('window');
const COLORS = {
  primary: '#1e3a8a',
  background: '#f8fafc',
  income: '#10B981',
  expense: '#EF4444',
};

interface ReportData {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  categoryBreakdown: { category: string; amount: number; percentage: number }[];
  monthlyTrends: { month: string; income: number; expenses: number }[];
  topExpenses: { description: string; amount: number; date: string }[];
}

export default function ReportsScreen() {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');

  useEffect(() => {
    loadReportData();
  }, [timeRange]);

  const loadReportData = async () => {
    try {
      setLoading(true);
      const transactions = await db.getTransactions();
      
      // Filter transactions by time range
      const filteredTransactions = filterTransactionsByTimeRange(transactions, timeRange);
      
      // Calculate report data
      const data = calculateReportData(filteredTransactions);
      setReportData(data);
    } catch (error) {
      console.error('Error loading report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterTransactionsByTimeRange = (transactions: any[], range: string) => {
    const now = new Date();
    let startDate = new Date();

    switch (range) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(now.getMonth() - 1);
    }

    return transactions.filter(t => new Date(t.transaction_date) >= startDate);
  };

  const calculateReportData = (transactions: any[]): ReportData => {
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const netBalance = totalIncome - totalExpenses;

    // Category breakdown
    const categoryMap = new Map();
    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const category = t.category_name || 'Uncategorized';
        const current = categoryMap.get(category) || 0;
        categoryMap.set(category, current + Math.abs(t.amount));
      });

    const categoryBreakdown = Array.from(categoryMap.entries())
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: (amount / totalExpenses) * 100
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 8); // Top 8 categories

    // Top expenses
    const topExpenses = transactions
      .filter(t => t.type === 'expense')
      .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
      .slice(0, 10)
      .map(t => ({
        description: t.description,
        amount: Math.abs(t.amount),
        date: new Date(t.transaction_date).toLocaleDateString()
      }));

    return {
      totalIncome,
      totalExpenses,
      netBalance,
      categoryBreakdown,
      monthlyTrends: [], // You can implement this with more complex logic
      topExpenses
    };
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Header title="Financial Reports" subtitle="Analyzing your spending patterns" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Generating reports...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Financial Reports" subtitle="Analyze your spending patterns" />
      
      <ScrollView style={styles.scroll}>
        {/* Time Range Selector */}
        <View style={styles.timeRangeContainer}>
          <Text style={styles.sectionTitle}>Time Period:</Text>
          <View style={styles.timeRangeButtons}>
            {(['week', 'month', 'year'] as const).map(range => (
              <TouchableOpacity
                key={range}
                style={[
                  styles.timeRangeButton,
                  timeRange === range && styles.timeRangeButtonActive
                ]}
                onPress={() => setTimeRange(range)}
              >
                <Text style={[
                  styles.timeRangeButtonText,
                  timeRange === range && styles.timeRangeButtonTextActive
                ]}>
                  {range.charAt(0).toUpperCase() + range.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {reportData && (
          <>
            {/* Summary Cards */}
            <View style={styles.summaryContainer}>
              <View style={[styles.summaryCard, styles.incomeCard]}>
                <Text style={styles.summaryLabel}>Total Income</Text>
                <Text style={styles.summaryAmount}>₹{reportData.totalIncome.toFixed(2)}</Text>
              </View>
              
              <View style={[styles.summaryCard, styles.expenseCard]}>
                <Text style={styles.summaryLabel}>Total Expenses</Text>
                <Text style={styles.summaryAmount}>₹{reportData.totalExpenses.toFixed(2)}</Text>
              </View>
              
              <View style={[
                styles.summaryCard, 
                styles.netCard,
                reportData.netBalance >= 0 ? styles.positiveNet : styles.negativeNet
              ]}>
                <Text style={styles.summaryLabel}>Net Balance</Text>
                <Text style={styles.summaryAmount}>
                  ₹{Math.abs(reportData.netBalance).toFixed(2)}
                </Text>
                <Text style={styles.netIndicator}>
                  {reportData.netBalance >= 0 ? 'Surplus' : 'Deficit'}
                </Text>
              </View>
            </View>

            {/* Category Breakdown */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Spending by Category</Text>
              {reportData.categoryBreakdown.map((item, index) => (
                <View key={index} style={styles.categoryItem}>
                  <View style={styles.categoryHeader}>
                    <Text style={styles.categoryName}>{item.category}</Text>
                    <Text style={styles.categoryAmount}>₹{item.amount.toFixed(2)}</Text>
                  </View>
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill,
                        { width: `${Math.min(item.percentage, 100)}%` }
                      ]} 
                    />
                  </View>
                  <Text style={styles.percentageText}>{item.percentage.toFixed(1)}%</Text>
                </View>
              ))}
            </View>

            {/* Top Expenses */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Top Expenses</Text>
              {reportData.topExpenses.map((expense, index) => (
                <View key={index} style={styles.expenseItem}>
                  <View style={styles.expenseInfo}>
                    <Text style={styles.expenseDescription} numberOfLines={1}>
                      {expense.description}
                    </Text>
                    <Text style={styles.expenseDate}>{expense.date}</Text>
                  </View>
                  <Text style={styles.expenseAmount}>-₹{expense.amount.toFixed(2)}</Text>
                </View>
              ))}
            </View>

            {/* Quick Stats */}
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{reportData.topExpenses.length}</Text>
                <Text style={styles.statLabel}>Transactions</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  ₹{(reportData.totalExpenses / reportData.topExpenses.length || 0).toFixed(2)}
                </Text>
                <Text style={styles.statLabel}>Avg. Expense</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {reportData.categoryBreakdown.length}
                </Text>
                <Text style={styles.statLabel}>Categories</Text>
              </View>
            </View>
          </>
        )}

        {!reportData && !loading && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No transaction data available</Text>
            <Text style={styles.emptyStateSubtext}>
              Add some transactions using SMS import to see reports
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  timeRangeContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  timeRangeButtons: {
    flexDirection: 'row',
    marginTop: 8,
  },
  timeRangeButton: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 4,
    backgroundColor: '#F3F4F6',
  },
  timeRangeButtonActive: {
    backgroundColor: COLORS.primary,
  },
  timeRangeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  timeRangeButtonTextActive: {
    color: 'white',
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  incomeCard: {
    backgroundColor: '#D1FAE5',
  },
  expenseCard: {
    backgroundColor: '#FEE2E2',
  },
  netCard: {
    backgroundColor: '#E0E7FF',
  },
  positiveNet: {
    backgroundColor: '#D1FAE5',
  },
  negativeNet: {
    backgroundColor: '#FEE2E2',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  netIndicator: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 2,
  },
  section: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#1F2937',
  },
  categoryItem: {
    marginBottom: 16,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  categoryAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  percentageText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'right',
  },
  expenseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  expenseInfo: {
    flex: 1,
    marginRight: 12,
  },
  expenseDescription: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  expenseDate: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  expenseAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.expense,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#6B7280',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});