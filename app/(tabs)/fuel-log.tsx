import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  SafeAreaView,
} from 'react-native';
import { Stack } from 'expo-router';
import { useTruckerData } from '@/hooks/useTruckerData';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { COLORS } from '@/constants/colors';
import { FuelLog } from '@/types';

export default function FuelLogScreen() {
  const { fuelLogs, addFuelLog, trips } = useTruckerData();
  const [ort, setOrt] = useState('');
  const [km, setKm] = useState('');
  const [liter, setLiter] = useState('');
  const [preisTotal, setPreisTotal] = useState('');

  const currentTrip = trips.find(trip => !trip.end_datetime);

  const handleAddFuelLog = () => {
    if (!currentTrip) {
      Alert.alert('Fehler', 'Keine aktive Fahrt. Bitte starten Sie zuerst eine Fahrt.');
      return;
    }

    if (!ort || !km || !liter || !preisTotal) {
      Alert.alert('Fehler', 'Bitte füllen Sie alle Felder aus.');
      return;
    }

    const kmNum = parseFloat(km);
    const literNum = parseFloat(liter);
    const preisNum = parseFloat(preisTotal);

    if (isNaN(kmNum) || isNaN(literNum) || isNaN(preisNum)) {
      Alert.alert('Fehler', 'Bitte geben Sie gültige Zahlen ein.');
      return;
    }

    addFuelLog({
      trip_id: currentTrip.id,
      datum: new Date().toISOString(),
      ort,
      km: kmNum,
      liter: literNum,
      preis_total: preisNum,
    });

    // Reset form
    setOrt('');
    setKm('');
    setLiter('');
    setPreisTotal('');

    Alert.alert('Erfolg', 'Tankstopp wurde hinzugefügt.');
  };

  const calculateConsumption = (currentLog: FuelLog, previousLog?: FuelLog) => {
    if (!previousLog) return null;
    
    const kmDiff = currentLog.km - previousLog.km;
    if (kmDiff <= 0) return null;
    
    return (currentLog.liter / kmDiff) * 100;
  };

  const calculatePricePerLiter = (log: FuelLog) => {
    return log.preis_total / log.liter;
  };

  const getMonthlyStats = () => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthlyLogs = fuelLogs.filter(log => log.datum.startsWith(currentMonth));
    
    const totalCost = monthlyLogs.reduce((sum, log) => sum + log.preis_total, 0);
    const totalLiters = monthlyLogs.reduce((sum, log) => sum + log.liter, 0);
    
    const avgConsumption = monthlyLogs.reduce((sum, log, index) => {
      const consumption = calculateConsumption(log, fuelLogs[index - 1]);
      return consumption ? sum + consumption : sum;
    }, 0) / monthlyLogs.filter((_, index) => calculateConsumption(monthlyLogs[index], fuelLogs[index - 1])).length;

    return {
      totalCost,
      totalLiters,
      avgConsumption: isNaN(avgConsumption) ? 0 : avgConsumption,
      count: monthlyLogs.length,
    };
  };

  const monthlyStats = getMonthlyStats();
  const sortedLogs = [...fuelLogs].sort((a, b) => new Date(b.datum).getTime() - new Date(a.datum).getTime());

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Tankbuch' }} />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Add New Entry */}
        <Card style={styles.formCard}>
          <Text style={styles.cardTitle}>Neuer Tankstopp</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Ort</Text>
            <TextInput
              style={styles.input}
              value={ort}
              onChangeText={setOrt}
              placeholder="z.B. Shell Autohof A1"
              testID="fuel-location-input"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Kilometerstand</Text>
            <TextInput
              style={styles.input}
              value={km}
              onChangeText={setKm}
              placeholder="z.B. 125000"
              keyboardType="numeric"
              testID="fuel-km-input"
            />
          </View>

          <View style={styles.inputRow}>
            <View style={styles.inputHalf}>
              <Text style={styles.label}>Liter</Text>
              <TextInput
                style={styles.input}
                value={liter}
                onChangeText={setLiter}
                placeholder="z.B. 350"
                keyboardType="numeric"
                testID="fuel-liters-input"
              />
            </View>

            <View style={styles.inputHalf}>
              <Text style={styles.label}>Preis gesamt (€)</Text>
              <TextInput
                style={styles.input}
                value={preisTotal}
                onChangeText={setPreisTotal}
                placeholder="z.B. 525.50"
                keyboardType="numeric"
                testID="fuel-price-input"
              />
            </View>
          </View>

          <Button
            title="Tankstopp hinzufügen"
            onPress={handleAddFuelLog}
            variant="primary"
            size="large"
            testID="add-fuel-log-button"
          />
        </Card>

        {/* Monthly Statistics */}
        <Card style={styles.statsCard}>
          <Text style={styles.cardTitle}>Monatsstatistik</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{monthlyStats.totalCost.toFixed(2)} €</Text>
              <Text style={styles.statLabel}>Gesamtkosten</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{monthlyStats.totalLiters.toFixed(0)} L</Text>
              <Text style={styles.statLabel}>Getankt</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{monthlyStats.avgConsumption.toFixed(1)} L</Text>
              <Text style={styles.statLabel}>Ø Verbrauch/100km</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{monthlyStats.count}</Text>
              <Text style={styles.statLabel}>Tankstopps</Text>
            </View>
          </View>
        </Card>

        {/* Fuel Log History */}
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Tankhistorie</Text>
          
          {sortedLogs.length === 0 ? (
            <Card>
              <Text style={styles.emptyText}>Noch keine Tankstopps erfasst.</Text>
            </Card>
          ) : (
            sortedLogs.map((log, index) => {
              const previousLog = index < sortedLogs.length - 1 ? sortedLogs[index + 1] : undefined;
              const consumption = calculateConsumption(log, previousLog);
              const pricePerLiter = calculatePricePerLiter(log);

              return (
                <Card key={log.id} style={styles.logCard}>
                  <View style={styles.logHeader}>
                    <Text style={styles.logLocation}>{log.ort}</Text>
                    <Text style={styles.logDate}>
                      {new Date(log.datum).toLocaleDateString('de-DE')}
                    </Text>
                  </View>
                  
                  <View style={styles.logDetails}>
                    <View style={styles.logRow}>
                      <Text style={styles.logLabel}>Kilometerstand:</Text>
                      <Text style={styles.logValue}>{log.km.toLocaleString('de-DE')} km</Text>
                    </View>
                    <View style={styles.logRow}>
                      <Text style={styles.logLabel}>Getankt:</Text>
                      <Text style={styles.logValue}>{log.liter} L</Text>
                    </View>
                    <View style={styles.logRow}>
                      <Text style={styles.logLabel}>Preis gesamt:</Text>
                      <Text style={styles.logValue}>{log.preis_total.toFixed(2)} €</Text>
                    </View>
                    <View style={styles.logRow}>
                      <Text style={styles.logLabel}>Preis/Liter:</Text>
                      <Text style={styles.logValue}>{pricePerLiter.toFixed(3)} €</Text>
                    </View>
                    {consumption && (
                      <View style={styles.logRow}>
                        <Text style={styles.logLabel}>Verbrauch:</Text>
                        <Text style={[styles.logValue, styles.consumptionValue]}>
                          {consumption.toFixed(1)} L/100km
                        </Text>
                      </View>
                    )}
                  </View>
                </Card>
              );
            })
          )}
        </View>
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
  inputRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  inputHalf: {
    flex: 1,
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
  statsCard: {
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 16,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  historySection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    fontSize: 16,
    padding: 20,
  },
  logCard: {
    marginBottom: 12,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  logLocation: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  logDate: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  logDetails: {
    gap: 8,
  },
  logRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  logValue: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  consumptionValue: {
    color: COLORS.primary,
    fontWeight: '600',
  },
});