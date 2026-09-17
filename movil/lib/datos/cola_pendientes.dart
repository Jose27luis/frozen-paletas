import 'dart:convert';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import 'operacion.dart';

class ColaPendientes {
  ColaPendientes() : _almacen = const FlutterSecureStorage();

  static const String _llave = 'frozen.cola';

  final FlutterSecureStorage _almacen;

  Future<List<Operacion>> leer() async {
    final String? guardado = await _almacen.read(key: _llave);

    if (guardado == null || guardado.isEmpty) {
      return const <Operacion>[];
    }

    try {
      return (jsonDecode(guardado) as List<Object?>)
          .map((Object? fila) =>
              Operacion.desdeJson(fila! as Map<String, Object?>))
          .toList(growable: false);
    } on FormatException {
      await _almacen.delete(key: _llave);

      return const <Operacion>[];
    }
  }

  Future<List<Operacion>> encolar(Operacion operacion) async {
    final List<Operacion> actuales = await leer();

    return _guardar(<Operacion>[...actuales, operacion]);
  }

  Future<List<Operacion>> reemplazar(Operacion operacion) async {
    final List<Operacion> actuales = await leer();

    return _guardar(<Operacion>[
      for (final Operacion cada in actuales)
        if (cada.id == operacion.id) operacion else cada,
    ]);
  }

  Future<List<Operacion>> quitar(String id) async {
    final List<Operacion> actuales = await leer();

    return _guardar(<Operacion>[
      for (final Operacion cada in actuales)
        if (cada.id != id) cada,
    ]);
  }

  Future<List<Operacion>> vaciar() => _guardar(const <Operacion>[]);

  Future<List<Operacion>> _guardar(List<Operacion> operaciones) async {
    await _almacen.write(
      key: _llave,
      value: jsonEncode(
        operaciones.map((Operacion cada) => cada.aJson()).toList(
              growable: false,
            ),
      ),
    );

    return operaciones;
  }
}
