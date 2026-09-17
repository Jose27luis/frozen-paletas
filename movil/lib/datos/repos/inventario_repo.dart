import '../../dominio/modelos.dart';
import '../cliente_api.dart';
import '../peticion.dart';

class FiltroMovimientos {
  const FiltroMovimientos({this.saborId, this.tipo, this.desde, this.hasta});

  final String? saborId;
  final String? tipo;
  final String? desde;
  final String? hasta;
}

class InventarioRepo {
  const InventarioRepo(this._api);

  final ClienteApi _api;

  Future<Inventario> actual() => pedir(
        () async => Inventario.desdeJson(await _api.objeto('/inventario')),
        'No se pudo cargar el inventario',
      );

  Future<List<Movimiento>> movimientos(FiltroMovimientos filtro) => pedir(
        () async => (await _api.lista(
          '/inventario/movimientos',
          parametros: <String, Object?>{
            'saborId': ?filtro.saborId,
            'tipo': ?filtro.tipo,
            'desde': ?filtro.desde,
            'hasta': ?filtro.hasta,
            'limite': 120,
          },
        ))
            .map(Movimiento.desdeJson)
            .toList(growable: false),
        'No se pudieron cargar los movimientos',
      );
}
