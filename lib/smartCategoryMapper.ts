// lib/smartCategoryMapper.ts
export interface CategoryMapping {
    category_id: string;
    description: string;
    person_type?: string;
}

export class SmartCategoryMapper {
    // Map transaction based on description, merchant, and amount
    static mapTransaction(description: string, merchant: string, amount: number, type: 'income' | 'expense'): CategoryMapping {
        const lowerDesc = description.toLowerCase();
        const lowerMerchant = merchant.toLowerCase();
        const combined = lowerDesc + ' ' + lowerMerchant;

        // Income categorization
        if (type === 'income') {
            return this.mapIncome(description, merchant, combined);
        }

        // Expense categorization
        return this.mapExpense(description, merchant, combined, amount);
    }

    private static mapIncome(description: string, merchant: string, combined: string): CategoryMapping {
        // Sadik Payment - specific names
        const sadikNames = ['aliabbas', 'shehnaz', 'ayesha', 'parveen', 'zain', 'faiza', 'nilofar', 'sana', 'wasi'];
        const isSadikPayment = sadikNames.some(name => combined.includes(name));

        if (isSadikPayment) {
            return {
                category_id: '66666666-6666-6666-6666-666666666662', // Freelance
                description: `${description} | Sadik Payment`,
                person_type: 'user'
            };
        }

        // Bee Logical Soft - Salary
        if (combined.includes('bee logical soft')) {
            return {
                category_id: '66666666-6666-6666-6666-666666666661', // Salary
                description: 'Salary from BEE LOGICAL SOFT',
                person_type: 'user'
            };
        }

        // Business Income
        if (combined.includes('business') || combined.includes('fabrication')) {
            return {
                category_id: '66666666-6666-4666-a666-666666666663', // Business Income
                description: `${description} | Abbu Payment`,
                person_type: 'dad_business'
            };
        }

        // Default income - Abbu Payment
        return {
            category_id: '66666666-6666-4666-a666-666666666663', // Business Income
            description: `${description} | Abbu Payment`,
            person_type: 'dad_business'
        };
    }

    private static mapExpense(description: string, merchant: string, combined: string, amount: number): CategoryMapping {
        // ATM Withdrawals
        if (combined.includes('atm cash') || combined.includes('atm withdrawal')) {
            return {
                category_id: '66666666-6666-6666-6666-666666666670', // Shopping (for cash)
                description: this.formatATMDescription(description),
                person_type: 'shared'
            };
        }

        // Groceries - Specific merchants and items
        if (this.isGroceries(combined)) {
            return {
                category_id: '66666666-6666-6666-6666-666666666665', // Groceries
                description: this.formatGroceriesDescription(description, combined),
                person_type: 'shared'
            };
        }

        // Dining & Food
        if (this.isDining(combined)) {
            return {
                category_id: '66666666-6666-6666-6666-666666666669', // Dining & Food
                description: this.formatDiningDescription(description, combined),
                person_type: 'user'
            };
        }

        // Transportation
        if (this.isTransportation(combined)) {
            return {
                category_id: '66666666-6666-6666-6666-666666666668', // Transportation
                description: this.formatTransportDescription(description, combined),
                person_type: 'shared'
            };
        }

        // Utilities
        if (this.isUtilities(combined)) {
            return {
                category_id: '66666666-6666-6666-6666-666666666666', // Utilities
                description: this.formatUtilitiesDescription(description, combined),
                person_type: 'shared'
            };
        }

        // Personal Care
        if (this.isPersonalCare(combined)) {
            return {
                category_id: '66666666-6666-6666-6666-666666666676', // Personal Care
                description: this.formatPersonalCareDescription(description, combined),
                person_type: 'mom'
            };
        }

        // Entertainment
        if (this.isEntertainment(combined)) {
            return {
                category_id: '66666666-6666-6666-6666-666666666671', // Entertainment
                description: this.formatEntertainmentDescription(description, combined),
                person_type: 'user'
            };
        }

        // Medical
        if (this.isMedical(combined)) {
            return {
                category_id: '66666666-6666-6666-6666-666666666672', // Healthcare
                description: this.formatMedicalDescription(description, combined),
                person_type: 'shared'
            };
        }

        // Education
        if (this.isEducation(combined)) {
            return {
                category_id: '66666666-6666-6666-6666-666666666675', // Education
                description: this.formatEducationDescription(description, combined),
                person_type: 'shared'
            };
        }

        // Business Expenses
        if (this.isBusinessExpense(combined)) {
            return {
                category_id: this.getBusinessCategory(combined),
                description: this.formatBusinessDescription(description, combined),
                person_type: 'dad_business'
            };
        }

        // Default to Shopping
        return {
            category_id: '66666666-6666-6666-6666-666666666670', // Shopping
            description: description,
            person_type: 'user'
        };
    }

