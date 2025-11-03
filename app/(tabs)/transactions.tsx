// app/transactions.tsx
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    Modal,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

import Header from '@/components/Header';
import { BankAccount, Category, db, Person, Transaction } from '@/lib/database';

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
  income: '#10b981',
  expense: '#ef4444',
};

export default function TransactionsScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [persons, setPersons] = useState<Person[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter states
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [selectedPerson, setSelectedPerson] = useState<string>('');
  const [selectedType, setSelectedType] = useState<'income' | 'expense' | 'transfer' | ''>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchText, setSearchText] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [transactionsData, categoriesData, accountsData, personsData] = await Promise.all([
        db.getTransactions(),
        db.getCategories(),
        db.getBankAccounts(),
        db.getPersons()
      ]);
      setTransactions(transactionsData);
      setFilteredTransactions(transactionsData);
      setCategories(categoriesData);
      setBankAccounts(accountsData);
      setPersons(personsData);
    } catch (error) {
      console.error('Load error:', error);
      Alert.alert('Error', 'Failed to load transactions');
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  const applyFilters = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      
      if (selectedCategory) filters.category_id = selectedCategory;
      if (selectedAccount) filters.bank_account_id = selectedAccount;
      if (selectedPerson) filters.person_id = selectedPerson;
      if (selectedType) filters.type = selectedType;
      if (startDate) filters.start_date = startDate;
      if (endDate) filters.end_date = endDate;
      if (searchText) filters.search = searchText;

      const filteredData = await db.getTransactions(filters);
      setFilteredTransactions(filteredData);
      setShowFilters(false);
    } catch (error) {
      console.error('Filter error:', error);
      Alert.alert('Error', 'Failed to apply filters');
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = async () => {
    setSelectedCategory('');
    setSelectedAccount('');
    setSelectedPerson('');
    setSelectedType('');
    setStartDate('');
    setEndDate('');
    setSearchText('');
    await loadData();
    setShowFilters(false);
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
    return category?.name || 'Unknown Category';
  };

  const getBankAccountName = (accountId: string) => {
    const account = bankAccounts.find(a => a.id === accountId);
    return account?.bank_name || 'Unknown Account';
  };

  const getPersonName = (personId: string) => {
    const person = persons.find(p => p.id === personId);
    return person?.name || 'Unknown Person';
  };

  const formatAmount = (amount: number, type: string) => {
    const absAmount = Math.abs(amount);
    return `${type === 'income' ? '+' : '-'}₹${absAmount.toLocaleString()}`;
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
        <Header title="Transactions" subtitle="View all your transactions" />
        <View style={styles.loadingContainer}>
          <MaterialCommunityIcons name="loading" size={48} color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading transactions...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <Header title="Transactions" subtitle="View all your transactions" />
      
      {/* Search and Filter Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <MaterialCommunityIcons name="magnify" size={20} color={COLORS.textLight} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search transactions..."
            value={searchText}
            onChangeText={setSearchText}
            placeholderTextColor={COLORS.textLight}
          />
        </View>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setShowFilters(true)}
        >
          <MaterialCommunityIcons name="filter-variant" size={20} color={COLORS.primary} />
          <Text style={styles.filterButtonText}>Filters</Text>
        </TouchableOpacity>
      </View>

      {/* Transactions List */}
      <FlatList
        data={filteredTransactions}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.transactionCard}>
            <View style={styles.transactionIcon}>
              <MaterialCommunityIcons 
                name={item.type === 'income' ? 'arrow-down' : 'arrow-up'} 
                size={20} 
                color={item.type === 'income' ? COLORS.income : COLORS.expense} 
              />
            </View>
            <View style={styles.transactionDetails}>
              <Text style={styles.transactionDescription} numberOfLines={1}>
                {item.description}
              </Text>
              <Text style={styles.transactionMeta}>
                {getCategoryName(item.category_id)} • {getBankAccountName(item.bank_account_id)}
              </Text>
              <Text style={styles.transactionMeta}>
                {getPersonName(item.person_id)} • {new Date(item.transaction_date).toLocaleDateString()}
              </Text>
              {item.merchant && (
                <Text style={styles.transactionMerchant}>{item.merchant}</Text>
              )}
            </View>
            <View style={styles.transactionAmountContainer}>
              <Text style={[
                styles.transactionAmount,
                item.type === 'income' ? styles.income : styles.expense
              ]}>
                {formatAmount(item.amount, item.type)}
              </Text>
              <Text style={styles.closingBalance}>
                Balance: ₹{item.closing_balance?.toLocaleString() || '0'}
              </Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="receipt" size={64} color={COLORS.textLight} />
            <Text style={styles.emptyTitle}>No Transactions</Text>
            <Text style={styles.emptySubtitle}>
              {searchText || selectedCategory || selectedAccount ? 
                'No transactions match your filters' : 
                'Start by adding your first transaction'
              }
            </Text>
          </View>
        }
      />

      {/* Filters Modal */}
      <Modal
        visible={showFilters}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilters(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Transactions</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <MaterialCommunityIcons name="close" size={28} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Type Filter */}
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Transaction Type</Text>
                <View style={styles.typeOptions}>
                  {['', 'income', 'expense', 'transfer'].map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.typeOption,
                        selectedType === type && styles.typeOptionSelected
                      ]}
                      onPress={() => setSelectedType(type as any)}
                    >
                      <Text style={[
                        styles.typeOptionText,
                        selectedType === type && styles.typeOptionTextSelected
                      ]}>
                        {type === '' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Category Filter */}
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <TouchableOpacity
                    style={[
                      styles.categoryOption,
                      !selectedCategory && styles.categoryOptionSelected
                    ]}
                    onPress={() => setSelectedCategory('')}
                  >
                    <Text style={styles.categoryOptionText}>All Categories</Text>
                  </TouchableOpacity>
                  {categories.map((category) => (
                    <TouchableOpacity
                      key={category.id}
                      style={[
                        styles.categoryOption,
                        selectedCategory === category.id && styles.categoryOptionSelected
                      ]}
                      onPress={() => setSelectedCategory(category.id)}
                    >
                      <Text style={styles.categoryOptionText}>{category.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Bank Account Filter */}
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Bank Account</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <TouchableOpacity
                    style={[
                      styles.categoryOption,
                      !selectedAccount && styles.categoryOptionSelected
                    ]}
                    onPress={() => setSelectedAccount('')}
                  >
                    <Text style={styles.categoryOptionText}>All Accounts</Text>
                  </TouchableOpacity>
                  {bankAccounts.map((account) => (
                    <TouchableOpacity
                      key={account.id}
                      style={[
                        styles.categoryOption,
                        selectedAccount === account.id && styles.categoryOptionSelected
                      ]}
                      onPress={() => setSelectedAccount(account.id)}
                    >
                      <Text style={styles.categoryOptionText}>{account.bank_name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Person Filter */}
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Person</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <TouchableOpacity
                    style={[
                      styles.categoryOption,
                      !selectedPerson && styles.categoryOptionSelected
                    ]}
                    onPress={() => setSelectedPerson('')}
                  >
                    <Text style={styles.categoryOptionText}>All Persons</Text>
                  </TouchableOpacity>
                  {persons.map((person) => (
                    <TouchableOpacity
                      key={person.id}
                      style={[
                        styles.categoryOption,
                        selectedPerson === person.id && styles.categoryOptionSelected
                      ]}
                      onPress={() => setSelectedPerson(person.id)}
                    >
                      <Text style={styles.categoryOptionText}>{person.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Date Range */}
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Date Range</Text>
                <View style={styles.dateRow}>
                  <View style={styles.dateInput}>
                    <Text style={styles.dateLabel}>From</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="YYYY-MM-DD"
                      value={startDate}
                      onChangeText={setStartDate}
                    />
                  </View>
                  <View style={styles.dateInput}>
                    <Text style={styles.dateLabel}>To</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="YYYY-MM-DD"
                      value={endDate}
                      onChangeText={setEndDate}
                    />
                  </View>
                </View>
              </View>
            </ScrollView>

            {/* Filter Actions */}
            <View style={styles.filterActions}>
              <TouchableOpacity
                style={[styles.filterButton, styles.clearButton]}
                onPress={clearFilters}
              >
                <Text style={styles.clearButtonText}>Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterButton, styles.applyButton]}
                onPress={applyFilters}
              >
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: COLORS.text,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  transactionCard: {
    backgroundColor: COLORS.surface,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
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
    marginBottom: 2,
  },
  transactionMerchant: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '500',
  },
  transactionAmountContainer: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  income: {
    color: COLORS.income,
  },
  expense: {
    color: COLORS.expense,
  },
  closingBalance: {
    fontSize: 10,
    color: COLORS.textLight,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
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
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    flex: 1,
    backgroundColor: COLORS.surface,
    marginTop: 100,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  modalBody: {
    flex: 1,
    padding: 20,
  },
  filterGroup: {
    marginBottom: 24,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  typeOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
  },
  typeOptionSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  typeOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  typeOptionTextSelected: {
    color: '#fff',
  },
  categoryOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    marginRight: 8,
  },
  categoryOptionSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateInput: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  input: {
    padding: 12,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    backgroundColor: COLORS.background,
  },
  filterActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  clearButton: {
    flex: 1,
    backgroundColor: COLORS.border,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});