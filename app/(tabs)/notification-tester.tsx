// app/(tabs)/notification-tester.tsx
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Header from '../../components/Header';
import { NotificationTester } from '../../components/NotificationTester';

const COLORS = {
  primary: '#1e3a8a',
  background: '#f8fafc',
};

export default function NotificationTesterScreen() {
  return (
    <View style={styles.container}>
      <Header title="Notification Tester" subtitle="Test notification handling and transaction imports" />
      <ScrollView style={styles.scroll}>
        <NotificationTester />
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
});