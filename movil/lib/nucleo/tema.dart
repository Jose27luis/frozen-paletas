import 'package:flutter/material.dart';

abstract final class Paleta {
  static const Color fondo = Color(0xFFDDF1F7);
  static const Color celeste = Color(0xFFBFE6F1);
  static const Color superficie = Color(0xFFFFFFFF);
  static const Color hundido = Color(0xFFE2EDF2);
  static const Color linea = Color(0xFFBFDCE6);
  static const Color tinta = Color(0xFF14314F);
  static const Color tenue = Color(0xFF5F7894);
  static const Color helado = Color(0xFF16B6C1);
  static const Color marino = Color(0xFF1B4E82);
  static const Color hoja = Color(0xFF0F7A57);
  static const Color aguaje = Color(0xFFA45C06);
  static const Color aguajeVivo = Color(0xFFCF8B06);
  static const Color granate = Color(0xFFC81432);
}

abstract final class Tema {
  static ThemeData get claro {
    final ColorScheme esquema = ColorScheme.fromSeed(
      seedColor: Paleta.marino,
      primary: Paleta.marino,
      secondary: Paleta.helado,
      error: Paleta.granate,
      surface: Paleta.superficie,
    );

    return ThemeData(
      useMaterial3: true,
      colorScheme: esquema,
      scaffoldBackgroundColor: Paleta.fondo,
      fontFamily: 'Roboto',
      appBarTheme: const AppBarTheme(
        backgroundColor: Paleta.superficie,
        foregroundColor: Paleta.tinta,
        elevation: 0,
        scrolledUnderElevation: 1,
        centerTitle: false,
      ),
      cardTheme: CardThemeData(
        color: Paleta.superficie,
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: const BorderSide(color: Paleta.linea),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Paleta.superficie,
        labelStyle: const TextStyle(color: Paleta.tenue),
        border: _borde(Paleta.linea),
        enabledBorder: _borde(Paleta.linea),
        focusedBorder: _borde(Paleta.helado),
        errorBorder: _borde(Paleta.granate),
        focusedErrorBorder: _borde(Paleta.granate),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: Paleta.marino,
          foregroundColor: Paleta.superficie,
          minimumSize: const Size.fromHeight(48),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
      ),
      drawerTheme: const DrawerThemeData(
        backgroundColor: Paleta.superficie,
        elevation: 2,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.horizontal(right: Radius.circular(24)),
        ),
      ),
      dividerTheme: const DividerThemeData(color: Paleta.linea, space: 1),
      snackBarTheme: const SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        backgroundColor: Paleta.tinta,
        contentTextStyle: TextStyle(color: Paleta.superficie),
      ),
    );
  }

  static OutlineInputBorder _borde(Color color) => OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: color),
      );
}
