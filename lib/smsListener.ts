// lib/smsListener.ts
import { PermissionsAndroid, Platform } from 'react-native';
import SmsListener from 'react-native-android-sms-listener';
import { notificationHandler } from './notificationHandler';

export class SMSListener {
  private static isListening = false;
  private static subscription: any = null;

  // Check if SMS reading is supported
  static isSupported(): boolean {
    return Platform.OS === 'android';
  }

  // Request SMS permissions (Android)
  static async requestSMSPermissions(): Promise<boolean> {
    try {
      console.log('🔒 Starting SMS permission request...');
      
      if (Platform.OS !== 'android') {
        console.log('❌ Not an Android device');
        return false;
      }
  
      // Add a timeout to prevent hanging
      const timeoutPromise = new Promise<boolean>((resolve) => {
        setTimeout(() => {
          console.log('⏰ Permission request timeout');
          resolve(false);
        }, 10000); // 10 second timeout
      });
  
      const permissionPromise = (async () => {
        try {
          // Request READ_SMS first
          const readSmsGranted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.READ_SMS,
            {
              title: 'SMS Read Permission',
              message: 'This app needs access to your SMS to automatically detect transaction messages from your bank.',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            }
          );
  
          console.log('READ_SMS permission result:', readSmsGranted);
  
          // If READ_SMS is denied, no need to request RECEIVE_SMS
          if (readSmsGranted !== PermissionsAndroid.RESULTS.GRANTED) {
            console.log('READ_SMS not granted, skipping RECEIVE_SMS');
            return false;
          }
  
          // Request RECEIVE_SMS
          const receiveSmsGranted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
            {
              title: 'SMS Receive Permission',
              message: 'This app needs to receive SMS to automatically detect transactions in real-time.',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            }
          );
  
          console.log('RECEIVE_SMS permission result:', receiveSmsGranted);
  
          const allGranted = 
            readSmsGranted === PermissionsAndroid.RESULTS.GRANTED &&
            receiveSmsGranted === PermissionsAndroid.RESULTS.GRANTED;
  
          console.log('All permissions granted:', allGranted);
          return allGranted;
  
        } catch (error) {
          console.error('💥 Error in permission request:', error);
          return false;
        }
      })();
  
      // Race between permission request and timeout
      return Promise.race([permissionPromise, timeoutPromise]);
  
    } catch (error) {
      console.error('💥 Error requesting SMS permissions:', error);
      return false;
    }
  }
  

  // Check current permissions
  static async checkSMSPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        const readSms = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_SMS);
        const receiveSms = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECEIVE_SMS);
        return readSms && receiveSms;
      }
      return false;
    } catch (error) {
      console.error('Error checking SMS permissions:', error);
      return false;
    }
  }

  // Start listening for incoming SMS
  static async startListening(): Promise<boolean> {
    if (this.isListening || Platform.OS !== 'android') {
      return false;
    }

    try {
      // Check permissions first
      const hasPermission = await this.checkSMSPermissions();
      if (!hasPermission) {
        console.log('❌ SMS permissions not granted');
        return false;
      }

      // Listen for incoming SMS
      this.subscription = SmsListener.addListener((message: any) => {
        console.log('📱 Received SMS:', message);
        this.processIncomingSMS(message.body, message.originatingAddress);
      });

      this.isListening = true;
      console.log('✅ SMS listener started successfully');
      return true;
    } catch (error) {
      console.error('Error starting SMS listener:', error);
      return false;
    }
  }

  // Stop listening
  static stopListening() {
    if (this.subscription) {
      this.subscription.remove();
      this.subscription = null;
      this.isListening = false;
      console.log('🛑 SMS listener stopped');
    }
  }

  // Process incoming SMS
  static async processIncomingSMS(message: string, sender: string = 'Unknown') {
    console.log('📱 Processing incoming SMS:', { message, sender });
    
    // Filter for transaction-related messages
    if (this.isTransactionMessage(message)) {
      console.log('💰 Transaction SMS detected');
      await notificationHandler.processNotification({ 
        message,
        sender,
        source: 'sms',
        timestamp: new Date().toISOString()
      });
    } else {
      console.log('📨 Non-transaction SMS, ignoring');
    }
  }

  // Check if message is likely a transaction
  private static isTransactionMessage(message: string): boolean {
    const transactionKeywords = [
      // Debit keywords
      'debited', 'spent', 'paid', 'purchase', 'purchased', 'transaction',
      'withdrawn', 'withdrawal', 'payment', 'charged', 'billed',
      
      // Credit keywords  
      'credited', 'received', 'deposited', 'deposit', 'refund',
      
      // Amount patterns
      'inr', 'rs.', 'amount', 'bal', 'balance',
      
      // Bank names (common Indian banks)
      'hdfc', 'icici', 'sbi', 'axis', 'kotak', 'yes bank', 'pnb',
      'bank of baroda', 'canara bank', 'union bank', 'upi'
    ];

    const lowerMessage = message.toLowerCase();
    return transactionKeywords.some(keyword => lowerMessage.includes(keyword));
  }

  // Manual SMS import from clipboard (fallback)
  static async importFromClipboard(): Promise<boolean> {
    try {
      // You can use expo-clipboard for this
      // const { getStringAsync } = await import('expo-clipboard');
      // const text = await getStringAsync();
      
      // For now, we'll simulate clipboard import
      console.log('📋 Manual SMS import triggered');
      return true;
    } catch (error) {
      console.error('Error importing from clipboard:', error);
      return false;
    }
  }
}