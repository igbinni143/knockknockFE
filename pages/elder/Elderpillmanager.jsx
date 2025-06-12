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
import * as EUI from "./UI/EpillUI";
import { useNavigation } from "@react-navigation/native";

// 알림 핸들러 설정
Notifications.setNotificationHandler({
	handleNotification: async () => ({
		shouldShowAlert: true,
		shouldPlaySound: true,
		shouldSetBadge: false,
	}),
});
export default function ElderPillManager({ route }) {
	const { name, elderlyId } = route.params || {};
	const API_BASE_URL = "http://18.205.227.28:8080";
	const ELDERLY_ID = elderlyId && elderlyId !== undefined ? elderlyId : 7;

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

	useEffect(() => {
		fetchMedications();
	}, []);

	const addNotificationTime = () => {
		setNotificationTimes([...notificationTimes, "08:00"]);
	};

	const removeNotificationTime = (index) => {
		if (notificationTimes.length > 1) {
			const newTimes = notificationTimes.filter((_, i) => i !== index);
			setNotificationTimes(newTimes);
		}
	};

	const updateNotificationTime = (index, time) => {
		const newTimes = [...notificationTimes];
		newTimes[index] = time;
		setNotificationTimes(newTimes);
	};

	const resetForm = () => {
		setPillName("");
		setPillInfo("");
		setTimesPerDay("1");
		setScheduleWhen("AFTER_MEAL");
		setNotificationTimes(["08:00"]);
	};

	const fetchMedications = async () => {
		setRefreshing(true);
		try {
			const response = await fetch(
				`${API_BASE_URL}/elderly/${ELDERLY_ID}/medications`
			);

			if (response.ok) {
				const result = await response.json();
				const medications = result.data || [];
				setPillList(medications);
			} else {
				const errorText = await response.text();
				Alert.alert(
					"오류",
					`약 목록을 불러오는데 실패했습니다.\n상태: ${response.status}\n메시지: ${response.statusText}`
				);
			}
		} catch (error) {
			Alert.alert("오류", `서버 연결에 실패했습니다:\n${error.message}`);
			setPillList([]);
		} finally {
			setRefreshing(false);
		}
	};

	const handleAddPill = async () => {
		if (!pillName.trim() || !pillInfo.trim()) {
			Alert.alert("알림", "약 이름과 약 정보를 모두 입력해주세요.");
			return;
		}

		if (parseInt(timesPerDay) < 1 || parseInt(timesPerDay) > 10) {
			Alert.alert("알림", "하루 복용 횟수는 1-10회 사이로 입력해주세요.");
			return;
		}

		const formattedTimes = notificationTimes.map((time) => {
			if (time.length === 5) {
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
				notificationEnabled: false,
				notificationTimes: formattedTimes,
			};

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

			if (response.ok) {
				const result = await response.json();
				const newMedication = result.data || result;
				setPillList([...pillList, newMedication]);
				resetForm();
				setModalVisible(false);
				Alert.alert("성공", "약이 성공적으로 추가되었습니다.");
			} else {
				const errorText = await response.text();
				Alert.alert(
					"오류",
					`약 추가에 실패했습니다.\n상태: ${response.status}`
				);
			}
		} catch (error) {
			Alert.alert("오류", `서버 연결에 실패했습니다: ${error.message}`);
		} finally {
			setLoading(false);
		}
	};

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
							Alert.alert("성공", "약이 삭제되었습니다.");
						} else {
							Alert.alert("오류", "약 삭제에 실패했습니다.");
						}
					} catch (error) {
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
			<View style={styles.header}>
				<TouchableOpacity onPress={handleBack} style={{ marginTop: 50 }}>
					<Text style={{ color: "white", fontSize: 20 }}>{`←`}</Text>
				</TouchableOpacity>
			</View>
			<View style={{ flex: 1 }}>
				<View style={EUI.styles.container}>
					<Text
						style={{
							...EUI.styles.h1,
							fontSize: name.length >= 6 ? 24 : 30, // 글자 수에 따라 크기 조절
						}}
					>
						{name}이 복용중인 약
					</Text>
				</View>

				<View style={EUI.styles.secondcontainer}>
					<TouchableOpacity
						style={EUI.styles.addPillButton}
						onPress={() => setModalVisible(true)}
					>
						<Text style={EUI.styles.addPillButtonText}>약 추가</Text>
					</TouchableOpacity>

					<ScrollView contentContainerStyle={EUI.styles.scrollContainer}>
						{pillList.length === 0 ? (
							<Text
								style={{
									color: "rgba(255, 255, 255, 0.6)",
									textAlign: "center",
									marginTop: 50,
								}}
							>
								등록된 약이 없습니다.
							</Text>
						) : (
							pillList.map((pill, index) => (
								<View key={pill.id || index} style={EUI.styles.pillCard}>
									<View style={EUI.styles.pillCardHeader}>
										<Text style={EUI.styles.pillTitle}>{pill.name}</Text>
										<TouchableOpacity
											onPress={() => handleDeletePill(index, pill.id)}
										>
											<Text style={EUI.styles.deleteButtonText}>삭제</Text>
										</TouchableOpacity>
									</View>
									<Text style={EUI.styles.pillDescription}>{pill.info}</Text>
									<Text style={EUI.styles.pillDescription}>
										하루 {pill.timesPerDay}회 복용
									</Text>
									<Text style={EUI.styles.pillDescription}>
										{pill.scheduleWhen === "AFTER_MEAL" ? "식후" : "식전"} 복용
									</Text>
									{pill.notificationEnabled &&
										pill.notificationTimes &&
										pill.notificationTimes.length > 0 && (
											<Text style={EUI.styles.pillDescription}>
												🔔 알림 시간:{" "}
												{pill.notificationTimes
													.map((time) => time.slice(0, 5))
													.join(", ")}
											</Text>
										)}
									{!pill.notificationEnabled && (
										<Text
											style={[
												EUI.styles.pillDescription,
												{ color: "rgba(255, 255, 255, 0.5)" },
											]}
										>
											🔕 알림 비활성화
										</Text>
									)}
								</View>
							))
						)}
					</ScrollView>
				</View>

				{/* 모달 */}
				<Modal
					animationType="slide"
					transparent={true}
					visible={modalVisible}
					onRequestClose={() => setModalVisible(false)}
				>
					<View style={EUI.styles.modalOverlay}>
						<View style={EUI.styles.modalpillContainer}>
							<Text style={EUI.styles.modalTitle}>약 정보 입력</Text>

							{/* 약 이름 */}
							<TextInput
								style={EUI.styles.input}
								placeholder="약 이름"
								placeholderTextColor="rgba(255,255,255,0.5)"
								value={pillName}
								onChangeText={setPillName}
								editable={!loading}
							/>

							{/* 약 정보 */}
							<TextInput
								style={[EUI.styles.input, { height: 60 }]}
								placeholder="약 정보 (치료 목적)"
								placeholderTextColor="rgba(255,255,255,0.5)"
								value={pillInfo}
								onChangeText={setPillInfo}
								multiline
								editable={!loading}
							/>

							{/* 하루 복용 횟수 */}
							<Text style={{ color: "white", fontSize: 16, marginBottom: 8 }}>
								하루 복용 횟수
							</Text>
							<TextInput
								style={EUI.styles.input}
								placeholder="1"
								placeholderTextColor="rgba(255,255,255,0.5)"
								value={timesPerDay}
								onChangeText={setTimesPerDay}
								keyboardType="numeric"
								editable={!loading}
							/>

							{/* 식전/식후 선택 */}
							<Text style={{ color: "white", fontSize: 16, marginBottom: 8 }}>
								복용 시기
							</Text>
							<View style={{ flexDirection: "row", marginBottom: 15 }}>
								<TouchableOpacity
									style={[
										EUI.styles.modaladdingButton,
										{ marginRight: 10 },
										scheduleWhen === "BEFORE_MEAL" && {
											backgroundColor: "#4CAF50",
										},
									]}
									onPress={() => setScheduleWhen("BEFORE_MEAL")}
									disabled={loading}
								>
									<Text style={EUI.styles.modaladdingButtonText}>식전</Text>
								</TouchableOpacity>
								<TouchableOpacity
									style={[
										EUI.styles.modaladdingButton,
										scheduleWhen === "AFTER_MEAL" && {
											backgroundColor: "#4CAF50",
										},
									]}
									onPress={() => setScheduleWhen("AFTER_MEAL")}
									disabled={loading}
								>
									<Text style={EUI.styles.modaladdingButtonText}>식후</Text>
								</TouchableOpacity>
							</View>

							{/* 알림 시간 */}
							<Text style={{ color: "white", fontSize: 16, marginBottom: 8 }}>
								알림 시간
							</Text>
							<ScrollView style={{ maxHeight: 150, marginBottom: 15 }}>
								{notificationTimes.map((time, index) => (
									<View
										key={index}
										style={{
											flexDirection: "row",
											alignItems: "center",
											marginBottom: 8,
										}}
									>
										<TextInput
											style={[
												EUI.styles.input,
												{ flex: 1, marginRight: 10, marginBottom: 0 },
											]}
											placeholder="08:00"
											placeholderTextColor="rgba(255,255,255,0.5)"
											value={time}
											onChangeText={(text) =>
												updateNotificationTime(index, text)
											}
											editable={!loading}
										/>
										{notificationTimes.length > 1 && (
											<TouchableOpacity
												onPress={() => removeNotificationTime(index)}
												disabled={loading}
											>
												<Text style={{ color: "#ff5c5c", fontSize: 18 }}>
													✕
												</Text>
											</TouchableOpacity>
										)}
									</View>
								))}
								<TouchableOpacity
									style={EUI.styles.modaladdingButton}
									onPress={addNotificationTime}
									disabled={loading}
								>
									<Text style={EUI.styles.modaladdingButtonText}>
										+ 시간 추가
									</Text>
								</TouchableOpacity>
							</ScrollView>

							<View style={EUI.styles.modalButtonRow}>
								<TouchableOpacity
									style={[
										EUI.styles.modalButton,
										loading && { backgroundColor: "#888" },
									]}
									onPress={handleAddPill}
									disabled={loading}
								>
									{loading ? (
										<ActivityIndicator size="small" color="white" />
									) : (
										<Text style={EUI.styles.modalButtonText}>추가</Text>
									)}
								</TouchableOpacity>
								<TouchableOpacity
									style={[EUI.styles.modalButton, { backgroundColor: "#aaa" }]}
									onPress={() => {
										setModalVisible(false);
										resetForm();
									}}
									disabled={loading}
								>
									<Text style={EUI.styles.modalButtonText}>취소</Text>
								</TouchableOpacity>
							</View>
						</View>
					</View>
				</Modal>
			</View>
		</LinearGradient>
	);
}
const styles = StyleSheet.create({
	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 20,
		marginBottom: 20,
	},
});
