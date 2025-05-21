//elder/ElderProfile.jsx
import { LinearGradient } from "expo-linear-gradient";
import grandma from "../../components/img/grandma.png";
import * as EPF from "./UI/EProfileUI";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { useUser } from "../../logic/UserContext";
import { StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";

const ElderProfile = () => {
	// Context에서 사용자 데이터 가져오기
	const { userData } = useUser();
	const navigation = useNavigation();

	// 이름 분리 (성과 이름)
	const nameParts = userData.name ? userData.name.split(" ") : ["어르신"];
	const displayName =
		nameParts.length > 1 ? nameParts[0] : userData.name || "어르신";

	// 생년월일 포맷팅
	const formatBirthDate = (dateString) => {
		if (!dateString) return "-";
		const parts = dateString.split("-");
		if (parts.length === 3) {
			return `${parts[0]}년 ${parts[1]}월 ${parts[2]}일`;
		}
		return dateString;
	};
	const handleBack = () => {
		navigation.goBack();
	};

	return (
		<LinearGradient colors={["#123", "#000"]} style={{ flex: 1 }}>
			<View style={EPF.styles.header}>
				<TouchableOpacity onPress={handleBack} style={{ marginTop: 50 }}>
					<Text style={{ color: "white", fontSize: 20 }}>{`←`}</Text>
				</TouchableOpacity>
			</View>
			<View style={EPF.styles.container}>
				<Image source={grandma} style={EPF.styles.mainImage} />
				<Text style={EPF.styles.mainText}>{userData.name || "어르신"}</Text>

				<View style={styles.infoContainer}>
					<InfoItem
						label="생년월일"
						value={formatBirthDate(userData.birthDate)}
					/>
					<InfoItem
						label="건강 상태"
						value={userData.hasDisease || "정보 없음"}
					/>
					<InfoItem
						label="건강검진 여부"
						value={userData.hasHealthCheck ? "완료" : "미완료"}
					/>
					<InfoItem
						label="담당 매니저"
						value={userData.managerName || "배정되지 않음"}
					/>
					<InfoItem
						label="매니저 연락처"
						value={userData.managerPhone || "-"}
					/>
				</View>
			</View>
		</LinearGradient>
	);
};

// 정보 항목 컴포넌트
const InfoItem = ({ label, value }) => (
	<View style={styles.infoItem}>
		<Text style={styles.infoLabel}>{label}</Text>
		<Text style={styles.infoValue}>{value}</Text>
	</View>
);

// 추가 스타일
const styles = StyleSheet.create({
	scrollContainer: {
		flexGrow: 1,
	},
	infoContainer: {
		width: "80%",
		marginTop: 30,
		backgroundColor: "rgba(255, 255, 255, 0.1)",
		borderRadius: 10,
		padding: 20,
	},
	infoItem: {
		marginBottom: 15,
		borderBottomWidth: 1,
		borderBottomColor: "rgba(255, 255, 255, 0.2)",
		paddingBottom: 10,
	},
	infoLabel: {
		color: "rgba(255, 255, 255, 0.7)",
		fontSize: 16,
		marginBottom: 5,
	},
	infoValue: {
		color: "white",
		fontSize: 18,
		fontWeight: "500",
	},
});

export default ElderProfile;
