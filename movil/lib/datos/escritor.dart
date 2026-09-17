import 'package:uuid/uuid.dart';

import 'cliente_api.dart';
import 'cola_pendientes.dart';
import 'fallo_api.dart';
import 'operacion.dart';
import 'peticion.dart';

class Anotado<T> {
  const Anotado.enviado(T este)
      : valor = este,
        encolado = false;

  const Anotado.encolado()
      : valor = null,
        encolado = true;

  final T? valor;
  final bool encolado;
}

class Escritor {
  const Escritor(this._api, this._cola);

  static const Uuid _uuid = Uuid();

  final ClienteApi _api;
  final ColaPendientes _cola;

  Future<Anotado<T>> anotar<T>({
    required String ruta,
    required Map<String, Object?> cuerpo,
    required String etiqueta,
    required String respaldo,
    required T Function(Map<String, Object?>) mapear,
  }) async {
    try {
      return Anotado<T>.enviado(
        mapear(await pedir(() => _api.enviar(ruta, cuerpo), respaldo)),
      );
    } on FalloApi catch (fallo) {
      if (!fallo.sinConexion) {
        rethrow;
      }

      await _cola.encolar(
        Operacion(
          id: _uuid.v4(),
          ruta: ruta,
          cuerpo: cuerpo,
          etiqueta: etiqueta,
          creadaEn: DateTime.now().toIso8601String(),
        ),
      );

      return Anotado<T>.encolado();
    }
  }
}
