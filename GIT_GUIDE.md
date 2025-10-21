# 🚀 자동 Git 작업 가이드

## 📋 사용 가능한 명령어

### 1. 완전 자동화 (추천)

```bash
# 기본 커밋 메시지로 자동 커밋/풀/푸시
npm run git:auto

# 커스텀 커밋 메시지로 자동 커밋/풀/푸시
./auto-git.sh "feat: add new voice recognition feature"
```

### 2. 수동 Git 명령어

```bash
# 변경사항 스테이징 + 커밋
npm run git:commit "커밋 메시지"

# 풀 + 푸시
npm run git:push
```

### 3. 직접 스크립트 실행

```bash
# 기본 메시지
./auto-git.sh

# 커스텀 메시지
./auto-git.sh "fix: resolve audio recording bug"
```

## 🎯 커밋 메시지 컨벤션

### 타입별 예시

```bash
# 기능 추가
./auto-git.sh "feat: add voice recognition with ElevenLabs STT API"
./auto-git.sh "feat: implement real-time audio spectrum visualization"

# 버그 수정
./auto-git.sh "fix: resolve audio recording not stopping properly"
./auto-git.sh "fix: prevent spectrum animation from continuing after stop"

# 리팩토링
./auto-git.sh "refactor: convert pointer events to simple click toggle"
./auto-git.sh "refactor: clean up console logs and error handling"

# 스타일/UI
./auto-git.sh "style: update README with project documentation"
./auto-git.sh "style: improve UI layout and responsiveness"

# 설정/빌드
./auto-git.sh "chore: update package.json dependencies"
./auto-git.sh "chore: configure ESLint rules"

# 문서
./auto-git.sh "docs: add comprehensive README with setup instructions"
./auto-git.sh "docs: update API integration documentation"
```

## 🔧 자동화 스크립트 기능

### auto-git.sh 스크립트가 수행하는 작업:

1. **현재 상태 확인** - `git status`
2. **모든 변경사항 스테이징** - `git add .`
3. **커밋 생성** - `git commit -m "메시지"`
4. **원격 저장소에서 풀** - `git pull origin main`
5. **로컬 변경사항 푸시** - `git push origin main`

### 안전 기능:

-   충돌 발생 시 자동으로 처리
-   원격 저장소와 동기화 보장
-   컬러풀한 진행 상황 표시

## 🎉 빠른 시작

### 첫 번째 커밋

```bash
# 프로젝트 초기 설정
./auto-git.sh "feat: initial commit - voice recognition app with AI integration"
```

### 일상적인 개발

```bash
# 기능 개발 후
./auto-git.sh "feat: add new voice recognition feature"

# 버그 수정 후
./auto-git.sh "fix: resolve audio recording issue"

# UI 개선 후
./auto-git.sh "style: improve user interface design"
```

## 🔗 저장소 정보

-   **GitHub**: https://github.com/KoesJin/woodi_QR_Daelim_Project
-   **브랜치**: main
-   **원격 저장소**: origin

## ⚠️ 주의사항

-   커밋 메시지는 명확하고 간결하게 작성
-   중요한 변경사항은 미리 테스트 후 커밋
-   충돌 발생 시 수동으로 해결 후 다시 실행
