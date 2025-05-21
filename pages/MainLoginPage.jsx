import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import elder from "../components/img/elder.png";
import people from "../components/img/People.png";
import * as RST from "./styles/rootStyles";
import { LinearGradient } from "expo-linear-gradient";

export default function LoginPage({ navigation }) {
	const handleELogin = () => {
		navigation.navigate("Elogin");
	};
	const handleGLogin = () => {
		navigation.navigate("Glogin");
	};

	return (
		<LinearGradient {...RST.gradientProps} style={{ flex: 1 }}>
			<View style={styles.container}>
				{/* 어르신 버튼 */}
				<TouchableOpacity
					onPress={handleELogin}
					style={styles.loginbuttonWrapper}
				>
					<View style={styles.loginbutton}>
						<Image source={elder} style={RST.image} />
					</View>
					<View style={styles.labelWrapper}>
						<View style={styles.loginLabel}>
							<Text style={styles.labelText}>어르신</Text>
						</View>
					</View>
				</TouchableOpacity>

				{/* 보호자 버튼 */}
				<TouchableOpacity
					onPress={handleGLogin}
					style={styles.loginbuttonWrapper}
				>
					<View style={styles.loginbutton}>
						<Image source={people} style={RST.image} />
					</View>
					<View style={styles.labelWrapper}>
						<View style={styles.loginLabel}>
							<Text style={styles.labelText}>보호자</Text>
						</View>
					</View>
				</TouchableOpacity>
			</View>
		</LinearGradient>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		flexDirection: "row",
		justifyContent: "center",
		alignItems: "center",
	},
	loginbuttonWrapper: {
		alignItems: "center",
		marginHorizontal: 20,
	},
	loginbutton: {
		width: 110,
		height: 110,
		borderRadius: 10,
		backgroundColor: "#00000044",
		justifyContent: "center",
		alignItems: "center",
		overflow: "hidden",
	},

	labelWrapper: {
		marginTop: 10,
	},
	loginLabel: {
		paddingVertical: 6,
		paddingHorizontal: 16,
		borderRadius: 10,
	},
	labelText: {
		fontSize: 16,
		color: "white",
		fontWeight: "bold",
	},
});
