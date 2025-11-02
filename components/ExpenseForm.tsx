import React, { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { styled } from 'tailwindcss-react-native';
import { BankAccount, Category } from '../lib/database';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

const StyledView = styled(View);
const StyledText = styled(Text);

interface ExpenseFormProps {
  onAddExpense: (expense: any) => void;
  categories: Category[];
  bankAccounts: BankAccount[];
}

export default function ExpenseForm({ onAddExpense, categories, bankAccounts }: ExpenseFormProps) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [bankAccountId, setBankAccountId] = useState('');
  const [transactionType, setTransactionType] = useState<'expense' | 'income'>('expense');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!amount || !description || !categoryId || !bankAccountId) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      await onAddExpense({
        amount: transactionType === 'expense' ? -numericAmount : numericAmount,
        description,
        category_id: categoryId,
        bank_account_id: bankAccountId,
        person_id: 'default-person-id', // You'll need to handle this
      });

      // Reset form
      setAmount('');
      setDescription('');
      setCategoryId('');
      setBankAccountId('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <StyledView className="space-y-4">
      <StyledView className="flex-row space-x-2">
        <Button
          variant={transactionType === 'expense' ? 'default' : 'outline'}
          size="sm"
          onPress={() => setTransactionType('expense')}
          className="flex-1"
        >
          Expense
        </Button>
        <Button
          variant={transactionType === 'income' ? 'default' : 'outline'}
          size="sm"
          onPress={() => setTransactionType('income')}
          className="flex-1"
        >
          Income
        </Button>
      </StyledView>

      <Input
        placeholder="Amount"
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
        className="text-lg"
      />

      <Input
        placeholder="Description"
        value={description}
        onChangeText={setDescription}
        className="text-lg"
      />

      <StyledView className="border border-input rounded-md">
        <StyledText className="text-sm text-muted-foreground px-3 pt-2">
          Category
        </StyledText>
        <StyledView className="flex-row flex-wrap p-2">
          {categories.slice(0, 6).map(category => (
            <Button
              key={category.id}
              variant={categoryId === category.id ? 'default' : 'outline'}
              size="sm"
              onPress={() => setCategoryId(category.id)}
              className="m-1"
            >
              {category.icon} {category.name}
            </Button>
          ))}
        </StyledView>
      </StyledView>

      <StyledView className="border border-input rounded-md">
        <StyledText className="text-sm text-muted-foreground px-3 pt-2">
          Bank Account
        </StyledText>
        <StyledView className="flex-row flex-wrap p-2">
          {bankAccounts.map(account => (
            <Button
              key={account.id}
              variant={bankAccountId === account.id ? 'default' : 'outline'}
              size="sm"
              onPress={() => setBankAccountId(account.id)}
              className="m-1"
            >
              {account.bank_name}
            </Button>
          ))}
        </StyledView>
      </StyledView>

      <Button
        onPress={handleSubmit}
        loading={loading}
        disabled={loading}
        className="mt-2"
      >
        Add {transactionType === 'expense' ? 'Expense' : 'Income'}
      </Button>
    </StyledView>
  );
}