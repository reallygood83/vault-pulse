export type PulseLocale = "en" | "ko";

type Dict = Record<string, string>;

const en: Dict = {
  pluginName: "Vault Pulse",
  viewSubtitle: "Local radar for notes worth triaging. No AI. No network.",
  startSession: "Start session",
  rebuildQueue: "Rebuild queue",
  todayQueue: "Today's queue",
  emptyQueue:
    "No signals right now. Rescan after more notes age, or lower Stale days in settings.",
  score: "score",
  sessionTitle: "Vault Pulse session",
  remaining: "remaining",
  cardProgress: "Card {current} / {total} · processed {done}",
  queueComplete:
    "Queue complete. Great work — end session or wait for the timer.",
  open: "Open",
  openTooltip: "Open the note to edit. Session stays active — click the status bar to return.",
  clickToOpen: "Click to open this note",
  delete: "Delete",
  deleteTooltip: "Move note to trash (asks for confirmation)",
  deleteConfirm: "Move this note to trash?\n{path}",
  deleted: "Moved to trash: {path}",
  deleteFailed: "Could not delete note.",
  updateInfo: "Update info",
  updateInfoTooltip: "Update this note with Obsigravity (prompt first)",
  updateInfoTitle: "Update note with Obsigravity",
  updateInfoNote: "Note: {title}",
  updateInfoHint:
    "Describe what to update. Obsigravity will read the note and apply your request (Note Surgeon). Install via BRAT: reallygood83/obsigravity if missing.",
  updateInfoPrompt: "Your request",
  updateInfoPromptDesc: "What should change in this note?",
  updateInfoPlaceholder:
    "e.g. Refresh outdated facts, clarify structure, add missing tags and links…",
  updateInfoRun: "Run update",
  cancel: "Cancel",
  obsigravityMissing:
    "Obsigravity is not installed. Install BRAT, then add reallygood83/obsigravity. Opening the note only.",
  obsigravitySoftHandoff:
    "Opened note + Obsigravity. Run /note-surgeon with your request if auto-start did not fire.",
  obsigravityUpdateFailed:
    "Obsigravity update failed. The note was opened so you can retry from Obsigravity (/note-surgeon).",
  next: "Next card",
  nextTooltip: "Done with this note for now — go to the next card (does not archive).",
  archive: "Archive",
  snooze: "Snooze",
  skip: "Skip",
  endSession: "End session",
  pauseSession: "Hide panel",
  pauseTooltip: "Hide this window. Timer keeps running. Resume from the status bar.",
  sessionHint:
    "Tip: Open a note to edit anytime. Closing × only hides this panel — it does NOT end the session. Use “End session” when finished.",
  sessionPaused:
    "Pulse session paused ({time} left). Click the status bar “Pulse” to resume.",
  statusBarActive: "Pulse {time}",
  statusBarPaused: "Pulse · resume {time}",
  timeUp: "Pulse session time is up.",
  actionFailed: "Pulse action failed. See console.",
  cmdResume: "Resume Pulse session",
  scanning: "Vault Pulse: scanning vault…",
  scanComplete: "Vault Pulse: scan complete.",
  nothingToTriage: "Vault Pulse: nothing to triage right now.",
  scheduledTime: "Vault Pulse: scheduled session starting.",
  catchUp: "Vault Pulse: catch-up session available — starting now.",
  catchUpManual:
    "Vault Pulse: catch-up session available. Run “Start session”.",
  archived: "Archived → {path}",
  sessionDone:
    "Pulse done: {done}/{target} · open {opened} · archive {archived} · snooze {snoozed} · skip {skipped} · streak {streak}",
  settingsTitle: "Vault Pulse",
  settingsIntro: "All processing is local. No AI. No network calls.",
  language: "Language",
  languageDesc: "UI language for Vault Pulse (English / Korean).",
  staleDays: "Stale days",
  staleDaysDesc:
    "Notes not modified for at least this many days can be flagged stale.",
  sessionMinutes: "Session minutes",
  sessionMinutesDesc: "Default focus session length (habit timebox).",
  sessionTarget: "Session target count",
  sessionTargetDesc:
    'Number of cards per session, or "auto" (~minutes/1.5, clamped 5–20).',
  excludeFolders: "Exclude folders",
  excludeFoldersDesc:
    "Comma-separated folder prefixes to ignore (e.g. Archive, Templates).",
  archiveFolder: "Archive folder",
  archiveFolderDesc:
    "Archive action moves notes under this folder (year-month subfolder).",
  snoozeDays: "Snooze days",
  snoozeDaysDesc: "How long Snooze hides a note from the queue.",
  maxPerFolder: "Max notes per folder",
  maxPerFolderDesc: "Diversity cap so one folder does not fill the queue.",
  scheduleHeading: "Daily auto session",
  scheduleEnabled: "Enable daily auto session",
  scheduleEnabledDesc:
    "When Obsidian is open at the set local time, start a Pulse session automatically. Catch-up on next launch if you missed it.",
  scheduleTime: "Session time",
  scheduleTimeDesc: "Local 24h time, e.g. 21:00",
  scheduleAutoStart: "Auto-open session window",
  scheduleAutoStartDesc:
    "On: open the session modal at the scheduled time. Off: only show a notice.",
  weightsHeading: "Signal weights",
  weightStale: "Stale weight",
  weightOrphan: "Orphan weight",
  weightDuplicate: "Duplicate weight",
  weightAvoidance: "Avoidance weight",
  streakLine: "Streak: {days} day(s). Last session: {last}",
  signalStale: "Stale {days}d",
  signalOrphan: "Orphan",
  signalDuplicate: "Duplicate",
  signalAvoidance: "Avoidance",
  rootFolder: "root",
  cmdStart: "Start Pulse session",
  cmdOpenView: "Open Pulse view",
  cmdRescan: "Rescan vault index",
  howToHeading: "How to use (simple)",
  howToBody:
    "1) Rebuild queue → 2) Click a card to open · Delete · Update info (Obsigravity) → 3) Or Start session for timed triage. Closing session × only hides the panel.",
};

