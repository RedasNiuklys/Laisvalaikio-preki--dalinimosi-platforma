import { NavigatorScreenParams } from '@react-navigation/native';
import { Location } from './Location';

export type LocationStackParamList = {
    'Add Location': {
        initialCoordinates?: {
            latitude: number;
            longitude: number;
        };
        isEditing?: boolean;
        onSubmitSuccess?: () => void;
    };
    'Edit Location': {
        location: Location;
        isEditing: boolean;
        onSubmitSuccess?: () => void;
    };
};

export type RootStackParamList = {
    Home: undefined;
    Login: undefined;
    Register: undefined;
    Profile: undefined;
    'Location List': undefined;
    'Add Location': {
        initialCoordinates?: {
            latitude: number;
            longitude: number;
        };
        isEditing?: boolean;
        onSubmitSuccess?: () => void;
    };
    'Edit Location': {
        location: Location;
        isEditing: boolean;
        onSubmitSuccess?: () => void;
    };
};

declare global {
    namespace ReactNavigation {
        interface RootParamList extends RootStackParamList { }
    }
} 