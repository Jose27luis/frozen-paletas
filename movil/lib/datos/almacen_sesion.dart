import 'dart:convert';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../dominio/modelos.dart';

class AlmacenSesion {
  AlmacenSesion() : _almacen = const FlutterSecureStorage();

  static const String _llaveToken = 'frozen.token';
  static const String _llaveUsuario = 'frozen.usuario';

  final FlutterSecureStorage _almacen;

  Future<String?> leerToken() => _almacen.read(key: _llaveToken);

  Future<Usuario?> leerUsuario() async {
    final String? guardado = await _almacen.read(key: _llaveUsuario);

    if (guardado == null) {
      return null;
    }

    try {
      return Usuario.desdeJson(
        jsonDecode(guardado) as Map<String, Object?>,
      );
    } on FormatException {
      return null;
    }
  }

  Future<void> guardar(Sesion sesion) async {
    await _almacen.write(key: _llaveToken, value: sesion.token);
    await _almacen.write(
      key: _llaveUsuario,
      value: jsonEncode(<String, Object?>{
        'id': sesion.usuario.id,
        'nombres': sesion.usuario.nombres,
        'apellidos': sesion.usuario.apellidos,
        'correo': sesion.usuario.correo,
        'rol': sesion.usuario.rol,
        'permisos': sesion.usuario.permisos,
      }),
    );
  }

  Future<void> limpiar() async {
    await _almacen.delete(key: _llaveToken);
    await _almacen.delete(key: _llaveUsuario);
  }
}
