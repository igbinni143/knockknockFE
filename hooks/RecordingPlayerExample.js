import { useState } from "react";
import { View, Text, TouchableOpacity, FlatList, Alert } from "react-native";
import { useAudioRecorder } from "./useAudioRecorder";

const RecordingPlayerExample = () => {
	const [selectedRecording, setSelectedRecording] = useState(null);

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
		formatDuration,
	} = useAudioRecorder({
		onRecordingStart: () => {
			console.log("녹음 시작됨");
		},
		onRecordingEnd: (recordingInfo) => {
			console.log("녹음 완료:", recordingInfo);
			Alert.alert(
				"녹음 완료",
				`${formatDuration(
					recordingInfo.duration
				)} 길이의 녹음이 저장되었습니다.`
			);
		},
		onPlaybackEnd: () => {
			console.log("재생 완료");
			setSelectedRecording(null);
		},
		onRecordingError: (error) => {
			Alert.alert("오류", error.message);
		},
	});

	// 녹음 시작/중지
	const handleRecordingToggle = () => {
		if (isRecording) {
			stopRecording();
		} else {
			startRecording();
		}
	};

	// 특정 녹음 재생
	const handlePlayRecording = async (recording) => {
		if (isPlaying && selectedRecording?.id === recording.id) {
			// 같은 파일이 재생 중이면 중지
			await stopPlayback();
			setSelectedRecording(null);
		} else {
			// 다른 파일 재생 또는 새로 재생
			setSelectedRecording(recording);
			await playRecording(recording.uri);
		}
	};

	// 녹음 항목 렌더링
	const renderRecordingItem = ({ item }) => (
		<View
			style={{
				backgroundColor: "#f0f0f0",
				padding: 15,
				marginVertical: 5,
				borderRadius: 10,
				flexDirection: "row",
				justifyContent: "space-between",
				alignItems: "center",
			}}
		>
			<View style={{ flex: 1 }}>
				<Text style={{ fontSize: 16, fontWeight: "bold" }}>{item.name}</Text>
				<Text style={{ color: "#666", fontSize: 14 }}>
					{item.date} | {formatDuration(item.duration)}
				</Text>
			</View>

			<View style={{ flexDirection: "row", gap: 10 }}>
				{/* 재생/일시정지 버튼 */}
				<TouchableOpacity
					onPress={() => handlePlayRecording(item)}
					style={{
						backgroundColor:
							isPlaying && selectedRecording?.id === item.id
								? "#ff4444"
								: "#4444ff",
						padding: 10,
						borderRadius: 20,
						minWidth: 80,
					}}
				>
					<Text style={{ color: "white", textAlign: "center", fontSize: 12 }}>
						{isPlaying && selectedRecording?.id === item.id
							? "⏸️ 중지"
							: "▶️ 재생"}
					</Text>
				</TouchableOpacity>

				{/* 삭제 버튼 */}
				<TouchableOpacity
					onPress={() => {
						Alert.alert("삭제 확인", "이 녹음을 삭제하시겠습니까?", [
							{ text: "취소", style: "cancel" },
							{
								text: "삭제",
								onPress: () => deleteRecording(item.id),
								style: "destructive",
							},
						]);
					}}
					style={{
						backgroundColor: "#ff4444",
						padding: 10,
						borderRadius: 20,
					}}
				>
					<Text style={{ color: "white", fontSize: 12 }}>🗑️</Text>
				</TouchableOpacity>
			</View>
		</View>
	);

	return (
		<View style={{ flex: 1, padding: 20 }}>
			<Text
				style={{
					fontSize: 24,
					fontWeight: "bold",
					marginBottom: 20,
					textAlign: "center",
				}}
			>
				음성 녹음 및 재생
			</Text>

			{/* 녹음 컨트롤 */}
			<View style={{ alignItems: "center", marginBottom: 30 }}>
				<TouchableOpacity
					onPress={handleRecordingToggle}
					style={{
						backgroundColor: isRecording ? "#ff4444" : "#44aa44",
						padding: 20,
						borderRadius: 50,
						width: 100,
						height: 100,
						justifyContent: "center",
						alignItems: "center",
					}}
				>
					<Text style={{ color: "white", fontSize: 16, textAlign: "center" }}>
						{isRecording ? "🛑\n중지" : "🎙️\n녹음"}
					</Text>
				</TouchableOpacity>

				{/* 녹음 시간 표시 */}
				{isRecording && (
					<Text style={{ marginTop: 10, fontSize: 18, color: "#ff4444" }}>
						!! {formatDuration(recordingDuration)}
					</Text>
				)}
			</View>

			{/* 현재 재생 중인 정보 */}
			{isPlaying && selectedRecording && (
				<View
					style={{
						backgroundColor: "#e8f4f8",
						padding: 15,
						borderRadius: 10,
						marginBottom: 20,
					}}
				>
					<Text style={{ fontSize: 16, fontWeight: "bold", color: "#2196F3" }}>
						🎵 재생 중: {selectedRecording.name}
					</Text>
					<Text style={{ color: "#666", marginTop: 5 }}>
						길이: {formatDuration(selectedRecording.duration)}
					</Text>
				</View>
			)}

			{/* 녹음 목록 */}
			<Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 10 }}>
				저장된 녹음 ({recordings.length}개)
			</Text>

			{recordings.length === 0 ? (
				<View
					style={{
						flex: 1,
						justifyContent: "center",
						alignItems: "center",
						backgroundColor: "#f9f9f9",
						borderRadius: 10,
						padding: 20,
					}}
				>
					<Text style={{ color: "#999", fontSize: 16, textAlign: "center" }}>
						아직 녹음된 파일이 없습니다.{"\n"}위의 녹음 버튼을 눌러
						시작해보세요!
					</Text>
				</View>
			) : (
				<FlatList
					data={recordings}
					renderItem={renderRecordingItem}
					keyExtractor={(item) => item.id}
					showsVerticalScrollIndicator={false}
				/>
			)}
		</View>
	);
};

export default RecordingPlayerExample;
