#!/bin/bash

# 🚀 자동 Git 작업 스크립트
# 사용법: ./auto-git.sh "커밋 메시지"

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 자동 Git 작업 시작...${NC}"

# 커밋 메시지가 제공되지 않으면 기본 메시지 사용
if [ -z "$1" ]; then
    COMMIT_MSG="chore: auto commit $(date '+%Y-%m-%d %H:%M:%S')"
else
    COMMIT_MSG="$1"
fi

echo -e "${YELLOW}📝 커밋 메시지: $COMMIT_MSG${NC}"

# 1. 현재 상태 확인
echo -e "${BLUE}📊 현재 Git 상태 확인...${NC}"
git status

# 2. 모든 변경사항 추가
echo -e "${BLUE}📦 변경사항 스테이징...${NC}"
git add .

# 3. 커밋
echo -e "${BLUE}💾 커밋 생성...${NC}"
git commit -m "$COMMIT_MSG"

# 4. 원격 저장소에서 최신 변경사항 가져오기
echo -e "${BLUE}⬇️ 원격 저장소에서 최신 변경사항 가져오기...${NC}"
git pull origin main

# 5. 로컬 변경사항 푸시
echo -e "${BLUE}⬆️ 로컬 변경사항 푸시...${NC}"
git push origin main

# 6. 완료 메시지
echo -e "${GREEN}✅ 모든 작업이 완료되었습니다!${NC}"
echo -e "${GREEN}🔗 저장소: https://github.com/KoesJin/woodi_QR_Daelim_Project${NC}"
