// hooks/useAudioRecorder.js
import { useState, useEffect, useCallback } from "react";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import { VoiceUploadService } from "../services/VoiceUploadService";

export const useAudioRecorder = ({
	elderlyId, // 새로 추가
	onRecordingStart = () => {},
	onRecordingEnd = () => {},
	onRecordingError = () => {},
	onPlaybackEnd = () => {},
	onUploadStart = () => {}, // 새로 추가
	onUploadSuccess = () => {}, // 새로 추가
	onUploadError = () => {}, // 새로 추가
	sessionId = null,
	serverUrl = "http://18.205.227.28:8080",
	uploadHandler = null, // 커스텀 업로드 핸들러
}) => {
	const [recording, setRecording] = useState(null);
	const [sound, setSound] = useState(null);
	const [isRecording, setIsRecording] = useState(false);
	const [isPlaying, setIsPlaying] = useState(false);
	const [recordingUri, setRecordingUri] = useState(null);
	const [recordingDuration, setRecordingDuration] = useState(0);
	const [recordings, setRecordings] = useState([]); // 저장된 녹음 목록
	const [recordingUnloaded, setRecordingUnloaded] = useState(false); // unload 상태 추적
	const [isUploading, setIsUploading] = useState(false); // 업로드 상태

	// 오디오 권한 및 설정
	const setupAudio = useCallback(async () => {
		try {
			const { status } = await Audio.requestPermissionsAsync();
			if (status !== "granted") {
				throw new Error("오디오 권한이 필요합니다");
			}

			await Audio.setAudioModeAsync({
				allowsRecordingIOS: true,
				playsInSilentModeIOS: true,
				shouldDuckAndroid: true,
				playThroughEarpieceAndroid: false,
				staysActiveInBackground: false,
			});
		} catch (error) {
			console.log("오디오 설정 오류:", error);
			onRecordingError(error);
		}
	}, [onRecordingError]);

	// 서버에 prepare_next_question 요청 (404 처리)
	const prepareNextQuestion = useCallback(async () => {
		if (!sessionId) {
			console.log("sessionId가 없어서 prepare_next_question을 건너뜁니다");
			return;
		}

		try {
			const response = await fetch(`${serverUrl}/prepare_next_question`, {
				method: "POST",
				headers: { "Content-Type": "application/x-www-form-urlencoded" },
				body: `session_id=${sessionId}`,
			});

			if (response.status === 404) {
				console.log(
					"ℹ️ prepare_next_question 엔드포인트가 서버에 없습니다 (건너뜀)"
				);
				return;
			}

			if (!response.ok) {
				throw new Error(`prepare_next_question 요청 실패: ${response.status}`);
			}

			console.log("prepare_next_question 요청 성공");
		} catch (error) {
			console.log("prepare_next_question 오류 (무시):", error.message);
		}
	}, [sessionId, serverUrl]);

	// 녹음 파일을 서버에 업로드 (VoiceUploadService 사용)
	const uploadRecordingToServer = useCallback(
		async (recordingInfo) => {
			try {
				setIsUploading(true);
				onUploadStart();

				console.log("🎯 useAudioRecorder 업로드 시작:", recordingInfo);

				let uploadResult;

				if (uploadHandler) {
					// 커스텀 업로드 핸들러 사용
					console.log("🎯 커스텀 업로드 핸들러 사용");
					uploadResult = await uploadHandler(recordingInfo.uri, {
						name: recordingInfo.name,
						duration: recordingInfo.duration,
					});
				} else {
					// VoiceUploadService 사용
					console.log("🎯 VoiceUploadService 사용");
					uploadResult = await VoiceUploadService.uploadRecording(
						recordingInfo.uri,
						elderlyId,
						sessionId,
						{
							name: recordingInfo.name,
							duration: recordingInfo.duration,
						}
					);
				}

				if (uploadResult.success) {
					console.log("✅ 업로드 성공:", uploadResult);
					onUploadSuccess(uploadResult);
					return uploadResult.recordingId || uploadResult.serverId;
				} else {
					throw new Error(uploadResult.error || "업로드 실패");
				}
			} catch (error) {
				console.error("💥 파일 업로드 오류:", error);
				onUploadError(error.message);
				throw error;
			} finally {
				setIsUploading(false);
			}
		},
		[
			elderlyId,
			sessionId,
			uploadHandler,
			onUploadStart,
			onUploadSuccess,
			onUploadError,
		]
	);
	const sendUploadResponse = useCallback(
		async (fileId) => {
			if (!sessionId || !fileId) {
				console.log(
					"sessionId 또는 fileId가 없어서 upload_response를 건너뜁니다"
				);
				return;
			}

			try {
				const response = await fetch(`${serverUrl}/upload_response`, {
					method: "POST",
					headers: { "Content-Type": "application/x-www-form-urlencoded" },
					body: `session_id=${sessionId}&file_id=${fileId}`,
				});

				if (response.status === 404) {
					console.log(
						"ℹ️ upload_response 엔드포인트가 서버에 없습니다 (건너뜀)"
					);
					return;
				}

				if (!response.ok) {
					throw new Error(`upload_response 요청 실패: ${response.status}`);
				}

				console.log("upload_response 요청 성공");
			} catch (error) {
				console.log("upload_response 오류 (무시):", error.message);
			}
		},
		[sessionId, serverUrl]
	);

	// 녹음 시작
	const startRecording = useCallback(async () => {
		try {
			await setupAudio();

			// 서버에 prepare_next_question 요청
			await prepareNextQuestion();

			const { recording: newRecording } = await Audio.Recording.createAsync(
				Audio.RecordingOptionsPresets.HIGH_QUALITY
			);

			setRecording(newRecording);
			setRecordingUnloaded(false);
			setIsRecording(true);
			setRecordingDuration(0);
			onRecordingStart();

			// 녹음 시간 업데이트 타이머
			const interval = setInterval(() => {
				setRecordingDuration((prev) => prev + 1);
			}, 1000);

			// 녹음 상태 모니터링
			newRecording.setOnRecordingStatusUpdate((status) => {
				if (status.isDoneRecording) {
					clearInterval(interval);
					setRecordingUnloaded(true);
				}
			});
		} catch (error) {
			console.log("녹음 시작 오류:", error);
			onRecordingError(error);
		}
	}, [setupAudio, prepareNextQuestion, onRecordingStart, onRecordingError]);

	// 녹음 중지
	const stopRecording = useCallback(async () => {
		try {
			if (!recording || recordingUnloaded) return;

			const status = await recording.getStatusAsync();
			let uri;

			if (status.isDoneRecording || recordingUnloaded) {
				uri = recording.getURI();
			} else {
				await recording.stopAndUnloadAsync();
				uri = recording.getURI();
				setRecordingUnloaded(true);
			}

			setRecordingUri(uri);
			setRecording(null);
			setIsRecording(false);

			// 녹음 정보 생성
			const recordingInfo = {
				id: Date.now().toString(),
				uri,
				duration: recordingDuration,
				date: new Date().toLocaleString(),
				name: `녹음_${new Date().getHours()}_${new Date().getMinutes()}`,
				uploaded: false,
				uploadError: null,
				serverId: null,
			};

			setRecordings((prev) => [...prev, recordingInfo]);

			// 파일 업로드 및 서버 응답 처리
			try {
				const fileId = await uploadRecordingToServer(recordingInfo);
				if (fileId) {
					await sendUploadResponse(fileId);

					// 녹음 정보에 서버 파일 ID 추가
					setRecordings((prev) =>
						prev.map((r) =>
							r.id === recordingInfo.id
								? { ...r, serverId: fileId, uploaded: true, uploadError: null }
								: r
						)
					);

					// 업로드 성공한 정보로 콜백 호출
					onRecordingEnd({
						...recordingInfo,
						uploaded: true,
						serverId: fileId,
					});
				}
			} catch (uploadError) {
				console.error("업로드 처리 오류:", uploadError);
				// 업로드 실패해도 로컬 녹음은 유지
				setRecordings((prev) =>
					prev.map((r) =>
						r.id === recordingInfo.id
							? { ...r, uploaded: false, uploadError: uploadError.message }
							: r
					)
				);

				// 업로드 실패한 정보로 콜백 호출
				onRecordingEnd({
					...recordingInfo,
					uploaded: false,
					uploadError: uploadError.message,
				});
			}
		} catch (error) {
			console.log("녹음 중지 오류:", error);
			setRecording(null);
			setIsRecording(false);
			setRecordingUnloaded(true);
			onRecordingError(error);
		}
	}, [
		recording,
		recordingDuration,
		recordingUnloaded,
		onRecordingEnd,
		onRecordingError,
		uploadRecordingToServer,
		sendUploadResponse,
	]);

	const playRecording = useCallback(
		async (uri = recordingUri) => {
			try {
				if (!uri) return;

				// 기존 사운드 정리
				if (sound) {
					try {
						await sound.unloadAsync();
					} catch (unloadError) {
						console.log("기존 사운드 unload 오류 (무시 가능):", unloadError);
					}
				}

				const { sound: newSound } = await Audio.Sound.createAsync(
					{ uri },
					{ shouldPlay: true }
				);

				setSound(newSound);
				setIsPlaying(true);

				// 재생 완료 시 콜백
				newSound.setOnPlaybackStatusUpdate((status) => {
					if (status.didJustFinish) {
						setIsPlaying(false);
						onPlaybackEnd();
					}
				});
			} catch (error) {
				console.log("재생 오류:", error);
				setIsPlaying(false);
				onRecordingError(error);
			}
		},
		[recordingUri, sound, onPlaybackEnd, onRecordingError]
	);

	// 재생 중지
	const stopPlayback = useCallback(async () => {
		try {
			if (sound) {
				const status = await sound.getStatusAsync();
				if (status.isLoaded) {
					await sound.pauseAsync();
				}
				setIsPlaying(false);
			}
		} catch (error) {
			console.log("재생 중지 오류 (무시 가능):", error);
			setIsPlaying(false);
		}
	}, [sound]);

	// 녹음 삭제 (로컬 + 서버)
	const deleteRecording = useCallback(
		async (recordingId) => {
			try {
				const recordingToDelete = recordings.find((r) => r.id === recordingId);
				if (!recordingToDelete) return;

				// 서버에서 삭제 (serverId가 있는 경우)
				if (recordingToDelete.serverId) {
					try {
						const response = await fetch(
							`${serverUrl}/recordings/${recordingToDelete.serverId}`,
							{ method: "DELETE" }
						);
						if (!response.ok) {
							console.warn("서버에서 파일 삭제 실패:", response.status);
						}
					} catch (deleteError) {
						console.warn("서버 파일 삭제 오류:", deleteError);
					}
				}

				// 로컬 파일 삭제
				if (recordingToDelete.uri) {
					await FileSystem.deleteAsync(recordingToDelete.uri, {
						idempotent: true,
					});
				}

				// 목록에서 제거
				setRecordings((prev) => prev.filter((r) => r.id !== recordingId));
			} catch (error) {
				console.log("녹음 삭제 오류:", error);
			}
		},
		[recordings, serverUrl]
	);

	// 실패한 업로드 재시도
	const retryUpload = useCallback(
		async (recordingId) => {
			const recording = recordings.find((r) => r.id === recordingId);
			if (!recording || recording.uploaded) return;

			console.log("🔄 업로드 재시도:", recording);

			try {
				setIsUploading(true);
				onUploadStart();

				const fileId = await uploadRecordingToServer(recording);
				if (fileId) {
					await sendUploadResponse(fileId);

					setRecordings((prev) =>
						prev.map((r) =>
							r.id === recordingId
								? { ...r, serverId: fileId, uploaded: true, uploadError: null }
								: r
						)
					);

					console.log("✅ 재업로드 성공");
				}
			} catch (error) {
				console.error("❌ 재업로드 실패:", error);
				setRecordings((prev) =>
					prev.map((r) =>
						r.id === recordingId ? { ...r, uploadError: error.message } : r
					)
				);
				onUploadError(error.message);
			} finally {
				setIsUploading(false);
			}
		},
		[
			recordings,
			uploadRecordingToServer,
			sendUploadResponse,
			onUploadStart,
			onUploadError,
		]
	);

	// 녹음 저장 (외부 저장소로 복사)
	const saveRecording = useCallback(
		async (recordingId, customName = null) => {
			try {
				const recordingToSave = recordings.find((r) => r.id === recordingId);
				if (!recordingToSave) return;

				const fileName = customName || `recording_${Date.now()}.m4a`;
				const destinationUri = `${FileSystem.documentDirectory}${fileName}`;

				await FileSystem.copyAsync({
					from: recordingToSave.uri,
					to: destinationUri,
				});

				// 녹음 정보 업데이트
				setRecordings((prev) =>
					prev.map((r) =>
						r.id === recordingId
							? { ...r, savedUri: destinationUri, savedName: fileName }
							: r
					)
				);

				return destinationUri;
			} catch (error) {
				console.log("녹음 저장 오류:", error);
				return null;
			}
		},
		[recordings]
	);

	// 모든 녹음 삭제
	const clearAllRecordings = useCallback(async () => {
		try {
			// 모든 로컬 파일 삭제
			for (const recording of recordings) {
				if (recording.uri) {
					await FileSystem.deleteAsync(recording.uri, { idempotent: true });
				}
			}

			// 목록 초기화
			setRecordings([]);
			console.log("🗑️ 모든 녹음 삭제 완료");
		} catch (error) {
			console.error("전체 삭제 오류:", error);
		}
	}, [recordings]);

	// 시간 포맷팅
	const formatDuration = useCallback((seconds) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, "0")}`;
	}, []);

	// 컴포넌트 언마운트 시 정리
	useEffect(() => {
		return () => {
			// 녹음 정리
			if (recording) {
				recording
					.getStatusAsync()
					.then((status) => {
						if (!status.isDoneRecording) {
							return recording.stopAndUnloadAsync();
						}
					})
					.catch((error) => {
						if (__DEV__) {
							console.log("Recording cleanup:", error.message);
						}
					});
			}

			// 사운드 정리
			if (sound) {
				sound
					.getStatusAsync()
					.then((status) => {
						if (status.isLoaded) {
							return sound.unloadAsync();
						}
					})
					.catch((error) => {
						if (__DEV__) {
							console.log("Sound cleanup:", error.message);
						}
					});
			}
		};
	}, [recording, sound]);

	return {
		// 상태
		isRecording,
		isPlaying,
		isUploading,
		recordingUri,
		recordingDuration,
		recordings,

		// 함수
		startRecording,
		stopRecording,
		playRecording,
		stopPlayback,
		deleteRecording,
		saveRecording,
		retryUpload,
		formatDuration,
		clearAllRecordings,
	};
};
