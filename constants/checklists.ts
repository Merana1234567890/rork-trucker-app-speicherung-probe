import { ChecklistItem } from '@/types';

export const VORFAHRT_CHECKLIST: ChecklistItem[] = [
  { id: 1, text: 'Reifen (Druck und Zustand)', completed: false },
  { id: 2, text: 'Bremsen', completed: false },
  { id: 3, text: 'Licht (Front- und Rücklichter, Blinker)', completed: false },
  { id: 4, text: 'Spiegel einstellen', completed: false },
  { id: 5, text: 'Scheibenwischer und Flüssigkeit', completed: false },
  { id: 6, text: 'Ladungssicherung prüfen', completed: false },
  { id: 7, text: 'Warnweste und Warndreieck im Fahrzeug', completed: false },
  { id: 8, text: 'HU/AU-Papiere vorhanden', completed: false },
  { id: 9, text: 'Tankfüllung prüfen', completed: false },
  { id: 10, text: 'Kontrollgang ums Fahrzeug machen', completed: false },
];

export const NACHFAHRT_CHECKLIST: ChecklistItem[] = [
  { id: 1, text: 'Motor ausschalten', completed: false },
  { id: 2, text: 'Licht ausschalten', completed: false },
  { id: 3, text: 'Handbremse anziehen', completed: false },
  { id: 4, text: 'Fahrzeug verriegeln', completed: false },
  { id: 5, text: 'Fahrerkabine sauber machen', completed: false },
  { id: 6, text: 'Rest-Tankstand notieren', completed: false },
  { id: 7, text: 'Spesen und Belege sichern', completed: false },
  { id: 8, text: 'Tachograf prüfen/auslesen', completed: false },
  { id: 9, text: 'Fahrzeug auf Schäden kontrollieren', completed: false },
  { id: 10, text: 'Ladungssicherung lösen', completed: false },
];

export const EXPENSE_CATEGORIES = ['Verpflegung', 'Maut', 'Parken', 'Sonstiges'] as const;