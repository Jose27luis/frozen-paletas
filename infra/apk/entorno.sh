#!/usr/bin/env bash

RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
MOVIL="$RAIZ/movil"
IMAGEN="frozen-flutter"

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
