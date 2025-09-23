import React, { useState } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import AudioCircleSpectrum from './AudioCircleSpectrum';
import './index.css'; // 위 CSS 파일 import (경로에 맞게)

export default function Dictaphone() {
    const [finalText, setFinalText] = useState('');
    const { transcript, listening, resetTranscript, browserSupportsSpeechRecognition } = useSpeechRecognition();

    if (!browserSupportsSpeechRecognition) {
        return <span>브라우저가 음성 인식을 지원하지 않습니다.</span>;
    }

    const startListening = async () => {
        resetTranscript();
        setFinalText('');
        try {
            await SpeechRecognition.startListening({ continuous: true, interimResults: true, language: 'ko-KR' });
        } catch (e) {
            console.error(e);
        }
    };

    const stopListening = () => {
        SpeechRecognition.stopListening();
        setFinalText(transcript);
    };

    return (
        <main className="fullscreen">
            {/* 화면 중앙 큰 원형 스펙트럼 (높이는 수치 픽셀로, 폭은 CSS로 거의 풀폭) */}
            <div className="spectrum-wrap">
                <AudioCircleSpectrum active={listening} height={560} />
            </div>

            <div className="panel" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ color: '#9ca3af' }}>
                    마이크:{' '}
                    <strong style={{ color: listening ? '#34d399' : '#f87171' }}>{listening ? '켜짐' : '꺼짐'}</strong>
                </span>
                <button onClick={startListening}>시작</button>
                <button onClick={stopListening}>정지</button>
                <button
                    onClick={() => {
                        resetTranscript();
                        setFinalText('');
                    }}
                >
                    초기화
                </button>
            </div>

            <div className="transcript">
                {listening ? transcript : finalText || '여기에 인식된 텍스트가 표시됩니다.'}
            </div>
        </main>
    );
}
