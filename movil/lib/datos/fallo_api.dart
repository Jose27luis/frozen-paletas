import 'package:dio/dio.dart';

class FalloApi implements Exception {
  const FalloApi(
    this.mensaje, {
    this.sesionExpirada = false,
    this.sinConexion = false,
  });

  factory FalloApi.inesperado(Object error, String respaldo) {
    if (error is FalloApi) {
      return error;
    }

    if (error is DioException) {
      return FalloApi.desde(error, respaldo);
    }

    return FalloApi(respaldo);
  }

  factory FalloApi.desde(DioException error, String respaldo) {
    if (error.type == DioExceptionType.connectionError ||
        error.type == DioExceptionType.connectionTimeout ||
        error.type == DioExceptionType.sendTimeout ||
        error.type == DioExceptionType.receiveTimeout) {
      return const FalloApi(
        'No hay conexión con el servidor',
        sinConexion: true,
      );
    }

    final Response<Object?>? respuesta = error.response;

    if (respuesta == null) {
      return FalloApi(respaldo, sinConexion: true);
    }

    if (respuesta.statusCode == 401) {
      return const FalloApi(
        'Tu sesión terminó, vuelve a entrar',
        sesionExpirada: true,
      );
    }

    final int codigo = respuesta.statusCode ?? 500;

    return FalloApi(
      _mensajeDelCuerpo(respuesta.data) ?? respaldo,
      sinConexion: codigo >= 500,
    );
  }

  final String mensaje;
  final bool sesionExpirada;
  final bool sinConexion;

  static String? _mensajeDelCuerpo(Object? cuerpo) {
    if (cuerpo is! Map<String, Object?>) {
      return null;
    }

    final Object? mensaje = cuerpo['message'];

    if (mensaje is String) {
      return mensaje;
    }

    if (mensaje is List<Object?> && mensaje.isNotEmpty) {
      return mensaje.first.toString();
    }

    return null;
  }

  @override
  String toString() => mensaje;
}
