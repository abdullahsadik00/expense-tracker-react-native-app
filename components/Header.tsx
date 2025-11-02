import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface HeaderProps {
  onExport: () => void;
  onImport: () => void;
  onClear: () => void;
}

const Header: React.FC<HeaderProps> = ({ onExport, onImport, onClear }) => {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>Expense Tracker</Text>
      <View style={styles.headerButtons}>
        <TouchableOpacity style={styles.iconButton} onPress={onImport}>
          <Text style={styles.iconText}>📥</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={onExport}>
          <Text style={styles.iconText}>📤</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={onClear}>
          <Text style={styles.iconText}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerButtons: {
    flexDirection: 'row',
  },
  iconButton: {
    padding: 8,
    marginLeft: 12,
  },
  iconText: {
    fontSize: 20,
  },
});

export default Header;