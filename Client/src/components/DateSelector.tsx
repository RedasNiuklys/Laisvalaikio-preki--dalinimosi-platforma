import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet, Platform, Pressable } from "react-native";
import { Text, useTheme, Button, List } from "react-native-paper";
import { Calendar, DateData } from "react-native-calendars";
import Toast from "react-native-toast-message";
import { getUsedDatesForEquipment } from "../api/usedDatesApi";
import { UsedDates } from "../types/UsedDates";
import { IconButton } from "react-native-paper";
import { useTranslation } from "react-i18next";
import { useSettings } from "../context/SettingsContext";

interface DateSelectorProps {
  equipmentId: string;
  onDateSelect: (startDate: Date, endDate: Date) => void;
}

interface MarkedDate {
  disabled?: boolean;
  disableTouchEvent?: boolean;
  selected?: boolean;
  startingDay?: boolean;
  endingDay?: boolean;
  color?: string;
  textColor?: string;
}

interface MarkedDates {
  [date: string]: MarkedDate;
}

export default function DateSelector({
  equipmentId,
  onDateSelect,
}: DateSelectorProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const { settings } = useSettings();
  const [blockedDates, setBlockedDates] = useState<UsedDates[]>([]); // Dates from server
  const [pastDates, setPastDates] = useState<UsedDates[]>([]); // Past dates as UsedDates
  const [sessionSelections, setSessionSelections] = useState<UsedDates[]>([]); // Current session selections
  const [currentSelection, setCurrentSelection] = useState<UsedDates | null>(
    null
  ); // Current active selection
  const [markedDates, setMarkedDates] = useState<MarkedDates>({});
  const sessionIdCounter = useRef(1);

  // Initialize past dates on first load
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const start = new Date(2020, 0, 1);
    const pastDateRange: UsedDates = {
      id: "past_dates",
      equipmentId,
      userId: "",
      startDate: start,
      endDate: today,
    };

    setPastDates([pastDateRange]);
    updateCalendarMarks(
      [pastDateRange],
      blockedDates,
      sessionSelections,
      currentSelection
    );
  }, []);

  useEffect(() => {
    fetchUsedDates();
  }, [equipmentId]);

  const fetchUsedDates = async () => {
    try {
      const dates = await getUsedDatesForEquipment(equipmentId);
      setBlockedDates(dates);
      updateCalendarMarks(
        pastDates,
        dates,
        sessionSelections,
        currentSelection
      );
    } catch (error) {
      console.error("Error fetching used dates:", error);
    }
  };

  const isDateInRange = (date: Date, range: UsedDates): boolean => {
    const start = new Date(range.startDate);
    const end = new Date(range.endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    return date >= start && date <= end;
  };

  const checkDateOverlap = (startDate: Date, endDate: Date): boolean => {
    const allRanges = [...blockedDates, ...sessionSelections];
    let hasOverlap = false;

    // First, create a copy of current marked dates for past and blocked dates
    const marked: MarkedDates = {};

    // Add past dates
    pastDates.forEach((range) => {
      const start = new Date(range.startDate);
      const end = new Date(range.endDate);
      for (
        let date = new Date(start);
        date <= end;
        date.setDate(date.getDate() + 1)
      ) {
        const dateString = date.toISOString().split("T")[0];
        marked[dateString] = {
          disabled: true,
          disableTouchEvent: true,
          color: theme.colors.surfaceDisabled,
          textColor: theme.colors.onSurfaceDisabled,
        };
      }
    });

    // Add blocked dates
    blockedDates.forEach((range) => {
      const start = new Date(range.startDate);
      const end = new Date(range.endDate);
      for (
        let date = new Date(start);
        date <= end;
        date.setDate(date.getDate() + 1)
      ) {
        const dateString = date.toISOString().split("T")[0];
        marked[dateString] = {
          disabled: true,
          disableTouchEvent: true,
          color: theme.colors.error,
          textColor: theme.colors.onError,
        };
      }
    });

    // Add existing selections
    sessionSelections.forEach((range) => {
      const start = new Date(range.startDate);
      const end = new Date(range.endDate);

      const startString = start.toISOString().split("T")[0];
      const endString = end.toISOString().split("T")[0];

      marked[startString] = {
        selected: true,
        startingDay: true,
        color: theme.colors.primary,
      };

      marked[endString] = {
        selected: true,
        endingDay: true,
        color: theme.colors.primary,
      };

      for (
        let date = new Date(start);
        date <= end;
        date.setDate(date.getDate() + 1)
      ) {
        const dateString = date.toISOString().split("T")[0];
        if (dateString !== startString && dateString !== endString) {
          marked[dateString] = {
            selected: true,
            color: theme.colors.primaryContainer,
          };
        }
      }
    });

    // Check for overlaps and mark the attempted selection
    const overlappingDates: { [key: string]: boolean } = {};

    for (const range of allRanges) {
      const rangeStart = new Date(range.startDate);
      const rangeEnd = new Date(range.endDate);

      if (
        (startDate >= rangeStart && startDate <= rangeEnd) ||
        (endDate >= rangeStart && endDate <= rangeEnd) ||
        (startDate <= rangeStart && endDate >= rangeEnd)
      ) {
        hasOverlap = true;

        // Mark overlapping dates
        for (
          let date = new Date(
            Math.max(startDate.getTime(), rangeStart.getTime())
          );
          date <= new Date(Math.min(endDate.getTime(), rangeEnd.getTime()));
          date.setDate(date.getDate() + 1)
        ) {
          overlappingDates[date.toISOString().split("T")[0]] = true;
        }
      }
    }

    // Mark the attempted selection
    const startString = startDate.toISOString().split("T")[0];
    const endString = endDate.toISOString().split("T")[0];

    // Mark start date
    marked[startString] = {
      selected: true,
      startingDay: true,
      color: overlappingDates[startString]
        ? theme.colors.error
        : theme.colors.primary,
    };

    // Mark end date
    marked[endString] = {
      selected: true,
      endingDay: true,
      color: overlappingDates[endString]
        ? theme.colors.error
        : theme.colors.primary,
    };

    // Mark days in between
    for (
      let date = new Date(startDate);
      date <= endDate;
      date.setDate(date.getDate() + 1)
    ) {
      const dateString = date.toISOString().split("T")[0];
      if (dateString !== startString && dateString !== endString) {
        marked[dateString] = {
          selected: true,
          color: overlappingDates[dateString]
            ? theme.colors.error
            : theme.colors.primaryContainer,
        };
      }
    }

    setMarkedDates(marked);

    if (hasOverlap) {
      Toast.show({
        type: "error",
        text1: t("calendar.dateOverlap"),
        text2: t("calendar.dateOverlapMessage"),
        position: "bottom",
        visibilityTime: 3000,
      });

      // Reset the marked dates after a delay
      setTimeout(() => {
        updateCalendarMarks(
          pastDates,
          blockedDates,
          sessionSelections,
          currentSelection
        );
      }, 2000);
    }

    return hasOverlap;
  };

  const updateCalendarMarks = (
    past: UsedDates[],
    blocked: UsedDates[],
    selections: UsedDates[],
    current: UsedDates | null
  ) => {
    const marked: MarkedDates = {};

    // Mark past dates
    past.forEach((range) => {
      const start = new Date(range.startDate);
      const end = new Date(range.endDate);
      for (
        let date = new Date(start);
        date <= end;
        date.setDate(date.getDate() + 1)
      ) {
        const dateString = date.toISOString().split("T")[0];
        marked[dateString] = {
          disabled: true,
          disableTouchEvent: true,
          color: theme.colors.surfaceDisabled,
          textColor: theme.colors.onSurfaceDisabled,
        };
      }
    });

    // Mark blocked dates
    blocked.forEach((range) => {
      const start = new Date(range.startDate);
      const end = new Date(range.endDate);
      for (
        let date = new Date(start);
        date <= end;
        date.setDate(date.getDate() + 1)
      ) {
        const dateString = date.toISOString().split("T")[0];
        marked[dateString] = {
          disabled: true,
          disableTouchEvent: true,
          color: theme.colors.error,
          textColor: theme.colors.onError,
        };
      }
    });

    // Mark session selections
    selections.forEach((range) => {
      const start = new Date(range.startDate);
      const end = new Date(range.endDate);

      const startString = start.toISOString().split("T")[0];
      const endString = end.toISOString().split("T")[0];

      marked[startString] = {
        selected: true,
        startingDay: true,
        color: theme.colors.primary,
      };

      marked[endString] = {
        selected: true,
        endingDay: true,
        color: theme.colors.primary,
      };

      for (
        let date = new Date(start);
        date <= end;
        date.setDate(date.getDate() + 1)
      ) {
        const dateString = date.toISOString().split("T")[0];
        if (dateString !== startString && dateString !== endString) {
          marked[dateString] = {
            selected: true,
            color: theme.colors.primaryContainer,
          };
        }
      }
    });

    // Mark current selection if exists
    if (current) {
      const startString = new Date(current.startDate)
        .toISOString()
        .split("T")[0];
      marked[startString] = {
        selected: true,
        startingDay: true,
        color: theme.colors.primary,
      };
    }

    setMarkedDates(marked);
  };

  const handleDayPress = (day: DateData) => {
    const selectedDate = new Date(day.dateString);

    // Check if date is blocked or in past
    if (markedDates[day.dateString]?.disabled) {
      showBlockedDateMessage();
      return;
    }

    if (!currentSelection) {
      // Start new selection
      const newSelection: UsedDates = {
        id: `temp_${sessionIdCounter.current}`,
        equipmentId,
        userId: "",
        startDate: selectedDate,
        endDate: selectedDate,
      };
      setCurrentSelection(newSelection);
      updateCalendarMarks(
        pastDates,
        blockedDates,
        sessionSelections,
        newSelection
      );
    } else {
      const startDate = new Date(currentSelection.startDate);

      // If selected date is earlier, update start date
      if (selectedDate < startDate) {
        const updatedSelection = {
          ...currentSelection,
          startDate: selectedDate,
        };
        setCurrentSelection(updatedSelection);
        updateCalendarMarks(
          pastDates,
          blockedDates,
          sessionSelections,
          updatedSelection
        );
        return;
      }

      // Check for overlaps with the full range
      if (checkDateOverlap(startDate, selectedDate)) {
        setCurrentSelection(null);
        return;
      }

      // Complete the selection
      const completedSelection: UsedDates = {
        ...currentSelection,
        id: `temp_${sessionIdCounter.current++}`,
        endDate: selectedDate,
      };

      const newSelections = [...sessionSelections, completedSelection];
      setSessionSelections(newSelections);
      setCurrentSelection(null);
      updateCalendarMarks(pastDates, blockedDates, newSelections, null);
      onDateSelect(startDate, selectedDate);
    }
  };

  const clearSelection = (selectionId?: string) => {
    if (selectionId) {
      // Remove specific selection
      const newSelections = sessionSelections.filter(
        (s) => s.id !== selectionId
      );
      setSessionSelections(newSelections);
      updateCalendarMarks(
        pastDates,
        blockedDates,
        newSelections,
        currentSelection
      );
      Toast.show({
        type: "info",
        text1: t("calendar.selectionRemoved"),
        position: "bottom",
        visibilityTime: 2000,
      });
    } else {
      // Clear last selection
      const newSelections = sessionSelections.slice(0, -1);
      setSessionSelections(newSelections);
      updateCalendarMarks(
        pastDates,
        blockedDates,
        newSelections,
        currentSelection
      );
      Toast.show({
        type: "info",
        text1: t("calendar.lastSelectionCleared"),
        position: "bottom",
        visibilityTime: 2000,
      });
    }
  };

  const handleDayLongPress =
    Platform.OS !== "web"
      ? () => {
          if (currentSelection) {
            setCurrentSelection(null);
            updateCalendarMarks(
              pastDates,
              blockedDates,
              sessionSelections,
              null
            );
            Toast.show({
              type: "info",
              text1: "Current Selection Cleared",
              position: "bottom",
              visibilityTime: 2000,
            });
          }
        }
      : undefined;

  const formatDateRange = (selection: UsedDates) => {
    const start = new Date(selection.startDate).toLocaleDateString();
    const end = new Date(selection.endDate).toLocaleDateString();
    return `${start} - ${end}`;
  };

  const showBlockedDateMessage = () => {
    Toast.show({
      type: "error",
      text1: t("calendar.dateUnavailable"),
      text2: t("calendar.dateUnavailableMessage"),
      position: "bottom",
      visibilityTime: 3000,
    });
  };

  return (
    <View style={styles.container}>
      <Text variant="titleMedium" style={styles.title}>
        {t("calendar.selectDates")}
      </Text>
      <Calendar
        onDayPress={handleDayPress}
        onDayLongPress={handleDayLongPress}
        markedDates={markedDates}
        markingType="period"
        firstDay={settings.startWeekOnMonday ? 1 : 0}
        minDate={new Date().toISOString().split("T")[0]}
        theme={{
          todayTextColor: theme.colors.primary,
          textDisabledColor: theme.colors.outline,
          selectedDayBackgroundColor: theme.colors.primary,
          selectedDayTextColor: theme.colors.onPrimary,
        }}
      />
      {currentSelection && (
        <Text style={styles.hint}>
          {Platform.OS === "web"
            ? t("calendar.selectEndDate")
            : t("calendar.selectEndDateMobile")}
        </Text>
      )}
      {Platform.OS === "web" &&
        sessionSelections.length > 0 &&
        !currentSelection && (
          <View style={styles.buttonContainer}>
            <Button
              mode="outlined"
              onPress={() => clearSelection()}
              icon="close"
              style={styles.clearButton}
            >
              {t("calendar.clearLastSelection")}
            </Button>
          </View>
        )}
      {sessionSelections.length > 0 && (
        <List.Section>
          <List.Subheader>{t("calendar.selectedPeriods")}</List.Subheader>
          {sessionSelections.map((selection) => (
            <List.Item
              key={selection.id}
              title={formatDateRange(selection)}
              right={(props) => (
                <IconButton
                  {...props}
                  icon="close"
                  onPress={() => clearSelection(selection.id)}
                />
              )}
            />
          ))}
        </List.Section>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    marginBottom: 16,
  },
  buttonContainer: {
    marginTop: 16,
    alignItems: "center",
  },
  clearButton: {
    minWidth: 200,
  },
  hint: {
    marginTop: 8,
    textAlign: "center",
    fontStyle: "italic",
  },
});
