import { useNavigation } from "@react-navigation/native";
import { useState } from "react";

const Login = () => {
	const [phone, setPhone] = useState();
	const [password, setPassword] = useState();
	const [role, setRole] = useState();
	const [loginCheck, setLoginCheck] = useState(false);

	const navigation = useNavigation();

	const handleLogin = async (e) => {
		e.preventDefault();
		await new Promise((r) => setTimeout(r, 1000));

		const response = await fetch("https://18.205.227.28:8080/login", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				phone: phone,
				password: password,
				role: role,
			}),
		});

		console.log("📦 Status:", response.status);

		const rawText = await response.text();
		console.log("📄 Raw Response Text:", rawText);

		let result;
		try {
			result = JSON.parse(rawText); // 수동으로 파싱
			console.log("✅ Parsed JSON:", result);
		} catch (err) {
			console.error("❌ JSON 파싱 실패:", err);
			result = {};
		}

		if (response.status === 200) {
			setLoginCheck(false);
			const userId = result.userId;
			navigation.navigate("Dashboard", { userId });
		} else {
			setLoginCheck(true);
			alert("로그인 실패");
		}
	};
};
