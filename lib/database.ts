import * as SQLite from 'expo-sqlite';

// Updated interfaces to match PostgreSQL schema
export interface Person {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: 'user' | 'family_member' | 'dad_business' | 'mom';
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
  type: 'income' | 'expense' | 'transfer';
  color: string;
  icon: string;
  is_essential: boolean;
  person_type: 'user' | 'shared' | 'dad_business' | 'mom';
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
  type: 'income' | 'expense' | 'transfer';
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

export interface FixedExpense {
  id: string;
  person_id: string;
  bank_account_id: string;
  category_id: string;
  name: string;
  amount: number;
  due_day: number;
  frequency: string;
  merchant?: string;
  is_active: boolean;
  auto_pay: boolean;
  reminder_days_before: number;
  last_paid_date?: string;
  next_due_date?: string;
  created_at: string;
  updated_at: string;
}

export interface Investment {
  id: string;
  person_id: string;
  bank_account_id: string;
  name: string;
  type: string;
  investment_amount: number;
  current_value?: number;
  sip_frequency?: string;
  sip_date?: number;
  start_date: string;
  end_date?: string;
  is_active: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Loan {
  id: string;
  person_id: string;
  related_person_id?: string;
  bank_account_id?: string;
  loan_type: string;
  description: string;
  principal_amount: number;
  interest_rate: number;
  total_amount: number;
  amount_paid: number;
  loan_date: string;
  due_date?: string;
  completed_date?: string;
  status: string;
  is_urgent: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Reminder {
  id: string;
  person_id: string;
  title: string;
  description?: string;
  reminder_type: string;
  due_date: string;
  is_completed: boolean;
  completed_date?: string;
  related_entity_type?: string;
  related_entity_id?: string;
  priority: number;
  created_at: string;
  updated_at: string;
}

export interface AccountTransfer {
  id: string;
  from_account_id: string;
  to_account_id: string;
  person_id: string;
  amount: number;
  transfer_date: string;
  description?: string;
  reference_number?: string;
  from_transaction_id?: string;
  to_transaction_id?: string;
  created_at: string;
}

// Helper type for SQLite bind parameters
type SQLiteBindValue = string | number | boolean | null | Uint8Array;

class DatabaseService {
  private db: SQLite.SQLiteDatabase;

  constructor() {
    this.db = SQLite.openDatabaseSync('expense_tracker.db');
    this.initDatabase();
  }
  async getPersons() {
    return this.getTableData('persons');
  }


  private async initDatabase() {
    try {
      // Create persons table
      await this.db.execAsync(`
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
      await this.db.execAsync(`
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

      // Create categories table (updated with new schema)
      await this.db.execAsync(`
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
      await this.db.execAsync(`
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
      await this.db.execAsync(`
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
      await this.db.execAsync(`
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

      // Create fixed_expenses table
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS fixed_expenses (
          id TEXT PRIMARY KEY,
          person_id TEXT NOT NULL,
          bank_account_id TEXT NOT NULL,
          category_id TEXT NOT NULL,
          name TEXT NOT NULL,
          amount REAL NOT NULL,
          due_day INTEGER NOT NULL,
          frequency TEXT DEFAULT 'monthly',
          merchant TEXT,
          is_active BOOLEAN DEFAULT true,
          auto_pay BOOLEAN DEFAULT false,
          reminder_days_before INTEGER DEFAULT 3,
          last_paid_date TEXT,
          next_due_date TEXT,
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now')),
          FOREIGN KEY (person_id) REFERENCES persons (id),
          FOREIGN KEY (bank_account_id) REFERENCES bank_accounts (id),
          FOREIGN KEY (category_id) REFERENCES categories (id)
        )
      `);

      // Create investments table
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS investments (
          id TEXT PRIMARY KEY,
          person_id TEXT NOT NULL,
          bank_account_id TEXT NOT NULL,
          name TEXT NOT NULL,
          type TEXT NOT NULL,
          investment_amount REAL NOT NULL,
          current_value REAL,
          sip_frequency TEXT,
          sip_date INTEGER,
          start_date TEXT NOT NULL,
          end_date TEXT,
          is_active BOOLEAN DEFAULT true,
          notes TEXT,
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now')),
          FOREIGN KEY (person_id) REFERENCES persons (id),
          FOREIGN KEY (bank_account_id) REFERENCES bank_accounts (id)
        )
      `);

      // Create loans table
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS loans (
          id TEXT PRIMARY KEY,
          person_id TEXT NOT NULL,
          related_person_id TEXT,
          bank_account_id TEXT,
          loan_type TEXT NOT NULL,
          description TEXT NOT NULL,
          principal_amount REAL NOT NULL,
          interest_rate REAL DEFAULT 0,
          total_amount REAL NOT NULL,
          amount_paid REAL DEFAULT 0,
          loan_date TEXT NOT NULL,
          due_date TEXT,
          completed_date TEXT,
          status TEXT DEFAULT 'active',
          is_urgent BOOLEAN DEFAULT false,
          notes TEXT,
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now')),
          FOREIGN KEY (person_id) REFERENCES persons (id),
          FOREIGN KEY (related_person_id) REFERENCES persons (id),
          FOREIGN KEY (bank_account_id) REFERENCES bank_accounts (id)
        )
      `);

      // Create reminders table
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS reminders (
          id TEXT PRIMARY KEY,
          person_id TEXT NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          reminder_type TEXT NOT NULL,
          due_date TEXT NOT NULL,
          is_completed BOOLEAN DEFAULT false,
          completed_date TEXT,
          related_entity_type TEXT,
          related_entity_id TEXT,
          priority INTEGER DEFAULT 2,
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now')),
          FOREIGN KEY (person_id) REFERENCES persons (id)
        )
      `);

      // Create account_transfers table
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS account_transfers (
          id TEXT PRIMARY KEY,
          from_account_id TEXT NOT NULL,
          to_account_id TEXT NOT NULL,
          person_id TEXT NOT NULL,
          amount REAL NOT NULL,
          transfer_date TEXT NOT NULL,
          description TEXT,
          reference_number TEXT,
          from_transaction_id TEXT,
          to_transaction_id TEXT,
          created_at TEXT DEFAULT (datetime('now')),
          FOREIGN KEY (from_account_id) REFERENCES bank_accounts (id),
          FOREIGN KEY (to_account_id) REFERENCES bank_accounts (id),
          FOREIGN KEY (person_id) REFERENCES persons (id)
        )
      `);

      // Insert default data
      await this.insertDefaultData();
    } catch (error) {
      console.error('Database initialization error:', error);
    }
  }

  private async insertDefaultData() {
    try {
      // Insert default persons
      const defaultPersons = [
        { id: 'user_1', name: 'You', role: 'user', color: '#3B82F6' },
        { id: 'dad_1', name: 'Dad', role: 'dad_business', color: '#EF4444' },
        { id: 'mom_1', name: 'Mom', role: 'mom', color: '#8B5CF6' },
      ];

      for (const person of defaultPersons) {
        await this.db.runAsync(
          `INSERT OR IGNORE INTO persons (id, name, role, color) VALUES (?, ?, ?, ?)`,
          [person.id, person.name, person.role, person.color]
        );
      }

      // Insert categories from your PostgreSQL data
      const categories = [
        // Income categories
        { id: '66666666-6666-6666-6666-666666666661', name: 'Salary', type: 'income', color: 'green-500', icon: 'briefcase', is_essential: true, person_type: 'user', description: 'Monthly salary income' },
        { id: '66666666-6666-6666-6666-666666666662', name: 'Freelance', type: 'income', color: 'green-600', icon: 'laptop', is_essential: false, person_type: 'user', description: 'Freelance work income' },
        { id: '66666666-6666-4666-a666-666666666663', name: 'Business Income', type: 'income', color: 'green-700', icon: 'business', is_essential: true, person_type: 'dad_business', description: 'Fabrication business income' },
        { id: '66666666-6666-6666-6666-666666666664', name: 'Investment Returns', type: 'income', color: 'green-800', icon: 'trending-up', is_essential: false, person_type: 'user', description: 'Dividends and investment returns' },
        
        // Expense categories
        { id: '66666666-6666-6666-6666-666666666665', name: 'Groceries', type: 'expense', color: 'blue-500', icon: 'shopping-cart', is_essential: true, person_type: 'shared', description: 'Weekly grocery shopping' },
        { id: '66666666-6666-6666-6666-666666666666', name: 'Utilities', type: 'expense', color: 'blue-600', icon: 'zap', is_essential: true, person_type: 'shared', description: 'Electricity, water, gas bills' },
        { id: '66666666-6666-6666-6666-666666666667', name: 'Rent', type: 'expense', color: 'blue-700', icon: 'home', is_essential: true, person_type: 'shared', description: 'House rent payment' },
        { id: '66666666-6666-6666-6666-666666666668', name: 'Transportation', type: 'expense', color: 'blue-800', icon: 'car', is_essential: true, person_type: 'shared', description: 'Fuel, public transport, maintenance' },
        { id: '66666666-6666-6666-6666-666666666669', name: 'Dining & Food', type: 'expense', color: 'red-500', icon: 'utensils', is_essential: false, person_type: 'user', description: 'Restaurants and outside food' },
        { id: '66666666-6666-6666-6666-666666666670', name: 'Shopping', type: 'expense', color: 'red-600', icon: 'shopping-bag', is_essential: false, person_type: 'user', description: 'Clothes, electronics, personal items' },
        { id: '66666666-6666-6666-6666-666666666671', name: 'Entertainment', type: 'expense', color: 'red-700', icon: 'film', is_essential: false, person_type: 'user', description: 'Movies, OTT subscriptions, outings' },
        { id: '66666666-6666-6666-6666-666666666672', name: 'Healthcare', type: 'expense', color: 'red-800', icon: 'heart', is_essential: true, person_type: 'shared', description: 'Medical bills, medicines, checkups' },
        { id: '66666666-6666-6666-6666-666666666673', name: 'Business Materials', type: 'expense', color: 'orange-500', icon: 'package', is_essential: true, person_type: 'dad_business', description: 'Raw materials for fabrication' },
        { id: '66666666-6666-6666-6666-666666666674', name: 'Business Maintenance', type: 'expense', color: 'orange-600', icon: 'settings', is_essential: true, person_type: 'dad_business', description: 'Equipment maintenance and repairs' },
        { id: '66666666-6666-6666-6666-666666666675', name: 'Education', type: 'expense', color: 'purple-500', icon: 'book-open', is_essential: true, person_type: 'shared', description: 'School fees, books, courses' },
        { id: '66666666-6666-6666-6666-666666666676', name: 'Personal Care', type: 'expense', color: 'purple-600', icon: 'user', is_essential: false, person_type: 'mom', description: 'Beauty products, salon' },
        { id: '66666666-6666-4666-a666-666666666677', name: 'Gifts & Donations', type: 'expense', color: 'purple-700', icon: 'gift', is_essential: false, person_type: 'shared', description: 'Gifts for family and friends' },
        { id: '66666666-6666-6666-6666-666666666678', name: 'Insurance', type: 'expense', color: 'yellow-500', icon: 'shield', is_essential: true, person_type: 'shared', description: 'Health, life, vehicle insurance' },
        { id: '66666666-6666-6666-6666-666666666679', name: 'Loan EMI', type: 'expense', color: 'yellow-600', icon: 'credit-card', is_essential: true, person_type: 'shared', description: 'Loan EMIs and repayments' },
        { id: '66666666-6666-6666-6666-666666666680', name: 'Tax Payments', type: 'expense', color: 'yellow-700', icon: 'file-text', is_essential: true, person_type: 'shared', description: 'Income tax, GST payments' },
        { id: '66666666-6666-6666-6666-666666666682', name: 'SIP Investment', type: 'expense', color: 'violet-500', icon: 'trending-up', is_essential: true, person_type: 'user', description: 'Systematic Investment Plan' },
        
        // Transfer categories
        { id: '66666666-6666-6666-6666-666666666681', name: 'Account Transfer', type: 'transfer', color: 'gray-500', icon: 'refresh-cw', is_essential: false, person_type: 'shared', description: 'Transfer between accounts' },
        { id: '66666666-6666-6666-6666-666666666683', name: 'Savings Transfer', type: 'transfer', color: 'violet-600', icon: 'piggy-bank', is_essential: true, person_type: 'user', description: 'Transfer to savings goals' },
      ];

      for (const category of categories) {
        await this.db.runAsync(
          `INSERT OR IGNORE INTO categories (id, name, type, color, icon, is_essential, person_type, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [category.id, category.name, category.type, category.color, category.icon, category.is_essential, category.person_type, category.description]
        );
      }

      // Insert default bank accounts
      const defaultAccounts = [
        { id: 'account_1', bank_name: 'HDFC Bank', account_number: '1234567890', account_type: 'savings', owner_id: 'user_1' },
        { id: 'account_2', bank_name: 'SBI', account_number: '0987654321', account_type: 'savings', owner_id: 'user_1' },
        { id: 'account_3', bank_name: 'Business Account', account_number: 'BUS123456', account_type: 'current', owner_id: 'dad_1' },
      ];

      for (const account of defaultAccounts) {
        await this.db.runAsync(
          `INSERT OR IGNORE INTO bank_accounts (id, bank_name, account_number, account_type, owner_id) VALUES (?, ?, ?, ?, ?)`,
          [account.id, account.bank_name, account.account_number, account.account_type, account.owner_id]
        );
      }

    } catch (error) {
      console.error('Default data insertion error:', error);
    }
  }

  // Helper method to convert undefined to null for SQLite
  private sanitizeParams(params: any[]): SQLiteBindValue[] {
    return params.map(param => param === undefined ? null : param);
  }

  // Existing methods for transactions, categories, bank accounts...
  async getTransactions(): Promise<Transaction[]> {
    try {
      const result = await this.db.getAllAsync<Transaction>(
        `SELECT * FROM transactions ORDER BY transaction_date DESC, created_at DESC`
      );
      return result;
    } catch (error) {
      console.error('Error getting transactions:', error);
      return [];
    }
  }

  async createTransaction(transaction: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>): Promise<Transaction> {
    const id = this.generateId();
    const now = new Date().toISOString();

    try {
      const params = this.sanitizeParams([
        id, transaction.bank_account_id, transaction.category_id, transaction.person_id,
        transaction.transaction_date, transaction.amount, transaction.type, transaction.description,
        transaction.merchant, transaction.reference_number, transaction.closing_balance,
        transaction.notes, transaction.is_recurring, transaction.recurring_type,
        transaction.is_investment, transaction.is_verified, now, now
      ]);

      await this.db.runAsync(
        `INSERT INTO transactions 
         (id, bank_account_id, category_id, person_id, transaction_date, amount, type, description, merchant, reference_number, closing_balance, notes, is_recurring, recurring_type, is_investment, is_verified, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        params
      );

      return { ...transaction, id, created_at: now, updated_at: now };
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  }

  async deleteTransaction(id: string): Promise<void> {
    try {
      await this.db.runAsync('DELETE FROM transactions WHERE id = ?', [id]);
    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw error;
    }
  }

  // Category methods
  async getCategories(): Promise<Category[]> {
    try {
      const result = await this.db.getAllAsync<Category>(
        'SELECT * FROM categories ORDER BY type, name'
      );
      return result;
    } catch (error) {
      console.error('Error getting categories:', error);
      return [];
    }
  }

  // Bank Account methods
  async getBankAccounts(): Promise<BankAccount[]> {
    try {
      const result = await this.db.getAllAsync<BankAccount>(
        'SELECT * FROM bank_accounts WHERE is_active = true ORDER BY bank_name'
      );
      return result;
    } catch (error) {
      console.error('Error getting bank accounts:', error);
      return [];
    }
  }

  // New methods for advanced features
  async getBudgets(): Promise<Budget[]> {
    try {
      const result = await this.db.getAllAsync<Budget>(
        'SELECT * FROM budgets ORDER BY month DESC'
      );
      return result;
    } catch (error) {
      console.error('Error getting budgets:', error);
      return [];
    }
  }

  async getSavingsGoals(): Promise<SavingsGoal[]> {
    try {
      const result = await this.db.getAllAsync<SavingsGoal>(
        'SELECT * FROM savings_goals WHERE is_active = true ORDER BY priority, target_date'
      );
      return result;
    } catch (error) {
      console.error('Error getting savings goals:', error);
      return [];
    }
  }

  async getFixedExpenses(): Promise<FixedExpense[]> {
    try {
      const result = await this.db.getAllAsync<FixedExpense>(
        'SELECT * FROM fixed_expenses WHERE is_active = true ORDER BY next_due_date'
      );
      return result;
    } catch (error) {
      console.error('Error getting fixed expenses:', error);
      return [];
    }
  }

  async getInvestments(): Promise<Investment[]> {
    try {
      const result = await this.db.getAllAsync<Investment>(
        'SELECT * FROM investments WHERE is_active = true ORDER BY start_date DESC'
      );
      return result;
    } catch (error) {
      console.error('Error getting investments:', error);
      return [];
    }
  }

  async getLoans(): Promise<Loan[]> {
    try {
      const result = await this.db.getAllAsync<Loan>(
        'SELECT * FROM loans WHERE status = "active" ORDER BY due_date'
      );
      return result;
    } catch (error) {
      console.error('Error getting loans:', error);
      return [];
    }
  }

  async getReminders(): Promise<Reminder[]> {
    try {
      const result = await this.db.getAllAsync<Reminder>(
        'SELECT * FROM reminders WHERE is_completed = false ORDER BY due_date, priority'
      );
      return result;
    } catch (error) {
      console.error('Error getting reminders:', error);
      return [];
    }
  }

  // Export/Import methods
  async exportData(): Promise<string> {
    try {
      const data = {
        persons: await this.getTableData('persons'),
        bank_accounts: await this.getTableData('bank_accounts'),
        categories: await this.getTableData('categories'),
        transactions: await this.getTableData('transactions'),
        budgets: await this.getTableData('budgets'),
        savings_goals: await this.getTableData('savings_goals'),
        fixed_expenses: await this.getTableData('fixed_expenses'),
        investments: await this.getTableData('investments'),
        loans: await this.getTableData('loans'),
        reminders: await this.getTableData('reminders'),
        account_transfers: await this.getTableData('account_transfers'),
        export_date: new Date().toISOString(),
        version: '1.0'
      };

      return JSON.stringify(data, null, 2);
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  }

  async importData(jsonData: string): Promise<void> {
    try {
      const data = JSON.parse(jsonData);
      
      // Clear existing data
      const tables = [
        'transactions', 'budgets', 'savings_goals', 'fixed_expenses', 
        'investments', 'loans', 'reminders', 'account_transfers',
        'bank_accounts', 'categories', 'persons'
      ];
      
      for (const table of tables) {
        await this.db.runAsync(`DELETE FROM ${table}`);
      }

      // Import data for each table
      const importPromises = [
        this.importTableData('persons', data.persons),
        this.importTableData('categories', data.categories),
        this.importTableData('bank_accounts', data.bank_accounts),
        this.importTableData('transactions', data.transactions),
        this.importTableData('budgets', data.budgets),
        this.importTableData('savings_goals', data.savings_goals),
        this.importTableData('fixed_expenses', data.fixed_expenses),
        this.importTableData('investments', data.investments),
        this.importTableData('loans', data.loans),
        this.importTableData('reminders', data.reminders),
        this.importTableData('account_transfers', data.account_transfers),
      ];

      await Promise.all(importPromises);

    } catch (error) {
      console.error('Error importing data:', error);
      throw error;
    }
  }

  private async importTableData(tableName: string, data: any[]): Promise<void> {
    if (!data) return;

    for (const item of data) {
      const columns = Object.keys(item);
      const placeholders = columns.map(() => '?').join(', ');
      const values = columns.map(col => item[col]);

      await this.db.runAsync(
        `INSERT OR REPLACE INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`,
        this.sanitizeParams(values)
      );
    }
  }

  private async getTableData(tableName: string): Promise<any[]> {
    try {
      const result = await this.db.getAllAsync(`SELECT * FROM ${tableName}`);
      return result;
    } catch (error) {
      console.error(`Error getting table data for ${tableName}:`, error);
      return [];
    }
  }

  private generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }
}

export const db = new DatabaseService();