import { LinearGradient } from "expo-linear-gradient";
import { BackHandler, Image, Text, TouchableOpacity, View } from "react-native";
import aiCB from "../../components/img/aiCB.png";
import phR from "../../components/img/phoneRed.png";
import phG from "../../components/img/phoneGreen.png";
import profile from "../../components/img/profile.png";
import * as ElPU from "./UI/EloginPageUI";
import { useState, useEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import { useUser } from "../../logic/UserContext";

const ElderMainPage = () => {
	const navigation = useNavigation();

	// Context에서 사용자 데이터 가져오기
	const { userData } = useUser();

	useEffect(() => {
		console.log("ElderMainPage - Context에서 가져온 userData:", userData);
	}, []);

	const handleProfileClick = () => {
		navigation.navigate("ElderProfile");
	};

	const handlePhoneResetClick = () => {
		setPhoneClick(false);
	};

	const [phoneClick, setPhoneClick] = useState(false);
	const [chatText, setChatText] = useState("버튼을 눌러 대화를 시작하세요");

	const TimingShown = () => {
		const name = userData?.name?.split(" ")[0] || "어르신";
		setChatText(`${name} 어르신 약은 드셨나요?`);
		setTimeout(() => setChatText(`${name} 어르신 식사는 하셨나요?`), 2000);
		setTimeout(() => setChatText(`${name} 어르신 몸은 어떠신가요?`), 4000);
	};

	const handlePhoneClick = () => {
		setPhoneClick(true);
		TimingShown();
	};
	const startRecord = () => {};
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

				{phoneClick ? (
					<View style={ElPU.styles.chatBox}>
						<Text style={ElPU.styles.chatText}>{chatText}</Text>
					</View>
				) : (
					<View style={ElPU.styles.chatBox}>
						<Text style={ElPU.styles.chatText}>
							버튼을 눌러 대화를 시작하세요
						</Text>
					</View>
				)}

				<View style={ElPU.styles.buttonWrapper}>
					{phoneClick ? (
						<TouchableOpacity
							onPress={handlePhoneResetClick}
							style={ElPU.styles.touchArea}
						>
							<Image source={phR} style={ElPU.styles.phoneImage} />
						</TouchableOpacity>
					) : (
						<TouchableOpacity
							onPress={handlePhoneClick}
							style={ElPU.styles.touchArea}
						>
							<Image source={phG} style={ElPU.styles.phoneImage} />
						</TouchableOpacity>
					)}
				</View>
			</View>
		</LinearGradient>
	);
};

export default ElderMainPage;
