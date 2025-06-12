// services/VoiceUploadService.js
import * as FileSystem from "expo-file-system";

export class VoiceUploadService {
	static BASE_URL = "http://18.205.227.28:8080";
	static TIMEOUT = 30000;

	/**
	 * 음성 파일을 서버에 업로드
	 */
	static async uploadRecording(
		recordingUri,
		elderlyId,
		sessionId = null,
		metadata = {}
	) {
		try {
			console.log("🚀 [UPLOAD START] 업로드 시작");
			console.log("📋 [PARAMS]", {
				recordingUri,
				elderlyId,
				sessionId,
				metadata,
			});

			// 파일 존재 확인
			const fileInfo = await FileSystem.getInfoAsync(recordingUri);
			if (!fileInfo.exists) {
				throw new Error("녹음 파일이 존재하지 않습니다");
			}

			console.log("📁 [FILE INFO]", fileInfo);

			// 파일 확장자 확인 및 적절한 MIME 타입 설정
			const fileExtension = recordingUri.split(".").pop()?.toLowerCase();
			const mimeType = fileExtension === "m4a" ? "audio/m4a" : "audio/wav";
			const fileName = metadata.name
				? `${metadata.name}.${fileExtension}`
				: `recording_${Date.now()}.${fileExtension}`;

			console.log("🎵 [FILE TYPE]", { fileExtension, mimeType, fileName });

			// FormData 생성 - Python 서버 형식에 맞춤
			const formData = new FormData();

			// 파일 추가 - 실제 파일 확장자와 MIME 타입 사용
			formData.append("file", {
				uri: recordingUri,
				type: mimeType,
				name: fileName,
			});

			// elderlyId는 필수 필드로 보임
			if (elderlyId !== null && elderlyId !== undefined) {
				formData.append("elderlyId", String(elderlyId));
			} else {
				throw new Error("elderlyId가 필요합니다");
			}

			// 선택적 필드들
			if (sessionId) {
				formData.append("sessionId", String(sessionId));
			}

			// 추가 메타데이터 (서버에서 필요한 경우)
			if (metadata.duration) {
				formData.append("duration", String(metadata.duration));
			}
			if (fileInfo.size) {
				formData.append("fileSize", String(fileInfo.size));
			}

			// FormData 내용 로깅
			this.logFormDataContents("FormData", {
				file: fileName,
				elderlyId,
				sessionId,
				duration: metadata.duration,
				fileSize: fileInfo.size,
				mimeType,
			});

			// 업로드 시도
			const result = await this.attemptUpload(formData);
			if (result.success) {
				console.log("✅ [SUCCESS] 업로드 성공");
				return result;
			} else {
				throw new Error(result.error || "업로드 실패");
			}
		} catch (error) {
			console.error("💥 [UPLOAD ERROR]", error.message);
			return {
				success: false,
				error: error.message,
				message: "음성 파일 업로드에 실패했습니다",
			};
		}
	}

	/**
	 * FormData 내용 로깅
	 */
	static logFormDataContents(version, contents) {
		console.log(`📋 [${version}] FormData 내용:`);
		Object.entries(contents).forEach(([key, value]) => {
			console.log(`  - ${key}: ${value} (${typeof value})`);
		});
	}

