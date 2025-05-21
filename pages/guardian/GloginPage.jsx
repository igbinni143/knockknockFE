//guadian/GloginPage.jsx
import React, { useState } from "react";
import {
	View,
	Text,
	Image,
	TextInput,
	Button,
	Alert,
	TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as GUI from "../guardian/UI/GloginPageUI";
import people from "../../components/img/People.png";
import { useNavigation } from "@react-navigation/native";

export default function GloginPage() {
	const navigation = useNavigation();
	const [phone, setPhone] = useState("");
	const [password, setPassword] = useState("");
	const [role, setRole] = useState("");
	const [loginCheck, setLoginCheck] = useState(false);

	const handleLogin = async () => {
		console.log("로그인 시도:", phone, password, role); // 디버깅용

		try {
			await new Promise((r) => setTimeout(r, 1000));
			const response = await fetch("http://18.205.227.28:8080/login", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					phone: phone,
					password: password,
					role: role,
				}),
			});

			console.log("응답 상태:", response.status);

			const data = await response.json();
			console.log("서버 응답 데이터:", data);

			if (response.ok) {
				setLoginCheck(false);
				Alert.alert("로그인 성공", data.message);
				navigation.navigate("Dashboard", { userId: data.userId });
			} else {
				setLoginCheck(true);
				Alert.alert("로그인 실패", data.message || "아이디 또는 비밀번호 오류");
			}
		} catch (err) {
			console.error("로그인 오류:", err);
			setLoginCheck(true);
			Alert.alert("오류 발생", "네트워크 연결을 확인해주세요");
		}
	};
	return (
		<LinearGradient colors={["#123", "#000"]} style={{ flex: 1 }}>
			<View style={GUI.container}>
				<Image source={people} style={GUI.image} />
				<View style={GUI.loginBox}>
					<Text style={GUI.label}>전화번호</Text>
					<TextInput
						style={GUI.loginInput}
						value={phone}
						onChangeText={(text) => setPhone(text)}
					/>
				</View>
				<View style={GUI.loginBox}>
					<Text style={GUI.label}>비밀번호</Text>
					<TextInput
						style={GUI.loginInput}
						value={password}
						onChangeText={(text) => setPassword(text)}
						secureTextEntry={true}
					/>
				</View>
				<View style={GUI.loginBox}>
					<Text style={GUI.label}>역할</Text>
					<TouchableOpacity onPress={() => setRole("GUARDIAN")}>
						<Text
							style={[GUI.roleOption, role === "GUARDIAN" && GUI.selectedRole]}
						>
							보호자
						</Text>
					</TouchableOpacity>
					<TouchableOpacity onPress={() => setRole("MANAGER")}>
						<Text
							style={[GUI.roleOption, role === "MANAGER" && GUI.selectedRole]}
						>
							관리자
						</Text>
					</TouchableOpacity>
				</View>

				<Text style={GUI.buttonText} onPress={handleLogin}>
					로그인
				</Text>
				{loginCheck && <Text> 이메일 혹은 비밀번호가 일치하지 않습니다. </Text>}
			</View>
		</LinearGradient>
	);
}
