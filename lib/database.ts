// lib/database.ts
import * as SQLite from 'expo-sqlite';

// Updated interfaces to match PostgreSQL schema
export interface Person {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: 'family_member' | 'business_owner' | 'mom';
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
  person_type: 'family_member' | 'shared' | 'business_owner' | 'mom';
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

class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;
  private initialized = false;
  private initializationPromise: Promise<void> | null = null;

  constructor() {
    this.initializationPromise = this.initDatabase();
  }

  private async initDatabase(): Promise<void> {
    try {
      console.log('Initializing database...');
      this.db = SQLite.openDatabaseSync('expense_tracker.db');
      console.log('Database opened successfully');
      
      await this.db.execAsync('PRAGMA foreign_keys = ON');
      console.log('Foreign keys enabled');
      
      // Clear existing data first to avoid duplicates
      await this.clearExistingData();
      
      await this.createTables();
      await this.insertDefaultData();
      
      this.initialized = true;
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Database initialization error:', error);
      throw error;
    }
  }

  private async clearExistingData() {
    if (!this.db) return;
    
    try {
      const tables = [
        'transactions', 'budgets', 'savings_goals', 'fixed_expenses', 
        'investments', 'loans', 'reminders', 'account_transfers',
        'bank_accounts', 'categories', 'persons'
      ];
      
      for (const table of tables) {
        await this.db.runAsync(`DELETE FROM ${table}`);
      }
      console.log('Cleared existing data');
    } catch (error) {
      console.error('Error clearing existing data:', error);
    }
  }


  private async createTables() {
    if (!this.db) throw new Error('Database not initialized');

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

    // Create categories table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        color TEXT NOT NULL,
        icon TEXT NOT NULL,
        is_essential BOOLEAN DEFAULT false,
        person_type TEXT DEFAULT 'family_member',
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

    console.log('All tables created successfully');
  }

