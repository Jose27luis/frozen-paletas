#!/usr/bin/env bash
set -euo pipefail

VARIANTE="${1:-debug}"

# shellcheck source=infra/apk/entorno.sh
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/entorno.sh"

asegurar_imagen

if [ "$VARIANTE" = "release" ]; then
  ORIGEN="build/app/outputs/flutter-apk/app-release.apk"
  BANDERA="--release"
else
  ORIGEN="build/app/outputs/flutter-apk/app-debug.apk"
  BANDERA="--debug"
fi

echo "==> Compilando el APK ($VARIANTE)"
en_docker "flutter pub get && flutter build apk $BANDERA"

publicar_apk "$ORIGEN" "$VARIANTE"
