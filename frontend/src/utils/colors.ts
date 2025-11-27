/**
 * Google Calendar color definitions
 * These are the 11 predefined colors available in Google Calendar API
 */

export interface GoogleCalendarColor {
  id: string;
  name: string;
  hex: string;
}

export const GOOGLE_CALENDAR_COLORS: readonly GoogleCalendarColor[] = [
  { id: "1", name: "Lavender", hex: "#7986cb" },
  { id: "2", name: "Sage", hex: "#33b679" },
  { id: "3", name: "Grape", hex: "#8e24aa" },
  { id: "4", name: "Flamingo", hex: "#e67c73" },
  { id: "5", name: "Banana", hex: "#f6bf26" },
  { id: "6", name: "Tangerine", hex: "#f4511e" },
  { id: "7", name: "Peacock", hex: "#039be5" },
  { id: "8", name: "Graphite", hex: "#616161" },
  { id: "9", name: "Blueberry", hex: "#3f51b5" },
  { id: "10", name: "Basil", hex: "#0b8043" },
  { id: "11", name: "Tomato", hex: "#d50000" },
] as const;

/**
 * Get a Google Calendar color by its ID
 */
export function getColorById(id: string): GoogleCalendarColor | undefined {
  return GOOGLE_CALENDAR_COLORS.find(color => color.id === id);
}

/**
 * Get the hex value for a color ID
 */
export function getColorHex(id: string): string {
  const color = getColorById(id);
  return color?.hex ?? GOOGLE_CALENDAR_COLORS[0].hex;
}
