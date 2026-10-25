#!/bin/sh
# Every role of a theme in every state, both blink phases side by side.
#   sh demo/pills.sh            the default theme (tng)
#   LCARS_THEME=voy sh demo/pills.sh
#   sh demo/pills.sh --live     redraws each second so blink blinks; Ctrl-C to stop
dir=$(cd "$(dirname "$0")/../impl/shell" && pwd)
. "$dir/palette.sh"
. "$dir/pill.sh"

row() {
  lcars_pill "$1" "$2" lit; line=$lcars_pill_out
  lcars_pill "$1" "$2" off '' off; line="$line $lcars_pill_out"
  if [ -n "$live" ]; then
    LCARS_NOW=$(date +%s) lcars_pill "$1" "$2" blink '' blink; line="$line $lcars_pill_out"
  else
    LCARS_NOW=0 lcars_pill "$1" "$2" blink '' blink; line="$line $lcars_pill_out"
    LCARS_NOW=1 lcars_pill "$1" "$2" dim '' blink; line="$line $lcars_pill_out"
  fi
  printf '%-18s %s\n' "$3" "$line"
}

draw() {
  printf '%s theme, dark mode: roles\n' "$lcars_theme"
  for r in $lcars_roles; do
    case $r in bg|ink|*-ink|data-hi) continue ;; esac
    row "$r" "$(printf '%s' "$r" | tr a-z- A-Z_ | cut -c1-6)" "$r"
  done
}

live=''
[ "$1" = --live ] && live=1
if [ -n "$live" ]; then
  while :; do printf '\033[H\033[2J'; draw; sleep 1; done
else
  draw
fi
