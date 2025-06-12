// components/VoiceChat/VoiceChatWithUpload.js
import React, { useState, useEffect } from "react";
import {
	View,
	Text,
	TouchableOpacity,
	Image,
	ScrollView,
	Alert,
} from "react-native";
import { useVoiceRecognition } from "../../../hooks/useVoiceRecognition";
import { useAudioRecorder } from "../../../hooks/useAudioRecorder";
import { useVoiceUpload } from "../../../hooks/useVoiceUpload";

const VoiceChatWithUpload = ({
	// 기존 Props
	userName = "어르신",
	elderlyId, // 필수: 업로드를 위한 어르신 ID
	onVoiceResult = () => {},
	onNavigate = () => {},
	isActive = false,
	onActivate = () => {},
	onDeactivate = () => {},
	// UI Props
	phoneGreenImage,
	phoneRedImage,
	chatBoxStyle,
	chatTextStyle,
	phoneImageStyle,
	touchAreaStyle,
	// 새로운 Props
	enableRecording = true,
	enableSTT = true,
	enableUpload = true, // 업로드 기능 활성화
	autoUpload = false, // 녹음 완료 시 자동 업로드
	showResultsPanel = true,
	questions = ["약은 드셨나요?", "식사는 하셨나요?", "몸은 어떠신가요?"],
}) => {
	const [chatText, setChatText] = useState("버튼을 눌러 대화를 시작하세요");
	const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
	const [mode, setMode] = useState("stt");
	const [voiceHistory, setVoiceHistory] = useState([]);
	const [currentResult, setCurrentResult] = useState("");

	// 업로드 상태
	const [uploadedRecordings, setUploadedRecordings] = useState(new Set());

	// 음성 인식 훅
	const {
		isListening,
		result,
		startListening,
		stopListening,
		reset: resetSTT,
	} = useVoiceRecognition({
		language: "ko-KR",
		onResult: handleVoiceResult,
		onStart: () => {
			setChatText("듣고 있습니다... 말씀해 주세요");
			setCurrentResult("");
		},
		onError: (err) => {
			setChatText("음성 인식에 문제가 있습니다. 다시 시도해주세요");
		},
	});

	// 오디오 녹음 훅 (업로드 기능 포함)
	const {
		isRecording,
		isPlaying,
		recordingDuration,
		recordings,
		startRecording,
		stopRecording,
		playRecording,
		stopPlayback,
		deleteRecording,
		saveRecording,
		formatDuration,
	} = useAudioRecorder({
		onRecordingStart: () => {
			setChatText("🔴 녹음 중입니다...");
		},
		onRecordingEnd: async (recordingInfo) => {
			setChatText(
				`녹음이 완료되었습니다 (${formatDuration(recordingInfo.duration)})`
			);

			// 자동 업로드 실행
			if (autoUpload && enableUpload && elderlyId) {
				await handleUploadRecording(recordingInfo, true);
			}
		},
		onRecordingError: (error) => {
			setChatText("녹음 중 오류가 발생했습니다");
		},
		onPlaybackEnd: () => {
			setChatText("재생이 완료되었습니다");
		},
	});

	// 업로드 훅
	const {
		isUploading,
		uploadProgress,
		uploadRecording,
		uploadMultipleRecordings,
	} = useVoiceUpload();

	// result가 변경될 때마다 currentResult 업데이트
	useEffect(() => {
		if (result) {
			setCurrentResult(result);
		}
	}, [result]);

	// 음성 결과 처리
	function handleVoiceResult(spokenText) {
		const timestamp = new Date().toLocaleTimeString();
		const newEntry = {
			id: Date.now(),
			text: spokenText,
			timestamp: timestamp,
			response: "",
		};

		setVoiceHistory((prev) => [newEntry, ...prev]);
		setChatText(`"${spokenText}" 라고 말씀하셨네요`);
		onVoiceResult(spokenText);

		setTimeout(() => {
			const response = handleVoiceResponse(spokenText);
			setVoiceHistory((prev) =>
				prev.map((entry) =>
					entry.id === newEntry.id ? { ...entry, response: response } : entry
				)
			);
		}, 2000);
	}

	// 음성 결과에 따른 반응
	const handleVoiceResponse = (spokenText) => {
		const lowerText = spokenText.toLowerCase();
		let response = "";

		if (lowerText.includes("약") || lowerText.includes("medicine")) {
			response = `${userName} 어르신, 약 복용 정보를 확인해드릴게요`;
			setChatText(response);
			setTimeout(() => onNavigate("pill"), 2000);
		} else if (lowerText.includes("일정") || lowerText.includes("schedule")) {
			response = `${userName} 어르신, 일정을 확인해드릴게요`;
			setChatText(response);
			setTimeout(() => onNavigate("schedule"), 2000);
		} else if (lowerText.includes("안녕") || lowerText.includes("hello")) {
			response = `${userName} 어르신, 안녕하세요! 오늘 기분은 어떠세요?`;
			setChatText(response);
		} else if (lowerText.includes("아파") || lowerText.includes("pain")) {
			response = `${userName} 어르신, 어디가 아프신지 말씀해주세요`;
			setChatText(response);
		} else if (lowerText.includes("좋아") || lowerText.includes("괜찮")) {
			response = `${userName} 어르신, 다행이네요! 건강 관리 잘 하세요`;
			setChatText(response);
		} else {
			response = `${userName} 어르신, 무엇을 도와드릴까요?`;
			setChatText(response);
		}

		return response;
	};

	// 단일 녹음 파일 업로드
	const handleUploadRecording = async (recording, isAutoUpload = false) => {
		if (!elderlyId) {
			Alert.alert("오류", "어르신 ID가 필요합니다");
			return;
		}

		try {
			const metadata = {
				duration: recording.duration,
				name: recording.name,
				date: recording.date,
				transcription: currentResult, // STT 결과 포함
				category: "voice_chat", // 카테고리 설정
			};

			const result = await uploadRecording(recording.uri, elderlyId, metadata);

			if (result.success) {
				setUploadedRecordings((prev) => new Set([...prev, recording.id]));

				if (!isAutoUpload) {
					setChatText("음성 파일이 성공적으로 업로드되었습니다");
					Alert.alert("업로드 완료", result.message);
				}
			} else {
				setChatText("업로드에 실패했습니다");
				Alert.alert("업로드 실패", result.message);
			}
		} catch (error) {
			console.error("업로드 오류:", error);
			Alert.alert("오류", "업로드 중 오류가 발생했습니다");
		}
	};

	// 모든 녹음 파일 일괄 업로드
	const handleUploadAllRecordings = async () => {
		if (!elderlyId) {
			Alert.alert("오류", "어르신 ID가 필요합니다");
			return;
		}

		if (recordings.length === 0) {
			Alert.alert("알림", "업로드할 녹음이 없습니다");
			return;
		}

		Alert.alert(
			"일괄 업로드",
			`${recordings.length}개의 녹음을 모두 업로드하시겠습니까?`,
			[
				{ text: "취소", style: "cancel" },
				{
					text: "업로드",
					onPress: async () => {
						try {
							setChatText("파일들을 업로드하고 있습니다...");
							const results = await uploadMultipleRecordings(
								recordings,
								elderlyId
							);

							const successCount = results.filter((r) => r.success).length;
							const failCount = results.length - successCount;

							setChatText(
								`업로드 완료: 성공 ${successCount}개, 실패 ${failCount}개`
							);

							Alert.alert(
								"업로드 완료",
								`성공: ${successCount}개\n실패: ${failCount}개`
							);

							// 성공한 녹음들을 업로드 완료 목록에 추가
							results.forEach((result) => {
								if (result.success) {
									setUploadedRecordings(
										(prev) => new Set([...prev, result.localRecordingId])
									);
								}
							});
						} catch (error) {
							setChatText("업로드 중 오류가 발생했습니다");
							Alert.alert("오류", "일괄 업로드 중 오류가 발생했습니다");
						}
					},
				},
			]
		);
	};

	// 질문 시퀀스 시작
	const startQuestionSequence = () => {
		setCurrentQuestionIndex(0);
		showNextQuestion();
	};

	// 다음 질문 표시
	const showNextQuestion = () => {
		if (currentQuestionIndex < questions.length) {
			const question = `${userName} 어르신 ${questions[currentQuestionIndex]}`;
			setChatText(question);
			setCurrentQuestionIndex((prev) => prev + 1);

			if (currentQuestionIndex + 1 < questions.length) {
				setTimeout(() => {
					showNextQuestion();
				}, 2000);
			} else {
				setTimeout(() => {
					setChatText(`${userName} 어르신, 음성으로 답변해주세요`);
					if (enableSTT) {
						setTimeout(() => {
							startListening();
						}, 1000);
					}
				}, 2000);
			}
		}
	};

	// 채팅 활성화
	const handleActivate = () => {
		onActivate();
		setVoiceHistory([]);
		startQuestionSequence();
	};

	// 채팅 비활성화
	const handleDeactivate = () => {
		if (isListening) stopListening();
		if (isRecording) stopRecording();
		if (isPlaying) stopPlayback();

		resetSTT();
		onDeactivate();
		setChatText("버튼을 눌러 대화를 시작하세요");
		setCurrentQuestionIndex(0);
		setMode("stt");
		setCurrentResult("");
	};

	// STT 토글
	const handleSTTToggle = () => {
		if (isListening) {
			stopListening();
		} else {
			setMode("stt");
			startListening();
		}
	};

	// 녹음 토글
	const handleRecordingToggle = () => {
		if (isRecording) {
			stopRecording();
		} else {
			setMode("recording");
			startRecording();
		}
	};

	// 녹음 재생
	const handlePlayRecording = (uri) => {
		setMode("playback");
		playRecording(uri);
	};

	// 히스토리 초기화
	const clearHistory = () => {
		Alert.alert("대화 기록 삭제", "모든 음성 인식 기록을 삭제하시겠습니까?", [
			{ text: "취소", style: "cancel" },
			{
				text: "삭제",
				onPress: () => setVoiceHistory([]),
				style: "destructive",
			},
		]);
	};

	return (
		<>
			{/* 채팅 박스 */}
			{isActive ? (
				<View style={chatBoxStyle}>
					<Text style={chatTextStyle}>
						{(isListening && "🎤 ") ||
							(isRecording && "🔴 ") ||
							(isUploading && "☁️ ") ||
							""}
						{chatText}
					</Text>

					{/* 업로드 진행상황 */}
					{isUploading && uploadProgress.total && (
						<View style={{ marginTop: 10 }}>
							<Text style={[chatTextStyle, { fontSize: 12, color: "#FFD700" }]}>
								업로드 중: {uploadProgress.current}/{uploadProgress.total}(
								{uploadProgress.percentage}%)
							</Text>
							<Text style={[chatTextStyle, { fontSize: 11, color: "#ccc" }]}>
								{uploadProgress.currentFile}
							</Text>
						</View>
					)}

					{/* 현재 음성 인식 결과 */}
					{currentResult && enableSTT && (
						<View
							style={{
								backgroundColor: "rgba(255,255,255,0.1)",
								padding: 10,
								borderRadius: 8,
								marginTop: 10,
							}}
						>
							<Text
								style={{ color: "#4CAF50", fontSize: 14, fontWeight: "bold" }}
							>
								🎤 최근 인식된 음성:
							</Text>
							<Text
								style={[
									chatTextStyle,
									{ fontSize: 16, color: "#fff", marginTop: 5 },
								]}
							>
								"{currentResult}"
							</Text>
						</View>
					)}

					{/* 녹음 시간 표시 */}
					{isRecording && (
						<Text
							style={[
								chatTextStyle,
								{ fontSize: 14, color: "#ff4444", marginTop: 5 },
							]}
						>
							녹음 시간: {formatDuration(recordingDuration)}
						</Text>
					)}
				</View>
			) : (
				<View style={chatBoxStyle}>
					<Text style={chatTextStyle}>버튼을 눌러 대화를 시작하세요</Text>
				</View>
			)}

			{/* 전화 버튼 */}
			{isActive ? (
				<TouchableOpacity onPress={handleDeactivate} style={touchAreaStyle}>
					<Image
						source={phoneRedImage}
						style={[
							phoneImageStyle,
							(isListening || isRecording || isUploading) && {
								opacity: 0.7,
								transform: [{ scale: 1.1 }],
							},
						]}
					/>
				</TouchableOpacity>
			) : (
				<TouchableOpacity onPress={handleActivate} style={touchAreaStyle}>
					<Image source={phoneGreenImage} style={phoneImageStyle} />
				</TouchableOpacity>
			)}

			{/* 기능 버튼들 */}
			{isActive && (
				<View style={{ marginTop: 20, alignItems: "center" }}>
					<View
						style={{
							flexDirection: "row",
							justifyContent: "space-around",
							width: "90%",
							marginBottom: 20,
							flexWrap: "wrap",
						}}
					>
						{/* STT 버튼 */}
						{enableSTT && (
							<TouchableOpacity
								onPress={handleSTTToggle}
								style={{
									backgroundColor: isListening ? "#ff4444" : "#4444ff",
									padding: 12,
									borderRadius: 20,
									minWidth: 100,
									margin: 5,
								}}
							>
								<Text
									style={{ color: "white", textAlign: "center", fontSize: 12 }}
								>
									{isListening ? "음성인식 중지" : "🗣️ 음성인식"}
								</Text>
							</TouchableOpacity>
						)}

						{/* 녹음 버튼 */}
						{enableRecording && (
							<TouchableOpacity
								onPress={handleRecordingToggle}
								style={{
									backgroundColor: isRecording ? "#ff4444" : "#44aa44",
									padding: 12,
									borderRadius: 20,
									minWidth: 100,
									margin: 5,
								}}
							>
								<Text
									style={{ color: "white", textAlign: "center", fontSize: 12 }}
								>
									{isRecording ? "녹음 중지" : "🎙️ 녹음시작"}
								</Text>
							</TouchableOpacity>
						)}

						{/* 일괄 업로드 버튼 */}
						{enableUpload && recordings.length > 0 && (
							<TouchableOpacity
								onPress={handleUploadAllRecordings}
								disabled={isUploading}
								style={{
									backgroundColor: isUploading ? "#666" : "#FF6B35",
									padding: 12,
									borderRadius: 20,
									minWidth: 100,
									margin: 5,
								}}
							>
								<Text
									style={{ color: "white", textAlign: "center", fontSize: 12 }}
								>
									{isUploading ? "업로드 중..." : "☁️ 전체업로드"}
								</Text>
							</TouchableOpacity>
						)}
					</View>

					{/* 음성 인식 결과 히스토리 패널 */}
					{showResultsPanel && enableSTT && voiceHistory.length > 0 && (
						<View style={{ width: "90%", marginBottom: 20 }}>
							<View
								style={{
									flexDirection: "row",
									justifyContent: "space-between",
									alignItems: "center",
									marginBottom: 10,
								}}
							>
								<Text
									style={{ color: "white", fontSize: 16, fontWeight: "bold" }}
								>
									🗣️ 대화 기록 ({voiceHistory.length}개)
								</Text>
								<TouchableOpacity
									onPress={clearHistory}
									style={{
										backgroundColor: "#ff4444",
										padding: 8,
										borderRadius: 15,
									}}
								>
									<Text style={{ color: "white", fontSize: 12 }}>
										🗑️ 초기화
									</Text>
								</TouchableOpacity>
							</View>

							<ScrollView
								style={{
									backgroundColor: "rgba(255,255,255,0.1)",
									borderRadius: 10,
									padding: 10,
									maxHeight: 200,
								}}
								showsVerticalScrollIndicator={true}
							>
								{voiceHistory.map((entry) => (
									<View
										key={entry.id}
										style={{
											backgroundColor: "rgba(255,255,255,0.05)",
											padding: 12,
											borderRadius: 8,
											marginBottom: 10,
											borderLeftWidth: 3,
											borderLeftColor: "#4CAF50",
										}}
									>
										<View
											style={{
												flexDirection: "row",
												justifyContent: "space-between",
												marginBottom: 5,
											}}
										>
											<Text
												style={{
													color: "#4CAF50",
													fontSize: 12,
													fontWeight: "bold",
												}}
											>
												음성 인식
											</Text>
											<Text style={{ color: "#ccc", fontSize: 12 }}>
												{entry.timestamp}
											</Text>
										</View>

										<Text
											style={{ color: "white", fontSize: 15, marginBottom: 8 }}
										>
											💬 "{entry.text}"
										</Text>

										{entry.response && (
											<Text style={{ color: "#FFD700", fontSize: 14 }}>
												🤖 {entry.response}
											</Text>
										)}
									</View>
								))}
							</ScrollView>
						</View>
					)}

					{/* 녹음 목록 */}
					{enableRecording && recordings.length > 0 && (
						<View style={{ width: "90%", maxHeight: 200 }}>
							<Text
								style={{
									color: "white",
									fontSize: 16,
									marginBottom: 10,
									textAlign: "center",
								}}
							>
								🎙️ 저장된 녹음 ({recordings.length}개)
							</Text>
							<ScrollView
								style={{
									backgroundColor: "rgba(255,255,255,0.1)",
									borderRadius: 10,
									padding: 10,
								}}
							>
								{recordings.map((recording) => (
									<View
										key={recording.id}
										style={{
											flexDirection: "row",
											justifyContent: "space-between",
											alignItems: "center",
											backgroundColor: "rgba(255,255,255,0.05)",
											padding: 10,
											borderRadius: 8,
											marginBottom: 8,
											borderLeftWidth: 3,
											borderLeftColor: uploadedRecordings.has(recording.id)
												? "#4CAF50"
												: "#FFA726",
										}}
									>
										<View style={{ flex: 1 }}>
											<View
												style={{ flexDirection: "row", alignItems: "center" }}
											>
												<Text style={{ color: "white", fontSize: 14 }}>
													{recording.name}
												</Text>
												{uploadedRecordings.has(recording.id) && (
													<Text
														style={{
															color: "#4CAF50",
															fontSize: 12,
															marginLeft: 8,
														}}
													>
														☁️ 업로드됨
													</Text>
												)}
											</View>
											<Text style={{ color: "#ccc", fontSize: 12 }}>
												{recording.date} | {formatDuration(recording.duration)}
											</Text>
										</View>

										<View style={{ flexDirection: "row", gap: 8 }}>
											{/* 재생 버튼 */}
											<TouchableOpacity
												onPress={() => handlePlayRecording(recording.uri)}
												style={{
													backgroundColor: "#4444ff",
													padding: 8,
													borderRadius: 15,
												}}
											>
												<Text style={{ color: "white", fontSize: 12 }}>
													{isPlaying ? "⏸️" : "▶️"}
												</Text>
											</TouchableOpacity>

											{/* 개별 업로드 버튼 */}
											{enableUpload &&
												!uploadedRecordings.has(recording.id) && (
													<TouchableOpacity
														onPress={() => handleUploadRecording(recording)}
														disabled={isUploading}
														style={{
															backgroundColor: isUploading ? "#666" : "#FF6B35",
															padding: 8,
															borderRadius: 15,
														}}
													>
														<Text style={{ color: "white", fontSize: 12 }}>
															{isUploading ? "⏳" : "☁️"}
														</Text>
													</TouchableOpacity>
												)}

											{/* 삭제 버튼 */}
											<TouchableOpacity
												onPress={() => {
													Alert.alert(
														"삭제 확인",
														"이 녹음을 삭제하시겠습니까?",
														[
															{ text: "취소", style: "cancel" },
															{
																text: "삭제",
																onPress: () => {
																	deleteRecording(recording.id);
																	setUploadedRecordings((prev) => {
																		const newSet = new Set(prev);
																		newSet.delete(recording.id);
																		return newSet;
																	});
																},
																style: "destructive",
															},
														]
													);
												}}
												style={{
													backgroundColor: "#ff4444",
													padding: 8,
													borderRadius: 15,
												}}
											>
												<Text style={{ color: "white", fontSize: 12 }}>🗑️</Text>
											</TouchableOpacity>
										</View>
									</View>
								))}
							</ScrollView>
						</View>
					)}
				</View>
			)}
		</>
	);
};

export default VoiceChatWithUpload;
