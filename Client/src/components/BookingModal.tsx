import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Platform } from 'react-native';
import { Modal, Portal, Text, Button, useTheme, IconButton, TextInput, Surface, Checkbox } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface BookingModalProps {
    visible: boolean;
    onDismiss: () => void;
    onSubmit: (startDate: Date, endDate: Date, notes: string, notifyOwner: boolean) => void;
    equipmentName: string;
    initialDate?: Date;
    isOwner?: boolean;
}

const formatDateLocalISO = (date: Date) => {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const parseISODateStrict = (value: string): Date | null => {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
    if (!match) return null;

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const parsed = new Date(year, month - 1, day);

    if (
        parsed.getFullYear() !== year ||
        parsed.getMonth() !== month - 1 ||
        parsed.getDate() !== day
    ) {
        return null;
    }

    parsed.setHours(12, 0, 0, 0);
    return parsed;
};

const toLocalMidday = (date: Date) => {
    const copy = new Date(date);
    copy.setHours(12, 0, 0, 0);
    return copy;
};

export default function BookingModal({ visible, onDismiss, onSubmit, equipmentName, initialDate, isOwner }: BookingModalProps) {
    const { t } = useTranslation();
    const theme = useTheme();
    const [startDate, setStartDate] = useState(initialDate || new Date());
    const [endDate, setEndDate] = useState(initialDate || new Date());
    const [notes, setNotes] = useState('');
    const [notifyOwner, setNotifyOwner] = useState(true);
    const [showStartDate, setShowStartDate] = useState(false);
    const [showEndDate, setShowEndDate] = useState(false);
    const [webStartDateInput, setWebStartDateInput] = useState(formatDateLocalISO(initialDate || new Date()));
    const [webEndDateInput, setWebEndDateInput] = useState(formatDateLocalISO(initialDate || new Date()));
    const webStartDatePickerRef = React.useRef<HTMLInputElement>(null);
    const webEndDatePickerRef = React.useRef<HTMLInputElement>(null);

    const isWeb = Platform.OS === 'web';

    // Update dates when initialDate changes
    React.useEffect(() => {
        if (initialDate) {
            setStartDate(initialDate);
            setEndDate(initialDate);
        }
    }, [initialDate]);

    React.useEffect(() => {
        setWebStartDateInput(formatDateLocalISO(startDate));
    }, [startDate]);

    React.useEffect(() => {
        setWebEndDateInput(formatDateLocalISO(endDate));
    }, [endDate]);

    const handleWebStartDateInputChange = (value: string) => {
        setWebStartDateInput(value);
        const parsed = parseISODateStrict(value);
        if (!parsed) return;

        const today = toLocalMidday(new Date());
        if (parsed < today) return;

        setStartDate(parsed);
        if (parsed > toLocalMidday(endDate)) {
            setEndDate(parsed);
        }
    };

    const handleWebEndDateInputChange = (value: string) => {
        setWebEndDateInput(value);
        const parsed = parseISODateStrict(value);
        if (!parsed) return;

        if (parsed < toLocalMidday(startDate)) return;
        setEndDate(parsed);
    };

    const openWebDatePicker = (ref: React.RefObject<HTMLInputElement | null>) => {
        const input = ref.current;
        if (!input) return;

        const pickerInput = input as HTMLInputElement & { showPicker?: () => void };
        if (typeof pickerInput.showPicker === 'function') {
            pickerInput.showPicker();
            return;
        }

        input.focus();
        input.click();
    };

    const handleStartDateChange = (event: any, selectedDate?: Date) => {
        const currentDate = selectedDate || startDate;
        if (Platform.OS !== 'web') {
            setShowStartDate(Platform.OS === 'ios');
        }
        setStartDate(currentDate);

        if (currentDate > endDate) {
            setEndDate(currentDate);
        }
    };

    const handleEndDateChange = (event: any, selectedDate?: Date) => {
        const currentDate = selectedDate || endDate;
        if (Platform.OS !== 'web') {
            setShowEndDate(Platform.OS === 'ios');
        }
        setEndDate(currentDate < startDate ? startDate : currentDate);
    };

    const handleSubmit = () => {
        onSubmit(startDate, endDate, notes, notifyOwner);
        onDismiss();
    };

    const renderDateTimePicker = () => {
        if (isWeb) {
            return (
                <View style={styles.webDateTimeContainer}>
                    <View style={styles.dateTimeSection}>
                        <Text variant="titleSmall">{t('booking.startDateTime')}</Text>
                        <View style={styles.webDateInputRow}>
                            <input
                                inputMode="numeric"
                                pattern="\\d{4}-\\d{2}-\\d{2}"
                                placeholder="YYYY-MM-DD"
                                value={webStartDateInput}
                                onChange={(e) => handleWebStartDateInputChange(e.target.value)}
                                onBlur={() => setWebStartDateInput(formatDateLocalISO(startDate))}
                                style={styles.webDateTimeInput}
                            />
                            <IconButton
                                icon="calendar-month"
                                onPress={() => openWebDatePicker(webStartDatePickerRef)}
                                style={styles.webCalendarIconButton}
                            />
                            <input
                                ref={webStartDatePickerRef}
                                type="date"
                                value={formatDateLocalISO(startDate)}
                                onChange={(e) => handleWebStartDateInputChange(e.target.value)}
                                min={formatDateLocalISO(new Date())}
                                style={styles.webNativeDateInput}
                                aria-label={t('booking.startDateTime')}
                            />
                        </View>
                    </View>
                    <View style={styles.dateTimeSection}>
                        <Text variant="titleSmall">{t('booking.endDateTime')}</Text>
                        <View style={styles.webDateInputRow}>
                            <input
                                inputMode="numeric"
                                pattern="\\d{4}-\\d{2}-\\d{2}"
                                placeholder="YYYY-MM-DD"
                                value={webEndDateInput}
                                onChange={(e) => handleWebEndDateInputChange(e.target.value)}
                                onBlur={() => setWebEndDateInput(formatDateLocalISO(endDate))}
                                style={styles.webDateTimeInput}
                            />
                            <IconButton
                                icon="calendar-month"
                                onPress={() => openWebDatePicker(webEndDatePickerRef)}
                                style={styles.webCalendarIconButton}
                            />
                            <input
                                ref={webEndDatePickerRef}
                                type="date"
                                value={formatDateLocalISO(endDate)}
                                onChange={(e) => handleWebEndDateInputChange(e.target.value)}
                                min={formatDateLocalISO(startDate)}
                                style={styles.webNativeDateInput}
                                aria-label={t('booking.endDateTime')}
                            />
                        </View>
                    </View>
                </View>
            );
        }

        return (
            <View style={styles.dateTimeSection}>
                <Text variant="titleSmall">{t('booking.startDateTime')}</Text>
                <View style={styles.dateTimeButtons}>
                    <Button
                        mode="outlined"
                        onPress={() => setShowStartDate(true)}
                        style={styles.dateButton}
                    >
                        {formatDateLocalISO(startDate)}
                    </Button>
                </View>

                <Text variant="titleSmall" style={styles.endDateLabel}>
                    {t('booking.endDateTime')}
                </Text>
                <View style={styles.dateTimeButtons}>
                    <Button
                        mode="outlined"
                        onPress={() => setShowEndDate(true)}
                        style={styles.dateButton}
                    >
                        {formatDateLocalISO(endDate)}
                    </Button>
                </View>

                {showStartDate && (
                    <DateTimePicker
                        value={startDate}
                        mode="date"
                        dateFormat='shortdate'
                        is24Hour={true}
                        onChange={handleStartDateChange}
                        minimumDate={new Date()}
                    />
                )}

                {showEndDate && (
                    <DateTimePicker
                        value={endDate}
                        mode="date"
                        dateFormat='shortdate'
                        is24Hour={true}
                        onChange={handleEndDateChange}
                        minimumDate={startDate}
                    />
                )}
            </View>
        );
    };

    return (
        <Portal>
            <Modal
                visible={visible}
                onDismiss={onDismiss}
                contentContainerStyle={[
                    styles.container,
                    { backgroundColor: theme.colors.background }
                ]}
            >
                <View style={styles.header}>
                    <IconButton
                        icon="arrow-left"
                        onPress={onDismiss}
                        style={styles.backButton}
                    />
                    <Text variant="titleLarge" style={styles.title}>
                        {t('booking.new')}
                    </Text>
                </View>

                <ScrollView style={styles.content}>
                    <Text variant="titleMedium" style={styles.equipmentName}>
                        {equipmentName}
                    </Text>

                    {isOwner && (
                        <Surface style={[styles.ownerBanner, { backgroundColor: theme.colors.primaryContainer }]}>
                            <MaterialCommunityIcons 
                                name="check-circle" 
                                size={20} 
                                color={theme.colors.primary} 
                                style={styles.ownerBannerIcon}
                            />
                            <Text 
                                variant="bodyMedium" 
                                style={[styles.ownerBannerText, { color: theme.colors.onPrimaryContainer }]}
                            >
                                {t('booking.ownerAutoApproval')}
                            </Text>
                        </Surface>
                    )}

                    {renderDateTimePicker()}

                    <View style={styles.notesSection}>
                        <Text variant="titleSmall" style={styles.notesLabel}>
                            {t('booking.notes')}
                        </Text>
                        <TextInput
                            mode="outlined"
                            value={notes}
                            onChangeText={setNotes}
                            placeholder={t('booking.notesPlaceholder')}
                            multiline
                            numberOfLines={3}
                            style={styles.notesInput}
                        />
                    </View>

                    {!isOwner && (
                        <View style={styles.notifySection}>
                            <Checkbox
                                status={notifyOwner ? 'checked' : 'unchecked'}
                                onPress={() => setNotifyOwner((prev) => !prev)}
                            />
                            <Text style={[styles.notifyText, { color: theme.colors.onSurface }]}>
                                {t('booking.notifications.notifyOwner')}
                            </Text>
                        </View>
                    )}
                </ScrollView>

                <View style={styles.footer}>
                    <Button
                        mode="contained"
                        onPress={handleSubmit}
                        style={styles.submitButton}
                    >
                        {t('booking.submit')}
                    </Button>
                </View>
            </Modal>
        </Portal>
    );
}

const styles = StyleSheet.create({
    container: {
        margin: 20,
        borderRadius: 8,
        height: '80%',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    backButton: {
        marginRight: 8,
    },
    title: {
        flex: 1,
    },
    content: {
        padding: 16,
    },
    equipmentName: {
        marginBottom: 24,
    },
    ownerBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
    },
    ownerBannerIcon: {
        marginRight: 8,
    },
    ownerBannerText: {
        flex: 1,
    },
    dateTimeSection: {
        marginBottom: 24,
    },
    dateTimeButtons: {
        flexDirection: 'row',
        marginTop: 8,
        marginBottom: 16,
    },
    dateButton: {
        flex: 1,
    },
    endDateLabel: {
        marginTop: 16,
    },
    notesSection: {
        marginTop: 16,
    },
    notesLabel: {
        marginBottom: 8,
    },
    notesInput: {
        backgroundColor: 'transparent',
    },
    notifySection: {
        marginTop: 12,
        flexDirection: 'row',
        alignItems: 'center',
    },
    notifyText: {
        flex: 1,
    },
    footer: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
    },
    submitButton: {
        width: '100%',
    },
    webDateTimeContainer: {
        gap: 16,
    },
    webDateTimeInput: {
        marginTop: 8,
        padding: 8,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        flex: 1,
    },
    webDateInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    webCalendarIconButton: {
        marginTop: 8,
    },
    webNativeDateInput: {
        position: 'absolute',
        width: 0,
        height: 0,
        opacity: 0,
    },
}); 