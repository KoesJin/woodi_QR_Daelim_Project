import React, { useState, useRef, useCallback } from "react";
import AudioCircleSpectrum from "./AudioCircleSpectrum";
import "./index.css";
import { ELEVEN_API_KEY, ASK_URL } from "./env";

export default function Dictaphone({ displayId }) {
  const [listening, setListening] = useState(false);
  const [finalText, setFinalText] = useState("");
  const [messages, setMessages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioStream, setAudioStream] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const checkMicrophonePermission = async () => {
    try {
      // Permissions API 지원 여부 확인 (Safari iOS는 지원 안 함)
      if (navigator.permissions && navigator.permissions.query) {
        const result = await navigator.permissions.query({
          name: "microphone",
        });
        return result.state;
      }
    } catch (error) {
    }

    return "prompt";
  };

  const startListening = async () => {
    setFinalText("");

    if (mediaRecorderRef.current) {
      try {
        if (mediaRecorderRef.current.state === "recording") {
          mediaRecorderRef.current.stop();
        }
      } catch (error) {
        console.error("이전 녹음 정리 실패:", error);
      }
      mediaRecorderRef.current = null;
    }

    try {
      const permissionState = await checkMicrophonePermission();

      if (permissionState === "denied") {
        alert(
          "마이크 권한이 거부되었습니다.\n브라우저 설정에서 마이크 권한을 허용해주세요."
        );
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      setAudioStream(stream);

      let mimeType = "audio/webm";
      if (!MediaRecorder.isTypeSupported("audio/webm")) {
        mimeType = MediaRecorder.isTypeSupported("audio/mp4")
          ? "audio/mp4"
          : "";
      }

      const mediaRecorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined
      );

      audioChunksRef.current = [];
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        try {
          setIsProcessing(true);

          const audioBlob = new Blob(audioChunksRef.current, {
            type: "audio/webm",
          });

          const transcript = await transcribeAudio(audioBlob);

          if (!transcript) {
            setMessages((prev) => [
              ...prev,
              { type: "error", text: "음성 인식에 실패했습니다." },
            ]);
            return;
          }

          setFinalText(transcript);

          setMessages((prev) => [...prev, { type: "user", text: transcript }]);

          const response = await sendToAPI(transcript);

          if (response) {
            setMessages((prev) => [...prev, { type: "bot", text: response }]);
          } else {
            setMessages((prev) => [
              ...prev,
              { type: "error", text: "답변을 받지 못했습니다." },
            ]);
          }
        } catch (error) {
          setMessages((prev) => [
            ...prev,
            { type: "error", text: "처리 중 오류가 발생했습니다." },
          ]);
        } finally {
          setIsProcessing(false);
          mediaRecorderRef.current = null;

          stream.getTracks().forEach((track) => track.stop());
          setAudioStream(null);
        }
      };

      mediaRecorder.start();
      setListening(true);
    } catch (error) {
      let errorMessage = "마이크 접근에 실패했습니다.";

      if (error.name === "NotAllowedError") {
        errorMessage =
          "마이크 권한이 거부되었습니다.\n브라우저 설정에서 마이크 권한을 허용해주세요.";
      } else if (error.name === "NotFoundError") {
        errorMessage =
          "마이크가 연결되어 있지 않습니다.\n마이크를 연결해주세요.";
      } else if (error.name === "NotReadableError") {
        errorMessage =
          "마이크가 다른 앱에서 사용 중입니다.\n다른 앱을 종료 후 다시 시도해주세요.";
      } else if (error.name === "OverconstrainedError") {
        errorMessage =
          "요청한 마이크 설정을 지원하지 않습니다.\n다른 마이크를 사용해주세요.";
      } else if (error.name === "SecurityError") {
        errorMessage = "보안 오류가 발생했습니다.\nHTTPS 연결을 사용해주세요.";
      }

      alert(errorMessage);
      setListening(false);
      setAudioStream(null);
    }
  };

  const stopListening = useCallback(() => {
    setListening(false);

    if (mediaRecorderRef.current) {
      try {
        if (mediaRecorderRef.current.state === "recording") {
          mediaRecorderRef.current.stop();
        }
      } catch (error) {
        console.error("❌ 녹음 중지 실패:", error);
      }
    }
  }, []);

  const transcribeAudio = async (blob) => {
    try {
      const formData = new FormData();
      formData.append("model_id", "scribe_v1");
      formData.append("file", blob, "recording.webm");
      formData.append("language_code", "kor");

      const response = await fetch(
        "https://api.elevenlabs.io/v1/speech-to-text",
        {
          method: "POST",
          headers: {
            "xi-api-key": ELEVEN_API_KEY,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        console.error("❌ STT API 오류:", response.status, response.statusText);
        return null;
      }

      const data = await response.json();
      return data.text || null;
    } catch (error) {
      console.error("❌ STT 변환 에러:", error);
      return null;
    }
  };

  const sendToAPI = async (text) => {
    try {
      const encoded = encodeURIComponent(text);
      const response = await fetch(
        `${ASK_URL}?question=${encoded}&displayId=${displayId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        console.error("❌ API 오류:", response.status, response.statusText);
        return null;
      }

      const data = await response.json();

      if (data.status === "error") {
        console.error("❌ 서버 에러:", data.error);
        return null;
      }

      return data.answer || null;
    } catch (error) {
      console.error("❌ API 요청 에러:", error);
      return null;
    }
  };

  const handleButtonClick = () => {
    if (isProcessing) {
      return; // 처리 중에는 클릭 무시
    }

    if (listening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
  };

  return (
    <main className="fullscreen">
      {/* 로딩 스피너 오버레이 */}
      {isProcessing && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(11, 11, 15, 0.85)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            backdropFilter: "blur(8px)",
          }}
        >
          {/* 로딩 스피너 */}
          <div
            style={{
              width: 60,
              height: 60,
              border: "3px solid rgba(167, 139, 250, 0.2)",
              borderTop: "3px solid #a78bfa",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
            }}
          />
          <div
            style={{
              marginTop: 24,
              color: "#ffffff",
              fontSize: 18,
              fontWeight: "500",
              letterSpacing: "0.5px",
            }}
          >
            답변을 준비하고 있어요
          </div>
        </div>
      )}

      {/* 스펙트럼 영역 */}
      <div
        className="spectrum-wrap"
        onClick={handleButtonClick}
        onContextMenu={handleContextMenu}
        style={{
          cursor: isProcessing ? "not-allowed" : "pointer",
          userSelect: "none",
          WebkitUserSelect: "none",
          WebkitTouchCallout: "none",
          WebkitTapHighlightColor: "transparent",
          transition: "opacity 0.3s",
        }}
      >
        <AudioCircleSpectrum
          active={listening}
          height={560}
          stream={audioStream}
        />
      </div>

      {/* 안내 및 메시지 영역 */}
      <div
        style={{
          padding: "24px 16px",
          textAlign: "center",
        }}
      >
        {/* 상태 안내 멘트 */}
        <div
          style={{
            color: listening ? "#a78bfa" : "#ffffff",
            fontSize: 18,
            fontWeight: "500",
            letterSpacing: "0.5px",
            marginBottom: 8,
            transition: "color 0.3s",
          }}
        >
          {listening ? "질문을 말씀해주세요..." : "화면을 터치하여 질문하세요"}
        </div>

        {/* 인식된 텍스트 표시 */}
        {finalText && !listening && !isProcessing && (
          <div
            style={{
              marginTop: 16,
              padding: "12px 20px",
              backgroundColor: "rgba(167, 139, 250, 0.1)",
              borderRadius: 12,
              border: "1px solid rgba(167, 139, 250, 0.2)",
              color: "#e0e7ff",
              fontSize: 14,
              maxWidth: 600,
              margin: "16px auto 0",
            }}
          >
            "{finalText}"
          </div>
        )}

        {/* 메시지 히스토리 */}
        {messages.length > 0 && (
          <div
            style={{
              marginTop: 32,
              maxWidth: 700,
              margin: "32px auto 0",
              padding: "0 8px",
            }}
          >
            {messages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  marginBottom: 16,
                  padding: "16px 20px",
                  borderRadius: 12,
                  textAlign: "left",
                  backgroundColor:
                    msg.type === "user"
                      ? "rgba(30, 41, 59, 0.6)"
                      : msg.type === "bot"
                      ? "rgba(21, 58, 45, 0.6)"
                      : "rgba(45, 27, 30, 0.6)",
                  border: `1px solid ${
                    msg.type === "user"
                      ? "rgba(100, 116, 139, 0.3)"
                      : msg.type === "bot"
                      ? "rgba(52, 211, 153, 0.3)"
                      : "rgba(248, 113, 113, 0.3)"
                  }`,
                  backdropFilter: "blur(10px)",
                  transition: "transform 0.2s, box-shadow 0.2s",
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: "600",
                    color:
                      msg.type === "user"
                        ? "#a78bfa"
                        : msg.type === "bot"
                        ? "#34d399"
                        : "#f87171",
                    marginBottom: 8,
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                  }}
                >
                  {msg.type === "user"
                    ? "질문"
                    : msg.type === "bot"
                    ? "답변"
                    : "오류"}
                </div>
                <div
                  style={{
                    color: "#e5e7eb",
                    fontSize: 15,
                    lineHeight: "1.6",
                    wordBreak: "keep-all",
                  }}
                >
                  {msg.text}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CSS 애니메이션 */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </main>
  );
}
