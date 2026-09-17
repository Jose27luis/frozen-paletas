import '../../dominio/modelos.dart';
import '../cliente_api.dart';
import '../escritor.dart';
import '../peticion.dart';

class ProduccionRepo {
  const ProduccionRepo(this._api, this._escritor);

  final ClienteApi _api;
  final Escritor _escritor;

  Future<List<Produccion>> pendientes() => pedir(
        () async => (await _api.lista('/produccion/pendientes'))
            .map(Produccion.desdeJson)
            .toList(growable: false),
        'No se pudieron cargar las producciones pendientes',
      );

  Future<List<Produccion>> historial({String? saborId, String? estado}) =>
      pedir(
        () async => (await _api.lista(
          '/produccion',
          parametros: <String, Object?>{
            'saborId': ?saborId,
            'estado': ?estado,
            'limite': 60,
          },
        ))
            .map(Produccion.desdeJson)
            .toList(growable: false),
        'No se pudo cargar el historial de producción',
      );

  Future<Anotado<Produccion>> registrar({
    required String saborId,
    required String sabor,
    required int cantidadObtenida,
    required String fecha,
    required String clave,
  }) =>
      _escritor.anotar<Produccion>(
        ruta: '/produccion',
        cuerpo: <String, Object?>{
          'saborId': saborId,
          'cantidadObtenida': cantidadObtenida,
          'fecha': fecha,
          'claveIdempotencia': clave,
        },
        etiqueta: 'Producción de $sabor: $cantidadObtenida paletas',
        respaldo: 'No se pudo registrar la producción',
        mapear: Produccion.desdeJson,
      );

  Future<Anotado<Produccion>> embolsar({
    required String id,
    required String sabor,
    required int cantidadEmbolsada,
    String? causaId,
    String? observacion,
  }) =>
      _escritor.anotar<Produccion>(
        ruta: '/produccion/$id/embolsado',
        cuerpo: <String, Object?>{
          'cantidadEmbolsada': cantidadEmbolsada,
          'causaId': ?causaId,
          if (observacion != null && observacion.isNotEmpty)
            'observacion': observacion,
        },
        etiqueta: 'Embolsado de $sabor: $cantidadEmbolsada paletas',
        respaldo: 'No se pudo registrar el embolsado',
        mapear: Produccion.desdeJson,
      );

  Future<Produccion> anular(String id, String motivo) => pedir(
        () async => Produccion.desdeJson(
          await _api.enviar(
            '/produccion/$id/anular',
            <String, Object?>{'motivo': motivo},
          ),
        ),
        'No se pudo anular la producción',
      );
}
