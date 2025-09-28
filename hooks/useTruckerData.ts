import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useEffect, useState } from 'react';
import { 
  Vehicle, 
  Trip, 
  FuelLog, 
  Expense, 
  ChecklistRun, 
  DriveTimer, 
  DashboardStats 
} from '@/types';

const STORAGE_KEYS = {
  VEHICLES: 'trucker_vehicles',
  TRIPS: 'trucker_trips',
  FUEL_LOGS: 'trucker_fuel_logs',
  EXPENSES: 'trucker_expenses',
  CHECKLIST_RUNS: 'trucker_checklist_runs',
  DRIVE_TIMERS: 'trucker_drive_timers',
};

export const [TruckerDataProvider, useTruckerData] = createContextHook(() => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [checklistRuns, setChecklistRuns] = useState<ChecklistRun[]>([]);
  const [driveTimers, setDriveTimers] = useState<DriveTimer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load data from AsyncStorage
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [
        vehiclesData,
        tripsData,
        fuelLogsData,
        expensesData,
        checklistRunsData,
        driveTimersData,
      ] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.VEHICLES),
        AsyncStorage.getItem(STORAGE_KEYS.TRIPS),
        AsyncStorage.getItem(STORAGE_KEYS.FUEL_LOGS),
        AsyncStorage.getItem(STORAGE_KEYS.EXPENSES),
        AsyncStorage.getItem(STORAGE_KEYS.CHECKLIST_RUNS),
        AsyncStorage.getItem(STORAGE_KEYS.DRIVE_TIMERS),
      ]);

      setVehicles(vehiclesData ? JSON.parse(vehiclesData) : []);
      setTrips(tripsData ? JSON.parse(tripsData) : []);
      setFuelLogs(fuelLogsData ? JSON.parse(fuelLogsData) : []);
      setExpenses(expensesData ? JSON.parse(expensesData) : []);
      setChecklistRuns(checklistRunsData ? JSON.parse(checklistRunsData) : []);
      setDriveTimers(driveTimersData ? JSON.parse(driveTimersData) : []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save data to AsyncStorage
  const saveVehicles = useCallback(async (data: Vehicle[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(data));
      setVehicles(data);
    } catch (error) {
      console.error('Error saving vehicles:', error);
    }
  }, []);

  const saveTrips = useCallback(async (data: Trip[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.TRIPS, JSON.stringify(data));
      setTrips(data);
    } catch (error) {
      console.error('Error saving trips:', error);
    }
  }, []);

  const saveFuelLogs = useCallback(async (data: FuelLog[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.FUEL_LOGS, JSON.stringify(data));
      setFuelLogs(data);
    } catch (error) {
      console.error('Error saving fuel logs:', error);
    }
  }, []);

  const saveExpenses = useCallback(async (data: Expense[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(data));
      setExpenses(data);
    } catch (error) {
      console.error('Error saving expenses:', error);
    }
  }, []);

  const saveChecklistRuns = useCallback(async (data: ChecklistRun[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CHECKLIST_RUNS, JSON.stringify(data));
      setChecklistRuns(data);
    } catch (error) {
      console.error('Error saving checklist runs:', error);
    }
  }, []);

  const saveDriveTimers = useCallback(async (data: DriveTimer[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.DRIVE_TIMERS, JSON.stringify(data));
      setDriveTimers(data);
    } catch (error) {
      console.error('Error saving drive timers:', error);
    }
  }, []);

  // Helper functions
  const addVehicle = useCallback((vehicle: Omit<Vehicle, 'id'>) => {
    const newVehicle: Vehicle = {
      ...vehicle,
      id: Date.now().toString(),
    };
    const updatedVehicles = [...vehicles, newVehicle];
    saveVehicles(updatedVehicles);
    return newVehicle;
  }, [vehicles, saveVehicles]);

  const startTrip = useCallback((vehicle_id: string, start_km: number) => {
    const newTrip: Trip = {
      id: Date.now().toString(),
      vehicle_id,
      start_datetime: new Date().toISOString(),
      start_km,
    };
    const updatedTrips = [...trips, newTrip];
    saveTrips(updatedTrips);
    return newTrip;
  }, [trips, saveTrips]);

  const endTrip = useCallback((trip_id: string, end_km: number) => {
    const updatedTrips = trips.map(trip => 
      trip.id === trip_id 
        ? { ...trip, end_datetime: new Date().toISOString(), end_km }
        : trip
    );
    saveTrips(updatedTrips);
  }, [trips, saveTrips]);

  const addFuelLog = useCallback((fuelLog: Omit<FuelLog, 'id'>) => {
    const newFuelLog: FuelLog = {
      ...fuelLog,
      id: Date.now().toString(),
    };
    const updatedFuelLogs = [...fuelLogs, newFuelLog];
    saveFuelLogs(updatedFuelLogs);
    return newFuelLog;
  }, [fuelLogs, saveFuelLogs]);

  const addExpense = useCallback((expense: Omit<Expense, 'id'>) => {
    const newExpense: Expense = {
      ...expense,
      id: Date.now().toString(),
    };
    const updatedExpenses = [...expenses, newExpense];
    saveExpenses(updatedExpenses);
    return newExpense;
  }, [expenses, saveExpenses]);

  const addChecklistRun = useCallback((checklistRun: Omit<ChecklistRun, 'id'>) => {
    const newChecklistRun: ChecklistRun = {
      ...checklistRun,
      id: Date.now().toString(),
    };
    const updatedChecklistRuns = [...checklistRuns, newChecklistRun];
    saveChecklistRuns(updatedChecklistRuns);
    return newChecklistRun;
  }, [checklistRuns, saveChecklistRuns]);

  const startDriveTimer = useCallback((trip_id: string, pause_variant: 'A' | 'B') => {
    const newDriveTimer: DriveTimer = {
      id: Date.now().toString(),
      trip_id,
      start_time: new Date().toISOString(),
      pauses: [],
      pause_variant,
      gefahrene_min_heute: 0,
      gefahrene_min_woche: 0,
      is_active: true,
    };
    const updatedDriveTimers = [...driveTimers, newDriveTimer];
    saveDriveTimers(updatedDriveTimers);
    return newDriveTimer;
  }, [driveTimers, saveDriveTimers]);

  const updateDriveTimer = useCallback((timer_id: string, updates: Partial<DriveTimer>) => {
    const updatedDriveTimers = driveTimers.map(timer =>
      timer.id === timer_id ? { ...timer, ...updates } : timer
    );
    saveDriveTimers(updatedDriveTimers);
  }, [driveTimers, saveDriveTimers]);

  // Dashboard stats calculation
  const getDashboardStats = useCallback((): DashboardStats => {
    const currentTrip = trips.find(trip => !trip.end_datetime);
    const activeDriveTimer = driveTimers.find(timer => timer.is_active);
    
    const today = new Date().toISOString().split('T')[0];
    const todayExpenses = expenses
      .filter(expense => expense.datum.startsWith(today))
      .reduce((sum, expense) => sum + expense.betrag, 0);

    const lastFuelLog = fuelLogs
      .sort((a, b) => new Date(b.datum).getTime() - new Date(a.datum).getTime())[0];

    let gefahrene_zeit_heute = 0;
    let naechste_pause_in = 270; // 4.5 hours in minutes
    let pause_variant: 'A' | 'B' = 'A';

    if (activeDriveTimer) {
      const startTime = new Date(activeDriveTimer.start_time);
      const now = new Date();
      const totalMinutes = Math.floor((now.getTime() - startTime.getTime()) / (1000 * 60));
      
      // Calculate pause minutes including active pause
      let pauseMinutes = 0;
      activeDriveTimer.pauses.forEach(pause => {
        if (pause.end) {
          // Use stored duration for completed pauses
          pauseMinutes += pause.duration_minutes;
        } else {
          // Active pause - calculate current duration in real-time
          const pauseStart = new Date(pause.start);
          const pauseDuration = Math.floor((now.getTime() - pauseStart.getTime()) / (1000 * 60));
          pauseMinutes += Math.max(0, pauseDuration); // Ensure non-negative
        }
      });
      
      gefahrene_zeit_heute = Math.max(0, totalMinutes - pauseMinutes);
      naechste_pause_in = Math.max(0, 270 - gefahrene_zeit_heute);
      pause_variant = activeDriveTimer.pause_variant;
      
      console.log('Dashboard stats calculation:', {
        timerId: activeDriveTimer.id,
        totalMinutes,
        pauseMinutes,
        gefahrene_zeit_heute,
        naechste_pause_in,
        activePauses: activeDriveTimer.pauses.filter(p => !p.end).length,
        completedPauses: activeDriveTimer.pauses.filter(p => p.end).length,
        startTime: startTime.toISOString(),
        currentTime: now.toISOString()
      });
    }

    return {
      current_trip: currentTrip,
      gefahrene_zeit_heute,
      naechste_pause_in,
      letzter_tankstopp: lastFuelLog,
      heutige_spesen: todayExpenses,
      pause_variant,
    };
  }, [trips, driveTimers, expenses, fuelLogs]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    // Data
    vehicles,
    trips,
    fuelLogs,
    expenses,
    checklistRuns,
    driveTimers,
    isLoading,
    
    // Actions
    addVehicle,
    startTrip,
    endTrip,
    addFuelLog,
    addExpense,
    addChecklistRun,
    startDriveTimer,
    updateDriveTimer,
    
    // Computed
    getDashboardStats,
    
    // Raw save functions for advanced use
    saveVehicles,
    saveTrips,
    saveFuelLogs,
    saveExpenses,
    saveChecklistRuns,
    saveDriveTimers,
  };
});