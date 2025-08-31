import React, { useEffect, useState } from "react";
import { ScrollView, View, Text, ActivityIndicator, StyleSheet } from "react-native";
import dayjs from "dayjs";

import ExpenseCard from "./components/ExpenseCard.js";
import { DEFAULT_INCOME, FIXED_EXPENSES } from "./constants/fixedExpenses.js";
import { parseExpenseInput } from "./utils/parser";
import {
  addExpense as addExpenseToDB,
  getExpensesByMonth,
  updateExpense as updateExpenseInDB,
  deleteExpense as deleteExpenseFromDB,
} from "./services/expenseService.js";

const generatePastMonths = (n = 3) => {
  const months = [];
  for (let i = 0; i < n; i++) {
    months.push(dayjs().subtract(i, "month").format("MMMM YYYY"));
  }
  return months;
};

export default function App() {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [expandedMonth, setExpandedMonth] = useState(dayjs().format("MMMM YYYY"));

  const loadData = async () => {
    setLoading(true);
    try {
      const months = generatePastMonths(3);
      const newData = {};

      for (const monthKey of months) {
        let expenses = await getExpensesByMonth(monthKey);

        // Check if no expenses exist for this month.
        // If a month is new, it will have no documents in Firestore.
        if (expenses.length === 0) {
          // Add fixed expenses to the database for this new month
          for (const fixedExpense of FIXED_EXPENSES) {
            const newFixedExpense = {
              name: fixedExpense.title,
              amount: fixedExpense.amount,
              date: new Date(),
              monthKey: monthKey,
            };
            await addExpenseToDB(newFixedExpense);
          }
          // Fetch the updated list of expenses including the newly added fixed ones
          expenses = await getExpensesByMonth(monthKey);
        }

        newData[monthKey] = {
          income: DEFAULT_INCOME,
          expenses: expenses,
        };
      }
      setData(newData);
      setExpandedMonth(months[0]);
    } catch (e) {
      console.error("Error loading data from Firebase:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onAddExpenseText = async (monthKey, textInput) => {
    const entries = parseExpenseInput(textInput);
    if (!entries.length) return;

    try {
      for (const entry of entries) {
        const newExpenseData = {
          name: entry.name,
          amount: entry.amount,
          date: new Date(),
          monthKey: monthKey,
        };
        const newExpenseId = await addExpenseToDB(newExpenseData);
        
        // Optimistically update local state
        setData(prevData => {
          const updatedMonthData = { ...prevData[monthKey] };
          const newExpenses = [
            ...(updatedMonthData.expenses || []),
            { id: newExpenseId, ...newExpenseData },
          ];
          updatedMonthData.expenses = newExpenses;
          return {
            ...prevData,
            [monthKey]: updatedMonthData,
          };
        });
      }
    } catch (e) {
      console.error("Error adding expense:", e);
      // Optional: Add logic to revert local state if the database operation failed.
    }
  };

  const editExpense = async (monthKey, id, text) => {
    const entries = parseExpenseInput(text);
    if (!entries.length) return;

    try {
      const updatedData = {
        name: entries[0].name,
        amount: entries[0].amount,
      };
      await updateExpenseInDB(id, updatedData);

      // Optimistically update local state
      setData(prevData => {
        const updatedMonthData = { ...prevData[monthKey] };
        const expenseIndex = updatedMonthData.expenses.findIndex(e => e.id === id);

        if (expenseIndex !== -1) {
          const updatedExpenses = [...updatedMonthData.expenses];
          updatedExpenses[expenseIndex] = {
            ...updatedExpenses[expenseIndex],
            ...updatedData,
          };
          updatedMonthData.expenses = updatedExpenses;
        }
        return {
          ...prevData,
          [monthKey]: updatedMonthData,
        };
      });
    } catch (e) {
      console.error("Error editing expense:", e);
    }
  };

  const deleteExpense = async (monthKey, id) => {
    try {
      await deleteExpenseFromDB(id);

      // Optimistically update local state
      setData(prevData => {
        const updatedMonthData = { ...prevData[monthKey] };
        updatedMonthData.expenses = updatedMonthData.expenses.filter(e => e.id !== id);
        return {
          ...prevData,
          [monthKey]: updatedMonthData,
        };
      });
    } catch (e) {
      console.error("Error deleting expense:", e);
    }
  };

  const toggleMonth = (month) => setExpandedMonth(prev => (prev === month ? null : month));

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8 }}>ஏற்றுகிறது...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {Object.keys(data).map(mk => (
        <ExpenseCard
          key={mk}
          monthKey={mk}
          data={data[mk]}
          isOpen={expandedMonth === mk}
          onToggle={toggleMonth}
          onAddExpense={(txt) => onAddExpenseText(mk, txt)}
          onEditExpense={(id, txt) => editExpense(mk, id, txt)}
          onDeleteExpense={(id) => deleteExpense(mk, id)}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f2f2f2", padding: 12, marginTop: 60 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});