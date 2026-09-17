import 'package:dio/dio.dart';

import '../nucleo/entorno.dart';
import 'almacen_sesion.dart';

class ClienteApi {
  ClienteApi(this._almacen)
      : _dio = Dio(
          BaseOptions(
            baseUrl: Entorno.api,
            connectTimeout: Entorno.esperaMaxima,
            receiveTimeout: Entorno.esperaMaxima,
            headers: <String, String>{'Accept': 'application/json'},
          ),
        ) {
    _dio.interceptors.add(InterceptorsWrapper(onRequest: _adjuntarToken));
  }

  final Dio _dio;
  final AlmacenSesion _almacen;

  Future<List<Map<String, Object?>>> lista(
    String ruta, {
    Map<String, Object?>? parametros,
  }) async {
    final Response<List<Object?>> respuesta = await _dio.get<List<Object?>>(
      ruta,
      queryParameters: _limpiar(parametros),
    );

    return (respuesta.data ?? <Object?>[])
        .map((Object? fila) => fila! as Map<String, Object?>)
        .toList(growable: false);
  }

  Future<Map<String, Object?>> objeto(
    String ruta, {
    Map<String, Object?>? parametros,
  }) async {
    final Response<Map<String, Object?>> respuesta =
        await _dio.get<Map<String, Object?>>(
      ruta,
      queryParameters: _limpiar(parametros),
    );

    return respuesta.data ?? <String, Object?>{};
  }

  Future<Map<String, Object?>> enviar(
    String ruta,
    Map<String, Object?> cuerpo,
  ) async {
    final Response<Map<String, Object?>> respuesta =
        await _dio.post<Map<String, Object?>>(ruta, data: cuerpo);

    return respuesta.data ?? <String, Object?>{};
  }

  Future<Map<String, Object?>> actualizar(
    String ruta,
    Map<String, Object?> cuerpo,
  ) async {
    final Response<Map<String, Object?>> respuesta =
        await _dio.patch<Map<String, Object?>>(ruta, data: cuerpo);

    return respuesta.data ?? <String, Object?>{};
  }

  Future<List<Map<String, Object?>>> reemplazar(
    String ruta,
    Map<String, Object?> cuerpo,
  ) async {
    final Response<List<Object?>> respuesta = await _dio.put<List<Object?>>(
      ruta,
      data: cuerpo,
    );

    return (respuesta.data ?? <Object?>[])
        .map((Object? fila) => fila! as Map<String, Object?>)
        .toList(growable: false);
  }

  Future<Map<String, Object?>> borrar(String ruta) async {
    final Response<Map<String, Object?>> respuesta =
        await _dio.delete<Map<String, Object?>>(ruta);

    return respuesta.data ?? <String, Object?>{};
  }

  Map<String, Object?>? _limpiar(Map<String, Object?>? parametros) {
    if (parametros == null) {
      return null;
    }

    return <String, Object?>{
      for (final MapEntry<String, Object?> dato in parametros.entries)
        if (dato.value != null && dato.value != '') dato.key: dato.value,
    };
  }

  Future<void> _adjuntarToken(
    RequestOptions opciones,
    RequestInterceptorHandler siguiente,
  ) async {
    final String? token = await _almacen.leerToken();

    if (token != null && token.isNotEmpty) {
      opciones.headers['Authorization'] = 'Bearer $token';
    }

    siguiente.next(opciones);
  }
}
