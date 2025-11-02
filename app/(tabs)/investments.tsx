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
import AddInvestmentModal from '../../components/AddInvestmentModal'; // 👈 Import this
import Header from '../../components/Header';
import { db, Investment } from '../../lib/database';

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

export default function InvestmentsScreen() {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false); // 👈 New


  const loadData = async () => {
    try {
      const investmentsData = await db.getInvestments();
      setInvestments(investmentsData);
    } catch (error) {
      Alert.alert('Error', 'Failed to load investments');
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

  const getReturnPercentage = (investment: Investment) => {
    if (!investment.current_value) return 0;
    return ((investment.current_value - investment.investment_amount) / investment.investment_amount) * 100;
  };

  const getReturnColor = (returnPercent: number) => {
    return returnPercent >= 0 ? COLORS.secondary : COLORS.danger;
  };

  const getStatus = (investment: Investment) => {
    if (investment.end_date && new Date(investment.end_date) < new Date()) {
      return 'Completed';
    }
    return investment.is_active ? 'Active' : 'Inactive';
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <Header title="Investments" subtitle="Track your investment portfolio" />

      <ScrollView
        style={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Portfolio Summary */}
        <View style={styles.portfolioSummary}>
          <Text style={styles.portfolioTitle}>Portfolio Summary</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Invested</Text>
              <Text style={styles.summaryValue}>
                ₹{investments.reduce((sum, inv) => sum + inv.investment_amount, 0).toLocaleString()}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Current Value</Text>
              <Text style={styles.summaryValue}>
                ₹{investments.reduce((sum, inv) => sum + (inv.current_value || 0), 0).toLocaleString()}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Return</Text>
              <Text style={[styles.summaryValue, { color: COLORS.secondary }]}>
                +₹{investments.reduce((sum, inv) => sum + ((inv.current_value || 0) - inv.investment_amount), 0).toLocaleString()}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Investments</Text>
            <TouchableOpacity style={styles.addButton}>
              <MaterialCommunityIcons name="plus" size={20} color="#fff" />
              <Text style={styles.addButtonText}>Add Investment</Text>
            </TouchableOpacity>
          </View>

          {investments.length > 0 ? (
            investments.map((investment) => {
              const returnPercent = getReturnPercentage(investment);
              const returnColor = getReturnColor(returnPercent);
              const status = getStatus(investment);

              return (
                <View key={investment.id} style={styles.investmentCard}>
                  <View style={styles.investmentHeader}>
                    <View style={styles.investmentInfo}>
                      <Text style={styles.investmentName}>{investment.name}</Text>
                      <Text style={styles.investmentType}>{investment.type}</Text>
                    </View>
                    <View style={[styles.statusBadge,
                    { backgroundColor: status === 'Active' ? COLORS.secondary : COLORS.textLight }]}>
                      <Text style={styles.statusText}>{status}</Text>
                    </View>
                  </View>

                  <View style={styles.investmentDetails}>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Invested</Text>
                      <Text style={styles.detailValue}>₹{investment.investment_amount.toLocaleString()}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Current Value</Text>
                      <Text style={styles.detailValue}>
                        ₹{(investment.current_value || 0).toLocaleString()}
                      </Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Return</Text>
                      <Text style={[styles.detailValue, { color: returnColor }]}>
                        {returnPercent >= 0 ? '+' : ''}{returnPercent.toFixed(1)}%
                      </Text>
                    </View>
                  </View>

                  <View style={styles.investmentFooter}>
                    <View style={styles.dateInfo}>
                      <MaterialCommunityIcons name="calendar-start" size={14} color={COLORS.textLight} />
                      <Text style={styles.dateText}>
                        Started: {new Date(investment.start_date).toLocaleDateString()}
                      </Text>
                    </View>
                    {investment.sip_frequency && (
                      <View style={styles.sipInfo}>
                        <MaterialCommunityIcons name="repeat" size={14} color={COLORS.primary} />
                        <Text style={styles.sipText}>
                          SIP: ₹{investment.investment_amount}/{investment.sip_frequency}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="trending-up" size={64} color={COLORS.textLight} />
              <Text style={styles.emptyTitle}>No Investments</Text>
              <Text style={styles.emptySubtitle}>
                Start building your investment portfolio by adding your first investment.
              </Text>
              <TouchableOpacity style={styles.createInvestmentButton}>
                <Text style={styles.createInvestmentText}>Add Investment</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
      {/* 👇 Modal at the bottom */}
      <AddInvestmentModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onAddExpense={loadData} // Reload list after adding
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
  portfolioSummary: {
    backgroundColor: COLORS.surface,
    margin: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  portfolioTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
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
  investmentCard: {
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
  investmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  investmentInfo: {
    flex: 1,
  },
  investmentName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  investmentType: {
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
  investmentDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailItem: {
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  investmentFooter: {
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
  sipInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sipText: {
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
  createInvestmentButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createInvestmentText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});