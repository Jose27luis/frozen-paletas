#!/usr/bin/env bash
set -euo pipefail

# shellcheck source=infra/apk/entorno.sh
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/entorno.sh"

asegurar_imagen
exigir_token
exigir_shorebird
exigir_firma

echo "==> Publicando la versión base en Shorebird"
correr_shorebird release android --artifact apk -- --no-tree-shake-icons

publicar_apk "build/app/outputs/apk/release/app-release.apk" "release"

cat <<'NOTA'

Esta es la última instalación manual de esta versión. Los cambios de Dart que
vengan después se mandan con infra/apk/parchar.sh y los celulares los aplican
solos al abrir la app.
NOTA
