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
import Header from '../../components/Header';
import { db, Loan } from '../../lib/database';

const COLORS = {
  primary: '#1e3a8a',
  secondary: '#10b981',
  accent: '#f59e0b',
  background: '#f8fafc',
  surface: '#ffffff',
  text: '#1f2937',
  textLight: '#6b7280',
  danger: '#ef4444',
  border: '#e5e7eb'
};

export default function LoansScreen() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const loansData = await db.getLoans();
      setLoans(loansData);
    } catch (error) {
      Alert.alert('Error', 'Failed to load loans');
    } finally {
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

  const getProgressPercentage = (paid: number, total: number) => {
    return Math.min((paid / total) * 100, 100);
  };

  const getDaysRemaining = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getStatusColor = (status: string, dueDate?: string) => {
    if (status === 'completed') return COLORS.secondary;
    if (status === 'overdue') return COLORS.danger;
    if (dueDate && getDaysRemaining(dueDate) <= 7) return COLORS.accent;
    return COLORS.primary;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <Header title="Loans" subtitle="Manage your loans and repayments" />
      
      <ScrollView 
        style={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <MaterialCommunityIcons name="cash" size={24} color={COLORS.primary} />
            <Text style={styles.summaryValue}>{loans.length}</Text>
            <Text style={styles.summaryLabel}>Active Loans</Text>
          </View>
          <View style={styles.summaryCard}>
            <MaterialCommunityIcons name="currency-inr" size={24} color={COLORS.secondary} />
            <Text style={styles.summaryValue}>
              ₹{loans.reduce((sum, loan) => sum + loan.amount_paid, 0).toLocaleString()}
            </Text>
            <Text style={styles.summaryLabel}>Total Paid</Text>
          </View>
          <View style={styles.summaryCard}>
            <MaterialCommunityIcons name="alert" size={24} color={COLORS.danger} />
            <Text style={styles.summaryValue}>
              {loans.filter(loan => loan.is_urgent).length}
            </Text>
            <Text style={styles.summaryLabel}>Urgent</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Loans</Text>
            <TouchableOpacity style={styles.addButton}>
              <MaterialCommunityIcons name="plus" size={20} color="#fff" />
              <Text style={styles.addButtonText}>Add Loan</Text>
            </TouchableOpacity>
          </View>

          {loans.length > 0 ? (
            loans.map((loan) => {
              const progress = getProgressPercentage(loan.amount_paid, loan.total_amount);
              const daysRemaining = loan.due_date ? getDaysRemaining(loan.due_date) : null;
              const statusColor = getStatusColor(loan.status, loan.due_date);
              
              return (
                <View key={loan.id} style={styles.loanCard}>
                  <View style={styles.loanHeader}>
                    <View style={styles.loanInfo}>
                      <Text style={styles.loanDescription}>{loan.description}</Text>
                      <Text style={styles.loanType}>{loan.loan_type}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                      <Text style={styles.statusText}>
                        {loan.status === 'completed' ? 'Paid' : 
                         daysRemaining && daysRemaining <= 0 ? 'Overdue' :
                         daysRemaining && daysRemaining <= 7 ? 'Due Soon' : 'Active'}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.progressContainer}>
                    <View style={styles.progressBackground}>
                      <View 
                        style={[
                          styles.progressFill,
                          { width: `${progress}%`, backgroundColor: statusColor }
                        ]} 
                      />
                    </View>
                    <Text style={styles.progressText}>{progress.toFixed(0)}%</Text>
                  </View>
                  
                  <View style={styles.amountContainer}>
                    <Text style={styles.paidAmount}>₹{loan.amount_paid.toLocaleString()}</Text>
                    <Text style={styles.totalAmount}>/ ₹{loan.total_amount.toLocaleString()}</Text>
                  </View>
                  
                  <View style={styles.loanDetails}>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Principal:</Text>
                      <Text style={styles.detailValue}>₹{loan.principal_amount.toLocaleString()}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Interest Rate:</Text>
                      <Text style={styles.detailValue}>{loan.interest_rate}%</Text>
                    </View>
                    {loan.due_date && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Due Date:</Text>
                        <Text style={styles.detailValue}>
                          {new Date(loan.due_date).toLocaleDateString()} 
                          {daysRemaining && daysRemaining > 0 && ` (${daysRemaining} days)`}
                        </Text>
                      </View>
                    )}
                  </View>
                  
                  {loan.is_urgent && (
                    <View style={styles.urgentBadge}>
                      <MaterialCommunityIcons name="alert" size={14} color="#fff" />
                      <Text style={styles.urgentText}>Urgent</Text>
                    </View>
                  )}
                </View>
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="cash" size={64} color={COLORS.textLight} />
              <Text style={styles.emptyTitle}>No Loans</Text>
              <Text style={styles.emptySubtitle}>
                Track your loans and repayment schedules here
              </Text>
              <TouchableOpacity style={styles.createLoanButton}>
                <Text style={styles.createLoanText}>Add Loan</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
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
  summaryContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  summaryCard: {
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
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginVertical: 8,
  },
  summaryLabel: {
    fontSize: 12,
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
  loanCard: {
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
  loanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  loanInfo: {
    flex: 1,
  },
  loanDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  loanType: {
    fontSize: 14,
    color: COLORS.textLight,
    textTransform: 'capitalize',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
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
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  paidAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  totalAmount: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  loanDetails: {
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
  },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.danger,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    gap: 4,
  },
  urgentText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
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
  createLoanButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createLoanText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});