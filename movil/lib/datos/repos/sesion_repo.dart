import '../almacen_sesion.dart';
import '../cliente_api.dart';
import '../../dominio/modelos.dart';
import '../peticion.dart';

class SesionRepo {
  const SesionRepo(this._api, this._almacen);

  final ClienteApi _api;
  final AlmacenSesion _almacen;

  Future<Sesion> entrar(
    String correo,
    String password, {
    required bool recordar,
  }) =>
      pedir(() async {
        final Sesion sesion = Sesion.desdeJson(
          await _api.enviar(
            '/auth/login',
            <String, Object?>{'correo': correo, 'password': password},
          ),
        );

        await _almacen.guardar(sesion);

        if (recordar) {
          await _almacen.recordar(correo, password);
        } else {
          await _almacen.olvidar();
        }

        return sesion;
      }, 'No se pudo iniciar sesión');

  Future<Usuario?> guardada() => _almacen.leerUsuario();

  Future<Credenciales?> recordadas() => _almacen.leerRecordadas();

  Future<void> salir() => _almacen.limpiar();
}
