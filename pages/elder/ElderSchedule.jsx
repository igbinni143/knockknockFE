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
import * as EUI from "../elder/UI/EpillUI";
import { useNavigation } from "@react-navigation/native";

// 알림 핸들러 설정
Notifications.setNotificationHandler({
	handleNotification: async () => ({
		shouldShowAlert: true,
		shouldPlaySound: true,
		shouldSetBadge: false,
	}),
});

export default function ElderSchedule({ route }) {
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
	const [currentWeekStart, setCurrentWeekStart] = useState(
		getCustomWeekStart(new Date())
	);
	const navigation = useNavigation();

	console.log("ElderSchedule - 받은 elderlyId:", elderlyId);
	console.log("ElderSchedule - 사용할 ELDERLY_ID:", ELDERLY_ID);

	// 오늘 기준 하루 전날부터 시작하는 주의 시작일 구하기
	function getCustomWeekStart(date) {
		const d = new Date(date);
		// 오늘에서 하루를 빼서 어제부터 시작
		d.setDate(d.getDate() - 1);
		return d;
	}

	// 주의 시작일 구하기 (일요일 기준 - 달력용)
	function getWeekStart(date) {
		const d = new Date(date);
		const day = d.getDay();
		const diff = d.getDate() - day;
		return new Date(d.setDate(diff));
	}

	// 날짜 포맷팅 (YYYY-MM-DD)
	function formatDate(date) {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, "0");
		const day = String(date.getDate()).padStart(2, "0");
		return `${year}-${month}-${day}`;
	}

	// 주간 날짜들 생성 (오늘 기준 하루 전날부터 7일)
	function generateWeekDays() {
		const days = [];
		const today = new Date();

		for (let i = 0; i < 7; i++) {
			const date = new Date(currentWeekStart);
			date.setDate(currentWeekStart.getDate() + i);

			const isToday =
				date.getFullYear() === today.getFullYear() &&
				date.getMonth() === today.getMonth() &&
				date.getDate() === today.getDate();

			const isSelected =
				date.getFullYear() === selectedDate.getFullYear() &&
				date.getMonth() === selectedDate.getMonth() &&
				date.getDate() === selectedDate.getDate();

			// 해당 날짜에 일정이 있는지 확인
			const dayEvents = scheduleList.filter((schedule) => {
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
				dayName: ["일", "월", "화", "수", "목", "금", "토"][date.getDay()],
				isToday,
				isSelected,
				events: dayEvents,
			});
		}

		return days;
	}

	// 달력용 주간 날짜들 생성 (일요일부터)
	function generateCalendarWeekDays() {
		const days = [];
		const today = new Date();
		const calendarWeekStart = getWeekStart(currentWeekStart);

		for (let i = 0; i < 7; i++) {
			const date = new Date(calendarWeekStart);
			date.setDate(calendarWeekStart.getDate() + i);

			const isToday =
				date.getFullYear() === today.getFullYear() &&
				date.getMonth() === today.getMonth() &&
				date.getDate() === today.getDate();

			const isSelected =
				date.getFullYear() === selectedDate.getFullYear() &&
				date.getMonth() === selectedDate.getMonth() &&
				date.getDate() === selectedDate.getDate();

			// 해당 날짜에 일정이 있는지 확인
			const dayEvents = scheduleList.filter((schedule) => {
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
				dayName: ["일", "월", "화", "수", "목", "금", "토"][date.getDay()],
				isToday,
				isSelected,
				events: dayEvents,
			});
		}

		return days;
	}

	// 컴포넌트 마운트시 스케줄 목록 불러오기
	useEffect(() => {
		requestNotificationPermissions();
		fetchSchedulesForWeek();
	}, [currentWeekStart]);

	// 알림 권한 요청
	const requestNotificationPermissions = async () => {
		const { status } = await Notifications.requestPermissionsAsync();
		if (status !== "granted") {
			Alert.alert("알림 권한", "일정 알림을 받으려면 알림 권한이 필요합니다.");
		}
	};

	// 이전 주로 이동
	const goToPreviousWeek = () => {
		const newWeekStart = new Date(currentWeekStart);
		newWeekStart.setDate(currentWeekStart.getDate() - 7);
		setCurrentWeekStart(newWeekStart);
	};

	// 다음 주로 이동
	const goToNextWeek = () => {
		const newWeekStart = new Date(currentWeekStart);
		newWeekStart.setDate(currentWeekStart.getDate() + 7);
		setCurrentWeekStart(newWeekStart);
	};

	// 오늘로 돌아가기
	const goToToday = () => {
		const today = new Date();
		setCurrentWeekStart(getCustomWeekStart(today));
		setSelectedDate(today);
	};

	// 날짜 선택
	const selectDate = (date) => {
		setSelectedDate(date);
	};

	// 주간 스케줄 목록 불러오기
	const fetchSchedulesForWeek = async () => {
		setRefreshing(true);
		try {
			const dateStr = formatDate(currentWeekStart);

			console.log(
				"주간 API 호출 시작:",
				`${API_BASE_URL}/elderly/${ELDERLY_ID}/calendar/week?date=${dateStr}`
			);

			const response = await fetch(
				`${API_BASE_URL}/elderly/${ELDERLY_ID}/calendar/week?date=${dateStr}`
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

	// 일정 수정 모달 열기
	const openEditModal = (event) => {
		setEditingEvent(event);
		setTitle(event.title);
		setDescription(event.description);

		const eventDate = new Date(event.eventTime);
		setSelectedDate(eventDate);
		setEventTime(
			eventDate.toLocaleTimeString("ko-KR", {
				hour: "2-digit",
				minute: "2-digit",
				hour12: false,
			})
		);
		setNotificationTimes(event.notificationTimes || ["08:30"]);
		setEditModalVisible(true);
	};

	// 일정 수정하기
	const handleUpdateSchedule = async () => {
		if (!title.trim() || !description.trim()) {
			Alert.alert("알림", "제목과 내용을 모두 입력해주세요.");
			return;
		}

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

				resetForm();
				setEditModalVisible(false);
				setEditingEvent(null);
				Alert.alert("성공", "일정이 수정되었습니다.");

				fetchSchedulesForWeek();
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
							Alert.alert("성공", "일정이 삭제되었습니다.");
							fetchSchedulesForWeek();
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
				await scheduleNotificationsForEvent(newEvent);

				resetForm();
				setModalVisible(false);
				Alert.alert("성공", "일정이 성공적으로 추가되었습니다.");

				fetchSchedulesForWeek();
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
			<ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
				<View style={styles.container}>
					<Text style={styles.header}>{name}님의 일정</Text>

					{/* 주간 네비게이션 */}
					<View style={styles.weekNavigation}>
						<TouchableOpacity
							onPress={goToPreviousWeek}
							style={styles.navButton}
						>
							<Text style={styles.navButtonText}>◀ 이전</Text>
						</TouchableOpacity>

						<TouchableOpacity onPress={goToToday} style={styles.todayButton}>
							<Text style={styles.todayButtonText}>오늘</Text>
						</TouchableOpacity>

						<TouchableOpacity onPress={goToNextWeek} style={styles.navButton}>
							<Text style={styles.navButtonText}>다음 ▶</Text>
						</TouchableOpacity>
					</View>

					{/* 주간 달력 */}
					<View style={styles.weekCalendar}>
						<View style={styles.weekCalendarHeader}>
							{["일", "월", "화", "수", "목", "금", "토"].map((day, index) => (
								<Text
									key={index}
									style={[
										styles.weekDayName,
										index === 0 && { color: "#ff6b6b" },
									]}
								>
									{day}
								</Text>
							))}
						</View>
						<View style={styles.weekCalendarDays}>
							{generateCalendarWeekDays().map((day, index) => (
								<TouchableOpacity
									key={index}
									style={[
										styles.weekDayCell,
										day.isToday && styles.weekTodayCell,
										day.isSelected && styles.weekSelectedCell,
									]}
									onPress={() => selectDate(day.date)}
								>
									<Text
										style={[
											styles.weekDayNumber,
											day.isToday && styles.weekTodayText,
											day.isSelected && styles.weekSelectedText,
											index === 0 && styles.weekSundayText,
										]}
									>
										{day.day}
									</Text>
									{day.events.length > 0 && (
										<View style={styles.weekEventDot} />
									)}
								</TouchableOpacity>
							))}
						</View>
					</View>

					{/* 일정 추가 버튼 */}
					<TouchableOpacity
						style={styles.addButton}
						onPress={() => setModalVisible(true)}
					>
						<Text style={styles.addButtonText}>+ 새 일정 추가</Text>
					</TouchableOpacity>

					{/* 주간 일정 목록 */}
					<View style={styles.weekContainer}>
						{generateWeekDays().map((day, index) => (
							<View key={index} style={styles.dayContainer}>
								{/* 날짜 헤더 */}
								<TouchableOpacity
									style={[
										styles.dayHeader,
										day.isToday && styles.todayHeader,
										day.isSelected && styles.selectedHeader,
									]}
									onPress={() => selectDate(day.date)}
								>
									<Text
										style={[
											styles.dayName,
											day.isToday && styles.todayText,
											day.isSelected && styles.selectedText,
											index === 0 && styles.sundayText,
										]}
									>
										{day.dayName}
									</Text>
									<Text
										style={[
											styles.dayNumber,
											day.isToday && styles.todayText,
											day.isSelected && styles.selectedText,
										]}
									>
										{day.day}
									</Text>
								</TouchableOpacity>

								{/* 해당 날짜의 일정들 */}
								<View style={styles.eventsContainer}>
									{day.events.length === 0
										? ""
										: day.events.map((event, eventIndex) => (
												<View
													key={event.id || eventIndex}
													style={styles.eventItem}
												>
													<View style={styles.eventHeader}>
														<View style={styles.eventTitleContainer}>
															<Text style={styles.eventTitle} numberOfLines={2}>
																{event.title}
															</Text>
															<Text style={styles.eventTime}>
																{new Date(event.eventTime).toLocaleTimeString(
																	"ko-KR",
																	{
																		hour: "2-digit",
																		minute: "2-digit",
																	}
																)}
															</Text>
														</View>
														<View style={styles.eventButtonRow}>
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
																<Text style={styles.deleteButtonText}>
																	삭제
																</Text>
															</TouchableOpacity>
														</View>
													</View>
												</View>
										  ))}
								</View>
							</View>
						))}
					</View>
				</View>

				{/* 일정 추가 모달 */}
				<Modal
					animationType="slide"
					transparent={true}
					visible={modalVisible}
					onRequestClose={() => setModalVisible(false)}
				>
					<View style={styles.modalOverlay}>
						<View style={styles.modalContainer}>
							<Text style={styles.modalTitle}>새 일정 추가</Text>

							<TextInput
								style={styles.input}
								placeholder="일정 제목"
								placeholderTextColor="rgba(255,255,255,0.5)"
								value={title}
								onChangeText={setTitle}
								editable={!loading}
							/>

							<TextInput
								style={[styles.input, { height: 80 }]}
								placeholder="일정 내용"
								placeholderTextColor="rgba(255,255,255,0.5)"
								value={description}
								onChangeText={setDescription}
								multiline
								editable={!loading}
							/>

							<Text style={styles.modalLabel}>
								날짜: {selectedDate.getFullYear()}년{" "}
								{selectedDate.getMonth() + 1}월 {selectedDate.getDate()}일
							</Text>

							<Text style={styles.modalLabel}>시간</Text>
							<TextInput
								style={styles.input}
								placeholder="09:00"
								placeholderTextColor="rgba(255,255,255,0.5)"
								value={eventTime}
								onChangeText={setEventTime}
								editable={!loading}
							/>

							<Text style={styles.modalLabel}>알림 시간</Text>
							<ScrollView style={{ maxHeight: 150, marginBottom: 20 }}>
								{notificationTimes.map((time, index) => (
									<View key={index} style={styles.notificationRow}>
										<TextInput
											style={[
												styles.input,
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
												style={styles.removeButton}
											>
												<Text style={styles.removeButtonText}>✕</Text>
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

							<View style={styles.modalButtonRow}>
								<TouchableOpacity
									style={[
										styles.modalButton,
										loading && { backgroundColor: "#666" },
									]}
									onPress={handleAddSchedule}
									disabled={loading}
								>
									{loading ? (
										<ActivityIndicator size="small" color="white" />
									) : (
										<Text style={styles.modalButtonText}>추가</Text>
									)}
								</TouchableOpacity>
								<TouchableOpacity
									style={[styles.modalButton, { backgroundColor: "#666" }]}
									onPress={() => {
										setModalVisible(false);
										resetForm();
									}}
									disabled={loading}
								>
									<Text style={styles.modalButtonText}>취소</Text>
								</TouchableOpacity>
							</View>
						</View>
					</View>
				</Modal>

				<Modal
					animationType="slide"
					transparent={true}
					visible={editModalVisible}
					onRequestClose={() => setEditModalVisible(false)}
				>
					<View style={styles.modalOverlay}>
						<View style={styles.modalContainer}>
							<Text style={styles.modalTitle}>일정 수정</Text>

							<TextInput
								style={styles.input}
								placeholder="일정 제목"
								placeholderTextColor="rgba(255,255,255,0.5)"
								value={title}
								onChangeText={setTitle}
								editable={!loading}
							/>

							<TextInput
								style={[styles.input, { height: 80 }]}
								placeholder="일정 내용"
								placeholderTextColor="rgba(255,255,255,0.5)"
								value={description}
								onChangeText={setDescription}
								multiline
								editable={!loading}
							/>

							<Text style={styles.modalLabel}>
								날짜: {selectedDate.getFullYear()}년{" "}
								{selectedDate.getMonth() + 1}월 {selectedDate.getDate()}일
							</Text>

							<Text style={styles.modalLabel}>시간</Text>
							<TextInput
								style={styles.input}
								placeholder="09:00 (시:분)"
								placeholderTextColor="rgba(255,255,255,0.5)"
								value={eventTime}
								onChangeText={setEventTime}
								editable={!loading}
							/>

							<Text style={styles.modalLabel}>알림 시간</Text>
							<ScrollView style={{ maxHeight: 150, marginBottom: 20 }}>
								{notificationTimes.map((time, index) => (
									<View key={index} style={styles.notificationRow}>
										<TextInput
											style={[
												styles.input,
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
												style={styles.removeButton}
											>
												<Text style={styles.removeButtonText}>✕</Text>
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

							<View style={styles.modalButtonRow}>
								<TouchableOpacity
									style={[
										styles.modalButton,
										loading && { backgroundColor: "#666" },
									]}
									onPress={handleUpdateSchedule}
									disabled={loading}
								>
									{loading ? (
										<ActivityIndicator size="small" color="white" />
									) : (
										<Text style={styles.modalButtonText}>수정</Text>
									)}
								</TouchableOpacity>
								<TouchableOpacity
									style={[styles.modalButton, { backgroundColor: "#666" }]}
									onPress={() => {
										setEditModalVisible(false);
										setEditingEvent(null);
										resetForm();
									}}
									disabled={loading}
								>
									<Text style={styles.modalButtonText}>취소</Text>
								</TouchableOpacity>
							</View>
						</View>
					</View>
				</Modal>
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
	},

	container: {
		flex: 1,
		padding: 20,
	},
	header: {
		color: "white",
		fontSize: 28,
		fontWeight: "bold",
		textAlign: "center",
		marginBottom: 25,
	},
	weekNavigation: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 25,
		paddingHorizontal: 10,
	},
	navButton: {
		backgroundColor: "rgba(255, 255, 255, 0.15)",
		paddingHorizontal: 20,
		paddingVertical: 12,
		borderRadius: 12,
	},
	navButtonText: {
		color: "white",
		fontSize: 16,
		fontWeight: "bold",
	},
	todayButton: {
		backgroundColor: "#4CAF50",
		paddingHorizontal: 25,
		paddingVertical: 12,
		borderRadius: 12,
	},
	todayButtonText: {
		color: "white",
		fontSize: 16,
		fontWeight: "bold",
	},
	addButton: {
		backgroundColor: "#4CAF50",
		paddingVertical: 15,
		borderRadius: 15,
		marginBottom: 25,
		alignItems: "center",
	},
	addButtonText: {
		color: "white",
		fontSize: 18,
		fontWeight: "bold",
	},
	weekContainer: {
		gap: 15,
	},
	dayContainer: {
		backgroundColor: "rgba(255, 255, 255, 0.08)",
		borderRadius: 15,
		padding: 15,
		marginBottom: 10,
	},
	dayHeader: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingVertical: 12,
		paddingHorizontal: 15,
		borderRadius: 10,
		marginBottom: 15,
		backgroundColor: "rgba(255, 255, 255, 0.05)",
	},
	todayHeader: {
		backgroundColor: "rgba(76, 175, 80, 0.3)",
	},
	selectedHeader: {
		backgroundColor: "rgba(33, 150, 243, 0.3)",
	},
	dayName: {
		color: "white",
		fontSize: 18,
		fontWeight: "bold",
	},
	dayNumber: {
		color: "white",
		fontSize: 22,
		fontWeight: "bold",
	},
	todayText: {
		color: "#4CAF50",
	},
	selectedText: {
		color: "#2196F3",
	},
	sundayText: {
		color: "#ff6b6b",
	},
	eventsContainer: {
		gap: 12,
	},
	noEventsText: {
		color: "rgba(255, 255, 255, 0.6)",
		fontSize: 16,
		textAlign: "center",
		fontStyle: "italic",
		paddingVertical: 20,
	},
	eventItem: {
		backgroundColor: "rgba(255, 255, 255, 0.12)",
		borderRadius: 12,
		padding: 15,
		borderLeftWidth: 4,
		borderLeftColor: "#4CAF50",
	},
	eventHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "flex-start",
		marginBottom: 10,
	},
	eventTitleContainer: {
		flex: 1,
		marginRight: 10,
	},
	eventTitle: {
		color: "white",
		fontSize: 18,
		fontWeight: "bold",
		marginBottom: 5,
		lineHeight: 22,
	},
	eventTime: {
		color: "#81C784",
		fontSize: 16,
		fontWeight: "600",
		backgroundColor: "rgba(129, 199, 132, 0.2)",
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 8,
		alignSelf: "flex-start",
	},
	eventButtonRow: {
		flexDirection: "row",
		gap: 8,
	},
	editButton: {
		backgroundColor: "rgba(33, 150, 243, 0.3)",
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderRadius: 8,
		minWidth: 50,
		alignItems: "center",
	},
	editButtonText: {
		color: "#2196F3",
		fontSize: 14,
		fontWeight: "bold",
	},
	deleteButton: {
		backgroundColor: "rgba(255, 82, 82, 0.3)",
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderRadius: 8,
		minWidth: 50,
		alignItems: "center",
	},
	deleteButtonText: {
		color: "#ff5252",
		fontSize: 14,
		fontWeight: "bold",
	},
	eventDescription: {
		color: "rgba(255, 255, 255, 0.85)",
		fontSize: 16,
		lineHeight: 22,
		marginBottom: 8,
	},
	eventNotification: {
		color: "#FFB74D",
		fontSize: 14,
		backgroundColor: "rgba(255, 183, 77, 0.2)",
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 6,
		alignSelf: "flex-start",
		fontWeight: "500",
	},
	weekCalendar: {
		backgroundColor: "rgba(255, 255, 255, 0.08)",
		borderRadius: 15,
		padding: 15,
		marginBottom: 20,
	},
	weekCalendarHeader: {
		flexDirection: "row",
		marginBottom: 10,
	},
	weekDayName: {
		flex: 1,
		textAlign: "center",
		color: "rgba(255, 255, 255, 0.8)",
		fontSize: 16,
		fontWeight: "bold",
	},
	weekCalendarDays: {
		flexDirection: "row",
	},
	weekDayCell: {
		flex: 1,
		height: 60,
		justifyContent: "center",
		alignItems: "center",
		margin: 2,
		borderRadius: 12,
		position: "relative",
	},
	weekTodayCell: {
		backgroundColor: "rgba(76, 175, 80, 0.3)",
	},
	weekSelectedCell: {
		backgroundColor: "rgba(33, 150, 243, 0.4)",
	},
	weekDayNumber: {
		color: "white",
		fontSize: 18,
		fontWeight: "bold",
	},
	weekTodayText: {
		color: "#4CAF50",
	},
	weekSelectedText: {
		color: "#2196F3",
	},
	weekSundayText: {
		color: "#ff6b6b",
	},
	weekEventDot: {
		position: "absolute",
		bottom: 8,
		width: 8,
		height: 8,
		borderRadius: 4,
		backgroundColor: "#FF9800",
	},
	// 모달 스타일
	modalOverlay: {
		flex: 1,
		backgroundColor: "rgba(0, 0, 0, 0.7)",
		justifyContent: "center",
		alignItems: "center",
	},
	modalContainer: {
		backgroundColor: "#1a1a2e",
		borderRadius: 20,
		padding: 25,
		margin: 20,
		maxHeight: "80%",
		width: "90%",
	},
	modalTitle: {
		color: "white",
		fontSize: 22,
		fontWeight: "bold",
		textAlign: "center",
		marginBottom: 25,
	},
	input: {
		backgroundColor: "rgba(255, 255, 255, 0.1)",
		borderRadius: 12,
		padding: 15,
		color: "white",
		fontSize: 16,
		marginBottom: 15,
		borderWidth: 1,
		borderColor: "rgba(255, 255, 255, 0.2)",
	},
	modalLabel: {
		color: "white",
		fontSize: 16,
		fontWeight: "bold",
		marginBottom: 8,
		marginTop: 5,
	},
	notificationRow: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 10,
	},
	removeButton: {
		backgroundColor: "rgba(255, 82, 82, 0.2)",
		borderRadius: 8,
		padding: 8,
		minWidth: 35,
		alignItems: "center",
	},
	removeButtonText: {
		color: "#ff5252",
		fontSize: 16,
		fontWeight: "bold",
	},
	addTimeButton: {
		backgroundColor: "rgba(33, 150, 243, 0.2)",
		paddingVertical: 12,
		borderRadius: 10,
		alignItems: "center",
		marginTop: 5,
	},
	addTimeButtonText: {
		color: "#2196F3",
		fontSize: 14,
		fontWeight: "bold",
	},
	modalButtonRow: {
		flexDirection: "row",
		justifyContent: "space-around",
		marginTop: 20,
		gap: 15,
	},
	modalButton: {
		backgroundColor: "#4CAF50",
		paddingVertical: 15,
		paddingHorizontal: 25,
		borderRadius: 12,
		flex: 1,
		alignItems: "center",
	},
	modalButtonText: {
		color: "white",
		fontSize: 16,
		fontWeight: "bold",
	},
};