    // Groceries detection
    private static isGroceries(combined: string): boolean {
        const groceryMerchants = ['johirul', 'hariom', 'prakash', 'jugesh', 'mahendra'];
        const groceryItems = ['milk', 'dahi', 'paneer', 'eggs', 'nimbu', 'aloo', 'banana', 'chicken', 'misri', 'dosa', 'food'];

        return groceryMerchants.some(merchant => combined.includes(merchant)) ||
            groceryItems.some(item => combined.includes(item));
    }

    // Dining detection
    private static isDining(combined: string): boolean {
        const diningKeywords = ['kabab', 'hotel', 'food', 'restaurant', 'dining', 'cafe'];
        return diningKeywords.some(keyword => combined.includes(keyword));
    }

    // Transportation detection
    private static isTransportation(combined: string): boolean {
        const transportKeywords = ['cab', 'auto', 'rickshaw', 'ride', 'transport', 'fuel'];
        return transportKeywords.some(keyword => combined.includes(keyword));
    }

    // Utilities detection
    private static isUtilities(combined: string): boolean {
        const utilitiesKeywords = ['wifi', 'electric', 'water', 'gas', 'bill'];
        return utilitiesKeywords.some(keyword => combined.includes(keyword));
    }

    // Personal Care detection
    private static isPersonalCare(combined: string): boolean {
        const personalCareKeywords = ['salon', 'parlor', 'beauty', 'care'];
        return personalCareKeywords.some(keyword => combined.includes(keyword));
    }

    // Entertainment detection
    private static isEntertainment(combined: string): boolean {
        const entertainmentKeywords = ['movie', 'netflix', 'cinema', 'entertainment', 'ott'];
        return entertainmentKeywords.some(keyword => combined.includes(keyword));
    }

    // Medical detection
    private static isMedical(combined: string): boolean {
        const medicalKeywords = ['medical', 'wellness', 'medicine', 'pharmacy', 'clinic', 'care'];
        return medicalKeywords.some(keyword => combined.includes(keyword));
    }

    // Education detection
    private static isEducation(combined: string): boolean {
        const educationKeywords = ['xerox', 'stationery', 'book', 'education'];
        return educationKeywords.some(keyword => combined.includes(keyword));
    }

    // Business expense detection
    private static isBusinessExpense(combined: string): boolean {
        const businessKeywords = ['business', 'material', 'fabrication', 'maintenance', 'equipment'];
        return businessKeywords.some(keyword => combined.includes(keyword));
    }

    // Formatting methods
    private static formatATMDescription(description: string): string {
        if (description.includes('satya')) return 'ATM Withdrawal - Satyam ATM';
        if (description.includes('kashish')) return 'ATM Withdrawal - Kashish ATM';
        return 'ATM Withdrawal';
    }

    private static formatGroceriesDescription(description: string, combined: string): string {
        if (combined.includes('dahi')) return 'Groceries - Dahi';
        if (combined.includes('milk')) return 'Groceries - Milk';
        if (combined.includes('misri')) return 'Groceries - Misri';
        if (combined.includes('chicken')) return 'Groceries - Chicken';
        if (combined.includes('nimbu')) return 'Groceries - Nimbu';
        if (combined.includes('paneer')) return 'Groceries - Paneer';
        if (combined.includes('eggs')) return 'Groceries - Eggs';
        if (combined.includes('aloo')) return 'Groceries - Aloo';
        if (combined.includes('banana')) return 'Groceries - Banana';
        if (combined.includes('dosa')) return 'Dining - Dosa'; // Special case
        return 'Groceries';
    }

