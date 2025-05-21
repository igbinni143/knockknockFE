import React, { createContext, useState, useContext } from "react";

// Context 객체 생성
export const UserContext = createContext();

// Context Provider 컴포넌트 생성
export const UserProvider = ({ children }) => {
	// 사용자 정보 상태
	const [userData, setUserData] = useState({
		userId: null,
		name: "",
		birthDate: "",
		hasDisease: "",
		hasHealthCheck: false,
		managerName: "",
		managerPhone: "",
		profileImage: "",
		isLoggedIn: false,
	});

	// 로그인 함수 - 사용자 데이터 업데이트
	const login = (elderlyData, userId) => {
		setUserData({
			userId: userId,
			name: elderlyData.name || "",
			birthDate: elderlyData.birthDate || "",
			hasDisease: elderlyData.hasDisease || "",
			hasHealthCheck: elderlyData.hasHealthCheck || false,
			managerName: elderlyData.managerName || "",
			managerPhone: elderlyData.managerPhone || "",
			profileImage: elderlyData.profileImage || "",
			isLoggedIn: true,
		});
	};

	// 로그아웃 함수
	const logout = () => {
		setUserData({
			userId: null,
			name: "",
			birthDate: "",
			hasDisease: "",
			hasHealthCheck: false,
			managerName: "",
			managerPhone: "",
			profileImage: "",
			isLoggedIn: false,
		});
	};

	// Context 값으로 상태와 업데이트 함수 제공
	return (
		<UserContext.Provider value={{ userData, login, logout }}>
			{children}
		</UserContext.Provider>
	);
};

// 커스텀 훅으로 Context 사용을 간편하게 만들기
export const useUser = () => {
	const context = useContext(UserContext);
	if (!context) {
		throw new Error("useUser must be used within a UserProvider");
	}
	return context;
};
