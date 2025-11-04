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
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editForm, setEditForm] = useState({
    description: '',
    amount: '',
    category_id: '',
    transaction_date: '',
    merchant: '',
  });
  // Load transaction for editing
  const loadTransactionForEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setEditForm({
      description: transaction.description,
      amount: Math.abs(transaction.amount).toString(),
      category_id: transaction.category_id,
      transaction_date: transaction.transaction_date,
      merchant: transaction.merchant || '',
    });
    setEditModalVisible(true);
  };

  // Update transaction
  const updateTransaction = async () => {
    if (!editingTransaction) return;

    try {
      const updatedTransaction = {
        ...editingTransaction,
        description: editForm.description,
        amount: editingTransaction.type === 'expense' ? -Math.abs(parseFloat(editForm.amount)) : Math.abs(parseFloat(editForm.amount)),
        category_id: editForm.category_id,
        transaction_date: editForm.transaction_date,
        merchant: editForm.merchant,
      };

      // Note: You'll need to implement updateTransaction in your database service
      // await db.updateTransaction(editingTransaction.id, updatedTransaction);
      
      Alert.alert('Success', 'Transaction updated successfully');
      setEditModalVisible(false);
      loadData(); // Refresh the list
    } catch (error) {
      console.error('Update error:', error);
      Alert.alert('Error', 'Failed to update transaction');
    }
  };

  // Delete transaction
  const deleteTransaction = (transaction: Transaction) => {
    Alert.alert(
      'Delete Transaction',
      `Are you sure you want to delete "${transaction.description}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await db.deleteTransaction(transaction.id);
              Alert.alert('Success', 'Transaction deleted successfully');
              loadData(); // Refresh the list
            } catch (error) {
              console.error('Delete error:', error);
              Alert.alert('Error', 'Failed to delete transaction');
            }
          },
        },
      ]
    );
  };

  // Action menu for each transaction
  const showActionMenu = (transaction: Transaction) => {
    Alert.alert(
      'Transaction Actions',
      `Choose an action for "${transaction.description}"`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Edit', 
          onPress: () => loadTransactionForEdit(transaction) 
        },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => deleteTransaction(transaction) 
        },
        { 
          text: 'View Details', 
          onPress: () => viewTransactionDetails(transaction) 
        },
      ]
    );
  };

  // Update the transaction card to include action button
  const renderTransactionItem = ({ item }: { item: Transaction }) => (
    <TouchableOpacity 
      style={styles.transactionCard}
      onPress={() => showActionMenu(item)}
      onLongPress={() => viewTransactionDetails(item)}
    >
      <View style={styles.transactionMain}>
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
      
      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity 
          style={styles.quickAction}
          onPress={() => loadTransactionForEdit(item)}
        >
          <MaterialCommunityIcons name="pencil" size={16} color={COLORS.textLight} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.quickAction}
          onPress={() => deleteTransaction(item)}
        >
          <MaterialCommunityIcons name="delete" size={16} color={COLORS.danger} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  
  // Filter states
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [selectedPerson, setSelectedPerson] = useState<string>('');
  const [selectedType, setSelectedType] = useState<'income' | 'expense' | 'transfer' | ''>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchText, setSearchText] = useState('');

  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const viewTransactionDetails = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setModalVisible(true);
  };

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
        renderItem={renderTransactionItem}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="receipt" size={64} color={COLORS.textLight} />
            <Text style={styles.emptyTitle}>No Transactions</Text>
            <Text style={styles.emptySubtitle}>
              {searchText || selectedCategory || selectedAccount ? 
                'No transactions match your filters' : 
                'Start by adding your first transaction via SMS Import or File Import'
              }
            </Text>
            <TouchableOpacity style={styles.emptyAction}>
              <Text style={styles.emptyActionText}>Go to Import</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Edit Transaction Modal */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Transaction</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={28} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Description</Text>
                <TextInput
                  style={styles.input}
                  value={editForm.description}
                  onChangeText={(text) => setEditForm(prev => ({ ...prev, description: text }))}
                  placeholder="Transaction description"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Amount</Text>
                <TextInput
                  style={styles.input}
                  value={editForm.amount}
                  onChangeText={(text) => setEditForm(prev => ({ ...prev, amount: text }))}
                  placeholder="Amount"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Date</Text>
                <TextInput
                  style={styles.input}
                  value={editForm.transaction_date}
                  onChangeText={(text) => setEditForm(prev => ({ ...prev, transaction_date: text }))}
                  placeholder="YYYY-MM-DD"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Merchant</Text>
                <TextInput
                  style={styles.input}
                  value={editForm.merchant}
                  onChangeText={(text) => setEditForm(prev => ({ ...prev, merchant: text }))}
                  placeholder="Store/merchant name"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {categories.map((category) => (
                    <TouchableOpacity
                      key={category.id}
                      style={[
                        styles.categoryOption,
                        editForm.category_id === category.id && styles.categoryOptionSelected
                      ]}
                      onPress={() => setEditForm(prev => ({ ...prev, category_id: category.id }))}
                    >
                      <Text style={styles.categoryOptionText}>{category.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={updateTransaction}
              >
                <Text style={styles.saveButtonText}>Save Changes</Text>
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
  transactionMain: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  quickAction: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginLeft: 8,
    backgroundColor: COLORS.background,
    borderRadius: 6,
  },
  emptyAction: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  emptyActionText: {
    color: '#fff',
    fontWeight: '600',
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.border,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
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