import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { Stack } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import { Receipt, Download, Calendar } from 'lucide-react-native';
import { useTruckerData } from '@/hooks/useTruckerData';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { COLORS } from '@/constants/colors';
import { EXPENSE_CATEGORIES } from '@/constants/checklists';
import { Expense } from '@/types';

export default function ExpensesScreen() {
  const { expenses, addExpense, trips } = useTruckerData();
  const [kategorie, setKategorie] = useState<typeof EXPENSE_CATEGORIES[number]>('Verpflegung');
  const [betrag, setBetrag] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'week' | 'month'>('day');

  const currentTrip = trips.find(trip => !trip.end_datetime);

  const handleAddExpense = () => {
    if (!currentTrip) {
      Alert.alert('Fehler', 'Keine aktive Fahrt. Bitte starten Sie zuerst eine Fahrt im Dashboard.');
      return;
    }

    if (!betrag) {
      Alert.alert('Fehler', 'Bitte geben Sie einen Betrag ein.');
      return;
    }

    const betragNum = parseFloat(betrag.replace(',', '.'));
    if (isNaN(betragNum) || betragNum <= 0) {
      Alert.alert('Fehler', 'Bitte geben Sie einen gültigen Betrag ein.');
      return;
    }

    addExpense({
      trip_id: currentTrip.id,
      datum: new Date().toISOString(),
      kategorie,
      betrag: betragNum,
    });

    setBetrag('');
    Alert.alert('Erfolg', 'Spese wurde hinzugefügt.');
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toFixed(2)} €`;
  };

  const getExpensesForPeriod = (period: 'day' | 'week' | 'month') => {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        const dayOfWeek = now.getDay();
        const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Monday
        startDate = new Date(now.getFullYear(), now.getMonth(), diff);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
    }

    return expenses.filter(expense => {
      const expenseDate = new Date(expense.datum);
      return expenseDate >= startDate;
    });
  };

  const getExpensesByCategory = (expenseList: Expense[]) => {
    const byCategory: Record<string, { total: number; count: number }> = {};
    
    EXPENSE_CATEGORIES.forEach(category => {
      byCategory[category] = { total: 0, count: 0 };
    });

    expenseList.forEach(expense => {
      byCategory[expense.kategorie].total += expense.betrag;
      byCategory[expense.kategorie].count += 1;
    });

    return byCategory;
  };

  const exportToCSV = (period: 'day' | 'week' | 'month') => {
    const periodExpenses = getExpensesForPeriod(period);
    const total = periodExpenses.reduce((sum, expense) => sum + expense.betrag, 0);
    
    // In a real app, this would generate and share a CSV file
    Alert.alert(
      'CSV Export',
      `${periodExpenses.length} Spesen (${formatCurrency(total)}) für ${
        period === 'day' ? 'heute' : 
        period === 'week' ? 'diese Woche' : 
        'diesen Monat'
      } würden als CSV exportiert.`,
      [{ text: 'OK' }]
    );
  };

  const todayExpenses = getExpensesForPeriod('day');
  const weekExpenses = getExpensesForPeriod('week');
  const monthExpenses = getExpensesForPeriod('month');

  const selectedExpenses = getExpensesForPeriod(selectedPeriod);
  const selectedTotal = selectedExpenses.reduce((sum, expense) => sum + expense.betrag, 0);
  const selectedByCategory = getExpensesByCategory(selectedExpenses);

  const recentExpenses = [...expenses]
    .sort((a, b) => new Date(b.datum).getTime() - new Date(a.datum).getTime())
    .slice(0, 20);

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Spesen-Abrechnung' }} />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Add New Expense */}
        <Card style={styles.formCard}>
          <Text style={styles.cardTitle}>Neue Spese hinzufügen</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Kategorie</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={kategorie}
                onValueChange={setKategorie}
                style={styles.picker}
                testID="expense-category-picker"
              >
                {EXPENSE_CATEGORIES.map(category => (
                  <Picker.Item key={category} label={category} value={category} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Betrag (€)</Text>
            <TextInput
              style={styles.input}
              value={betrag}
              onChangeText={setBetrag}
              placeholder="z.B. 15.50"
              keyboardType="numeric"
              testID="expense-amount-input"
            />
          </View>

          <Button
            title="Spese hinzufügen"
            onPress={handleAddExpense}
            variant="primary"
            size="large"
            testID="add-expense-button"
          />
        </Card>

        {/* Quick Stats */}
        <Card style={styles.statsCard}>
          <Text style={styles.cardTitle}>Übersicht</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatCurrency(todayExpenses.reduce((s, e) => s + e.betrag, 0))}</Text>
              <Text style={styles.statLabel}>Heute</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatCurrency(weekExpenses.reduce((s, e) => s + e.betrag, 0))}</Text>
              <Text style={styles.statLabel}>Diese Woche</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatCurrency(monthExpenses.reduce((s, e) => s + e.betrag, 0))}</Text>
              <Text style={styles.statLabel}>Dieser Monat</Text>
            </View>
          </View>
        </Card>

        {/* Period Selection & Export */}
        <Card style={styles.exportCard}>
          <Text style={styles.cardTitle}>Auswertung & Export</Text>
          
          <View style={styles.periodSelector}>
            <TouchableOpacity
              style={[styles.periodButton, selectedPeriod === 'day' && styles.periodButtonActive]}
              onPress={() => setSelectedPeriod('day')}
            >
              <Text style={[styles.periodButtonText, selectedPeriod === 'day' && styles.periodButtonTextActive]}>
                Tag
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.periodButton, selectedPeriod === 'week' && styles.periodButtonActive]}
              onPress={() => setSelectedPeriod('week')}
            >
              <Text style={[styles.periodButtonText, selectedPeriod === 'week' && styles.periodButtonTextActive]}>
                Woche
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.periodButton, selectedPeriod === 'month' && styles.periodButtonActive]}
              onPress={() => setSelectedPeriod('month')}
            >
              <Text style={[styles.periodButtonText, selectedPeriod === 'month' && styles.periodButtonTextActive]}>
                Monat
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.periodSummary}>
            <Text style={styles.periodTotal}>
              Gesamt: {formatCurrency(selectedTotal)} ({selectedExpenses.length} Spesen)
            </Text>
            
            <View style={styles.categoryBreakdown}>
              {EXPENSE_CATEGORIES.map(category => {
                const categoryData = selectedByCategory[category];
                if (categoryData.count === 0) return null;
                
                return (
                  <View key={category} style={styles.categoryItem}>
                    <Text style={styles.categoryName}>{category}</Text>
                    <Text style={styles.categoryAmount}>
                      {formatCurrency(categoryData.total)} ({categoryData.count}x)
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          <Button
            title={`CSV Export (${selectedPeriod === 'day' ? 'Tag' : selectedPeriod === 'week' ? 'Woche' : 'Monat'})`}
            onPress={() => exportToCSV(selectedPeriod)}
            variant="secondary"
            size="medium"
            testID="export-csv-button"
          />
        </Card>

        {/* Recent Expenses */}
        <Card style={styles.historyCard}>
          <Text style={styles.cardTitle}>Letzte Spesen</Text>
          
          {recentExpenses.length === 0 ? (
            <Text style={styles.emptyText}>Noch keine Spesen erfasst.</Text>
          ) : (
            recentExpenses.map((expense) => (
              <View key={expense.id} style={styles.expenseItem}>
                <View style={styles.expenseHeader}>
                  <View style={styles.expenseInfo}>
                    <Text style={styles.expenseCategory}>{expense.kategorie}</Text>
                    <Text style={styles.expenseDate}>
                      {new Date(expense.datum).toLocaleDateString('de-DE')} - {' '}
                      {new Date(expense.datum).toLocaleTimeString('de-DE', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </Text>
                  </View>
                  <Text style={styles.expenseAmount}>
                    {formatCurrency(expense.betrag)}
                  </Text>
                </View>
              </View>
            ))
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  formCard: {
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: COLORS.white,
    minHeight: 48,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    backgroundColor: COLORS.white,
  },
  picker: {
    height: 48,
  },
  statsCard: {
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  exportCard: {
    marginBottom: 24,
  },
  periodSelector: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: COLORS.gray100,
    borderRadius: 8,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: COLORS.primary,
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  periodButtonTextActive: {
    color: COLORS.white,
  },
  periodSummary: {
    marginBottom: 16,
  },
  periodTotal: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  categoryBreakdown: {
    gap: 8,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryName: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  categoryAmount: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  historyCard: {
    marginBottom: 24,
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    fontSize: 16,
    padding: 20,
  },
  expenseItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expenseInfo: {
    flex: 1,
  },
  expenseCategory: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  expenseDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
});