import React, { useState, useEffect } from "react";
import {
	View,
	Text,
	StyleSheet,
	Image,
	ScrollView,
	TouchableOpacity,
} from "react-native";
import grandma from "../../components/img/grandma.png";
import grandpa from "../../components/img/grandpa.png";
import radar_chart from "../../components/img/radar_chart2.png";

import { LinearGradient } from "expo-linear-gradient";
import { API_ADDRESS } from "../../logic/API";
import { useNavigation } from "@react-navigation/native";
import { Audio } from "expo-av";
import RecordingPlayer from "./RecordingPlayer";

export default function DailyIndiv({ route }) {
	const navigation = useNavigation();
	const { elderlyData } = route.params || {};
	const [detailData, setDetailData] = useState(null);
	const [dailyData, setDailyData] = useState(null);
	const [weeklyData, setWeeklyData] = useState(null); // 주간 리포트
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	const handleNavIndiv = () => {
		navigation.navigate("Indiv", { elderlyData: elderlyData });
	};
	useEffect(() => {
		const fetchDailyData = async () => {
			try {
				if (!elderlyData?.elderly_id) return;
				const response = await fetch(
					`${API_ADDRESS}/daily-reports/${elderlyData.elderly_id}?date=2025-05-15`
				);
				const data = await response.json();
				setDailyData(data);
				console.log(data);
			} catch (e) {
				setError("일일 리포트 로딩 오류");
			}
		};
		fetchDailyData();
	}, [elderlyData]);
	useEffect(() => {
		const fetchWeeklyData = async () => {
			try {
				if (!elderlyData?.elderly_id) return;
				const response = await fetch(
					`${API_ADDRESS}/weekly-reports/${elderlyData.elderly_id - 6}/parsed`
				);
				const data = await response.json();
				setWeeklyData(data);
				console.log("주간 리포트", data);
			} catch (e) {
				setError("주간 리포트 로딩 오류");
			}
		};
		fetchWeeklyData();
	}, [elderlyData]);

	return (
		<LinearGradient colors={["#123", "#000"]} style={{ flex: 1 }}>
			<ScrollView contentContainerStyle={styles.scrollContainer}>
				{/* 프로필 섹션 */}

				<View style={styles.profileSection}>
					<TouchableOpacity onPress={handleNavIndiv}>
						<Image
							source={elderlyData?.gender == "F" ? grandma : grandpa}
							style={styles.profileImage}
						/>
					</TouchableOpacity>
					<Text style={styles.name}>{elderlyData?.name || "이름 없음"}</Text>
					{/*<Text style={styles.statusMessage}>{getStatusMessage()}</Text>*/}
				</View>
				<View>
					{dailyData ? (
						<View style={styles.detailSection}>
							<Text style={styles.sectionTitle}>오늘의 상태</Text>
							<Text style={{ fontSize: 40, textAlign: "center" }}>
								{dailyData.emoji}
							</Text>
							<Text style={styles.statusMessage2}>
								{dailyData.emojiMessage}
							</Text>
							<View style={{ marginTop: 20 }}>
								<Text style={styles.subSectionTitle}>신체 상태</Text>
								<Text style={styles.statusMessage}>
									{dailyData.physicalMessage}
								</Text>

								<Text style={styles.subSectionTitle}>인지 상태</Text>
								<Text style={styles.statusMessage}>
									{dailyData.cognitiveMessage}
								</Text>

								<Text style={styles.subSectionTitle}>감정 상태</Text>
								<Text style={styles.statusMessage}>
									{dailyData.emotionalMessage}
								</Text>

								<Text style={styles.subSectionTitle}>사회적 상태</Text>
								<Text style={styles.statusMessage}>
									{dailyData.socialMessage}
								</Text>

								<Text style={styles.subSectionTitle}>일상 루틴</Text>
								<Text style={styles.statusMessage}>
									{dailyData.behavioralMessage}
								</Text>
							</View>
						</View>
					) : (
						<View style={styles.detailSection}>
							<Text style={styles.sectionTitle}>오늘의 상태</Text>
							<Text style={styles.statusMessage}>
								오늘의 리포트가 없습니다.
							</Text>
						</View>
					)}
				</View>

				<View style={styles.detailSection}>
					<Text style={styles.sectionTitle}>주간 상태</Text>
					{weeklyData && (
						<Text style={styles.statusMessage}>
							{weeklyData.summary || "주간 요약 정보가 없습니다."}
						</Text>
					)}
					<Image
						source={radar_chart}
						style={{ width: 300, height: 250, alignSelf: "center" }}
					/>
				</View>
				<View>
					<RecordingPlayer />
				</View>
			</ScrollView>
		</LinearGradient>
	);
}

