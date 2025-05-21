import React, { useState, useEffect, useCallback } from "react";
import {
	View,
	Text,
	StyleSheet,
	Image,
	ScrollView,
	TouchableOpacity,
	ActivityIndicator,
} from "react-native";
import grandma from "../../components/img/grandma.png";
import grandpa from "../../components/img/grandpa.png";

import { LinearGradient } from "expo-linear-gradient";
import { API_ADDRESS } from "../../logic/API";
import { useFocusEffect, useNavigation } from "@react-navigation/native";

// 상태 표시를 위한 컴포넌트
const StatusIndicator = ({ status }) => {
	const getStatusColor = () => {
		if (!status) return "#555"; // 상태 없음

		switch (status) {
			case "양호":
				return "#4CAF50"; // 초록색
			case "위험":
				return "#FF5252"; // 빨간색
			case "주의":
				return "#FFD740"; // 노란색
			default:
				return "#555"; // 기본 회색
		}
	};

	return (
		<View
			style={[styles.statusIndicator, { backgroundColor: getStatusColor() }]}
		>
			<Text style={styles.statusText}>{status || "상태 정보 없음"}</Text>
		</View>
	);
};

// 정보 항목 컴포넌트
const InfoItem = ({ label, value }) => (
	<View style={styles.infoItem}>
		<Text style={styles.infoLabel}>{label}</Text>
		<Text style={styles.infoValue}>{value || "-"}</Text>
	</View>
);

