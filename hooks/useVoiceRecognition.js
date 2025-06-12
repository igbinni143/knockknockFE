// hooks/useVoiceRecognition.js
import { useState, useEffect, useCallback } from "react";
import Voice from "@react-native-voice/voice";

export const useVoiceRecognition = ({
	language = "ko-KR",
	onResult = () => {},
	onStart = () => {},
	onEnd = () => {},
	onError = () => {},
}) => {
	const [isListening, setIsListening] = useState(false);
	const [result, setResult] = useState("");
	const [error, setError] = useState(null);

	// 음성 인식 이벤트 핸들러들
	const handleSpeechStart = useCallback(() => {
		console.log("음성 인식 시작");
		setIsListening(true);
		setResult("");
		setError(null);
		onStart();
	}, [onStart]);

	const handleSpeechEnd = useCallback(() => {
		console.log("음성 인식 종료");
		setIsListening(false);
		onEnd();
	}, [onEnd]);

	const handleSpeechResults = useCallback(
		(event) => {
			const spokenText = event.value[0];
			console.log("음성 인식 결과:", spokenText);
			setResult(spokenText);
			onResult(spokenText);
		},
		[onResult]
	);

	const handleSpeechError = useCallback(
		(event) => {
			console.log("음성 인식 오류:", event.error);
			setIsListening(false);
			setError(event.error);
			onError(event.error);
		},
		[onError]
	);

	// 음성 인식 시작
	const startListening = useCallback(async () => {
		try {
			await Voice.start(language);
		} catch (err) {
			console.log("음성 인식 시작 오류:", err);
			setError(err);
			onError(err);
		}
	}, [language, onError]);

	// 음성 인식 중지
	const stopListening = useCallback(async () => {
		try {
			await Voice.stop();
			setIsListening(false);
		} catch (err) {
			console.log("음성 인식 중지 오류:", err);
			setError(err);
		}
	}, []);

	// 음성 인식 토글
	const toggleListening = useCallback(() => {
		if (isListening) {
			stopListening();
		} else {
			startListening();
		}
	}, [isListening, startListening, stopListening]);

	// 리셋 함수
	const reset = useCallback(() => {
		setResult("");
		setError(null);
		if (isListening) {
			stopListening();
		}
	}, [isListening, stopListening]);

	// Voice 이벤트 리스너 설정
	useEffect(() => {
		Voice.onSpeechStart = handleSpeechStart;
		Voice.onSpeechEnd = handleSpeechEnd;
		Voice.onSpeechResults = handleSpeechResults;
		Voice.onSpeechError = handleSpeechError;

		return () => {
			Voice.destroy().then(Voice.removeAllListeners);
		};
	}, [
		handleSpeechStart,
		handleSpeechEnd,
		handleSpeechResults,
		handleSpeechError,
	]);

	return {
		isListening,
		result,
		error,
		startListening,
		stopListening,
		toggleListening,
		reset,
	};
};
