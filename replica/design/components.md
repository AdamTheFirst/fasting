# Fast me components

Every component uses role tokens from `tokens.json` (via `tokens.css` or `tailwind.config.js`), never raw colours. Screen IDs refer to the list in `../recon.md`. Native first: each block names the iOS (SwiftUI) and Android (Compose) base where one exists, so we get platform accessibility for free.

```
Button
  variants  primary, secondary, ghost, danger
  sizes     md 44px, lg 56px (Start and End on the Fast screen)
  states    default, pressed (opacity 0.85, scale 0.98), focus-visible (2px ring focus, 2px offset), disabled (40% opacity, no press), loading (spinner replaces icon, label kept)
  tokens    primary: bg accent, text on-accent; secondary: bg surface-2, text text; ghost: text accent; danger: bg danger, text on-danger
            radius full (lg) / md (md), font md/600, padding x 6
  a11y      native Button / Material Button; label is a verb ("Start fast", "End fast"); loading sets busy, keeps label
  used on   S01, S02, S03, S04, S09

Day ring (timer)
  parts     track (ring-track), day arc (accent, fills once per 24 h), goal track (thin outer arc, accent-subtle to accent) only when a goal exists, milestone ticks
  sizes     264px diameter, 14px stroke; goal track 4px, 8px outside
  states    idle (empty track, no arc), running, goal reached (goal track full, small "Goal reached" label, no confetti), over goal (keeps counting, no warning colour)
  motion    updates once a minute; no continuous animation; reduce-motion: no sweep on open
  tokens    centre number font display/600 tabular-nums, text; label xs/500 text-muted
  a11y      the ring is decorative; one accessibility element reads "Fasting 3 days 4 hours 12 minutes. Goal 5 days, 1 day 19 hours left." Updates announced only on milestones
  used on   S01, S02
  note      time is always derived from stored start (UTC), never a ticking counter; display as 3d 04h 12m, below 24 h as 16h 05m

Elapsed timer text
  format    >= 24 h: "3d 04h 12m"; < 24 h: "16h 05m 12s" (seconds only under 24 h); never "76:12"
  tokens    display/600 tabular-nums on S02; xl/600 on rows and widget
  a11y      spoken format uses words, not abbreviations
  used on   S02, S05, widget

Preset chip
  variants  default, selected, "No goal" (always first, default selected)
  states    default, pressed, selected (bg accent-subtle, border accent, text text), focus-visible
  tokens    height 36, radius full, font sm/500, border border
  a11y      a single-select group; selected state announced
  used on   S01, S03

Sheet
  variants  half (end fast, edit), full (add past fast)
  states    opening, open, dragging, closing; keyboard-aware
  tokens    bg surface, radius lg top corners, shadow sheet, grabber 36x4 border
  a11y      native sheet / ModalBottomSheet; focus moves to title; swipe down or Cancel closes; Escape on hardware keyboards
  used on   S03, S04

Date-time field
  states    default, focus, error ("End is before start"), disabled
  tokens    height 48, bg surface, border border-input, radius md, text md, label sm/500 text-muted, error text danger with icon
  a11y      opens the native date and time picker; error tied to the field (accessibilityHint / error semantics); duration below updates live ("Duration 2d 06h")
  used on   S03, S04

Fast row (history list)
  parts     date range ("Mon 21 Oct 19:00 to Thu 24 Oct 08:30"), duration (lg/600 tabular), goal met dot, chevron
  states    default, pressed, swipe actions (Edit, Delete danger), running (accent dot + "Running")
  tokens    min height 64, bg surface, divider border, padding x 4
  a11y      whole row is one button; swipe actions also in the context menu / long press so they are reachable without gestures
  used on   S05

Section header
  tokens    xs/600 uppercase tracking 0.04em text-muted, bg bg, sticky
  used on   S05, S08

Toast (undo)
  variants  info, undo
  states    entering, visible 5 s, leaving; paused while touched or while a screen reader focuses it
  tokens    bg text, text bg, radius md, shadow raised
  a11y      announced politely; Undo is a real button
  used on   S04, S05

Empty state
  copy      our own words, one line plus one button ("No fasts yet." + "Add a past fast")
  tokens    text-muted md, no illustration
  used on   S05, S06, S07

Month calendar
  parts     weekday header, day cells, fast bars (a multi-day fast is one continuous bar across cells, wrapping at week end)
  states    today ring, selected day, running fast bar (striped end)
  tokens    cell 44 min, bar 6px accent, radius full, numbers sm tabular
  a11y      grid semantics; each day reads "24 October, fasting 19 hours"; swipe or arrow buttons change month
  used on   S06

Bar chart
  parts     y-axis in hours up to 48 h, then in days; gridline per day past 48 h; bars accent; optional weight line text-muted 2px with dots
  states    empty, loading, one fast, selected bar (tooltip with exact duration)
  tokens    bar radius sm top, axis xs text-muted, gridline border
  a11y      a data table alternative ("Show as list"); selected bar announced
  used on   S07
  rule      the axis grows with the longest fast in range so a 120 h fast never clips

Segmented control
  options   Week, Month, Year, All
  tokens    bg surface-2, selected bg surface + shadow raised, radius md, font sm/600
  a11y      native segmented picker / Material SegmentedButton
  used on   S07

Stat tile
  parts     label (xs text-muted), value (xl/600 tabular)
  examples  Longest fast, Total this month, Fasts this month, Average
  used on   S07

List row (settings)
  variants  navigation (chevron), switch, value (right-aligned text-muted)
  tokens    min height 52, bg surface, divider border
  a11y      native list rows; switches announce on/off
  used on   S08

Switch
  states    off, on (accent), disabled, focus-visible
  a11y      native Toggle / Switch
  used on   S08, S09

Safety card
  parts     title, 4 short lines (electrolytes, refeed slowly, warning signs, who should ask a doctor), link to sources, Got it, "Don't show again"
  states    shown once per fast at 72 h or when a goal >= 72 h is set; dismissed
  tokens    bg surface, border-left 4px warning, radius md, text md
  a11y      not a modal; it never blocks the timer; announced once when shown
  used on   S09

Milestone banner
  states    in-app (top banner, 4 s), notification (system)
  copy      plain: "24 hours." / "Goal reached: 3 days." / "New longest fast."
  tokens    bg accent-subtle, text text, radius md
  a11y      announced politely; never sound or vibration unless the person enabled it
  used on   S10
```

## States every screen must handle

Empty (no fasts), one fast, a running fast that crosses DST and a time-zone change, a 30-day fast (display and chart), an edited fast that now overlaps another (inline error, no silent merge), offline (everything works; Health sync queues), permission denied for Health or notifications (the setting explains and links to system settings, nothing else changes).

## Build check

`preview.html` renders every primitive and four screens from the tokens alone, in light and dark (open it next to `tokens.css`). Regenerate after any token change:

```bash
python3 replica/design/build_tokens.py replica/design/tokens.json
python3 replica/design/contrast.py replica/design/tokens.json > replica/design/contrast-report.txt
```

Current contrast report: 36 pairs across both themes, 0 AA failures.
