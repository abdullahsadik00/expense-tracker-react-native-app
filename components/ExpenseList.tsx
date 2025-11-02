import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { styled } from 'tailwindcss-react-native';
import { Category, Transaction } from '../lib/database';
import { Button } from './ui/Button';

const StyledView = styled(View);
const StyledText = styled(Text);

interface ExpenseListProps {
  transactions: Transaction[];
  onDeleteTransaction: (id: string) => void;
  categories: Category[];
}

export default function ExpenseList({ transactions, onDeleteTransaction, categories }: ExpenseListProps) {
  const getCategory = (categoryId: string) => {
    return categories.find(c => c.id === categoryId);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short'
    });
  };

  if (transactions.length === 0) {
    return (
      <StyledView className="py-8 items-center">
        <StyledText className="text-muted-foreground text-lg">No transactions yet</StyledText>
        <StyledText className="text-muted-foreground text-sm mt-2">
          Add your first transaction above!
        </StyledText>
      </StyledView>
    );
  }

  return (
    <ScrollView>
      {transactions.slice(0, 10).map(transaction => {
        const category = getCategory(transaction.category_id);
        const isExpense = transaction.amount < 0;
        const amount = Math.abs(transaction.amount);

        return (
          <StyledView
            key={transaction.id}
            className="flex-row items-center justify-between py-3 border-b border-border last:border-b-0"
          >
            <StyledView className="flex-row items-center flex-1">
              <StyledView 
                className="w-10 h-10 rounded-full items-center justify-center mr-3"
                style={{ backgroundColor: category?.color + '20' }}
              >
                <StyledText style={{ color: category?.color }}>
                  {category?.icon}
                </StyledText>
              </StyledView>
              
              <StyledView className="flex-1">
                <StyledText className="font-medium text-foreground">
                  {transaction.description}
                </StyledText>
                <StyledText className="text-sm text-muted-foreground mt-1">
                  {category?.name} • {formatDate(transaction.transaction_date)}
                </StyledText>
              </StyledView>
            </StyledView>

            <StyledView className="items-end">
              <StyledText 
                className={`font-semibold ${
                  isExpense ? 'text-red-600' : 'text-green-600'
                }`}
              >
                {isExpense ? '-' : '+'}₹{amount.toLocaleString('en-IN')}
              </StyledText>
              <Button
                variant="ghost"
                size="sm"
                onPress={() => onDeleteTransaction(transaction.id)}
                className="mt-1"
              >
                🗑️
              </Button>
            </StyledView>
          </StyledView>
        );
      })}
    </ScrollView>
  );
}