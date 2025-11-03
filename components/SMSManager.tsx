// components/SMSManager.tsx - UPDATED
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SMSListener } from '../lib/smsListener';

export const SMSManager: React.FC = () => {
  const [hasPermissions, setHasPermissions] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('');

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    if (Platform.OS === 'android') {
      setIsLoading(true);
      setDebugInfo('Checking permissions...');
      const permissions = await SMSListener.checkSMSPermissions();
      setHasPermissions(permissions);
      setDebugInfo(`Permission check result: ${permissions}`);
      setIsLoading(false);
    }
  };

  const requestPermissions = async () => {
    console.log('🔄 Requesting SMS permissions...');
    setIsLoading(true);
    setDebugInfo('Requesting permissions...');
    
    try {
      if (Platform.OS === 'android') {
        const granted = await SMSListener.requestSMSPermissions();
        setHasPermissions(granted);
        setDebugInfo(`Permission request completed: ${granted}`);
        
        if (granted) {
          Alert.alert('Success ✅', 'SMS permissions granted! You can now start the SMS listener.');
        } else {
          Alert.alert(
            'Permission Not Granted ❌', 
            'SMS permissions were not granted. This could be because:\n\n' +
            '• You clicked "Deny" or "Ask Me Later"\n' +
            '• Your Android version restricts SMS access\n' +
            '• The permission dialog timed out\n\n' +
            'You can try the manual SMS import feature instead.'
          );
        }
      }
    } catch (error) {
      console.error('Permission request error:', error);
      setDebugInfo(`Error: ${error}`);
      Alert.alert('Error', 'Failed to request permissions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const startSMSListening = async () => {
    setIsLoading(true);
    setDebugInfo('Starting SMS listener...');
    if (Platform.OS === 'android') {
      const started = await SMSListener.startListening();
      setIsListening(started);
      setDebugInfo(`Listener started: ${started}`);
      if (started) {
        Alert.alert('Started ✅', 'SMS listener started. Transactions will be automatically added when you receive bank SMS.');
      } else {
        Alert.alert('Failed to Start', 'Could not start SMS listener. Please check permissions.');
      }
    }
    setIsLoading(false);
  };

  const stopSMSListening = () => {
    if (Platform.OS === 'android') {
      SMSListener.stopListening();
      setIsListening(false);
      setDebugInfo('Listener stopped');
      Alert.alert('Stopped', 'SMS listener stopped.');
    }
  };

  // Add manual SMS import function
  const importFromClipboard = async () => {
    try {
      setDebugInfo('Importing from clipboard...');
      // For now, we'll simulate this since we don't have expo-clipboard
      Alert.alert(
        'Manual SMS Import',
        'To manually import a transaction:\n\n1. Copy the bank SMS to clipboard\n2. Paste it in the text area\n3. Click "Process SMS"\n\nThis feature will be implemented in the next update.'
      );
      setDebugInfo('Clipboard import triggered');
    } catch (error) {
      console.error('Clipboard import error:', error);
      setDebugInfo(`Clipboard error: ${error}`);
    }
  };

  if (Platform.OS !== 'android') {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>
          📱 SMS auto-detection is only available on Android devices.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>📱 SMS Transaction Auto-Detection</Text>
      
      {/* Debug Info */}
      <View style={styles.debugContainer}>
        <Text style={styles.debugTitle}>Debug Information:</Text>
        <Text style={styles.debugText}>{debugInfo || 'No activity yet...'}</Text>
      </View>

      <View style={styles.statusContainer}>
        <Text style={styles.statusLabel}>Permissions:</Text>
        {isLoading ? (
          <ActivityIndicator size="small" color="#3B82F6" />
        ) : (
          <Text style={[styles.statusValue, hasPermissions ? styles.success : styles.error]}>
            {hasPermissions ? '✅ Granted' : '❌ Not Granted'}
          </Text>
        )}
      </View>

      <View style={styles.statusContainer}>
        <Text style={styles.statusLabel}>Listener Status:</Text>
        <Text style={[styles.statusValue, isListening ? styles.success : styles.error]}>
          {isListening ? '✅ Listening' : '❌ Stopped'}
        </Text>
      </View>

      {!hasPermissions && (
        <TouchableOpacity 
          style={[styles.button, isLoading && styles.disabledButton]} 
          onPress={requestPermissions}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <ActivityIndicator color="white" />
              <Text style={[styles.buttonText, {marginTop: 8}]}>Requesting...</Text>
            </>
          ) : (
            <Text style={styles.buttonText}>🔒 Request SMS Permissions</Text>
          )}
        </TouchableOpacity>
      )}

      {hasPermissions && !isListening && (
        <TouchableOpacity 
          style={[styles.button, styles.successButton]} 
          onPress={startSMSListening}
        >
          <Text style={styles.buttonText}>🚀 Start SMS Listening</Text>
        </TouchableOpacity>
      )}

      {hasPermissions && isListening && (
        <TouchableOpacity style={[styles.button, styles.errorButton]} onPress={stopSMSListening}>
          <Text style={styles.buttonText}>🛑 Stop SMS Listening</Text>
        </TouchableOpacity>
      )}

      {/* Manual Import Button */}
      <TouchableOpacity 
        style={[styles.button, styles.infoButton]} 
        onPress={importFromClipboard}
      >
        <Text style={styles.buttonText}>📋 Manual SMS Import</Text>
      </TouchableOpacity>

      <View style={styles.instructions}>
        <Text style={styles.instructionsTitle}>📋 How It Works:</Text>
        <Text style={styles.instruction}>1. Grant SMS permissions when prompted</Text>
        <Text style={styles.instruction}>2. Start the SMS listener</Text>
        <Text style={styles.instruction}>3. When you receive transaction SMS from your bank, they will be automatically processed</Text>
        <Text style={styles.instruction}>4. Supported banks: HDFC, ICICI, SBI, Axis, UPI transactions</Text>
        <Text style={styles.instruction}>5. Check console logs for detailed processing information</Text>
      </View>

      <View style={styles.note}>
        <Text style={styles.noteTitle}>ℹ️ Important Note:</Text>
        <Text style={styles.noteText}>
          • SMS permissions are heavily restricted on Android 10+{'\n'}
          • This may not work on newer Android versions{'\n'}
          • Manual SMS import is recommended as backup{'\n'}
          • Your data stays on your device
        </Text>
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
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
  },
  debugContainer: {
    backgroundColor: '#1F2937',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#60A5FA',
    marginBottom: 4,
  },
  debugText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'monospace',
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 16,
    color: '#666',
  },
  statusValue: {
    fontSize: 16,
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
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
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
  infoButton: {
    backgroundColor: '#8B5CF6',
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
  note: {
    backgroundColor: '#FEF3C7',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  noteTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#92400E',
  },
  noteText: {
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginTop: 20,
  },
});