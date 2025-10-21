# 🎤 우디 (Woodi)

음성으로 대화하는 AI 어시스턴트 웹 애플리케이션

## ✨ 주요 기능

-   🎙️ **실시간 음성 인식**: ElevenLabs STT API를 활용한 고품질 음성-텍스트 변환
-   🎨 **인터랙티브 스펙트럼**: 실시간 오디오 시각화로 음성 입력 상태 표시
-   🤖 **AI 대화**: 음성 인식 결과를 AI 서버로 전송하여 자연스러운 대화
-   📱 **반응형 디자인**: 모바일과 데스크톱에서 모두 최적화된 사용자 경험
-   🎯 **간편한 조작**: 클릭 한 번으로 녹음 시작/중지

## 🚀 기술 스택

-   **Frontend**: React 19, Vite
-   **음성 처리**: Web Audio API, MediaRecorder API
-   **STT 서비스**: ElevenLabs Speech-to-Text API
-   **스타일링**: CSS3 (그라디언트, 애니메이션)
-   **빌드 도구**: Vite, ESLint

## 🛠️ 설치 및 실행

### 1. 프로젝트 클론

```bash
git clone [repository-url]
cd woodi
```

### 2. 의존성 설치

```bash
npm install
```

### 3. 환경 변수 설정

`.env` 파일을 생성하고 다음 변수들을 설정하세요:

```env
VITE_ELEVENLABS_API_KEY=your_elevenlabs_api_key
VITE_SERVER_API=your_ai_server_api_url
```

### 4. 개발 서버 실행

```bash
npm run dev
```

### 5. 프로덕션 빌드

```bash
npm run build
```

## 📁 프로젝트 구조

```
src/
├── App.jsx                 # 메인 앱 컴포넌트
├── Dictaphone.jsx          # 음성 인식 메인 컴포넌트
├── AudioCircleSpectrum.jsx # 오디오 스펙트럼 시각화
├── hooks/
│   └── usePageLock.js     # 페이지 잠금 훅
└── index.css              # 글로벌 스타일
```

## 🎯 사용법

1. **녹음 시작**: 스펙트럼을 클릭하여 음성 녹음 시작
2. **녹음 중지**: 다시 클릭하여 녹음 중지
3. **결과 확인**: 인식된 텍스트와 AI 응답을 화면에서 확인

## 🔧 주요 컴포넌트

### Dictaphone.jsx

-   음성 녹음 및 MediaRecorder 관리
-   ElevenLabs STT API 연동
-   AI 서버와의 통신
-   사용자 인터페이스

### AudioCircleSpectrum.jsx

-   실시간 오디오 스펙트럼 시각화
-   Web Audio API를 활용한 음성 분석
-   애니메이션 및 시각적 피드백

## 🌟 특징

-   **고품질 음성 인식**: ElevenLabs의 최신 STT 기술 활용
-   **실시간 시각화**: 음성 입력에 따른 동적 스펙트럼 애니메이션
-   **크로스 플랫폼**: 모든 모던 브라우저에서 동작
-   **접근성**: 키보드 및 터치 인터페이스 지원

## 📄 라이선스

MIT License

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 문의

프로젝트에 대한 문의사항이 있으시면 이슈를 생성해 주세요.
