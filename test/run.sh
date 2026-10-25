#!/bin/sh
# Tests for the tokens and the shell implementation. Needs node (token reads) and zsh.
cd "$(dirname "$0")/.." || exit 1
SH=impl/shell
fail=0 n=0
ESC=$(printf '\033')
CL=$(printf "\356\202\266") CR=$(printf "\356\202\264")
t() {
  n=$((n + 1)); name=$1; shift
  if "$@"; then echo "ok   $name"; else echo "FAIL $name"; fail=1; fi
}
eq() { [ "$1" = "$2" ] || { printf '     want %s\n     got  %s\n' "$2" "$1" | cat -v; return 1; }; }

# Renders one pill: SHELL TARGET PALETTE NOW ARGS... (ARGS are lcars_pill's, single-quoted by the caller)
render() {
  shell=$1 target=$2 palette=$3 now=$4; shift 4
  pal=$SH/palette.sh; [ "$shell" = zsh ] && pal=$SH/palette.zsh
  LCARS_TARGET=$target LCARS_THEME=$palette LCARS_NOW=$now \
    "$shell" -c ". ./$pal; . ./$SH/pill.sh; $*; printf '%s' \"\$lcars_pill_out\""
}
# A zsh-target pill with its %{ %} wrappers removed and %% unescaped reads as the ansi pill
unzsh() { sed -e 's/%{//g' -e 's/%}//g' -e 's/%%/%/g'; }

t "generated outputs match tokens (build --check)" node scripts/build.mjs --check

# Every role of every theme in dark mode (what the shell implements), as "theme role R;G;B"
expected=$(node -e '
  const t = require("./dist/tokens.json");
  const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)).join(";");
  for (const [id, th] of Object.entries(t.themes)) for (const [k, h] of Object.entries(th.modes.dark)) console.log(id, k, rgb(h));')
check_palette() {
  shell=$1 pal=$2
  got=$(printf '%s\n' "$expected" | while read -r id name want; do
    printf '%s %s ' "$id" "$name"
    LCARS_THEME=$id "$shell" -c ". ./$pal; lcars_rgb '$name' && printf '%s\n' \"\$lcars_rgb_out\""
  done)
  eq "$got" "$expected"
}
rgbof() { printf '%s\n' "$expected" | awk -v t="$1" -v r="$2" '$1 == t && $2 == r { print $3 }'; }
hexof() { node -e 'console.log(require("./dist/tokens.json").themes[process.argv[1]].modes.dark[process.argv[2]])' "$1" "$2"; }
ACC=$(rgbof tng accent) VAL=$(rgbof tng value) INK=$(rgbof tng label-ink) UNLIT=$(rgbof tng unlit)
MUTED=$(rgbof tng muted) ALERT=$(rgbof tng alert) ACC2=$(rgbof tng accent-2) EMPH=$(rgbof tng emphasis-ink) REMOVED=$(rgbof tng removed)
# The renderer's blink dim, computed here independently: channel x 0.4, nearest multiple of 0x33
DIMACC=$(node -e 'console.log(process.argv[1].split(";").map((c) => Math.round(c * 0.4 / 51) * 51).join(";"))' "$ACC")

# Values measured in the LCARS lab, checked against the resolved tokens
spot() { eq "$(node -e 'const t=require("./dist/tokens.json"); console.log(t.themes[process.argv[1]].modes[process.argv[2]][process.argv[3]])' "$1" "$2" "$3")" "$4"; }
t "VOY alert is the screen-true Juggernaut stand-in" spot voy dark alert '#873421'
t "VOY points ok at its meter blue"               spot voy dark ok '#88bbdd'
t "VOY light display is measured, not derived"     spot voy light display '#555566'
t "NEM keeps its canon meter yellow in light mode"   spot nem light meter-on '#ffff99'
t "light mode keeps ink dark"                      spot tng light ink '#000000'
t "print text is black"  spot fc print text '#000000'
t "print ink is white"   spot fc print ink '#ffffff'


t "palette.sh resolves every role in every theme"  check_palette sh $SH/palette.sh
t "palette.zsh resolves every role in every theme" check_palette zsh $SH/palette.zsh
t "token count is non-trivial" [ "$(printf '%s\n' "$expected" | wc -l)" -ge 50 ]

lit=$(render sh ansi tng 0 "lcars_pill accent PATH '~/x'")
t "lit pill: exact bytes" eq "$lit" \
  "${ESC}[0m${ESC}[38;2;${ACC}m${CL}${ESC}[48;2;${ACC}m${ESC}[38;2;${INK}mPATH ${ESC}[0m ${ESC}[38;2;${VAL}m~/x ${ESC}[38;2;${ACC}m${CR}${ESC}[0m"

off=$(render sh ansi tng 0 "lcars_pill accent DIFF clean '' off")
t "off pill: unlit block, black label, muted value" eq "$off" \
  "${ESC}[0m${ESC}[38;2;${UNLIT}m${CL}${ESC}[48;2;${UNLIT}m${ESC}[38;2;${INK}mDIFF ${ESC}[0m ${ESC}[38;2;${MUTED}mclean ${ESC}[38;2;${UNLIT}m${CR}${ESC}[0m"

