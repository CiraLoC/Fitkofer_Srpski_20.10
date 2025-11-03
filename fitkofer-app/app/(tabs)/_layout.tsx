import FontAwesome from "@expo/vector-icons/FontAwesome";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Tabs } from "expo-router";
import { StyleSheet, View } from "react-native";

import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";
import ThemeToggle from "@/components/ui/ThemeToggle";

type TabIconProps = {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  focused: boolean;
  theme: typeof Colors.light | typeof Colors.dark;
};

const TabBarIcon = ({ icon, focused, theme }: TabIconProps) => (
  <View
    style={[
      styles.tabIconBase,
      focused
        ? { backgroundColor: theme.tint, borderColor: theme.tint }
        : { backgroundColor: theme.background, borderColor: theme.border },
    ]}
  >
    <MaterialCommunityIcons
      name={icon}
      size={18}
      color={focused ? theme.background : theme.tabIconDefault}
    />
  </View>
);

TabBarIcon.displayName = "TabBarIcon";

const TabLayout = () => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.tint,
        tabBarInactiveTintColor: theme.tabIconDefault,
        tabBarLabelStyle: { fontFamily: "Inter_500Medium", marginBottom: 4 },
        tabBarStyle: {
          backgroundColor: theme.background,
          borderTopColor: theme.border,
          height: 70,
          paddingTop: 8,
        },
        headerStyle: { backgroundColor: theme.background },
        headerTitleStyle: {
          fontFamily: "Inter_600SemiBold",
          color: theme.text,
        },
        headerRight: () => <ThemeToggle />,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Danasnji plan",
          tabBarLabel: "Pocetna",
          tabBarIcon: ({ focused }) => (
            <TabBarIcon icon="home-heart" focused={focused} theme={theme} />
          ),
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="workouts"
        options={{
          title: "Treninzi",
          tabBarLabel: "Trening",
          tabBarIcon: ({ focused }) => (
            <TabBarIcon icon="dumbbell" focused={focused} theme={theme} />
          ),
        }}
      />
      <Tabs.Screen
        name="nutrition"
        options={{
          title: "Ishrana",
          tabBarLabel: "Obroci",
          tabBarIcon: ({ focused }) => (
            <TabBarIcon icon="food-apple" focused={focused} theme={theme} />
          ),
        }}
      />
      <Tabs.Screen
        name="planner"
        options={{
          title: "Planer & navike",
          tabBarLabel: "Planer",
          tabBarIcon: ({ focused }) => (
            <TabBarIcon icon="calendar-check" focused={focused} theme={theme} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil & podesavanja",
          tabBarLabel: "Profil",
          tabBarIcon: ({ focused }) => (
            <View
              style={[
                styles.tabIconBase,
                focused
                  ? { backgroundColor: theme.tint, borderColor: theme.tint }
                  : {
                      backgroundColor: theme.background,
                      borderColor: theme.border,
                    },
              ]}
            >
              <FontAwesome
                name="user"
                size={18}
                color={focused ? theme.background : theme.tabIconDefault}
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
};

TabLayout.displayName = "TabLayout";

export default TabLayout;

const styles = StyleSheet.create({
  tabIconBase: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
});
