import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
	container: {
		flex: 0.9,
		marginTop: 50,
		justifyContent: "center",
		alignItems: "center",
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "flex-start",
		paddingTop: 20,
		paddingHorizontal: 20,
		marginBottom: 20,
	},
	mainImage: {
		width: 130,
		height: 130,
		paddingTop: 0,
		marginTop: 0,
		marginBottom: 40,
		borderRadius: 100,
		shadowColor: "green",
		borderWidth: 1,
		borderColor: "rgb(255, 255, 255)",
	},
	mainText: {
		color: "white",
		fontSize: 28,
		fontWeight: "bold",
		marginBottom: 10,
		textAlign: "center",
	},
	row: {
		flexDirection: "row",
		alignItems: "center",
		gap: 40,
	},
});
