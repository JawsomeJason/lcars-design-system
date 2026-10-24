# shellcheck shell=sh
# LCARS pill renderer for terminals. POSIX sh; also sources into bash and zsh.
# Source palette.sh (sh, bash) or palette.zsh (zsh) first; both define lcars_rgb and lcars_dim_*.
#
#   lcars_pill ROLE_OR_COLOR LABEL VALUE [VALUE_COLOR] [on|off|blink] [URL] [LABEL_INK]
#     Sets lcars_pill_out to one pill, or returns 1 for an unknown color. VALUE_COLOR defaults to the
#     value role, LABEL_INK to label-ink. URL makes the value an OSC 8 hyperlink.
#   lcars_ink COLOR
#     Sets lcars_ink_out to a marker that switches the value's color mid-text. COLOR is a name,
#     R;G;B, #rrggbb, or a bare SGR code such as 33 for the terminal's own yellow.
#
# A color is a role or color name, R;G;B, or #rrggbb. Environment:
#   LCARS_TARGET  ansi (default) prints escapes as is; zsh wraps each in %{ %} and escapes % as %%.
#   LCARS_NOW     epoch seconds that pick the blink phase; defaults to the clock.

lcars_color() {
  case $1 in
    *';'*';'*) lcars_color_out=$1 ;;
    '#'??????)
      set -- "${1#?}"
      set -- "${1%????}" "${1#??}" "${1#????}"
      lcars_color_out="$((0x$1));$((0x${2%??}));$((0x$3))" ;;
    *) lcars_rgb "$1" || return 1; lcars_color_out=$lcars_rgb_out ;;
  esac
}

lcars_ink() {
  case $1 in
    '' | *[!0-9]*) lcars_color "$1" || return 1; lcars_ink_out="38;2;$lcars_color_out" ;;
    *) lcars_ink_out=$1 ;;
  esac
  lcars_ink_out="$_lcars_soh$lcars_ink_out$_lcars_stx"
}

# _lcars_sub TEXT FROM TO sets _lcars_sub_out to TEXT with every FROM replaced by TO
_lcars_sub() {
  _lcars_sub_out='' _lcars_rest=$1
  while :; do
    case $_lcars_rest in
      *"$2"*) _lcars_sub_out=$_lcars_sub_out${_lcars_rest%%"$2"*}$3 _lcars_rest=${_lcars_rest#*"$2"} ;;
      *) break ;;
    esac
  done
  _lcars_sub_out=$_lcars_sub_out$_lcars_rest
}

# The lit color times lcars_dim_percent, each channel rounded to a multiple of lcars_dim_step
_lcars_dim() {
  set -- "${1%%;*}" "${1#*;}"
  set -- "$1" "${2%%;*}" "${2#*;}"
  _lcars_dim_out=''
  for _lcars_c in "$1" "$2" "$3"; do
    _lcars_c=$(( (2 * _lcars_c * lcars_dim_percent + 100 * lcars_dim_step) / (200 * lcars_dim_step) * lcars_dim_step ))
    _lcars_dim_out=${_lcars_dim_out:+$_lcars_dim_out;}$_lcars_c
  done
}

lcars_pill() {
  lcars_pill_out=''
  lcars_color "$1" || return 1
  _lcars_bg=$lcars_color_out
  lcars_color "${4:-value}" || return 1
  _lcars_vc=$lcars_color_out
  lcars_color "${7:-label-ink}" || return 1
  _lcars_ink=$lcars_color_out
  case ${5:-on} in
    off)
      lcars_color unlit; _lcars_bg=$lcars_color_out
      lcars_color muted; _lcars_vc=$lcars_color_out
      lcars_color label-ink; _lcars_ink=$lcars_color_out ;;
    blink)
      if [ $(( ${LCARS_NOW:-$(date +%s)} / lcars_blink_seconds % 2 )) -eq 1 ]; then
        _lcars_dim "$_lcars_bg"; _lcars_bg=$_lcars_dim_out
      fi ;;
  esac

  _lcars_label=$2 _lcars_value=$3 _lcars_url=$6
  if [ "$LCARS_TARGET" = zsh ]; then
    _lcars_open="%{${_lcars_esc}[" _lcars_close="m%}" _lcars_zo='%{' _lcars_zc='%}'
    _lcars_sub "$_lcars_label" % %%; _lcars_label=$_lcars_sub_out
    _lcars_sub "$_lcars_value" % %%; _lcars_value=$_lcars_sub_out
    _lcars_sub "$_lcars_url" % %%; _lcars_url=$_lcars_sub_out
  else
    _lcars_open="${_lcars_esc}[" _lcars_close=m _lcars_zo='' _lcars_zc=''
  fi
  case $_lcars_value in
    *"$_lcars_soh"*)
      _lcars_sub "$_lcars_value" "$_lcars_soh" "$_lcars_open"
      _lcars_sub "$_lcars_sub_out" "$_lcars_stx" "$_lcars_close"
      _lcars_value=$_lcars_sub_out ;;
  esac

  _lcars_value="${_lcars_open}38;2;$_lcars_vc$_lcars_close$_lcars_value"
  if [ -n "$_lcars_url" ]; then
    _lcars_value="$_lcars_zo${_lcars_esc}]8;;$_lcars_url${_lcars_esc}\\$_lcars_zc$_lcars_value$_lcars_zo${_lcars_esc}]8;;${_lcars_esc}\\$_lcars_zc"
  fi
  lcars_pill_out="${_lcars_open}0$_lcars_close${_lcars_open}38;2;$_lcars_bg$_lcars_close$_lcars_cap_start${_lcars_open}48;2;$_lcars_bg$_lcars_close${_lcars_open}38;2;$_lcars_ink$_lcars_close$_lcars_label ${_lcars_open}0$_lcars_close $_lcars_value ${_lcars_open}38;2;$_lcars_bg$_lcars_close$_lcars_cap_end${_lcars_open}0$_lcars_close"
}

_lcars_esc=$(printf '\033') _lcars_soh=$(printf '\001') _lcars_stx=$(printf '\002')
# Nerd Font half circles U+E0B6 and U+E0B4, as UTF-8 bytes
_lcars_cap_start=$(printf '\356\202\266') _lcars_cap_end=$(printf '\356\202\264')
