import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

export interface Person {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: 'user' | 'family_member';
  color: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BankAccount {
  id: string;
  bank_name: string;
  account_number: string;
  account_type: string;
  current_balance: number;
  currency: string;
  owner_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  color: string;
  icon: string;
  is_essential: boolean;
  person_type: string;
  spending_limit?: number;
  description?: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  bank_account_id: string;
  category_id: string;
  person_id: string;
  transaction_date: string;
  amount: number;
  type: 'income' | 'expense';
  description: string;
  merchant?: string;
  reference_number?: string;
  closing_balance?: number;
  notes?: string;
  is_recurring: boolean;
  recurring_type?: string;
  is_investment: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface Budget {
  id: string;
  person_id: string;
  category_id?: string;
  bank_account_id?: string;
  month: string;
  amount: number;
  spent_amount: number;
  rollover_unused: boolean;
  notifications_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface SavingsGoal {
  id: string;
  person_id: string;
  bank_account_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date?: string;
  goal_type: string;
  priority: number;
  is_active: boolean;
  auto_save_amount?: number;
  auto_save_frequency?: string;
  created_at: string;
  updated_at: string;
}

class DatabaseService {
  private db: SQLite.SQLiteDatabase;

  constructor() {
    this.db = SQLite.openDatabase('expense_tracker.db');
    this.initDatabase();
  }

  private initDatabase() {
    this.db.transaction(tx => {
      // Create persons table
      tx.executeSql(`
        CREATE TABLE IF NOT EXISTS persons (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT,
          phone TEXT,
          role TEXT NOT NULL DEFAULT 'family_member',
          color TEXT DEFAULT '#3B82F6',
          is_active BOOLEAN DEFAULT true,
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now'))
        )
      `);

      // Create bank_accounts table
      tx.executeSql(`
        CREATE TABLE IF NOT EXISTS bank_accounts (
          id TEXT PRIMARY KEY,
          bank_name TEXT NOT NULL,
          account_number TEXT NOT NULL,
          account_type TEXT NOT NULL,
          current_balance REAL DEFAULT 0.00,
          currency TEXT DEFAULT 'INR',
          owner_id TEXT NOT NULL,
          is_active BOOLEAN DEFAULT true,
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now')),
          FOREIGN KEY (owner_id) REFERENCES persons (id)
        )
      `);

      // Create categories table
      tx.executeSql(`
        CREATE TABLE IF NOT EXISTS categories (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          type TEXT NOT NULL,
          color TEXT NOT NULL,
          icon TEXT NOT NULL,
          is_essential BOOLEAN DEFAULT false,
          person_type TEXT DEFAULT 'user',
          spending_limit REAL,
          description TEXT,
          created_at TEXT DEFAULT (datetime('now'))
        )
      `);

      // Create transactions table
      tx.executeSql(`
        CREATE TABLE IF NOT EXISTS transactions (
          id TEXT PRIMARY KEY,
          bank_account_id TEXT NOT NULL,
          category_id TEXT NOT NULL,
          person_id TEXT NOT NULL,
          transaction_date TEXT NOT NULL,
          amount REAL NOT NULL,
          type TEXT NOT NULL,
          description TEXT NOT NULL,
          merchant TEXT,
          reference_number TEXT,
          closing_balance REAL,
          notes TEXT,
          is_recurring BOOLEAN DEFAULT false,
          recurring_type TEXT,
          is_investment BOOLEAN DEFAULT false,
          is_verified BOOLEAN DEFAULT false,
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now')),
          FOREIGN KEY (bank_account_id) REFERENCES bank_accounts (id),
          FOREIGN KEY (category_id) REFERENCES categories (id),
          FOREIGN KEY (person_id) REFERENCES persons (id)
        )
      `);

      // Create budgets table
      tx.executeSql(`
        CREATE TABLE IF NOT EXISTS budgets (
          id TEXT PRIMARY KEY,
          person_id TEXT NOT NULL,
          category_id TEXT,
          bank_account_id TEXT,
          month TEXT NOT NULL,
          amount REAL NOT NULL,
          spent_amount REAL DEFAULT 0,
          rollover_unused BOOLEAN DEFAULT false,
          notifications_enabled BOOLEAN DEFAULT true,
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now')),
          FOREIGN KEY (person_id) REFERENCES persons (id),
          FOREIGN KEY (category_id) REFERENCES categories (id),
          FOREIGN KEY (bank_account_id) REFERENCES bank_accounts (id)
        )
      `);

      // Create savings_goals table
      tx.executeSql(`
        CREATE TABLE IF NOT EXISTS savings_goals (
          id TEXT PRIMARY KEY,
          person_id TEXT NOT NULL,
          bank_account_id TEXT NOT NULL,
          name TEXT NOT NULL,
          target_amount REAL NOT NULL,
          current_amount REAL DEFAULT 0,
          target_date TEXT,
          goal_type TEXT DEFAULT 'savings',
          priority INTEGER DEFAULT 1,
          is_active BOOLEAN DEFAULT true,
          auto_save_amount REAL,
          auto_save_frequency TEXT,
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now')),
          FOREIGN KEY (person_id) REFERENCES persons (id),
          FOREIGN KEY (bank_account_id) REFERENCES bank_accounts (id)
        )
      `);

      // Insert default data
      this.insertDefaultData(tx);
    });
  }

  private insertDefaultData(tx: SQLite.SQLTransaction) {
    // Insert default person
    tx.executeSql(`
      INSERT OR IGNORE INTO persons (id, name, role, color) 
      VALUES ('default_user', 'You', 'user', '#3B82F6')
    `);

    // Insert default categories
    const defaultCategories = [
      { id: '1', name: 'Food', type: 'expense', color: '#EF4444', icon: '🍔', is_essential: true },
      { id: '2', name: 'Transport', type: 'expense', color: '#F59E0B', icon: '🚗', is_essential: true },
      { id: '3', name: 'Entertainment', type: 'expense', color: '#8B5CF6', icon: '🎬', is_essential: false },
      { id: '4', name: 'Shopping', type: 'expense', color: '#EC4899', icon: '🛍️', is_essential: false },
      { id: '5', name: 'Bills', type: 'expense', color: '#06B6D4', icon: '📱', is_essential: true },
      { id: '6', name: 'Healthcare', type: 'expense', color: '#10B981', icon: '🏥', is_essential: true },
      { id: '7', name: 'Education', type: 'expense', color: '#6366F1', icon: '📚', is_essential: false },
      { id: '8', name: 'Salary', type: 'income', color: '#22C55E', icon: '💰', is_essential: false },
      { id: '9', name: 'Investment', type: 'income', color: '#14B8A6', icon: '📈', is_essential: false },
      { id: '10', name: 'Other', type: 'expense', color: '#6B7280', icon: '📦', is_essential: false },
    ];

    defaultCategories.forEach(category => {
      tx.executeSql(`
        INSERT OR IGNORE INTO categories (id, name, type, color, icon, is_essential) 
        VALUES (?, ?, ?, ?, ?, ?)
      `, [category.id, category.name, category.type, category.color, category.icon, category.is_essential]);
    });

    // Insert default bank account
    tx.executeSql(`
      INSERT OR IGNORE INTO bank_accounts (id, bank_name, account_number, account_type, owner_id) 
      VALUES ('default_account', 'Cash', 'CASH001', 'cash', 'default_user')
    `);
  }

  // Transaction methods
  async getTransactions(): Promise<Transaction[]> {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          `SELECT * FROM transactions ORDER BY transaction_date DESC, created_at DESC`,
          [],
          (_, { rows }) => resolve(rows._array as Transaction[]),
          (_, error) => { reject(error); return false; }
        );
      });
    });
  }

  async createTransaction(transaction: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>): Promise<Transaction> {
    const id = this.generateId();
    const now = new Date().toISOString();

    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          `INSERT INTO transactions 
           (id, bank_account_id, category_id, person_id, transaction_date, amount, type, description, merchant, reference_number, closing_balance, notes, is_recurring, recurring_type, is_investment, is_verified, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id, transaction.bank_account_id, transaction.category_id, transaction.person_id,
            transaction.transaction_date, transaction.amount, transaction.type, transaction.description,
            transaction.merchant, transaction.reference_number, transaction.closing_balance,
            transaction.notes, transaction.is_recurring, transaction.recurring_type,
            transaction.is_investment, transaction.is_verified, now, now
          ],
          () => {
            resolve({ ...transaction, id, created_at: now, updated_at: now });
          },
          (_, error) => { reject(error); return false; }
        );
      });
    });
  }

  async deleteTransaction(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          'DELETE FROM transactions WHERE id = ?',
          [id],
          () => resolve(),
          (_, error) => { reject(error); return false; }
        );
      });
    });
  }

  // Category methods
  async getCategories(): Promise<Category[]> {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM categories ORDER BY name',
          [],
          (_, { rows }) => resolve(rows._array as Category[]),
          (_, error) => { reject(error); return false; }
        );
      });
    });
  }

  // Bank Account methods
  async getBankAccounts(): Promise<BankAccount[]> {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM bank_accounts WHERE is_active = true ORDER BY bank_name',
          [],
          (_, { rows }) => resolve(rows._array as BankAccount[]),
          (_, error) => { reject(error); return false; }
        );
      });
    });
  }

  async createBankAccount(account: Omit<BankAccount, 'id' | 'created_at' | 'updated_at'>): Promise<BankAccount> {
    const id = this.generateId();
    const now = new Date().toISOString();

    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          `INSERT INTO bank_accounts 
           (id, bank_name, account_number, account_type, current_balance, currency, owner_id, is_active, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id, account.bank_name, account.account_number, account.account_type,
            account.current_balance, account.currency, account.owner_id,
            account.is_active, now, now
          ],
          () => {
            resolve({ ...account, id, created_at: now, updated_at: now });
          },
          (_, error) => { reject(error); return false; }
        );
      });
    });
  }

  // Budget methods
  async getBudgets(): Promise<Budget[]> {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM budgets ORDER BY month DESC',
          [],
          (_, { rows }) => resolve(rows._array as Budget[]),
          (_, error) => { reject(error); return false; }
        );
      });
    });
  }

  // Savings Goals methods
  async getSavingsGoals(): Promise<SavingsGoal[]> {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM savings_goals WHERE is_active = true ORDER BY priority, target_date',
          [],
          (_, { rows }) => resolve(rows._array as SavingsGoal[]),
          (_, error) => { reject(error); return false; }
        );
      });
    });
  }

  // Export/Import methods
  async exportData(): Promise<string> {
    const data = {
      persons: await this.getTableData('persons'),
      bank_accounts: await this.getTableData('bank_accounts'),
      categories: await this.getTableData('categories'),
      transactions: await this.getTableData('transactions'),
      budgets: await this.getTableData('budgets'),
      savings_goals: await this.getTableData('savings_goals'),
      export_date: new Date().toISOString(),
      version: '1.0'
    };

    return JSON.stringify(data, null, 2);
  }

  async importData(jsonData: string): Promise<void> {
    const data = JSON.parse(jsonData);
    
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        // Clear existing data
        const tables = ['transactions', 'budgets', 'savings_goals', 'bank_accounts', 'categories', 'persons'];
        
        tables.forEach(table => {
          tx.executeSql(`DELETE FROM ${table}`, []);
        });

        // Import data
        if (data.persons) {
          data.persons.forEach((person: Person) => {
            tx.executeSql(
              `INSERT INTO persons (id, name, email, phone, role, color, is_active, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [person.id, person.name, person.email, person.phone, person.role, person.color, person.is_active, person.created_at, person.updated_at]
            );
          });
        }

        if (data.categories) {
          data.categories.forEach((category: Category) => {
            tx.executeSql(
              `INSERT INTO categories (id, name, type, color, icon, is_essential, person_type, spending_limit, description, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [category.id, category.name, category.type, category.color, category.icon, category.is_essential, category.person_type, category.spending_limit, category.description, category.created_at]
            );
          });
        }

        // Continue for other tables...
        resolve();
      }, reject);
    });
  }

  private async getTableData(tableName: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          `SELECT * FROM ${tableName}`,
          [],
          (_, { rows }) => resolve(rows._array),
          (_, error) => { reject(error); return false; }
        );
      });
    });
  }

  private generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }
}

export const db = new DatabaseService();