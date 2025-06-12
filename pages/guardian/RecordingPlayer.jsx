//import React, { useState, useEffect } from "react";
//import { View, Text, Button, StyleSheet, Alert } from "react-native";
//import * as FileSystem from "expo-file-system";
//import * as Sharing from "expo-sharing";
//import { Audio } from "expo-av";

//export default function RecordingPlayer() {
//	const [sound, setSound] = useState(null);
//	const [isPlaying, setIsPlaying] = useState(false);

//	// ✅ 재생/일시정지 토글 함수
//	const togglePlayback = async () => {
//		try {
//			if (sound) {
//				if (isPlaying) {
//					await sound.pauseAsync();
//					setIsPlaying(false);
//				} else {
//					await sound.playAsync();
//					setIsPlaying(true);
//				}
//			} else {
//				// 최초 재생
//				const { sound: newSound } = await Audio.Sound.createAsync(
//					{ uri: "http://18.205.227.28:8080/recordings/stream/1" },
//					{ shouldPlay: true }
//				);
//				setSound(newSound);
//				setIsPlaying(true);
//			}
//		} catch (error) {
//			console.error("재생 오류:", error);
//			Alert.alert("오류", "재생 중 문제가 발생했습니다.");
//		}
//	};

//	// ✅ 컴포넌트 언마운트 시 sound 해제
//	useEffect(() => {
//		return sound
//			? () => {
//					sound.unloadAsync();
//			  }
//			: undefined;
//	}, [sound]);

//	const downloadAndOpenRecording = async () => {
//		try {
//			const uri = "http://18.205.227.28:8080/recordings/download/1";
//			const fileUri = FileSystem.documentDirectory + "recording1.mp3";

//			const downloadResumable = FileSystem.createDownloadResumable(
//				uri,
//				fileUri
//			);
//			const { uri: downloadedUri } = await downloadResumable.downloadAsync();

//			console.log("✅ 다운로드 완료:", downloadedUri);

//			Alert.alert(
//				"다운로드 완료",
//				"파일을 열까요?",
//				[
//					{
//						text: "취소",
//						style: "cancel",
//					},
//					{
//						text: "열기",
//						onPress: async () => {
//							const isAvailable = await Sharing.isAvailableAsync();
//							if (isAvailable) {
//								await Sharing.shareAsync(downloadedUri);
//							} else {
//								Alert.alert(
//									"공유 불가",
//									"이 기기에서 파일 열기 기능을 사용할 수 없습니다."
//								);
//							}
//						},
//					},
//				],
//				{ cancelable: true }
//			);
//		} catch (error) {
//			console.error("❌ 다운로드 또는 열기 오류:", error);
//			Alert.alert("오류", "녹음 다운로드 또는 열기에 실패했습니다.");
//		}
//	};

//	return (
//		<View style={styles.detailSection}>
//			<Text style={styles.sectionTitle}>녹음 상태</Text>

//			<Button
//				title={isPlaying ? "⏸ 일시정지" : "▶ 재생"}
//				onPress={togglePlayback}
//			/>

//			<Button
//				title="녹음 다운로드 및 열기"
//				onPress={downloadAndOpenRecording}
//			/>
//		</View>
//	);
//}

//const styles = StyleSheet.create({
//	detailSection: {
//		backgroundColor: "rgba(255, 255, 255, 0.1)",
//		borderRadius: 10,
//		padding: 15,
//		margin: 15,
//	},
//	sectionTitle: {
//		color: "white",
//		fontSize: 18,
//		fontWeight: "bold",
//		marginBottom: 10,
//		borderBottomWidth: 1,
//		borderBottomColor: "rgba(255, 255, 255, 0.2)",
//		paddingBottom: 10,
//	},
//});

import React, { useState, useEffect } from "react";
import {
	View,
	Text,
	Button,
	StyleSheet,
	Alert,
	ActivityIndicator,
} from "react-native";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Audio } from "expo-audio";

