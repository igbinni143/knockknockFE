import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	scrollContainer: {
		flexGrow: 1,
		paddingBottom: 40,
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingTop: 50,
		paddingHorizontal: 20,
		marginBottom: 20,
	},
	backButton: {
		padding: 10,
	},
	backButtonText: {
		color: "white",
		fontSize: 16,
	},
	headerTitle: {
		color: "white",
		fontSize: 20,
		fontWeight: "bold",
	},
	placeholder: {
		width: 50,
	},
	infoBox: {
		marginTop: 130,
		backgroundColor: "rgba(79, 195, 247, 0.2)",
		borderRadius: 10,
		padding: 15,
		margin: 15,
	},
	infoText: {
		color: "white",
		fontSize: 14,
		lineHeight: 20,
	},
	formSection: {
		backgroundColor: "rgba(255, 255, 255, 0.1)",
		borderRadius: 10,
		padding: 15,
		margin: 15,
	},
	sectionTitle: {
		color: "white",
		fontSize: 18,
		fontWeight: "bold",
		marginBottom: 15,
		borderBottomWidth: 1,
		borderBottomColor: "rgba(255, 255, 255, 0.2)",
		paddingBottom: 10,
	},
	checkItem: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingVertical: 12,
		borderBottomWidth: 1,
		borderBottomColor: "rgba(255, 255, 255, 0.1)",
	},
	checkLabel: {
		color: "white",
		fontSize: 16,
	},
	notesContainer: {
		marginTop: 20,
	},
	notesLabel: {
		color: "white",
		fontSize: 16,
		marginBottom: 10,
	},
	notesInput: {
		backgroundColor: "rgba(255, 255, 255, 0.1)",
		borderRadius: 8,
		padding: 12,
		color: "white",
		height: 100,
		textAlignVertical: "top",
	},
	submitButton: {
		backgroundColor: "#4CAF50",
		borderRadius: 10,
		padding: 15,
		alignItems: "center",
		marginHorizontal: 15,
		marginTop: 20,
	},
	submitButtonText: {
		color: "white",
		fontSize: 16,
		fontWeight: "bold",
	},
	loadingContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
	loadingText: {
		color: "white",
		marginTop: 10,
	},
});
