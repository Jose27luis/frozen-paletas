import '../../dominio/modelos.dart';
import '../cliente_api.dart';
import '../peticion.dart';

class FiltroLotes {
  const FiltroLotes({this.saborId, this.estado, this.soloConStock = true});

  final String? saborId;
  final String? estado;
  final bool soloConStock;

  FiltroLotes copiar({
    String? saborId,
    String? estado,
    bool? soloConStock,
    bool limpiarSabor = false,
    bool limpiarEstado = false,
  }) =>
      FiltroLotes(
        saborId: limpiarSabor ? null : saborId ?? this.saborId,
        estado: limpiarEstado ? null : estado ?? this.estado,
        soloConStock: soloConStock ?? this.soloConStock,
      );
}

class LotesRepo {
  const LotesRepo(this._api);

  final ClienteApi _api;

  Future<List<Lote>> listar(FiltroLotes filtro) => pedir(
        () async => (await _api.lista(
          '/lotes',
          parametros: <String, Object?>{
            'saborId': ?filtro.saborId,
            'estado': ?filtro.estado,
            if (filtro.soloConStock) 'conStock': true,
            'limite': 120,
          },
        ))
            .map(Lote.desdeJson)
            .toList(growable: false),
        'No se pudieron cargar los lotes',
      );

  Future<List<Lote>> conStock(String saborId) => listar(
        FiltroLotes(saborId: saborId),
      );

  Future<Lote> porCodigo(String codigo) => pedir(
        () async => Lote.desdeJson(await _api.objeto('/lotes/codigo/$codigo')),
        'No hay ningún lote con ese código',
      );

  Future<List<Movimiento>> movimientos(String loteId) => pedir(
        () async => (await _api.lista(
          '/inventario/movimientos',
          parametros: <String, Object?>{'loteId': loteId, 'limite': 60},
        ))
            .map(Movimiento.desdeJson)
            .toList(growable: false),
        'No se pudieron cargar los movimientos del lote',
      );
}
