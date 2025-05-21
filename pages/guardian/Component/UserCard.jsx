import { StyleSheet, Text, View, Image } from "react-native";
import grandpa from "../../../components/img/grandpa.png";
import grandma from "../../../components/img/grandma.png";

export default function UserCard({ userData }) {
	// 사용자 이름의 첫 글자가 "김"이면 할머니, 아니면 할아버지 이미지 사용
	const profileImage = userData?.gender == "F" ? grandma : grandpa;

	// 상태에 따른 스타일 결정
	const getStatusStyle = () => {
		if (userData.status === "위험") {
			return { color: "#FF4040", fontWeight: "bold" };
		} else if (userData.status === "양호") {
			return { color: "#40FF40", fontWeight: "bold" };
		}
		return { color: "#DDDDDD" };
	};

	return (
		<View style={styles.card}>
			<Image
				source={profileImage}
				style={styles.profileImage}
				resizeMode="cover"
			/>
			<Text style={styles.nameText}>{userData.name}</Text>
			<Text style={[styles.statusText, getStatusStyle()]}>
				{userData.status || "정보 없음"}
			</Text>

			{userData.appUsedToday ? (
				<View style={styles.appUsedBadge}>
					<Text style={styles.appUsedText}>오늘 앱 사용함</Text>
				</View>
			) : (
				<View style={styles.appnotUsedBadge}>
					<Text style={styles.appnotUsedText}>오늘 앱 사용안함</Text>
				</View>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	card: {
		width: 150,
		height: 200,
		borderRadius: 10,
		backgroundColor: "#00000044",
		justifyContent: "center",
		alignItems: "center",
		overflow: "hidden",
		padding: 5,
		position: "relative",
		margin: 10, // 카드 간격 추가
	},
	profileImage: {
		width: 80,
		height: 80,
		borderRadius: 30,
		marginBottom: 5,
	},
	nameText: {
		color: "white",
		textAlign: "center",
		fontWeight: "bold",
		fontSize: 17,
	},
	statusText: {
		fontSize: 14,
		marginTop: 4,
	},
	appUsedBadge: {
		backgroundColor: "rgba(0, 128, 0, 0.7)",
		paddingVertical: 2,
		paddingHorizontal: 5,
		borderRadius: 5,
		position: "absolute",
		bottom: 5,
		left: 5,
		right: 5,
	},
	appnotUsedBadge: {
		backgroundColor: "rgba(180, 6, 6, 0.7)",
		paddingVertical: 2,
		paddingHorizontal: 5,
		borderRadius: 5,
		position: "absolute",
		bottom: 5,
		left: 5,
		right: 5,
	},
	appUsedText: {
		color: "white",
		fontSize: 12,
		textAlign: "center",
	},
	appnotUsedText: {
		color: "white",
		fontSize: 12,
		textAlign: "center",
	},
});
