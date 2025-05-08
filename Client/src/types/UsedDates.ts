export type UsedDateType = 'Taken' | 'Planning' | 'Wish';

export interface UsedDates {
    id?: number;
    equipmentId: string;
    userId: string;
    startDate: Date;
    endDate: Date;
    type: UsedDateType;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateUsedDatesDto {
    equipmentId: string;
    startDate: Date;
    endDate: Date;
    type: UsedDateType;
}

export interface UpdateUsedDatesDto {
    startDate?: Date;
    endDate?: Date;
    type?: UsedDateType;
} 