const ko: Dict = {
  pluginName: "Vault Pulse",
  viewSubtitle:
    "손댈 만한 노트를 골라 주는 로컬 레이더입니다. AI 없음 · 네트워크 없음.",
  startSession: "세션 시작",
  rebuildQueue: "큐 다시 만들기",
  todayQueue: "오늘의 큐",
  emptyQueue:
    "지금 추천할 노트가 없습니다. 노트가 더 오래되거나, 설정에서 ‘방치 일수’를 낮춰 보세요.",
  score: "점수",
  sessionTitle: "Vault Pulse 세션",
  remaining: "남음",
  cardProgress: "카드 {current} / {total} · 처리 {done}",
  queueComplete:
    "큐를 모두 처리했습니다. 세션을 끝내거나 타이머가 끝날 때까지 기다려도 됩니다.",
  open: "열기",
  openTooltip:
    "노트를 열어 수정합니다. 세션은 유지됩니다. 상태바의 Pulse를 누르면 돌아옵니다.",
  clickToOpen: "클릭하면 노트가 열립니다",
  delete: "삭제",
  deleteTooltip: "노트를 휴지통으로 보냅니다 (확인 후)",
  deleteConfirm: "이 노트를 휴지통으로 보낼까요?\n{path}",
  deleted: "휴지통으로 이동: {path}",
  deleteFailed: "노트를 삭제하지 못했습니다.",
  updateInfo: "정보 업데이트",
  updateInfoTooltip: "Obsigravity로 노트 정보 업데이트 (먼저 요청 입력)",
  updateInfoTitle: "Obsigravity로 정보 업데이트",
  updateInfoNote: "대상 노트: {title}",
  updateInfoHint:
    "무엇을 바꿀지 적어 주세요. Obsigravity가 노트를 읽고 요청에 맞게 수정합니다(Note Surgeon). 없으면 BRAT로 reallygood83/obsigravity 설치.",
  updateInfoPrompt: "요청 내용",
  updateInfoPromptDesc: "이 노트에 어떤 업데이트를 원하나요?",
  updateInfoPlaceholder:
    "예: 오래된 사실 정리, 구조 다듬기, 태그·링크 보강…",
  updateInfoRun: "업데이트 실행",
  cancel: "취소",
  obsigravityMissing:
    "Obsigravity가 없습니다. BRAT 설치 후 reallygood83/obsigravity 를 추가하세요. 노트만 엽니다.",
  obsigravitySoftHandoff:
    "노트와 Obsigravity를 열었습니다. 자동 실행이 안 되면 /note-surgeon 으로 요청을 보내세요.",
  obsigravityUpdateFailed:
    "Obsigravity 업데이트에 실패했습니다. 노트를 열었으니 Obsigravity에서 /note-surgeon 으로 다시 시도해 보세요.",
  next: "다음 카드",
  nextTooltip: "이 노트는 일단 끝 — 다음 카드로 (보관하지 않음).",
  archive: "보관",
  snooze: "나중에",
  skip: "건너뛰기",
  endSession: "세션 종료",
  pauseSession: "패널 숨기기",
  pauseTooltip:
    "창만 숨깁니다. 타이머는 계속 갑니다. 상태바에서 다시 열 수 있습니다.",
  sessionHint:
    "팁: 「열기」로 노트를 수정하세요. × 로 닫아도 세션은 끝나지 않습니다. 끝낼 때만 「세션 종료」를 누르세요.",
  sessionPaused:
    "Pulse 세션 일시 숨김 (남은 시간 {time}). 상태바의 “Pulse”를 눌러 이어서 하세요.",
  statusBarActive: "Pulse {time}",
  statusBarPaused: "Pulse · 이어하기 {time}",
  timeUp: "Pulse 세션 시간이 끝났습니다.",
  actionFailed: "작업에 실패했습니다. 콘솔을 확인해 주세요.",
  cmdResume: "Pulse 세션 이어하기",
  scanning: "Vault Pulse: vault 스캔 중…",
  scanComplete: "Vault Pulse: 스캔 완료.",
  nothingToTriage: "Vault Pulse: 지금 정리할 노트가 없습니다.",
  scheduledTime: "Vault Pulse: 예약 세션을 시작합니다.",
  catchUp: "Vault Pulse: 놓친 세션을 지금 시작합니다.",
  catchUpManual:
    "Vault Pulse: 놓친 세션이 있습니다. 「세션 시작」을 눌러 주세요.",
  archived: "보관됨 → {path}",
  sessionDone:
    "세션 끝: {done}/{target} · 열기 {opened} · 보관 {archived} · 나중에 {snoozed} · 건너뜀 {skipped} · 연속 {streak}일",
  settingsTitle: "Vault Pulse",
  settingsIntro: "모든 처리는 로컬에서만 합니다. AI 없음 · 네트워크 호출 없음.",
  language: "언어",
  languageDesc: "Vault Pulse 화면 언어 (영어 / 한국어).",
  staleDays: "방치 일수",
  staleDaysDesc:
    "이 일수 이상 수정하지 않은 노트를 ‘오래됨(Stale)’으로 볼 수 있습니다.",
  sessionMinutes: "세션 시간(분)",
  sessionMinutesDesc: "한 번 집중 세션 길이(습관용 타이머).",
  sessionTarget: "세션 카드 수",
  sessionTargetDesc:
    '세션당 카드 개수. "auto"면 대략 분÷1.5 (5~20개로 제한).',
  excludeFolders: "제외 폴더",
  excludeFoldersDesc:
    "무시할 폴더 접두사(쉼표로 구분). 예: Archive, Templates",
  archiveFolder: "보관 폴더",
  archiveFolderDesc:
    "「보관」 시 노트를 이 폴더 아래(연-월 하위 폴더)로 옮깁니다.",
  snoozeDays: "나중에 일수",
  snoozeDaysDesc: "「나중에」를 누르면 이 일수 동안 큐에서 숨깁니다.",
  maxPerFolder: "폴더당 최대 개수",
  maxPerFolderDesc: "한 폴더 노트가 큐를 독식하지 않도록 하는 상한.",
  scheduleHeading: "매일 자동 세션",
  scheduleEnabled: "매일 자동 세션 켜기",
  scheduleEnabledDesc:
    "Obsidian이 켜져 있고 설정한 시각이 되면 Pulse 세션을 자동으로 엽니다. 놓쳤다면 다음에 앱을 열 때 이어서 제안합니다.",
  scheduleTime: "세션 시각",
  scheduleTimeDesc: "로컬 24시간 형식. 예: 21:00",
  scheduleAutoStart: "세션 창 자동으로 열기",
  scheduleAutoStartDesc:
    "켜기: 예약 시각에 세션 창을 바로 엽니다. 끄기: 알림만 표시합니다.",
  weightsHeading: "신호 가중치",
  weightStale: "오래됨 가중치",
  weightOrphan: "외톨이 가중치",
  weightDuplicate: "중복 가중치",
  weightAvoidance: "미룸 가중치",
  streakLine: "연속: {days}일 · 마지막 세션: {last}",
  signalStale: "오래됨 {days}일",
  signalOrphan: "외톨이",
  signalDuplicate: "중복",
  signalAvoidance: "미룸",
  rootFolder: "루트",
  cmdStart: "Pulse 세션 시작",
  cmdOpenView: "Pulse 보기 열기",
  cmdRescan: "vault 인덱스 다시 스캔",
  howToHeading: "사용법 (간단)",
  howToBody:
    "1) 큐 다시 만들기 → 2) 카드 클릭으로 열기 · 삭제 · 정보 업데이트(Obsigravity) → 3) 또는 세션 시작으로 타이머 정리. 세션 × 는 패널만 숨깁니다.",
};

const TABLES: Record<PulseLocale, Dict> = { en, ko };

export function t(
  locale: PulseLocale,
  key: string,
  vars?: Record<string, string | number>
): string {
  const table = TABLES[locale] ?? en;
  let s = table[key] ?? en[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      s = s.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
    }
  }
  return s;
}
