#!/usr/bin/env bash
set -euo pipefail

# shellcheck source=infra/apk/entorno.sh
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/entorno.sh"

asegurar_imagen
exigir_token

if [ -f "$MOVIL/shorebird.yaml" ]; then
  echo "Ya existe movil/shorebird.yaml, no hay nada que iniciar." >&2
  exit 0
fi

echo "==> Dando de alta la app en Shorebird"
correr_shorebird init

cat <<'NOTA'

Listo. Quedó movil/shorebird.yaml con el app_id, que se commitea: no es secreto.
Ahora publica la primera versión con infra/apk/publicar.sh.
NOTA
