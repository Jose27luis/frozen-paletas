import '../../dominio/modelos.dart';
import '../cliente_api.dart';
import '../peticion.dart';

class SaboresRepo {
  const SaboresRepo(this._api);

  final ClienteApi _api;

  Future<List<Sabor>> catalogo() => pedir(
        () async => (await _api.lista('/sabores'))
            .map(Sabor.desdeJson)
            .toList(growable: false),
        'No se pudo cargar el catálogo de sabores',
      );

  Future<List<Sabor>> activos() async => (await catalogo())
      .where((Sabor sabor) => sabor.estado == 'ACTIVO')
      .toList(growable: false);

  Future<Sabor> crear(Map<String, Object?> datos) => pedir(
        () async => Sabor.desdeJson(await _api.enviar('/sabores', datos)),
        'No se pudo registrar el sabor',
      );

  Future<Sabor> actualizar(String id, Map<String, Object?> datos) => pedir(
        () async =>
            Sabor.desdeJson(await _api.actualizar('/sabores/$id', datos)),
        'No se pudo actualizar el sabor',
      );

  Future<Sabor> desactivar(String id) => pedir(
        () async => Sabor.desdeJson(await _api.borrar('/sabores/$id')),
        'No se pudo retirar el sabor',
      );

  Future<Sabor> activar(String id) => pedir(
        () async => Sabor.desdeJson(
          await _api.enviar('/sabores/$id/activar', <String, Object?>{}),
        ),
        'No se pudo reactivar el sabor',
      );
}
