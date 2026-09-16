import java.util.Properties

plugins {
    id("com.android.application")
    id("dev.flutter.flutter-gradle-plugin")
}

val firma = Properties()
val archivoFirma = rootProject.file("../secretos/firma.properties")

if (archivoFirma.exists()) {
    archivoFirma.inputStream().use(firma::load)
}

android {
    namespace = "pe.grupovalderrama.frozen"
    compileSdk = flutter.compileSdkVersion
    ndkVersion = flutter.ndkVersion

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    defaultConfig {
        applicationId = "pe.grupovalderrama.frozen"
        minSdk = flutter.minSdkVersion
        targetSdk = flutter.targetSdkVersion
        versionCode = flutter.versionCode
        versionName = flutter.versionName
    }

    signingConfigs {
        create("frozen") {
            if (archivoFirma.exists()) {
                storeFile = rootProject.file("../secretos/${firma["storeFile"]}")
                storePassword = firma["storePassword"] as String
                keyAlias = firma["keyAlias"] as String
                keyPassword = firma["keyPassword"] as String
            }
        }
    }

    buildTypes {
        release {
            signingConfig = if (archivoFirma.exists()) {
                signingConfigs.getByName("frozen")
            } else {
                signingConfigs.getByName("debug")
            }
        }
    }
}

kotlin {
    compilerOptions {
        jvmTarget = org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17
    }
}

flutter {
    source = "../.."
}
