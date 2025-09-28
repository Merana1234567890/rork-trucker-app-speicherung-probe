import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  SafeAreaView,
  Share,
  Platform,
} from 'react-native';
import { Stack } from 'expo-router';
import { useTruckerData } from '@/hooks/useTruckerData';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { COLORS } from '@/constants/colors';
import { DriveTimer, PauseBlock } from '@/types';


export default function DriveTimesScreen() {
  const { driveTimers, updateDriveTimer, startDriveTimer, trips, vehicles } = useTruckerData();
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const currentTrip = trips.find(trip => !trip.end_datetime);
  const activeDriveTimer = driveTimers.find(timer => timer.is_active);

  // Update current time every second for real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (minutes: number, showSeconds: boolean = false) => {
    if (minutes === 0 && showSeconds) {
      return '0h 00m 00s';
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins.toString().padStart(2, '0')}m`;
  };

  const formatTimeWithSeconds = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
  };

  const calculateDrivingTime = (timer: DriveTimer) => {
    const startTime = new Date(timer.start_time);
    const endTime = timer.end_time ? new Date(timer.end_time) : currentTime;
    const totalMinutes = Math.floor((endTime.getTime() - startTime.getTime()) / (1000 * 60));
    
    // Calculate pause minutes including active pause
    let pauseMinutes = 0;
    timer.pauses.forEach(pause => {
      if (pause.end) {
        // Use stored duration for completed pauses
        pauseMinutes += pause.duration_minutes;
      } else {
        // Active pause - calculate current duration in real-time
        const pauseStart = new Date(pause.start);
        const pauseDuration = Math.floor((currentTime.getTime() - pauseStart.getTime()) / (1000 * 60));
        pauseMinutes += Math.max(0, pauseDuration); // Ensure non-negative
      }
    });
    
    const drivingTime = Math.max(0, totalMinutes - pauseMinutes);
    
    // Enhanced logging for debugging
    console.log('Driving time calculation:', {
      timerId: timer.id,
      totalMinutes,
      pauseMinutes,
      drivingTime,
      activePauses: timer.pauses.filter(p => !p.end).length,
      completedPauses: timer.pauses.filter(p => p.end).length,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      currentTime: currentTime.toISOString()
    });
    
    return drivingTime;
  };

  const calculateNextPauseTime = (timer: DriveTimer) => {
    const drivingMinutes = calculateDrivingTime(timer);
    
    if (timer.pause_variant === 'B') {
      // Variant B: First break after 3:15h (195 minutes), then after 4:30h total
      const completedPauses = timer.pauses.filter(pause => pause.end);
      
      if (completedPauses.length === 0) {
        // No pauses yet - first break at 3:15h
        return Math.max(0, 195 - drivingMinutes);
      } else if (completedPauses.length === 1) {
        // One pause completed - second break at 4:30h total
        return Math.max(0, 270 - drivingMinutes);
      } else {
        // Both pauses completed - next break at 4:30h from last break
        return Math.max(0, 270 - drivingMinutes);
      }
    } else {
      // Variant A: Break after 4:30h (270 minutes)
      return Math.max(0, 270 - drivingMinutes);
    }
  };

  const validatePauses = (timer: DriveTimer) => {
    const completedPauses = timer.pauses.filter(pause => pause.end);
    
    if (timer.pause_variant === 'A') {
      // Variant A: One pause of at least 45 minutes
      return completedPauses.some(pause => pause.duration_minutes >= 45);
    } else {
      // Variant B: First pause ≥15min, then second pause ≥30min (in this order)
      if (completedPauses.length < 2) return false;
      
      const firstPause = completedPauses[0];
      const secondPause = completedPauses[1];
      
      return firstPause.duration_minutes >= 15 && secondPause.duration_minutes >= 30;
    }
  };

  const handleStartDrive = (pauseVariant: 'A' | 'B') => {
    if (!currentTrip) {
      Alert.alert('Fehler', 'Keine aktive Fahrt. Bitte starten Sie zuerst eine Fahrt im Dashboard.');
      return;
    }

    startDriveTimer(currentTrip.id, pauseVariant);
    Alert.alert('Erfolg', 'Lenkzeit gestartet!');
  };

  const handleStartPause = () => {
    if (!activeDriveTimer) {
      Alert.alert('Fehler', 'Keine aktive Lenkzeit gefunden.');
      return;
    }

    // Check if there's already an active pause
    const hasActivePause = activeDriveTimer.pauses.some(pause => !pause.end);
    if (hasActivePause) {
      Alert.alert('Fehler', 'Es läuft bereits eine Pause.');
      return;
    }

    const pauseStartTime = new Date().toISOString();
    const newPause: PauseBlock = {
      start: pauseStartTime,
      duration_minutes: 0, // Will be calculated when pause ends
    };

    const updatedPauses = [...activeDriveTimer.pauses, newPause];
    console.log('Starting pause:', {
      pauseId: updatedPauses.length,
      startTime: pauseStartTime,
      timerId: activeDriveTimer.id
    });
    
    updateDriveTimer(activeDriveTimer.id, { pauses: updatedPauses });
    Alert.alert('Pause gestartet', 'Pausenzeit läuft. Die Lenkzeit wird pausiert.');
  };

  const handleEndPause = () => {
    if (!activeDriveTimer) {
      Alert.alert('Fehler', 'Keine aktive Lenkzeit gefunden.');
      return;
    }

    // Find the active pause (one without end time)
    const activePauseIndex = activeDriveTimer.pauses.findIndex(pause => !pause.end);
    if (activePauseIndex === -1) {
      Alert.alert('Fehler', 'Keine aktive Pause gefunden.');
      return;
    }

    const activePause = activeDriveTimer.pauses[activePauseIndex];
    const endTime = new Date().toISOString();
    const startTime = new Date(activePause.start);
    const duration = Math.floor((new Date(endTime).getTime() - startTime.getTime()) / (1000 * 60));
    const finalDuration = Math.max(1, duration); // Minimum 1 minute

    const updatedPause: PauseBlock = {
      ...activePause,
      end: endTime,
      duration_minutes: finalDuration,
    };

    const updatedPauses = [...activeDriveTimer.pauses];
    updatedPauses[activePauseIndex] = updatedPause;

    console.log('Ending pause:', {
      pauseIndex: activePauseIndex,
      duration: finalDuration,
      startTime: activePause.start,
      endTime,
      timerId: activeDriveTimer.id
    });

    // Update the timer with the completed pause
    updateDriveTimer(activeDriveTimer.id, { pauses: updatedPauses });
    Alert.alert('Pause beendet', `Pausendauer: ${formatTime(finalDuration)}. Lenkzeit läuft wieder.`);
  };

  const handleEndDrive = () => {
    if (!activeDriveTimer) return;

    // End any active pause first
    const lastPause = activeDriveTimer.pauses[activeDriveTimer.pauses.length - 1];
    let finalPauses = activeDriveTimer.pauses;

    if (lastPause && !lastPause.end) {
      const endTime = new Date().toISOString();
      const startTime = new Date(lastPause.start);
      const duration = Math.floor((new Date(endTime).getTime() - startTime.getTime()) / (1000 * 60));

      const updatedPause = {
        ...lastPause,
        end: endTime,
        duration_minutes: Math.max(1, duration),
      };

      finalPauses = [
        ...activeDriveTimer.pauses.slice(0, -1),
        updatedPause,
      ];
    }

    const finalDrivingTime = calculateDrivingTime({
      ...activeDriveTimer,
      pauses: finalPauses,
    });

    updateDriveTimer(activeDriveTimer.id, {
      end_time: new Date().toISOString(),
      is_active: false,
      pauses: finalPauses,
      gefahrene_min_heute: finalDrivingTime,
    });

    Alert.alert('Fahrt beendet', `Gesamte Lenkzeit: ${formatTime(finalDrivingTime)}`);
  };

  const isInPause = activeDriveTimer?.pauses.some(pause => !pause.end) || false;
  const activePause = activeDriveTimer?.pauses.find(pause => !pause.end);
  
  // Calculate current pause duration if in pause
  const currentPauseDuration = activePause ? 
    Math.floor((currentTime.getTime() - new Date(activePause.start).getTime()) / (1000 * 60)) : 0;
  const drivingTime = activeDriveTimer ? calculateDrivingTime(activeDriveTimer) : 0;
  const nextPauseTime = activeDriveTimer ? calculateNextPauseTime(activeDriveTimer) : 270;
  const pausesValid = activeDriveTimer ? validatePauses(activeDriveTimer) : false;

  // Check if pause reminder should be shown (15 minutes before limit)
  const shouldShowPauseReminder = nextPauseTime <= 15 && nextPauseTime > 0 && !isInPause;

  // CFS Export function
  const handleCFSExport = async () => {
    // Allow export of any drive timer, not just active ones
    const timerToExport = activeDriveTimer || driveTimers[driveTimers.length - 1];
    
    if (!timerToExport) {
      Alert.alert('Fehler', 'Keine Lenkzeit zum Exportieren gefunden.');
      return;
    }

    try {
      console.log('Exporting CFS data for timer:', timerToExport.id);
      const cfsData = generateCFSData(timerToExport);
      console.log('Generated CFS data:', cfsData);
      
      if (Platform.OS === 'web') {
        // Web: Download as file
        const blob = new Blob([cfsData], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `lenkzeiten_${new Date().toISOString().split('T')[0]}.cfs`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        Alert.alert('Erfolg', 'CFS-Datei wurde heruntergeladen.');
      } else {
        // Mobile: Share
        const result = await Share.share({
          message: cfsData,
          title: 'Lenkzeiten CFS Export',
        });
        console.log('Share result:', result);
        
        if (result.action === Share.sharedAction) {
          Alert.alert('Erfolg', 'CFS-Daten wurden geteilt.');
        }
      }
    } catch (error) {
      console.error('CFS Export Error:', error);
      Alert.alert('Fehler', `Export fehlgeschlagen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
    }
  };

  const generateCFSData = (timer: DriveTimer): string => {
    const startDate = new Date(timer.start_time);
    const endDate = timer.end_time ? new Date(timer.end_time) : new Date();
    const currentTrip = trips.find(t => t.id === timer.trip_id);
    const vehicle = vehicles.find(v => v.id === currentTrip?.vehicle_id);
    
    // Calculate current pause duration for active pauses
    const activePause = timer.pauses.find(pause => !pause.end);
    const currentActivePauseDuration = activePause ? 
      Math.floor((currentTime.getTime() - new Date(activePause.start).getTime()) / (1000 * 60)) : 0;
    
    let cfsContent = '';
    cfsContent += `# CFS Lenkzeiten Export\n`;
    cfsContent += `# Datum: ${startDate.toLocaleDateString('de-DE')}\n`;
    cfsContent += `# Fahrzeug: ${vehicle?.kennzeichen || 'Unbekannt'}\n`;
    cfsContent += `# Fahrer: Trucker App\n`;
    cfsContent += `\n`;
    
    // Lenkzeit Block
    cfsContent += `[DRIVING]\n`;
    cfsContent += `START=${startDate.toISOString()}\n`;
    cfsContent += `END=${endDate.toISOString()}\n`;
    cfsContent += `VARIANT=${timer.pause_variant}\n`;
    cfsContent += `TOTAL_MINUTES=${calculateDrivingTime(timer)}\n`;
    cfsContent += `DAILY_LIMIT=540\n`; // 9 hours
    cfsContent += `WEEKLY_LIMIT=3360\n`; // 56 hours
    cfsContent += `STATUS=${timer.is_active ? 'ACTIVE' : 'COMPLETED'}\n`;
    cfsContent += `\n`;
    
    // Pausen
    if (timer.pauses.length > 0) {
      cfsContent += `[BREAKS]\n`;
      timer.pauses.forEach((pause, index) => {
        cfsContent += `BREAK_${index + 1}_START=${pause.start}\n`;
        if (pause.end) {
          cfsContent += `BREAK_${index + 1}_END=${pause.end}\n`;
          cfsContent += `BREAK_${index + 1}_DURATION=${pause.duration_minutes}\n`;
        } else {
          cfsContent += `BREAK_${index + 1}_END=ACTIVE\n`;
          cfsContent += `BREAK_${index + 1}_DURATION=${currentActivePauseDuration}\n`;
        }
      });
      cfsContent += `TOTAL_BREAKS=${timer.pauses.length}\n`;
      cfsContent += `\n`;
    }
    
    // Validation
    cfsContent += `[VALIDATION]\n`;
    cfsContent += `PAUSES_VALID=${validatePauses(timer)}\n`;
    cfsContent += `NEXT_BREAK_IN=${calculateNextPauseTime(timer)}\n`;
    cfsContent += `EXPORT_TIME=${new Date().toISOString()}\n`;
    cfsContent += `APP_VERSION=Trucker_App_v1.0\n`;
    
    return cfsContent;
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Lenk- & Ruhezeiten' }} />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Current Status */}
        <Card style={styles.statusCard}>
          <Text style={styles.cardTitle}>Aktueller Status</Text>
          
          {activeDriveTimer ? (
            <>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Lenkzeit heute:</Text>
                <Text style={styles.statusValue}>
                  {drivingTime === 0 ? formatTimeWithSeconds(0) : formatTime(drivingTime)}
                </Text>
              </View>
              
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Nächste Pause in:</Text>
                <Text style={[
                  styles.statusValue,
                  { color: nextPauseTime <= 30 ? COLORS.danger : COLORS.text }
                ]}>
                  {formatTime(nextPauseTime)}
                </Text>
              </View>

              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Pausenregel:</Text>
                <Text style={styles.statusValue}>
                  Variante {activeDriveTimer.pause_variant} 
                  {activeDriveTimer.pause_variant === 'A' ? ' (45 min)' : ' (15+30 min)'}
                </Text>
              </View>

              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Pausen gültig:</Text>
                <StatusBadge 
                  status={pausesValid ? 'success' : 'warning'} 
                  text={pausesValid ? 'Ja' : 'Nein'} 
                />
              </View>

              {isInPause ? (
                <View>
                  <StatusBadge status="warning" text={`In Pause (${formatTime(currentPauseDuration)})`} />
                </View>
              ) : (
                <StatusBadge status="active" text="Fahrt aktiv" />
              )}

              {shouldShowPauseReminder && (
                <View style={styles.reminderCard}>
                  <Text style={styles.reminderText}>
                    ⚠️ Pause einlegen – Lenkzeitgrenze erreicht!
                  </Text>
                </View>
              )}
            </>
          ) : (
            <StatusBadge status="inactive" text="Keine aktive Lenkzeit" />
          )}
        </Card>

        {/* Controls */}
        <Card style={styles.controlsCard}>
          <Text style={styles.cardTitle}>Steuerung</Text>
          
          {!activeDriveTimer ? (
            <View style={styles.startOptions}>
              <Text style={styles.optionsTitle}>Pausenregel wählen:</Text>
              
              <Button
                title="Variante A (45 min Pause)"
                onPress={() => handleStartDrive('A')}
                variant="primary"
                size="large"
                style={styles.startButton}
                testID="start-drive-variant-a"
              />
              
              <Button
                title="Variante B (15+30 min Pausen)"
                onPress={() => handleStartDrive('B')}
                variant="secondary"
                size="large"
                style={styles.startButton}
                testID="start-drive-variant-b"
              />
            </View>
          ) : (
            <View style={styles.activeControls}>
              {!isInPause ? (
                <Button
                  title="Pause starten"
                  onPress={handleStartPause}
                  variant="warning"
                  size="large"
                  style={styles.controlButton}
                  testID="start-pause-button"
                />
              ) : (
                <Button
                  title="Pause beenden"
                  onPress={handleEndPause}
                  variant="success"
                  size="large"
                  style={styles.controlButton}
                  testID="end-pause-button"
                />
              )}
              
              <Button
                title="Fahrt beenden"
                onPress={handleEndDrive}
                variant="danger"
                size="large"
                style={styles.controlButton}
                testID="end-drive-button"
              />
              
              <Button
                title="CFS Export"
                onPress={handleCFSExport}
                variant="secondary"
                size="large"
                style={styles.controlButton}
                testID="cfs-export-button"
              />
            </View>
          )}
        </Card>

        {/* Pause History */}
        {activeDriveTimer && activeDriveTimer.pauses.length > 0 && (
          <Card style={styles.pauseHistoryCard}>
            <Text style={styles.cardTitle}>Pausen heute</Text>
            
            {activeDriveTimer.pauses.map((pause, index) => (
              <View key={index} style={styles.pauseItem}>
                <View style={styles.pauseHeader}>
                  <Text style={styles.pauseNumber}>Pause {index + 1}</Text>
                  <StatusBadge 
                    status={pause.end ? 'success' : 'active'} 
                    text={pause.end ? 'Beendet' : 'Aktiv'} 
                  />
                </View>
                
                <View style={styles.pauseDetails}>
                  <Text style={styles.pauseTime}>
                    Start: {new Date(pause.start).toLocaleTimeString('de-DE', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </Text>
                  
                  {pause.end && (
                    <>
                      <Text style={styles.pauseTime}>
                        Ende: {new Date(pause.end).toLocaleTimeString('de-DE', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </Text>
                      <Text style={styles.pauseDuration}>
                        Dauer: {formatTime(pause.duration_minutes)}
                      </Text>
                    </>
                  )}
                </View>
              </View>
            ))}
          </Card>
        )}

        {/* EU Regulations Info */}
        <Card style={styles.infoCard}>
          <Text style={styles.cardTitle}>EU-Vorschriften (VO 561/2006)</Text>
          
          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>Lenkzeiten:</Text>
            <Text style={styles.infoText}>• Max. 4,5h ohne Pause</Text>
            <Text style={styles.infoText}>• Max. 9h täglich (2x/Woche 10h)</Text>
            <Text style={styles.infoText}>• Max. 56h wöchentlich</Text>
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>Pausenregeln:</Text>
            <Text style={styles.infoText}>• Variante A: 45 Minuten am Stück</Text>
            <Text style={styles.infoText}>• Variante B: Nach 3:15h → 15 min, dann nach 1:15h → 30 min</Text>
          </View>
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
  statusCard: {
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  reminderCard: {
    backgroundColor: COLORS.warning,
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  reminderText: {
    color: COLORS.white,
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 16,
  },
  controlsCard: {
    marginBottom: 24,
  },
  startOptions: {
    gap: 16,
  },
  optionsTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 8,
  },
  startButton: {
    marginBottom: 8,
  },
  activeControls: {
    gap: 12,
  },
  controlButton: {
    marginBottom: 8,
  },
  pauseHistoryCard: {
    marginBottom: 24,
  },
  pauseItem: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 12,
    marginBottom: 12,
  },
  pauseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  pauseNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  pauseDetails: {
    gap: 4,
  },
  pauseTime: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  pauseDuration: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  infoCard: {
    marginBottom: 24,
  },
  infoSection: {
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
});