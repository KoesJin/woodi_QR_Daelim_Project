import React, { useState, useRef } from 'react';
import AudioCircleSpectrum from './AudioCircleSpectrum';
import './index.css';

// .env에 정의한 API 키를 가져옵니다.
// Create React App에서는 반드시 REACT_APP_ 접두어가 필요합니다.
const ELEVEN_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY;
const SERVER_API = import.meta.env.VITE_SERVER_API;

export default function Dictaphone() {
    // 음성 녹음 상태를 관리하기 위한 상태값입니다.
    const [listening, setListening] = useState(false);
    // 마지막으로 인식된 최종 텍스트를 저장합니다.
    const [finalText, setFinalText] = useState('');
    // 채팅 메시지(사용자/AI) 목록을 저장합니다.
    const [messages, setMessages] = useState([]);

    // MediaRecorder 인스턴스를 보관하기 위한 ref입니다. useRef를 사용하여 리렌더링 시 유지합니다.
    const mediaRecorderRef = useRef(null);
    // 녹음된 음성 데이터를 일시적으로 저장하는 배열입니다.
    const audioChunksRef = useRef([]);

    /**
     * 녹음을 시작하는 함수입니다.
     * - getUserMedia로 마이크 스트림을 요청하고,
     * - MediaRecorder를 생성하여 데이터 수집을 시작합니다.
     */
    const startListening = async () => {
        setFinalText(''); // 이전 텍스트를 초기화
        try {
            // 브라우저에서 마이크 접근 권한을 요청합니다.
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            // MediaRecorder 초기화: 브라우저가 지원하는 포맷 중 하나를 지정합니다.
            const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });

            // 녹음 데이터 배열 초기화
            audioChunksRef.current = [];
            mediaRecorderRef.current = mediaRecorder;

            // 데이터가 준비될 때마다 호출되는 이벤트 핸들러
            mediaRecorder.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            /**
             * 녹음이 종료되면 호출되는 이벤트 핸들러
             * 1. 수집한 오디오 청크를 Blob 객체로 결합합니다.
             * 2. ElevenLabs STT API에 음성을 업로드하여 텍스트를 얻습니다.
             * 3. 채팅 메시지 목록과 UI를 업데이트합니다.
             */
            mediaRecorder.onstop = async () => {
                // 녹음한 데이터들을 하나의 Blob으로 만듭니다.
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                // ElevenLabs API 호출: 음성을 텍스트로 변환
                const transcript = await transcribeAudio(audioBlob);
                if (transcript) {
                    // 텍스트를 화면에 표시
                    setFinalText(transcript);
                    // 채팅 목록에 사용자 메시지로 추가
                    setMessages((prev) => [...prev, { type: 'user', text: transcript }]);

                    // 기존 서버(API_URL)로 질문을 전송하여 AI 응답을 받아옵니다.
                    const response = await sendToAPI(transcript);
                    if (response) {
                        setMessages((prev) => [...prev, { type: 'bot', text: response }]);
                    }
                }
            };

            // 녹음 시작
            mediaRecorder.start();
            setListening(true);
        } catch (err) {
            console.error('마이크 접근 실패:', err);
        }
    };

    /**
     * 녹음을 멈추는 함수입니다.
     * MediaRecorder.stop()을 호출하면 onstop 이벤트 핸들러가 실행되어
     * 녹음 데이터 전송과 후처리가 진행됩니다.
     */
    const stopListening = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
        }
        setListening(false);
    };

    /**
     * ElevenLabs STT API에 오디오 파일을 전송하여 텍스트를 반환받습니다.
     * @param {Blob} blob 음성 녹음 데이터
     * @returns {Promise<string|null>} 변환된 텍스트 또는 실패 시 null
     */
    const transcribeAudio = async (blob) => {
        try {
            const formData = new FormData();
            // ElevenLabs API에서 요구하는 필드:
            // model_id는 반드시 'scribe_v1' 또는 'scribe_v1_experimental'이어야 합니다:contentReference[oaicite:0]{index=0}.
            formData.append('model_id', 'scribe_v1');
            // 업로드할 음성 파일을 추가합니다. filename을 주지 않으면 브라우저가 임의로 이름을 붙입니다.
            formData.append('file', blob, 'recording.webm');
            // 한국어 코드(kor)를 명시하면 인식 정확도를 높일 수 있습니다:contentReference[oaicite:1]{index=1}.
            formData.append('language_code', 'kor');

            // ElevenLabs STT 엔드포인트로 직접 요청합니다.
            const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
                method: 'POST',
                headers: {
                    // 필수 헤더: xi-api-key:contentReference[oaicite:2]{index=2}.
                    // .env에서 불러온 API 키를 사용합니다.
                    'xi-api-key': ELEVEN_API_KEY,
                },
                // FormData는 자동으로 올바른 Content-Type이 설정됩니다.
                body: formData,
            });

            // API에서 반환하는 JSON을 파싱합니다.
            const data = await response.json();
            // data.text 속성에 전사된 텍스트가 들어 있습니다.
            return data.text;
        } catch (error) {
            console.error('전사 실패:', error);
            return null;
        }
    };

    /**
     * 기존 채팅 API로 질문을 전송합니다.
     * @param {string} text 사용자 질문
     */
    const sendToAPI = async (text) => {
        try {
            // GET 요청 시 질문 텍스트를 URL 인코딩해야 합니다.
            const encoded = encodeURIComponent(text);
            const response = await fetch(`${SERVER_API}/ask?question=${encoded}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            const data = await response.json();
            return data.text;
        } catch (error) {
            console.error('API 전송 실패:', error);
            return null;
        }
    };

    // UI에서 눌렀을 때 녹음 시작
    const handlePress = (e) => {
        e.preventDefault();
        startListening();
    };

    // UI에서 떼었을 때 녹음 종료
    const handleRelease = (e) => {
        e.preventDefault();
        stopListening();
    };

    // 우클릭 메뉴 막기
    const handleContextMenu = (e) => {
        e.preventDefault();
    };

    return (
        <main className="fullscreen">
            {/* 스펙트럼 영역: 버튼과 동일한 동작 */}
            <div
                className="spectrum-wrap"
                onMouseDown={handlePress}
                onMouseUp={handleRelease}
                onTouchStart={handlePress}
                onTouchEnd={handleRelease}
                onContextMenu={handleContextMenu}
                style={{
                    cursor: 'pointer',
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                    WebkitTouchCallout: 'none',
                    WebkitTapHighlightColor: 'transparent',
                }}
            >
                <AudioCircleSpectrum active={true} height={560} />
            </div>

            {/* 녹음 버튼: 누르는 동안 녹음하고 떼면 전송합니다. */}
            <div style={{ padding: '20px', textAlign: 'center' }}>
                <button
                    onMouseDown={handlePress}
                    onMouseUp={handleRelease}
                    onTouchStart={handlePress}
                    onTouchEnd={handleRelease}
                    onContextMenu={handleContextMenu}
                    style={{
                        padding: '15px 30px',
                        fontSize: '16px',
                        backgroundColor: listening ? '#34d399' : '#6b7280',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        userSelect: 'none',
                        WebkitUserSelect: 'none',
                        WebkitTouchCallout: 'none',
                        WebkitTapHighlightColor: 'transparent',
                    }}
                >
                    {listening ? '음성 인식 중...' : '누르고 말하기'}
                </button>
            </div>

            {/* 현재 인식 중인지 여부와 결과를 표시합니다. */}
            <div className="transcript">
                {listening ? '녹음 중...' : finalText || '스펙트럼이나 버튼을 누르고 있으면 음성 인식이 시작됩니다.'}
            </div>

            {/* 대화 기록을 표시합니다. */}
            <div style={{ padding: '20px', maxHeight: '200px', overflowY: 'auto' }}>
                {messages.map((msg, idx) => (
                    <div
                        key={idx}
                        style={{
                            margin: '10px 0',
                            textAlign: msg.type === 'user' ? 'right' : 'left',
                            color: msg.type === 'user' ? '#3b82f6' : '#10b981',
                        }}
                    >
                        <strong>{msg.type === 'user' ? '나' : 'AI'}:</strong> {msg.text}
                    </div>
                ))}
            </div>
        </main>
    );
}
