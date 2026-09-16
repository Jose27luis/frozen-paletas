#!/usr/bin/env bash
set -euo pipefail

# shellcheck source=infra/apk/entorno.sh
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/entorno.sh"

asegurar_imagen

echo "==> Analizando la app"
en_docker "flutter pub get && flutter analyze"
