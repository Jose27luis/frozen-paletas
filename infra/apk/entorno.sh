#!/usr/bin/env bash

RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
MOVIL="$RAIZ/movil"
IMAGEN="frozen-flutter"
LLAVE="$MOVIL/secretos/shorebird.token"

asegurar_imagen() {
  if ! docker image inspect "$IMAGEN" > /dev/null 2>&1; then
    echo "==> Construyendo la imagen $IMAGEN (solo la primera vez, tarda)"
    docker build -t "$IMAGEN" "$RAIZ/infra/apk"
  fi
}

en_docker() {
  docker run --rm \
    -v "$MOVIL:/proyecto" \
    -w /proyecto \
    -e PUB_CACHE=/proyecto/.pub-docker \
    "$IMAGEN" \
    bash -lc "$1"
}

leer_token() {
  if [ -n "${SHOREBIRD_TOKEN:-}" ]; then
    return 0
  fi

  if [ -f "$LLAVE" ]; then
    SHOREBIRD_TOKEN="$(sed 's/^.*=//' "$LLAVE" | tr -d '[:space:]')"
    export SHOREBIRD_TOKEN

    return 0
  fi

  return 1
}

exigir_token() {
  if leer_token; then
    return 0
  fi

  cat >&2 <<'AVISO'
Falta la llave de Shorebird.

Créala en https://console.shorebird.dev -> Account -> API Keys y guárdala en
movil/secretos/shorebird.token, o expórtala como SHOREBIRD_TOKEN antes de correr
esto.
AVISO

  exit 1
}

correr_shorebird() {
  docker run --rm \
    -e SHOREBIRD_TOKEN \
    -e CI=true \
    -e PUB_CACHE=/proyecto/.pub-docker \
    -v "$MOVIL:/proyecto" \
    -w /proyecto \
    "$IMAGEN" \
    shorebird "$@"
}

exigir_shorebird() {
  if [ ! -f "$MOVIL/shorebird.yaml" ]; then
    echo "Falta movil/shorebird.yaml. Corre primero: infra/apk/iniciar-shorebird.sh" >&2
    exit 1
  fi
}

exigir_firma() {
  if [ ! -f "$MOVIL/secretos/firma.properties" ]; then
    echo "Falta movil/secretos/firma.properties. Genera el keystore antes de firmar." >&2
    exit 1
  fi
}

publicar_apk() {
  local origen="$1"
  local variante="$2"
  local version

  version="$(grep -m1 '^version:' "$MOVIL/pubspec.yaml" | sed 's/version: *//; s/+.*//')"

  mkdir -p "$RAIZ/apk"
  cp "$MOVIL/$origen" "$RAIZ/apk/frozen-$version-$variante.apk"
  cp "$MOVIL/$origen" "$RAIZ/apk/frozen.apk"

  echo "==> APK en apk/frozen-$version-$variante.apk"
}
