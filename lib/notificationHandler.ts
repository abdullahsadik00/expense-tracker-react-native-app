// lib/notificationHandler.ts
import { Alert, Platform, ToastAndroid } from 'react-native';
import { db } from './database';
import { IndianBankParser } from './indianBankParser';

interface TransactionNotification {
  id: string;
  amount: number;
  description: string;
  category?: string;
  date: string;
  type: 'income' | 'expense';
  merchant?: string;
  bank?: string;
}

class NotificationHandler {
  private isProcessing = false;
  private logLevel: 'debug' | 'info' | 'warn' | 'error' = 'debug';

  // Set log level
  setLogLevel(level: 'debug' | 'info' | 'warn' | 'error') {
    this.logLevel = level;
  }

  // Log messages with different levels
  private log(level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: any) {
    const levels = ['debug', 'info', 'warn', 'error'];
    if (levels.indexOf(level) >= levels.indexOf(this.logLevel)) {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`, data || '');
    }
  }

  // Process incoming notification/message
  async processNotification(notificationData: any): Promise<boolean> {
    this.log('debug', '🔔 Starting notification processing', { 
      notificationData,
      isProcessing: this.isProcessing 
    });

    // Show test alert for ALL notifications
    this.showTestAlert('Notification Received', JSON.stringify(notificationData, null, 2));

    if (this.isProcessing) {
      this.log('warn', '⚠️ Already processing a notification, skipping...');
      this.showTestAlert('Processing Busy', 'Already processing another notification');
      return false;
    }

    try {
      this.isProcessing = true;
      
      this.log('info', '📋 Extracting transaction data from notification');
      const transaction = this.extractTransactionFromNotification(notificationData);
      
      if (!transaction) {
        this.log('warn', '❌ No transaction data found in notification');
        this.showTestAlert('No Transaction Data', 'Notification received but no transaction data could be extracted');
        return false;
      }

      this.log('info', '✅ Transaction data extracted successfully', transaction);
      this.showTestAlert('Transaction Extracted', `Amount: ${transaction.amount}\nDesc: ${transaction.description}\nType: ${transaction.type}`);

      // Add transaction to database
      this.log('info', '💾 Adding transaction to database');
      const success = await this.addTransactionFromNotification(transaction);
      
      if (success) {
        this.log('info', '🎉 Transaction added successfully');
        this.showSuccessMessage(transaction);
        this.showTestAlert('SUCCESS', 'Transaction added to database successfully!');
        return true;
      } else {
        this.log('error', '❌ Failed to add transaction to database');
        this.showTestAlert('FAILED', 'Failed to add transaction to database');
        return false;
      }
      
    } catch (error) {
      this.log('error', '💥 Error processing notification', error);
      this.showErrorMessage('Failed to add transaction from notification');
      this.showTestAlert('ERROR', `Processing failed: ${error}`);
      return false;
    } finally {
      this.isProcessing = false;
      this.log('debug', '🔚 Notification processing completed');
    }
  }

  // Extract transaction data from various notification formats
  private extractTransactionFromNotification(notificationData: any): TransactionNotification | null {
    try {
      this.log('debug', '🔍 Analyzing notification format', {
        keys: Object.keys(notificationData),
        hasTransaction: !!notificationData.transaction,
        hasMessage: !!notificationData.message,
        hasAmount: !!notificationData.amount
      });

      // Log ALL notification data for testing
      this.log('info', '📨 RAW NOTIFICATION DATA', notificationData);

      // Format 1: Direct transaction data
      if (notificationData.transaction) {
        this.log('debug', '📊 Processing direct transaction format');
        const transaction = this.validateTransaction(notificationData.transaction);
        this.log('debug', '📊 Direct transaction result', transaction);
        return transaction;
      }
      
      // Format 2: SMS/Text message parsing (common in banking apps)
      if (notificationData.message) {
        this.log('debug', '💬 Processing SMS/message format', {
          message: notificationData.message,
          messageLength: notificationData.message.length
        });
        const transaction = this.parseTransactionFromMessage(notificationData.message);
        this.log('debug', '💬 SMS parsing result', transaction);
        return transaction;
      }
      
      // Format 3: Push notification with transaction info
      if (notificationData.amount && notificationData.description) {
        this.log('debug', '📱 Processing push notification format');
        const transaction = this.validateTransaction(notificationData);
        this.log('debug', '📱 Push notification result', transaction);
        return transaction;
      }
      
      // Format 4: Deep link URL parameters
      if (notificationData.url) {
        this.log('debug', '🔗 Processing URL/deep link format', { url: notificationData.url });
        const transaction = this.parseTransactionFromURL(notificationData.url);
        this.log('debug', '🔗 URL parsing result', transaction);
        return transaction;
      }

      // Format 5: Test notification
      if (notificationData.test) {
        this.log('info', '🧪 Processing test notification');
        return this.createTestTransaction(notificationData);
      }

      this.log('warn', '❓ Unknown notification format');
      return null;
    } catch (error) {
      this.log('error', '💥 Error extracting transaction from notification', error);
      return null;
    }
  }

  // Create test transaction for testing
  private createTestTransaction(notificationData: any): TransactionNotification {
    this.log('debug', '🧪 Creating test transaction', notificationData);
    
    const testTransaction: TransactionNotification = {
      id: `test_${Date.now()}`,
      amount: notificationData.amount || -100,
      description: notificationData.description || 'Test Transaction from Notification',
      date: new Date().toISOString().split('T')[0],
      type: notificationData.type || 'expense',
      merchant: notificationData.merchant || 'Test Merchant',
      category: notificationData.category || 'shopping'
    };

    this.log('info', '🧪 Test transaction created', testTransaction);
    return testTransaction;
  }

  // Parse transaction from SMS/message content
  private parseTransactionFromMessage(message: string): TransactionNotification | null {
    try {
      this.log('debug', '📝 Parsing transaction from message', { message });
 // First try Indian bank specific parser
    const bankTransaction = IndianBankParser.parseTransaction(message);
    if (bankTransaction) {
      this.log('info', '🏦 Indian bank transaction parsed', bankTransaction);
      
      return {
        id: `sms_${Date.now()}`,
        amount: bankTransaction.amount,
        description: bankTransaction.description,
        date: new Date().toISOString().split('T')[0],
        type: bankTransaction.type,
        merchant: bankTransaction.merchant,
        bank: bankTransaction.bank,
      };
    }
    
      // Common SMS patterns for different banks
      const patterns = [
        // Pattern 1: "INR 500.00 spent on MERCHANT on DATE"
        /(?:INR|Rs\.?)\s*([\d,]+\.?\d*)\s*(?:spent|debited|paid)\s*(?:on|at|with)\s*([^\.\n]+)/i,
        
        // Pattern 2: "Your a/c XX1234 debited by INR 1000.00 on DATE"
        /debited\s*by\s*(?:INR|Rs\.?)\s*([\d,]+\.?\d*)/i,
        
        // Pattern 3: "You have received INR 2000.00 from SENDER"
        /received\s*(?:INR|Rs\.?)\s*([\d,]+\.?\d*)\s*from/i,
        
        // Pattern 4: "Payment of INR 150.00 to MERCHANT"
        /Payment\s*of\s*(?:INR|Rs\.?)\s*([\d,]+\.?\d*)\s*to/i,
      ];

      this.log('debug', '🔍 Testing message against patterns', { patternCount: patterns.length });

      for (const [index, pattern] of patterns.entries()) {
        const match = message.match(pattern);
        this.log('debug', `🔍 Pattern ${index + 1} test`, { 
          pattern: pattern.toString(),
          match: match 
        });

        if (match) {
          const amount = parseFloat(match[1].replace(/,/g, ''));
          const description = this.extractDescription(message);
          const type = this.determineTransactionType(message);
          const merchant = this.extractMerchant(message);

          this.log('info', '✅ Message matched pattern', {
            patternIndex: index + 1,
            amount,
            description,
            type,
            merchant
          });

          return {
            id: `notif_${Date.now()}`,
            amount: type === 'expense' ? -Math.abs(amount) : Math.abs(amount),
            description: description || 'Transaction from notification',
            date: new Date().toISOString().split('T')[0],
            type: type,
            merchant: merchant,
          };
        }
      }

      this.log('warn', '❌ No patterns matched the message');
      return null;
    } catch (error) {
      this.log('error', '💥 Error parsing transaction from message', error);
      return null;
    }
  }

  private extractDescription(message: string): string {
    this.log('debug', '📄 Extracting description from message', { message });
    
    const keywords = ['on', 'at', 'with', 'to', 'from'];
    for (const keyword of keywords) {
      const parts = message.split(keyword);
      if (parts.length > 1) {
        const description = parts[1].split('.')[0].trim();
        this.log('debug', `✅ Description extracted with keyword "${keyword}"`, { description });
        return description;
      }
    }
    
    const fallback = 'Transaction from notification';
    this.log('debug', `⚠️ Using fallback description`, { fallback });
    return fallback;
  }

  private extractMerchant(message: string): string {
    this.log('debug', '🏪 Extracting merchant from message', { message });
    
    const merchantPatterns = [
      /(?:on|at|with|to)\s+([A-Za-z0-9\s&]+?)(?:\s+(?:on|at|date|\.|$))/i,
      /at\s+([A-Za-z0-9\s]+)/i,
    ];
    
    for (const [index, pattern] of merchantPatterns.entries()) {
      const match = message.match(pattern);
      this.log('debug', `🔍 Merchant pattern ${index + 1} test`, { 
        pattern: pattern.toString(),
        match: match 
      });

      if (match) {
        const merchant = match[1].trim();
        this.log('debug', `✅ Merchant extracted with pattern ${index + 1}`, { merchant });
        return merchant;
      }
    }
    
    this.log('debug', '⚠️ No merchant found, using empty string');
    return '';
  }

  private determineTransactionType(message: string): 'income' | 'expense' {
    this.log('debug', '💰 Determining transaction type from message', { message });
    
    const expenseKeywords = ['spent', 'debited', 'paid', 'payment', 'purchase'];
    const incomeKeywords = ['received', 'credited', 'deposit'];
    
    const lowerMessage = message.toLowerCase();
    
    for (const keyword of expenseKeywords) {
      if (lowerMessage.includes(keyword)) {
        this.log('debug', `✅ Transaction type: expense (keyword: ${keyword})`);
        return 'expense';
      }
    }
    
    for (const keyword of incomeKeywords) {
      if (lowerMessage.includes(keyword)) {
        this.log('debug', `✅ Transaction type: income (keyword: ${keyword})`);
        return 'income';
      }
    }
    
    // Default to expense for safety
    this.log('debug', '⚠️ No type keywords found, defaulting to expense');
    return 'expense';
  }

  private parseTransactionFromURL(url: string): TransactionNotification | null {
    try {
      this.log('debug', '🔗 Parsing transaction from URL', { url });
      
      const urlObj = new URL(url);
      const params = new URLSearchParams(urlObj.search);
      
      const amount = params.get('amount');
      const description = params.get('description');
      const type = params.get('type') as 'income' | 'expense';
      const merchant = params.get('merchant');
      
      this.log('debug', '🔗 URL parameters extracted', {
        amount, description, type, merchant
      });

      if (amount && description) {
        const transaction = {
          id: `url_${Date.now()}`,
          amount: type === 'income' ? Math.abs(parseFloat(amount)) : -Math.abs(parseFloat(amount)),
          description: description,
          date: new Date().toISOString().split('T')[0],
          type: type || 'expense',
          merchant: merchant || '',
        };

        this.log('info', '✅ Transaction parsed from URL', transaction);
        return transaction;
      }
      
      this.log('warn', '❌ Missing required parameters in URL');
      return null;
    } catch (error) {
      this.log('error', '💥 Error parsing transaction from URL', error);
      return null;
    }
  }

  private validateTransaction(transaction: any): TransactionNotification | null {
    this.log('debug', '✅ Validating transaction data', transaction);
    
    // Basic validation
    if (!transaction.amount || !transaction.description) {
      this.log('warn', '❌ Transaction validation failed: missing amount or description', {
        hasAmount: !!transaction.amount,
        hasDescription: !!transaction.description
      });
      return null;
    }

    const validatedTransaction = {
      id: transaction.id || `auto_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      amount: typeof transaction.amount === 'number' 
        ? transaction.amount 
        : parseFloat(transaction.amount),
      description: transaction.description,
      category: transaction.category,
      date: transaction.date || new Date().toISOString().split('T')[0],
      type: transaction.type || 'expense',
      merchant: transaction.merchant,
      bank: transaction.bank,
    };

    this.log('info', '✅ Transaction validated successfully', validatedTransaction);
    return validatedTransaction;
  }

