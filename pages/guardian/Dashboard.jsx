//guardian/Dashboard.jsx
import {
	StyleSheet,
	View,
	Text,
	FlatList,
	ActivityIndicator,
	TouchableOpacity,
} from "react-native";
import { useState, useEffect } from "react";
import { API_ADDRESS } from "../../logic/API";
import UserCard from "../guardian/Component/UserCard"; // UserCard 컴포넌트 import
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useRoute } from "@react-navigation/native";

export default function Dashboard() {
	const route = useRoute();
	const { userId } = route.params;
	const [users, setUsers] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(false);

	const navigation = useNavigation();

	const navigateToDetail = (userData) => {
		navigation.navigate("DailyIndiv", { elderlyData: userData });
	};
	useEffect(() => {
		const fetchUsers = async () => {
			try {
				setLoading(true);
				await new Promise((r) => setTimeout(r, 1000));

				const response = await fetch(
					`${API_ADDRESS}/manager/${userId}/elderly`,
					{
						method: "GET",
						headers: {
							"Content-Type": "application/json",
						},
					}
				);

				if (!response.ok) {
					throw new Error(`API 요청 실패: ${response.status}`);
				}

				const data = await response.json();
				console.log("사용자 목록:", data);

				setUsers(data);
				setLoading(false);
			} catch (error) {
				console.error("사용자 정보 가져오기 실패:", error.message || error);
				setError(true);
				setLoading(false);
			}
		};

		fetchUsers();
	}, []);

	if (loading) {
		return (
			<LinearGradient colors={["#123", "#000"]} style={{ flex: 1 }}>
				<View style={styles.container}>
					<ActivityIndicator size="large" color="#ffffff" />
					<Text style={styles.loadingText}>어르신 정보를 불러오는 중...</Text>
				</View>
			</LinearGradient>
		);
	}

	if (error) {
		return (
			<View style={styles.container}>
				<Text style={styles.errorText}>
					데이터를 불러오는 중 오류가 발생했습니다
				</Text>
			</View>
		);
	}
	const handleBack = () => {
		navigation.goBack();
	};

	return (
		<LinearGradient colors={["#123", "#000"]} style={{ flex: 1 }}>
			<View style={styles.header}>
				<TouchableOpacity onPress={handleBack} style={{ marginTop: 50 }}>
					<Text style={{ color: "white", fontSize: 20 }}>{`←`}</Text>
				</TouchableOpacity>
			</View>
			<View style={styles.container}>
				<Text style={styles.headerText}>강남구 시설</Text>
				<FlatList
					data={users}
					keyExtractor={(item) => item.elderly_id.toString()}
					renderItem={({ item }) => (
						<TouchableOpacity onPress={() => navigateToDetail(item)}>
							<UserCard userData={item} />
						</TouchableOpacity>
					)}
					numColumns={2}
					contentContainerStyle={styles.cardContainer}
				/>
			</View>
		</LinearGradient>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 16,
		marginTop: 50,
		alignItems: "center",
		justifyContent: "center",
	},
	headerText: {
		fontSize: 20,
		fontWeight: "bold",
		color: "white",
		marginBottom: 20,
	},
	cardContainer: {
		paddingBottom: 20,
		alignItems: "center",
	},
	loadingText: {
		color: "white",
		marginTop: 10,
	},
	errorText: {
		color: "#FF4040",
		textAlign: "center",
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingTop: 20,
		paddingHorizontal: 20,
		marginBottom: 20,
	},
});
