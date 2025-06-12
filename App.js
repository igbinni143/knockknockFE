// App.js
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as Notifications from "expo-notifications";
import { useEffect } from "react";
import { Platform } from "react-native";

import MainLoginPage from "./pages/MainLoginPage";
import HomePage from "./pages/HomePage";
import EloginPage from "./pages/elder/EloginPage.jsx";
import GloginPage from "./pages/guardian/GloginPage.jsx";
import Dashboard from "./pages/guardian/Dashboard.jsx";
import ElderMainPage from "./pages/elder/ElderMainPage.jsx";
import ElderProfile from "./pages/elder/ElderProfile.jsx";
import { UserProvider } from "./logic/UserContext.js";
import Indiv from "./pages/guardian/Indiv.jsx";
import DailyIndiv from "./pages/guardian/DailyIndiv.jsx";
import DTest from "./pages/guardian/Dtest.jsx";
import ElderSchedule from "./pages/elder/ElderSchedule.jsx";
import ElderPill from "./pages/elder/Elderpill.jsx";
import ElderPillManager from "./pages/elder/Elderpillmanager.jsx";
import ElderScheduleManager from "./pages/elder/ElderScheduleManager.jsx";

const Stack = createNativeStackNavigator();
Notifications.setNotificationHandler({
	handleNotification: async () => ({
		shouldShowAlert: true,
		shouldPlaySound: false,
		shouldSetBadge: false,
	}),
});
export default function App() {
	useEffect(() => {
		const registerForPushNotifications = async () => {
			const { status } = await Notifications.requestPermissionsAsync();
			if (status !== "granted") {
				alert("알림 권한이 거부되었습니다.");
			}
		};
		registerForPushNotifications();
	}, []);

	return (
		<UserProvider>
			<NavigationContainer>
				<Stack.Navigator
					screenOptions={{
						headerStyle: {
							backgroundColor: "transparent", // 또는 배경과 맞는 색상
						},
						headerTintColor: "white", // 글씨 색상
						headerTransparent: true, // 완전 투명하게
					}}
					initialRouteName="Login"
				>
					<Stack.Screen
						name="Login"
						component={MainLoginPage}
						options={{ headerShown: false }}
					/>
					<Stack.Screen
						name="Home"
						component={HomePage}
						options={{ headerTitle: "홈" }}
					/>
					<Stack.Screen
						name="Elogin"
						component={EloginPage}
						options={{ headerTitle: "어르신 로그인" }}
					/>
					<Stack.Screen
						name="Glogin"
						component={GloginPage}
						options={{ headerTitle: "보호자 로그인" }}
					/>
					<Stack.Screen
						name="Dashboard"
						component={Dashboard}
						options={{ headerShown: false }}
					/>
					<Stack.Screen
						name="ElderMainPage"
						component={ElderMainPage}
						options={{ headerShown: false }}
					/>
					<Stack.Screen
						name="ElderProfile"
						component={ElderProfile}
						options={{ headerShown: false }}
					/>
					<Stack.Screen
						name="Indiv"
						component={Indiv}
						options={{ headerTitle: "" }}
					/>
					<Stack.Screen
						name="DailyIndiv"
						component={DailyIndiv}
						options={{ headerTitle: "일일레포트" }}
					/>
					<Stack.Screen
						name="DTest"
						component={DTest}
						options={{ headerTitle: "사전 검진" }}
					/>
					<Stack.Screen
						name="ElderPill"
						component={ElderPill}
						//options={{ headerTitle: "약 복용" }}
						options={{ headerShown: false }}
					/>
					<Stack.Screen
						name="ElderPillManager"
						component={ElderPillManager}
						//options={{ headerTitle: "약 복용" }}
						options={{ headerShown: false }}
					/>
					<Stack.Screen
						name="ElderSchedule"
						component={ElderSchedule}
						//options={{ headerTitle: "스케줄 관리" }}
						options={{ headerShown: false }}
					/>
					<Stack.Screen
						name="ElderScheduleManager"
						component={ElderScheduleManager}
						//options={{ headerTitle: "스케줄 관리" }}
						options={{ headerShown: false }}
					/>
				</Stack.Navigator>
			</NavigationContainer>
		</UserProvider>
	);
}
