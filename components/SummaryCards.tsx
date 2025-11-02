import React from 'react';
import { Text, View } from 'react-native';
import { styled } from 'tailwindcss-react-native';
import { Card, CardContent } from './ui/Card';


const StyledView = styled(View);
const StyledText = styled(Text);

interface SummaryCardsProps {
  totalExpenses: number;
  totalIncome: number;
  balance: number;
  transactionsCount: number;
}

export default function SummaryCards({ 
  totalExpenses, 
  totalIncome, 
  balance, 
  transactionsCount 
}: SummaryCardsProps) {
  const cards = [
    {
      title: 'Income',
      amount: totalIncome,
      color: 'text-green-600',
      bg: 'bg-green-50',
      icon: '💰'
    },
    {
      title: 'Expenses',
      amount: totalExpenses,
      color: 'text-red-600',
      bg: 'bg-red-50',
      icon: '💸'
    },
    {
      title: 'Balance',
      amount: balance,
      color: balance >= 0 ? 'text-blue-600' : 'text-orange-600',
      bg: balance >= 0 ? 'bg-blue-50' : 'bg-orange-50',
      icon: balance >= 0 ? '📈' : '📉'
    },
    {
      title: 'Transactions',
      amount: transactionsCount,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      icon: '📊'
    }
  ];

  return (
    <StyledView className="flex-row flex-wrap px-4 mt-4 justify-between">
      {cards.map((card, index) => (
        <Card key={index} className="w-[48%] mb-3">
          <CardContent className="p-4">
            <StyledView className="flex-row items-center justify-between">
              <StyledView>
                <StyledText className="text-sm text-muted-foreground">{card.title}</StyledText>
                <StyledText className={`text-lg font-bold ${card.color} mt-1`}>
                  {typeof card.amount === 'number' ? 
                    card.amount.toLocaleString('en-IN', { 
                      maximumFractionDigits: 0 
                    }) : card.amount}
                </StyledText>
              </StyledView>
              <StyledView className={`w-10 h-10 rounded-full ${card.bg} items-center justify-center`}>
                <StyledText className="text-lg">{card.icon}</StyledText>
              </StyledView>
            </StyledView>
          </CardContent>
        </Card>
      ))}
    </StyledView>
  );
}