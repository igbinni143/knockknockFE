// components/VoiceChat/VoiceChat.js (VoiceUploadService 통합)
import React, { useState, useEffect, useCallback } from "react";
import {
	View,
	Text,
	TouchableOpacity,
	Image,
	ScrollView,
	Alert,
	ActivityIndicator,
} from "react-native";
import { useAudioRecorder } from "../../../hooks/useAudioRecorder";
import { VoiceUploadService } from "../../../services/VoiceUploadService";

const VoiceChat = ({
	userName = "어르신",
	elderlyId,
	sessionId = null,
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
	// 기능 설정
	serverUrl = "http://18.205.227.28:8080",
	questions = ["녹음 버튼을 눌러 음성을 녹음해주세요"],
	autoQuestionDelay = 3000,
}) => {
	const [chatText, setChatText] = useState("버튼을 눌러 녹음을 시작하세요");
	const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
	const [questionTimer, setQuestionTimer] = useState(null);
	const [debugInfo, setDebugInfo] = useState(null);
	const [isDebugging, setIsDebugging] = useState(false);

	// 커스텀 업로드 핸들러
	const customUploadHandler = useCallback(
		async (recordingUri, metadata) => {
			try {
				// 임시 해결책: elderlyId가 없으면 기본값 사용
				const effectiveElderlyId = elderlyId || 7; // 임시 하드코딩
				const effectiveSessionId = sessionId || `temp_session_${Date.now()}`;

				console.log("🎯 VoiceChat customUploadHandler 호출됨!");
				console.log("📤 업로드 파라미터:", {
					recordingUri,
					elderlyId: effectiveElderlyId,
					sessionId: effectiveSessionId,
					metadata,
					originalElderlyId: elderlyId,
					originalSessionId: sessionId,
				});

				// VoiceUploadService 사용
				const result = await VoiceUploadService.uploadRecording(
					recordingUri,
					effectiveElderlyId, // 임시 값 사용
					effectiveSessionId, // 임시 값 사용
					{
						name:
							metadata.name ||
							metadata.recordingName ||
							`녹음_${new Date().getHours()}_${new Date().getMinutes()}`,
						duration: metadata.duration || 0,
					}
				);

				console.log("📤 VoiceUploadService 결과:", result);

				if (result.success) {
					return {
						success: true,
						recordingId: result.recordingId,
						serverId: result.recordingId,
						message: "업로드가 완료되었습니다",
					};
				} else {
					throw new Error(result.error || "업로드 실패");
				}
			} catch (error) {
				console.error("💥 VoiceChat 업로드 오류:", error);
				return {
					success: false,
					error: error.message,
					message: "업로드에 실패했습니다",
				};
			}
		},
		[elderlyId, sessionId]
	);

	// 오디오 녹음 훅 (커스텀 업로드 핸들러 사용)
	const {
		isRecording,
		isPlaying,
		isUploading,
		recordingDuration,
		recordings,
		startRecording,
		stopRecording,
		playRecording,
		stopPlayback,
		deleteRecording,
		retryUpload,
		formatDuration,
		clearAllRecordings,
	} = useAudioRecorder({
		elderlyId: elderlyId || 7, // 임시 기본값
		sessionId: sessionId || `temp_session_${Date.now()}`, // 임시 기본값
		serverUrl,
		uploadHandler: customUploadHandler, // 커스텀 업로드 핸들러 전달
		onRecordingStart: () => {
			setChatText("🔴 녹음 중입니다... 말씀해 주세요");
		},
		onRecordingEnd: (recordingInfo) => {
			if (recordingInfo.uploaded) {
				setChatText(
					`녹음 완료 및 업로드 성공! (${formatDuration(
						recordingInfo.duration
					)})`
				);
			} else {
				setChatText(
					`녹음 완료 (${formatDuration(
						recordingInfo.duration
					)}) - 업로드 재시도 가능`
				);
			}
		},
		onRecordingError: (error) => {
			setChatText(`녹음 중 오류가 발생했습니다: ${error}`);
			Alert.alert("녹음 오류", error);
		},
		onPlaybackEnd: () => {
			setChatText("재생이 완료되었습니다");
		},
		onUploadStart: () => {
			setChatText("☁️ 서버에 업로드 중입니다...");
		},
		onUploadSuccess: (result) => {
			setChatText("✅ 업로드가 완료되었습니다!");
		},
		onUploadError: (error) => {
			setChatText(`❌ 업로드 실패: ${error}`);
		},
	});

	// 컴포넌트 언마운트 시 타이머 정리
	useEffect(() => {
		return () => {
			if (questionTimer) {
				clearTimeout(questionTimer);
			}
		};
	}, [questionTimer]);

	// 전체 진단 실행
	const runFullDiagnostic = useCallback(async () => {
		setIsDebugging(true);
		setChatText("🔍 시스템 진단 중...");

		try {
			console.log("🚀 전체 진단 시작");

			// 서버 연결 테스트
			const pingResult = await VoiceUploadService.pingServer();
			console.log("🏓 서버 연결 테스트:", pingResult);

			// 최소 필드 테스트
			const minimalResult = await VoiceUploadService.minimalUploadTest(
				elderlyId
			);
			console.log("🔬 최소 필드 테스트:", minimalResult);

			// 테스트 업로드
			const testResult = await VoiceUploadService.testUpload(elderlyId);
			console.log("🧪 테스트 업로드:", testResult);

			const diagnosticResult = {
				serverConnection: pingResult,
				minimalUpload: minimalResult,
				testUpload: testResult,
				timestamp: new Date().toISOString(),
			};

			setDebugInfo(diagnosticResult);
			setChatText("진단 완료! 결과를 확인하세요.");

			// 진단 결과 Alert로 표시
			const serverStatus = pingResult.success ? "✅ 정상" : "❌ 문제 있음";
			const uploadStatus = testResult.success ? "✅ 정상" : "❌ 문제 있음";

			Alert.alert(
				"시스템 진단 결과",
				`서버 연결: ${serverStatus}\n업로드 테스트: ${uploadStatus}\n최소 필드 테스트: ${
					minimalResult.success ? "✅" : "❌"
				}\n\n상세 내용은 콘솔을 확인하세요.`,
				[{ text: "확인" }]
			);
		} catch (error) {
			console.error("진단 실패:", error);
			setChatText("진단 중 오류가 발생했습니다");
			Alert.alert("진단 오류", error.message);
		} finally {
			setIsDebugging(false);
		}
	}, [elderlyId]);

	// 서버 연결 테스트
	const testServerConnection = useCallback(async () => {
		setChatText("🏥 서버 연결 테스트 중...");

		try {
			const result = await VoiceUploadService.pingServer();
			console.log("🏓 서버 연결 테스트:", result);

			if (result.success) {
				setChatText(`✅ 서버 연결 성공 (${result.status})`);
				Alert.alert(
					"서버 테스트",
					`서버가 정상적으로 응답합니다.\n상태: ${result.status}\n응답: ${
						result.response || "OK"
					}`
				);
			} else {
				setChatText("❌ 서버 연결 실패");
				Alert.alert(
					"서버 테스트",
					`서버 연결에 실패했습니다.\n오류: ${result.error}`
				);
			}
		} catch (error) {
			setChatText("서버 테스트 중 오류 발생");
			Alert.alert("테스트 오류", error.message);
		}
	}, []);

	// 테스트 업로드 실행
	const runTestUpload = useCallback(async () => {
		setChatText("🧪 테스트 업로드 실행 중...");

		try {
			const result = await VoiceUploadService.testUpload(elderlyId);
			console.log("🧪 테스트 업로드 결과:", result);

			if (result.success) {
				setChatText("✅ 테스트 업로드 완료");
				Alert.alert(
					"테스트 업로드 결과",
					`테스트 업로드가 성공했습니다!\n상태: ${result.status}\n응답: ${result.response}`,
					[{ text: "확인" }]
				);
			} else {
				setChatText("❌ 테스트 업로드 실패");
				Alert.alert(
					"테스트 실패",
					`오류: ${result.error}\n상태: ${result.status || "알 수 없음"}`
				);
			}
		} catch (error) {
			setChatText("테스트 업로드 중 오류 발생");
			Alert.alert("테스트 오류", error.message);
		}
	}, [elderlyId]);

	// 파라미터 정보 표시
	const showParameterInfo = useCallback(() => {
		const info = [
			`어르신 ID: ${elderlyId || "없음"} (${typeof elderlyId})`,
			`세션 ID: ${sessionId || "없음"} (${typeof sessionId})`,
			`서버 URL: ${serverUrl}`,
			`녹음 개수: ${recordings.length}개`,
			`현재 상태: ${isActive ? "활성" : "비활성"}`,
			`업로드 상태: ${isUploading ? "업로드 중" : "대기 중"}`,
			`커스텀 핸들러: ${customUploadHandler ? "있음" : "없음"}`,
		].join("\n");

		Alert.alert("현재 파라미터 정보", info, [{ text: "확인" }]);

		// 콘솔에도 출력
		console.log("📋 VoiceChat 파라미터 정보:");
		console.log(`  - elderlyId: ${elderlyId} (${typeof elderlyId})`);
		console.log(`  - sessionId: ${sessionId} (${typeof sessionId})`);
		console.log(`  - serverUrl: ${serverUrl}`);
		console.log(
			`  - customUploadHandler: ${customUploadHandler ? "있음" : "없음"}`
		);
	}, [
		elderlyId,
		sessionId,
		serverUrl,
		recordings.length,
		isActive,
		isUploading,
		customUploadHandler,
	]);

	// 질문 시퀀스 시작
	const startQuestionSequence = useCallback(() => {
		setCurrentQuestionIndex(0);
		showNextQuestion(0);
	}, [questions, userName]);

	// 다음 질문 표시
	const showNextQuestion = useCallback(
		(index = currentQuestionIndex) => {
			if (questionTimer) {
				clearTimeout(questionTimer);
			}

			if (index < questions.length) {
				const question = `${userName} 어르신, ${questions[index]}`;
				setChatText(question);

				const nextIndex = index + 1;
				setCurrentQuestionIndex(nextIndex);

				if (nextIndex < questions.length) {
					const timer = setTimeout(() => {
						showNextQuestion(nextIndex);
					}, autoQuestionDelay);
					setQuestionTimer(timer);
				} else {
					const timer = setTimeout(() => {
						setChatText("🎙️ 녹음 버튼을 눌러 음성을 녹음해주세요");
					}, autoQuestionDelay);
					setQuestionTimer(timer);
				}
			}
		},
		[
			questions,
			userName,
			autoQuestionDelay,
			currentQuestionIndex,
			questionTimer,
		]
	);

	// 채팅 활성화
	const handleActivate = useCallback(() => {
		onActivate();
		startQuestionSequence();
	}, [onActivate, startQuestionSequence]);

	// 채팅 비활성화
	const handleDeactivate = useCallback(() => {
		if (isRecording) stopRecording();
		if (isPlaying) stopPlayback();

		if (questionTimer) {
			clearTimeout(questionTimer);
			setQuestionTimer(null);
		}

		onDeactivate();
		setChatText("버튼을 눌러 녹음을 시작하세요");
		setCurrentQuestionIndex(0);
	}, [
		isRecording,
		isPlaying,
		questionTimer,
		onDeactivate,
		stopRecording,
		stopPlayback,
	]);

	// 녹음 토글
	const handleRecordingToggle = useCallback(() => {
		if (isRecording) {
			stopRecording();
		} else {
			startRecording();
		}
	}, [isRecording, startRecording, stopRecording]);

	// 녹음 재생
	const handlePlayRecording = useCallback(
		(uri) => {
			if (isPlaying) {
				stopPlayback();
			} else {
				playRecording(uri);
			}
		},
		[isPlaying, playRecording, stopPlayback]
	);

	// 업로드 재시도
	const handleRetryUpload = useCallback(
		(recordingId) => {
			Alert.alert("업로드 재시도", "이 녹음을 다시 업로드하시겠습니까?", [
				{ text: "취소", style: "cancel" },
				{
					text: "재시도",
					onPress: () => retryUpload(recordingId),
				},
			]);
		},
		[retryUpload]
	);

	// 모든 녹음 삭제
	const handleClearAllRecordings = useCallback(() => {
		Alert.alert("전체 삭제", "모든 녹음을 삭제하시겠습니까?", [
			{ text: "취소", style: "cancel" },
			{
				text: "삭제",
				onPress: () => clearAllRecordings?.(),
				style: "destructive",
			},
		]);
	}, [clearAllRecordings]);

	// 개별 녹음 삭제
	const handleDeleteRecording = useCallback(
		(recordingId) => {
			Alert.alert("삭제 확인", "이 녹음을 삭제하시겠습니까?", [
				{ text: "취소", style: "cancel" },
				{
					text: "삭제",
					onPress: () => deleteRecording(recordingId),
					style: "destructive",
				},
			]);
		},
		[deleteRecording]
	);

	// 채팅 박스 렌더링
	const renderChatBox = () => (
		<View style={chatBoxStyle}>
			<Text style={chatTextStyle}>
				{(isRecording && "🔴 ") ||
					(isUploading && "☁️ ") ||
					(isDebugging && "🔍 ") ||
					""}
				{chatText}
			</Text>

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

			{/* 업로드 상태 표시 */}
			{isUploading && (
				<View
					style={{
						flexDirection: "row",
						alignItems: "center",
						justifyContent: "center",
						marginTop: 5,
					}}
				>
					<ActivityIndicator size="small" color="#FFD700" />
					<Text
						style={[
							chatTextStyle,
							{ fontSize: 12, color: "#FFD700", marginLeft: 8 },
						]}
					>
						서버에 업로드 중...
					</Text>
				</View>
			)}

			{/* 디버깅 상태 표시 */}
			{isDebugging && (
				<View
					style={{
						flexDirection: "row",
						alignItems: "center",
						justifyContent: "center",
						marginTop: 5,
					}}
				>
					<ActivityIndicator size="small" color="#00BFFF" />
					<Text
						style={[
							chatTextStyle,
							{ fontSize: 12, color: "#00BFFF", marginLeft: 8 },
						]}
					>
						시스템 진단 중...
					</Text>
				</View>
			)}
		</View>
	);

	// 전화 버튼 렌더링
	const renderPhoneButton = () =>
		isActive ? (
			<TouchableOpacity
				onPress={handleDeactivate}
				style={touchAreaStyle}
				activeOpacity={0.7}
			>
				<Image
					source={phoneRedImage}
					style={[
						phoneImageStyle,
						(isRecording || isUploading || isDebugging) && {
							opacity: 0.7,
							transform: [{ scale: 1.1 }],
						},
					]}
				/>
			</TouchableOpacity>
		) : (
			<TouchableOpacity
				onPress={handleActivate}
				style={touchAreaStyle}
				activeOpacity={0.7}
			>
				<Image source={phoneGreenImage} style={phoneImageStyle} />
			</TouchableOpacity>
		);

	// 녹음 버튼 렌더링
	const renderRecordingButton = () => (
		<TouchableOpacity
			onPress={handleRecordingToggle}
			disabled={isUploading || isDebugging}
			activeOpacity={0.7}
			style={{
				backgroundColor: isRecording
					? "#ff4444"
					: isUploading || isDebugging
					? "#666"
					: "#44aa44",
				padding: 20,
				borderRadius: 50,
				width: 100,
				height: 100,
				justifyContent: "center",
				alignItems: "center",
				marginBottom: 20,
				opacity: isUploading || isDebugging ? 0.5 : 1,
			}}
		>
			<Text style={{ color: "white", fontSize: 16, textAlign: "center" }}>
				{isRecording
					? "🛑\n중지"
					: isUploading || isDebugging
					? "⏳\n처리중"
					: "🎙️\n녹음"}
			</Text>
		</TouchableOpacity>
	);

	// 디버깅 패널 렌더링
	const renderDebugPanel = () =>
		__DEV__ && (
			<View
				style={{
					marginTop: 20,
					padding: 15,
					backgroundColor: "rgba(0,191,255,0.1)",
					borderRadius: 10,
					width: "90%",
					borderWidth: 1,
					borderColor: "rgba(0,191,255,0.3)",
				}}
			>
				<Text
					style={{
						color: "#00BFFF",
						fontSize: 16,
						fontWeight: "bold",
						textAlign: "center",
						marginBottom: 15,
					}}
				>
					🔧 디버깅 도구 (VoiceUploadService)
				</Text>

				<View
					style={{
						flexDirection: "row",
						flexWrap: "wrap",
						justifyContent: "space-between",
					}}
				>
					{/* 전체 진단 */}
					<TouchableOpacity
						onPress={runFullDiagnostic}
						disabled={isDebugging}
						style={{
							backgroundColor: isDebugging ? "#666" : "#FF6B35",
							padding: 10,
							borderRadius: 8,
							width: "48%",
							marginBottom: 10,
							opacity: isDebugging ? 0.5 : 1,
						}}
					>
						<Text style={{ color: "white", fontSize: 12, textAlign: "center" }}>
							🔍 전체 진단
						</Text>
					</TouchableOpacity>

					{/* 서버 테스트 */}
					<TouchableOpacity
						onPress={testServerConnection}
						disabled={isDebugging}
						style={{
							backgroundColor: isDebugging ? "#666" : "#4CAF50",
							padding: 10,
							borderRadius: 8,
							width: "48%",
							marginBottom: 10,
							opacity: isDebugging ? 0.5 : 1,
						}}
					>
						<Text style={{ color: "white", fontSize: 12, textAlign: "center" }}>
							🏥 서버 테스트
						</Text>
					</TouchableOpacity>

					{/* 테스트 업로드 */}
					<TouchableOpacity
						onPress={runTestUpload}
						disabled={isDebugging}
						style={{
							backgroundColor: isDebugging ? "#666" : "#9C27B0",
							padding: 10,
							borderRadius: 8,
							width: "48%",
							marginBottom: 10,
							opacity: isDebugging ? 0.5 : 1,
						}}
					>
						<Text style={{ color: "white", fontSize: 12, textAlign: "center" }}>
							🧪 테스트 업로드
						</Text>
					</TouchableOpacity>

					{/* 커스텀 핸들러 테스트 */}
					<TouchableOpacity
						onPress={async () => {
							setChatText("🧪 커스텀 핸들러 테스트 중...");
							try {
								const result = await customUploadHandler(
									"data:text/plain;base64,SGVsbG8gV29ybGQ=",
									{ name: "테스트", duration: 1000 }
								);
								setChatText(
									result.success
										? "✅ 커스텀 핸들러 성공"
										: "❌ 커스텀 핸들러 실패"
								);
								Alert.alert(
									"커스텀 핸들러 테스트",
									result.success ? "성공!" : result.error
								);
							} catch (error) {
								setChatText("❌ 커스텀 핸들러 오류");
								Alert.alert("테스트 오류", error.message);
							}
						}}
						style={{
							backgroundColor: "#607D8B",
							padding: 10,
							borderRadius: 8,
							width: "48%",
							marginBottom: 10,
						}}
					>
						<Text style={{ color: "white", fontSize: 12, textAlign: "center" }}>
							🎯 커스텀 핸들러
						</Text>
					</TouchableOpacity>

					{/* 파라미터 정보 */}
					<TouchableOpacity
						onPress={showParameterInfo}
						style={{
							backgroundColor: "#FF9800",
							padding: 10,
							borderRadius: 8,
							width: "48%",
							marginBottom: 10,
						}}
					>
						<Text style={{ color: "white", fontSize: 12, textAlign: "center" }}>
							📋 파라미터 정보
						</Text>
					</TouchableOpacity>
				</View>

				{/* 진단 결과 요약 */}
				{debugInfo && (
					<View
						style={{
							marginTop: 10,
							padding: 10,
							backgroundColor: "rgba(255,255,255,0.05)",
							borderRadius: 8,
						}}
					>
						<Text
							style={{ color: "#00BFFF", fontSize: 12, fontWeight: "bold" }}
						>
							📊 마지막 진단 결과:
						</Text>
						<Text style={{ color: "#ccc", fontSize: 11, marginTop: 5 }}>
							서버: {debugInfo.serverConnection?.success ? "✅" : "❌"} | 테스트
							업로드: {debugInfo.testUpload?.success ? "✅" : "❌"} | 최소 필드:{" "}
							{debugInfo.minimalUpload?.success ? "✅" : "❌"}
						</Text>
					</View>
				)}
			</View>
		);

	// 녹음 목록 헤더 렌더링
	const renderRecordingListHeader = () => (
		<View
			style={{
				flexDirection: "row",
				justifyContent: "space-between",
				alignItems: "center",
				marginBottom: 10,
			}}
		>
			<Text
				style={{
					color: "white",
					fontSize: 16,
					fontWeight: "bold",
				}}
			>
				🎙️ 저장된 녹음 ({recordings.length}개)
			</Text>
			{recordings.length > 0 && (
				<TouchableOpacity
					onPress={handleClearAllRecordings}
					style={{
						backgroundColor: "#ff4444",
						paddingHorizontal: 12,
						paddingVertical: 6,
						borderRadius: 15,
					}}
				>
					<Text style={{ color: "white", fontSize: 12 }}>전체 삭제</Text>
				</TouchableOpacity>
			)}
		</View>
	);

	// 개별 녹음 아이템 렌더링
	const renderRecordingItem = (recording) => (
		<View
			key={recording.id}
			style={{
				flexDirection: "row",
				justifyContent: "space-between",
				alignItems: "center",
				backgroundColor: "rgba(255,255,255,0.05)",
				padding: 12,
				borderRadius: 8,
				marginBottom: 10,
				borderLeftWidth: 4,
				borderLeftColor: recording.uploaded
					? "#4CAF50"
					: recording.uploadError
					? "#f44336"
					: "#FFA726",
			}}
		>
			<View style={{ flex: 1 }}>
				<View style={{ flexDirection: "row", alignItems: "center" }}>
					<Text
						style={{
							color: "white",
							fontSize: 15,
							fontWeight: "bold",
						}}
					>
						{recording.name}
					</Text>
					{recording.uploaded && (
						<Text
							style={{
								color: "#4CAF50",
								fontSize: 12,
								marginLeft: 10,
							}}
						>
							✅ 업로드 완료
						</Text>
					)}
					{recording.uploadError && (
						<Text
							style={{
								color: "#f44336",
								fontSize: 12,
								marginLeft: 10,
							}}
						>
							❌ 업로드 실패
						</Text>
					)}
				</View>
				<Text style={{ color: "#ccc", fontSize: 13, marginTop: 4 }}>
					{recording.date} | 길이: {formatDuration(recording.duration)}
				</Text>
				{recording.serverId && (
					<Text
						style={{
							color: "#4CAF50",
							fontSize: 11,
							marginTop: 2,
						}}
					>
						서버 ID: {recording.serverId}
					</Text>
				)}
				{recording.uploadError && (
					<Text
						style={{
							color: "#f44336",
							fontSize: 11,
							marginTop: 2,
						}}
					>
						오류: {recording.uploadError}
					</Text>
				)}
			</View>

			<View style={{ flexDirection: "row", gap: 8 }}>
				{/* 재생 버튼 */}
				<TouchableOpacity
					onPress={() => handlePlayRecording(recording.uri)}
					activeOpacity={0.7}
					style={{
						backgroundColor: isPlaying ? "#ff4444" : "#4444ff",
						padding: 10,
						borderRadius: 20,
						minWidth: 45,
					}}
				>
					<Text
						style={{
							color: "white",
							fontSize: 14,
							textAlign: "center",
						}}
					>
						{isPlaying ? "⏸️" : "▶️"}
					</Text>
				</TouchableOpacity>

				{/* 업로드 재시도 버튼 (실패한 경우에만) */}
				{recording.uploadError && !recording.uploaded && (
					<TouchableOpacity
						onPress={() => handleRetryUpload(recording.id)}
						disabled={isUploading || isDebugging}
						activeOpacity={0.7}
						style={{
							backgroundColor: isUploading || isDebugging ? "#666" : "#FF6B35",
							padding: 10,
							borderRadius: 20,
							minWidth: 45,
							opacity: isUploading || isDebugging ? 0.5 : 1,
						}}
					>
						<Text
							style={{
								color: "white",
								fontSize: 14,
								textAlign: "center",
							}}
						>
							{isUploading || isDebugging ? "⏳" : "🔄"}
						</Text>
					</TouchableOpacity>
				)}

				{/* 삭제 버튼 */}
				<TouchableOpacity
					onPress={() => handleDeleteRecording(recording.id)}
					activeOpacity={0.7}
					style={{
						backgroundColor: "#ff4444",
						padding: 10,
						borderRadius: 20,
						minWidth: 45,
					}}
				>
					<Text
						style={{
							color: "white",
							fontSize: 14,
							textAlign: "center",
						}}
					>
						🗑️
					</Text>
				</TouchableOpacity>
			</View>
		</View>
	);

	return (
		<>
			{/* 채팅 박스 */}
			{renderChatBox()}

			{/* 전화 버튼 */}
			{renderPhoneButton()}

			{/* 녹음 관련 UI (활성화 상태에서만 표시) */}
			{isActive && (
				<View style={{ marginTop: 20, alignItems: "center" }}>
					{/* 녹음 버튼 */}
					{renderRecordingButton()}

					{/* 디버깅 패널 */}
					{renderDebugPanel()}

					{/* 녹음 목록 */}
					{recordings.length > 0 && (
						<View style={{ width: "90%", maxHeight: 300, marginTop: 10 }}>
							{renderRecordingListHeader()}
							<ScrollView
								style={{
									backgroundColor: "rgba(255,255,255,0.1)",
									borderRadius: 10,
									padding: 10,
								}}
								showsVerticalScrollIndicator={true}
							>
								{recordings.map(renderRecordingItem)}
							</ScrollView>
						</View>
					)}

					{/* 세션 정보 표시 (개발용) */}
					{__DEV__ && sessionId && (
						<View
							style={{
								marginTop: 20,
								padding: 10,
								backgroundColor: "rgba(255,255,255,0.05)",
								borderRadius: 8,
								width: "90%",
							}}
						>
							<Text
								style={{ color: "#ccc", fontSize: 12, textAlign: "center" }}
							>
								세션 ID: {sessionId}
							</Text>
							<Text
								style={{ color: "#ccc", fontSize: 12, textAlign: "center" }}
							>
								서버: {serverUrl}
							</Text>
							<Text
								style={{ color: "#ccc", fontSize: 12, textAlign: "center" }}
							>
								어르신 ID: {elderlyId || "없음"}
							</Text>
							<Text
								style={{ color: "#ccc", fontSize: 12, textAlign: "center" }}
							>
								VoiceUploadService 사용 중
							</Text>
						</View>
					)}

					{/* 사용법 안내 */}
					<View
						style={{
							marginTop: 15,
							padding: 12,
							backgroundColor: "rgba(255,255,255,0.03)",
							borderRadius: 8,
							width: "90%",
						}}
					>
						<Text
							style={{
								color: "#FFD700",
								fontSize: 13,
								textAlign: "center",
								fontWeight: "bold",
							}}
						>
							💡 사용법
						</Text>
						<Text
							style={{
								color: "#ccc",
								fontSize: 12,
								textAlign: "center",
								marginTop: 5,
								lineHeight: 16,
							}}
						>
							🎙️ 녹음 버튼을 눌러 음성을 녹음하세요{"\n"}
							🛑 중지 버튼을 눌러 녹음을 완료하세요{"\n"}
							☁️ 녹음 완료 시 자동으로 서버에 업로드됩니다{"\n"}
							🔄 업로드 실패 시 재시도 버튼을 이용하세요{"\n"}
							▶️ 저장된 녹음을 재생할 수 있습니다{"\n"}
							{__DEV__ && "🔧 개발 모드에서는 디버깅 도구를 사용할 수 있습니다"}
						</Text>
					</View>
				</View>
			)}
		</>
	);
};

export default VoiceChat;
