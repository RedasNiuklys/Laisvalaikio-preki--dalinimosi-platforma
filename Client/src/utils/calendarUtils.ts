import { format } from "date-fns";
import { Booking } from "../types/Booking";

export type CalendarMode =
  | "android_google"
  | "ios_google"
  | "ios_microsoft"
  | "ios_generic"
  | "web_google"
  | "web_microsoft"
  | "web_both";

export interface CalendarEventInput {
  title: string;
  startDate: Date;
  endDate: Date;
  notes: string;
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

export function buildEventDetails(
  booking: Booking,
  equipmentName: string
): CalendarEventInput {
  return {
    title: `Booking: ${equipmentName}`,
    startDate: new Date(booking.startDateTime),
    endDate: new Date(booking.endDateTime),
    notes: booking.notes ?? "",
  };
}

export function buildGoogleCalendarUrl(event: CalendarEventInput): string {
  const fmt = (d: Date) => format(d, "yyyyMMdd'T'HHmmss'Z'");
  const dates = `${fmt(event.startDate)}/${fmt(event.endDate)}`;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates,
    details: event.notes,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function buildOutlookCalendarUrl(event: CalendarEventInput): string {
  const params = new URLSearchParams({
    subject: event.title,
    startdt: event.startDate.toISOString(),
    enddt: event.endDate.toISOString(),
    body: event.notes,
    path: "/calendar/action/compose",
  });
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}
