import '../../dominio/modelos.dart';
import '../../nucleo/formato.dart';
import '../cliente_api.dart';
import '../escritor.dart';
import '../peticion.dart';

class FiltroMermas {
  const FiltroMermas({this.origen, this.causaId, this.saborId});

  final String? origen;
  final String? causaId;
  final String? saborId;
}

class MermasRepo {
  const MermasRepo(this._api, this._escritor);

  final ClienteApi _api;
  final Escritor _escritor;

  Future<List<Merma>> listar(FiltroMermas filtro) => pedir(
        () async => (await _api.lista(
          '/mermas',
          parametros: <String, Object?>{
            'origen': ?filtro.origen,
            'causaId': ?filtro.causaId,
            'saborId': ?filtro.saborId,
            'limite': 60,
          },
        ))
            .map(Merma.desdeJson)
            .toList(growable: false),
        'No se pudieron cargar las mermas',
      );

  Future<ResumenMermas> resumen(int dias) => pedir(
        () async => ResumenMermas.desdeJson(
          await _api.objeto(
            '/mermas/resumen',
            parametros: <String, Object?>{'desde': haceDias(dias)},
          ),
        ),
        'No se pudo cargar el resumen de mermas',
      );

  Future<List<CausaMerma>> causas() => pedir(
        () async => (await _api.lista('/mermas/causas'))
            .map(CausaMerma.desdeJson)
            .toList(growable: false),
        'No se pudieron cargar las causas',
      );

  Future<CausaMerma> crearCausa(String nombre, bool requiereDescripcion) =>
      pedir(
        () async => CausaMerma.desdeJson(
          await _api.enviar('/mermas/causas', <String, Object?>{
            'nombre': nombre,
            'requiereDescripcion': requiereDescripcion,
          }),
        ),
        'No se pudo crear la causa',
      );

  Future<void> eliminarCausa(String id) => pedir(
        () => _api.borrar('/mermas/causas/$id'),
        'No se pudo eliminar la causa',
      );

  Future<CausaMerma> desactivarCausa(String id) => pedir(
        () async => CausaMerma.desdeJson(
          await _api.enviar(
            '/mermas/causas/$id/desactivar',
            <String, Object?>{},
          ),
        ),
        'No se pudo desactivar la causa',
      );

  Future<CausaMerma> activarCausa(String id) => pedir(
        () async => CausaMerma.desdeJson(
          await _api.enviar('/mermas/causas/$id/activar', <String, Object?>{}),
        ),
        'No se pudo activar la causa',
      );

  Future<Anotado<Merma>> registrar({
    required String saborId,
    required String sabor,
    required int cantidad,
    required String causaId,
    required String causa,
    required String fecha,
    required String clave,
    String? loteId,
    String? observacion,
  }) =>
      _escritor.anotar<Merma>(
        ruta: '/mermas',
        cuerpo: <String, Object?>{
          'saborId': saborId,
          'cantidad': cantidad,
          'causaId': causaId,
          'fecha': fecha,
          'claveIdempotencia': clave,
          'loteId': ?loteId,
          if (observacion != null && observacion.isNotEmpty)
            'observacion': observacion,
        },
        etiqueta: 'Merma de $sabor: $cantidad paletas por $causa',
        respaldo: 'No se pudo registrar la merma',
        mapear: Merma.desdeJson,
      );
}
