// app/(tabs)/sms-manager.tsx
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import Header from '../../components/Header';
import { ManualSMSImport } from '../../components/ManualSMSImport';
import { NotificationListener } from '../../lib/notificationListener';

const COLORS = {
  primary: '#1e3a8a',
  background: '#f8fafc',
};

export default function SMSManagerScreen() {
  const [notificationPermission, setNotificationPermission] = useState(false);
  const [isNotificationListening, setIsNotificationListening] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkNotificationPermissions();
  }, []);

  const checkNotificationPermissions = async () => {
    const hasPermission = await NotificationListener.checkNotificationPermissions();
    setNotificationPermission(hasPermission);
  };

  const requestNotificationPermissions = async () => {
    setLoading(true);
    try {
      const granted = await NotificationListener.requestNotificationPermissions();
      setNotificationPermission(granted);
      if (granted) {
        Alert.alert('Success', 'Notification permissions granted!');
      } else {
        Alert.alert('Permission Required', 'Notification permissions are needed for automatic transaction detection.');
      }
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      Alert.alert('Error', 'Failed to request notification permissions.');
    } finally {
      setLoading(false);
    }
  };

  const startNotificationListening = async () => {
    setLoading(true);
    try {
      const started = await NotificationListener.startListening();
      setIsNotificationListening(started);
      if (started) {
        Alert.alert('Started', 'Notification listener started! You will get automatic transactions from banking app notifications.');
      } else {
        Alert.alert('Failed', 'Could not start notification listener. Please check permissions.');
      }
    } catch (error) {
      console.error('Error starting notification listener:', error);
      Alert.alert('Error', 'Failed to start notification listener.');
    } finally {
      setLoading(false);
    }
  };

  const stopNotificationListening = () => {
    NotificationListener.stopListening();
    setIsNotificationListening(false);
    Alert.alert('Stopped', 'Notification listener stopped.');
  };

  const sendTestNotification = async () => {
    await NotificationListener.sendTestNotification();
    Alert.alert('Test Sent', 'Check for a test notification to see how it works!');
  };

  return (
    <View style={styles.container}>
      <Header title="Transaction Import" subtitle="Add transactions manually or automatically from notifications" />
      <ScrollView style={styles.scroll}>

        {/* Manual SMS Import Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📱 Manual SMS Import</Text>
          <Text style={styles.sectionSubtitle}>
            Paste bank SMS messages manually for reliable transaction import
          </Text>
          <ManualSMSImport />
        </View>

      </ScrollView>
    </View>
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
  section: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 14,
    color: '#666',
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  success: {
    color: '#10B981',
  },
  error: {
    color: '#EF4444',
  },
  button: {
    backgroundColor: '#3B82F6',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  successButton: {
    backgroundColor: '#10B981',
  },
  errorButton: {
    backgroundColor: '#EF4444',
  },
  testButton: {
    backgroundColor: '#8B5CF6',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  note: {
    backgroundColor: '#F0F9FF',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#0EA5E9',
  },
  noteTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#0369A1',
  },
  noteText: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
  },
});