import '../../dominio/modelos.dart';
import '../cliente_api.dart';
import '../peticion.dart';

class UsuariosRepo {
  const UsuariosRepo(this._api);

  final ClienteApi _api;

  Future<List<UsuarioListado>> listar() => pedir(
        () async => (await _api.lista('/usuarios'))
            .map(UsuarioListado.desdeJson)
            .toList(growable: false),
        'No se pudieron cargar los usuarios',
      );

  Future<UsuarioListado> crear(Map<String, Object?> datos) => pedir(
        () async =>
            UsuarioListado.desdeJson(await _api.enviar('/usuarios', datos)),
        'No se pudo dar de alta al usuario',
      );

  Future<UsuarioListado> actualizar(String id, Map<String, Object?> datos) =>
      pedir(
        () async => UsuarioListado.desdeJson(
          await _api.actualizar('/usuarios/$id', datos),
        ),
        'No se pudo actualizar al usuario',
      );

  Future<UsuarioListado> desactivar(String id) => pedir(
        () async =>
            UsuarioListado.desdeJson(await _api.borrar('/usuarios/$id')),
        'No se pudo dar de baja al usuario',
      );

  Future<UsuarioListado> reactivar(String id) => pedir(
        () async => UsuarioListado.desdeJson(
          await _api.enviar('/usuarios/$id/reactivar', <String, Object?>{}),
        ),
        'No se pudo reactivar al usuario',
      );

  Future<List<Permiso>> permisos() => pedir(
        () async => (await _api.lista('/permisos'))
            .map(Permiso.desdeJson)
            .toList(growable: false),
        'No se pudieron cargar los permisos',
      );

  Future<List<Permiso>> guardarPermisos(String rol, List<String> claves) =>
      pedir(
        () async => (await _api.reemplazar(
          '/permisos/$rol',
          <String, Object?>{'claves': claves},
        ))
            .map(Permiso.desdeJson)
            .toList(growable: false),
        'No se pudieron guardar los permisos',
      );
}
