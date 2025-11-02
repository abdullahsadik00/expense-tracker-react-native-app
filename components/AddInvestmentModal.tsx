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
};

interface AddInvestmentModalProps {
  visible: boolean;
  onClose: () => void;
  onAddExpense: (transactionData: any) => void;
}

export default function AddInvestmentModal({ visible, onClose, onAddExpense }: AddInvestmentModalProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [persons, setPersons] = useState<Person[]>([]);
  
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [transactionType, setTransactionType] = useState<'expense' | 'income' | 'transfer'>('expense');
  
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [merchant, setMerchant] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [isInvestment, setIsInvestment] = useState(false);

  useEffect(() => {
    if (visible) {
      loadData();
    }
  }, [visible]);

  const loadData = async () => {
    try {
      const [categoriesData, accountsData, personsData] = await Promise.all([
        db.getCategories(),
        db.getBankAccounts(),
        db.getPersons() // Get all persons
      ]);
      
      setCategories(categoriesData);
      setBankAccounts(accountsData);
      setPersons(personsData);
      
      // Set defaults
      if (categoriesData.length > 0) {
        const defaultCategory = categoriesData.find(cat => cat.type === 'expense') || categoriesData[0];
        setSelectedCategory(defaultCategory);
      }
      if (accountsData.length > 0) {
        setSelectedAccount(accountsData[0]);
      }
      if (personsData.length > 0) {
        setSelectedPerson(personsData[0]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleAddExpense = () => {
    if (!amount || !description || !selectedCategory || !selectedAccount || !selectedPerson) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    // Adjust amount sign based on transaction type
    let finalAmount = numericAmount;
    if (transactionType === 'expense') {
      finalAmount = -numericAmount;
    } else if (transactionType === 'income') {
      finalAmount = numericAmount;
    }

    const transactionData = {
      bank_account_id: selectedAccount.id,
      category_id: selectedCategory.id,
      person_id: selectedPerson.id,
      transaction_date: new Date().toISOString().split('T')[0],
      amount: finalAmount,
      type: transactionType,
      description: description.trim(),
      merchant: merchant.trim() || null,
      reference_number: referenceNumber.trim() || null,
      closing_balance: null, // Will be calculated by the system
      notes: notes.trim() || null,
      is_recurring: isRecurring,
      recurring_type: isRecurring ? 'monthly' : null,
      is_investment: isInvestment,
      is_verified: true,
    };

    onAddExpense(transactionData);
    resetForm();
  };

  const resetForm = () => {
    setAmount('');
    setDescription('');
    setMerchant('');
    setReferenceNumber('');
    setNotes('');
    setIsRecurring(false);
    setIsInvestment(false);
    setTransactionType('expense');
  };

  // Filter categories by transaction type
  const filteredCategories = categories.filter(cat => cat.type === transactionType);

  // Get color mapping for category colors
  const getColorValue = (colorName: string) => {
    const colorMap: { [key: string]: string } = {
      'green-500': '#10b981',
      'green-600': '#059669',
      'green-700': '#047857',
      'green-800': '#065f46',
      'blue-500': '#3b82f6',
      'blue-600': '#2563eb',
      'blue-700': '#1d4ed8',
      'blue-800': '#1e40af',
      'red-500': '#ef4444',
      'red-600': '#dc2626',
      'red-700': '#b91c1c',
      'red-800': '#991b1b',
      'orange-500': '#f59e0b',
      'orange-600': '#d97706',
      'purple-500': '#8b5cf6',
      'purple-600': '#7c3aed',
      'purple-700': '#6d28d9',
      'yellow-500': '#eab308',
      'yellow-600': '#ca8a04',
      'yellow-700': '#a16207',
      'violet-500': '#8b5cf6',
      'violet-600': '#7c3aed',
      'gray-500': '#6b7280',
    };
    return colorMap[colorName] || '#6b7280';
  };

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
            <Text style={styles.modalTitle}>
              {transactionType === 'income' ? 'Add Income' : 
               transactionType === 'transfer' ? 'Add Transfer' : 'Add Expense'}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons name="close" size={28} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent}>
            {/* Transaction Type Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Transaction Type *</Text>
              <View style={styles.typeContainer}>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    transactionType === 'expense' && styles.typeButtonActive,
                  ]}
                  onPress={() => setTransactionType('expense')}
                >
                  <MaterialCommunityIcons 
                    name="cash-remove" 
                    size={20} 
                    color={transactionType === 'expense' ? '#fff' : COLORS.text} 
                  />
                  <Text style={[
                    styles.typeButtonText,
                    transactionType === 'expense' && styles.typeButtonTextActive,
                  ]}>
                    Expense
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    transactionType === 'income' && styles.typeButtonActive,
                  ]}
                  onPress={() => setTransactionType('income')}
                >
                  <MaterialCommunityIcons 
                    name="cash-plus" 
                    size={20} 
                    color={transactionType === 'income' ? '#fff' : COLORS.text} 
                  />
                  <Text style={[
                    styles.typeButtonText,
                    transactionType === 'income' && styles.typeButtonTextActive,
                  ]}>
                    Income
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    transactionType === 'transfer' && styles.typeButtonActive,
                  ]}
                  onPress={() => setTransactionType('transfer')}
                >
                  <MaterialCommunityIcons 
                    name="bank-transfer" 
                    size={20} 
                    color={transactionType === 'transfer' ? '#fff' : COLORS.text} 
                  />
                  <Text style={[
                    styles.typeButtonText,
                    transactionType === 'transfer' && styles.typeButtonTextActive,
                  ]}>
                    Transfer
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Amount Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Amount *</Text>
              <View style={styles.amountInput}>
                <Text style={styles.currencySymbol}>₹</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  value={amount}
                  onChangeText={setAmount}
                  placeholderTextColor={COLORS.textLight}
                />
              </View>
            </View>

            {/* Description Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description *</Text>
              <TextInput
                style={styles.input}
                placeholder="What is this transaction for?"
                value={description}
                onChangeText={setDescription}
                placeholderTextColor={COLORS.textLight}
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
                      selectedCategory?.id === category.id && styles.categoryOptionSelected,
                    ]}
                    onPress={() => setSelectedCategory(category)}
                  >
                    <View style={[
                      styles.categoryOptionIcon, 
                      { backgroundColor: getColorValue(category.color) + '20' }
                    ]}>
                      <MaterialCommunityIcons 
                        name={category.icon as any} 
                        size={20} 
                        color={getColorValue(category.color)} 
                      />
                    </View>
                    <Text style={styles.categoryOptionText}>{category.name}</Text>
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
                {bankAccounts.map((account) => (
                  <TouchableOpacity
                    key={account.id}
                    style={[
                      styles.categoryOption,
                      selectedAccount?.id === account.id && styles.categoryOptionSelected,
                    ]}
                    onPress={() => setSelectedAccount(account)}
                  >
                    <View style={styles.accountIcon}>
                      <MaterialCommunityIcons name="bank" size={20} color={COLORS.primary} />
                    </View>
                    <Text style={styles.categoryOptionText}>
                      {account.bank_name} ({account.account_type})
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Person Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Person *</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.categoryScroll}
              >
                {persons.map((person) => (
                  <TouchableOpacity
                    key={person.id}
                    style={[
                      styles.categoryOption,
                      selectedPerson?.id === person.id && styles.categoryOptionSelected,
                    ]}
                    onPress={() => setSelectedPerson(person)}
                  >
                    <View style={[
                      styles.personIcon,
                      { backgroundColor: person.color + '20' }
                    ]}>
                      <MaterialCommunityIcons 
                        name="account" 
                        size={20} 
                        color={person.color} 
                      />
                    </View>
                    <Text style={styles.categoryOptionText}>{person.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Additional Fields */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Merchant/Store (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Where did this transaction occur?"
                value={merchant}
                onChangeText={setMerchant}
                placeholderTextColor={COLORS.textLight}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Reference Number (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Transaction reference number"
                value={referenceNumber}
                onChangeText={setReferenceNumber}
                placeholderTextColor={COLORS.textLight}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Notes (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Additional notes about this transaction"
                value={notes}
                onChangeText={setNotes}
                placeholderTextColor={COLORS.textLight}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Toggle Options */}
            <View style={styles.toggleGroup}>
              <TouchableOpacity
                style={styles.toggleOption}
                onPress={() => setIsRecurring(!isRecurring)}
              >
                <View style={[styles.toggle, isRecurring && styles.toggleActive]}>
                  {isRecurring && <MaterialCommunityIcons name="check" size={16} color="#fff" />}
                </View>
                <View style={styles.toggleText}>
                  <Text style={styles.toggleTitle}>Recurring Transaction</Text>
                  <Text style={styles.toggleDescription}>
                    This transaction repeats regularly
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.toggleOption}
                onPress={() => setIsInvestment(!isInvestment)}
              >
                <View style={[styles.toggle, isInvestment && styles.toggleActive]}>
                  {isInvestment && <MaterialCommunityIcons name="check" size={16} color="#fff" />}
                </View>
                <View style={styles.toggleText}>
                  <Text style={styles.toggleTitle}>Investment Transaction</Text>
                  <Text style={styles.toggleDescription}>
                    This is related to investments
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary]}
              onPress={onClose}
            >
              <Text style={styles.buttonTextSecondary}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.buttonPrimary]}
              onPress={handleAddExpense}
            >
              <MaterialCommunityIcons name="plus" size={20} color="#fff" />
              <Text style={styles.buttonText}>
                {transactionType === 'income' ? 'Add Income' : 
                 transactionType === 'transfer' ? 'Add Transfer' : 'Add Expense'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    flex: 1,
    backgroundColor: COLORS.surface,
    marginTop: 50,
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
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  typeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    gap: 8,
  },
  typeButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  typeButtonTextActive: {
    color: '#fff',
  },
  input: {
    padding: 14,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
  },
  amountInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 14,
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
    marginRight: 8,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  categoryScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  categoryOption: {
    alignItems: 'center',
    marginRight: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  categoryOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  accountIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    backgroundColor: COLORS.primary + '20',
  },
  personIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
    maxWidth: 80,
    textAlign: 'center',
  },
  toggleGroup: {
    marginBottom: 20,
  },
  toggleOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  toggle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  toggleText: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  toggleDescription: {
    fontSize: 14,
    color: COLORS.textLight,
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