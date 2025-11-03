import DatePicker from '@/components/ui/DatePicker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  Alert,
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
  const [modalVisible, setModalVisible] = useState(false);
  const [persons, setPersons] = useState<any[]>([]);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  
  // Form state
  const [formData, setFormData] = useState({
    person_id: '',
    related_person_id: '',
    bank_account_id: '',
    loan_type: 'personal',
    description: '',
    principal_amount: '',
    interest_rate: '',
    total_amount: '',
    amount_paid: '0',
    loan_date: new Date().toISOString().split('T')[0],
    due_date: '',
    status: 'active',
    is_urgent: false,
    notes: ''
  });

  const loadData = async () => {
    try {
      const loansData = await db.getLoans();
      setLoans(loansData);
      
      // Load persons and bank accounts for dropdowns
      const personsData = await db.getPersons();
      const accountsData = await db.getBankAccounts();
      setPersons(personsData);
      setBankAccounts(accountsData);
    } catch (error) {
      Alert.alert('Error', 'Failed to load data');
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

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const calculateTotalAmount = () => {
    const principal = parseFloat(formData.principal_amount) || 0;
    const interestRate = parseFloat(formData.interest_rate) || 0;
    if (principal > 0 && interestRate > 0) {
      const interest = principal * (interestRate / 100);
      const total = principal + interest;
      setFormData(prev => ({
        ...prev,
        total_amount: total.toString()
      }));
    }
  };

  const handleAddLoan = async () => {
    try {
      // Validation
      if (!formData.description || !formData.principal_amount || !formData.interest_rate) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }

      const loanData = {
        ...formData,
        principal_amount: parseFloat(formData.principal_amount),
        interest_rate: parseFloat(formData.interest_rate),
        total_amount: parseFloat(formData.total_amount) || parseFloat(formData.principal_amount),
        amount_paid: parseFloat(formData.amount_paid) || 0,
        is_urgent: Boolean(formData.is_urgent)
      };

      await db.addLoan(loanData);
      setModalVisible(false);
      resetForm();
      loadData();
      Alert.alert('Success', 'Loan added successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to add loan');
    }
  };

  const resetForm = () => {
    setFormData({
      person_id: '',
      related_person_id: '',
      bank_account_id: '',
      loan_type: 'personal',
      description: '',
      principal_amount: '',
      interest_rate: '',
      total_amount: '',
      amount_paid: '0',
      loan_date: new Date().toISOString().split('T')[0],
      due_date: '',
      status: 'active',
      is_urgent: false,
      notes: ''
    });
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
            <Text style={styles.summaryValue}>
              {loans.filter(loan => loan.status !== 'completed').length}
            </Text>
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
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => setModalVisible(true)}
            >
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
                        <DatePicker
          date={new Date()}
          onDateChange={(date) => {}}
          label="Start Date"
        />

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
              <TouchableOpacity 
                style={styles.createLoanButton}
                onPress={() => setModalVisible(true)}
              >
                <Text style={styles.createLoanText}>Add Loan</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Add Loan Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Loan</Text>
              <TouchableOpacity 
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <MaterialCommunityIcons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>Description *</Text>
              <TextInput
                style={styles.textInput}
                value={formData.description}
                onChangeText={(value) => handleInputChange('description', value)}
                placeholder="Enter loan description"
              />

              <Text style={styles.inputLabel}>Loan Type</Text>
              <View style={styles.radioContainer}>
                {['personal', 'business', 'home', 'car', 'education'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={styles.radioOption}
                    onPress={() => handleInputChange('loan_type', type)}
                  >
                    <View style={styles.radioCircle}>
                      {formData.loan_type === type && <View style={styles.radioSelected} />}
                    </View>
                    <Text style={styles.radioText}>{type.charAt(0).toUpperCase() + type.slice(1)}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <Text style={styles.inputLabel}>Principal Amount *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={formData.principal_amount}
                    onChangeText={(value) => handleInputChange('principal_amount', value)}
                    onBlur={calculateTotalAmount}
                    placeholder="0.00"
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.halfInput}>
                  <Text style={styles.inputLabel}>Interest Rate % *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={formData.interest_rate}
                    onChangeText={(value) => handleInputChange('interest_rate', value)}
                    onBlur={calculateTotalAmount}
                    placeholder="0.0"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <Text style={styles.inputLabel}>Total Amount</Text>
                  <TextInput
                    style={styles.textInput}
                    value={formData.total_amount}
                    onChangeText={(value) => handleInputChange('total_amount', value)}
                    placeholder="0.00"
                    keyboardType="numeric"
                    editable={false}
                  />
                </View>
                <View style={styles.halfInput}>
                  <Text style={styles.inputLabel}>Amount Paid</Text>
                  <TextInput
                    style={styles.textInput}
                    value={formData.amount_paid}
                    onChangeText={(value) => handleInputChange('amount_paid', value)}
                    placeholder="0.00"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={styles.halfInput}>
                  {/* <Text style={styles.inputLabel}></Text> */}
                  {/* <TextInput
                    style={styles.textInput}
                    value={formData.loan_date}
                    onChangeText={(value) => handleInputChange('loan_date', value)}
                    placeholder="YYYY-MM-DD"
                  /> */}
                                          <DatePicker
          date={new Date()}
          // onDateChange={(date) => {}}
          onDateChange={(value) => handleInputChange('loan_date', String(value))}
          label="Loan Date"
        />
                </View>
                <View style={styles.halfInput}>
                  {/* <Text style={styles.inputLabel}>Due Date</Text>
                  <TextInput
                    style={styles.textInput}
                    value={formData.due_date}
                    onChangeText={(value) => handleInputChange('due_date', value)}
                    placeholder="YYYY-MM-DD"
                  /> */}
                                                  <DatePicker
          date={new Date()}
          // onDateChange={(date) => {}}
          onDateChange={(value) => handleInputChange('due_date', String(value))}
          label="Loan Date"
        />
                </View>
              </View>

              <Text style={styles.inputLabel}>Status</Text>
              <View style={styles.radioContainer}>
                {['active', 'completed', 'overdue'].map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={styles.radioOption}
                    onPress={() => handleInputChange('status', status)}
                  >
                    <View style={styles.radioCircle}>
                      {formData.status === status && <View style={styles.radioSelected} />}
                    </View>
                    <Text style={styles.radioText}>{status.charAt(0).toUpperCase() + status.slice(1)}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => handleInputChange('is_urgent', !formData.is_urgent)}
              >
                <View style={styles.checkbox}>
                  {formData.is_urgent && <MaterialCommunityIcons name="check" size={16} color="#fff" />}
                </View>
                <Text style={styles.checkboxLabel}>Mark as Urgent</Text>
              </TouchableOpacity>

              <Text style={styles.inputLabel}>Notes</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={formData.notes}
                onChangeText={(value) => handleInputChange('notes', value)}
                placeholder="Additional notes..."
                multiline
                numberOfLines={3}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.saveButton}
                  onPress={handleAddLoan}
                >
                  <Text style={styles.saveButtonText}>Save Loan</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  // Modal Styles
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
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
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
    marginTop: 16,
  },
  textInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: COLORS.background,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  radioContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  radioSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  radioText: {
    fontSize: 14,
    color: COLORS.text,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  checkboxLabel: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  saveButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});