// 일정 수정 모달 열기
const openEditModal = (event) => {
	setEditingEvent(event);
	setTitle(event.title);
	setDescription(event.description);

	// 이벤트 시간에서 날짜와 시간 분리
	const eventDate = new Date(event.eventTime);
	setSelectedDate(eventDate);
	setEventTime(eventDate.toTimeString().slice(0, 5)); // HH:MM 형식
	setNotificationTimes(event.notificationTimes || ["08:30"]);
	setEditModalVisible(true);
};

// 일정 수정하기
const handleUpdateSchedule = async () => {
	if (!title.trim() || !description.trim()) {
		Alert.alert("알림", "제목과 내용을 모두 입력해주세요.");
		return;
	}

	// 선택된 날짜와 시간을 조합하여 ISO 문자열 생성
	const eventDateTime = new Date(selectedDate);
	const [hours, minutes] = eventTime.split(":").map(Number);
	eventDateTime.setHours(hours, minutes, 0, 0);

	setLoading(true);
	try {
		const updatedData = {
			title: title.trim(),
			description: description.trim(),
			eventTime: eventDateTime.toISOString(),
			notificationEnabled: true,
			notificationTimes: notificationTimes,
		};

		console.log("일정 수정 요청:", editingEvent.id, updatedData);

		const response = await fetch(
			`${API_BASE_URL}/elderly/${ELDERLY_ID}/calendar/${editingEvent.id}`,
			{
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(updatedData),
			}
		);

		console.log("일정 수정 응답 상태:", response.status);

		if (response.ok) {
			const result = await response.json();
			console.log("일정 수정 응답 데이터:", result);

			// 리스트에서 해당 일정 업데이트
			const updatedList = scheduleList.map((schedule) =>
				schedule.id === editingEvent.id ? result.data || result : schedule
			);
			setScheduleList(updatedList);

			resetForm();
			setEditModalVisible(false);
			setEditingEvent(null);
			Alert.alert("성공", "일정이 수정되었습니다.");

			// 현재 월의 데이터 다시 로드
			fetchSchedulesForMonth();
		} else {
			const errorText = await response.text();
			console.error("일정 수정 오류 응답:", errorText);
			Alert.alert(
				"오류",
				`일정 수정에 실패했습니다.\n상태: ${response.status}`
			);
		}
	} catch (error) {
		console.error("Update schedule error:", error);
		Alert.alert("오류", `서버 연결에 실패했습니다: ${error.message}`);
	} finally {
		setLoading(false);
	}
};