export default function RecordingPlayer() {
	const [sound, setSound] = useState(null);
	const [isPlaying, setIsPlaying] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	// 오디오 세션 구성 - 앱 시작시 한 번만 실행
	useEffect(() => {
		async function configureAudio() {
			try {
				await Audio.setAudioModeAsync({
					allowsRecordingIOS: false,
					playsInSilentModeIOS: true,
					shouldDuckAndroid: true,
					playThroughEarpieceAndroid: false,
					staysActiveInBackground: true,
				});
			} catch (error) {
				console.log("오디오 설정 오류:", error);
			}
		}

		configureAudio();
	}, []);

	// 재생/일시정지 토글 함수 (직접 스트리밍 방식)
	const togglePlayback = async () => {
		try {
			if (sound) {
				if (isPlaying) {
					// 재생 중이면 일시정지
					await sound.pauseAsync();
					setIsPlaying(false);
				} else {
					// 일시정지 상태면 재생 재개
					await sound.playAsync();
					setIsPlaying(true);
				}
			} else {
				// 최초 재생 시작
				setIsLoading(true);

				// 전체 URL보다 더 안정적으로 작동할 수 있도록 경로 수정
				const audioUrl = "http://18.205.227.28:8080/recordings/download/1";

				try {
					// 오디오 로드 시 추가 옵션 설정
					const { sound: newSound } = await Audio.Sound.createAsync(
						{ uri: audioUrl },
						{
							shouldPlay: true,
							progressUpdateIntervalMillis: 300,
							positionMillis: 0,
							volume: 1.0,
							rate: 1.0,
						},
						// 상태 업데이트 콜백 추가
						(status) => {
							if (status.isLoaded) {
								if (status.didJustFinish) {
									setIsPlaying(false);
								}
							} else if (status.error) {
								console.log("재생 중 오류 발생:", status.error);
							}
						}
					);

					// 성공적으로 로드되었을 때 상태 업데이트
					setSound(newSound);
					setIsPlaying(true);
					setIsLoading(false);
				} catch (loadError) {
					console.log("오디오 로드 오류:", loadError);

					// 스트리밍 URL에서 오류 발생 시 대체 URL로 시도
					try {
						const alternativeUrl =
							"http://18.205.227.28:8080/recordings/stream/1";

						const { sound: alternativeSound } = await Audio.Sound.createAsync(
							{ uri: alternativeUrl },
							{ shouldPlay: true }
						);

						setSound(alternativeSound);
						setIsPlaying(true);
						setIsLoading(false);
					} catch (alternativeError) {
						console.log("대체 URL 오디오 로드 오류:", alternativeError);
						Alert.alert(
							"오류",
							"오디오를 재생할 수 없습니다. 잠시 후 다시 시도해주세요."
						);
						setIsLoading(false);
					}
				}
			}
		} catch (error) {
			console.log("재생 오류:", error);
			Alert.alert("오류", "재생 중 문제가 발생했습니다.");
			setIsLoading(false);
		}
	};

	// 컴포넌트 언마운트 시 sound 해제
	useEffect(() => {
		return sound
			? () => {
					sound.unloadAsync();
			  }
			: undefined;
	}, [sound]);

	// 녹음 다운로드 및 열기 함수
	const downloadAndOpenRecording = async () => {
		try {
			setIsLoading(true);
			const uri = "http://18.205.227.28:8080/recordings/download/1";
			const fileUri = FileSystem.documentDirectory + "recording1.mp3";

			const downloadResumable = FileSystem.createDownloadResumable(
				uri,
				fileUri
			);

			const { uri: downloadedUri } = await downloadResumable.downloadAsync();
			console.log("✅ 다운로드 완료:", downloadedUri);
			setIsLoading(false);

			Alert.alert(
				"다운로드 완료",
				"파일을 열까요?",
				[
					{
						text: "취소",
						style: "cancel",
					},
					{
						text: "열기",
						onPress: async () => {
							try {
								const isAvailable = await Sharing.isAvailableAsync();
								if (isAvailable) {
									await Sharing.shareAsync(downloadedUri);
								} else {
									Alert.alert(
										"공유 불가",
										"이 기기에서 파일 열기 기능을 사용할 수 없습니다."
									);
								}
							} catch (error) {
								console.log("파일 열기 오류:", error);
								Alert.alert("오류", "파일을 열 수 없습니다.");
							}
						},
					},
				],
				{ cancelable: true }
			);
		} catch (error) {
			console.log("❌ 다운로드 또는 열기 오류:", error);
			Alert.alert("오류", "녹음 다운로드 또는 열기에 실패했습니다.");
			setIsLoading(false);
		}
	};

	return (
		<View style={styles.detailSection}>
			<Text style={styles.sectionTitle}>녹음 상태</Text>

			<View style={styles.buttonContainer}>
				{isLoading ? (
					<ActivityIndicator size="small" color="#fff" />
				) : (
					<Button
						title={isPlaying ? "⏸ 일시정지" : "▶ 재생"}
						onPress={togglePlayback}
					/>
				)}

				<Button
					title="녹음 다운로드 및 열기"
					onPress={downloadAndOpenRecording}
					disabled={isLoading}
				/>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
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
	buttonContainer: {
		flexDirection: "row",
		justifyContent: "space-around",
		alignItems: "center",
		marginTop: 15,
	},
});
