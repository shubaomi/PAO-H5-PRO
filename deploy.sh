#!/usr/bin/env bash
# Run on the verified production host after uploading a tested release.
set -euo pipefail
release="${1:?Usage: bash deploy.sh RELEASE_ID}"
[[ "$release" =~ ^[0-9]{8}T[0-9]{6}Z$ ]] || exit 2
prod=/data/prod/pao
source_dir=/data/claude_project/pao
target="$prod/releases/$release"
config=/etc/nginx/conf.d/pao.conf
backup="$prod/backups/$release"
[[ -f "$target/index.html" && -d "$target/assets" ]] || exit 3
[[ ! -e "$backup" ]] || { echo 'Release already attempted; use a new release ID.'; exit 4; }
[[ ! -e "$prod/current" || -L "$prod/current" ]] || exit 5
nginx -t
mkdir -p "$backup"
previous="$(readlink "$prod/current" || true)"
printf '%s\n' "$previous" > "$backup/previous-target.txt"
if [[ -f "$config" ]]; then cp -a "$config" "$backup/pao.conf"; fi
rollback() {
  trap - ERR
  if [[ -n "$previous" ]]; then
    ln -s "$previous" "$prod/.rollback-$release"
    mv -Tf "$prod/.rollback-$release" "$prod/current"
  else
    rm -f "$prod/current"
  fi
  if [[ -f "$backup/pao.conf" ]]; then cp -a "$backup/pao.conf" "$config"; else rm -f "$config"; fi
  nginx -t && systemctl reload nginx
  echo "Deployment failed; restored previous configuration. Backup: $backup" >&2
  exit 1
}
trap rollback ERR
ln -s "$target" "$prod/.next-$release"
mv -Tf "$prod/.next-$release" "$prod/current"
install -m 0644 "$source_dir/ops/pao.conf" "$config"
nginx -t
systemctl reload nginx
# Reload returns before all workers accept the new virtual host.
ready=0
for attempt in {1..10}; do
  if curl --max-time 10 --fail --silent --show-error --resolve pao.hihongrun.com:443:127.0.0.1 https://pao.hihongrun.com/ | grep -q '<div id="app">'; then
    ready=1
    break
  fi
  sleep 1
done
[[ "$ready" == 1 ]]
curl --fail --silent --show-error --resolve pao.hihongrun.com:443:127.0.0.1 https://pao.hihongrun.com/poker/settings > /dev/null
curl --fail --silent --show-error https://timehacker.hihongrun.com/ > /dev/null
trap - ERR
printf 'DEPLOYED %s\nBACKUP %s\n' "$target" "$backup"
