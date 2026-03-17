import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#fff' },
          headerTintColor: '#172b54',
          headerTitleStyle: { fontWeight: '700' },
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen
          name="index"
          options={{ title: 'REENTRY', headerShown: false }}
        />
        <Stack.Screen
          name="intake"
          options={{ title: 'Tell Us Your Situation', presentation: 'modal' }}
        />
        <Stack.Screen
          name="plan"
          options={{ title: 'Your Action Plan' }}
        />
        <Stack.Screen
          name="dashboard"
          options={{ title: 'Your Progress' }}
        />
      </Stack>
    </>
  );
}
