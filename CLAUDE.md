# Wallar - AR Wall Interactive Project

## 프로젝트 개요
Wallar는 8thWall과 A-Frame을 기반으로 하는 웹 AR 프로젝트로, 사용자가 실제 공간의 벽면을 지정하고 가상 물체와 상호작용할 수 있는 증강현실 애플리케이션입니다.

## 기술 스택
- **프레임워크**: Svelte 5 (최신 rune 문법 사용)
- **AR 라이브러리**: 8thWall, A-Frame 1.5.0
- **물리 엔진**: Ammo.js (A-Frame Physics System)
- **빌드 도구**: Vite, SvelteKit 2
- **3D 그래픽**: Three.js (8thWall에 내장)

## 주요 매커니즘

### 1단계: 바닥 엣지 가이드 설정
- 카메라가 활성화되면 레이캐스터가 바닥면(`#ground`)과의 접점을 실시간으로 추적
- `wallFromFloorComponent`가 바닥 엣지 가이드라인(`#bottomGuide`)과 텍스트(`#bottomGuideText`)를 카메라 시점에 따라 위치시킴
- 사용자 안내: "스마트폰을 움직여 벽과 바닥이 만나는 지점에 안내선을 평행하게 맞춘 후 화면을 탭하세요"

### 2단계: 가상 벽면 생성 및 상단 가이드 설정
- 화면 첫 탭 시 `placeWall()` 함수 실행:
  - 바닥 가이드 위치 고정
  - 가상 벽면(`#wall`) 생성 (검은색 반투명, scanner-shader 적용)
  - 상단 가이드(`#topGuide`) 생성
  - `setWallTopComponent`가 상단 가이드를 가상 벽면과 카메라 레이캐스터의 접점에 위치시킴
- 사용자 안내: "스마트폰을 기울여 벽면의 최상단에 안내선을 평행하게 맞춘 후 화면을 탭하세요"

### 3단계: 지붕 생성 및 물리 설정
- 화면 두 번째 탭 시 `createRoof()` 함수 실행:
  - 상단 가이드 위치 고정
  - 벽 높이 계산: `wallHeight = topPosY - bottomPosY`
  - 물리 충돌용 건물 블록(`#building`) 생성 및 Ammo.js 물리 속성 적용
  - 가림막(`#hideBlock`) 생성 (xrextras-hider-material 적용)
  - 그림자용 지붕 평면 생성
  - 조명 설정 업데이트
- 사용자 안내: "설정한 벽면을 탭해보세요!"

### 4단계: 인터랙티브 물리 시뮬레이션
- 가상 벽면 탭 시 `play()` 함수 실행:
  - 3D 모델(수프 캔) 생성 및 물리 속성 적용
  - 랜덤한 힘과 회전력 적용
  - 충돌 시 사운드 재생
  - Instanced Mesh를 사용한 성능 최적화

## 주요 컴포넌트

### wall-from-floor.js
- `wallFromFloorComponent`: 바닥 엣지 가이드 컨트롤
- `setWallTopComponent`: 상단 엣지 가이드 컨트롤 및 지붕 생성
- `placeOnWallComponent`: 벽면 위 객체 배치 (현재 미사용)

### holographicModule.js
- Three.js 기반 홀로그래픽 셰이더 머티리얼
- Scanner shader와 Wave shader 제공
- 지연 초기화 패턴으로 THREE.js 로드 문제 해결

## 개발 환경 설정

### HTTPS 설정
로컬 개발 시 HTTPS가 필요하며, `vite.config.ts`에서 SSL 인증서 설정:
```javascript
server: {
  https: {
    key: fs.readFileSync('./key.pem'),
    cert: fs.readFileSync('./cert.pem')
  }
}
```

### 실행 명령어
```bash
npm run dev -- --host
```

## 주의사항
- 8thWall API 키가 환경변수 `VITE_8THWALL_API_KEY`로 필요
- Three.js는 8thWall에 내장되어 있으므로 별도 설치 불필요
- 모든 AR 기능은 HTTPS 환경에서만 작동

## 향후 개선사항
- 타입스크립트 마이그레이션
- 에러 핸들링 강화
- 성능 최적화
- 추가 인터랙션 기능