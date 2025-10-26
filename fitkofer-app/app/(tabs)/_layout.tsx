import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Tabs } from "expo-router";

import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";

function TabBarIcon({
  name,
  color,
}: {
  name: React.ComponentProps<typeof FontAwesome>["name"];
  color: string;
}) {
  return (
    <FontAwesome
      size={22}
      style={{ marginBottom: -2 }}
      name={name}
      color={color}
    />
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.tint,
        tabBarInactiveTintColor: theme.tabIconDefault,
        tabBarLabelStyle: { fontFamily: "Inter_500Medium" },
        tabBarStyle: {
          backgroundColor: theme.background,
          borderTopColor: theme.border,
        },
        headerStyle: { backgroundColor: theme.background },
        headerTitleStyle: {
          fontFamily: "Inter_600SemiBold",
          color: theme.text,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Današnji plan",
          tabBarLabel: "Početna",
          tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="workouts"
        options={{
          title: "Treninzi",
          tabBarLabel: "Trening",
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="heartbeat" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="nutrition"
        options={{
          title: "Ishrana",
          tabBarLabel: "Obroci",
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="cutlery" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="planner"
        options={{
          title: "Planer & navike",
          tabBarLabel: "Planer",
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="check-square" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil & podešavanja",
          tabBarLabel: "Profil",
          tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />,
        }}
      />
    </Tabs>
  );
}
