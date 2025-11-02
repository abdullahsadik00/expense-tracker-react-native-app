import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import ExpenseForm from '../../components/ExpenseForm';
import ExpenseList from '../../components/ExpenseList';
import Header from '../../components/Header';
import Summary from '../../components/Summary';

const STORAGE_KEY = '@expense_tracker_data';

interface Expense {
  id: string;
  amount: string;
  description: string;
  category: string;
  date: string;
}

export default function TabOneScreen() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  // Load expenses on app start
  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    try {
      const storedExpenses = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedExpenses) {
        setExpenses(JSON.parse(storedExpenses));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  const saveExpenses = async (newExpenses: Expense[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newExpenses));
      setExpenses(newExpenses);
    } catch (error) {
      Alert.alert('Error', 'Failed to save expense');
    }
  };

  const addExpense = (expense: Omit<Expense, 'id' | 'date'>) => {
    const newExpense: Expense = {
      id: Date.now().toString(),
      ...expense,
      date: new Date().toISOString(),
    };
    const newExpenses = [...expenses, newExpense];
    saveExpenses(newExpenses);
  };

  const deleteExpense = (id: string) => {
    Alert.alert(
      'Delete Expense',
      'Are you sure you want to delete this expense?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const newExpenses = expenses.filter(expense => expense.id !== id);
            saveExpenses(newExpenses);
          },
        },
      ]
    );
  };

  const exportData = async () => {
    try {
      const data = JSON.stringify(expenses, null, 2);
      
      // Simple alert with data that user can copy
      Alert.alert(
        'Export Data',
        'Copy this JSON data to backup your expenses:\n\n' + data.substring(0, 1000) + (data.length > 1000 ? '...' : ''),
        [
          { text: 'OK', style: 'default' }
        ]
      );
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Error', 'Failed to export data');
    }
  };

  const importData = async () => {
    Alert.alert(
      'Import Sample Data',
      'This will add sample expenses to your tracker. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Import',
          onPress: async () => {
            try {
              const sampleData: Expense[] = [
                {
                  id: Date.now().toString(),
                  amount: '25.50',
                  description: 'Lunch at Restaurant',
                  category: 'Food',
                  date: new Date().toISOString(),
                },
                {
                  id: (Date.now() + 1).toString(),
                  amount: '45.00',
                  description: 'Gas Station',
                  category: 'Transport',
                  date: new Date().toISOString(),
                },
                {
                  id: (Date.now() + 2).toString(),
                  amount: '99.99',
                  description: 'Monthly Internet Bill',
                  category: 'Bills',
                  date: new Date().toISOString(),
                },
                {
                  id: (Date.now() + 3).toString(),
                  amount: '29.99',
                  description: 'Movie Tickets',
                  category: 'Entertainment',
                  date: new Date().toISOString(),
                },
              ];
              
              // Merge with existing expenses instead of replacing
              const newExpenses = [...expenses, ...sampleData];
              await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newExpenses));
              setExpenses(newExpenses);
              Alert.alert('Success', 'Sample data imported successfully!');
            } catch (error) {
              console.error('Import error:', error);
              Alert.alert('Error', 'Failed to import data');
            }
          },
        },
      ]
    );
  };

  const clearAllData = () => {
    Alert.alert(
      'Clear All Data',
      'This will delete all expenses. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem(STORAGE_KEY);
              setExpenses([]);
              Alert.alert('Success', 'All data cleared');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear data');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header 
        onExport={exportData}
        onImport={importData}
        onClear={clearAllData}
      />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Summary expenses={expenses} />
        <ExpenseForm onAddExpense={addExpense} />
        <ExpenseList 
          expenses={expenses} 
          onDeleteExpense={deleteExpense}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
});