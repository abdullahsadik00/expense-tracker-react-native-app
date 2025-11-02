import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { db } from './database';

const BACKUP_SETTINGS_KEY = '@backup_settings';

export interface BackupSettings {
  googleDriveEnabled: boolean;
  autoBackup: boolean;
  lastBackupDate?: string;
}

export class BackupService {
  private settings: BackupSettings = {
    googleDriveEnabled: false,
    autoBackup: false
  };

  constructor() {
    this.loadSettings();
  }

  private async loadSettings() {
    try {
      const stored = await AsyncStorage.getItem(BACKUP_SETTINGS_KEY);
      if (stored) {
        this.settings = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load backup settings:', error);
    }
  }

  private async saveSettings() {
    try {
      await AsyncStorage.setItem(BACKUP_SETTINGS_KEY, JSON.stringify(this.settings));
    } catch (error) {
      console.error('Failed to save backup settings:', error);
    }
  }

  // Main export method
  async exportData(): Promise<void> {
    try {
      const data = await db.exportData();
      
      // In Expo SDK 54, use the documentDirectory directly from FileSystem
      // Note: The type definitions might be incorrect, but the runtime should work
      const directoryUri = (FileSystem as any).documentDirectory;
      if (!directoryUri) {
        throw new Error('Cannot access document directory');
      }
      
      const fileUri = `${directoryUri}expense_tracker_backup_${Date.now()}.json`;
      
      await FileSystem.writeAsStringAsync(fileUri, data);
      
      // Share the file
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: 'Export Your Expense Data'
        });
        
        // Clean up after sharing (optional)
        setTimeout(async () => {
          try {
            await FileSystem.deleteAsync(fileUri);
          } catch (error) {
            console.log('Cleanup error:', error);
          }
        }, 5000);
      } else {
        throw new Error('Sharing is not available on this device');
      }
    } catch (error) {
      console.error('Export error:', error);
      throw new Error('Failed to export data');
    }
  }

  // Alternative export that works around TypeScript issues
  async exportToShare(): Promise<void> {
    try {
      const data = await db.exportData();
      
      // Create a temporary file name
      const fileName = `expense_backup_${Date.now()}.json`;
      
      // Write to a known location - using documentDirectory
      const fileUri = `${(FileSystem as any).documentDirectory}${fileName}`;
      
      await FileSystem.writeAsStringAsync(fileUri, data);
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        // Fallback: Save to AsyncStorage as backup
        const backupKey = `export_${Date.now()}`;
        await AsyncStorage.setItem(backupKey, data);
        console.log('Data saved locally with key:', backupKey);
      }
    } catch (error) {
      console.error('Export error:', error);
      throw error;
    }
  }

  async importFromFile(uri: string): Promise<void> {
    try {
      const content = await FileSystem.readAsStringAsync(uri);
      await db.importData(content);
    } catch (error) {
      console.error('Import error:', error);
      throw new Error('Failed to import data');
    }
  }

  async setGoogleDriveBackup(enabled: boolean) {
    this.settings.googleDriveEnabled = enabled;
    await this.saveSettings();
    
    if (enabled && this.settings.autoBackup) {
      await this.backupToGoogleDrive();
    }
  }

  async setAutoBackup(enabled: boolean) {
    this.settings.autoBackup = enabled;
    await this.saveSettings();
  }

  async backupToGoogleDrive() {
    if (!this.settings.googleDriveEnabled) {
      throw new Error('Google Drive backup is not enabled');
    }

    try {
      const backupData = await db.exportData();
      
      // Store backup locally - Google Drive API integration would go here
      const backupKey = `google_drive_backup_${Date.now()}`;
      await AsyncStorage.setItem(backupKey, backupData);
      
      this.settings.lastBackupDate = new Date().toISOString();
      await this.saveSettings();

      console.log('Google Drive backup prepared. Data size:', backupData.length);
      
    } catch (error) {
      console.error('Google Drive backup error:', error);
      throw error;
    }
  }

  // Simple backup to local storage
  async createLocalBackup(): Promise<string> {
    try {
      const data = await db.exportData();
      const backupKey = `local_backup_${Date.now()}`;
      
      await AsyncStorage.setItem(backupKey, data);
      
      // Store backup metadata
      const backups = await this.getLocalBackups();
      backups.push({
        key: backupKey,
        date: new Date().toISOString(),
        size: data.length
      });
      
      await AsyncStorage.setItem('@local_backups', JSON.stringify(backups));
      
      return backupKey;
    } catch (error) {
      console.error('Local backup error:', error);
      throw error;
    }
  }

  async getLocalBackups(): Promise<Array<{key: string; date: string; size: number}>> {
    try {
      const backups = await AsyncStorage.getItem('@local_backups');
      return backups ? JSON.parse(backups) : [];
    } catch (error) {
      console.error('Get backups error:', error);
      return [];
    }
  }

  async restoreFromLocalBackup(backupKey: string): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(backupKey);
      if (!data) {
        throw new Error('Backup not found');
      }
      
      await db.importData(data);
    } catch (error) {
      console.error('Restore error:', error);
      throw error;
    }
  }

  // Method to check available directories (for debugging)
  async checkDirectories(): Promise<{documentDirectory: string | null}> {
    return {
      documentDirectory: (FileSystem as any).documentDirectory || null
    };
  }

  getSettings(): BackupSettings {
    return { ...this.settings };
  }
}

export const backupService = new BackupService();