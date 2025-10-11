import React, { useState, useEffect } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import AudioCircleSpectrum from './AudioCircleSpectrum';
import './index.css';

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
            await SpeechRecognition.startListening({
                continuous: true,
                interimResults: true,
                language: 'ko-KR',
            });
        } catch (e) {
            console.error(e);
        }
    };

    const stopListening = () => {
        SpeechRecognition.stopListening();
        setFinalText(transcript);
    };

    // 🔽 추가할 부분
    useEffect(() => {
        console.log('browserSupportsSpeechRecognition:', browserSupportsSpeechRecognition);

        if (navigator.permissions?.query) {
            // 일부 브라우저에서만 동작
            navigator.permissions
                // @ts-ignore
                .query({ name: 'microphone' })
                .then((res) => {
                    console.log('[Permissions API] mic state =', res.state);
                })
                .catch(() => {});
        }

        const recog = SpeechRecognition.getRecognition();
        if (!recog) return;

        recog.onerror = (e) => {
            console.error('[SpeechRecognition.onerror]', e);
            alert(`음성인식 오류: ${e.error || 'unknown'}`);
            if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
                alert('마이크 권한을 허용했는지, HTTPS로 접속했는지 확인하세요.');
            }
        };

        recog.onend = () => {
            console.log('[SpeechRecognition.onend]');
            if (listening) {
                try {
                    SpeechRecognition.startListening({
                        continuous: true,
                        interimResults: true,
                        language: 'ko-KR',
                    });
                } catch {}
            }
        };

        return () => {
            if (!recog) return;
            recog.onerror = null;
            recog.onend = null;
        };
    }, [listening, browserSupportsSpeechRecognition]);
    // 🔼 여기까지 추가

    return (
        <main className="fullscreen">
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