	/**
	 * 업로드 시도
	 */
	static async attemptUpload(formData) {
		const uploadUrl = `${this.BASE_URL}/recordings/upload`;
		console.log("🚀 [UPLOAD] 업로드 요청 전송:", uploadUrl);

		try {
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT);

			console.log("📡 [REQUEST] 요청 시작...");

			const response = await fetch(uploadUrl, {
				method: "POST",
				// multipart/form-data에서는 Content-Type 헤더를 설정하지 않아야 함
				// 브라우저가 자동으로 boundary를 포함해서 설정함
				headers: {
					Accept: "application/json",
				},
				body: formData,
				signal: controller.signal,
			});

			clearTimeout(timeoutId);

			console.log("📡 [RESPONSE] 상태 코드:", response.status);
			console.log("📡 [RESPONSE] 상태 텍스트:", response.statusText);
			console.log(
				"📡 [RESPONSE] 헤더:",
				Object.fromEntries(response.headers.entries())
			);

			const responseText = await response.text();
			console.log("📜 [RESPONSE] 응답 본문:", responseText);

			if (response.ok) {
				let result;
				try {
					result = JSON.parse(responseText);
					console.log("✅ [JSON] 파싱 성공:", result);
				} catch (parseError) {
					console.log("⚠️ [PARSE] JSON 파싱 실패, 텍스트로 처리");
					result = {
						success: true,
						message: responseText,
						file_id: `upload_${Date.now()}`,
					};
				}

				return {
					success: true,
					recordingId: result.file_id || result.id || `upload_${Date.now()}`,
					serverUrl: result.url,
					serverResponse: result,
					message: "업로드 성공",
				};
			} else {
				console.warn("⚠️ [UPLOAD] 실패:", response.status);
				console.error("📋 [ERROR DETAILS]", {
					status: response.status,
					statusText: response.statusText,
					body: responseText,
					url: uploadUrl,
				});

				// 400 에러의 경우 더 자세한 정보 출력
				if (response.status === 400) {
					console.error(
						"🔍 [400 ERROR] Bad Request - 서버에서 요청을 이해할 수 없음"
					);
					console.error("   - 필수 필드가 누락되었을 수 있음");
					console.error("   - 파일 형식이 지원되지 않을 수 있음");
					console.error("   - 요청 형식이 잘못되었을 수 있음");
				}

				return {
					success: false,
					error: `HTTP ${response.status}: ${responseText}`,
					statusCode: response.status,
					statusText: response.statusText,
					details: responseText,
				};
			}
		} catch (fetchError) {
			console.error("💥 [NETWORK] 네트워크 오류:", fetchError.message);
			console.error("💥 [NETWORK] 전체 오류:", fetchError);

			// 타임아웃 오류 처리
			if (fetchError.name === "AbortError") {
				return {
					success: false,
					error: "업로드 타임아웃이 발생했습니다",
					isTimeout: true,
				};
			}

			return {
				success: false,
				error: fetchError.message,
				isNetworkError: true,
			};
		}
	}

	/**
	 * 서버 연결 테스트
	 */
	static async testConnection() {
		try {
			const response = await fetch(`${this.BASE_URL}/health`, {
				method: "GET",
				timeout: 5000,
			});

			return {
				success: response.ok,
				status: response.status,
				message: response.ok ? "서버 연결 성공" : "서버 연결 실패",
			};
		} catch (error) {
			return {
				success: false,
				error: error.message,
				message: "서버에 연결할 수 없습니다",
			};
		}
	}

	/**
	 * 간단한 테스트 업로드 (서버 API 테스트용)
	 */
	static async testUpload(elderlyId) {
		try {
			console.log("🧪 [TEST] 테스트 업로드 시작");

			const formData = new FormData();

			// 간단한 텍스트 파일로 테스트
			formData.append("file", {
				uri: "data:text/plain;base64,SGVsbG8gV29ybGQ=", // "Hello World" in base64
				type: "text/plain",
				name: "test.txt",
			});

			formData.append("elderlyId", String(elderlyId));

			const response = await fetch(`${this.BASE_URL}/recordings/upload`, {
				method: "POST",
				body: formData,
			});

			const responseText = await response.text();

			console.log("🧪 [TEST] 응답:", {
				status: response.status,
				statusText: response.statusText,
				body: responseText,
			});

			return {
				success: response.ok,
				status: response.status,
				response: responseText,
			};
		} catch (error) {
			console.error("🧪 [TEST] 오류:", error);
			return {
				success: false,
				error: error.message,
			};
		}
	}

	/**
	 * 서버 기본 연결 테스트
	 */
	static async pingServer() {
		try {
			console.log("🏓 [PING] 서버 연결 테스트 시작");

			const response = await fetch(`${this.BASE_URL}/`, {
				method: "GET",
				headers: {
					Accept: "application/json",
				},
			});

			const responseText = await response.text();

			console.log("🏓 [PING] 서버 응답:", {
				status: response.status,
				statusText: response.statusText,
				body: responseText,
			});

			return {
				success: response.status < 500, // 500 미만이면 서버는 살아있음
				status: response.status,
				response: responseText,
			};
		} catch (error) {
			console.error("🏓 [PING] 서버 연결 실패:", error);
			return {
				success: false,
				error: error.message,
			};
		}
	}

	/**
	 * 최소한의 필드로 업로드 테스트
	 */
	static async minimalUploadTest(elderlyId) {
		try {
			console.log("🔬 [MINIMAL] 최소 필드 업로드 테스트");

			const formData = new FormData();

			// 가장 기본적인 형태
			formData.append("elderlyId", String(elderlyId));

			const response = await fetch(`${this.BASE_URL}/recordings/upload`, {
				method: "POST",
				body: formData,
			});

			const responseText = await response.text();

			console.log("🔬 [MINIMAL] 응답:", {
				status: response.status,
				statusText: response.statusText,
				headers: Object.fromEntries(response.headers.entries()),
				body: responseText,
			});

			return {
				success: response.ok,
				status: response.status,
				response: responseText,
			};
		} catch (error) {
			console.error("🔬 [MINIMAL] 오류:", error);
			return {
				success: false,
				error: error.message,
			};
		}
	}
}