export default function Indiv({ route }) {
	const navigation = useNavigation();
	const { elderlyData } = route.params || {};
	const [detailData, setDetailData] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	// 환자 상세 정보 가져오기
	//useEffect(() => {
	//	const fetchDetailData = async () => {
	//		if (!elderlyData?.elderly_id) {
	//			setError("잘못된 접근입니다");
	//			setLoading(false);
	//			return;
	//		}

	//		try {
	//			const elderlyId = elderlyData.elderly_id;
	//			const response = await fetch(`${API_ADDRESS}/elderly/${elderlyId}`, {
	//				method: "GET",
	//				headers: {
	//					"Content-Type": "application/json",
	//				},
	//			});

	//			if (!response.ok) {
	//				throw new Error(`API 요청 실패: ${response.status}`);
	//			}

	//			const data = await response.json();
	//			console.log("상세 정보:", data);
	//			setDetailData(data);
	//			setLoading(false);
	//		} catch (error) {
	//			console.error("상세 정보 가져오기 실패:", error);
	//			setError("데이터를 불러오는 중 오류가 발생했습니다");
	//			setLoading(false);
	//		}
	//	};

	//	fetchDetailData();
	//}, [elderlyData]);
	useFocusEffect(
		useCallback(() => {
			const fetchDetailData = async () => {
				const elderlyId = elderlyData?.elderly_id;
				if (!elderlyId) {
					console.error("❌ elderlyId 없음");
					setError("잘못된 접근입니다");
					setLoading(false);
					return;
				}

				const url = `${API_ADDRESS}/elderly/${elderlyId}`;
				console.log("📡 요청 주소:", url);

				try {
					const response = await fetch(url, {
						method: "GET",
						headers: {
							"Content-Type": "application/json",
						},
					});

					if (!response.ok) {
						console.error("❌ API 요청 실패:", response.status);
						setError(`서버 요청 실패 (상태코드: ${response.status})`);
						setLoading(false);
						return;
					}

					const data = await response.json();
					console.log("✅ 불러온 데이터:", data);
					setDetailData(data);
				} catch (err) {
					console.error("💥 요청 중 오류 발생:", err);
					setError("데이터를 불러오는 중 오류가 발생했습니다.");
				} finally {
					setLoading(false);
				}
			};

			setLoading(true); // 🔁 focus될 때마다 다시 로딩 시작
			setError(null);
			fetchDetailData();
		}, [elderlyData])
	);

	// 상태 안내 메시지 생성
	const getStatusMessage = () => {
		if (!elderlyData?.status) return "상태 정보가 없습니다";

		switch (elderlyData.status) {
			case "양호":
				return "정상적인 활동 상태입니다";
			case "위험":
				return "위험 상태: 즉시 확인이 필요합니다";
			case "주의":
				return "주의 상태: 모니터링이 필요합니다";
			default:
				return "상태 정보가 없습니다";
		}
	};

	// 날짜 포맷팅 함수
	const formatDate = (dateString) => {
		if (!dateString) return "-";
		const parts = dateString.split("-");
		if (parts.length === 3) {
			return `${parts[0]}년 ${parts[1]}월 ${parts[2]}일`;
		}
		return dateString;
	};

	// 백 버튼 핸들러
	const handleBack = () => {
		navigation.goBack();
	};

	// 행동 기록 페이지로 이동
	const navigateToActivityLog = () => {
		navigation.navigate("ActivityLog", { elderlyId: elderlyData.elderly_id });
	};

	// 채팅 기록 페이지로 이동
	const navigateToChatLog = () => {
		navigation.navigate("ChatLog", { elderlyId: elderlyData.elderly_id });
	};
	const handleNavDTest = () => {
		navigation.navigate("DTest", { elderlyId: elderlyData.elderly_id });
	};

	if (loading) {
		return (
			<LinearGradient colors={["#123", "#000"]} style={{ flex: 1 }}>
				<View style={styles.loadingContainer}>
					<ActivityIndicator size="large" color="#ffffff" />
					<Text style={styles.loadingText}>정보를 불러오는 중...</Text>
				</View>
			</LinearGradient>
		);
	}

	if (error) {
		return (
			<LinearGradient colors={["#123", "#000"]} style={{ flex: 1 }}>
				<View style={styles.errorContainer}>
					<Text style={styles.errorText}>{error}</Text>
					<TouchableOpacity style={styles.backButton} onPress={handleBack}>
						<Text style={styles.backButtonText}>돌아가기</Text>
					</TouchableOpacity>
				</View>
			</LinearGradient>
		);
	}

	return (
		<LinearGradient colors={["#123", "#000"]} style={{ flex: 1 }}>
			<ScrollView contentContainerStyle={styles.scrollContainer}>
				{/* 헤더 */}
				<View style={styles.header}>
					<Text style={styles.headerTitle}>어르신 정보</Text>
				</View>

				{/* 프로필 섹션 */}

				<View style={styles.profileSection}>
					<Image
						source={elderlyData?.gender == "F" ? grandma : grandpa}
						style={styles.profileImage}
					/>
					<Text style={styles.name}>{elderlyData?.name || "이름 없음"}</Text>
					<StatusIndicator status={elderlyData?.status} />
					<Text style={styles.statusMessage}>{getStatusMessage()}</Text>
				</View>

				{/* 앱 사용 상태 */}
				<View style={styles.appUsageSection}>
					<View
						style={[
							styles.appUsageDot,
							{
								backgroundColor: elderlyData?.appUsedToday
									? "#4CAF50"
									: "#FF5252",
							},
						]}
					/>
					<Text style={styles.appUsageText}>
						{elderlyData?.appUsedToday
							? "오늘 앱을 사용했습니다"
							: "오늘 앱을 사용하지 않았습니다"}
					</Text>
				</View>

				{/* 상세 정보 섹션 */}
				<View style={styles.detailSection}>
					<Text style={styles.sectionTitle}>기본 정보</Text>
					<InfoItem
						label="생년월일"
						value={formatDate(detailData?.birthDate)}
					/>
					<InfoItem
						label="성별"
						value={elderlyData?.gender === "F" ? "여성" : "남성"}
					/>
					<InfoItem label="건강 상태" value={detailData?.hasDisease} />
					<InfoItem
						label="사전 검진 여부"
						value={detailData?.hasHealthCheck ? "완료" : "미완료"}
					/>
					{!detailData?.hasHealthCheck && (
						<TouchableOpacity onPress={handleNavDTest}>
							<View style={{ marginTop: 10 }}>
								<Text style={{ color: "#4FC3F7" }}>사전 검진 하러가기</Text>
							</View>
						</TouchableOpacity>
					)}
				</View>

				{/* 담당자 정보 섹션 */}
				<View style={styles.detailSection}>
					<Text style={styles.sectionTitle}>담당자 정보</Text>
					<InfoItem label="담당 매니저" value={detailData?.managerName} />
					<InfoItem label="매니저 연락처" value={detailData?.managerPhone} />
				</View>

				{/* 액션 버튼 */}
				<View style={styles.actionButtons}>
					<TouchableOpacity
						style={[styles.actionButton, styles.logButton]}
						onPress={navigateToActivityLog}
					>
						<Text style={styles.buttonText}>활동 기록 보기</Text>
					</TouchableOpacity>

					<TouchableOpacity
						style={[styles.actionButton, styles.chatButton]}
						onPress={navigateToChatLog}
					>
						<Text style={styles.buttonText}>대화 기록 보기</Text>
					</TouchableOpacity>
				</View>
			</ScrollView>
		</LinearGradient>
	);
}

const styles = StyleSheet.create({
	scrollContainer: {
		flexGrow: 1,
		marginTop: 100,
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
		textAlign: "center",
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
