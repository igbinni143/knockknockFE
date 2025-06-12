import {
	View,
	Text,
	TextInput,
	Modal,
	TouchableOpacity,
	ScrollView,
	ActivityIndicator,
	Alert,
	StyleSheet,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useState, useEffect } from "react";
import * as Notifications from "expo-notifications";
import { useNavigation } from "@react-navigation/native";

// 알림 핸들러 설정
Notifications.setNotificationHandler({
	handleNotification: async () => ({
		shouldShowAlert: true,
		shouldPlaySound: true,
		shouldSetBadge: false,
	}),
});

export default function ElderPill({ route }) {
	const { name, elderlyId } = route.params || {};
	const API_BASE_URL = "http://18.205.227.28:8080";

	// elderlyId가 undefined이거나 null이면 기본값 7 사용
	const ELDERLY_ID = elderlyId && elderlyId !== undefined ? elderlyId : 7;

	console.log("ElderPill - route.params:", route.params);
	console.log("ElderPill - 받은 elderlyId:", elderlyId);
	console.log("ElderPill - elderlyId 타입:", typeof elderlyId);
	console.log("ElderPill - 사용할 ELDERLY_ID:", ELDERLY_ID);

	const [modalVisible, setModalVisible] = useState(false);
	const [pillName, setPillName] = useState("");
	const [pillInfo, setPillInfo] = useState("");
	const [timesPerDay, setTimesPerDay] = useState("1");
	const [scheduleWhen, setScheduleWhen] = useState("AFTER_MEAL");
	const [notificationTimes, setNotificationTimes] = useState(["08:00"]);
	const [pillList, setPillList] = useState([]);
	const [loading, setLoading] = useState(false);
	const [refreshing, setRefreshing] = useState(false);
	const navigation = useNavigation();

	// 컴포넌트 마운트시 약 목록 불러오기
	useEffect(() => {
		requestNotificationPermissions();
		fetchMedications();
	}, []);

	// 알림 권한 요청
	const requestNotificationPermissions = async () => {
		const { status } = await Notifications.requestPermissionsAsync();
		if (status !== "granted") {
			Alert.alert(
				"알림 권한",
				"약 복용 알림을 받으려면 알림 권한이 필요합니다."
			);
		}
	};

	// 약 알림 스케줄링 (올바른 방식)
	const scheduleNotificationsForMedication = async (medication) => {
		try {
			console.log(`알림 스케줄링 시도: ${medication.name}`);

			// 기존 알림 취소 (약 이름으로 식별)
			await cancelNotificationsForMedication(medication.name);

			if (!medication.notificationEnabled || !medication.notificationTimes) {
				console.log("알림이 비활성화되어 있거나 시간이 설정되지 않음");
				return;
			}

			// 각 알림 시간에 대해 스케줄링
			for (const time of medication.notificationTimes) {
				const [hours, minutes] = time.split(":").map(Number);

				// 유효한 시간인지 확인
				if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
					console.log(`잘못된 시간 형식: ${time}`);
					continue;
				}

				await Notifications.scheduleNotificationAsync({
					content: {
						title: `💊 복용 알림`,
						body: `${medication.name} 복용 시간입니다`,
						data: {
							medicationId: medication.id,
							medicationName: medication.name,
						},
					},
					trigger: {
						hour: hours,
						minute: minutes,
						repeats: true,
					},
					identifier: `medication_${medication.name}_${time}`,
				});

				console.log(
					`알림 스케줄됨: ${medication.name} - ${hours}:${String(
						minutes
					).padStart(2, "0")}`
				);
			}
		} catch (error) {
			console.error("알림 스케줄링 오류:", error);
		}
	};

	// 특정 약의 알림 취소
	const cancelNotificationsForMedication = async (medicationName) => {
		try {
			const allNotifications =
				await Notifications.getAllScheduledNotificationsAsync();
			const medicationNotifications = allNotifications.filter((notif) =>
				notif.identifier.includes(`medication_${medicationName}`)
			);

			for (const notif of medicationNotifications) {
				await Notifications.cancelScheduledNotificationAsync(notif.identifier);
			}
		} catch (error) {
			console.error("알림 취소 오류:", error);
		}
	};

	// 알림 시간 추가
	const addNotificationTime = () => {
		setNotificationTimes([...notificationTimes, "08:00"]);
	};

	// 알림 시간 삭제
	const removeNotificationTime = (index) => {
		if (notificationTimes.length > 1) {
			const newTimes = notificationTimes.filter((_, i) => i !== index);
			setNotificationTimes(newTimes);
		}
	};

	// 알림 시간 변경
	const updateNotificationTime = (index, time) => {
		const newTimes = [...notificationTimes];
		newTimes[index] = time;
		setNotificationTimes(newTimes);
	};

	// 폼 초기화
	const resetForm = () => {
		setPillName("");
		setPillInfo("");
		setTimesPerDay("1");
		setScheduleWhen("AFTER_MEAL");
		setNotificationTimes(["08:00"]);
	};

	// 약 목록 불러오기 (향상된 디버깅)
	const fetchMedications = async () => {
		setRefreshing(true);
		try {
			console.log(
				"API 호출 시작:",
				`${API_BASE_URL}/elderly/${ELDERLY_ID}/medications`
			);

			const response = await fetch(
				`${API_BASE_URL}/elderly/${ELDERLY_ID}/medications`
			);

			console.log("응답 상태:", response.status);
			console.log("응답 상태 텍스트:", response.statusText);
			console.log("응답 OK:", response.ok);

			if (response.ok) {
				const result = await response.json();
				console.log("서버 응답 데이터:", JSON.stringify(result, null, 2));

				// 서버 응답의 data 배열을 사용
				const medications = result.data || [];
				console.log("추출된 약 목록:", medications);
				console.log("약 개수:", medications.length);

				setPillList(medications);

				// 각 약에 대해 알림 스케줄링
				for (const medication of medications) {
					await scheduleNotificationsForMedication(medication);
				}

				// 성공 메시지 표시
				if (medications.length > 0) {
					console.log(`${medications.length}개의 약을 불러왔습니다.`);
				}
			} else {
				const errorText = await response.text();
				console.error("API 오류 응답:", errorText);
				Alert.alert(
					"오류",
					`약 목록을 불러오는데 실패했습니다.\n상태: ${response.status}\n메시지: ${response.statusText}`
				);
			}
		} catch (error) {
			console.error("Fetch medications error:", error);
			Alert.alert("오류", `서버 연결에 실패했습니다:\n${error.message}`);
			// 에러시 빈 배열로 초기화
			setPillList([]);
		} finally {
			setRefreshing(false);
		}
	};

	// 약 추가하기
	const handleAddPill = async () => {
		if (!pillName.trim() || !pillInfo.trim()) {
			Alert.alert("알림", "약 이름과 약 정보를 모두 입력해주세요.");
			return;
		}

		if (parseInt(timesPerDay) < 1 || parseInt(timesPerDay) > 10) {
			Alert.alert("알림", "하루 복용 횟수는 1-10회 사이로 입력해주세요.");
			return;
		}

		// 알림 시간을 HH:MM:SS 형식으로 변환
		const formattedTimes = notificationTimes.map((time) => {
			if (time.length === 5) {
				// HH:MM 형식
				return time + ":00";
			}
			return time;
		});

		setLoading(true);
		try {
			const medicationData = {
				name: pillName.trim(),
				info: pillInfo.trim(),
				timesPerDay: parseInt(timesPerDay),
				scheduleWhen: scheduleWhen,
				notificationEnabled: true,
				notificationTimes: formattedTimes,
			};

			console.log("약 추가 요청 데이터:", medicationData);

			const response = await fetch(
				`${API_BASE_URL}/elderly/${ELDERLY_ID}/medications`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(medicationData),
				}
			);

			console.log("약 추가 응답 상태:", response.status);

			if (response.ok) {
				const result = await response.json();
				console.log("약 추가 응답 데이터:", result);

				// 서버 응답이 단일 객체인지 확인 후 배열에 추가
				const newMedication = result.data || result;
				setPillList([...pillList, newMedication]);

				// 새로 추가된 약에 대해 알림 스케줄링
				await scheduleNotificationsForMedication(newMedication);

				resetForm();
				setModalVisible(false);
				Alert.alert("성공", "약이 성공적으로 추가되었습니다.");
			} else {
				const errorText = await response.text();
				console.error("약 추가 오류 응답:", errorText);
				Alert.alert(
					"오류",
					`약 추가에 실패했습니다.\n상태: ${response.status}`
				);
			}
		} catch (error) {
			console.error("Add medication error:", error);
			Alert.alert("오류", `서버 연결에 실패했습니다: ${error.message}`);
		} finally {
			setLoading(false);
		}
	};

	// 약 삭제하기
	const handleDeletePill = async (index, medicationId) => {
		Alert.alert("삭제 확인", "정말로 이 약을 삭제하시겠습니까?", [
			{
				text: "취소",
				style: "cancel",
			},
			{
				text: "삭제",
				style: "destructive",
				onPress: async () => {
					try {
						const response = await fetch(
							`${API_BASE_URL}/elderly/${ELDERLY_ID}/medications/${medicationId}`,
							{
								method: "DELETE",
							}
						);

						if (response.ok) {
							const updatedPillList = pillList.filter((_, i) => i !== index);
							setPillList(updatedPillList);

							// 삭제된 약의 알림도 취소
							const deletedMedication = pillList[index];
							await cancelNotificationsForMedication(deletedMedication.name);

							Alert.alert("성공", "약이 삭제되었습니다.");
						} else {
							Alert.alert("오류", "약 삭제에 실패했습니다.");
						}
					} catch (error) {
						console.error("Delete medication error:", error);
						Alert.alert("오류", "서버 연결에 실패했습니다.");
					}
				},
			},
		]);
	};

	const handleBack = () => {
		navigation.goBack();
	};

	return (
		<LinearGradient colors={["#123", "#000"]} style={{ flex: 1 }}>
			{/* 상단 헤더 */}
			<View style={styles.header}>
				<TouchableOpacity onPress={handleBack} style={styles.backButton}>
					<Text style={styles.backButtonText}>← 뒤로가기</Text>
				</TouchableOpacity>
			</View>

			{/* 메인 컨텐츠 */}
			<View style={styles.container}>
				{/* 제목 */}
				<Text style={styles.title}>{name}님의 복용약 관리</Text>

				{/* 약 추가 버튼 */}
				<TouchableOpacity
					style={styles.addButton}
					onPress={() => setModalVisible(true)}
				>
					<Text style={styles.addButtonText}>+ 새 약 추가</Text>
				</TouchableOpacity>

				{/* 약 목록 */}
				<ScrollView
					style={styles.scrollView}
					showsVerticalScrollIndicator={false}
				>
					{pillList.length === 0 ? (
						<View style={styles.emptyContainer}>
							<Text style={styles.emptyText}>등록된 약이 없습니다</Text>
							<Text style={styles.emptySubText}>
								위의 버튼을 눌러 약을 추가해보세요
							</Text>
						</View>
					) : (
						pillList.map((pill, index) => (
							<View key={pill.id || index} style={styles.pillCard}>
								{/* 약 카드 헤더 */}
								<View style={styles.pillCardHeader}>
									<Text style={styles.pillName}>{pill.name}</Text>
									<TouchableOpacity
										style={styles.deleteButton}
										onPress={() => handleDeletePill(index, pill.id)}
									>
										<Text style={styles.deleteButtonText}>삭제</Text>
									</TouchableOpacity>
								</View>

								{/* 약 정보 */}
								<Text style={styles.pillInfo}>{pill.info}</Text>

								{/* 복용 정보 */}
								<View style={styles.pillDetails}>
									<Text style={styles.pillDetailText}>
										📊 하루 {pill.timesPerDay}회 복용
									</Text>
									<Text style={styles.pillDetailText}>
										🍽️ {pill.scheduleWhen === "AFTER_MEAL" ? "식후" : "식전"}{" "}
										복용
									</Text>
								</View>

								{/* 알림 정보 */}
								{pill.notificationEnabled &&
									pill.notificationTimes &&
									pill.notificationTimes.length > 0 && (
										<View style={styles.notificationInfo}>
											<Text style={styles.notificationText}>
												🔔 알림 시간:{" "}
												{pill.notificationTimes
													.map((time) => time.slice(0, 5))
													.join(", ")}
											</Text>
										</View>
									)}

								{!pill.notificationEnabled && (
									<View style={styles.notificationInfo}>
										<Text style={styles.notificationDisabledText}>
											🔕 알림 꺼짐
										</Text>
									</View>
								)}
							</View>
						))
					)}
				</ScrollView>
			</View>

			{/* 약 추가 모달 */}
			<Modal
				animationType="slide"
				transparent={true}
				visible={modalVisible}
				onRequestClose={() => setModalVisible(false)}
			>
				<View style={styles.modalOverlay}>
					<View style={styles.modalContainer}>
						<Text style={styles.modalTitle}>새 약 추가</Text>

						{/* 약 이름 */}
						<Text style={styles.inputLabel}>약 이름</Text>
						<TextInput
							style={styles.input}
							placeholder="예: 혈압약, 당뇨약 등"
							placeholderTextColor="rgba(255,255,255,0.5)"
							value={pillName}
							onChangeText={setPillName}
							editable={!loading}
						/>

						{/* 약 정보 */}
						<Text style={styles.inputLabel}>약 설명</Text>
						<TextInput
							style={[styles.input, styles.textArea]}
							placeholder="이 약이 어떤 치료를 위한 것인지 적어주세요"
							placeholderTextColor="rgba(255,255,255,0.5)"
							value={pillInfo}
							onChangeText={setPillInfo}
							multiline
							editable={!loading}
						/>

						{/* 하루 복용 횟수 */}
						<Text style={styles.inputLabel}>하루 복용 횟수</Text>
						<TextInput
							style={styles.input}
							placeholder="1"
							placeholderTextColor="rgba(255,255,255,0.5)"
							value={timesPerDay}
							onChangeText={setTimesPerDay}
							keyboardType="numeric"
							editable={!loading}
						/>

						{/* 식전/식후 선택 */}
						<Text style={styles.inputLabel}>복용 시기</Text>
						<View style={styles.scheduleButtons}>
							<TouchableOpacity
								style={[
									styles.scheduleButton,
									scheduleWhen === "BEFORE_MEAL" && styles.scheduleButtonActive,
								]}
								onPress={() => setScheduleWhen("BEFORE_MEAL")}
								disabled={loading}
							>
								<Text
									style={[
										styles.scheduleButtonText,
										scheduleWhen === "BEFORE_MEAL" &&
											styles.scheduleButtonTextActive,
									]}
								>
									식전
								</Text>
							</TouchableOpacity>
							<TouchableOpacity
								style={[
									styles.scheduleButton,
									scheduleWhen === "AFTER_MEAL" && styles.scheduleButtonActive,
								]}
								onPress={() => setScheduleWhen("AFTER_MEAL")}
								disabled={loading}
							>
								<Text
									style={[
										styles.scheduleButtonText,
										scheduleWhen === "AFTER_MEAL" &&
											styles.scheduleButtonTextActive,
									]}
								>
									식후
								</Text>
							</TouchableOpacity>
						</View>

						{/* 알림 시간 */}
						<Text style={styles.inputLabel}>알림 시간</Text>
						<ScrollView style={styles.notificationTimesContainer}>
							{notificationTimes.map((time, index) => (
								<View key={index} style={styles.timeInputRow}>
									<TextInput
										style={[styles.input, styles.timeInput]}
										placeholder="08:00 (시:분)"
										placeholderTextColor="rgba(255,255,255,0.5)"
										value={time}
										onChangeText={(text) => updateNotificationTime(index, text)}
										editable={!loading}
									/>
									{notificationTimes.length > 1 && (
										<TouchableOpacity
											style={styles.removeTimeButton}
											onPress={() => removeNotificationTime(index)}
											disabled={loading}
										>
											<Text style={styles.removeTimeButtonText}>✕</Text>
										</TouchableOpacity>
									)}
								</View>
							))}
							<TouchableOpacity
								style={styles.addTimeButton}
								onPress={addNotificationTime}
								disabled={loading}
							>
								<Text style={styles.addTimeButtonText}>+ 알림 시간 추가</Text>
							</TouchableOpacity>
						</ScrollView>

						{/* 모달 버튼들 */}
						<View style={styles.modalButtons}>
							<TouchableOpacity
								style={[styles.modalButton, styles.cancelButton]}
								onPress={() => {
									setModalVisible(false);
									resetForm();
								}}
								disabled={loading}
							>
								<Text style={styles.cancelButtonText}>취소</Text>
							</TouchableOpacity>
							<TouchableOpacity
								style={[
									styles.modalButton,
									styles.confirmButton,
									loading && styles.disabledButton,
								]}
								onPress={handleAddPill}
								disabled={loading}
							>
								{loading ? (
									<ActivityIndicator size="small" color="white" />
								) : (
									<Text style={styles.confirmButtonText}>추가</Text>
								)}
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>
		</LinearGradient>
	);
}