// 일정 삭제하기
const handleDeleteSchedule = async (eventId, eventTitle) => {
	Alert.alert("삭제 확인", `"${eventTitle}" 일정을 삭제하시겠습니까?`, [
		{
			text: "취소",
			style: "cancel",
		},
		{
			text: "삭제",
			style: "destructive",
			onPress: async () => {
				try {
					console.log("일정 삭제 요청:", eventId);

					const response = await fetch(
						`${API_BASE_URL}/elderly/${ELDERLY_ID}/calendar/${eventId}`,
						{
							method: "DELETE",
						}
					);

					console.log("일정 삭제 응답 상태:", response.status);

					if (response.ok) {
						// 리스트에서 해당 일정 제거
						const updatedList = scheduleList.filter(
							(schedule) => schedule.id !== eventId
						);
						setScheduleList(updatedList);

						Alert.alert("성공", "일정이 삭제되었습니다.");
					} else {
						const errorText = await response.text();
						console.error("일정 삭제 오류 응답:", errorText);
						Alert.alert(
							"오류",
							`일정 삭제에 실패했습니다.\n상태: ${response.status}`
						);
					}
				} catch (error) {
					console.error("Delete schedule error:", error);
					Alert.alert("오류", `서버 연결에 실패했습니다: ${error.message}`);
				}
			},
		},
	]);
};
import {
	View,
	Text,
	TextInput,
	Modal,
	TouchableOpacity,
	ScrollView,
	ActivityIndicator,
	Alert,
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

export default function ElderScheduleManager({ route }) {
	const { name, elderlyId } = route.params || {};
	const API_BASE_URL = "http://18.205.227.28:8080";
	const ELDERLY_ID = elderlyId && elderlyId !== undefined ? elderlyId : 7;

	const [modalVisible, setModalVisible] = useState(false);
	const [editModalVisible, setEditModalVisible] = useState(false);
	const [editingEvent, setEditingEvent] = useState(null);
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [selectedDate, setSelectedDate] = useState(new Date());
	const [eventTime, setEventTime] = useState("09:00");
	const [notificationTimes, setNotificationTimes] = useState(["08:30"]);
	const [scheduleList, setScheduleList] = useState([]);
	const [loading, setLoading] = useState(false);
	const [refreshing, setRefreshing] = useState(false);
	const [currentMonth, setCurrentMonth] = useState(new Date());
	const navigation = useNavigation();

	console.log("ElderSchedule - 받은 elderlyId:", elderlyId);
	console.log("ElderSchedule - 사용할 ELDERLY_ID:", ELDERLY_ID);

	// 컴포넌트 마운트시 스케줄 목록 불러오기
	useEffect(() => {
		requestNotificationPermissions();
		fetchSchedulesForMonth();
	}, [currentMonth]); // currentMonth가 변경될 때마다 데이터 다시 로드

	// 알림 권한 요청
	const requestNotificationPermissions = async () => {
		const { status } = await Notifications.requestPermissionsAsync();
		if (status !== "granted") {
			Alert.alert("알림 권한", "일정 알림을 받으려면 알림 권한이 필요합니다.");
		}
	};

	// 달력 생성 함수
	const generateCalendar = () => {
		const year = currentMonth.getFullYear();
		const month = currentMonth.getMonth();
		const firstDay = new Date(year, month, 1);
		const lastDay = new Date(year, month + 1, 0);
		const startDate = new Date(firstDay);
		startDate.setDate(startDate.getDate() - firstDay.getDay());

		const days = [];
		const today = new Date();

		for (let i = 0; i < 42; i++) {
			const date = new Date(startDate);
			date.setDate(startDate.getDate() + i);

			const isCurrentMonth = date.getMonth() === month;
			const isToday =
				date.getFullYear() === today.getFullYear() &&
				date.getMonth() === today.getMonth() &&
				date.getDate() === today.getDate();
			const isSelected =
				date.getFullYear() === selectedDate.getFullYear() &&
				date.getMonth() === selectedDate.getMonth() &&
				date.getDate() === selectedDate.getDate();

			// 해당 날짜에 일정이 있는지 확인
			const hasEvent = scheduleList.some((schedule) => {
				const scheduleDate = new Date(schedule.eventTime);
				return (
					scheduleDate.getFullYear() === date.getFullYear() &&
					scheduleDate.getMonth() === date.getMonth() &&
					scheduleDate.getDate() === date.getDate()
				);
			});

			days.push({
				date,
				day: date.getDate(),
				isCurrentMonth,
				isToday,
				isSelected,
				hasEvent,
			});
		}

		return days;
	};

	// 이전 달로 이동
	const goToPreviousMonth = () => {
		const newMonth = new Date(
			currentMonth.getFullYear(),
			currentMonth.getMonth() - 1
		);
		setCurrentMonth(newMonth);
	};

	// 다음 달로 이동
	const goToNextMonth = () => {
		const newMonth = new Date(
			currentMonth.getFullYear(),
			currentMonth.getMonth() + 1
		);
		setCurrentMonth(newMonth);
	};

	// 날짜 선택
	const selectDate = (date) => {
		setSelectedDate(date);
	};

	// 월별 스케줄 목록 불러오기 (새로운 API 사용)
	const fetchSchedulesForMonth = async () => {
		setRefreshing(true);
		try {
			const year = currentMonth.getFullYear();
			const month = String(currentMonth.getMonth() + 1).padStart(2, "0"); // 1월=01, 12월=12

			console.log(
				"월별 API 호출 시작:",
				`${API_BASE_URL}/elderly/${ELDERLY_ID}/calendar/month?year=${year}&month=${month}`
			);

			const response = await fetch(
				`${API_BASE_URL}/elderly/${ELDERLY_ID}/calendar/month?year=${year}&month=${month}`
			);

			console.log("응답 상태:", response.status);

			if (response.ok) {
				const result = await response.json();
				console.log("서버 응답 데이터:", result);

				const schedules = result.data || [];
				console.log("추출된 스케줄 목록:", schedules);

				setScheduleList(schedules);

				if (schedules.length > 0) {
					console.log(`${schedules.length}개의 일정을 불러왔습니다.`);
				}
			} else {
				const errorText = await response.text();
				console.error("API 오류 응답:", errorText);
				Alert.alert(
					"오류",
					`일정 목록을 불러오는데 실패했습니다.\n상태: ${response.status}`
				);
			}
		} catch (error) {
			console.error("Fetch schedules error:", error);
			Alert.alert("오류", `서버 연결에 실패했습니다:\n${error.message}`);
			setScheduleList([]);
		} finally {
			setRefreshing(false);
		}
	};

	// 일정 알림 스케줄링
	const scheduleNotificationsForEvent = async (event) => {
		try {
			console.log(`일정 알림 스케줄링 시도: ${event.title}`);

			if (!event.notificationEnabled || !event.notificationTimes) {
				console.log("알림이 비활성화되어 있거나 시간이 설정되지 않음");
				return;
			}

			const eventDate = new Date(event.eventTime);

			for (const time of event.notificationTimes) {
				const [hours, minutes] = time.split(":").map(Number);

				const notificationDate = new Date(eventDate);
				notificationDate.setHours(hours, minutes, 0, 0);

				// 과거 시간이면 스킵
				if (notificationDate < new Date()) {
					console.log(`과거 시간이므로 스킵: ${time}`);
					continue;
				}

				await Notifications.scheduleNotificationAsync({
					content: {
						title: `📅 일정 알림`,
						body: `${event.title} - ${event.description}`,
						data: { eventId: event.id, eventTitle: event.title },
					},
					trigger: notificationDate,
					identifier: `event_${event.id}_${time}`,
				});

				console.log(
					`일정 알림 스케줄됨: ${
						event.title
					} - ${notificationDate.toLocaleString()}`
				);
			}
		} catch (error) {
			console.error("일정 알림 스케줄링 오류:", error);
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
		setTitle("");
		setDescription("");
		setEventTime("09:00");
		setNotificationTimes(["08:30"]);
	};

	// 일정 추가하기
	const handleAddSchedule = async () => {
		if (!title.trim() || !description.trim()) {
			Alert.alert("알림", "제목과 내용을 모두 입력해주세요.");
			return;
		}

		// 선택된 날짜와 시간을 조합하여 ISO 문자열 생성
		const eventDateTime = new Date(selectedDate);
		const [hours, minutes] = eventTime.split(":").map(Number);
		eventDateTime.setHours(hours, minutes, 0, 0);

		setLoading(true);
		try {
			const eventData = {
				title: title.trim(),
				description: description.trim(),
				eventTime: eventDateTime.toISOString(),
				notificationEnabled: true,
				notificationTimes: notificationTimes,
			};

			console.log("일정 추가 요청 데이터:", eventData);

			const response = await fetch(
				`${API_BASE_URL}/elderly/${ELDERLY_ID}/calendar`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(eventData),
				}
			);

			console.log("일정 추가 응답 상태:", response.status);

			if (response.ok) {
				const result = await response.json();
				console.log("일정 추가 응답 데이터:", result);

				const newEvent = result.data || result;
				setScheduleList([...scheduleList, newEvent]);

				// 새로 추가된 일정에 대해 알림 스케줄링
				await scheduleNotificationsForEvent(newEvent);

				resetForm();
				setModalVisible(false);
				Alert.alert("성공", "일정이 성공적으로 추가되었습니다.");

				// 현재 월의 데이터 다시 로드
				fetchSchedulesForMonth();
			} else {
				const errorText = await response.text();
				console.error("일정 추가 오류 응답:", errorText);
				Alert.alert(
					"오류",
					`일정 추가에 실패했습니다.\n상태: ${response.status}`
				);
			}
		} catch (error) {
			console.error("Add schedule error:", error);
			Alert.alert("오류", `서버 연결에 실패했습니다: ${error.message}`);
		} finally {
			setLoading(false);
		}
	};

	// 새로고침
	const openEditModal = (event) => {
		setEditingEvent(event);
		setTitle(event.title);
		setDescription(event.description);

		const eventDate = new Date(event.eventTime);
		setSelectedDate(eventDate);
		setEventTime(eventDate.toTimeString().slice(0, 5));
		setNotificationTimes(event.notificationTimes || ["08:30"]);
		setEditModalVisible(true);
	};
	// 선택된 날짜의 일정들 가져오기
	const getEventsForSelectedDate = () => {
		return scheduleList.filter((schedule) => {
			const scheduleDate = new Date(schedule.eventTime);
			return (
				scheduleDate.getFullYear() === selectedDate.getFullYear() &&
				scheduleDate.getMonth() === selectedDate.getMonth() &&
				scheduleDate.getDate() === selectedDate.getDate()
			);
		});
	};

	const monthNames = [
		"1월",
		"2월",
		"3월",
		"4월",
		"5월",
		"6월",
		"7월",
		"8월",
		"9월",
		"10월",
		"11월",
		"12월",
	];
	const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
	const handleBack = () => {
		navigation.goBack();
	};
	return (
		<LinearGradient colors={["#123", "#000"]} style={{ flex: 1 }}>
			<View style={styles.headerback}>
				<TouchableOpacity onPress={handleBack} style={{ marginTop: 50 }}>
					<Text style={{ color: "white", fontSize: 20 }}>{`←`}</Text>
				</TouchableOpacity>
			</View>
			<ScrollView>
				<View style={{ flex: 1 }}>
					<View style={EUI.styles.containerschedule}>
						{/*<Text style={EUI.styles.h1}>{name}님의 스케줄</Text>*/}
					</View>

					<View style={EUI.styles.secondcontainer}>
						{/* 달력 헤더 */}
						<View style={styles.calendarHeader}>
							<TouchableOpacity
								onPress={goToPreviousMonth}
								style={styles.navButton}
							>
								<Text style={styles.navButtonText}>◀</Text>
							</TouchableOpacity>
							<Text style={styles.monthText}>
								{currentMonth.getFullYear()}년{" "}
								{monthNames[currentMonth.getMonth()]}
							</Text>
							<TouchableOpacity
								onPress={goToNextMonth}
								style={styles.navButton}
							>
								<Text style={styles.navButtonText}>▶</Text>
							</TouchableOpacity>
						</View>
						<TouchableOpacity
							style={EUI.styles.addEventButton}
							onPress={() => setModalVisible(true)}
						>
							<Text style={EUI.styles.addEventButtonText}>일정 추가</Text>
						</TouchableOpacity>

						{/* 요일 헤더 */}
						<View style={styles.weekHeader}>
							{dayNames.map((day, index) => (
								<Text
									key={index}
									style={[
										styles.dayHeaderText,
										index === 0 && { color: "#ff6b6b" },
									]}
								>
									{day}
								</Text>
							))}
						</View>

						{/* 달력 그리드 */}
						<View style={styles.calendarGrid}>
							{generateCalendar().map((day, index) => (
								<TouchableOpacity
									key={index}
									style={[
										styles.dayCell,
										!day.isCurrentMonth && styles.otherMonthDay,
										day.isToday && styles.todayCell,
										day.isSelected && styles.selectedCell,
									]}
									onPress={() => day.isCurrentMonth && selectDate(day.date)}
								>
									<Text
										style={[
											styles.dayText,
											!day.isCurrentMonth && styles.otherMonthText,
											day.isToday && styles.todayText,
											day.isSelected && styles.selectedText,
											index % 7 === 0 && styles.sundayText,
										]}
									>
										{day.day}
									</Text>
									{day.hasEvent && <View style={styles.eventDot} />}
								</TouchableOpacity>
							))}
						</View>

						{/* 선택된 날짜의 일정 목록 */}
						<View style={styles.eventsSection}>
							<Text style={styles.eventsSectionTitle}>
								{selectedDate.getMonth() + 1}월 {selectedDate.getDate()}일 일정
							</Text>
							<ScrollView style={styles.eventsScrollView}>
								{getEventsForSelectedDate().length === 0 ? (
									<Text style={styles.noEventsText}>
										이 날에는 일정이 없습니다.
									</Text>
								) : (
									getEventsForSelectedDate().map((event, index) => (
										<View key={event.id || index} style={styles.eventCard}>
											<View style={styles.buttonRow}>
												<TouchableOpacity
													style={styles.editButton}
													onPress={() => openEditModal(event)}
												>
													<Text style={styles.editButtonText}>수정</Text>
												</TouchableOpacity>
												<TouchableOpacity
													style={styles.deleteButton}
													onPress={() =>
														handleDeleteSchedule(event.id, event.title)
													}
												>
													<Text style={styles.deleteButtonText}>삭제</Text>
												</TouchableOpacity>
											</View>
											<Text style={styles.eventTitle}>{event.title}</Text>
											<Text style={styles.eventDescription}>
												{event.description}
											</Text>
											<Text style={styles.eventTime}>
												{new Date(event.eventTime).toLocaleTimeString("ko-KR", {
													hour: "2-digit",
													minute: "2-digit",
												})}
											</Text>
											{event.notificationEnabled && event.notificationTimes && (
												<Text style={styles.eventNotification}>
													🔔 알림: {event.notificationTimes.join(", ")}
												</Text>
											)}
										</View>
									))
								)}
							</ScrollView>
						</View>
					</View>

					{/* 일정 추가 모달 */}
					<Modal
						animationType="slide"
						transparent={true}
						visible={modalVisible}
						onRequestClose={() => setModalVisible(false)}
					>
						<View style={EUI.styles.modalOverlay}>
							<View style={EUI.styles.modalContainer}>
								<Text style={EUI.styles.modalTitle}>일정 추가</Text>

								{/* 제목 */}
								<TextInput
									style={EUI.styles.input}
									placeholder="일정 제목"
									placeholderTextColor="rgba(255,255,255,0.5)"
									value={title}
									onChangeText={setTitle}
									editable={!loading}
								/>

								{/* 내용 */}
								<TextInput
									style={[EUI.styles.input, { height: 60 }]}
									placeholder="일정 내용"
									placeholderTextColor="rgba(255,255,255,0.5)"
									value={description}
									onChangeText={setDescription}
									multiline
									editable={!loading}
								/>

								{/* 선택된 날짜 표시 */}
								<Text style={{ color: "white", fontSize: 16, marginBottom: 8 }}>
									날짜: {selectedDate.getFullYear()}년{" "}
									{selectedDate.getMonth() + 1}월 {selectedDate.getDate()}일
								</Text>

								{/* 시간 */}
								<Text style={{ color: "white", fontSize: 16, marginBottom: 8 }}>
									시간
								</Text>
								<TextInput
									style={EUI.styles.input}
									placeholder="09:00"
									placeholderTextColor="rgba(255,255,255,0.5)"
									value={eventTime}
									onChangeText={setEventTime}
									editable={!loading}
								/>

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
											+ 알림 시간 추가
										</Text>
									</TouchableOpacity>
								</ScrollView>

								<View style={EUI.styles.modalButtonRow}>
									<TouchableOpacity
										style={[
											EUI.styles.modalButton,
											loading && { backgroundColor: "#888" },
										]}
										onPress={handleAddSchedule}
										disabled={loading}
									>
										{loading ? (
											<ActivityIndicator size="small" color="white" />
										) : (
											<Text style={EUI.styles.modalButtonText}>추가</Text>
										)}
									</TouchableOpacity>
									<TouchableOpacity
										style={[
											EUI.styles.modalButton,
											{ backgroundColor: "#aaa" },
										]}
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

					{/* 일정 수정 모달 */}
					<Modal
						animationType="slide"
						transparent={true}
						visible={editModalVisible}
						onRequestClose={() => setEditModalVisible(false)}
					>
						<View style={EUI.styles.modalOverlay}>
							<View style={EUI.styles.modalContainer}>
								<Text style={EUI.styles.modalTitle}>일정 수정</Text>

								{/* 제목 */}
								<TextInput
									style={EUI.styles.input}
									placeholder="일정 제목"
									placeholderTextColor="rgba(255,255,255,0.5)"
									value={title}
									onChangeText={setTitle}
									editable={!loading}
								/>

								{/* 내용 */}
								<TextInput
									style={[EUI.styles.input, { height: 60 }]}
									placeholder="일정 내용"
									placeholderTextColor="rgba(255,255,255,0.5)"
									value={description}
									onChangeText={setDescription}
									multiline
									editable={!loading}
								/>

								{/* 선택된 날짜 표시 */}
								<Text style={{ color: "white", fontSize: 16, marginBottom: 8 }}>
									날짜: {selectedDate.getFullYear()}년{" "}
									{selectedDate.getMonth() + 1}월 {selectedDate.getDate()}일
								</Text>

								{/* 시간 */}
								<Text style={{ color: "white", fontSize: 16, marginBottom: 8 }}>
									시간
								</Text>
								<TextInput
									style={EUI.styles.input}
									placeholder="09:00"
									placeholderTextColor="rgba(255,255,255,0.5)"
									value={eventTime}
									onChangeText={setEventTime}
									editable={!loading}
								/>

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
											+ 알림 시간 추가
										</Text>
									</TouchableOpacity>
								</ScrollView>

								<View style={EUI.styles.modalButtonRow}>
									<TouchableOpacity
										style={[
											EUI.styles.modalButton,
											loading && { backgroundColor: "#888" },
										]}
										onPress={handleUpdateSchedule}
										disabled={loading}
									>
										{loading ? (
											<ActivityIndicator size="small" color="white" />
										) : (
											<Text style={EUI.styles.modalButtonText}>수정</Text>
										)}
									</TouchableOpacity>
									<TouchableOpacity
										style={[
											EUI.styles.modalButton,
											{ backgroundColor: "#aaa" },
										]}
										onPress={() => {
											setEditModalVisible(false);
											setEditingEvent(null); // 먼저 초기화
											resetForm(); // 그 다음 폼 리셋
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
			</ScrollView>
		</LinearGradient>
	);
}

const styles = {
	headerback: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingTop: 20,
		paddingHorizontal: 20,
		marginBottom: 20,
	},
	calendarHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 20,
		paddingHorizontal: 20,
	},
	navButton: {
		padding: 10,
	},
	navButtonText: {
		color: "white",
		fontSize: 18,
		fontWeight: "bold",
	},
	monthText: {
		color: "white",
		fontSize: 20,
		fontWeight: "bold",
	},
	weekHeader: {
		flexDirection: "row",
		marginBottom: 10,
	},
	dayHeaderText: {
		flex: 1,
		textAlign: "center",
		color: "rgba(255, 255, 255, 0.8)",
		fontSize: 14,
		fontWeight: "bold",
	},
	calendarGrid: {
		flexDirection: "row",
		flexWrap: "wrap",
		marginBottom: 20,
	},
	dayCell: {
		width: "14.28%",
		height: 50,
		justifyContent: "center",
		alignItems: "center",
		position: "relative",
	},
	dayText: {
		color: "white",
		fontSize: 16,
	},
	otherMonthDay: {
		opacity: 0.3,
	},
	otherMonthText: {
		color: "rgba(255, 255, 255, 0.3)",
	},
	todayCell: {
		backgroundColor: "rgba(76, 175, 80, 0.3)",
		borderRadius: 25,
	},
	todayText: {
		fontWeight: "bold",
		color: "#4CAF50",
	},
	selectedCell: {
		backgroundColor: "rgba(33, 150, 243, 0.5)",
		borderRadius: 25,
	},
	selectedText: {
		fontWeight: "bold",
		color: "#2196F3",
	},
	sundayText: {
		color: "#ff6b6b",
	},
	eventDot: {
		position: "absolute",
		bottom: 5,
		width: 6,
		height: 6,
		borderRadius: 3,
		backgroundColor: "#FF9800",
	},
	eventsSection: {
		flex: 1,
		marginTop: 15,
		backgroundColor: "rgba(255, 255, 255, 0.05)",
		borderRadius: 15,
		padding: 15,
	},
	eventsSectionTitle: {
		color: "white",
		fontSize: 18,
		fontWeight: "bold",
		marginBottom: 15,
		textAlign: "center",
		paddingBottom: 10,
		borderBottomWidth: 1,
		borderBottomColor: "rgba(255, 255, 255, 0.2)",
	},
	eventsScrollView: {
		flex: 1,
	},
	noEventsText: {
		color: "rgba(255, 255, 255, 0.6)",
		textAlign: "center",
		marginTop: 30,
		fontSize: 16,
		fontStyle: "italic",
		minWidth: 300,
		minHeight: 60,
	},
	eventCard: {
		backgroundColor: "rgba(255, 255, 255, 0.12)",
		padding: 10,
		borderRadius: 12,
		marginBottom: 18,
		paddingBottom: 12,
		borderLeftWidth: 4,
		borderLeftColor: "#4CAF50",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
		width: 300,
		gap: 5,
	},
	eventCardHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "flex-start",
		marginBottom: 8,
	},
	eventTitle: {
		color: "white",
		fontSize: 17,
		fontWeight: "bold",
		flex: 1,
		marginRight: 10,
		lineHeight: 18,
	},
	buttonRow: {
		flexDirection: "row",
		gap: 5,
		justifyContent: "flex-end",
	},
	editButton: {
		backgroundColor: "rgba(33, 150, 243, 0.2)",
		paddingHorizontal: 10,
		paddingVertical: 6,
		borderRadius: 8,
		minWidth: 40,
		alignItems: "center",
	},
	editButtonText: {
		color: "#2196F3",
		fontSize: 12,
		fontWeight: "bold",
	},
	deleteButton: {
		backgroundColor: "rgba(255, 82, 82, 0.2)",
		paddingHorizontal: 10,
		paddingVertical: 6,
		borderRadius: 8,
		minWidth: 40,
		alignItems: "center",
	},
	deleteButtonText: {
		color: "#ff5252",
		fontSize: 12,
		fontWeight: "bold",
	},
	eventDescription: {
		color: "rgba(255, 255, 255, 0.85)",
		fontSize: 15,
		marginBottom: 10,
		lineHeight: 20,
	},
	eventInfoRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginTop: 5,
	},
	eventTime: {
		color: "#81C784",
		fontSize: 14,
		fontWeight: "600",
		backgroundColor: "rgba(129, 199, 132, 0.15)",
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 8,
	},
	eventNotification: {
		color: "#FFB74D",
		fontSize: 12,
		backgroundColor: "rgba(255, 183, 77, 0.15)",
		paddingHorizontal: 6,
		paddingVertical: 3,
		borderRadius: 6,
		fontWeight: "500",
	},
};
