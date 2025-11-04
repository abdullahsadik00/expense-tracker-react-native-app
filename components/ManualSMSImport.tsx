// components/ManualSMSImport.tsx
import * as Clipboard from 'expo-clipboard';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SMSListener } from '../lib/smsListener';

export const ManualSMSImport: React.FC = () => {
  const [smsText, setSmsText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectedCategory, setDetectedCategory] = useState<string>('');
  // Add this effect to detect category when SMS text changes
  useEffect(() => {
    if (smsText.trim()) {
      // Simulate category detection for preview
      const sampleTransaction = {
        description: 'Transaction from SMS',
        merchant: '',
        amount: -100,
        type: 'expense' as const
      };

      // You can show a preview of how it would be categorized
      setDetectedCategory('Category will be automatically detected based on content');
    } else {
      setDetectedCategory('');
    }
  }, [smsText]);


  // Paste from clipboard
  const pasteFromClipboard = async () => {
    try {
      const text = await Clipboard.getStringAsync();
      if (text) {
        setSmsText(text);
        Alert.alert('Success', 'Text pasted from clipboard!');
      } else {
        Alert.alert('No Text', 'No text found in clipboard.');
      }
    } catch (error) {
      console.error('Clipboard error:', error);
      Alert.alert('Error', 'Failed to read from clipboard.');
    }
  };

  const processManualSMS = async () => {
    if (!smsText.trim()) {
      Alert.alert('Error', 'Please paste your bank SMS first');
      return;
    }

    setIsProcessing(true);
    try {
      console.log('📱 Processing manual SMS:', smsText);
      await SMSListener.processIncomingSMS(smsText, 'Manual Import');
      Alert.alert('Success ✅', 'Transaction processed successfully!');
      setSmsText('');
    } catch (error) {
      console.error('Error processing SMS:', error);
      Alert.alert('Error', 'Failed to process SMS. Please check the format.');
    } finally {
      setIsProcessing(false);
    }
  };

  const clearText = () => {
    setSmsText('');
  };

  // Sample SMS templates for testing
  const insertSampleSMS = (type: string) => {
    const samples: { [key: string]: string } = {
      hdfc: 'INR 500.00 spent on Starbucks on 2024-01-15. Your current balance is INR 15,000.00',
      icici: 'Your a/c XX1234 is debited INR 1,200.00 on 15-JAN-2024. UPI Ref No 123456. Bal: INR 25,780.00',
      sbi: 'Your SBI A/C XX1234 debited by INR 750.00 on 15-JAN-2024. Avl Bal INR 12,450.00',
      income: 'You have received INR 5,000.00 from John Doe. Your account balance is now INR 17,000.00',
      upi: 'INR 300.00 paid to Amazon India via UPI. Ref No 789012. Bal: INR 8,450.00'
    };

    setSmsText(samples[type] || '');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView}>
        <Text style={styles.title}>📱 Bank SMS Import</Text>
        <Text style={styles.subtitle}>
          Paste your bank transaction SMS to automatically add it to your expense tracker
        </Text>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickButton} onPress={pasteFromClipboard}>
            <Text style={styles.quickButtonText}>📋 Paste from Clipboard</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickButton} onPress={clearText}>
            <Text style={styles.quickButtonText}>🗑️ Clear</Text>
          </TouchableOpacity>
        </View>

        {/* Sample SMS Buttons */}
        <Text style={styles.sectionTitle}>Try Sample SMS:</Text>
        <View style={styles.sampleButtons}>
          <TouchableOpacity
            style={styles.sampleButton}
            onPress={() => insertSampleSMS('hdfc')}
          >
            <Text style={styles.sampleButtonText}>HDFC Expense</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.sampleButton}
            onPress={() => insertSampleSMS('icici')}
          >
            <Text style={styles.sampleButtonText}>ICICI Debit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.sampleButton}
            onPress={() => insertSampleSMS('income')}
          >
            <Text style={styles.sampleButtonText}>Income</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.sampleButton}
            onPress={() => insertSampleSMS('upi')}
          >
            <Text style={styles.sampleButtonText}>UPI Payment</Text>
          </TouchableOpacity>
        </View>

        {/* SMS Input */}
        <Text style={styles.sectionTitle}>Paste Your Bank SMS:</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Paste your bank transaction SMS here... Example: INR 500.00 spent on Starbucks on 2024-01-15"
          value={smsText}
          onChangeText={setSmsText}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
        />

        {/* Character Count */}
        <Text style={styles.charCount}>
          {smsText.length} characters • {smsText.split(' ').length} words
        </Text>

        {/* Process Button */}
        <TouchableOpacity
          style={[styles.processButton, isProcessing && styles.disabledButton]}
          onPress={processManualSMS}
          disabled={isProcessing}
        >
          <Text style={styles.processButtonText}>
            {isProcessing ? '⏳ Processing Transaction...' : '✅ Process SMS & Add Transaction'}
          </Text>
        </TouchableOpacity>

        {/* Instructions */}
        <View style={styles.instructions}>
          <Text style={styles.instructionsTitle}>📋 How to Use:</Text>
          <Text style={styles.instruction}>1. When you receive a bank SMS, long-press and copy it</Text>
          <Text style={styles.instruction}>2. Come back to this app and tap "Paste from Clipboard"</Text>
          <Text style={styles.instruction}>3. Review the text and tap "Process SMS"</Text>
          <Text style={styles.instruction}>4. The transaction will be automatically added to your expense tracker</Text>
        </View>

        {/* Supported Formats */}
        <View style={styles.supported}>
          <Text style={styles.supportedTitle}>🏦 Supported Banks & Formats:</Text>
          <Text style={styles.supportedText}>
            • HDFC Bank: "INR X spent on Merchant"{'\n'}
            • ICICI Bank: "debited INR X on Date"{'\n'}
            • SBI: "debited by INR X"{'\n'}
            • UPI Transactions: "paid to Merchant via UPI"{'\n'}
            • Income: "received INR X from"{'\n'}
            • Most other Indian bank formats
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
    lineHeight: 20,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  quickButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  quickButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  sampleButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
    gap: 8,
  },
  sampleButton: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  sampleButtonText: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '500',
  },
  textInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 8,
  },
  charCount: {
    textAlign: 'right',
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 16,
  },
  processButton: {
    backgroundColor: '#10B981',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  disabledButton: {
    opacity: 0.6,
  },
  processButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  instructions: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  instruction: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    lineHeight: 20,
  },
  supported: {
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  supportedTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1E40AF',
  },
  supportedText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
});