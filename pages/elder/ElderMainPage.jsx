// pages/ElderMainPage.js (리팩토링된 버전)
import { LinearGradient } from "expo-linear-gradient";
import { Image, Text, TouchableOpacity, View } from "react-native";
import aiCB from "../../components/img/aiCB.png";
import pill from "../../components/img/pill.png";
import calender from "../../components/img/calender.png";
import phR from "../../components/img/phoneRed.png";
import phG from "../../components/img/phoneGreen.png";
import profile from "../../components/img/profile.png";
import * as ElPU from "./UI/EloginPageUI";
import { useState, useEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import { useUser } from "../../logic/UserContext";
import VoiceChat from "../../components/img/VoiceChat/VoiceChat";
const ElderMainPage = ({ route }) => {
	const navigation = useNavigation();
	const { userData } = useUser();
	const [phoneClick, setPhoneClick] = useState(false);

	// route params에서 elderlyId 가져오기
	let elderlyId = null;
	if (route?.params?.elderlyId) {
		elderlyId = route.params.elderlyId;
	} else if (userData?.id) {
		elderlyId = userData.id;
	}

	useEffect(() => {
		console.log("ElderMainPage - route.params:", route?.params);
		console.log("ElderMainPage - Context에서 가져온 userData:", userData);
		console.log("ElderMainPage - 최종 elderlyId:", elderlyId);
	}, [userData, elderlyId]);

	// 네비게이션 핸들러들
	const handleProfileClick = () => {
		navigation.navigate("ElderProfile", { elderlyId });
	};

	const handleNavPillClick = (name) => {
		console.log("약 페이지로 이동 - name:", name, "elderlyId:", elderlyId);
		navigation.navigate("ElderPill", {
			name: name,
			elderlyId: elderlyId,
		});
	};

	const handlePNavCalClick = (name) => {
		console.log("일정 페이지로 이동 - name:", name, "elderlyId:", elderlyId);
		navigation.navigate("ElderSchedule", {
			name: name,
			elderlyId: elderlyId,
		});
	};

	// VoiceChat 컴포넌트 이벤트 핸들러들
	const handleVoiceResult = (spokenText) => {
		console.log("음성 인식 결과:", spokenText);
		// 필요시 추가 처리
	};

	const handleVoiceNavigate = (destination) => {
		const name = userData?.name?.split(" ")[0] || "어르신";

		switch (destination) {
			case "pill":
				handleNavPillClick(name);
				break;
			case "schedule":
				handlePNavCalClick(name);
				break;
			default:
				console.log("알 수 없는 네비게이션 요청:", destination);
		}
	};

	const handleVoiceActivate = () => {
		setPhoneClick(true);
	};

	const handleVoiceDeactivate = () => {
		setPhoneClick(false);
	};

	return (
		<LinearGradient colors={["#123", "#000"]} style={{ flex: 1 }}>
			<View style={ElPU.styles.headerContainer}>
				<TouchableOpacity onPress={handleProfileClick}>
					<Image source={profile} style={ElPU.styles.subProfileImg} />
				</TouchableOpacity>
			</View>

			<View style={ElPU.styles.container}>
				<Image source={aiCB} style={ElPU.styles.mainImage} />
				<Text style={ElPU.styles.mainText}>!! 똑똑 !!</Text>

				<View style={ElPU.styles.rowcontainer}>
					<View style={ElPU.styles.buttonWrapper2}>
						<TouchableOpacity
							onPress={() =>
								handleNavPillClick(userData?.name?.split(" ")[0] || "어르신")
							}
							style={ElPU.styles.touchArea}
						>
							<Image source={pill} style={ElPU.styles.pillImage} />
						</TouchableOpacity>
					</View>

					<View style={ElPU.styles.buttonWrapper}>
						{/* VoiceChat 컴포넌트 사용 */}
						<VoiceChat
							userName={userData?.name?.split(" ")[0] || "어르신"}
							onVoiceResult={handleVoiceResult}
							onNavigate={handleVoiceNavigate}
							isActive={phoneClick}
							onActivate={handleVoiceActivate}
							onDeactivate={handleVoiceDeactivate}
							phoneGreenImage={phG}
							phoneRedImage={phR}
							chatBoxStyle={ElPU.styles.chatBox}
							chatTextStyle={ElPU.styles.chatText}
							phoneImageStyle={ElPU.styles.phoneImage}
							touchAreaStyle={ElPU.styles.touchArea}
							questions={[
								"약은 드셨나요?",
								"식사는 하셨나요?",
								"몸은 어떠신가요?",
							]}
						/>
					</View>

					<View style={ElPU.styles.buttonWrapper2}>
						<TouchableOpacity
							onPress={() =>
								handlePNavCalClick(userData?.name?.split(" ")[0] || "어르신")
							}
							style={ElPU.styles.touchArea}
						>
							<Image source={calender} style={ElPU.styles.calImage} />
						</TouchableOpacity>
					</View>
				</View>
			</View>
		</LinearGradient>
	);
};

export default ElderMainPage;
