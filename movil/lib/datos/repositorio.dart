import 'package:dio/dio.dart';

import '../dominio/modelos.dart';
import 'almacen_sesion.dart';
import 'cliente_api.dart';
import 'fallo_api.dart';

class Repositorio {
  Repositorio(this._api, this._almacen);

  final ClienteApi _api;
  final AlmacenSesion _almacen;

  Future<Sesion> entrar(
    String correo,
    String password, {
    required bool recordar,
  }) async {
    try {
      final Map<String, Object?> datos = await _api.enviar(
        '/auth/login',
        <String, Object?>{'correo': correo, 'password': password},
      );

      final Sesion sesion = Sesion.desdeJson(datos);

      await _almacen.guardar(sesion);

      if (recordar) {
        await _almacen.recordar(correo, password);
      } else {
        await _almacen.olvidar();
      }

      return sesion;
    } on DioException catch (error) {
      throw FalloApi.desde(error, 'No se pudo iniciar sesión');
    }
  }

  Future<Usuario?> sesionGuardada() => _almacen.leerUsuario();

  Future<Credenciales?> credencialesRecordadas() => _almacen.leerRecordadas();

  Future<void> salir() => _almacen.limpiar();

  Future<Panel> panel() => _pedir(
        () async => Panel.desdeJson(await _api.objeto('/panel')),
        'No se pudo cargar el panel',
      );

  Future<Inventario> inventario() => _pedir(
        () async => Inventario.desdeJson(await _api.objeto('/inventario')),
        'No se pudo cargar el inventario',
      );

  Future<List<Sabor>> sabores() => _pedir(
        () async => (await _api.lista('/sabores'))
            .map(Sabor.desdeJson)
            .where((Sabor sabor) => sabor.estado != 'INACTIVO')
            .toList(growable: false),
        'No se pudieron cargar los sabores',
      );

  Future<List<Produccion>> pendientesDeEmbolsar() => _pedir(
        () async => (await _api.lista('/produccion/pendientes'))
            .map(Produccion.desdeJson)
            .toList(growable: false),
        'No se pudieron cargar las producciones pendientes',
      );

  Future<List<Produccion>> producciones() => _pedir(
        () async => (await _api.lista(
          '/produccion',
          parametros: <String, Object?>{'limite': 30},
        ))
            .map(Produccion.desdeJson)
            .toList(growable: false),
        'No se pudo cargar el historial de producción',
      );

  Future<Produccion> registrarProduccion({
    required String saborId,
    required int cantidadObtenida,
    required String fecha,
    required String clave,
  }) =>
      _pedir(
        () async => Produccion.desdeJson(
          await _api.enviar('/produccion', <String, Object?>{
            'saborId': saborId,
            'cantidadObtenida': cantidadObtenida,
            'fecha': fecha,
            'claveIdempotencia': clave,
          }),
        ),
        'No se pudo registrar la producción',
      );

  Future<Produccion> registrarEmbolsado({
    required String id,
    required int cantidadEmbolsada,
    String? causaId,
    String? observacion,
  }) =>
      _pedir(
        () async => Produccion.desdeJson(
          await _api.enviar('/produccion/$id/embolsado', <String, Object?>{
            'cantidadEmbolsada': cantidadEmbolsada,
            'causaId': ?causaId,
            if (observacion != null && observacion.isNotEmpty)
              'observacion': observacion,
          }),
        ),
        'No se pudo registrar el embolsado',
      );

  Future<List<Destino>> destinos() => _pedir(
        () async => (await _api.lista(
          '/destinos',
          parametros: <String, Object?>{'activo': true},
        ))
            .map(Destino.desdeJson)
            .toList(growable: false),
        'No se pudieron cargar los destinos',
      );

  Future<List<Salida>> salidas() => _pedir(
        () async => (await _api.lista(
          '/salidas',
          parametros: <String, Object?>{'limite': 30},
        ))
            .map(Salida.desdeJson)
            .toList(growable: false),
        'No se pudieron cargar las salidas',
      );

  Future<Salida> registrarSalida({
    required String tipo,
    required String listaPrecios,
    required String saborId,
    required int cantidad,
    required String fecha,
    required String clave,
    String? destinoId,
    String? motivo,
    double? precio,
  }) =>
      _pedir(
        () async => Salida.desdeJson(
          await _api.enviar('/salidas', <String, Object?>{
            'tipo': tipo,
            'listaPrecios': listaPrecios,
            'fecha': fecha,
            'claveIdempotencia': clave,
            'destinoId': ?destinoId,
            if (motivo != null && motivo.isNotEmpty) 'motivo': motivo,
            'detalles': <Map<String, Object?>>[
              <String, Object?>{
                'saborId': saborId,
                'cantidad': cantidad,
                'precioUnitario': ?precio,
              },
            ],
          }),
        ),
        'No se pudo registrar la salida',
      );

  Future<List<CausaMerma>> causas() => _pedir(
        () async => (await _api.lista('/mermas/causas'))
            .map(CausaMerma.desdeJson)
            .where((CausaMerma causa) => causa.activa)
            .toList(growable: false),
        'No se pudieron cargar las causas',
      );

  Future<List<Merma>> mermas() => _pedir(
        () async => (await _api.lista(
          '/mermas',
          parametros: <String, Object?>{'limite': 30},
        ))
            .map(Merma.desdeJson)
            .toList(growable: false),
        'No se pudieron cargar las mermas',
      );

  Future<Merma> registrarMerma({
    required String saborId,
    required int cantidad,
    required String causaId,
    required String fecha,
    required String clave,
    String? observacion,
  }) =>
      _pedir(
        () async => Merma.desdeJson(
          await _api.enviar('/mermas', <String, Object?>{
            'saborId': saborId,
            'cantidad': cantidad,
            'causaId': causaId,
            'fecha': fecha,
            'claveIdempotencia': clave,
            if (observacion != null && observacion.isNotEmpty)
              'observacion': observacion,
          }),
        ),
        'No se pudo registrar la merma',
      );

  Future<Lote> lotePorCodigo(String codigo) => _pedir(
        () async => Lote.desdeJson(await _api.objeto('/lotes/codigo/$codigo')),
        'No hay ningún lote con ese código',
      );

  Future<List<Lote>> lotesConStock(String saborId) => _pedir(
        () async => (await _api.lista(
          '/lotes',
          parametros: <String, Object?>{
            'saborId': saborId,
            'conStock': true,
            'limite': 50,
          },
        ))
            .map(Lote.desdeJson)
            .toList(growable: false),
        'No se pudieron cargar los lotes',
      );

  Future<T> _pedir<T>(Future<T> Function() accion, String respaldo) async {
    try {
      return await accion();
    } on DioException catch (error) {
      throw FalloApi.desde(error, respaldo);
    } on Object catch (error) {
      throw FalloApi.inesperado(error, respaldo);
    }
  }
}
