import { User } from "@/src/types/User";

const ADMIN_USER_ID = process.env.EXPO_PUBLIC_ADMIN_USER_ID?.trim();
const ADMIN_USER_EMAIL = process.env.EXPO_PUBLIC_ADMIN_USER_EMAIL?.trim().toLowerCase();

export const isSingleAdminUser = (user: User | null | undefined): boolean => {
    if (!user) {
        return false;
    }

    // Enforce a single admin by preferring exact user id when provided.
    if (ADMIN_USER_ID) {
        return user.id === ADMIN_USER_ID;
    }

    if (ADMIN_USER_EMAIL) {
        return user.email?.trim().toLowerCase() === ADMIN_USER_EMAIL;
    }

    return false;
};
