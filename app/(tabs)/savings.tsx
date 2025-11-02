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
import { db, SavingsGoal } from '../../lib/database';

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

export default function SavingsScreen() {
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const goals = await db.getSavingsGoals();
      setSavingsGoals(goals);
    } catch (error) {
      Alert.alert('Error', 'Failed to load savings goals');
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

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const getDaysRemaining = (targetDate: string) => {
    const today = new Date();
    const target = new Date(targetDate);
    const diffTime = target.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1: return COLORS.danger;
      case 2: return COLORS.accent;
      case 3: return COLORS.secondary;
      default: return COLORS.textLight;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <Header title="Savings Goals" subtitle="Plan and track your savings" />
      
      <ScrollView 
        style={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <MaterialCommunityIcons name="target" size={24} color={COLORS.primary} />
            <Text style={styles.summaryValue}>{savingsGoals.length}</Text>
            <Text style={styles.summaryLabel}>Active Goals</Text>
          </View>
          <View style={styles.summaryCard}>
            <MaterialCommunityIcons name="currency-inr" size={24} color={COLORS.secondary} />
            <Text style={styles.summaryValue}>
              ₹{savingsGoals.reduce((sum, goal) => sum + goal.current_amount, 0).toLocaleString()}
            </Text>
            <Text style={styles.summaryLabel}>Total Saved</Text>
          </View>
          <View style={styles.summaryCard}>
            <MaterialCommunityIcons name="calendar" size={24} color={COLORS.accent} />
            <Text style={styles.summaryValue}>
              {savingsGoals.filter(goal => goal.target_date && new Date(goal.target_date) > new Date()).length}
            </Text>
            <Text style={styles.summaryLabel}>Ongoing</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Savings Goals</Text>
            <TouchableOpacity style={styles.addButton}>
              <MaterialCommunityIcons name="plus" size={20} color="#fff" />
              <Text style={styles.addButtonText}>New Goal</Text>
            </TouchableOpacity>
          </View>

          {savingsGoals.length > 0 ? (
            savingsGoals.map((goal) => {
              const progress = getProgressPercentage(goal.current_amount, goal.target_amount);
              const daysRemaining = goal.target_date ? getDaysRemaining(goal.target_date) : null;
              
              return (
                <View key={goal.id} style={styles.goalCard}>
                  <View style={styles.goalHeader}>
                    <View style={styles.goalInfo}>
                      <Text style={styles.goalName}>{goal.name}</Text>
                      <Text style={styles.goalType}>{goal.goal_type}</Text>
                    </View>
                    <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(goal.priority) }]}>
                      <Text style={styles.priorityText}>P{goal.priority}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.progressContainer}>
                    <View style={styles.progressBackground}>
                      <View 
                        style={[
                          styles.progressFill,
                          { width: `${progress}%`, backgroundColor: COLORS.secondary }
                        ]} 
                      />
                    </View>
                    <Text style={styles.progressText}>{progress.toFixed(0)}%</Text>
                  </View>
                  
                  <View style={styles.amountContainer}>
                    <Text style={styles.currentAmount}>₹{goal.current_amount.toLocaleString()}</Text>
                    <Text style={styles.targetAmount}>/ ₹{goal.target_amount.toLocaleString()}</Text>
                  </View>
                  
                  <View style={styles.goalFooter}>
                    {goal.target_date && (
                      <View style={styles.dateInfo}>
                        <MaterialCommunityIcons name="calendar" size={14} color={COLORS.textLight} />
                        <Text style={styles.dateText}>
                          {daysRemaining && daysRemaining > 0 ? `${daysRemaining} days left` : 'Target reached'}
                        </Text>
                      </View>
                    )}
                    {goal.auto_save_amount && (
                      <View style={styles.autoSaveInfo}>
                        <MaterialCommunityIcons name="repeat" size={14} color={COLORS.primary} />
                        <Text style={styles.autoSaveText}>
                          Auto: ₹{goal.auto_save_amount}/{goal.auto_save_frequency}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="piggy-bank" size={64} color={COLORS.textLight} />
              <Text style={styles.emptyTitle}>No Savings Goals</Text>
              <Text style={styles.emptySubtitle}>
                Start saving for your dreams by creating a savings goal
              </Text>
              <TouchableOpacity style={styles.createGoalButton}>
                <Text style={styles.createGoalText}>Create Savings Goal</Text>
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
  goalCard: {
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
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  goalInfo: {
    flex: 1,
  },
  goalName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  goalType: {
    fontSize: 14,
    color: COLORS.textLight,
    textTransform: 'capitalize',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
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
  currentAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  targetAmount: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  goalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  autoSaveInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  autoSaveText: {
    fontSize: 12,
    color: COLORS.primary,
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
  createGoalButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createGoalText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});