    private async insertDefaultData() {
    if (!this.db) return;

    try {
      // Insert persons from your PostgreSQL data
      const defaultPersons = [
        { 
          id: '11111111-1111-1111-1111-111111111111', 
          name: 'Sadik Shaikh', 
          email: 'sadik@example.com', 
          phone: '+1234567890', 
          role: 'family_member', 
          color: '#3B82F6' 
        },
        { 
          id: '22222222-2222-2222-2222-222222222222', 
          name: 'Dad', 
          email: '', 
          phone: '8888888888', 
          role: 'business_owner', 
          color: '#10B981' 
        },
        { 
          id: '33333333-3333-3333-3333-333333333333', 
          name: 'Mom', 
          email: '', 
          phone: '7777777777', 
          role: 'family_member', 
          color: '#EC4899' 
        },
      ];

      for (const person of defaultPersons) {
        await this.db.runAsync(
          `INSERT INTO persons (id, name, email, phone, role, color) VALUES (?, ?, ?, ?, ?, ?)`,
          [person.id, person.name, person.email, person.phone, person.role, person.color]
        );
      }

      // Insert bank accounts from your PostgreSQL data
      const defaultAccounts = [
        { 
          id: '73f5a80e-060f-4b85-93c4-90b99b99433e', 
          bank_name: 'SBI - Abbu', 
          account_number: 'SBI0003', 
          account_type: 'Saving', 
          current_balance: 0.00,
          owner_id: '22222222-2222-2222-2222-222222222222'
        },
        { 
          id: 'e552f887-12c7-40b9-84b8-8f5de56b49f6', 
          bank_name: 'Baroda - Sadik', 
          account_number: 'BARB0001', 
          account_type: 'Saving', 
          current_balance: 0.00,
          owner_id: '11111111-1111-1111-1111-111111111111'
        },
        { 
          id: '8a1f6820-c1d0-4dd3-99de-53f3997f2488', 
          bank_name: 'SBI - Sadik', 
          account_number: 'SBI0001', 
          account_type: 'Saving', 
          current_balance: 0.00,
          owner_id: '11111111-1111-1111-1111-111111111111'
        },
        { 
          id: 'f78219c7-a1e4-4a84-a375-9ceb8f33ba71', 
          bank_name: 'SBI - Ammi', 
          account_number: 'SBI0002', 
          account_type: 'Saving', 
          current_balance: 0.00,
          owner_id: '33333333-3333-3333-3333-333333333333'
        },
      ];

      for (const account of defaultAccounts) {
        await this.db.runAsync(
          `INSERT INTO bank_accounts (id, bank_name, account_number, account_type, current_balance, owner_id) VALUES (?, ?, ?, ?, ?, ?)`,
          [account.id, account.bank_name, account.account_number, account.account_type, account.current_balance, account.owner_id]
        );
      }

      // Insert categories matching your PostgreSQL schema
      const categories = [
        // Income categories
        { id: '66666666-6666-6666-6666-666666666661', name: 'Salary', type: 'income', color: 'green-500', icon: 'briefcase-outline', is_essential: true, person_type: 'family_member', description: 'Monthly salary income' },
        { id: '66666666-6666-6666-6666-666666666662', name: 'Freelance', type: 'income', color: 'green-600', icon: 'laptop', is_essential: false, person_type: 'family_member', description: 'Freelance work income' },
        { id: '66666666-6666-4666-a666-666666666663', name: 'Business Income', type: 'income', color: 'green-700', icon: 'office-building', is_essential: true, person_type: 'business_owner', description: 'Fabrication business income' },
        { id: '66666666-6666-6666-6666-666666666664', name: 'Investment Returns', type: 'income', color: 'green-800', icon: 'chart-line', is_essential: false, person_type: 'family_member', description: 'Dividends and investment returns' },
        
        // Expense categories
        { id: '66666666-6666-6666-6666-666666666665', name: 'Groceries', type: 'expense', color: 'blue-500', icon: 'cart-outline', is_essential: true, person_type: 'shared', description: 'Weekly grocery shopping' },
        { id: '66666666-6666-6666-6666-666666666666', name: 'Utilities', type: 'expense', color: 'blue-600', icon: 'flash-outline', is_essential: true, person_type: 'shared', description: 'Electricity, water, gas bills' },
        { id: '66666666-6666-6666-6666-666666666667', name: 'Rent', type: 'expense', color: 'blue-700', icon: 'home-outline', is_essential: true, person_type: 'shared', description: 'House rent payment' },
        { id: '66666666-6666-6666-6666-666666666668', name: 'Transportation', type: 'expense', color: 'blue-800', icon: 'car-outline', is_essential: true, person_type: 'shared', description: 'Fuel, public transport, maintenance' },
        { id: '66666666-6666-6666-6666-666666666669', name: 'Dining & Food', type: 'expense', color: 'red-500', icon: 'food-fork-drink', is_essential: false, person_type: 'family_member', description: 'Restaurants and outside food' },
        { id: '66666666-6666-6666-6666-666666666670', name: 'Shopping', type: 'expense', color: 'red-600', icon: 'shopping-outline', is_essential: false, person_type: 'family_member', description: 'Clothes, electronics, personal items' },
        { id: '66666666-6666-6666-6666-666666666671', name: 'Entertainment', type: 'expense', color: 'red-700', icon: 'movie-outline', is_essential: false, person_type: 'family_member', description: 'Movies, OTT subscriptions, outings' },
        { id: '66666666-6666-6666-6666-666666666672', name: 'Healthcare', type: 'expense', color: 'red-800', icon: 'heart-outline', is_essential: true, person_type: 'shared', description: 'Medical bills, medicines, checkups' },
        { id: '66666666-6666-6666-6666-666666666673', name: 'Business Materials', type: 'expense', color: 'orange-500', icon: 'package-variant', is_essential: true, person_type: 'business_owner', description: 'Raw materials for fabrication' },
        { id: '66666666-6666-6666-6666-666666666674', name: 'Business Maintenance', type: 'expense', color: 'orange-600', icon: 'cog-outline', is_essential: true, person_type: 'business_owner', description: 'Equipment maintenance and repairs' },
        { id: '66666666-6666-6666-6666-666666666675', name: 'Education', type: 'expense', color: 'purple-500', icon: 'book-open-outline', is_essential: true, person_type: 'shared', description: 'School fees, books, courses' },
        { id: '66666666-6666-6666-6666-666666666676', name: 'Personal Care', type: 'expense', color: 'purple-600', icon: 'account-outline', is_essential: false, person_type: 'family_member', description: 'Beauty products, salon' },
        { id: '66666666-6666-4666-a666-666666666677', name: 'Gifts & Donations', type: 'expense', color: 'purple-700', icon: 'gift-outline', is_essential: false, person_type: 'shared', description: 'Gifts for family and friends' },
        { id: '66666666-6666-6666-6666-666666666678', name: 'Insurance', type: 'expense', color: 'yellow-500', icon: 'shield-check-outline', is_essential: true, person_type: 'shared', description: 'Health, life, vehicle insurance' },
        { id: '66666666-6666-6666-6666-666666666679', name: 'Loan EMI', type: 'expense', color: 'yellow-600', icon: 'credit-card-outline', is_essential: true, person_type: 'shared', description: 'Loan EMIs and repayments' },
        { id: '66666666-6666-6666-6666-666666666680', name: 'Tax Payments', type: 'expense', color: 'yellow-700', icon: 'file-document-outline', is_essential: true, person_type: 'shared', description: 'Income tax, GST payments' },
        { id: '66666666-6666-6666-6666-666666666682', name: 'SIP Investment', type: 'expense', color: 'violet-500', icon: 'chart-line', is_essential: true, person_type: 'family_member', description: 'Systematic Investment Plan' },
        
        // Transfer categories
        { id: '66666666-6666-6666-6666-666666666681', name: 'Account Transfer', type: 'transfer', color: 'gray-500', icon: 'swap-horizontal', is_essential: false, person_type: 'shared', description: 'Transfer between accounts' },
        { id: '66666666-6666-6666-6666-666666666683', name: 'Savings Transfer', type: 'transfer', color: 'violet-600', icon: 'piggy-bank-outline', is_essential: true, person_type: 'family_member', description: 'Transfer to savings goals' },
      ];

      for (const category of categories) {
        await this.db.runAsync(
          `INSERT INTO categories (id, name, type, color, icon, is_essential, person_type, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [category.id, category.name, category.type, category.color, category.icon, category.is_essential, category.person_type, category.description]
        );
      }

      console.log('Default data inserted successfully');
    } catch (error) {
      console.error('Default data insertion error:', error);
    }
  }

  // Wait for database to be ready before any operation
  private async ensureDatabaseReady(): Promise<void> {
    if (!this.initialized && this.initializationPromise) {
      await this.initializationPromise;
    }
    if (!this.db) {
      throw new Error('Database not available');
    }
  }

  // Budget methods
  async createBudget(budgetData: Omit<Budget, 'id' | 'created_at' | 'updated_at'>): Promise<Budget> {
    await this.ensureDatabaseReady();
    
    const id = this.generateId();
    const now = new Date().toISOString();

    try {
      const params = this.sanitizeParams([
        id,
        budgetData.person_id,
        budgetData.category_id,
        budgetData.bank_account_id,
        budgetData.month,
        budgetData.amount,
        budgetData.spent_amount || 0,
        budgetData.rollover_unused,
        budgetData.notifications_enabled,
        now,
        now
      ]);

      await this.db!.runAsync(
        `INSERT INTO budgets (
          id, person_id, category_id, bank_account_id, month, amount,
          spent_amount, rollover_unused, notifications_enabled, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        params
      );

      return {
        ...budgetData,
        id,
        spent_amount: budgetData.spent_amount || 0,
        created_at: now,
        updated_at: now
      };
    } catch (error) {
      console.error('Error creating budget:', error);
      throw error;
    }
  }

  async getBudgets(): Promise<Budget[]> {
    await this.ensureDatabaseReady();

    try {
      const result = await this.db!.getAllAsync<Budget>(
        'SELECT * FROM budgets ORDER BY month DESC, created_at DESC'
      );
      return result;
    } catch (error) {
      console.error('Error getting budgets:', error);
      return [];
    }
  }

  async updateBudget(id: string, budgetData: Partial<Budget>): Promise<void> {
    await this.ensureDatabaseReady();

    try {
      const updates: string[] = [];
      const values: any[] = [];

      Object.entries(budgetData).forEach(([key, value]) => {
        if (key !== 'id' && key !== 'created_at' && key !== 'updated_at') {
          updates.push(`${key} = ?`);
          values.push(value);
        }
      });

      if (updates.length === 0) return;

      updates.push('updated_at = ?');
      values.push(new Date().toISOString());
      values.push(id);

      await this.db!.runAsync(
        `UPDATE budgets SET ${updates.join(', ')} WHERE id = ?`,
        this.sanitizeParams(values)
      );
    } catch (error) {
      console.error('Error updating budget:', error);
      throw error;
    }
  }

  async deleteBudget(id: string): Promise<void> {
    await this.ensureDatabaseReady();

    try {
      await this.db!.runAsync('DELETE FROM budgets WHERE id = ?', [id]);
    } catch (error) {
      console.error('Error deleting budget:', error);
      throw error;
    }
  }

  // Person methods
  async getPersons(): Promise<Person[]> {
    await this.ensureDatabaseReady();

    try {
      const result = await this.db!.getAllAsync<Person>(
        'SELECT * FROM persons WHERE is_active = true ORDER BY name'
      );
      return result;
    } catch (error) {
      console.error('Error getting persons:', error);
      return [];
    }
  }

  // Category methods
  async getCategories(): Promise<Category[]> {
    await this.ensureDatabaseReady();

    try {
      const result = await this.db!.getAllAsync<Category>(
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
    await this.ensureDatabaseReady();

    try {
      const result = await this.db!.getAllAsync<BankAccount>(
        'SELECT * FROM bank_accounts WHERE is_active = true ORDER BY bank_name'
      );
      return result;
    } catch (error) {
      console.error('Error getting bank accounts:', error);
      return [];
    }
  }

  // Transaction methods
   // Enhanced getTransactions with filters
   async getTransactions(filters?: {
    category_id?: string;
    bank_account_id?: string;
    person_id?: string;
    type?: 'income' | 'expense' | 'transfer';
    start_date?: string;
    end_date?: string;
    search?: string;
  }): Promise<Transaction[]> {
    await this.ensureDatabaseReady();

    try {
      let query = `
        SELECT t.*, 
               c.name as category_name,
               c.color as category_color,
               ba.bank_name,
               ba.account_number,
               p.name as person_name
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        LEFT JOIN bank_accounts ba ON t.bank_account_id = ba.id
        LEFT JOIN persons p ON t.person_id = p.id
        WHERE 1=1
      `;
      
      const params: any[] = [];

      if (filters) {
        if (filters.category_id) {
          query += ' AND t.category_id = ?';
          params.push(filters.category_id);
        }
        if (filters.bank_account_id) {
          query += ' AND t.bank_account_id = ?';
          params.push(filters.bank_account_id);
        }
        if (filters.person_id) {
          query += ' AND t.person_id = ?';
          params.push(filters.person_id);
        }
        if (filters.type) {
          query += ' AND t.type = ?';
          params.push(filters.type);
        }
        if (filters.start_date) {
          query += ' AND t.transaction_date >= ?';
          params.push(filters.start_date);
        }
        if (filters.end_date) {
          query += ' AND t.transaction_date <= ?';
          params.push(filters.end_date);
        }
        if (filters.search) {
          query += ' AND (t.description LIKE ? OR t.merchant LIKE ?)';
          const searchTerm = `%${filters.search}%`;
          params.push(searchTerm, searchTerm);
        }
      }

      query += ' ORDER BY t.transaction_date DESC, t.created_at DESC';

      const result = await this.db!.getAllAsync<any>(query, params);
      return result;
    } catch (error) {
      console.error('Error getting transactions:', error);
      return [];
    }
  }


  async createTransaction(transaction: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>): Promise<Transaction> {
    await this.ensureDatabaseReady();
    
    const id = this.generateId();
    const now = new Date().toISOString();

    try {
      // Start transaction
      await this.db!.execAsync('BEGIN TRANSACTION');

      // Get current account balance
      const account = await this.db!.getFirstAsync<BankAccount>(
        'SELECT * FROM bank_accounts WHERE id = ?',
        [transaction.bank_account_id]
      );

      if (!account) {
        throw new Error('Bank account not found');
      }

      // Calculate new balance
      let newBalance = account.current_balance;
      if (transaction.type === 'income') {
        newBalance += transaction.amount;
      } else if (transaction.type === 'expense') {
        newBalance -= transaction.amount;
      }
      // For transfers, we'll handle separately

      // Insert transaction
      const params = this.sanitizeParams([
        id, transaction.bank_account_id, transaction.category_id, transaction.person_id,
        transaction.transaction_date, transaction.amount, transaction.type, transaction.description,
        transaction.merchant, transaction.reference_number, newBalance, // Use calculated closing balance
        transaction.notes, transaction.is_recurring, transaction.recurring_type,
        transaction.is_investment, transaction.is_verified, now, now
      ]);

      await this.db!.runAsync(
        `INSERT INTO transactions 
         (id, bank_account_id, category_id, person_id, transaction_date, amount, type, description, merchant, reference_number, closing_balance, notes, is_recurring, recurring_type, is_investment, is_verified, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        params
      );

      // Update bank account balance
      await this.db!.runAsync(
        'UPDATE bank_accounts SET current_balance = ?, updated_at = ? WHERE id = ?',
        [newBalance, now, transaction.bank_account_id]
      );

      // Commit transaction
      await this.db!.execAsync('COMMIT');

      return { 
        ...transaction, 
        id, 
        closing_balance: newBalance,
        created_at: now, 
        updated_at: now 
      };
    } catch (error) {
      // Rollback on error
      await this.db!.execAsync('ROLLBACK');
      console.error('Error creating transaction:', error);
      throw error;
    }
  }

  async deleteTransaction(id: string): Promise<void> {
    await this.ensureDatabaseReady();

    try {
      await this.db!.runAsync('DELETE FROM transactions WHERE id = ?', [id]);
    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw error;
    }
  }

  // Savings Goals methods
  async getSavingsGoals(): Promise<SavingsGoal[]> {
    await this.ensureDatabaseReady();

    try {
      const result = await this.db!.getAllAsync<SavingsGoal>(
        'SELECT * FROM savings_goals WHERE is_active = true ORDER BY priority, target_date'
      );
      return result;
    } catch (error) {
      console.error('Error getting savings goals:', error);
      return [];
    }
  }

  // Fixed Expenses methods
  async getFixedExpenses(): Promise<FixedExpense[]> {
    await this.ensureDatabaseReady();

    try {
      const result = await this.db!.getAllAsync<FixedExpense>(
        'SELECT * FROM fixed_expenses WHERE is_active = true ORDER BY next_due_date'
      );
      return result;
    } catch (error) {
      console.error('Error getting fixed expenses:', error);
      return [];
    }
  }

  // Investments methods
  async getInvestments(): Promise<Investment[]> {
    await this.ensureDatabaseReady();

    try {
      const result = await this.db!.getAllAsync<Investment>(
        'SELECT * FROM investments WHERE is_active = true ORDER BY start_date DESC'
      );
      return result;
    } catch (error) {
      console.error('Error getting investments:', error);
      return [];
    }
  }

  // Loans methods
  async addLoan(loanData: Omit<Loan, 'id' | 'created_at' | 'updated_at'>): Promise<Loan> {
    await this.ensureDatabaseReady();
    
    const id = this.generateId();
    const now = new Date().toISOString();

    try {
      const params = this.sanitizeParams([
        id,
        loanData.person_id,
        loanData.related_person_id,
        loanData.bank_account_id,
        loanData.loan_type,
        loanData.description,
        loanData.principal_amount,
        loanData.interest_rate,
        loanData.total_amount,
        loanData.amount_paid,
        loanData.loan_date,
        loanData.due_date,
        loanData.completed_date,
        loanData.status,
        loanData.is_urgent,
        loanData.notes,
        now,
        now
      ]);

      await this.db!.runAsync(
        `INSERT INTO loans (
          id, person_id, related_person_id, bank_account_id, loan_type, description,
          principal_amount, interest_rate, total_amount, amount_paid, loan_date,
          due_date, completed_date, status, is_urgent, notes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        params
      );

      return {
        ...loanData,
        id,
        created_at: now,
        updated_at: now
      };
    } catch (error) {
      console.error('Error adding loan:', error);
      throw error;
    }
  }

  async getLoans(): Promise<Loan[]> {
    await this.ensureDatabaseReady();

    try {
      const result = await this.db!.getAllAsync<Loan>(
        'SELECT * FROM loans ORDER BY due_date, created_at DESC'
      );
      return result;
    } catch (error) {
      console.error('Error getting loans:', error);
      return [];
    }
  }

  async updateLoan(id: string, loanData: Partial<Loan>): Promise<void> {
    await this.ensureDatabaseReady();

    try {
      const updates: string[] = [];
      const values: any[] = [];

      Object.entries(loanData).forEach(([key, value]) => {
        if (key !== 'id' && key !== 'created_at' && key !== 'updated_at') {
          updates.push(`${key} = ?`);
          values.push(value);
        }
      });

      if (updates.length === 0) return;

      updates.push('updated_at = ?');
      values.push(new Date().toISOString());
      values.push(id);

      await this.db!.runAsync(
        `UPDATE loans SET ${updates.join(', ')} WHERE id = ?`,
        this.sanitizeParams(values)
      );
    } catch (error) {
      console.error('Error updating loan:', error);
      throw error;
    }
  }

  async deleteLoan(id: string): Promise<void> {
    await this.ensureDatabaseReady();

    try {
      await this.db!.runAsync('DELETE FROM loans WHERE id = ?', [id]);
    } catch (error) {
      console.error('Error deleting loan:', error);
      throw error;
    }
  }

  // Reminders methods
  async getReminders(): Promise<Reminder[]> {
    await this.ensureDatabaseReady();

    try {
      const result = await this.db!.getAllAsync<Reminder>(
        'SELECT * FROM reminders WHERE is_completed = false ORDER BY due_date, priority'
      );
      return result;
    } catch (error) {
      console.error('Error getting reminders:', error);
      return [];
    }
  }

  // Account Transfers methods
  async getAccountTransfers(): Promise<AccountTransfer[]> {
    await this.ensureDatabaseReady();

    try {
      const result = await this.db!.getAllAsync<AccountTransfer>(
        'SELECT * FROM account_transfers ORDER BY transfer_date DESC'
      );
      return result;
    } catch (error) {
      console.error('Error getting account transfers:', error);
      return [];
    }
  }

  // Helper methods
  private sanitizeParams(params: any[]): SQLite.SQLiteBindValue[] {
    return params.map(param => {
      if (param === undefined || param === null) return null;
      if (typeof param === 'boolean') return param ? 1 : 0;
      return param;
    });
  }

  private generateId(): string {
    return 'id_' + Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  // Export/Import methods
  async exportData(): Promise<string> {
    await this.ensureDatabaseReady();

    try {
      const data = {
        persons: await this.getPersons(),
        bank_accounts: await this.getBankAccounts(),
        categories: await this.getCategories(),
        transactions: await this.getTransactions(),
        budgets: await this.getBudgets(),
        savings_goals: await this.getSavingsGoals(),
        fixed_expenses: await this.getFixedExpenses(),
        investments: await this.getInvestments(),
        loans: await this.getLoans(),
        reminders: await this.getReminders(),
        account_transfers: await this.getAccountTransfers(),
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
    await this.ensureDatabaseReady();

    try {
      const data = JSON.parse(jsonData);
      
      // Clear existing data
      const tables = [
        'transactions', 'budgets', 'savings_goals', 'fixed_expenses', 
        'investments', 'loans', 'reminders', 'account_transfers',
        'bank_accounts', 'categories', 'persons'
      ];
      
      for (const table of tables) {
        await this.db!.runAsync(`DELETE FROM ${table}`);
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

      await this.db!.runAsync(
        `INSERT OR REPLACE INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`,
        this.sanitizeParams(values)
      );
    }
  }
}

export const db = new DatabaseService();