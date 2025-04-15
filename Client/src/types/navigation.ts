import { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
    Home: undefined;
    Login: undefined;
    Register: undefined;
    Profile: undefined;
};

declare global {
    namespace ReactNavigation {
        interface RootParamList extends RootStackParamList { }
    }
} 