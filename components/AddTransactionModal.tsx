// components/AddTransactionModal.tsx
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { BankAccount, Category, db, Person } from '../lib/database';

const COLORS = {
  primary: '#1e3a8a',
  secondary: '#10b981',
  surface: '#ffffff',
  text: '#1f2937',
  textLight: '#6b7280',
  border: '#e5e7eb',
  danger: '#ef4444',
  background: '#f8fafc',
  income: '#10b981',
  expense: '#ef4444',
  warning: '#f59e0b',
};

interface AddTransactionModalProps {
  visible: boolean;
  onClose: () => void;
  onTransactionAdded: () => void;
}

export default function AddTransactionModal({ visible, onClose, onTransactionAdded }: AddTransactionModalProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [persons, setPersons] = useState<Person[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<string>('11111111-1111-1111-1111-111111111111');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [transactionType, setTransactionType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [merchant, setMerchant] = useState('');
  const [transactionDate, setTransactionDate] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentBalance, setCurrentBalance] = useState<number>(0);

  useEffect(() => {
    if (visible) {
      loadData();
      // Set default date to today
      const today = new Date();
      setTransactionDate(today.toISOString().split('T')[0]);
    }
  }, [visible]);

  useEffect(() => {
    // Update current balance when account changes
    if (selectedAccount) {
      const account = bankAccounts.find(acc => acc.id === selectedAccount);
      setCurrentBalance(account?.current_balance || 0);
    }
  }, [selectedAccount, bankAccounts]);

  const loadData = async () => {
    try {
      const [categoriesData, accountsData, personsData] = await Promise.all([
        db.getCategories(),
        db.getBankAccounts(),
        db.getPersons()
      ]);
      setCategories(categoriesData);
      setBankAccounts(accountsData);
      setPersons(personsData);
      
      // Set default category and account if available
      if (categoriesData.length > 0 && !selectedCategory) {
        const defaultCategory = categoriesData.find(cat => cat.type === 'expense');
        if (defaultCategory) setSelectedCategory(defaultCategory.id);
      }
      if (accountsData.length > 0 && !selectedAccount) {
        const defaultAccount = accountsData.find(acc => acc.owner_id === selectedPerson);
        if (defaultAccount) setSelectedAccount(defaultAccount.id);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load data');
    }
  };

  const handleCreateTransaction = async () => {
    if (!amount || !description || !selectedCategory || !selectedAccount || !selectedPerson) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    // Check if balance is sufficient for expenses
    if (transactionType === 'expense') {
      const selectedAccountData = bankAccounts.find(acc => acc.id === selectedAccount);
      if (selectedAccountData && selectedAccountData.current_balance < numericAmount) {
        Alert.alert(
          'Insufficient Balance',
          `Your current balance is ₹${selectedAccountData.current_balance.toLocaleString()}. You cannot add an expense of ₹${numericAmount.toLocaleString()}.`,
          [{ text: 'OK' }]
        );
        return;
      }
    }

    setLoading(true);
    try {
      const transactionData = {
        bank_account_id: selectedAccount,
        category_id: selectedCategory,
        person_id: selectedPerson,
        transaction_date: transactionDate || new Date().toISOString().split('T')[0],
        amount: numericAmount,
        type: transactionType,
        description: description,
        merchant: merchant || undefined,
        notes: notes || undefined,
        is_recurring: false,
        is_investment: false,
        is_verified: true,
      };

      await db.createTransaction(transactionData);
      Alert.alert('Success', 'Transaction added successfully!');
      onTransactionAdded();
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error creating transaction:', error);
      Alert.alert('Error', 'Failed to add transaction');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setAmount('');
    setDescription('');
    setMerchant('');
    setNotes('');
    setTransactionType('expense');
    setSelectedPerson('11111111-1111-1111-1111-111111111111');
    setSelectedCategory('');
    setSelectedAccount('');
    setCurrentBalance(0);
    const today = new Date();
    setTransactionDate(today.toISOString().split('T')[0]);
  };

  // Filter categories by type and person
  const getFilteredCategories = () => {
    const selectedPersonData = persons.find(p => p.id === selectedPerson);
    if (!selectedPersonData) return categories;

    return categories.filter(category => {
      if (category.type !== transactionType) return false;
      if (category.person_type === 'shared') return true;
      return category.person_type === selectedPersonData.role;
    });
  };

  // Filter bank accounts by person
  const getFilteredAccounts = () => {
    return bankAccounts.filter(account => account.owner_id === selectedPerson);
  };

  const filteredCategories = getFilteredCategories();
  const filteredAccounts = getFilteredAccounts();

  // Check if expense amount exceeds balance
  const isInsufficientBalance = transactionType === 'expense' && selectedAccount && 
    parseFloat(amount) > currentBalance;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Transaction</Text>
            <TouchableOpacity onPress={onClose} disabled={loading}>
              <MaterialCommunityIcons name="close" size={28} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Transaction Type */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Transaction Type *</Text>
              <View style={styles.typeContainer}>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    transactionType === 'expense' && styles.typeButtonActive,
                    { backgroundColor: transactionType === 'expense' ? COLORS.expense : COLORS.border }
                  ]}
                  onPress={() => setTransactionType('expense')}
                  disabled={loading}
                >
                  <MaterialCommunityIcons 
                    name="arrow-up" 
                    size={20} 
                    color={transactionType === 'expense' ? '#fff' : COLORS.text} 
                  />
                  <Text style={[
                    styles.typeButtonText,
                    transactionType === 'expense' && styles.typeButtonTextActive
                  ]}>
                    Expense
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    transactionType === 'income' && styles.typeButtonActive,
                    { backgroundColor: transactionType === 'income' ? COLORS.income : COLORS.border }
                  ]}
                  onPress={() => setTransactionType('income')}
                  disabled={loading}
                >
                  <MaterialCommunityIcons 
                    name="arrow-down" 
                    size={20} 
                    color={transactionType === 'income' ? '#fff' : COLORS.text} 
                  />
                  <Text style={[
                    styles.typeButtonText,
                    transactionType === 'income' && styles.typeButtonTextActive
                  ]}>
                    Income
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Person Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Person *</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.personScroll}
              >
                {persons.map((person) => (
                  <TouchableOpacity
                    key={person.id}
                    style={[
                      styles.personOption,
                      selectedPerson === person.id && styles.personOptionSelected,
                      { backgroundColor: person.color + '20' }
                    ]}
                    onPress={() => {
                      setSelectedPerson(person.id);
                      // Reset account selection when person changes
                      const personAccount = bankAccounts.find(acc => acc.owner_id === person.id);
                      setSelectedAccount(personAccount?.id || '');
                    }}
                    disabled={loading}
                  >
                    <View style={[styles.personColor, { backgroundColor: person.color }]} />
                    <Text style={styles.personOptionText}>{person.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Amount Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Amount *</Text>
              <View style={[
                styles.amountInput,
                isInsufficientBalance && styles.amountInputError
              ]}>
                <Text style={styles.currencySymbol}>₹</Text>
                <TextInput
                  style={[styles.input, styles.amountInputField]}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  value={amount}
                  onChangeText={setAmount}
                  placeholderTextColor={COLORS.textLight}
                  editable={!loading}
                />
              </View>
              {selectedAccount && (
                <Text style={[
                  styles.balanceText,
                  isInsufficientBalance ? styles.balanceError : styles.balanceNormal
                ]}>
                  Current Balance: ₹{currentBalance.toLocaleString()}
                  {isInsufficientBalance && ' - Insufficient balance!'}
                </Text>
              )}
            </View>

            {/* Description */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter transaction description"
                value={description}
                onChangeText={setDescription}
                placeholderTextColor={COLORS.textLight}
                editable={!loading}
              />
            </View>

            {/* Merchant */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Merchant (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter merchant name"
                value={merchant}
                onChangeText={setMerchant}
                placeholderTextColor={COLORS.textLight}
                editable={!loading}
              />
            </View>

            {/* Category Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Category *</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.categoryScroll}
              >
                {filteredCategories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryOption,
                      selectedCategory === category.id && styles.categoryOptionSelected,
                    ]}
                    onPress={() => setSelectedCategory(category.id)}
                    disabled={loading}
                  >
                    <MaterialCommunityIcons 
                      // name={getCategoryIcon(category.icon)} 
                      size={16} 
                      color={selectedCategory === category.id ? COLORS.primary : COLORS.textLight} 
                    />
                    <Text style={[
                      styles.categoryOptionText,
                      selectedCategory === category.id && styles.categoryOptionTextSelected
                    ]}>
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Bank Account Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Bank Account *</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.categoryScroll}
              >
                {filteredAccounts.map((account) => (
                  <TouchableOpacity
                    key={account.id}
                    style={[
                      styles.categoryOption,
                      selectedAccount === account.id && styles.categoryOptionSelected,
                    ]}
                    onPress={() => setSelectedAccount(account.id)}
                    disabled={loading}
                  >
                    <MaterialCommunityIcons 
                      name="credit-card-outline" 
                      size={16} 
                      color={selectedAccount === account.id ? COLORS.primary : COLORS.textLight} 
                    />
                    <Text style={[
                      styles.categoryOptionText,
                      selectedAccount === account.id && styles.categoryOptionTextSelected
                    ]}>
                      {account.bank_name} (₹{account.current_balance.toLocaleString()})
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Date */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Date *</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                value={transactionDate}
                onChangeText={setTransactionDate}
                placeholderTextColor={COLORS.textLight}
                editable={!loading}
              />
              <Text style={styles.helperText}>Format: YYYY-MM-DD (e.g., 2024-01-15)</Text>
            </View>

            {/* Notes */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Notes (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Additional notes..."
                value={notes}
                onChangeText={setNotes}
                placeholderTextColor={COLORS.textLight}
                multiline
                numberOfLines={3}
                editable={!loading}
              />
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary]}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.buttonTextSecondary}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.button, 
                styles.buttonPrimary, 
                loading && styles.buttonDisabled,
                isInsufficientBalance && styles.buttonDisabled
              ]}
              onPress={handleCreateTransaction}
              disabled={loading || Boolean(isInsufficientBalance)}
            >
              {loading ? (
                <MaterialCommunityIcons name="loading" size={20} color="#fff" />
              ) : (
                <MaterialCommunityIcons name="plus" size={20} color="#fff" />
              )}
              <Text style={styles.buttonText}>
                {loading ? 'Adding...' : 'Add Transaction'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

// Helper function to map icon names
const getCategoryIcon = (iconName: string): string => {
  const iconMap: { [key: string]: string } = {
    'cart-outline': 'cart-outline',
    'flash-outline': 'flash-outline',
    'home-outline': 'home-outline',
    'car-outline': 'car-outline',
    'food-fork-drink': 'food-fork-drink',
    'shopping-outline': 'shopping-outline',
    'movie-outline': 'movie-outline',
    'heart-outline': 'heart-outline',
    'package-variant': 'package-variant',
    'cog-outline': 'cog-outline',
    'book-open-outline': 'book-open-outline',
    'account-outline': 'account-outline',
    'gift-outline': 'gift-outline',
    'shield-check-outline': 'shield-check-outline',
    'credit-card-outline': 'credit-card-outline',
    'file-document-outline': 'file-document-outline',
    'chart-line': 'chart-line',
    'swap-horizontal': 'swap-horizontal',
    'piggy-bank-outline': 'piggy-bank-outline',
    'briefcase-outline': 'briefcase-outline',
    'laptop': 'laptop',
    'office-building': 'office-building',
  };
  return iconMap[iconName] || 'circle-outline';
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    flex: 1,
    backgroundColor: COLORS.surface,
    marginTop: 60,
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
  scrollContent: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  helperText: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 4,
    fontStyle: 'italic',
  },
  input: {
    padding: 14,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    backgroundColor: COLORS.background,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  typeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  typeButtonActive: {
    // backgroundColor handled inline
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  typeButtonTextActive: {
    color: '#fff',
  },
  amountInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    backgroundColor: COLORS.background,
  },
  amountInputError: {
    borderColor: COLORS.danger,
    backgroundColor: '#FEF2F2',
  },
  amountInputField: {
    flex: 1,
    borderWidth: 0,
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
    marginLeft: 14,
    marginRight: 8,
  },
  balanceText: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
  },
  balanceNormal: {
    color: COLORS.textLight,
  },
  balanceError: {
    color: COLORS.danger,
  },
  personScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  personOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    marginRight: 8,
  },
  personOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  personColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  personOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  categoryScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    marginRight: 8,
    gap: 8,
  },
  categoryOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  categoryOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textLight,
  },
  categoryOptionTextSelected: {
    color: COLORS.primary,
  },
  buttonGroup: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  buttonPrimary: {
    backgroundColor: COLORS.primary,
  },
  buttonSecondary: {
    backgroundColor: COLORS.border,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  buttonTextSecondary: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
});