  // Add transaction to database
  private async addTransactionFromNotification(transaction: TransactionNotification): Promise<boolean> {
    try {
      this.log('debug', '💾 Preparing database transaction', transaction);
      
      // Get the first available bank account instead of hardcoded ID
      const bankAccounts = await db.getBankAccounts();
      if (!bankAccounts || bankAccounts.length === 0) {
        this.log('error', '❌ No bank accounts found in database');
        throw new Error('No bank accounts available. Please add a bank account first.');
      }
      
      // Use the first bank account, or you can implement logic to choose the right one
      const defaultBankAccount = bankAccounts[0];
      
      const dbTransaction = {
        bank_account_id: defaultBankAccount.id, // Use real bank account ID
        category_id: this.mapCategory(transaction.category) || '66666666-6666-6666-6666-666666666670',
        person_id: 'user_1',
        transaction_date: transaction.date,
        amount: transaction.amount,
        type: transaction.type,
        description: transaction.description,
        merchant: transaction.merchant || '',
        is_recurring: false,
        is_investment: false,
        is_verified: true,
        source: 'notification',
      };
  
      this.log('info', '💾 Creating transaction in database', {
        ...dbTransaction,
        bank_account_name: defaultBankAccount.bank_name // Log the account name for debugging
      });
      
      await db.createTransaction(dbTransaction);
      
      this.log('info', '✅ Transaction successfully added to database', {
        id: transaction.id,
        amount: transaction.amount,
        description: transaction.description,
        bank_account: defaultBankAccount.bank_name
      });
      
      return true;
    } catch (error) {
      this.log('error', '💥 Error adding transaction to database', error);
      throw error;
    }
  }
  

