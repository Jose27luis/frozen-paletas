import 'cliente_api.dart';
import 'cola_pendientes.dart';
import 'fallo_api.dart';
import 'operacion.dart';
import 'peticion.dart';

class ResultadoSincronia {
  const ResultadoSincronia({
    required this.enviadas,
    required this.rechazadas,
    required this.restantes,
  });

  final int enviadas;
  final int rechazadas;
  final List<Operacion> restantes;

  bool get huboCambios => enviadas > 0 || rechazadas > 0;
}

class Sincronizador {
  const Sincronizador(this._api, this._cola);

  final ClienteApi _api;
  final ColaPendientes _cola;

  Future<ResultadoSincronia> vaciar() async {
    List<Operacion> cola = await _cola.leer();

    int enviadas = 0;
    int rechazadas = 0;

    for (final Operacion operacion in cola) {
      if (operacion.estado == EstadoOperacion.rechazada) {
        continue;
      }

      try {
        await pedir(
          () => _api.enviar(operacion.ruta, operacion.cuerpo),
          'No se pudo enviar',
        );

        cola = await _cola.quitar(operacion.id);
        enviadas += 1;
      } on FalloApi catch (fallo) {
        if (fallo.sinConexion || fallo.sesionExpirada) {
          return ResultadoSincronia(
            enviadas: enviadas,
            rechazadas: rechazadas,
            restantes: cola,
          );
        }

        cola = await _cola.reemplazar(operacion.rechazada(fallo.mensaje));
        rechazadas += 1;
      }
    }

    return ResultadoSincronia(
      enviadas: enviadas,
      rechazadas: rechazadas,
      restantes: cola,
    );
  }

  Future<List<Operacion>> reintentar(String id) async {
    final List<Operacion> cola = await _cola.leer();

    for (final Operacion operacion in cola) {
      if (operacion.id == id) {
        return _cola.reemplazar(operacion.reintentada());
      }
    }

    return cola;
  }

  Future<List<Operacion>> descartar(String id) => _cola.quitar(id);

  Future<List<Operacion>> pendientes() => _cola.leer();
}
