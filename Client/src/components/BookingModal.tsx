import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Platform } from 'react-native';
import { Modal, Portal, Text, Button, useTheme, IconButton, TextInput, Surface } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface BookingModalProps {
    visible: boolean;
    onDismiss: () => void;
    onSubmit: (startDate: Date, endDate: Date, notes: string) => void;
    equipmentName: string;
    initialDate?: Date;
    isOwner?: boolean;
}

export default function BookingModal({ visible, onDismiss, onSubmit, equipmentName, initialDate, isOwner }: BookingModalProps) {
    const { t } = useTranslation();
    const theme = useTheme();
    const [startDate, setStartDate] = useState(initialDate || new Date());
    const [endDate, setEndDate] = useState(initialDate || new Date());
    const [notes, setNotes] = useState('');
    const [showStartDate, setShowStartDate] = useState(false);
    const [showEndDate, setShowEndDate] = useState(false);

    const isWeb = Platform.OS === 'web';

    // Update dates when initialDate changes
    React.useEffect(() => {
        if (initialDate) {
            setStartDate(initialDate);
            setEndDate(initialDate);
        }
    }, [initialDate]);

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
        onSubmit(startDate, endDate, notes);
        onDismiss();
    };

    const renderDateTimePicker = () => {
        if (isWeb) {
            return (
                <View style={styles.webDateTimeContainer}>
                    <View style={styles.dateTimeSection}>
                        <Text variant="titleSmall">{t('booking.startDateTime')}</Text>
                        <input
                            type="date"
                            value={startDate.toISOString().slice(0, 10)}
                            onChange={(e) => setStartDate(new Date(e.target.value))}
                            style={styles.webDateTimeInput}
                            min={new Date().toISOString().slice(0, 10)}
                        />
                    </View>
                    <View style={styles.dateTimeSection}>
                        <Text variant="titleSmall">{t('booking.endDateTime')}</Text>
                        <input
                            type="date"
                            value={endDate.toISOString().slice(0, 10)}
                            onChange={(e) => setEndDate(new Date(e.target.value))}
                            style={styles.webDateTimeInput}
                            min={startDate.toISOString().slice(0, 10)}
                        />
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
                        {startDate.toLocaleDateString()}
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
                        {endDate.toLocaleDateString()}
                    </Button>
                </View>

                {showStartDate && (
                    <DateTimePicker
                        value={startDate}
                        mode="date"
                        is24Hour={true}
                        onChange={handleStartDateChange}
                        minimumDate={new Date()}
                    />
                )}

                {showEndDate && (
                    <DateTimePicker
                        value={endDate}
                        mode="date"
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
        width: '100%',
    },
}); 