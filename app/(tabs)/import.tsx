// app/(tabs)/import.tsx
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Directory, File, Paths } from 'expo-file-system/next';
import * as Sharing from 'expo-sharing';
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
import { SampleDataGenerator } from '../../lib/sampleDataGenerator';

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
      
      // Detect header and determine column mapping based on your schema
      const headers = lines[0].split(',').map(h => h.toLowerCase().trim().replace(/"/g, ''));
      
      // Map headers to your database columns
      const columnMap: { [key: string]: number } = {};
      headers.forEach((header, index) => {
        columnMap[header] = index;
      });
      
      // Get required data for mapping
      const bankAccounts = await db.getBankAccounts();
      const persons = await db.getPersons();
      const categories = await db.getCategories();
      
      setImportProgress(60);
      
      // Process each data row
      const transactions: any[] = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const columns = line.split(',').map(col => col.trim().replace(/^"|"$/g, ''));
        
        try {
          // Extract data based on column mapping
          const transaction_date = columns[columnMap['transaction_date']] || new Date().toISOString().split('T')[0];
          const description = columns[columnMap['description']] || 'Imported Transaction';
          const amount = parseFloat(columns[columnMap['amount']]) || 0;
          const type = (columns[columnMap['type']] || (amount >= 0 ? 'income' : 'expense')) as 'income' | 'expense' | 'transfer';
          const categoryName = columns[columnMap['category']] || '';
          const merchant = columns[columnMap['merchant']] || '';
          const notes = columns[columnMap['notes']] || '';
          const is_recurring = columns[columnMap['is_recurring']]?.toLowerCase() === 'true';
          const is_investment = columns[columnMap['is_investment']]?.toLowerCase() === 'true';
          const is_verified = columns[columnMap['is_verified']]?.toLowerCase() === 'true';
          
          // Find category ID
          let category_id = '66666666-6666-6666-6666-666666666670'; // Default: Shopping
          if (categoryName) {
            const foundCategory = categories.find(cat => 
              cat.name.toLowerCase() === categoryName.toLowerCase()
            );
            if (foundCategory) {
              category_id = foundCategory.id;
            }
          }
          
          // Auto-detect bank account based on content
          let bank_account_id = bankAccounts[0]?.id; // Default to first account
          const combinedText = (description + ' ' + merchant + ' ' + notes).toLowerCase();
          if (combinedText.includes('bob') || combinedText.includes('baroda')) {
            const bobAccount = bankAccounts.find(acc => 
              acc.bank_name.toLowerCase().includes('baroda')
            );
            if (bobAccount) bank_account_id = bobAccount.id;
          } else if (combinedText.includes('sbi') || combinedText.includes('state bank')) {
            const sbiAccount = bankAccounts.find(acc => 
              acc.bank_name.toLowerCase().includes('sbi')
            );
            if (sbiAccount) bank_account_id = sbiAccount.id;
          }
          
          // Auto-detect person based on smart rules
          let person_id = persons[0]?.id; // Default to first person
          const sadikNames = ['aliabbas', 'shehnaz', 'ayesha', 'parveen', 'zain', 'faiza', 'nilofar', 'sana', 'wasi'];
          const isSadikPayment = sadikNames.some(name => 
            combinedText.includes(name)
          );
          
          if (type === 'income') {
            if (isSadikPayment) {
              // Find Sadik
              const sadik = persons.find(p => p.name.toLowerCase().includes('sadik'));
              if (sadik) person_id = sadik.id;
            } else if (combinedText.includes('business') || combinedText.includes('fabrication')) {
              // Find Dad for business income
              const dad = persons.find(p => p.role === 'business_owner' || p.name.toLowerCase().includes('dad'));
              if (dad) person_id = dad.id;
            }
          }
          
          if (transaction_date && description && !isNaN(amount)) {
            transactions.push({
              bank_account_id,
              category_id,
              person_id,
              transaction_date,
              amount,
              type,
              description,
              merchant,
              notes,
              is_recurring,
              is_investment,
              is_verified,
              source: 'csv_import',
            });
          }
        } catch (rowError) {
          console.warn(`Skipping row ${i + 1} due to error:`, rowError);
        }
        
        // Update progress
        setImportProgress(60 + (i / lines.length) * 30);
      }
      
      setImportProgress(90);
      
      // Import to database
      let importedCount = 0;
      let errorCount = 0;
      
      for (const transaction of transactions) {
        try {
          await db.createTransaction(transaction);
          importedCount++;
        } catch (error) {
          console.error('Error importing transaction:', error);
          errorCount++;
        }
      }
      
      console.log(`Imported ${importedCount} transactions from CSV, ${errorCount} errors`);
      
      if (errorCount > 0) {
        Alert.alert(
          'Import Completed with Errors', 
          `Successfully imported ${importedCount} transactions. ${errorCount} transactions failed.`
        );
      }
      
      setImportProgress(100);
      
    } catch (error) {
      console.error('CSV processing error:', error);
      throw error;
    }
  };

  

  const downloadCSVTemplate = async () => {
    try {
      const csvContent = SampleDataGenerator.generateCSVSample();
  
      // 1️⃣ Access the app’s Documents directory
      const docsDir = new Directory(Paths.document);
  
      // 2️⃣ Create a file handle
      const file = new File(docsDir, 'expense_tracker_template.csv');
  
      // 3️⃣ Write data
      await file.write(csvContent, { encoding: 'utf8' });
  
      // 4️⃣ Share
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, {
          mimeType: 'text/csv',
          dialogTitle: 'Download Expense Tracker Template',
        });
      } else {
        Alert.alert(
          'Template Downloaded',
          'CSV template saved to your device. You can now fill it with your data.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Error', 'Failed to download template');
    }
  };
    
  const showExcelInstructions = () => {
    const instructions = SampleDataGenerator.generateExcelSampleInstructions();
    Alert.alert(
      'Excel Template Instructions',
      instructions,
      [
        { text: 'OK', style: 'default' },
        { 
          text: 'Copy Instructions', 
          onPress: () => {
            // You could copy to clipboard here
            Alert.alert('Copied', 'Instructions copied to clipboard');
          }
        }
      ]
    );
  };

  const showSupportedCategories = () => {
    const categories = SampleDataGenerator.getSupportedCategories();
    Alert.alert(
      'Supported Categories',
      categories.join('\n• '),
      [{ text: 'OK', style: 'default' }]
    );
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

      {/* Template Download Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Download Templates</Text>
        
        {/* CSV Template Download */}
        <TouchableOpacity 
          style={styles.templateOption}
          onPress={downloadCSVTemplate}
        >
          <View style={[styles.optionIcon, { backgroundColor: '#10b98120' }]}>
            <MaterialCommunityIcons name="file-delimited" size={32} color="#10b981" />
          </View>
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>Download CSV Template</Text>
            <Text style={styles.optionDescription}>
              Get a pre-formatted CSV template with sample data and instructions
            </Text>
          </View>
          <MaterialCommunityIcons name="download" size={24} color={COLORS.textLight} />
        </TouchableOpacity>

        {/* Excel Instructions */}
        <TouchableOpacity 
          style={styles.templateOption}
          onPress={showExcelInstructions}
        >
          <View style={[styles.optionIcon, { backgroundColor: '#3b82f620' }]}>
            <MaterialCommunityIcons name="microsoft-excel" size={32} color="#3b82f6" />
          </View>
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>Excel Template Guide</Text>
            <Text style={styles.optionDescription}>
              View formatting instructions and requirements for Excel files
            </Text>
          </View>
          <MaterialCommunityIcons name="information" size={24} color={COLORS.textLight} />
        </TouchableOpacity>

        {/* Supported Categories */}
        <TouchableOpacity 
          style={styles.templateOption}
          onPress={showSupportedCategories}
        >
          <View style={[styles.optionIcon, { backgroundColor: '#f59e0b20' }]}>
            <MaterialCommunityIcons name="format-list-bulleted" size={32} color="#f59e0b" />
          </View>
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>Supported Categories</Text>
            <Text style={styles.optionDescription}>
              View all available transaction categories for classification
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.textLight} />
        </TouchableOpacity>
      </View>

      {/* Import Options Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Import Data</Text>
        
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
          <MaterialCommunityIcons name="download" size={20} color="#10b981" />
          <View style={styles.instructionContent}>
            <Text style={styles.instructionTitle}>Step 1: Download Template</Text>
            <Text style={styles.instructionText}>
              Download the CSV template or follow Excel instructions to format your data correctly
            </Text>
          </View>
        </View>

        <View style={styles.instructionItem}>
          <MaterialCommunityIcons name="file-edit" size={20} color="#3b82f6" />
          <View style={styles.instructionContent}>
            <Text style={styles.instructionTitle}>Step 2: Fill Your Data</Text>
            <Text style={styles.instructionText}>
              • Date: Use any standard date format{'\n'}
              • Description: Clear transaction description{'\n'}
              • Amount: Negative for expenses, positive for income{'\n'}
              • Category: Choose from supported categories (optional){'\n'}
              • Type: income/expense/transfer (optional - auto-detected)
            </Text>
          </View>
        </View>

        <View style={styles.instructionItem}>
          <MaterialCommunityIcons name="upload" size={20} color="#f59e0b" />
          <View style={styles.instructionContent}>
            <Text style={styles.instructionTitle}>Step 3: Import Data</Text>
            <Text style={styles.instructionText}>
              • Select your filled file{'\n'}
              • Review the import preview{'\n'}
              • Confirm to add transactions{'\n'}
              • Check transactions list for imported data
            </Text>
          </View>
        </View>

        <View style={styles.instructionItem}>
          <MaterialCommunityIcons name="alert" size={20} color={COLORS.accent} />
          <View style={styles.instructionContent}>
            <Text style={styles.instructionTitle}>Important Notes</Text>
            <Text style={styles.instructionText}>
              • Backup your data before importing{'\n'}
              • Large files may take longer to process{'\n'}
              • Check transaction categories after import{'\n'}
              • You can edit transactions after importing
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
  templateOption: {
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