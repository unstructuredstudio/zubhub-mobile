import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import React, { useState, useEffect } from "react";
import { StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import {
  Home,
  Register,
  Login,
  ForgetPassword,
  ProjectDetail,
  Bookmark,
} from "../screens";
import BottomNavigator from "./BottomNavigator";
import * as THEME from "../constants/theme";
import { TOKEN } from "../utils/storageKeys";
import AsyncStorage from "@react-native-async-storage/async-storage";

const Stack = createStackNavigator();

export default function Navigation() {
  const [token, setToken] = useState(null);

  useEffect(() => {
    getToken();
  }, []);

  const getToken = async () => {
    let userToken = await AsyncStorage.getItem(TOKEN);
    setToken(userToken);
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={"dark-content"}
        backgroundColor={THEME.COLORS.PRIMARY_GREY}
      />
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {token === null && (
            <>
              <Stack.Screen name="Login" component={Login} />
              <Stack.Screen name="Home" component={Home} />
              <Stack.Screen name="Register" component={Register} />
            </>
          )}
          <Stack.Screen name="BottomNavigator" component={BottomNavigator} />
          <Stack.Screen name="ForgetPassword" component={ForgetPassword} />
          <Stack.Screen name="ProjectDetail" component={ProjectDetail} />
          <Stack.Screen name="Bookmark" component={Bookmark} />
        </Stack.Navigator>
      </NavigationContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
