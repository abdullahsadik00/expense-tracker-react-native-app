import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { ToastManager } from '../components/CustomToast';
import { notificationHandler } from '../lib/notificationHandler';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useEffect, useState } from 'react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // Listen for notifications (this would integrate with your notification library)
  useEffect(() => {
    // Example: Listen for push notifications
    const setupNotificationListener = async () => {
      // This is where you'd integrate with your push notification service
      // For example: Notifications.addNotificationReceivedListener(handleNotification);
    };

    setupNotificationListener();
  }, []);

  // Example function to simulate receiving a notification
  const simulateNotification = (notificationData: any) => {
    notificationHandler.processNotification(notificationData)
      .then(success => {
        if (success) {
          addToast('Transaction added from notification!', 'success');
        }
      })
      .catch(error => {
        addToast('Failed to add transaction from notification', 'error');
      });
  };

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      {/* Toast Manager */}
      <ToastManager toasts={toasts} onRemoveToast={removeToast} />

      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