blink_even=$(render sh ansi tng 10 "lcars_pill accent 7D 91% alert blink")
blink_odd=$(render sh ansi tng 11 "lcars_pill accent 7D 91% alert blink")
lit_alert=$(render sh ansi tng 0 "lcars_pill accent 7D 91% alert")
t "blink, even second: lit" eq "$blink_even" "$lit_alert"
t "blink, odd second: block dims to 40% on the 0x33 grid, value unchanged" eq "$blink_odd" \
  "${ESC}[0m${ESC}[38;2;${DIMACC}m${CL}${ESC}[48;2;${DIMACC}m${ESC}[38;2;${INK}m7D ${ESC}[0m ${ESC}[38;2;${ALERT}m91% ${ESC}[38;2;${DIMACC}m${CR}${ESC}[0m"

# Same pill through both targets and every shell
same_everywhere() {
  args=$1
  for now in 10 11; do
    ref=$(render sh ansi tng $now "$args")
    for shell in sh bash zsh; do
      eq "$(render $shell ansi tng $now "$args")" "$ref" || return 1
      eq "$(render $shell zsh tng $now "$args" | unzsh)" "$ref" || return 1
    done
  done
}
t "identical colors and states: lit, every shell and target"   same_everywhere "lcars_pill accent-2 BR main"
t "identical colors and states: off, every shell and target"   same_everywhere "lcars_pill muted DIFF clean '' off"
t "identical colors and states: blink, every shell and target" same_everywhere "lcars_pill alert DISK '5% free' '' blink"
t "identical colors and states: inline ink and link"           same_everywhere "lcars_ink added; a=\$lcars_ink_out; lcars_ink 33; lcars_pill muted DIFF \"\${a}+3 \${lcars_ink_out}+1\" '' on https://x.test/a%20b"

zsh_pct=$(render zsh zsh tng 0 "lcars_pill alert ERR '50%' '' on '' emphasis-ink")
t "zsh target escapes % and wraps every escape" eq "$zsh_pct" \
  "%{${ESC}[0m%}%{${ESC}[38;2;${ALERT}m%}${CL}%{${ESC}[48;2;${ALERT}m%}%{${ESC}[38;2;${EMPH}m%}ERR %{${ESC}[0m%} %{${ESC}[38;2;${VAL}m%}50%% %{${ESC}[38;2;${ALERT}m%}${CR}%{${ESC}[0m%}"

ink=$(render sh ansi tng 0 "lcars_ink removed; lcars_pill muted DIFF \"\${lcars_ink_out}-1\"")
t "inline ink switches the value color mid-text" eq "$ink" \
  "${ESC}[0m${ESC}[38;2;${MUTED}m${CL}${ESC}[48;2;${MUTED}m${ESC}[38;2;${INK}mDIFF ${ESC}[0m ${ESC}[38;2;${VAL}m${ESC}[38;2;${ALERT}m-1 ${ESC}[38;2;${MUTED}m${CR}${ESC}[0m"

link=$(render sh ansi tng 0 "lcars_pill accent-2 BR main '' on https://x.test")
t "URL wraps the value in an OSC 8 link" eq "$link" \
  "${ESC}[0m${ESC}[38;2;${ACC2}m${CL}${ESC}[48;2;${ACC2}m${ESC}[38;2;${INK}mBR ${ESC}[0m ${ESC}]8;;https://x.test${ESC}\\${ESC}[38;2;${VAL}mmain${ESC}]8;;${ESC}\\ ${ESC}[38;2;${ACC2}m${CR}${ESC}[0m"

t "R;G;B and #hex literals match names" eq \
  "$(render sh ansi tng 0 "lcars_pill '$ACC' A b '$(hexof tng value)'")" "$(render sh ansi tng 0 "lcars_pill accent A b value")"
t "unknown color returns 1 and renders nothing" eq \
  "$(render sh ansi tng 0 "lcars_pill nope A b; echo \" rc=\$?\"")" " rc=1"
t "LCARS_THEME=voy switches roles" eq \
  "$(LCARS_THEME=voy sh -c ". ./$SH/palette.sh; printf '%s' \"\$lcars_alert\"")" "135;52;33"
t "LCARS_PALETTE still selects a theme" eq \
  "$(LCARS_PALETTE=voy sh -c ". ./$SH/palette.sh; printf '%s' \"\$lcars_theme\"")" "voy"
t "unknown LCARS_PALETTE falls back to tng" eq \
  "$(LCARS_PALETTE=nope zsh -c ". ./$SH/palette.zsh; print -r -- \$lcars_palette \$LCARS[alert]")" "tng #ff2200"
t "demo renders every color in every state" sh -c \
  "out=\$(sh demo/pills.sh 2>&1) && [ \$(printf '%s' \"\$out\" | grep -c 'lit') -ge 13 ]"

echo "$n tests, $([ $fail = 0 ] && echo all passed || echo FAILURES)"
exit $fail
