// lib/indianBankParser.ts
export interface ParsedTransaction {
    amount: number;
    description: string;
    type: 'income' | 'expense';
    merchant?: string;
    bank?: string;
    balance?: number;
    date?: string;
  }
  
  export class IndianBankParser {
    static parseTransaction(message: string): ParsedTransaction | null {
      const lowerMessage = message.toLowerCase();
      
      // Try specific bank formats first
      const bankParsers = [
        this.parseHDFCFormat,
        this.parseICICIFormat,
        this.parseSBIFormat,
        this.parseAxisFormat,
        this.parseUPIFormat
      ];
  
      for (const parser of bankParsers) {
        const result = parser(message);
        if (result) return result;
      }
      
      // Fallback to generic parser
      return this.parseGenericFormat(message);
    }
  
    private static parseHDFCFormat(message: string): ParsedTransaction | null {
      // HDFC format: "INR 500.00 spent on MERCHANT on DATE. Avl bal INR XXXX"
      const patterns = [
        /INR\s+([\d,]+\.?\d*)\s+spent\s+on\s+([^\.]+)\.?\s*(?:Avl|Avail|Available)\s+bal\s+INR\s+([\d,]+\.?\d*)/i,
        /INR\s+([\d,]+\.?\d*)\s+spent\s+at\s+([^\.]+)\.?\s*(?:Avl|Avail|Available)\s+bal\s+INR\s+([\d,]+\.?\d*)/i,
        /INR\s+([\d,]+\.?\d*)\s+spent\s+for\s+([^\.]+)\.?\s*(?:Avl|Avail|Available)\s+bal\s+INR\s+([\d,]+\.?\d*)/i,
      ];
  
      for (const pattern of patterns) {
        const match = message.match(pattern);
        if (match) {
          return {
            amount: -parseFloat(match[1].replace(/,/g, '')),
            description: match[2].trim(),
            balance: parseFloat(match[3].replace(/,/g, '')),
            type: 'expense',
            bank: 'HDFC',
            merchant: this.extractMerchantFromDescription(match[2])
          };
        }
      }
      return null;
    }
  
    private static parseICICIFormat(message: string): ParsedTransaction | null {
      // ICICI format: "Your a/c XX1234 is debited INR 1,000.00 on DATE. Avl Bal INR XXXX"
      const patterns = [
        /debited\s+INR\s+([\d,]+\.?\d*)\s+on\s+([^\.]+)\.?\s*(?:Avl|Avail|Available)\s+Bal\s+INR\s+([\d,]+\.?\d*)/i,
        /debited\s+INR\s+([\d,]+\.?\d*)\s+at\s+([^\.]+)\.?\s*(?:Avl|Avail|Available)\s+Bal\s+INR\s+([\d,]+\.?\d*)/i,
        /INR\s+([\d,]+\.?\d*)\s+has\s+been\s+debited/i,
      ];
  
      for (const pattern of patterns) {
        const match = message.match(pattern);
        if (match) {
          return {
            amount: -parseFloat(match[1].replace(/,/g, '')),
            description: match[2] ? match[2].trim() : 'ICICI Bank Transaction',
            balance: match[3] ? parseFloat(match[3].replace(/,/g, '')) : undefined,
            type: 'expense',
            bank: 'ICICI',
            merchant: match[2] ? this.extractMerchantFromDescription(match[2]) : undefined
          };
        }
      }
      return null;
    }
  
    private static parseSBIFormat(message: string): ParsedTransaction | null {
      // SBI format: "Your SBI A/C XX1234 debited by INR 500.00 on DATE. Avl Bal INR XXXX"
      const patterns = [
        /debited\s+by\s+INR\s+([\d,]+\.?\d*)\s+on\s+([^\.]+)\.?\s*(?:Avl|Avail|Available)\s+Bal\s+INR\s+([\d,]+\.?\d*)/i,
        /debited\s+INR\s+([\d,]+\.?\d*)\s+on\s+([^\.]+)\.?\s*Bal\s+INR\s+([\d,]+\.?\d*)/i,
      ];
  
      for (const pattern of patterns) {
        const match = message.match(pattern);
        if (match) {
          return {
            amount: -parseFloat(match[1].replace(/,/g, '')),
            description: match[2].trim(),
            balance: parseFloat(match[3].replace(/,/g, '')),
            type: 'expense',
            bank: 'SBI',
            merchant: this.extractMerchantFromDescription(match[2])
          };
        }
      }
      return null;
    }
  
    private static parseAxisFormat(message: string): ParsedTransaction | null {
      // Axis format variations
      const patterns = [
        /INR\s+([\d,]+\.?\d*)\s+has\s+been\s+debited/i,
        /debited\s+INR\s+([\d,]+\.?\d*)/i,
      ];
  
      for (const pattern of patterns) {
        const match = message.match(pattern);
        if (match && message.toLowerCase().includes('axis')) {
          return {
            amount: -parseFloat(match[1].replace(/,/g, '')),
            description: 'Axis Bank Transaction',
            type: 'expense',
            bank: 'Axis'
          };
        }
      }
      return null;
    }
  
    private static parseUPIFormat(message: string): ParsedTransaction | null {
      // UPI transaction formats
      const patterns = [
        /INR\s+([\d,]+\.?\d*)\s+paid\s+to\s+([^\.]+)\.?\s+UPI/i,
        /INR\s+([\d,]+\.?\d*)\s+received\s+from\s+([^\.]+)\.?\s+UPI/i,
        /UPI\s+transaction\s+of\s+INR\s+([\d,]+\.?\d*)/i,
      ];
  
      for (const pattern of patterns) {
        const match = message.match(pattern);
        if (match) {
          const isCredit = message.toLowerCase().includes('received');
          return {
            amount: isCredit ? Math.abs(parseFloat(match[1].replace(/,/g, ''))) : -Math.abs(parseFloat(match[1].replace(/,/g, ''))),
            description: match[2] ? match[2].trim() : 'UPI Transaction',
            type: isCredit ? 'income' : 'expense',
            bank: 'UPI',
            merchant: match[2] ? this.extractMerchantFromDescription(match[2]) : undefined
          };
        }
      }
      return null;
    }
  
    private static parseGenericFormat(message: string): ParsedTransaction | null {
      // Generic patterns that work across multiple banks
      const patterns = [
        /INR\s+([\d,]+\.?\d*)\s+(?:spent|debited|paid)\s+(?:on|at|with|for)\s+([^\.]+)/i,
        /(?:spent|debited|paid)\s+INR\s+([\d,]+\.?\d*)\s+(?:on|at|with|for)\s+([^\.]+)/i,
        /received\s+INR\s+([\d,]+\.?\d*)\s+from\s+([^\.]+)/i,
        /INR\s+([\d,]+\.?\d*)\s+credited\s+(?:from|by)\s+([^\.]+)/i,
        /INR\s+([\d,]+\.?\d*)\s+has\s+been\s+credited/i,
      ];
  
      for (const pattern of patterns) {
        const match = message.match(pattern);
        if (match) {
          const amount = parseFloat(match[1].replace(/,/g, ''));
          const isCredit = message.toLowerCase().includes('received') || 
                          message.toLowerCase().includes('credited');
          
          return {
            amount: isCredit ? Math.abs(amount) : -Math.abs(amount),
            description: match[2] ? match[2].trim() : 'Bank Transaction',
            type: isCredit ? 'income' : 'expense',
            bank: 'Unknown',
            merchant: match[2] ? this.extractMerchantFromDescription(match[2]) : undefined
          };
        }
      }
      return null;
    }
  
    private static extractMerchantFromDescription(description: string): string {
      // Extract merchant name from description
      const merchantPatterns = [
        /(?:at|on|with|for)\s+([A-Za-z0-9\s&]+?)(?:\s+(?:on|at|date|\.|$))/i,
        /at\s+([A-Za-z0-9\s]+)/i,
        /to\s+([A-Za-z0-9\s]+)/i,
      ];
      
      for (const pattern of merchantPatterns) {
        const match = description.match(pattern);
        if (match) {
          return match[1].trim();
        }
      }
      
      return description.split(' ').slice(0, 3).join(' '); // First 3 words as fallback
    }
  }