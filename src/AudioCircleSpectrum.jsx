// src/AudioCircleSpectrum.jsx
import React, { useEffect, useRef } from 'react';

export default function AudioCircleSpectrum({ active = false, height = 420 }) {
    const wrapperRef = useRef(null);
    const canvasRef = useRef(null);
    const rafRef = useRef(null);

    const audioCtxRef = useRef(null);
    const analyserRef = useRef(null);
    const sourceRef = useRef(null);
    const streamRef = useRef(null);

    const freqRef = useRef(null);
    const timeRef = useRef(null);

    // 에너지 리플(퍼져나가는 원) 큐
    const ripplesRef = useRef([]);

    // 캔버스 리사이즈(레티나 보정)
    const resize = () => {
        const wrap = wrapperRef.current;
        const canvas = canvasRef.current;
        if (!wrap || !canvas) return;
        const dpr = window.devicePixelRatio || 1;
        const { width } = wrap.getBoundingClientRect();
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
        const ctx = canvas.getContext('2d');
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    useEffect(() => {
        resize();
        window.addEventListener('resize', resize);
        return () => window.removeEventListener('resize', resize);
    }, [height]);

    useEffect(() => {
        if (!active) {
            stop();
            return;
        }
        start();
        return () => stop();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [active]);

    const start = async () => {
        if (audioCtxRef.current) return;

        streamRef.current = await navigator.mediaDevices.getUserMedia({
            audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
            video: false,
        });

        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        const audioCtx = new AudioCtx();
        audioCtxRef.current = audioCtx;

        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 2048;
        analyser.smoothingTimeConstant = 0.85;
        analyserRef.current = analyser;

        sourceRef.current = audioCtx.createMediaStreamSource(streamRef.current);
        sourceRef.current.connect(analyserRef.current);

        freqRef.current = new Uint8Array(analyser.frequencyBinCount);
        timeRef.current = new Uint8Array(analyser.fftSize);

        draw();
    };

    const stop = () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = null;

        try {
            sourceRef.current && sourceRef.current.disconnect();
        } catch {}
        sourceRef.current = null;
        analyserRef.current = null;

        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
        }
        if (audioCtxRef.current) {
            try {
                audioCtxRef.current.close();
            } catch {}
            audioCtxRef.current = null;
        }
        ripplesRef.current = [];
    };

    const draw = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const analyser = analyserRef.current;
        const freq = freqRef.current;
        const time = timeRef.current;
        if (!canvas || !ctx || !analyser || !freq || !time) return;

        const w = canvas.width / (window.devicePixelRatio || 1);
        const h = canvas.height / (window.devicePixelRatio || 1);
        const cx = w / 2;
        const cy = h / 2;

        const baseRadius = Math.min(w, h) * 0.22; // 중심 원 반지름
        const bars = 120; // 둘레 막대 수
        const maxBarLen = Math.min(w, h) * 0.22; // 막대 최대 길이

        const loop = () => {
            analyser.getByteFrequencyData(freq);
            analyser.getByteTimeDomainData(time);

            // 타임도메인 RMS (음성 에너지)
            let sum = 0;
            for (let i = 0; i < time.length; i++) {
                const v = time[i] - 128;
                sum += v * v;
            }
            const rms = Math.sqrt(sum / time.length) / 128; // 0~1
            const energyBoost = 0.7 + Math.min(0.9, rms * 2.2);

            // 음성을 감지하면 리플 추가 (임계값 약간 높임)
            if (rms > 0.08) {
                ripplesRef.current.push({
                    r: baseRadius * 0.9,
                    life: 1.0,
                    speed: 3.0 + rms * 10.0,
                    width: 2.5 + rms * 6.0,
                });
                // 과도한 리플 방지
                if (ripplesRef.current.length > 12) ripplesRef.current.shift();
            }

            ctx.clearRect(0, 0, w, h);

            // 배경 그라디언트(은은)
            const bgGrad = ctx.createRadialGradient(cx, cy, baseRadius * 0.2, cx, cy, Math.max(cx, cy));
            bgGrad.addColorStop(0, '#0b0b0f');
            bgGrad.addColorStop(1, '#0b0b0f');
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, w, h);

            // 중심 글로우
            const glowGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, baseRadius * 1.4);
            glowGrad.addColorStop(0, 'rgba(167,139,250,0.35)'); // violet-400
            glowGrad.addColorStop(1, 'rgba(167,139,250,0)');
            ctx.fillStyle = glowGrad;
            ctx.beginPath();
            ctx.arc(cx, cy, baseRadius * (1.05 + rms * 0.15), 0, Math.PI * 2);
            ctx.fill();

            // 퍼져나가는 리플
            ripplesRef.current.forEach((r) => {
                ctx.beginPath();
                ctx.arc(cx, cy, r.r, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(125,211,252,${0.35 * r.life})`; // sky-300
                ctx.lineWidth = r.width * r.life;
                ctx.stroke();
                r.r += r.speed; // 반경 증가
                r.life *= 0.94; // 서서히 사라짐
            });
            ripplesRef.current = ripplesRef.current.filter((r) => r.life > 0.06);

            // 원형 바(스펙트럼)
            const barGrad = ctx.createLinearGradient(0, cy - baseRadius, 0, cy + baseRadius);
            barGrad.addColorStop(0, '#7dd3fc'); // 하늘
            barGrad.addColorStop(0.5, '#a78bfa'); // 보라
            barGrad.addColorStop(1, '#f472b6'); // 핑크
            ctx.strokeStyle = barGrad;
            ctx.lineCap = 'round';

            for (let i = 0; i < bars; i++) {
                // 저/중역 강조 매핑
                const idx = Math.floor((i / bars) ** 0.85 * freq.length * 0.9);
                const v = freq[idx] / 255; // 0~1
                const len = Math.max(4, v * maxBarLen * energyBoost);

                const angle = (i / bars) * Math.PI * 2 - Math.PI / 2; // 위(12시)부터 시계방향
                const x1 = cx + Math.cos(angle) * baseRadius;
                const y1 = cy + Math.sin(angle) * baseRadius;
                const x2 = cx + Math.cos(angle) * (baseRadius + len);
                const y2 = cy + Math.sin(angle) * (baseRadius + len);

                ctx.lineWidth = Math.max(2, len * 0.06);
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
            }

            rafRef.current = requestAnimationFrame(loop);
        };

        loop();
    };

    return (
        <div
            ref={wrapperRef}
            style={{
                width: '100%',
                height,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#0b0b0f',
                borderRadius: 16,
            }}
        >
            <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
            {/* 중앙에 얇은 테두리 */}
            <div
                style={{
                    position: 'absolute',
                    width: height * 0.44,
                    height: height * 0.44,
                    borderRadius: '50%',
                    border: '1px solid rgba(229,231,235,0.08)',
                }}
            />
        </div>
    );
}
