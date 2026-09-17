import '../../dominio/modelos.dart';
import '../cliente_api.dart';
import '../peticion.dart';

class DestinosRepo {
  const DestinosRepo(this._api);

  final ClienteApi _api;

  Future<List<Destino>> activos() => pedir(
        () async => (await _api.lista(
          '/destinos',
          parametros: <String, Object?>{'activo': true},
        ))
            .map(Destino.desdeJson)
            .toList(growable: false),
        'No se pudieron cargar los destinos',
      );

  Future<Destino> crear({
    required String tipo,
    required String nombre,
    String? direccion,
    String? telefono,
  }) =>
      pedir(
        () async => Destino.desdeJson(
          await _api.enviar('/destinos', <String, Object?>{
            'tipo': tipo,
            'nombre': nombre,
            if (direccion != null && direccion.isNotEmpty)
              'direccion': direccion,
            if (telefono != null && telefono.isNotEmpty) 'telefono': telefono,
          }),
        ),
        'No se pudo crear el destino',
      );
}
