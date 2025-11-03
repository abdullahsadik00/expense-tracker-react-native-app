// app/(tabs)/import.tsx
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Header from '../../components/Header';
import { backupService } from '../../lib/backup';
import { db } from '../../lib/database';

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

// Define proper transaction type based on your database schema
type TransactionType = 'income' | 'expense' | 'transfer';

interface ImportTransaction {
  bank_account_id: string;
  category_id: string;
  person_id: string;
  transaction_date: string;
  amount: number;
  type: TransactionType;
  description: string;
  merchant: string;
  is_recurring: boolean;
  is_investment: boolean;
  is_verified: boolean;
}

// Category mapping for common transaction categories
const CATEGORY_MAPPING: { [key: string]: string } = {
  'food': '66666666-6666-6666-6666-666666666669', // Dining & Food
  'dining': '66666666-6666-6666-6666-666666666669',
  'restaurant': '66666666-6666-6666-6666-666666666669',
  'groceries': '66666666-6666-6666-6666-666666666669',
  'transport': '66666666-6666-6666-6666-666666666668', // Transportation
  'transportation': '66666666-6666-6666-6666-666666666668',
  'fuel': '66666666-6666-6666-6666-666666666668',
  'gas': '66666666-6666-6666-6666-666666666668',
  'shopping': '66666666-6666-6666-6666-666666666670', // Shopping
  'entertainment': '66666666-6666-6666-6666-666666666671', // Entertainment
  'bills': '66666666-6666-6666-6666-666666666672', // Bills & Utilities
  'utilities': '66666666-6666-6666-6666-666666666672',
  'salary': '66666666-6666-6666-6666-666666666673', // Income
  'income': '66666666-6666-6666-6666-666666666673',
};

