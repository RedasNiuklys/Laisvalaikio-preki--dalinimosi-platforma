import { useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { useAuth } from "@/src/context/AuthContext";

export function useProtectedRoute() {
    const segments = useSegments();
    const router = useRouter();
    const { isAuthenticated } = useAuth();

    useEffect(() => {
        const inAuthGroup = segments[0] === "(auth)";

        if (!isAuthenticated && !inAuthGroup) {
            router.replace("/(auth)/login");
        } else if (isAuthenticated && inAuthGroup) {
            router.replace("/(tabs)");
        }
    }, [isAuthenticated, segments]);
} 