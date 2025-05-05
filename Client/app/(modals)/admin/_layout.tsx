import { Stack } from 'expo-router';

export default function AdminModalsLayout() {
    return (
        <Stack>
            <Stack.Screen
                name="addCategory"
                options={{
                    title: 'Add Category',
                    presentation: 'modal',
                }}
            />
            <Stack.Screen
                name="[id]"
                options={{
                    title: 'Edit Category',
                    presentation: 'modal',
                }}
            />
        </Stack>
    );
} 