import React, { useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { Calendar, DateData } from "react-native-calendars";
import { getUsedDatesForEquipment } from "../api/usedDatesApi";
import { UsedDates } from "../types/UsedDates";

interface DateSelectorProps {
  equipmentId: string;
  onDateSelect: (startDate: Date, endDate: Date) => void;
}

export default function DateSelector({
  equipmentId,
  onDateSelect,
}: DateSelectorProps) {
  const theme = useTheme();
  const [usedDates, setUsedDates] = useState<UsedDates[]>([]);
  const [selectedStartDate, setSelectedStartDate] = useState<string | null>(
    null
  );
  const [selectedEndDate, setSelectedEndDate] = useState<string | null>(null);
  const [markedDates, setMarkedDates] = useState<any>({});

  useEffect(() => {
    fetchUsedDates();
  }, [equipmentId]);

  const fetchUsedDates = async () => {
    try {
      const dates = await getUsedDatesForEquipment(equipmentId);
      setUsedDates(dates);
      updateMarkedDates(dates);
    } catch (error) {
      console.error("Error fetching used dates:", error);
    }
  };

  const updateMarkedDates = (dates: UsedDates[]) => {
    const marked: any = {};

    // Mark blocked dates
    dates.forEach((dateRange) => {
      const start = new Date(dateRange.startDate);
      const end = new Date(dateRange.endDate);

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

    // Mark selected range if exists
    if (selectedStartDate) {
      marked[selectedStartDate] = {
        ...marked[selectedStartDate],
        selected: true,
        startingDay: true,
        color: theme.colors.primary,
      };
    }
    if (selectedEndDate) {
      marked[selectedEndDate] = {
        ...marked[selectedEndDate],
        selected: true,
        endingDay: true,
        color: theme.colors.primary,
      };

      // Mark days in between
      if (selectedStartDate) {
        const start = new Date(selectedStartDate);
        const end = new Date(selectedEndDate);
        for (
          let date = new Date(start);
          date <= end;
          date.setDate(date.getDate() + 1)
        ) {
          const dateString = date.toISOString().split("T")[0];
          if (
            dateString !== selectedStartDate &&
            dateString !== selectedEndDate
          ) {
            marked[dateString] = {
              ...marked[dateString],
              selected: true,
              color: theme.colors.primaryContainer,
            };
          }
        }
      }
    }

    setMarkedDates(marked);
  };

  const handleDayPress = (day: DateData) => {
    const selectedDate = day.dateString;

    // Check if date is blocked
    if (markedDates[selectedDate]?.disabled) {
      return;
    }

    if (!selectedStartDate || (selectedStartDate && selectedEndDate)) {
      // Start new selection
      setSelectedStartDate(selectedDate);
      setSelectedEndDate(null);
    } else {
      // Complete the range
      const startDate = new Date(selectedStartDate);
      const endDate = new Date(selectedDate);

      if (endDate < startDate) {
        setSelectedStartDate(selectedDate);
        setSelectedEndDate(null);
      } else {
        // Check if any date in range is blocked
        let hasBlockedDate = false;
        for (
          let date = new Date(startDate);
          date <= endDate;
          date.setDate(date.getDate() + 1)
        ) {
          const dateString = date.toISOString().split("T")[0];
          if (markedDates[dateString]?.disabled) {
            hasBlockedDate = true;
            break;
          }
        }

        if (hasBlockedDate) {
          setSelectedStartDate(selectedDate);
          setSelectedEndDate(null);
        } else {
          setSelectedEndDate(selectedDate);
          onDateSelect(startDate, endDate);
        }
      }
    }

    updateMarkedDates(usedDates);
  };

  return (
    <View style={styles.container}>
      <Text variant="titleMedium" style={styles.title}>
        Select Dates
      </Text>
      <Calendar
        onDayPress={handleDayPress}
        markedDates={markedDates}
        markingType="period"
        minDate={new Date().toISOString().split("T")[0]}
        theme={{
          todayTextColor: theme.colors.primary,
          textDisabledColor: theme.colors.outline,
          selectedDayBackgroundColor: theme.colors.primary,
          selectedDayTextColor: theme.colors.onPrimary,
        }}
      />
      {selectedStartDate && !selectedEndDate && (
        <Text style={styles.hint}>Select end date</Text>
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
  hint: {
    marginTop: 8,
    textAlign: "center",
    fontStyle: "italic",
  },
});
