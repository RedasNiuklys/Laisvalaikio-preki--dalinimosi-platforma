import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet, Platform, Pressable } from "react-native";
import { Text, useTheme, Button, List } from "react-native-paper";
import { Calendar, DateData, LocaleConfig } from "react-native-calendars";
import Toast from "react-native-toast-message";
import { getUsedDatesForEquipment, addUsedDate } from "../api/usedDatesApi";
import { UsedDates } from "../types/UsedDates";
import { IconButton } from "react-native-paper";
import { useTranslation } from "react-i18next";
import { useSettings } from "../context/SettingsContext";
import { ltLocale, enLocale } from "../locales/calendarLocales";
import { useAuth } from "../context/AuthContext";

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

// Move locale configuration outside of component

LocaleConfig.locales["lt"] = ltLocale;
LocaleConfig.locales["en"] = enLocale;

export default function DateSelector({
  equipmentId,
  onDateSelect,
}: DateSelectorProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const { settings } = useSettings();
  const { user,loadUser } = useAuth();
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
    loadUser();
    const start = new Date(2020, 0, 1);
    const pastDateRange: UsedDates = {
      id: 0,
      equipmentId,
      userId: "",
      startDate: start,
      endDate: today,
      type: "Taken",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setPastDates([pastDateRange]);
    updateCalendarMarks(
      [pastDateRange],
      blockedDates,
      sessionSelections,
      currentSelection
    );
  }, [theme.dark]);

  useEffect(() => {
    fetchUsedDates();
  }, [equipmentId, theme.dark]);

  // Update marked dates when theme changes
  useEffect(() => {
    updateCalendarMarks(
      pastDates,
      blockedDates,
      sessionSelections,
      currentSelection
    );
  }, [theme.dark]);

  useEffect(() => {
    // Reset locales to force update
    LocaleConfig.locales = {};
    LocaleConfig.locales["lt"] = ltLocale;
    LocaleConfig.locales["en"] = enLocale;
    LocaleConfig.defaultLocale = settings.language || "en";
  }, [settings.language]);

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

      // Mark start date
      marked[startString] = {
        selected: true,
        startingDay: true,
        color: theme.colors.primary,
      };

      // Mark end date
      marked[endString] = {
        selected: true,
        endingDay: true,
        color: theme.colors.primary,
      };

      // Mark days in between
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
      const start = new Date(current.startDate);
      const end = new Date(current.endDate);
      const startString = start.toISOString().split("T")[0];
      const endString = end.toISOString().split("T")[0];

      // Mark start date
      marked[startString] = {
        selected: true,
        startingDay: true,
        color: theme.colors.primary,
      };

      // Mark end date
      marked[endString] = {
        selected: true,
        endingDay: true,
        color: theme.colors.primary,
      };

      // Mark days in between
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
    }

    setMarkedDates(marked);
  };

  const handleDayPress = (day: DateData) => {
    const selectedDate = new Date(day.dateString);
    //console.log
    theme.colors.background;

    // Check if date is blocked or in past
    if (markedDates[day.dateString]?.disabled) {
      showBlockedDateMessage();
      return;
    }

    if (!currentSelection) {
      // Start new selection
      const newSelection: UsedDates = {
        id: sessionIdCounter.current + 10000000,
        equipmentId,
        userId: "",
        startDate: selectedDate,
        endDate: selectedDate,
        type: "Wish",
        createdAt: new Date(),
        updatedAt: new Date(),
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
        id: sessionIdCounter.current + 10000001,
        endDate: selectedDate,
      };

      const newSelections = [...sessionSelections, completedSelection];
      setSessionSelections(newSelections);
      setCurrentSelection(null);
      updateCalendarMarks(pastDates, blockedDates, newSelections, null);
      onDateSelect(startDate, selectedDate);
    }
  };

  const clearSelection = (selectionId?: number) => {
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

  const handlePostDates = async () => {
    if (!currentSelection || !user?.id) {
      Toast.show({
        type: "error",
        text1: t("usedDates.errors.noSelection"),
        text2: t("usedDates.errors.pleaseSelectDates"),
      });
      return;
    }

    try {
      const newUsedDate: UsedDates = {
        ...currentSelection,
        userId: user.id,
        type: "Taken",
      };
      newUsedDate.id = undefined;
      await addUsedDate(equipmentId, newUsedDate);

      // Add to blocked dates and clear current selection
      setBlockedDates([...blockedDates, newUsedDate]);
      setCurrentSelection(null);
      setSessionSelections([]);

      // Refresh the calendar
      updateCalendarMarks(pastDates, [...blockedDates, newUsedDate], [], null);

      Toast.show({
        type: "success",
        text1: t("usedDates.success.title"),
        text2: t("usedDates.success.datesAdded"),
      });
    } catch (error) {
      console.error("Error posting dates:", error);
      Toast.show({
        type: "error",
        text1: t("usedDates.errors.postFailed"),
        text2: t("usedDates.errors.tryAgain"),
      });
    }
  };

  const handlePostAllSelections = async () => {
    console.log(user);
    if (!user?.id || sessionSelections.length === 0) {
      Toast.show({
        type: "error",
        text1: t("usedDates.errors.noSelections"),
        text2: t("usedDates.errors.pleaseSelectDates"),
      });
      return;
    }

    const userId = user.id; // Store user ID to satisfy TypeScript

    try {
      // Post each selection
      const postedDates = await Promise.all(
        sessionSelections.map(async (selection) => {
          const newUsedDate: UsedDates = {
            ...selection,
            userId,
            equipmentId,
            type: "Taken",
          };
          newUsedDate.id = undefined;
          return await addUsedDate(equipmentId, newUsedDate);
        })
      );

      // Add to blocked dates and clear selections
      setBlockedDates([...blockedDates, ...postedDates]);
      setSessionSelections([]);
      setCurrentSelection(null);

      // Refresh the calendar
      updateCalendarMarks(
        pastDates,
        [...blockedDates, ...postedDates],
        [],
        null
      );

      Toast.show({
        type: "success",
        text1: t("usedDates.success.title"),
        text2: t("usedDates.success.allDatesAdded"),
      });
    } catch (error) {
      console.error("Error posting dates:", error);
      Toast.show({
        type: "error",
        text1: t("usedDates.errors.postFailed"),
        text2: t("usedDates.errors.tryAgain"),
      });
    }
  };

  return (
    <View style={styles.container}>
      <Calendar
        key={settings.language}
        onDayPress={handleDayPress}
        onDayLongPress={Platform.OS === "web" ? undefined : handleDayPress}
        markedDates={markedDates}
        markingType="period"
        firstDay={1}
        minDate={new Date().toISOString().split("T")[0]}
        theme={{
          backgroundColor: theme.colors.background,
          calendarBackground: theme.colors.background,
          textSectionTitleColor: theme.colors.onBackground,
          selectedDayBackgroundColor: theme.colors.primary,
          selectedDayTextColor: theme.colors.onPrimary,
          todayTextColor: theme.colors.primary,
          dayTextColor: theme.colors.onBackground,
          textDisabledColor: theme.colors.onSurfaceDisabled,
          dotColor: theme.colors.primary,
          selectedDotColor: theme.colors.onPrimary,
          arrowColor: theme.colors.primary,
          monthTextColor: theme.colors.onBackground,
          indicatorColor: theme.colors.primary,
        }}
      />

      {currentSelection && (
        <View
          style={[
            styles.selectionContainer,
            { backgroundColor: theme.colors.surfaceVariant },
          ]}
        >
          <Text variant="bodyMedium">{formatDateRange(currentSelection)}</Text>
          <View style={styles.selectionActions}>
            {/* <Button
              mode="contained"
              onPress={handlePostDates}
              style={styles.postButton}
            >
              {t("usedDates.actions.post")}
            </Button> */}
            <IconButton
              icon="close"
              size={20}
              onPress={() => clearSelection()}
            />
          </View>
        </View>
      )}

      {sessionSelections.length > 0 && (
        <List.Section>
          <List.Subheader>{t("usedDates.currentSelections")}</List.Subheader>
          {sessionSelections.map((selection) => (
            <List.Item
              key={selection.id}
              title={formatDateRange(selection)}
              right={() => (
                <IconButton
                  icon="close"
                  size={20}
                  onPress={() => clearSelection(selection.id)}
                />
              )}
            />
          ))}
          <View style={styles.postAllContainer}>
            <Button
              mode="contained"
              onPress={handlePostAllSelections}
              style={styles.postAllButton}
            >
              {t("usedDates.actions.postAll")}
            </Button>
          </View>
        </List.Section>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  selectionContainer: {
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  selectionActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  postButton: {
    flex: 1,
    marginRight: 8,
  },
  postAllContainer: {
    padding: 16,
    alignItems: "center",
  },
  postAllButton: {
    width: "100%",
  },
});
