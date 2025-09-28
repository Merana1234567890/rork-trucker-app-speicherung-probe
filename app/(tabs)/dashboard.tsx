import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity 
} from 'react-native';
import { router } from 'expo-router';
import { 
  Fuel, 
  Clock, 
  CheckSquare, 
  Receipt,
  AlertCircle 
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTruckerData } from '@/hooks/useTruckerData';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { COLORS } from '@/constants/colors';

export default function DashboardScreen() {
  const { getDashboardStats, vehicles, startTrip, addVehicle } = useTruckerData();
  const insets = useSafeAreaInsets();
  const stats = getDashboardStats();

  const handleStartTrip = () => {
    console.log('Starting trip...');
    if (vehicles.length === 0) {
      // Create default vehicle if none exists
      const defaultVehicle = addVehicle({
        name: 'Mein LKW',
        kennzeichen: 'XX-XX-1234',
        tankvolumen_l: 400,
      });
      startTrip(defaultVehicle.id, 0);
    } else {
      // Use first vehicle for now - in real app, user would select
      startTrip(vehicles[0].id, 0);
    }
    console.log('Navigating to drive-times...');
    router.push('./drive-times');
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toFixed(2)} €`;
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Trucker Cockpit</Text>
          <Text style={styles.subtitle}>Willkommen zurück!</Text>
        </View>

        {/* Current Status */}
        <Card style={styles.statusCard}>
          <Text style={styles.cardTitle}>Aktueller Status</Text>
          <View style={styles.statusGrid}>
            <View style={styles.statusItem}>
              <Clock size={24} color={COLORS.primary} />
              <Text style={styles.statusLabel}>Gefahren heute</Text>
              <Text style={styles.statusValue}>{formatTime(stats.gefahrene_zeit_heute)}</Text>
            </View>
            <View style={styles.statusItem}>
              <AlertCircle size={24} color={stats.naechste_pause_in <= 30 ? COLORS.danger : COLORS.warning} />
              <Text style={styles.statusLabel}>Nächste Pause</Text>
              <Text style={[
                styles.statusValue,
                { color: stats.naechste_pause_in <= 30 ? COLORS.danger : COLORS.text }
              ]}>
                {formatTime(stats.naechste_pause_in)}
              </Text>
            </View>
            <View style={styles.statusItem}>
              <Receipt size={24} color={COLORS.secondary} />
              <Text style={styles.statusLabel}>Spesen heute</Text>
              <Text style={styles.statusValue}>{formatCurrency(stats.heutige_spesen)}</Text>
            </View>
          </View>
          
          {stats.current_trip ? (
            <StatusBadge status="active" text="Fahrt aktiv" />
          ) : (
            <StatusBadge status="inactive" text="Keine aktive Fahrt" />
          )}
        </Card>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Schnellzugriff</Text>
          
          {!stats.current_trip ? (
            <Button
              title="Fahrt starten"
              onPress={handleStartTrip}
              variant="success"
              size="large"
              style={styles.startTripButton}
              testID="start-trip-button"
            />
          ) : (
            <Button
              title="Fahrt beenden"
              onPress={() => router.push('./drive-times')}
              variant="danger"
              size="large"
              style={styles.startTripButton}
              testID="end-trip-button"
            />
          )}
        </View>

        {/* Main Features */}
        <View style={styles.featuresGrid}>
          <TouchableOpacity 
            style={styles.featureCard}
            onPress={() => {
              console.log('Navigating to fuel-log...');
              router.push('./fuel-log');
            }}
            testID="fuel-log-button"
          >
            <Fuel size={32} color={COLORS.primary} />
            <Text style={styles.featureTitle}>Tankbuch</Text>
            <Text style={styles.featureSubtitle}>Verbrauch & Kosten</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.featureCard}
            onPress={() => {
              console.log('Navigating to drive-times...');
              router.push('./drive-times');
            }}
            testID="drive-times-button"
          >
            <Clock size={32} color={COLORS.primary} />
            <Text style={styles.featureTitle}>Lenkzeiten</Text>
            <Text style={styles.featureSubtitle}>EU-Vorschriften</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.featureCard}
            onPress={() => {
              console.log('Navigating to checklists...');
              router.push('./checklists');
            }}
            testID="checklists-button"
          >
            <CheckSquare size={32} color={COLORS.primary} />
            <Text style={styles.featureTitle}>Checklisten</Text>
            <Text style={styles.featureSubtitle}>Vor- & Nachfahrt</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.featureCard}
            onPress={() => {
              console.log('Navigating to expenses...');
              router.push('./expenses');
            }}
            testID="expenses-button"
          >
            <Receipt size={32} color={COLORS.primary} />
            <Text style={styles.featureTitle}>Spesen</Text>
            <Text style={styles.featureSubtitle}>Abrechnung</Text>
          </TouchableOpacity>
        </View>

        {/* Last Fuel Stop */}
        {stats.letzter_tankstopp && (
          <Card style={styles.lastFuelCard}>
            <Text style={styles.cardTitle}>Letzter Tankstopp</Text>
            <View style={styles.fuelInfo}>
              <Text style={styles.fuelLocation}>{stats.letzter_tankstopp.ort}</Text>
              <Text style={styles.fuelAmount}>
                {stats.letzter_tankstopp.liter}L - {formatCurrency(stats.letzter_tankstopp.preis_total)}
              </Text>
              <Text style={styles.fuelDate}>
                {new Date(stats.letzter_tankstopp.datum).toLocaleDateString('de-DE')}
              </Text>
            </View>
          </Card>
        )}
      </ScrollView>
    </View>
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
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  statusCard: {
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  statusGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statusItem: {
    alignItems: 'center',
    flex: 1,
  },
  statusLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  statusValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  startTripButton: {
    marginBottom: 8,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  featureCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 20,
    width: '48%',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: COLORS.gray900,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 12,
    marginBottom: 4,
    textAlign: 'center',
  },
  featureSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  lastFuelCard: {
    marginBottom: 24,
  },
  fuelInfo: {
    gap: 4,
  },
  fuelLocation: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  fuelAmount: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  fuelDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
});