  // Map category names to category IDs
  private mapCategory(categoryName?: string): string {
    if (!categoryName) {
      this.log('debug', '📂 No category provided, using default');
      return '';
    }
    
    const categoryMap: { [key: string]: string } = {
      'food': '66666666-6666-6666-6666-666666666669',
      'dining': '66666666-6666-6666-6666-666666666669',
      'restaurant': '66666666-6666-6666-6666-666666666669',
      'transport': '66666666-6666-6666-6666-666666666668',
      'transportation': '66666666-6666-6666-6666-666666666668',
      'shopping': '66666666-6666-6666-6666-666666666670',
      'entertainment': '66666666-6666-6666-6666-666666666671',
      'bills': '66666666-6666-6666-6666-666666666672',
      'utilities': '66666666-6666-6666-6666-666666666672',
      'salary': '66666666-6666-6666-6666-666666666673',
      'income': '66666666-6666-6666-6666-666666666673',
      'healthcare': '66666666-6666-6666-6666-666666666674',
    };

    const categoryId = categoryMap[categoryName.toLowerCase()] || '';
    this.log('debug', '📂 Category mapping', {
      input: categoryName,
      output: categoryId || 'NOT FOUND (using default)'
    });
    
    return categoryId;
  }

  // Show success message
  private showSuccessMessage(transaction: TransactionNotification) {
    const amount = Math.abs(transaction.amount);
    const type = transaction.type === 'income' ? 'Income' : 'Expense';
    const message = `${type} of $${amount.toFixed(2)} added successfully!`;
    
    this.log('info', '🎉 Showing success message', { message });

    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.LONG);
    } else {
      Alert.alert('Transaction Added', message, [{ text: 'OK' }]);
    }
    
    this.triggerCustomToast(message, 'success');
  }

  private showErrorMessage(errorMessage: string) {
    this.log('error', '❌ Showing error message', { errorMessage });

    if (Platform.OS === 'android') {
      ToastAndroid.show(errorMessage, ToastAndroid.LONG);
    } else {
      Alert.alert('Error', errorMessage, [{ text: 'OK' }]);
    }
    
    this.triggerCustomToast(errorMessage, 'error');
  }

  // Test alert for debugging
  private showTestAlert(title: string, message: string) {
    this.log('debug', '🧪 Showing test alert', { title, message });
    
    if (Platform.OS !== 'web') {
      Alert.alert(
        `🧪 ${title}`,
        message,
        [
          { text: 'OK', style: 'default' },
          { text: 'View Logs', onPress: () => this.showLogSummary() }
        ]
      );
    }
  }

  // Show log summary
  private showLogSummary() {
    this.log('info', '📊 Log summary requested');
    // In a real app, you might show a modal with recent logs
    Alert.alert('Log Summary', 'Check console for detailed logs');
  }

  private triggerCustomToast(message: string, type: 'success' | 'error') {
    this.log('debug', '💫 Triggering custom toast', { message, type });
    // This would trigger your custom toast component
    console.log(`🔔 Toast [${type}]: ${message}`);
  }

  // Public method to test the notification handler
  async testNotificationHandler(testData: any = null) {
    this.log('info', '🧪 Starting manual test of notification handler');
    
    const testNotification = testData || {
      test: true,
      message: 'INR 500.00 spent on Starbucks Coffee on 2024-01-15. Your current balance is INR 15,000.00',
      amount: -500,
      description: 'Starbucks Coffee',
      type: 'expense',
      merchant: 'Starbucks'
    };

    this.log('debug', '🧪 Test notification data', testNotification);
    return await this.processNotification(testNotification);
  }
}

export const notificationHandler = new NotificationHandler();