    private static formatDiningDescription(description: string, combined: string): string {
        if (combined.includes('kabab')) return 'Dining - Kabab';
        if (combined.includes('hotel')) return 'Dining - Hotel';
        if (combined.includes('food')) return 'Dining - Food';
        if (combined.includes('dosa')) return 'Dining - Dosa';
        return 'Dining';
    }

    private static formatTransportDescription(description: string, combined: string): string {
        if (combined.includes('cab')) return 'Transportation - Cab';
        if (combined.includes('auto')) return 'Transportation - Auto';
        if (combined.includes('rick')) return 'Transportation - Rickshaw';
        return 'Transportation';
    }

    private static formatUtilitiesDescription(description: string, combined: string): string {
        if (combined.includes('wifi')) return 'WiFi Bill';
        if (combined.includes('electric')) return 'Utilities - Electricity';
        if (combined.includes('water')) return 'Utilities - Water';
        if (combined.includes('gas')) return 'Utilities - Gas';
        return 'Utilities';
    }

    private static formatPersonalCareDescription(description: string, combined: string): string {
        if (combined.includes('salon')) return 'Personal Care - Salon';
        if (combined.includes('parlor')) return 'Personal Care - Parlor';
        return 'Personal Care';
    }

    private static formatEntertainmentDescription(description: string, combined: string): string {
        if (combined.includes('movie')) return 'Entertainment - Movie';
        if (combined.includes('netflix')) return 'Entertainment - Netflix';
        if (combined.includes('cinema')) return 'Entertainment - Cinema';
        return 'Entertainment';
    }

    private static formatMedicalDescription(description: string, combined: string): string {
        if (combined.includes('wellness')) return 'Medical - Wellness';
        if (combined.includes('medic')) return 'Medical - Medicine';
        if (combined.includes('pharma')) return 'Medical - Pharmacy';
        if (combined.includes('care')) return 'Medical - Care';
        return 'Medical';
    }

    private static formatEducationDescription(description: string, combined: string): string {
        if (combined.includes('xerox')) return 'Education - Xerox';
        if (combined.includes('stationery')) return 'Education - Stationery';
        return 'Education';
    }

    private static formatBusinessDescription(description: string, combined: string): string {
        if (combined.includes('material')) return 'Business Materials';
        if (combined.includes('maintenance')) return 'Business Maintenance';
        return 'Business Expense';
    }

    private static getBusinessCategory(combined: string): string {
        if (combined.includes('material')) return '66666666-6666-6666-6666-666666666673'; // Business Materials
        if (combined.includes('maintenance')) return '66666666-6666-6666-6666-666666666674'; // Business Maintenance
        return '66666666-6666-6666-6666-666666666673'; // Default to Business Materials
    }
    // Detect bank account based on SMS message content
    static detectBankAccount(message: string, bankAccounts: any[]): string | null {
        const lowerMessage = message.toLowerCase();

        // Bank of Baroda detection
        if (lowerMessage.includes('bob') ||
            lowerMessage.includes('baroda') ||
            (lowerMessage.includes('dr. from a/c') && lowerMessage.includes('cr. to'))) {
            const bobAccount = bankAccounts.find(account =>
                account.bank_name.toLowerCase().includes('baroda') ||
                account.bank_name.toLowerCase().includes('bob')
            );
            return bobAccount?.id || null;
        }

        // SBI detection
        if (lowerMessage.includes('sbi') ||
            lowerMessage.includes('state bank') ||
            lowerMessage.includes('dear upi user a/c')) {
            const sbiAccount = bankAccounts.find(account =>
                account.bank_name.toLowerCase().includes('sbi') ||
                account.bank_name.toLowerCase().includes('state bank')
            );
            return sbiAccount?.id || null;
        }

        return null;
    }

    // Enhanced transaction mapping with bank detection
    static mapTransactionWithBank(
        description: string,
        merchant: string,
        amount: number,
        type: 'income' | 'expense',
        message: string,
        bankAccounts: any[]
    ): { mapping: CategoryMapping; bank_account_id: string | null } {

        const mapping = this.mapTransaction(description, merchant, amount, type);
        const bank_account_id = this.detectBankAccount(message, bankAccounts);

        return {
            mapping,
            bank_account_id
        };
    }
}
