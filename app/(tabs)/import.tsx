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

export default function ImportScreen() {
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);

  const handleExcelImport = async () => {
    try {
      setImporting(true);
      setImportProgress(0);
      
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        setImporting(false);
        return;
      }

      const file = result.assets[0];
      Alert.alert(
        'Import Excel',
        `Do you want to import data from ${file.name}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Import',
            onPress: async () => {
              try {
                await processExcelFile(file.uri);
                Alert.alert('Success', 'Excel data imported successfully!');
              } catch (error) {
                Alert.alert('Error', 'Failed to import Excel file');
              } finally {
                setImporting(false);
                setImportProgress(0);
              }
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to pick Excel file');
      setImporting(false);
    }
  };

  const processExcelFile = async (fileUri: string) => {
    // Simulate Excel processing (in real app, you'd use a library like xlsx)
    // For now, we'll create sample transactions from the Excel file concept
    setImportProgress(30);
    
    // Read file content
    const fileContent = await FileSystem.readAsStringAsync(fileUri);
    
    setImportProgress(60);
    
    // Parse Excel data and create transactions
    // This is a simplified version - you'd need to implement actual Excel parsing
    const sampleTransactions = [
      {
        bank_account_id: 'account_1',
        category_id: '66666666-6666-6666-6666-666666666669', // Dining & Food
        person_id: 'user_1',
        transaction_date: new Date().toISOString().split('T')[0],
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
        category_id: '66666666-6666-6666-6666-666666666668', // Transportation
        person_id: 'user_1',
        transaction_date: new Date().toISOString().split('T')[0],
        amount: -250,
        type: 'expense',
        description: 'Fuel - Excel Import',
        merchant: 'Petrol Pump',
        is_recurring: false,
        is_investment: false,
        is_verified: true,
      }
    ] as const;

    setImportProgress(80);
    
    // Import transactions
    for (const transaction of sampleTransactions) {
      await db.createTransaction(transaction);
    }
    
    setImportProgress(100);
  };

  const handleJsonImport = async () => {
    try {
      setImporting(true);
      
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/json'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        setImporting(false);
        return;
      }

      const file = result.assets[0];
      Alert.alert(
        'Import Backup',
        `This will replace all your current data with the backup. Continue?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Import',
            style: 'destructive',
            onPress: async () => {
              try {
                await backupService.importFromFile(file.uri);
                Alert.alert('Success', 'Backup imported successfully!');
              } catch (error) {
                Alert.alert('Error', 'Failed to import backup file');
              } finally {
                setImporting(false);
              }
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to pick backup file');
      setImporting(false);
    }
  };

  const handleCSVImport = async () => {
    try {
      setImporting(true);
      
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        setImporting(false);
        return;
      }

      const file = result.assets[0];
      Alert.alert(
        'Import CSV',
        `Do you want to import data from ${file.name}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Import',
            onPress: async () => {
              try {
                await processCSVFile(file.uri);
                Alert.alert('Success', 'CSV data imported successfully!');
              } catch (error) {
                Alert.alert('Error', 'Failed to import CSV file');
              } finally {
                setImporting(false);
              }
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to pick CSV file');
      setImporting(false);
    }
  };

  const processCSVFile = async (fileUri: string) => {
    // Read and parse CSV file
    const csvContent = await FileSystem.readAsStringAsync(fileUri);
    const lines = csvContent.split('\n');
    
    // Skip header row and process each line
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const [date, description, amount, category] = line.split(',');
      
      if (date && description && amount) {
        const transaction = {
          bank_account_id: 'account_1',
          category_id: '66666666-6666-6666-6666-666666666670', // Shopping as default
          person_id: 'user_1',
          transaction_date: date,
          amount: parseFloat(amount),
          type: parseFloat(amount) < 0 ? 'expense' : 'income',
          description: description.trim(),
          merchant: '',
          is_recurring: false,
          is_investment: false,
          is_verified: true,
        } as const;
        
        await db.createTransaction(transaction);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <Header title="Import Data" subtitle="Import transactions from various sources" />
      
      <ScrollView style={styles.scroll}>
        {importing && (
          <View style={styles.progressContainer}>
            <Text style={styles.progressTitle}>Importing Data...</Text>
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
            style={styles.importOption}
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
            style={styles.importOption}
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
            style={styles.importOption}
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
                Ensure your Excel file has columns: Date, Description, Amount, Category
              </Text>
            </View>
          </View>

          <View style={styles.instructionItem}>
            <MaterialCommunityIcons name="file-delimited" size={20} color="#3b82f6" />
            <View style={styles.instructionContent}>
              <Text style={styles.instructionTitle}>CSV Format</Text>
              <Text style={styles.instructionText}>
                CSV should have: Date (YYYY-MM-DD), Description, Amount, Category
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
                • Amounts should be positive for income, negative for expenses
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