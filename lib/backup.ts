import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { db } from './database';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

  async exportToFile(): Promise<string> {
    try {
      const data = await db.exportData();
      const fileUri = FileSystem.documentDirectory + `expense_backup_${Date.now()}.json`;
      
      await FileSystem.writeAsStringAsync(fileUri, data);
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: 'Export Expense Data',
          UTI: 'public.json'
        });
      }
      
      return fileUri;
    } catch (error) {
      throw new Error('Failed to export data: ' + error);
    }
  }

  async importFromFile(uri: string): Promise<void> {
    try {
      const content = await FileSystem.readAsStringAsync(uri);
      await db.importData(content);
    } catch (error) {
      throw new Error('Failed to import data: ' + error);
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

    // For now, we'll export to file since Google Drive integration requires additional setup
    // In a real app, you would use Google Drive API here
    const backupData = await db.exportData();
    
    // Store backup locally with timestamp
    const backupFile = FileSystem.documentDirectory + `google_drive_backup_${Date.now()}.json`;
    await FileSystem.writeAsStringAsync(backupFile, backupData);
    
    this.settings.lastBackupDate = new Date().toISOString();
    await this.saveSettings();

    // Note: Actual Google Drive upload would go here
    console.log('Backup ready for Google Drive upload:', backupFile);
  }

  getSettings(): BackupSettings {
    return { ...this.settings };
  }
}

export const backupService = new BackupService();