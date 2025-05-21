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

		const response = await fetch("http://18.205.227.28:8080", {
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
		const result = await response.json();
		if (response.status === 200) {
			setLoginCheck(false);

			// ✅ 응답에서 userId 받아오기
			const userId = result.userId;

			// ✅ Dashboard로 이동하면서 userId 전달
			navigation.navigate("Dashboard", { userId });
		} else {
			setLoginCheck(true);
			alert("로그인 실패");
		}
	};
};
