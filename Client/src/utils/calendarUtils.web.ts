export * from "./calendarUtils";

import { CalendarEventInput } from "./calendarUtils";

// expo-calendar is not available on web; this stub keeps imports safe
export async function addToDeviceCalendar(
  _event: CalendarEventInput,
  _preferGoogle: boolean
): Promise<"error"> {
  return "error";
}
export function resolveCalendarMode(
  platform: string,
  authProvider: string
): CalendarMode {
  if (platform === "android") return "android_google";
  if (platform === "web") {
    if (authProvider === "Google") return "web_google";
    if (authProvider === "Microsoft") return "web_microsoft";
    return "web_both";
  }
  // iOS
  if (authProvider === "Google") return "ios_google";
  if (authProvider === "Microsoft") return "ios_microsoft";
  return "ios_generic";
}
export type CalendarMode =
  | "android_google"
  | "ios_google"
  | "ios_microsoft"
  | "ios_generic"
  | "web_google"
  | "web_microsoft"
  | "web_both";
