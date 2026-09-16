#!/usr/bin/env bash
set -euo pipefail

# shellcheck source=infra/apk/entorno.sh
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/entorno.sh"

asegurar_imagen
exigir_token
exigir_shorebird

EXTRAS=()
VERSION=""

for ARGUMENTO in "$@"; do
  if [ "$ARGUMENTO" = "--recursos-iguales" ]; then
    EXTRAS+=(--allow-asset-diffs)
  else
    VERSION="$ARGUMENTO"
  fi
done

if [ -z "$VERSION" ]; then
  VERSION="$(grep -m1 '^version:' "$MOVIL/pubspec.yaml" | sed 's/version: *//')"
fi

echo "==> Mandando el parche sobre $VERSION"
correr_shorebird patch android --release-version "$VERSION" "${EXTRAS[@]}"

cat <<'NOTA'

Listo. Los celulares bajan el parche al abrir la app y lo aplican al reiniciarla.
No hay que descargar ni instalar nada.
NOTA
