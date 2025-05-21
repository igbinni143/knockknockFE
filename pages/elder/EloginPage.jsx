import React, { useState } from "react";
import {
	View,
	Text,
	Image,
	TextInput,
	Alert,
	TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as EUI from "../elder/UI/EloginPageUI";
import people from "../../components/img/elder.png";
import { useNavigation } from "@react-navigation/native";
import { useUser } from "../../logic/UserContext";

export default function EloginPage() {
	const navigation = useNavigation();
	const [phone, setPhone] = useState("");
	const [password, setPassword] = useState("");
	const [loginCheck, setLoginCheck] = useState(false);

	// Context에서 login 함수 가져오기
	const { login } = useUser();

	const handleLogin = async () => {
		console.log("로그인 시도:", phone, password);

		if (!phone || !password) {
			Alert.alert("입력 오류", "전화번호와 비밀번호를 모두 입력해주세요.");
			return;
		}

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
					role: "ELDERLY",
				}),
			});

			console.log("응답 상태:", response.status);

			let responseData;
			try {
				responseData = await response.json();
				console.log("서버 응답:", responseData);
			} catch (jsonError) {
				const textResponse = await response.text();
				console.log("서버 응답(TEXT):", textResponse);
				responseData = { message: textResponse };
			}

			if (response.ok) {
				setLoginCheck(false);
				Alert.alert("로그인 성공", responseData.message || "로그인 성공");

				if (responseData.userId) {
					await fetchElderlyData(responseData.userId);
				} else {
					console.error("userId가 없습니다:", responseData);
					navigation.navigate("ElderMainPage");
				}
			} else {
				setLoginCheck(true);
				Alert.alert("로그인 실패", responseData.message || "로그인 실패");
			}
		} catch (err) {
			console.error("로그인 오류:", err);
			setLoginCheck(true);
			Alert.alert("오류 발생", "네트워크 연결을 확인해주세요");
		}
	};

	const fetchElderlyData = async (userId) => {
		try {
			console.log(`Elderly 정보 요청: /elderly/${userId}`);

			const elderlyResponse = await fetch(
				`http://18.205.227.28:8080/elderly/${userId}`,
				{
					method: "GET",
					headers: {
						"Content-Type": "application/json",
					},
				}
			);

			console.log("elderly 응답 상태:", elderlyResponse.status);

			if (elderlyResponse.ok) {
				let elderlyData;
				try {
					elderlyData = await elderlyResponse.json();
					console.log("Elderly 데이터:", elderlyData);

					// Context를 통해 사용자 데이터 저장
					login(elderlyData, userId);

					// 로그인 성공 후 메인 페이지로 이동
					navigation.navigate("ElderMainPage");
				} catch (jsonError) {
					console.error("Elderly JSON 파싱 오류:", jsonError);
					navigation.navigate("ElderMainPage");
				}
			} else {
				console.error("Elderly 정보 가져오기 실패");
				navigation.navigate("ElderMainPage");
			}
		} catch (error) {
			console.error("Elderly 정보 가져오기 오류:", error);
			navigation.navigate("ElderMainPage");
		}
	};

	return (
		<LinearGradient colors={["#123", "#000"]} style={{ flex: 1 }}>
			<View style={EUI.styles.container}>
				<Image source={people} style={EUI.styles.image} />
				<View style={EUI.styles.loginBox}>
					<Text style={EUI.styles.label}>전화번호</Text>
					<TextInput
						style={EUI.styles.loginInput}
						value={phone}
						onChangeText={(text) => setPhone(text)}
						keyboardType="phone-pad"
					/>
				</View>
				<View style={EUI.styles.loginBox}>
					<Text style={EUI.styles.label}>비밀번호</Text>
					<TextInput
						style={EUI.styles.loginInput}
						value={password}
						onChangeText={(text) => setPassword(text)}
						secureTextEntry={true}
					/>
				</View>

				<TouchableOpacity onPress={handleLogin}>
					<Text style={EUI.styles.buttonText}>로그인</Text>
				</TouchableOpacity>

				{loginCheck && (
					<Text style={{ color: "red", marginTop: 10 }}>
						전화번호 혹은 비밀번호가 일치하지 않습니다.
					</Text>
				)}
			</View>
		</LinearGradient>
	);
}
