// lib/notificationListener.ts

// Configure how notifications are handled when app is foreground
// Notifications.setNotificationHandler({
//   handleNotification: async () => ({
//     shouldShowAlert: true,
//     shouldPlaySound: true,
//     shouldSetBadge: true,
//     shouldShowBanner: true,
//     shouldShowList: true,
//   }),
// });

export class NotificationListener {
  private static isListening = false;
  private static subscription: any = null;
  private static subscriptionResponse: any = null;

  // Check notification permissions
  // static async checkNotificationPermissions(): Promise<boolean> {
  //   const { status } = await Notifications.getPermissionsAsync();
  //   return status === 'granted';
  // }

  // Request notification permissions
  // static async requestNotificationPermissions(): Promise<boolean> {
  //   try {
  //     const { status } = await Notifications.requestPermissionsAsync();
  //     return status === 'granted';
  //   } catch (error) {
  //     console.error('Error requesting notification permissions:', error);
  //     return false;
  //   }
  // }

  // Start listening for notifications
  // static async startListening(): Promise<boolean> {
  //   if (this.isListening) {
  //     return false;
  //   }

  //   try {
  //     const hasPermission = await this.checkNotificationPermissions();
  //     if (!hasPermission) {
  //       console.log('❌ Notification permissions not granted');
  //       return false;
  //     }

  //     // Listen for notifications received in foreground
  //     this.subscription = Notifications.addNotificationReceivedListener(notification => {
  //       console.log('📢 Notification received:', notification);
  //       this.processNotification(notification);
  //     });

  //     // Listen for notification responses (user taps on notification)
  //     this.subscriptionResponse = Notifications.addNotificationResponseReceivedListener(response => {
  //       console.log('👆 User tapped notification:', response);
  //       this.processNotification(response.notification);
  //     });

  //     this.isListening = true;
  //     console.log('✅ Notification listener started successfully');
  //     return true;
  //   } catch (error) {
  //     console.error('Error starting notification listener:', error);
  //     return false;
  //   }
  // }

  // Stop listening
  static stopListening() {
    if (this.subscription) {
      this.subscription.remove();
      this.subscription = null;
      this.isListening = false;
      console.log('🛑 Notification listener stopped');
    }
  }

  // Process incoming notification
  // private static async processNotification(notification: any) {
  //   try {
  //     const { title, body, data } = notification.request.content;
      
  //     console.log('📢 Processing notification:', { title, body, data });

  //     // Check if this looks like a transaction notification
  //     if (this.isTransactionNotification(title, body)) {
  //       console.log('💰 Transaction notification detected');
        
  //       // Try different data formats from notification
  //       const notificationData = {
  //         title,
  //         body,
  //         data,
  //         message: body, // Use body as message for SMS parsing
  //         source: 'notification',
  //         timestamp: new Date().toISOString()
  //       };

  //       await notificationHandler.processNotification(notificationData);
  //     } else {
  //       console.log('📨 Non-transaction notification, ignoring');
  //     }
  //   } catch (error) {
  //     console.error('Error processing notification:', error);
  //   }
  // }

  // Check if notification is likely a transaction
  private static isTransactionNotification(title: string, body: string): boolean {
    const transactionKeywords = [
      'debited', 'credited', 'transaction', 'payment', 'spent', 'received',
      'inr', 'rs.', 'amount', 'balance', 'upi', 'bank', 'card'
    ];

    const lowerTitle = (title || '').toLowerCase();
    const lowerBody = (body || '').toLowerCase();
    const combined = lowerTitle + ' ' + lowerBody;

    return transactionKeywords.some(keyword => combined.includes(keyword));
  }

  // Send a test notification (for testing)
  // static async sendTestNotification() {
  //   await Notifications.scheduleNotificationAsync({
  //     content: {
  //       title: "Test Transaction Alert",
  //       body: "INR 500.00 spent on Starbucks. Your balance is INR 15,000.00",
  //       data: { 
  //         test: true,
  //         amount: -500,
  //         description: "Starbucks Coffee",
  //         type: "expense"
  //       },
  //     },
  //     trigger: null, // Send immediately
  //   });
  // }
}