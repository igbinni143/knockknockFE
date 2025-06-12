import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
	container: {
		flex: 0.9,
		justifyContent: "center",
		alignItems: "center",
		marginTop: 80,
	},
	containerschedule: {
		flex: 0.8,
		justifyContent: "center",
		alignItems: "center",
	},
	secondcontainer: {
		height: "78%",
		justifyContent: "center",
		alignItems: "center",
		paddingLeft: 20,
		paddingRight: 20,
	},
	h1: {
		color: "white",
		fontWeight: 800,
		fontSize: 30,
		marginBottom: 40,
	},

	modalOverlay: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "rgba(0, 0, 0, 0.6)", // 반투명 배경
	},

	modalContainer: {
		backgroundColor: "#1a1a1a", // 딥 다크 배경
		padding: 20,
		borderRadius: 15,
		width: "85%",
		borderWidth: 1,
		borderColor: "#ffffff40",
		marginTop: 20,
	},

	modalTitle: {
		color: "white",
		fontSize: 20,
		fontWeight: "bold",
		marginBottom: 20,
		textAlign: "center",
	},

	input: {
		backgroundColor: "rgba(255, 255, 255, 0.1)",
		color: "white",
		borderWidth: 1,
		borderColor: "#ffffff50",
		borderRadius: 10,
		paddingHorizontal: 15,
		paddingVertical: 10,
		marginBottom: 15,
	},

	pillcontent: {
		backgroundColor: "rgb(255, 255, 255)",
		borderRadius: 12,
		padding: 15,
		marginBottom: 10,
		borderWidth: 1,
		borderColor: "#ffffff20",
		width: "100%",
		alignSelf: "center",
	},
	scrollContainer: {
		paddingVertical: 10,
		alignItems: "center",
	},

	pillCard: {
		backgroundColor: "rgba(255, 255, 255, 0.08)",
		borderRadius: 12,
		paddingVertical: 15,
		paddingHorizontal: 20,
		marginBottom: 12,
		width: 300,
		borderWidth: 1,
		borderColor: "#ffffff22",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.3,
		shadowRadius: 4,
		elevation: 5,
	},

	pillTitle: {
		color: "white",
		fontSize: 18,
		fontWeight: "bold",
		marginBottom: 6,
	},
	pillDescription: {
		color: "rgba(255, 255, 255, 0.8)",
		fontSize: 14,
	},

	pillCardHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
	deleteButtonText: {
		color: "#ff4d4d8b",
		fontSize: 14,
		fontWeight: "bold",
	},
	scrollContainer: {
		paddingVertical: 10,
		alignItems: "center",
	},
	pillCard: {
		backgroundColor: "rgba(255, 255, 255, 0.08)",
		borderRadius: 12,
		paddingVertical: 15,
		paddingHorizontal: 25,
		//marginBottom: 12,
		width: "100%",
		borderWidth: 1,
		borderColor: "#ffffff22",
		marginTop: 30,
	},
	pillCardHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
	pillTitle: {
		color: "white",
		fontSize: 18,
		fontWeight: "bold",
	},
	pillDescription: {
		color: "rgba(255, 255, 255, 0.8)",
		fontSize: 14,
		marginTop: 4,
	},
	deleteButtonText: {
		color: "#ff5c5c",
		fontWeight: "bold",
		fontSize: 14,
	},

	modalOverlay: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "rgba(0, 0, 0, 0.6)",
	},
	modalContainer: {
		backgroundColor: "#1a1a1a",
		padding: 20,
		borderRadius: 15,
		width: "85%",
	},
	modalpillContainer: {
		backgroundColor: "#1a1a1a",
		padding: 20,
		borderRadius: 15,
		width: "95%",
	},
	modalTitle: {
		color: "white",
		fontSize: 18,
		fontWeight: "bold",
		marginBottom: 15,
		textAlign: "center",
	},
	input: {
		backgroundColor: "rgba(255,255,255,0.1)",
		color: "white",
		borderWidth: 1,
		borderColor: "#ffffff50",
		borderRadius: 10,
		paddingHorizontal: 15,
		paddingVertical: 10,
		marginBottom: 15,
	},
	modalButtonRow: {
		flexDirection: "row",
		justifyContent: "space-between",
	},
	modalButton: {
		backgroundColor: "#4CAF50",
		paddingVertical: 10,
		paddingHorizontal: 15,
		borderRadius: 15,
		alignItems: "center",
	},
	modaladdingButton: {
		backgroundColor: "#4caf4f67",
		paddingVertical: 7,
		paddingHorizontal: 20,
		borderRadius: 25,
		alignItems: "center",
	},

	modaladdingButtonText: {
		color: "white",
		fontSize: 13,
		fontWeight: "bold",
		textAlign: "center",
	},
	modalButtonText: {
		color: "white",
		fontSize: 15,
		fontWeight: "bold",
		textAlign: "center",
	},

	addButton: {
		backgroundColor: "rgba(255, 255, 255, 0.15)",
		paddingVertical: 10,
		paddingHorizontal: 20,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: "#ffffff50",
		marginTop: 20,
		marginBottom: 20,
	},
	addPillButton: {
		backgroundColor: "rgba(255, 255, 255, 0.15)",
		paddingVertical: 10,
		paddingHorizontal: 15,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: "#ffffff50",
		position: "absolute",
		top: -15,
		right: 15,
	},
	addPillButtonText: {
		color: "white",
		fontSize: 14,
		textAlign: "center",
		fontWeight: "bold",
	},
	addButtonText: {
		color: "white",
		fontSize: 14,
		textAlign: "center",
		fontWeight: "bold",
	},
	addEventButton: {
		backgroundColor: "rgba(255, 255, 255, 0.15)",
		paddingVertical: 8,
		position: "absolute",
		right: 20,
		top: -70,
		paddingHorizontal: 8,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: "#ffffff50",
		marginTop: 10,
		marginBottom: 10,
	},
	addEventButtonText: {
		color: "white",
		fontSize: 12,
		textAlign: "center",
		fontWeight: "bold",
	},
});
