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
import { BankAccount, Category, db } from '../lib/database';

const COLORS = {
  primary: '#1e3a8a',
  secondary: '#10b981',
  surface: '#ffffff',
  text: '#1f2937',
  textLight: '#6b7280',
  border: '#e5e7eb',
  danger: '#ef4444',
};

interface AddBudgetModalProps {
  visible: boolean;
  onClose: () => void;
  onBudgetAdded: () => void;
}

export default function AddBudgetModal({ visible, onClose, onBudgetAdded }: AddBudgetModalProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [amount, setAmount] = useState('');
  const [month, setMonth] = useState('');
  const [rollover, setRollover] = useState(false);
  const [notifications, setNotifications] = useState(true);

  useEffect(() => {
    if (visible) {
      loadData();
      // Set default month to current month
      const today = new Date();
      setMonth(today.toISOString().slice(0, 7));
    }
  }, [visible]);

  const loadData = async () => {
    try {
      const [categoriesData, accountsData] = await Promise.all([
        db.getCategories(),
        db.getBankAccounts()
      ]);
      setCategories(categoriesData);
      setBankAccounts(accountsData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleCreateBudget = async () => {
    if (!amount || !month) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    try {
      const budgetData = {
        person_id: 'user_1',
        category_id: selectedCategory || null,
        bank_account_id: selectedAccount || null,
        month: month + '-01', // First day of the month
        amount: numericAmount,
        spent_amount: 0,
        rollover_unused: rollover,
        notifications_enabled: notifications,
      };

      // Here you would call db.createBudget() when implemented
      Alert.alert('Success', 'Budget created successfully!');
      onBudgetAdded();
      onClose();
      resetForm();
    } catch (error) {
      Alert.alert('Error', 'Failed to create budget');
    }
  };

  const resetForm = () => {
    setAmount('');
    setSelectedCategory('');
    setSelectedAccount('');
    setRollover(false);
    setNotifications(true);
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
            <Text style={styles.modalTitle}>Create Budget</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons name="close" size={28} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent}>
            {/* Month Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Month *</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM"
                value={month}
                onChangeText={setMonth}
                placeholderTextColor={COLORS.textLight}
              />
            </View>

            {/* Amount Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Budget Amount *</Text>
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

            {/* Category Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Category (Optional)</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.categoryScroll}
              >
                <TouchableOpacity
                  style={[
                    styles.categoryOption,
                    !selectedCategory && styles.categoryOptionSelected,
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
                      selectedCategory === category.id && styles.categoryOptionSelected,
                    ]}
                    onPress={() => setSelectedCategory(category.id)}
                  >
                    <Text style={styles.categoryOptionText}>{category.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Bank Account Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Bank Account (Optional)</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.categoryScroll}
              >
                <TouchableOpacity
                  style={[
                    styles.categoryOption,
                    !selectedAccount && styles.categoryOptionSelected,
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
                      selectedAccount === account.id && styles.categoryOptionSelected,
                    ]}
                    onPress={() => setSelectedAccount(account.id)}
                  >
                    <Text style={styles.categoryOptionText}>{account.bank_name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Toggle Options */}
            <View style={styles.toggleGroup}>
              <TouchableOpacity
                style={styles.toggleOption}
                onPress={() => setRollover(!rollover)}
              >
                <View style={[styles.toggle, rollover && styles.toggleActive]}>
                  {rollover && <MaterialCommunityIcons name="check" size={16} color="#fff" />}
                </View>
                <View style={styles.toggleText}>
                  <Text style={styles.toggleTitle}>Rollover Unused Amount</Text>
                  <Text style={styles.toggleDescription}>
                    Carry over unused budget to next month
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.toggleOption}
                onPress={() => setNotifications(!notifications)}
              >
                <View style={[styles.toggle, notifications && styles.toggleActive]}>
                  {notifications && <MaterialCommunityIcons name="check" size={16} color="#fff" />}
                </View>
                <View style={styles.toggleText}>
                  <Text style={styles.toggleTitle}>Budget Notifications</Text>
                  <Text style={styles.toggleDescription}>
                    Get alerts when approaching budget limit
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
              onPress={handleCreateBudget}
            >
              <MaterialCommunityIcons name="plus" size={20} color="#fff" />
              <Text style={styles.buttonText}>Create Budget</Text>
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
  input: {
    padding: 14,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 0,
    borderColor: COLORS.border,
    borderRadius: 8,
    width: '100%',

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
  categoryScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  categoryOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    marginRight: 8,
  },
  categoryOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  categoryOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
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