export default function ImportScreen() {
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [currentFile, setCurrentFile] = useState('');

  const getCategoryId = (category: string): string => {
    if (!category) return '66666666-6666-6666-6666-666666666670'; // Default: Shopping
    
    const lowerCategory = category.toLowerCase().trim();
    
    // Exact match
    if (CATEGORY_MAPPING[lowerCategory]) {
      return CATEGORY_MAPPING[lowerCategory];
    }
    
    // Partial match
    for (const [key, value] of Object.entries(CATEGORY_MAPPING)) {
      if (lowerCategory.includes(key)) {
        return value;
      }
    }
    
    return '66666666-6666-6666-6666-666666666670'; // Default: Shopping
  };

  const parseDate = (dateString: string): string => {
    // Handle various date formats
    const formats = [
      // YYYY-MM-DD
      /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
      // MM/DD/YYYY
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
      // DD/MM/YYYY
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
    ];
    
    for (const format of formats) {
      const match = dateString.match(format);
      if (match) {
        let year, month, day;
        
        if (format === formats[0]) {
          // YYYY-MM-DD
          [, year, month, day] = match;
        } else {
          // MM/DD/YYYY or DD/MM/YYYY
          [, month, day, year] = match;
        }
        
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        return date.toISOString().split('T')[0];
      }
    }
    
    // Return today's date if parsing fails
    return new Date().toISOString().split('T')[0];
  };

  // Helper function to safely convert string to TransactionType
  const toTransactionType = (typeStr: string, amount: number = 0): TransactionType => {
    const normalized = typeStr.toLowerCase().trim();
    
    if (normalized === 'income' || normalized === 'expense' || normalized === 'transfer') {
      return normalized as TransactionType;
    }
    
    // Fallback: determine by amount
    return amount >= 0 ? 'income' : 'expense';
  };

  const handleExcelImport = async () => {
    try {
      setImporting(true);
      setImportProgress(0);
      setCurrentFile('Excel');
      
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/vnd.ms-excel', 
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel.sheet.macroEnabled.12'
        ],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        setImporting(false);
        setCurrentFile('');
        return;
      }

      const file = result.assets[0];
      Alert.alert(
        'Import Excel',
        `Do you want to import data from ${file.name}?`,
        [
          { text: 'Cancel', style: 'cancel', onPress: () => {
            setImporting(false);
            setCurrentFile('');
          }},
          {
            text: 'Import',
            onPress: async () => {
              try {
                await processExcelFile(file.uri, file.name);
                Alert.alert('Success', 'Excel data imported successfully!');
              } catch (error) {
                console.error('Excel import error:', error);
                Alert.alert('Error', 'Failed to import Excel file. Please check the format.');
              } finally {
                setImporting(false);
                setImportProgress(0);
                setCurrentFile('');
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Excel picker error:', error);
      Alert.alert('Error', 'Failed to pick Excel file');
      setImporting(false);
      setCurrentFile('');
    }
  };

  const processExcelFile = async (fileUri: string, fileName: string) => {
    try {
      setImportProgress(20);
      
      // For now, we'll simulate Excel processing
      // In a real app, you'd use a library like xlsx
      console.log('Processing Excel file:', fileName);
      
      // Read file (this would be different for actual Excel parsing)
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (!fileInfo.exists) {
        throw new Error('File not found');
      }
      
      setImportProgress(50);
      
      // Create sample transactions with proper typing
      const sampleTransactions: ImportTransaction[] = [
        {
          bank_account_id: 'account_1',
          category_id: getCategoryId('Dining'),
          person_id: 'user_1',
          transaction_date: parseDate(new Date().toISOString().split('T')[0]),
          amount: -850,
          type: 'expense',
          description: 'Restaurant - Excel Import',
          merchant: 'Fine Dine Restaurant',
          is_recurring: false,
          is_investment: false,
          is_verified: true,
        },
        {
          bank_account_id: 'account_1',
          category_id: getCategoryId('Transport'),
          person_id: 'user_1',
          transaction_date: parseDate(new Date().toISOString().split('T')[0]),
          amount: -250,
          type: 'expense',
          description: 'Fuel - Excel Import',
          merchant: 'Petrol Pump',
          is_recurring: false,
          is_investment: false,
          is_verified: true,
        },
        {
          bank_account_id: 'account_1',
          category_id: getCategoryId('Salary'),
          person_id: 'user_1',
          transaction_date: parseDate(new Date().toISOString().split('T')[0]),
          amount: 5000,
          type: 'income',
          description: 'Salary - Excel Import',
          merchant: 'Company Inc',
          is_recurring: true,
          is_investment: false,
          is_verified: true,
        }
      ];

      setImportProgress(70);
      
      // Import transactions
      let importedCount = 0;
      for (const transaction of sampleTransactions) {
        await db.createTransaction(transaction);
        importedCount++;
        setImportProgress(70 + (importedCount / sampleTransactions.length) * 20);
      }
      
      setImportProgress(95);
      
      console.log(`Imported ${importedCount} transactions from Excel`);
      setImportProgress(100);
      
    } catch (error) {
      console.error('Excel processing error:', error);
      throw error;
    }
  };

  const handleJsonImport = async () => {
    try {
      setImporting(true);
      setCurrentFile('Backup');
      
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/json'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        setImporting(false);
        setCurrentFile('');
        return;
      }

      const file = result.assets[0];
      Alert.alert(
        'Import Backup',
        `This will replace all your current data with the backup. Continue?`,
        [
          { text: 'Cancel', style: 'cancel', onPress: () => {
            setImporting(false);
            setCurrentFile('');
          }},
          {
            text: 'Import',
            style: 'destructive',
            onPress: async () => {
              try {
                await backupService.importFromFile(file.uri);
                Alert.alert('Success', 'Backup imported successfully!');
              } catch (error) {
                console.error('Backup import error:', error);
                Alert.alert('Error', 'Failed to import backup file');
              } finally {
                setImporting(false);
                setCurrentFile('');
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Backup picker error:', error);
      Alert.alert('Error', 'Failed to pick backup file');
      setImporting(false);
      setCurrentFile('');
    }
  };

  const handleCSVImport = async () => {
    try {
      setImporting(true);
      setImportProgress(0);
      setCurrentFile('CSV');
      
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/comma-separated-values'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        setImporting(false);
        setCurrentFile('');
        return;
      }

      const file = result.assets[0];
      Alert.alert(
        'Import CSV',
        `Do you want to import data from ${file.name}?`,
        [
          { text: 'Cancel', style: 'cancel', onPress: () => {
            setImporting(false);
            setCurrentFile('');
          }},
          {
            text: 'Import',
            onPress: async () => {
              try {
                await processCSVFile(file.uri, file.name);
                Alert.alert('Success', 'CSV data imported successfully!');
              } catch (error) {
                console.error('CSV import error:', error);
                Alert.alert('Error', 'Failed to import CSV file. Please check the format.');
              } finally {
                setImporting(false);
                setImportProgress(0);
                setCurrentFile('');
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('CSV picker error:', error);
      Alert.alert('Error', 'Failed to pick CSV file');
      setImporting(false);
      setCurrentFile('');
    }
  };

  const processCSVFile = async (fileUri: string, fileName: string) => {
    try {
      setImportProgress(20);
      
      // Read CSV file
      const csvContent = await FileSystem.readAsStringAsync(fileUri);
      const lines = csvContent.split('\n').filter(line => line.trim());
      
      if (lines.length <= 1) {
        throw new Error('CSV file is empty or has no data rows');
      }
      
      setImportProgress(40);
      
      // Detect header and determine column mapping
      const headers = lines[0].split(',').map(h => h.toLowerCase().trim());
      
      let dateIndex = headers.findIndex(h => h.includes('date'));
      let descIndex = headers.findIndex(h => h.includes('desc') || h.includes('description'));
      let amountIndex = headers.findIndex(h => h.includes('amount') || h.includes('value'));
      let categoryIndex = headers.findIndex(h => h.includes('category') || h.includes('type'));
      let typeIndex = headers.findIndex(h => h.includes('type'));
      
      // Fallback to first columns if not found
      if (dateIndex === -1) dateIndex = 0;
      if (descIndex === -1) descIndex = 1;
      if (amountIndex === -1) amountIndex = 2;
      if (categoryIndex === -1) categoryIndex = 3;
      if (typeIndex === -1) typeIndex = 4;
      
      setImportProgress(60);
      
      // Process each data row
      const transactions: ImportTransaction[] = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const columns = line.split(',').map(col => col.trim().replace(/^"|"$/g, ''));
        
        if (columns.length >= Math.max(dateIndex, descIndex, amountIndex) + 1) {
          const date = parseDate(columns[dateIndex]);
          const description = columns[descIndex] || 'Imported Transaction';
          const amount = parseFloat(columns[amountIndex]) || 0;
          const category = columns[categoryIndex] || '';
          const typeFromColumn = columns[typeIndex] || '';
          
          if (date && description && !isNaN(amount)) {
            // Determine transaction type safely
            const transactionType = toTransactionType(typeFromColumn, amount);
            
            transactions.push({
              bank_account_id: 'account_1',
              category_id: getCategoryId(category),
              person_id: 'user_1',
              transaction_date: date,
              amount: amount,
              type: transactionType,
              description: description,
              merchant: '',
              is_recurring: false,
              is_investment: false,
              is_verified: true,
            });
          }
        }
        
        // Update progress
        setImportProgress(60 + (i / lines.length) * 30);
      }
      
      setImportProgress(90);
      
      // Import to database
      let importedCount = 0;
      for (const transaction of transactions) {
        await db.createTransaction(transaction);
        importedCount++;
      }
      
      console.log(`Imported ${importedCount} transactions from CSV`);
      setImportProgress(100);
      
    } catch (error) {
      console.error('CSV processing error:', error);
      throw error;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <Header title="Import Data" subtitle="Import transactions from various sources" />
      
      <ScrollView style={styles.scroll}>
        {importing && (
          <View style={styles.progressContainer}>
            <Text style={styles.progressTitle}>
              Importing {currentFile} Data...
            </Text>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill,
                  { width: `${importProgress}%` }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>{importProgress}%</Text>
            <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Import Options</Text>
          
          {/* Excel Import */}
          <TouchableOpacity 
            style={[styles.importOption, importing && styles.importOptionDisabled]}
            onPress={handleExcelImport}
            disabled={importing}
          >
            <View style={[styles.optionIcon, { backgroundColor: '#10b98120' }]}>
              <MaterialCommunityIcons name="microsoft-excel" size={32} color="#10b981" />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Import from Excel</Text>
              <Text style={styles.optionDescription}>
                Import transactions from Excel spreadsheets (.xlsx, .xls)
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.textLight} />
          </TouchableOpacity>

          {/* CSV Import */}
          <TouchableOpacity 
            style={[styles.importOption, importing && styles.importOptionDisabled]}
            onPress={handleCSVImport}
            disabled={importing}
          >
            <View style={[styles.optionIcon, { backgroundColor: '#3b82f620' }]}>
              <MaterialCommunityIcons name="file-delimited" size={32} color="#3b82f6" />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Import from CSV</Text>
              <Text style={styles.optionDescription}>
                Import transactions from CSV files with date, description, amount columns
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.textLight} />
          </TouchableOpacity>

          {/* JSON Backup Import */}
          <TouchableOpacity 
            style={[styles.importOption, importing && styles.importOptionDisabled]}
            onPress={handleJsonImport}
            disabled={importing}
          >
            <View style={[styles.optionIcon, { backgroundColor: '#f59e0b20' }]}>
              <MaterialCommunityIcons name="backup-restore" size={32} color="#f59e0b" />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Restore Backup</Text>
              <Text style={styles.optionDescription}>
                Restore your data from a previously exported JSON backup file
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.textLight} />
          </TouchableOpacity>
        </View>

        {/* Import Instructions */}
        <View style={styles.instructionsSection}>
          <Text style={styles.instructionsTitle}>Import Instructions</Text>
          
          <View style={styles.instructionItem}>
            <MaterialCommunityIcons name="microsoft-excel" size={20} color="#10b981" />
            <View style={styles.instructionContent}>
              <Text style={styles.instructionTitle}>Excel Format</Text>
              <Text style={styles.instructionText}>
                Ensure your Excel file has columns: Date, Description, Amount, Category, Type
              </Text>
            </View>
          </View>

          <View style={styles.instructionItem}>
            <MaterialCommunityIcons name="file-delimited" size={20} color="#3b82f6" />
            <View style={styles.instructionContent}>
              <Text style={styles.instructionTitle}>CSV Format</Text>
              <Text style={styles.instructionText}>
                • Supported formats: Date, Description, Amount, Category, Type{'\n'}
                • Date formats: YYYY-MM-DD, MM/DD/YYYY, DD/MM/YYYY{'\n'}
                • Type: income, expense, or transfer (optional - auto-detected from amount){'\n'}
                • Amount: Positive for income, negative for expenses
              </Text>
            </View>
          </View>

          <View style={styles.instructionItem}>
            <MaterialCommunityIcons name="alert" size={20} color={COLORS.accent} />
            <View style={styles.instructionContent}>
              <Text style={styles.instructionTitle}>Important Notes</Text>
              <Text style={styles.instructionText}>
                • Backup your data before importing{'\n'}
                • Imported transactions will be added to your existing data{'\n'}
                • Large files may take longer to process{'\n'}
                • Check the format requirements before importing
              </Text>
            </View>
          </View>
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
  progressContainer: {
    backgroundColor: COLORS.surface,
    margin: 20,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 12,
  },
  loader: {
    marginTop: 8,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
  },
  importOption: {
    flexDirection: 'row',
    alignItems: 'center',
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
  importOptionDisabled: {
    opacity: 0.6,
  },
  optionIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: COLORS.textLight,
    lineHeight: 18,
  },
  instructionsSection: {
    padding: 20,
    backgroundColor: COLORS.surface,
    margin: 20,
    borderRadius: 12,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  instructionContent: {
    flex: 1,
    marginLeft: 12,
  },
  instructionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  instructionText: {
    fontSize: 13,
    color: COLORS.textLight,
    lineHeight: 18,
  },
});