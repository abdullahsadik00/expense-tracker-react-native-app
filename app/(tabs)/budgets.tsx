import AddBudgetModal from '@/components/AddBudgetModal';
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
import { Budget, Category, db } from '../../lib/database';

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

export default function BudgetsScreen() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddBudget, setShowAddBudget] = useState(false); // Add this line

  const loadData = async () => {
    try {
      const [budgetsData, categoriesData] = await Promise.all([
        db.getBudgets(),
        db.getCategories()
      ]);
      setBudgets(budgetsData);
      setCategories(categoriesData);
    } catch (error) {
      Alert.alert('Error', 'Failed to load budgets');
    } finally {
      setRefreshing(false);
    }
  };
  const handleBudgetAdded = () => {
    loadData(); // Refresh the list
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.name || 'All Categories';
  };

  const getProgressPercentage = (spent: number, total: number) => {
    return Math.min((spent / total) * 100, 100);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return COLORS.danger;
    if (percentage >= 75) return COLORS.accent;
    return COLORS.secondary;
  };

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
            <TouchableOpacity style={styles.addButton} 
            onPress={() => {
              console.log('Add Budget button clicked')
              setShowAddBudget(true); // 👈 Show the modal
              ;
            }}>
              <MaterialCommunityIcons name="plus" size={20} color="#fff" />
              <Text style={styles.addButtonText}>Add Budget</Text>
            </TouchableOpacity>
          </View>

          {budgets.length > 0 ? (
            budgets.map((budget) => {
              const progress = getProgressPercentage(budget.spent_amount, budget.amount);
              const progressColor = getProgressColor(progress);
              
              return (
                <View key={budget.id} style={styles.budgetCard}>
                  <View style={styles.budgetHeader}>
                    <View>
                      <Text style={styles.budgetName}>
                        {getCategoryName(budget.category_id || '')}
                      </Text>
                      <Text style={styles.budgetMonth}>
                        {new Date(budget.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </Text>
                    </View>
                    <View style={styles.budgetAmounts}>
                      <Text style={styles.spentAmount}>₹{budget.spent_amount.toFixed(2)}</Text>
                      <Text style={styles.totalAmount}>/ ₹{budget.amount.toFixed(2)}</Text>
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
                    <Text style={styles.remainingText}>
                      ₹{(budget.amount - budget.spent_amount).toFixed(2)} remaining
                    </Text>
                    {budget.rollover_unused && (
                      <MaterialCommunityIcons name="autorenew" size={16} color={COLORS.primary} />
                    )}
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
              <TouchableOpacity style={styles.createBudgetButton}>
                <Text style={styles.createBudgetText}>Create Your First Budget</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Budget Tips */}
        <View style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>Budgeting Tips</Text>
          <View style={styles.tipItem}>
            <MaterialCommunityIcons name="lightbulb" size={20} color={COLORS.accent} />
            <Text style={styles.tipText}>Set realistic budgets based on your past spending</Text>
          </View>
          <View style={styles.tipItem}>
            <MaterialCommunityIcons name="lightbulb" size={20} color={COLORS.accent} />
            <Text style={styles.tipText}>Review and adjust budgets monthly</Text>
          </View>
          <View style={styles.tipItem}>
            <MaterialCommunityIcons name="lightbulb" size={20} color={COLORS.accent} />
            <Text style={styles.tipText}>Use rollover for flexible categories</Text>
          </View>
        </View>
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
  budgetName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  budgetMonth: {
    fontSize: 14,
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
  remainingText: {
    fontSize: 14,
    color: COLORS.textLight,
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