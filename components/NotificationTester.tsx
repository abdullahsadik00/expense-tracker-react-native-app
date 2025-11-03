// components/NotificationTester.tsx
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { notificationHandler } from '../lib/notificationHandler';

export const NotificationTester: React.FC = () => {
  const testNotifications = [
    {
      name: '🧪 Simple Test',
      data: {
        test: true,
        message: 'This is a simple test notification'
      },
    },
    {
      name: '💰 Expense SMS',
      data: {
        message: 'INR 500.00 spent on Starbucks on 2024-01-15. Your current balance is INR 15,000.00',
      },
    },
    {
      name: '💵 Income SMS',
      data: {
        message: 'You have received INR 2000.00 from John Doe. Your account balance is now INR 17,000.00',
      },
    },
    {
      name: '🏪 Direct Transaction',
      data: {
        transaction: {
          amount: -150,
          description: 'Uber Ride to Office',
          type: 'expense',
          merchant: 'Uber',
          category: 'transport'
        },
      },
    },
    {
      name: '🔗 URL Transaction',
      data: {
        url: 'myapp://transaction?amount=100&description=Test+Payment&type=income&merchant=TestCo',
      },
    },
    {
      name: '📱 Push Notification',
      data: {
        amount: -75,
        description: 'Grocery Shopping',
        type: 'expense',
        merchant: 'Supermarket',
        title: 'Transaction Alert',
        body: 'You spent $75 at Supermarket'
      },
    },
    {
      name: '❌ Invalid Message',
      data: {
        message: 'This is just a regular message without transaction data',
      },
    },
    {
      name: '🎯 Complex SMS',
      data: {
        message: 'Your a/c XX1234 debited by INR 1,200.00 on 15-JAN-2024. UPI Ref No 123456. Bal: INR 25,780.00',
      },
    }
  ];

  const handleTestNotification = async (notificationData: any, testName: string) => {
    console.log(`🧪 ===== STARTING TEST: ${testName} =====`);
    console.log('📤 Test Data:', notificationData);
    
    try {
      const result = await notificationHandler.processNotification(notificationData);
      console.log(`🧪 ===== TEST RESULT: ${result ? 'SUCCESS' : 'FAILED'} =====`);
    } catch (error) {
      console.error(`🧪 ===== TEST ERROR: ${error} =====`);
    }
  };

  const runAllTests = async () => {
    console.log('🧪 ===== RUNNING ALL NOTIFICATION TESTS =====');
    
    for (const test of testNotifications) {
      console.log(`\n🧪 === Testing: ${test.name} ===`);
      await handleTestNotification(test.data, test.name);
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('🧪 ===== ALL TESTS COMPLETED =====');
  };

  const clearLogs = () => {
    console.log('🧹 ===== CONSOLE CLEARED =====');
    // Note: In React Native, we can't actually clear console, but we can log a separator
    console.log('\n\n'.repeat(10));
    console.log('🧹 ===== NEW SESSION STARTED =====');
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🧪 Notification Handler Tester</Text>
      <Text style={styles.subtitle}>
        Test all notification formats and see detailed logs in console
      </Text>

      <TouchableOpacity style={styles.runAllButton} onPress={runAllTests}>
        <Text style={styles.buttonText}>🚀 Run All Tests</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.clearButton} onPress={clearLogs}>
        <Text style={styles.buttonText}>🧹 Clear Console</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Individual Tests:</Text>
      
      {testNotifications.map((test, index) => (
        <TouchableOpacity
          key={index}
          style={styles.button}
          onPress={() => handleTestNotification(test.data, test.name)}
        >
          <Text style={styles.buttonText}>{test.name}</Text>
        </TouchableOpacity>
      ))}

      <View style={styles.instructions}>
        <Text style={styles.instructionsTitle}>📋 Testing Instructions:</Text>
        <Text style={styles.instruction}>1. Open this screen</Text>
        <Text style={styles.instruction}>2. Open Developer Console (F12 or Remote Debugging)</Text>
        <Text style={styles.instruction}>3. Click any test button</Text>
        <Text style={styles.instruction}>4. Check console for detailed logs</Text>
        <Text style={styles.instruction}>5. Look for alerts and toasts on device</Text>
        <Text style={styles.instruction}>6. All notifications will be logged regardless of format</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 12,
    color: '#333',
  },
  runAllButton: {
    backgroundColor: '#10B981',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  clearButton: {
    backgroundColor: '#6B7280',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#3B82F6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  instructions: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
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
});