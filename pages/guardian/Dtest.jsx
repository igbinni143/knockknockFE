import React, { useState, useEffect } from "react";
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	TouchableOpacity,
	Switch,
	TextInput,
	Alert,
	ActivityIndicator,
} from "react-native";
import * as DUI from "../guardian/UI/DtestUI";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useRoute } from "@react-navigation/native";
import { API_ADDRESS } from "../../logic/API";

const HealthCheckItem = ({ label, value, onToggle }) => {
	return (
		<View style={DUI.styles.checkItem}>
			<Text style={DUI.styles.checkLabel}>{label}</Text>
			<Switch
				trackColor={{ false: "#767577", true: "#81b0ff" }}
				thumbColor={value ? "#4CAF50" : "#f4f3f4"}
				ios_backgroundColor="#3e3e3e"
				onValueChange={onToggle}
				value={value}
			/>
		</View>
	);
};

const DTest = () => {
	const navigation = useNavigation();
	const route = useRoute();
	const { elderlyId } = route.params || {};

	const [healthData, setHealthData] = useState({
		hasHypertension: false,
		hasDiabetes: false,
		hasDepression: false,
		hasVisionProblem: false,
		hasChronicLungDisease: false,
		otherNotes: "",
	});

	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	// 기존 데이터가 있는지 확인
	useEffect(() => {
		const fetchExistingData = async () => {
			if (!elderlyId) return;

			setIsLoading(true);
			try {
				const response = await fetch(
					`${API_ADDRESS}/${elderlyId}/health-check`,
					{
						method: "GET",
						headers: {
							"Content-Type": "application/json",
						},
					}
				);

				if (response.ok) {
					const data = await response.json();
					setHealthData(data);
				}
			} catch (error) {
				console.error("건강 데이터 불러오기 실패:", error);
			} finally {
				setIsLoading(false);
			}
		};

		fetchExistingData();
	}, [elderlyId]);

	const handleToggle = (field) => {
		setHealthData({
			...healthData,
			[field]: !healthData[field],
		});
	};

	const handleNoteChange = (text) => {
		setHealthData({
			...healthData,
			otherNotes: text,
		});
	};

	const handleSubmit = async () => {
		if (!elderlyId) {
			console.error("❌ elderlyId가 없습니다:", elderlyId); // 🔍 디버깅용 로그
			Alert.alert("오류", "어르신 정보를 찾을 수 없습니다.");
			return;
		}

		// 🔍 보낼 데이터 로그 출력
		const payload = {
			elderlyId,
			...healthData,
		};
		console.log("📦 제출할 데이터:", payload);

		setIsSubmitting(true);
		try {
			const response = await fetch(`${API_ADDRESS}/health-surveys`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(payload),
			});

			console.log("🌐 서버 응답 상태코드:", response.status); // 🔍 응답 코드 출력

			if (response.ok) {
				const resultText = await response.text(); // 🔁 JSON → text
				console.log("✅ 저장 성공:", resultText);

				Alert.alert("완료", "사전 검진 정보가 저장되었습니다.", [
					{ text: "확인", onPress: () => navigation.goBack() },
				]);
			} else {
				const errorText = await response.text();
				console.error("❌ 서버 응답 오류:", errorText);
				throw new Error("서버 응답 오류");
			}
		} catch (error) {
			console.error("💥 저장 요청 실패:", error); // 🔍 에러 전체 출력
			Alert.alert(
				"저장 실패",
				"사전 검진 정보를 저장하는 중 오류가 발생했습니다."
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	if (isLoading) {
		return (
			<LinearGradient colors={["#123", "#000"]} style={DUI.styles.container}>
				<View style={DUI.styles.loadingContainer}>
					<ActivityIndicator size="large" color="#ffffff" />
					<Text style={DUI.styles.loadingText}>데이터를 불러오는 중...</Text>
				</View>
			</LinearGradient>
		);
	}

	return (
		<LinearGradient colors={["#123", "#000"]} style={DUI.styles.container}>
			<ScrollView contentContainerStyle={DUI.styles.scrollContainer}>
				<View style={DUI.styles.infoBox}>
					<Text style={DUI.styles.infoText}>
						어르신의 건강 상태를 체크하여 더 나은 서비스를 제공할 수 있도록
						도와주세요.
					</Text>
				</View>

				<View style={DUI.styles.formSection}>
					<Text style={DUI.styles.sectionTitle}>건강 상태 체크</Text>

					<HealthCheckItem
						label="고혈압"
						value={healthData.hasHypertension}
						onToggle={() => handleToggle("hasHypertension")}
					/>

					<HealthCheckItem
						label="당뇨병"
						value={healthData.hasDiabetes}
						onToggle={() => handleToggle("hasDiabetes")}
					/>

					<HealthCheckItem
						label="우울증"
						value={healthData.hasDepression}
						onToggle={() => handleToggle("hasDepression")}
					/>

					<HealthCheckItem
						label="시력 문제"
						value={healthData.hasVisionProblem}
						onToggle={() => handleToggle("hasVisionProblem")}
					/>

					<HealthCheckItem
						label="만성 폐질환"
						value={healthData.hasChronicLungDisease}
						onToggle={() => handleToggle("hasChronicLungDisease")}
					/>

					<View style={DUI.styles.notesContainer}>
						<Text style={DUI.styles.notesLabel}>기타 참고사항</Text>
						<TextInput
							style={DUI.styles.notesInput}
							multiline
							numberOfLines={4}
							placeholder="어르신의 건강 상태에 대한 기타 참고사항을 입력하세요"
							placeholderTextColor="rgba(255, 255, 255, 0.5)"
							value={healthData.otherNotes}
							onChangeText={handleNoteChange}
						/>
					</View>
				</View>

				<TouchableOpacity
					style={DUI.styles.submitButton}
					onPress={handleSubmit}
					disabled={isSubmitting}
				>
					{isSubmitting ? (
						<ActivityIndicator color="#fff" size="small" />
					) : (
						<Text style={DUI.styles.submitButtonText}>저장하기</Text>
					)}
				</TouchableOpacity>
			</ScrollView>
		</LinearGradient>
	);
};
export default DTest;