const styles = StyleSheet.create({
	header: {
		paddingTop: 50,
		paddingHorizontal: 20,
		paddingBottom: 20,
	},
	backButton: {
		backgroundColor: "rgba(255, 255, 255, 0.15)",
		paddingHorizontal: 20,
		paddingVertical: 12,
		borderRadius: 12,
		alignSelf: "flex-start",
	},
	backButtonText: {
		color: "white",
		fontSize: 18,
		fontWeight: "bold",
	},
	container: {
		flex: 1,
		paddingHorizontal: 20,
	},
	title: {
		color: "white",
		fontSize: 28,
		fontWeight: "bold",
		textAlign: "center",
		marginBottom: 30,
	},
	addButton: {
		backgroundColor: "#4CAF50",
		paddingVertical: 18,
		borderRadius: 15,
		marginBottom: 25,
		alignItems: "center",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.3,
		shadowRadius: 4,
		elevation: 5,
	},
	addButtonText: {
		color: "white",
		fontSize: 20,
		fontWeight: "bold",
	},
	scrollView: {
		flex: 1,
	},
	emptyContainer: {
		alignItems: "center",
		marginTop: 80,
		paddingHorizontal: 40,
	},
	emptyText: {
		color: "rgba(255, 255, 255, 0.8)",
		fontSize: 20,
		fontWeight: "bold",
		textAlign: "center",
		marginBottom: 10,
	},
	emptySubText: {
		color: "rgba(255, 255, 255, 0.6)",
		fontSize: 16,
		textAlign: "center",
		lineHeight: 24,
	},
	pillCard: {
		backgroundColor: "rgba(255, 255, 255, 0.12)",
		borderRadius: 15,
		padding: 20,
		marginBottom: 20,
		borderLeftWidth: 5,
		borderLeftColor: "#4CAF50",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.2,
		shadowRadius: 4,
		elevation: 3,
	},
	pillCardHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 15,
	},
	pillName: {
		color: "white",
		fontSize: 22,
		fontWeight: "bold",
		flex: 1,
		marginRight: 15,
	},
	deleteButton: {
		backgroundColor: "rgba(255, 82, 82, 0.3)",
		paddingHorizontal: 15,
		paddingVertical: 10,
		borderRadius: 10,
	},
	deleteButtonText: {
		color: "#ff5252",
		fontSize: 16,
		fontWeight: "bold",
	},
	pillInfo: {
		color: "rgba(255, 255, 255, 0.9)",
		fontSize: 18,
		fontWeight: "bold",
		lineHeight: 24,
		marginBottom: 15,
	},
	pillDetails: {
		marginBottom: 15,
	},
	pillDetailText: {
		color: "rgba(255, 255, 255, 0.8)",
		fontSize: 18,
		fontWeight: "bold",
		marginBottom: 8,
		lineHeight: 22,
	},
	notificationInfo: {
		backgroundColor: "rgba(255, 183, 77, 0.15)",
		borderRadius: 10,
		padding: 12,
	},
	notificationText: {
		color: "#FFB74D",
		fontSize: 18,
		fontWeight: "bold",
		fontWeight: "600",
	},
	notificationDisabledText: {
		color: "rgba(255, 255, 255, 0.5)",
		fontSize: 16,
		fontWeight: "600",
	},
	// 모달 스타일
	modalOverlay: {
		flex: 1,
		backgroundColor: "rgba(0, 0, 0, 0.8)",
		justifyContent: "center",
		alignItems: "center",
	},
	modalContainer: {
		backgroundColor: "#1a1a2e",
		borderRadius: 20,
		padding: 25,
		margin: 20,
		maxHeight: "85%",
		width: "95%",
	},
	modalTitle: {
		color: "white",
		fontSize: 24,
		fontWeight: "bold",
		textAlign: "center",
		marginBottom: 25,
	},
	inputLabel: {
		color: "white",
		fontSize: 18,
		fontWeight: "bold",
		marginBottom: 10,
		marginTop: 5,
	},
	input: {
		backgroundColor: "rgba(255, 255, 255, 0.1)",
		borderRadius: 12,
		padding: 18,
		color: "white",
		fontSize: 18,
		marginBottom: 20,
		borderWidth: 2,
		borderColor: "rgba(255, 255, 255, 0.2)",
	},
	textArea: {
		height: 80,
		textAlignVertical: "top",
	},
	scheduleButtons: {
		flexDirection: "row",
		marginBottom: 20,
		gap: 15,
	},
	scheduleButton: {
		flex: 1,
		backgroundColor: "rgba(255, 255, 255, 0.1)",
		paddingVertical: 15,
		borderRadius: 12,
		alignItems: "center",
		borderWidth: 2,
		borderColor: "rgba(255, 255, 255, 0.2)",
	},
	scheduleButtonActive: {
		backgroundColor: "#4CAF50",
		borderColor: "#4CAF50",
	},
	scheduleButtonText: {
		color: "rgba(255, 255, 255, 0.8)",
		fontSize: 18,
		fontWeight: "bold",
	},
	scheduleButtonTextActive: {
		color: "white",
	},
	notificationTimesContainer: {
		maxHeight: 200,
		marginBottom: 20,
	},
	timeInputRow: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 15,
	},
	timeInput: {
		flex: 1,
		marginRight: 15,
		marginBottom: 0,
	},
	removeTimeButton: {
		backgroundColor: "rgba(255, 82, 82, 0.3)",
		borderRadius: 10,
		padding: 12,
		minWidth: 45,
		alignItems: "center",
	},
	removeTimeButtonText: {
		color: "#ff5252",
		fontSize: 18,
		fontWeight: "bold",
	},
	addTimeButton: {
		backgroundColor: "rgba(33, 150, 243, 0.2)",
		paddingVertical: 15,
		borderRadius: 12,
		alignItems: "center",
		marginTop: 10,
	},
	addTimeButtonText: {
		color: "#2196F3",
		fontSize: 16,
		fontWeight: "bold",
	},
	modalButtons: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginTop: 20,
		gap: 15,
	},
	modalButton: {
		flex: 1,
		paddingVertical: 18,
		borderRadius: 12,
		alignItems: "center",
	},
	cancelButton: {
		backgroundColor: "#666",
	},
	confirmButton: {
		backgroundColor: "#4CAF50",
	},
	disabledButton: {
		backgroundColor: "#888",
	},
	cancelButtonText: {
		color: "white",
		fontSize: 18,
		fontWeight: "bold",
	},
	confirmButtonText: {
		color: "white",
		fontSize: 18,
		fontWeight: "bold",
	},
});
