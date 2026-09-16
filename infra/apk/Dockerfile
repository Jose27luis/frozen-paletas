FROM eclipse-temurin:21-jdk-noble

ARG HERRAMIENTAS=13114758
ARG PLATAFORMA=36
ARG CONSTRUCCION=36.0.0
ARG FLUTTER=3.47.1

ENV ANDROID_HOME=/opt/android-sdk
ENV ANDROID_SDK_ROOT=/opt/android-sdk
ENV FLUTTER_HOME=/opt/flutter
ENV FLUTTER_ROOT=/opt/flutter
ENV SHOREBIRD_HOME=/opt/shorebird
ENV PATH=/opt/shorebird/bin:/opt/flutter/bin:/opt/flutter/bin/cache/dart-sdk/bin:/opt/android-sdk/cmdline-tools/latest/bin:/opt/android-sdk/platform-tools:$PATH
ENV GRADLE_USER_HOME=/proyecto/.gradle-docker
ENV PUB_CACHE=/proyecto/.pub-docker

RUN apt-get update \
  && apt-get install -y --no-install-recommends unzip curl git xz-utils ca-certificates \
  && rm -rf /var/lib/apt/lists/*

RUN mkdir -p "$ANDROID_HOME/cmdline-tools" \
  && curl -fsSL "https://dl.google.com/android/repository/commandlinetools-linux-${HERRAMIENTAS}_latest.zip" -o /tmp/herramientas.zip \
  && unzip -q /tmp/herramientas.zip -d "$ANDROID_HOME/cmdline-tools" \
  && mv "$ANDROID_HOME/cmdline-tools/cmdline-tools" "$ANDROID_HOME/cmdline-tools/latest" \
  && rm /tmp/herramientas.zip

RUN yes | sdkmanager --licenses > /dev/null \
  && sdkmanager --install \
    "platform-tools" \
    "platforms;android-${PLATAFORMA}" \
    "build-tools;${CONSTRUCCION}" > /dev/null

RUN curl -fsSL "https://storage.googleapis.com/flutter_infra_release/releases/stable/linux/flutter_linux_${FLUTTER}-stable.tar.xz" -o /tmp/flutter.tar.xz \
  && tar -xJf /tmp/flutter.tar.xz -C /opt \
  && rm /tmp/flutter.tar.xz \
  && git config --global --add safe.directory /opt/flutter \
  && flutter config --no-analytics --android-sdk "$ANDROID_HOME" \
  && flutter precache --android \
  && flutter doctor

RUN git clone --depth 1 https://github.com/shorebirdtech/shorebird.git "$SHOREBIRD_HOME" \
  && git config --global --add safe.directory "$SHOREBIRD_HOME" \
  && shorebird --version

WORKDIR /proyecto

CMD ["flutter", "build", "apk", "--debug"]
