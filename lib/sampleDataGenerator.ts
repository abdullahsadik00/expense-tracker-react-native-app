// lib/sampleDataGenerator.ts - UPDATED
export class SampleDataGenerator {
  static generateCSVSample(): string {
    const headers = [
      'transaction_date', 
      'description', 
      'amount', 
      'type', 
      'category', 
      'merchant', 
      'notes',
      'is_recurring',
      'is_investment',
      'is_verified'
    ];
    
    const sampleData = [
      [
        '2025-01-01',
        'Shopping - Transfer',
        '-20.00',
        'expense',
        'Shopping',
        'Transfer',
        'TRANSFER TO 4897692162094 - UPI/DR/436612969068/TAKWIM N/YESB/paytmqr281/cold',
        'false',
        'false',
        'false'
      ],
      [
        '2025-01-02',
        'Salary from BEE LOGICAL SOFT',
        '50000.00',
        'income',
        'Salary',
        'BEE LOGICAL SOFT',
        'Monthly salary payment',
        'true',
        'false',
        'true'
      ],
      [
        '2025-01-03',
        'UPI Payment to paytmqr1axzf3q17z@paytm',
        '-10.00',
        'expense',
        'Shopping',
        'paytmqr1axzf3q17z@paytm',
        'UPI transaction - Ref:530767864833',
        'false',
        'false',
        'true'
      ],
      [
        '2025-01-04',
        'Transfer to Mrs. PARVEEN JAH',
        '-1100.00',
        'expense',
        'Transfer',
        'Mrs. PARVEEN JAH',
        'UPI transfer - Refno 530404899574',
        'false',
        'false',
        'true'
      ],
      [
        '2025-01-05',
        'Fuel Payment',
        '-1500.00',
        'expense',
        'Transportation',
        'Petrol Pump',
        'Vehicle fuel refill',
        'false',
        'false',
        'true'
      ],
      [
        '2025-01-06',
        'Freelance Payment from Client ABC',
        '15000.00',
        'income',
        'Freelance',
        'Client ABC',
        'Web development project payment',
        'false',
        'false',
        'true'
      ],
      [
        '2025-01-07',
        'Grocery Shopping',
        '-2500.00',
        'expense',
        'Groceries',
        'Supermarket',
        'Weekly grocery purchase',
        'true',
        'false',
        'true'
      ],
      [
        '2025-01-08',
        'Electricity Bill',
        '-1800.00',
        'expense',
        'Utilities',
        'Electricity Board',
        'Monthly electricity bill payment',
        'true',
        'false',
        'true'
      ],
      [
        '2025-01-09',
        'Business Materials Purchase',
        '-7500.00',
        'expense',
        'Business Materials',
        'Hardware Store',
        'Raw materials for fabrication business',
        'false',
        'false',
        'true'
      ],
      [
        '2025-01-10',
        'Mobile Recharge',
        '-299.00',
        'expense',
        'Utilities',
        'Jio',
        'Monthly mobile plan recharge',
        'true',
        'false',
        'true'
      ]
    ];

    const csvContent = [headers, ...sampleData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    return csvContent;
  }

  static generateExcelSampleInstructions(): string {
    return `Excel Template Instructions - Expense Tracker

REQUIRED COLUMNS (Based on your database schema):
• transaction_date (YYYY-MM-DD format)
• description (Transaction description)
• amount (Negative for expenses, positive for income)
• type (income/expense/transfer)
• category (Category name - will be mapped to category_id)
• merchant (Store/merchant/person name)
• notes (Additional transaction details)
• is_recurring (true/false)
• is_investment (true/false) 
• is_verified (true/false)

SAMPLE DATA FORMAT (from your database):
transaction_date | description           | amount  | type    | category | merchant | notes
2025-01-01      | Shopping - Transfer   | -20.00  | expense | Shopping | Transfer | TRANSFER TO 4897692162094 - UPI/DR/436612969068/...

CATEGORY MAPPING (Category → Category ID):
• Salary → 66666666-6666-6666-6666-666666666661
• Freelance → 66666666-6666-6666-6666-666666666662
• Business Income → 66666666-6666-4666-a666-666666666663
• Investment Returns → 66666666-6666-6666-6666-666666666664
• Groceries → 66666666-6666-6666-6666-666666666665
• Utilities → 66666666-6666-6666-6666-666666666666
• Rent → 66666666-6666-6666-6666-666666666667
• Transportation → 66666666-6666-6666-6666-666666666668
• Dining & Food → 66666666-6666-6666-6666-666666666669
• Shopping → 66666666-6666-6666-6666-666666666670
• Entertainment → 66666666-6666-6666-6666-666666666671
• Healthcare → 66666666-6666-6666-6666-666666666672
• Business Materials → 66666666-6666-6666-6666-666666666673
• Business Maintenance → 66666666-6666-6666-6666-666666666674
• Education → 66666666-6666-6666-6666-666666666675
• Personal Care → 66666666-6666-6666-6666-666666666676
• Gifts & Donations → 66666666-6666-4666-a666-666666666677
• Insurance → 66666666-6666-6666-6666-666666666678
• Loan EMI → 66666666-6666-6666-6666-666666666679
• Tax Payments → 66666666-6666-6666-6666-666666666680
• Account Transfer → 66666666-6666-6666-6666-666666666681
• SIP Investment → 66666666-6666-6666-6666-666666666682
• Savings Transfer → 66666666-6666-6666-6666-666666666683

IMPORTANT NOTES:
• Use exact category names as shown above
• Amount format: Negative for expenses (-100.00), positive for income (50000.00)
• Date format: YYYY-MM-DD (2025-01-01)
• Boolean fields: Use true/false (lowercase)
• Description should be clear and descriptive
• Merchant field can contain UPI IDs, store names, or person names

BANK ACCOUNT MAPPING (Auto-detected):
• Transactions with "BOB" or "Baroda" → Baroda - Sadik account
• Transactions with "SBI" or "State Bank" → SBI - Sadik account  
• Others → Default to first available account

PERSON MAPPING (Auto-detected):
• Income from specific names (Aliabbas, Shehnaz, etc.) → Sadik Payment
• Business income → Abbu Payment
• Others → Default person assignment`;
  }

  static getSupportedCategories(): { name: string; id: string; type: string }[] {
    return [
      { name: 'Salary', id: '66666666-6666-6666-6666-666666666661', type: 'income' },
      { name: 'Freelance', id: '66666666-6666-6666-6666-666666666662', type: 'income' },
      { name: 'Business Income', id: '66666666-6666-4666-a666-666666666663', type: 'income' },
      { name: 'Investment Returns', id: '66666666-6666-6666-6666-666666666664', type: 'income' },
      { name: 'Groceries', id: '66666666-6666-6666-6666-666666666665', type: 'expense' },
      { name: 'Utilities', id: '66666666-6666-6666-6666-666666666666', type: 'expense' },
      { name: 'Rent', id: '66666666-6666-6666-6666-666666666667', type: 'expense' },
      { name: 'Transportation', id: '66666666-6666-6666-6666-666666666668', type: 'expense' },
      { name: 'Dining & Food', id: '66666666-6666-6666-6666-666666666669', type: 'expense' },
      { name: 'Shopping', id: '66666666-6666-6666-6666-666666666670', type: 'expense' },
      { name: 'Entertainment', id: '66666666-6666-6666-6666-666666666671', type: 'expense' },
      { name: 'Healthcare', id: '66666666-6666-6666-6666-666666666672', type: 'expense' },
      { name: 'Business Materials', id: '66666666-6666-6666-6666-666666666673', type: 'expense' },
      { name: 'Business Maintenance', id: '66666666-6666-6666-6666-666666666674', type: 'expense' },
      { name: 'Education', id: '66666666-6666-6666-6666-666666666675', type: 'expense' },
      { name: 'Personal Care', id: '66666666-6666-6666-6666-666666666676', type: 'expense' },
      { name: 'Gifts & Donations', id: '66666666-6666-4666-a666-666666666677', type: 'expense' },
      { name: 'Insurance', id: '66666666-6666-6666-6666-666666666678', type: 'expense' },
      { name: 'Loan EMI', id: '66666666-6666-6666-6666-666666666679', type: 'expense' },
      { name: 'Tax Payments', id: '66666666-6666-6666-6666-666666666680', type: 'expense' },
      { name: 'Account Transfer', id: '66666666-6666-6666-6666-666666666681', type: 'transfer' },
      { name: 'SIP Investment', id: '66666666-6666-6666-6666-666666666682', type: 'expense' },
      { name: 'Savings Transfer', id: '66666666-6666-6666-6666-666666666683', type: 'transfer' }
    ];
  }

  static generateSampleSQLInsert(): string {
    return `-- Sample SQL INSERT statements matching your database schema
INSERT INTO transactions (
  id, bank_account_id, category_id, person_id, transaction_date, 
  amount, type, description, merchant, notes, 
  is_recurring, is_investment, is_verified
) VALUES 
(
  'id_1', 
  '8a1f6820-c1d0-4dd3-99de-53f3997f2488', 
  '66666666-6666-6666-6666-666666666670',
  '11111111-1111-1111-1111-111111111111',
  '2025-01-01',
  -20.00,
  'expense',
  'Shopping - Transfer',
  'Transfer',
  'TRANSFER TO 4897692162094 - UPI/DR/436612969068/TAKWIM N/YESB/paytmqr281/cold',
  false,
  false,
  false
),
(
  'id_2',
  '8a1f6820-c1d0-4dd3-99de-53f3997f2488',
  '66666666-6666-6666-6666-666666666661',
  '11111111-1111-1111-1111-111111111111', 
  '2025-01-02',
  50000.00,
  'income',
  'Salary from BEE LOGICAL SOFT',
  'BEE LOGICAL SOFT',
  'Monthly salary payment',
  true,
  false,
  true
);`;
  }
}