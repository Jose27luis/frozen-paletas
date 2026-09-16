import 'package:dio/dio.dart';

class FalloApi implements Exception {
  const FalloApi(this.mensaje, {this.sesionExpirada = false});

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
        error.type == DioExceptionType.receiveTimeout) {
      return const FalloApi('No hay conexión con el servidor');
    }

    final Response<Object?>? respuesta = error.response;

    if (respuesta == null) {
      return FalloApi(respaldo);
    }

    if (respuesta.statusCode == 401) {
      return const FalloApi(
        'Tu sesión terminó, vuelve a entrar',
        sesionExpirada: true,
      );
    }

    return FalloApi(_mensajeDelCuerpo(respuesta.data) ?? respaldo);
  }

  final String mensaje;
  final bool sesionExpirada;

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
