// lib/bankSpecificParser.ts
export interface ParsedTransaction {
    amount: number;
    description: string;
    type: 'income' | 'expense';
    merchant?: string;
    bank?: string;
    date?: string;
  }
  
  export class BankSpecificParser {
    static parseTransaction(message: string): ParsedTransaction | null {
      // Bank of Baroda (BOB) Parser
      if (this.isBOBMessage(message)) {
        return this.parseBOBTransaction(message);
      }
      
      // SBI Parser
      if (this.isSBIMessage(message)) {
        return this.parseSBITransaction(message);
      }
      
      // UPI Parser
      if (this.isUPIMessage(message)) {
        return this.parseUPITransaction(message);
      }
      
      return null;
    }
  
    private static isBOBMessage(message: string): boolean {
      return message.includes('Dr. from A/C') && message.includes('Cr. to');
    }
  
    private static isSBIMessage(message: string): boolean {
      return message.includes('Dear UPI user') && message.includes('debited by');
    }
  
    private static isUPIMessage(message: string): boolean {
      return message.includes('UPI') || message.includes('trf to');
    }
  
    // In lib/bankSpecificParser.ts - Update the BOB parser
private static parseBOBTransaction(message: string): ParsedTransaction | null {
    // Enhanced pattern for BOB: "Rs.10.00 Dr. from A/C XXXXXX6313 and Cr. to paytmqr1axzf3q17z@paytm"
    const pattern = /Rs\.\s*([\d,]+\.\d{2})\s+Dr\.\s+from\s+A\/C\s+\w+\s+and\s+Cr\.\s+to\s+([^\.\n]+)/i;
    const match = message.match(pattern);
    
    if (match) {
      const amount = parseFloat(match[1].replace(/,/g, ''));
      let recipient = match[2].trim();
      
      // Clean up recipient - remove Ref: and anything after it
      if (recipient.includes('Ref:')) {
        recipient = recipient.split('Ref:')[0].trim();
      }
      if (recipient.includes('AvlBal:')) {
        recipient = recipient.split('AvlBal:')[0].trim();
      }
      
      return {
        amount: -Math.abs(amount),
        description: `UPI Payment to ${recipient}`,
        type: 'expense',
        merchant: recipient,
        bank: 'Bank of Baroda'
      };
    }
    return null;
  }
  
    // In lib/bankSpecificParser.ts - Update the SBI parser
private static parseSBITransaction(message: string): ParsedTransaction | null {
    // Pattern: "Dear UPI user A/C X5986 debited by 47.0 on date 03Nov25 trf to MAHENDRA BALASO"
    const pattern = /debited\s+by\s+([\d,]+\.\d{1,2})\s+on\s+date\s+(\w+)\s+trf\s+to\s+([^\.]+)/i;
    const match = message.match(pattern);
    
    if (match) {
      const amount = parseFloat(match[1].replace(/,/g, ''));
      const date = match[2];
      // Extract the full recipient name until "Refno"
      let recipient = match[3];
      if (recipient.includes('Refno')) {
        recipient = recipient.split('Refno')[0].trim();
      }
      
      return {
        amount: -Math.abs(amount),
        description: `Transfer to ${recipient} on ${date}`,
        type: 'expense',
        merchant: recipient,
        bank: 'SBI'
      };
    }
    return null;
  }
  
    private static parseUPITransaction(message: string): ParsedTransaction | null {
      // Generic UPI pattern
      const patterns = [
        /(?:INR|Rs?\.?)\s*([\d,]+\.?\d*)\s*(?:paid|sent)\s*to\s*([^\.]+)/i,
        /debited\s+by\s+(?:INR|Rs?\.?)\s*([\d,]+\.?\d*)\s+on\s+date\s+\w+\s+trf\s+to\s+([^\.]+)/i
      ];
      
      for (const pattern of patterns) {
        const match = message.match(pattern);
        if (match) {
          const amount = parseFloat(match[1].replace(/,/g, ''));
          const recipient = match[2]?.split('Ref')[0]?.trim() || 'UPI Merchant';
          
          return {
            amount: -Math.abs(amount),
            description: `UPI Payment to ${recipient}`,
            type: 'expense',
            merchant: recipient,
            bank: 'UPI'
          };
        }
      }
      return null;
    }
  }