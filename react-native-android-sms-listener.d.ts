declare module 'react-native-android-sms-listener' {
    interface SMSMessage {
      originatingAddress: string;
      body: string;
      timestamp: number;
    }
  
    interface SmsListenerSubscription {
      remove(): void;
    }
  
    interface SmsListener {
      addListener(callback: (message: SMSMessage) => void): SmsListenerSubscription;
    }
  
    const SmsListener: SmsListener;
    export default SmsListener;
  }
  