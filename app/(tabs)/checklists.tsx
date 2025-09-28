import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
} from 'react-native';
import { Stack } from 'expo-router';
import { CheckSquare, Square, FileText } from 'lucide-react-native';
import { useTruckerData } from '@/hooks/useTruckerData';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { COLORS } from '@/constants/colors';
import { VORFAHRT_CHECKLIST, NACHFAHRT_CHECKLIST } from '@/constants/checklists';
import { ChecklistItem, ChecklistRun } from '@/types';

export default function ChecklistsScreen() {
  const { checklistRuns, addChecklistRun, trips } = useTruckerData();
  const [activeChecklist, setActiveChecklist] = useState<'Vorfahrt' | 'Nachfahrt' | null>(null);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);

  const currentTrip = trips.find(trip => !trip.end_datetime);

  const startChecklist = (type: 'Vorfahrt' | 'Nachfahrt') => {
    if (!currentTrip) {
      Alert.alert('Fehler', 'Keine aktive Fahrt. Bitte starten Sie zuerst eine Fahrt im Dashboard.');
      return;
    }

    const items = type === 'Vorfahrt' ? VORFAHRT_CHECKLIST : NACHFAHRT_CHECKLIST;
    setActiveChecklist(type);
    setChecklistItems([...items]);
  };

  const toggleChecklistItem = (itemId: number) => {
    setChecklistItems(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const saveChecklist = () => {
    if (!activeChecklist || !currentTrip) return;

    const checklistRun: Omit<ChecklistRun, 'id'> = {
      checklist_id: activeChecklist,
      trip_id: currentTrip.id,
      datum: new Date().toISOString(),
      type: activeChecklist,
      items: checklistItems,
    };

    addChecklistRun(checklistRun);
    
    const completedCount = checklistItems.filter(item => item.completed).length;
    Alert.alert(
      'Checkliste gespeichert',
      `${completedCount} von ${checklistItems.length} Punkten abgehakt.`,
      [
        {
          text: 'OK',
          onPress: () => {
            setActiveChecklist(null);
            setChecklistItems([]);
          },
        },
      ]
    );
  };

  const cancelChecklist = () => {
    Alert.alert(
      'Checkliste abbrechen',
      'Möchten Sie die Checkliste wirklich abbrechen? Alle Eingaben gehen verloren.',
      [
        { text: 'Nein', style: 'cancel' },
        {
          text: 'Ja',
          style: 'destructive',
          onPress: () => {
            setActiveChecklist(null);
            setChecklistItems([]);
          },
        },
      ]
    );
  };

  const exportToPDF = (run: ChecklistRun) => {
    // In a real app, this would generate and share a PDF
    Alert.alert(
      'PDF Export',
      `Checkliste "${run.type}" vom ${new Date(run.datum).toLocaleDateString('de-DE')} würde als PDF exportiert.`,
      [
        { text: 'OK' }
      ]
    );
  };

  const getTodaysChecklists = () => {
    const today = new Date().toISOString().split('T')[0];
    return checklistRuns.filter(run => run.datum.startsWith(today));
  };

  const getRecentChecklists = () => {
    return [...checklistRuns]
      .sort((a, b) => new Date(b.datum).getTime() - new Date(a.datum).getTime())
      .slice(0, 10);
  };

  const todaysChecklists = getTodaysChecklists();
  const recentChecklists = getRecentChecklists();

  if (activeChecklist) {
    const completedCount = checklistItems.filter(item => item.completed).length;
    const progress = (completedCount / checklistItems.length) * 100;

    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: `Checkliste ${activeChecklist}` }} />
        
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Progress */}
          <Card style={styles.progressCard}>
            <Text style={styles.cardTitle}>Fortschritt</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {completedCount} von {checklistItems.length} Punkten ({Math.round(progress)}%)
            </Text>
          </Card>

          {/* Checklist Items */}
          <Card style={styles.checklistCard}>
            <Text style={styles.cardTitle}>Checkliste {activeChecklist}</Text>
            
            {checklistItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.checklistItem}
                onPress={() => toggleChecklistItem(item.id)}
                testID={`checklist-item-${item.id}`}
              >
                <View style={styles.checklistItemContent}>
                  {item.completed ? (
                    <CheckSquare size={24} color={COLORS.success} />
                  ) : (
                    <Square size={24} color={COLORS.gray400} />
                  )}
                  <Text style={[
                    styles.checklistItemText,
                    item.completed && styles.checklistItemCompleted
                  ]}>
                    {item.text}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </Card>

          {/* Actions */}
          <View style={styles.actionsContainer}>
            <Button
              title="Checkliste speichern"
              onPress={saveChecklist}
              variant="success"
              size="large"
              testID="save-checklist-button"
            />
            
            <Button
              title="Abbrechen"
              onPress={cancelChecklist}
              variant="danger"
              size="medium"
              style={styles.cancelButton}
              testID="cancel-checklist-button"
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Checklisten' }} />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Start New Checklist */}
        <Card style={styles.startCard}>
          <Text style={styles.cardTitle}>Neue Checkliste starten</Text>
          
          <View style={styles.checklistOptions}>
            <TouchableOpacity
              style={styles.checklistOption}
              onPress={() => startChecklist('Vorfahrt')}
              testID="start-vorfahrt-checklist"
            >
              <CheckSquare size={32} color={COLORS.primary} />
              <Text style={styles.optionTitle}>Vorfahrt</Text>
              <Text style={styles.optionSubtitle}>10 Punkte vor Fahrtbeginn</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.checklistOption}
              onPress={() => startChecklist('Nachfahrt')}
              testID="start-nachfahrt-checklist"
            >
              <CheckSquare size={32} color={COLORS.secondary} />
              <Text style={styles.optionTitle}>Nachfahrt</Text>
              <Text style={styles.optionSubtitle}>10 Punkte nach Fahrtende</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Today's Checklists */}
        {todaysChecklists.length > 0 && (
          <Card style={styles.todayCard}>
            <Text style={styles.cardTitle}>Heute erledigt</Text>
            
            {todaysChecklists.map((run) => {
              const completedCount = run.items.filter(item => item.completed).length;
              const progress = (completedCount / run.items.length) * 100;
              
              return (
                <View key={run.id} style={styles.checklistSummary}>
                  <View style={styles.summaryHeader}>
                    <Text style={styles.summaryTitle}>{run.type}</Text>
                    <Text style={styles.summaryTime}>
                      {new Date(run.datum).toLocaleTimeString('de-DE', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </Text>
                  </View>
                  
                  <View style={styles.summaryProgress}>
                    <View style={styles.progressBar}>
                      <View style={[styles.progressFill, { width: `${progress}%` }]} />
                    </View>
                    <Text style={styles.summaryProgressText}>
                      {completedCount}/{run.items.length}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.exportButton}
                    onPress={() => exportToPDF(run)}
                  >
                    <FileText size={16} color={COLORS.primary} />
                    <Text style={styles.exportButtonText}>PDF Export</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </Card>
        )}

        {/* Recent Checklists */}
        {recentChecklists.length > 0 && (
          <Card style={styles.historyCard}>
            <Text style={styles.cardTitle}>Verlauf</Text>
            
            {recentChecklists.map((run) => {
              const completedCount = run.items.filter(item => item.completed).length;
              const progress = (completedCount / run.items.length) * 100;
              
              return (
                <View key={run.id} style={styles.historyItem}>
                  <View style={styles.historyHeader}>
                    <Text style={styles.historyTitle}>{run.type}</Text>
                    <Text style={styles.historyDate}>
                      {new Date(run.datum).toLocaleDateString('de-DE')}
                    </Text>
                  </View>
                  
                  <View style={styles.historyProgress}>
                    <View style={styles.progressBar}>
                      <View style={[styles.progressFill, { width: `${progress}%` }]} />
                    </View>
                    <Text style={styles.historyProgressText}>
                      {completedCount}/{run.items.length} ({Math.round(progress)}%)
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.exportButton}
                    onPress={() => exportToPDF(run)}
                  >
                    <FileText size={16} color={COLORS.primary} />
                    <Text style={styles.exportButtonText}>PDF</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </Card>
        )}

        {checklistRuns.length === 0 && (
          <Card>
            <Text style={styles.emptyText}>
              Noch keine Checklisten durchgeführt. Starten Sie Ihre erste Checkliste oben.
            </Text>
          </Card>
        )}
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
  startCard: {
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  checklistOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  checklistOption: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORS.gray100,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 8,
    marginBottom: 4,
  },
  optionSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  progressCard: {
    marginBottom: 24,
  },
  progressBar: {
    height: 8,
    backgroundColor: COLORS.gray200,
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.success,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  checklistCard: {
    marginBottom: 24,
  },
  checklistItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  checklistItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checklistItemText: {
    fontSize: 16,
    color: COLORS.text,
    flex: 1,
  },
  checklistItemCompleted: {
    textDecorationLine: 'line-through',
    color: COLORS.textSecondary,
  },
  actionsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  cancelButton: {
    marginTop: 8,
  },
  todayCard: {
    marginBottom: 24,
  },
  checklistSummary: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  summaryTime: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  summaryProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  summaryProgressText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    minWidth: 40,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
  },
  exportButtonText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },
  historyCard: {
    marginBottom: 24,
  },
  historyItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  historyDate: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  historyProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  historyProgressText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    minWidth: 60,
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    fontSize: 16,
    padding: 20,
  },
});