const styles = StyleSheet.create({
	scrollContainer: {
		marginTop: 100,
		flexGrow: 1,
		paddingBottom: 40,
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		paddingTop: 20,
		paddingHorizontal: 20,
		marginBottom: 20,
	},
	headerTitle: {
		color: "white",
		fontSize: 20,
		fontWeight: "bold",
	},

	profileSection: {
		alignItems: "center",
		padding: 20,
	},
	profileImage: {
		width: 120,
		height: 120,
		borderRadius: 60,
		marginBottom: 15,
		borderWidth: 3,
		borderColor: "rgba(255, 255, 255, 0.4)",
	},
	name: {
		color: "white",
		fontSize: 24,
		fontWeight: "bold",
		marginBottom: 10,
	},
	statusIndicator: {
		paddingHorizontal: 15,
		paddingVertical: 8,
		borderRadius: 20,
		marginBottom: 10,
	},
	statusText: {
		color: "white",
		fontSize: 16,
		fontWeight: "bold",
	},
	statusMessage: {
		color: "rgba(255, 255, 255, 0.7)",
		fontSize: 14,
	},
	statusMessage2: {
		marginTop: 15,
		color: "rgba(255, 255, 255, 0.7)",
		fontSize: 14,
	},
	appUsageSection: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		marginVertical: 10,
	},
	appUsageDot: {
		width: 12,
		height: 12,
		borderRadius: 6,
		marginRight: 8,
	},
	appUsageText: {
		color: "white",
		fontSize: 16,
	},
	detailSection: {
		backgroundColor: "rgba(255, 255, 255, 0.1)",
		borderRadius: 10,
		padding: 15,
		margin: 15,
	},

	sectionTitle: {
		color: "white",
		fontSize: 18,
		fontWeight: "bold",
		marginBottom: 10,
		borderBottomWidth: 1,
		borderBottomColor: "rgba(255, 255, 255, 0.2)",
		paddingBottom: 10,
	},
	subSectionTitle: {
		color: "white",
		fontSize: 16,
		fontWeight: "600",
		marginTop: 15,
		marginBottom: 5,
	},
	infoItem: {
		flexDirection: "row",
		justifyContent: "space-between",
		paddingVertical: 10,
		borderBottomWidth: 1,
		borderBottomColor: "rgba(255, 255, 255, 0.1)",
	},
	infoLabel: {
		color: "rgba(255, 255, 255, 0.7)",
		fontSize: 16,
	},
	infoValue: {
		color: "white",
		fontSize: 16,
		fontWeight: "500",
	},
	actionButtons: {
		flexDirection: "row",
		justifyContent: "space-between",
		paddingHorizontal: 15,
		marginTop: 10,
	},
	actionButton: {
		flex: 1,
		padding: 15,
		borderRadius: 8,
		alignItems: "center",
		marginHorizontal: 5,
	},
	logButton: {
		backgroundColor: "#3F51B5",
	},
	chatButton: {
		backgroundColor: "#00897B",
	},
	buttonText: {
		color: "white",
		fontSize: 16,
		fontWeight: "bold",
	},
	loadingContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
	loadingText: {
		color: "white",
		marginTop: 10,
	},
	errorContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: 20,
	},
	errorText: {
		color: "#FF5252",
		fontSize: 18,
		textAlign: "center",
		marginBottom: 20,
	},
});
