# shellcheck shell=bash
# Shared by the setup scripts. Reads KEY=value lines from a secrets file without printing them.

# Prints the value of key $2 from file $1, without surrounding whitespace or carriage returns.
value_of() {
  local file=$1 key=$2 line value
  while IFS= read -r line || [ -n "$line" ]; do
    if [[ $line == "$key="* ]]; then
      value=${line#*=}
      value=${value//$'\r'/}
      value=${value#"${value%%[![:space:]]*}"}
      value=${value%"${value##*[![:space:]]}"}
      printf '%s' "$value"
      return
    fi
  done <"$file"
}
