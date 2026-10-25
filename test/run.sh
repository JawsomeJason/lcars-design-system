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
  LCARS_TARGET=$target LCARS_PALETTE=$palette LCARS_NOW=$now \
    "$shell" -c ". ./$pal; . ./$SH/pill.sh; $*; printf '%s' \"\$lcars_pill_out\""
}
# A zsh-target pill with its %{ %} wrappers removed and %% unescaped reads as the ansi pill
unzsh() { sed -e 's/%{//g' -e 's/%}//g' -e 's/%%/%/g'; }

t "generated outputs match tokens (build --check)" node scripts/build.mjs --check

# Every color and role of every palette, read straight from the token JSON, as "palette name R;G;B"
expected=$(node -e '
  const fs = require("fs"), dir = "tokens/palettes";
  const roles = JSON.parse(fs.readFileSync("tokens/roles.tokens.json")).role;
  const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)).join(";");
  for (const f of fs.readdirSync(dir)) {
    const p = JSON.parse(fs.readFileSync(`${dir}/${f}`)), id = f.split(".")[0], hex = {};
    for (const [k, v] of Object.entries(p.color)) if (!k.startsWith("$")) hex[k] = v.$value.hex;
    for (const k of Object.keys(roles)) if (!k.startsWith("$")) hex[k] = hex[(p.role[k] ?? roles[k]).$value.slice(7, -1)];
    for (const [k, h] of Object.entries(hex)) console.log(id, k, rgb(h));
  }')
check_palette() {
  shell=$1 pal=$2 bad=0
  got=$(printf '%s\n' "$expected" | while read -r id name want; do
    printf '%s %s ' "$id" "$name"
    LCARS_PALETTE=$id "$shell" -c ". ./$pal; lcars_rgb '$name' && printf '%s\n' \"\$lcars_rgb_out\""
  done)
  eq "$got" "$expected"
}
check_dist() {
  got=$(node -e '
    const t = require("./dist/tokens.json");
    const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)).join(";");
    for (const f of require("fs").readdirSync("tokens/palettes")) {
      const id = f.split(".")[0], p = t.palettes[id];
      for (const [k, h] of Object.entries({ ...p.colors, ...p.roles })) console.log(id, k, rgb(h));
    }')
  eq "$(printf '%s\n' "$got" | sort)" "$(printf '%s\n' "$expected" | sort)"
}
t "dist/tokens.json resolves every token in every palette" check_dist
t "palette.sh resolves every token in every palette"  check_palette sh $SH/palette.sh
t "palette.zsh resolves every token in every palette" check_palette zsh $SH/palette.zsh
t "token count is non-trivial" [ "$(printf '%s\n' "$expected" | wc -l)" -ge 50 ]

lit=$(render sh ansi tng 0 "lcars_pill accent PATH '~/x'")
t "lit pill: exact bytes" eq "$lit" \
  "${ESC}[0m${ESC}[38;2;255;153;0m${CL}${ESC}[48;2;255;153;0m${ESC}[38;2;0;0;0mPATH ${ESC}[0m ${ESC}[38;2;255;204;102m~/x ${ESC}[38;2;255;153;0m${CR}${ESC}[0m"

off=$(render sh ansi tng 0 "lcars_pill accent DIFF clean '' off")
t "off pill: unlit block, black label, muted value" eq "$off" \
  "${ESC}[0m${ESC}[38;2;51;51;51m${CL}${ESC}[48;2;51;51;51m${ESC}[38;2;0;0;0mDIFF ${ESC}[0m ${ESC}[38;2;153;153;204mclean ${ESC}[38;2;51;51;51m${CR}${ESC}[0m"

blink_even=$(render sh ansi tng 10 "lcars_pill accent 7D 91% alert blink")
blink_odd=$(render sh ansi tng 11 "lcars_pill accent 7D 91% alert blink")
lit_alert=$(render sh ansi tng 0 "lcars_pill accent 7D 91% alert")
t "blink, even second: lit" eq "$blink_even" "$lit_alert"
t "blink, odd second: block dims to 40% on the 0x33 grid, value unchanged" eq "$blink_odd" \
  "${ESC}[0m${ESC}[38;2;102;51;0m${CL}${ESC}[48;2;102;51;0m${ESC}[38;2;0;0;0m7D ${ESC}[0m ${ESC}[38;2;204;102;102m91% ${ESC}[38;2;102;51;0m${CR}${ESC}[0m"

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
  "%{${ESC}[0m%}%{${ESC}[38;2;204;102;102m%}${CL}%{${ESC}[48;2;204;102;102m%}%{${ESC}[38;2;255;255;153m%}ERR %{${ESC}[0m%} %{${ESC}[38;2;255;204;102m%}50%% %{${ESC}[38;2;204;102;102m%}${CR}%{${ESC}[0m%}"

ink=$(render sh ansi tng 0 "lcars_ink removed; lcars_pill muted DIFF \"\${lcars_ink_out}-1\"")
t "inline ink switches the value color mid-text" eq "$ink" \
  "${ESC}[0m${ESC}[38;2;153;153;204m${CL}${ESC}[48;2;153;153;204m${ESC}[38;2;0;0;0mDIFF ${ESC}[0m ${ESC}[38;2;255;204;102m${ESC}[38;2;204;102;102m-1 ${ESC}[38;2;153;153;204m${CR}${ESC}[0m"

link=$(render sh ansi tng 0 "lcars_pill accent-2 BR main '' on https://x.test")
t "URL wraps the value in an OSC 8 link" eq "$link" \
  "${ESC}[0m${ESC}[38;2;204;153;204m${CL}${ESC}[48;2;204;153;204m${ESC}[38;2;0;0;0mBR ${ESC}[0m ${ESC}]8;;https://x.test${ESC}\\${ESC}[38;2;255;204;102mmain${ESC}]8;;${ESC}\\ ${ESC}[38;2;204;153;204m${CR}${ESC}[0m"

t "R;G;B and #hex literals match names" eq \
  "$(render sh ansi tng 0 "lcars_pill '255;153;0' A b '#ffcc66'")" "$(render sh ansi tng 0 "lcars_pill accent A b value")"
t "unknown color returns 1 and renders nothing" eq \
  "$(render sh ansi tng 0 "lcars_pill nope A b; echo \" rc=\$?\"")" " rc=1"
t "LCARS_PALETTE=2375 switches roles" eq \
  "$(LCARS_PALETTE=2375 sh -c ". ./$SH/palette.sh; printf '%s' \"\$lcars_alert\"")" "221;102;68"
t "unknown LCARS_PALETTE falls back to tng" eq \
  "$(LCARS_PALETTE=nope zsh -c ". ./$SH/palette.zsh; print -r -- \$lcars_palette \$LCARS[alert]")" "tng #cc6666"
t "demo renders every color in every state" sh -c \
  "out=\$(sh demo/pills.sh 2>&1) && [ \$(printf '%s' \"\$out\" | grep -c 'lit') -ge 13 ]"

echo "$n tests, $([ $fail = 0 ] && echo all passed || echo FAILURES)"
exit $fail
