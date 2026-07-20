# Session UX decision (Fable-aligned)

## Problem
Users clicked **Open**, edited the note, then closed the session modal (×).  
`Modal.onClose` called `onComplete` → session ended. That blocks real triage work.

## Principle
**Session state lives in the plugin, not in the modal.**  
The modal is only a panel. Hiding it must not destroy the session.

## Behavior (0.2.1+)

| User action | Result |
|-------------|--------|
| × / Escape / Hide panel | Pause: timer keeps running, status bar shows **Pulse · resume** |
| Open | Open note + hide panel; stay on same card when resuming |
| Next card | Advance without archive |
| Archive / Snooze / Skip | Resolve + advance |
| End session | Explicit complete + streak stats |
| Timer 0 | Auto complete |

## Why not keep modal always on top
Editing markdown under a blocking modal is painful. Minimize + status bar resume matches Obsidian habits (like other plugins’ status controls).
