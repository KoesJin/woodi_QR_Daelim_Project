import React, { useState } from "react";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import AudioCircleSpectrum from "./AudioCircleSpectrum";
import { API_URL } from "./env.ts";
import "./index.css";

export default function Dictaphone() {
  const [finalText, setFinalText] = useState("");
  const [messages, setMessages] = useState([]);
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  if (!browserSupportsSpeechRecognition) {
    return <span>브라우저가 음성 인식을 지원하지 않습니다.</span>;
  }

  const startListening = async () => {
    resetTranscript();
    setFinalText("");
    try {
      await SpeechRecognition.startListening({
        continuous: true,
        interimResults: true,
        language: "ko-KR",
      });
    } catch (e) {
      console.error(e);
    }
  };

  const stopListening = async () => {
    SpeechRecognition.stopListening();
    const text = transcript;
    setFinalText(text);

    if (text.trim()) {
      setMessages((prev) => [...prev, { type: "user", text }]);
      const response = await sendToAPI(text);
      if (response) {
        setMessages((prev) => [...prev, { type: "bot", text: response }]);
      }
    }
  };

  // question parameter is encoded
  const sendToAPI = async (text) => {
    try {
      const response = await fetch(`${API_URL}/ask?question=${text}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      return data.text;
    } catch (error) {
      console.error("API 전송 실패:", error);
      return null;
    }
  };

  const handlePress = (e) => {
    e.preventDefault();
    startListening();
  };

  const handleRelease = (e) => {
    e.preventDefault();
    stopListening();
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
  };

  return (
    <main className="fullscreen">
      <div
        className="spectrum-wrap"
        onMouseDown={handlePress}
        onMouseUp={handleRelease}
        onTouchStart={handlePress}
        onTouchEnd={handleRelease}
        onContextMenu={handleContextMenu}
        style={{
          cursor: "pointer",
          userSelect: "none",
          WebkitUserSelect: "none",
          WebkitTouchCallout: "none",
          WebkitTapHighlightColor: "transparent",
        }}
      >
        <AudioCircleSpectrum active={true} height={560} />
      </div>

      <div style={{ padding: "20px", textAlign: "center" }}>
        <button
          onMouseDown={handlePress}
          onMouseUp={handleRelease}
          onTouchStart={handlePress}
          onTouchEnd={handleRelease}
          onContextMenu={handleContextMenu}
          style={{
            padding: "15px 30px",
            fontSize: "16px",
            backgroundColor: listening ? "#34d399" : "#6b7280",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            userSelect: "none",
            WebkitUserSelect: "none",
            WebkitTouchCallout: "none",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          {listening ? "음성 인식 중..." : "누르고 말하기"}
        </button>
      </div>

      <div className="transcript">
        {listening
          ? transcript
          : finalText ||
            "스펙트럼이나 버튼을 누르고 있으면 음성 인식이 시작됩니다."}
      </div>

      <div style={{ padding: "20px", maxHeight: "200px", overflowY: "auto" }}>
        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              margin: "10px 0",
              textAlign: msg.type === "user" ? "right" : "left",
              color: msg.type === "user" ? "#3b82f6" : "#10b981",
            }}
          >
            <strong>{msg.type === "user" ? "나" : "AI"}:</strong> {msg.text}
          </div>
        ))}
      </div>
    </main>
  );
}
