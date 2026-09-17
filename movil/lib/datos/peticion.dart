import 'package:dio/dio.dart';

import 'fallo_api.dart';

Future<T> pedir<T>(Future<T> Function() accion, String respaldo) async {
  try {
    return await accion();
  } on DioException catch (error) {
    throw FalloApi.desde(error, respaldo);
  } on Object catch (error) {
    throw FalloApi.inesperado(error, respaldo);
  }
}
