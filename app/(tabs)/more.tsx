// app/(tabs)/more.tsx
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function MoreScreen() {
  const menuItems = [
    {
      title: 'Savings',
      icon: 'piggy-bank',
      screen: '/savings',
    },
    {
      title: 'Investments',
      icon: 'trending-up',
      screen: '/investments',
    },
    {
      title: 'Loans',
      icon: 'cash',
      screen: '/loans',
    },
    {
      title: 'Reports',
      icon: 'chart-bar',
      screen: '/reports',
    },
    {
      title: 'Import',
      icon: 'import',
      screen: '/import',
    },
    {
      title: 'Test Notifications',
      icon: 'bell',
      screen: '/notification-tester',
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>More Options</Text>
      
      <View style={styles.menuContainer}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={() => router.push(item.screen as any)}
          >
            <View style={styles.menuItemLeft}>
              <MaterialCommunityIcons name={item.icon as any} size={24} color="#666" />
              <Text style={styles.menuItemText}>{item.title}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#999" />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  menuContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    marginLeft: 12,
    color: '#333',
  },
});