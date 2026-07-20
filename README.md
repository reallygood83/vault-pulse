# Vault Pulse (`vault-pulse`)

**큰 vault를 위한 로컬 레이더 + 매일 20분 정리 습관.**

Obsidian은 노트를 잘 쌓아 주지만, 노트가 많아지면 “뭐부터 손대지?”가 막힙니다.  
Vault Pulse는 **AI 없이**, vault 안에서만 점수를 매겨 **오늘 손댈 카드**를 골라 주고, 타이머 세션으로 하나씩 처리하게 돕습니다.

- 🌐 **한국어 / English** UI 전환  
- ⏰ **매일 특정 시각에 세션 자동 시작** (Obsidian이 켜져 있을 때)  
- 🔒 네트워크·AI·텔레메트리 **없음**

---

## 사용법 (30초)

1. **Vault Pulse** 패널을 연다 (리본 아이콘 또는 명령 `Pulse 보기 열기`)  
2. **큐 다시 만들기** (처음 한 번 / 오래 안 썼을 때)  
3. **세션 시작**  
4. **사이드바 큐**
   - **카드 클릭** → 노트 바로 열기  
   - **삭제** → 확인 후 휴지통  
   - **정보 업데이트** → 요청 입력 창 → [Obsigravity](https://github.com/reallygood83/obsigravity) Note Surgeon 실행  
     (없으면 [BRAT](https://github.com/TfTHacker/obsidian42-brat) 으로 `reallygood83/obsigravity` 설치)  
5. **세션 시작** (선택, 타이머 정리)
   - **열기** — 노트 열기, 세션 유지 · 상태바 **Pulse** 로 복귀  
   - **다음 카드 / 보관 / 나중에 / 건너뛰기**  
   - **×** = 패널만 숨김 · **세션 종료** 만 진짜 종료  

> × 로 닫아도 세션이 **종료되지 않습니다.** 끝낼 때만 **세션 종료**를 누르세요.  
> 목표는 vault 전체 정리 완성이 아니라, **매일 조금** 다시 쓰이게 만드는 것입니다.

### 신호 읽는 법

| 표시 | 뜻 |
|------|-----|
| 오래됨 N일 / Stale | 오래 수정 안 함 |
| 외톨이 / Orphan | 들어오는 링크가 거의 없음 |
| 중복 / Duplicate | 비슷한 제목·앞부분이 또 있음 |
| 미룸 / Avoidance | someday / TODO / 나중에 등 |

---

## 매일 자동 세션 설정

설정 → **Vault Pulse**:

1. **매일 자동 세션 켜기** → ON  
2. **세션 시각** → 예: `21:00` (로컬 시간)  
3. **세션 창 자동으로 열기** → ON (예약 시각에 세션 창이 바로 열림)  

- Obsidian이 **그 시각에 실행 중**이어야 자동 시작됩니다.  
- 놓쳤다면, 다음에 Obsidian을 열 때 **따라잡기(catch-up)** 로 세션을 제안/시작합니다.  
- 자동으로 열기만 끄면, 알림만 뜨고 수동으로 세션을 시작하면 됩니다.

---

## 언어 (한국어 / English)

설정 → **언어** 에서 선택합니다.

| 값 | UI |
|----|-----|
| 한국어 | 버튼·안내·신호 문구 한국어 |
| English | 기본 영어 UI |

명령 팔레트 이름도 선택 언어에 맞춰 표시됩니다. (앱 재시작 후 더 안정적)

---

## 설치

### GitHub Release (권장)

1. [Releases](https://github.com/reallygood83/vault-pulse/releases) 에서  
   `main.js`, `manifest.json`, `styles.css` 받기  
2. 폴더 만들기:  
   `<vault>/.obsidian/plugins/vault-pulse/`  
3. 세 파일 넣기 → 설정에서 **Vault Pulse** 활성화  

### BRAT

1. [BRAT](https://github.com/TfTHacker/obsidian42-brat) 설치  
2. `reallygood83/vault-pulse` 추가  

### 커뮤니티 플러그인

등록되면: 설정 → 커뮤니티 플러그인 → 검색 **Vault Pulse**

---

## 명령

| 명령 | 동작 |
|------|------|
| Pulse 세션 시작 / Start Pulse session | 타이머 세션 |
| Pulse 보기 열기 / Open Pulse view | 사이드 패널 |
| vault 인덱스 다시 스캔 / Rescan vault index | 전체 재스캔 |

---

## 주요 설정

| 설정 | 기본 |
|------|------|
| 언어 | English (한국어 선택 가능) |
| 방치 일수 | 90 |
| 세션 시간(분) | 20 |
| **하루 처리 노트 개수** | `auto` 또는 **1–100** 직접 입력 (바꾼 뒤 큐 다시 만들기) |
| 제외 폴더 | Archive, Templates, attachments, .trash |
| 보관 폴더 | Archive/Pulse |
| 나중에 일수 | 7 |
| 매일 자동 세션 | 끔 |
| 세션 시각 | 21:00 |
| 세션 창 자동 열기 | 켬 |

---

## 안전

- **보관 = 이동**, 자동 삭제 없음  
- 처리·점수는 **로컬만**  
- 스누즈·연속 기록은 플러그인 데이터에만 저장 (노트 본문 강제 수정 없음)

---

## Development

```bash
npm install
npm run build
```

Node 18+ recommended.

## Spec

- [SPEC.md](./SPEC.md)  
- [SPEC-COMMUNITY-CHECKLIST.md](./SPEC-COMMUNITY-CHECKLIST.md)  

## License

MIT © reallygood83

---

# English (short)

**Vault Pulse** is a local, AI-free radar for large Obsidian vaults: score stale/orphan/duplicate notes and run a timed daily triage session.

1. Rebuild queue → 2. Start session → 3. Open / Archive / Snooze / Skip  
Enable **Daily auto session** + time (e.g. `21:00`) + **Auto-open session window** for a scheduled habit.  
Toggle **Language** between English and 한국어 in settings.
