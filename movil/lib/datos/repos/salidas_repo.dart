import '../../dominio/modelos.dart';
import '../cliente_api.dart';
import '../escritor.dart';
import '../peticion.dart';

class LineaSalida {
  const LineaSalida({
    required this.saborId,
    required this.sabor,
    required this.cantidad,
    this.loteId,
    this.precioUnitario,
  });

  final String saborId;
  final String sabor;
  final int cantidad;
  final String? loteId;
  final double? precioUnitario;

  Map<String, Object?> aJson() => <String, Object?>{
        'saborId': saborId,
        'cantidad': cantidad,
        'loteId': ?loteId,
        'precioUnitario': ?precioUnitario,
      };
}

class FiltroSalidas {
  const FiltroSalidas({this.tipo, this.desde, this.hasta});

  final String? tipo;
  final String? desde;
  final String? hasta;
}

class SalidasRepo {
  const SalidasRepo(this._api, this._escritor);

  final ClienteApi _api;
  final Escritor _escritor;

  Future<List<Salida>> listar(FiltroSalidas filtro) => pedir(
        () async => (await _api.lista(
          '/salidas',
          parametros: <String, Object?>{
            'tipo': ?filtro.tipo,
            'desde': ?filtro.desde,
            'hasta': ?filtro.hasta,
            'limite': 60,
          },
        ))
            .map(Salida.desdeJson)
            .toList(growable: false),
        'No se pudieron cargar las salidas',
      );

  Future<Salida> detalle(String id) => pedir(
        () async => Salida.desdeJson(await _api.objeto('/salidas/$id')),
        'No se pudo cargar el pedido',
      );

  Future<Anotado<Salida>> registrar({
    required String tipo,
    required String listaPrecios,
    required List<LineaSalida> lineas,
    required String fecha,
    required String clave,
    String? destinoId,
    String? destino,
    String? motivo,
  }) {
    final int paletas = lineas.fold(
      0,
      (int suma, LineaSalida linea) => suma + linea.cantidad,
    );

    return _escritor.anotar<Salida>(
      ruta: '/salidas',
      cuerpo: <String, Object?>{
        'tipo': tipo,
        'listaPrecios': listaPrecios,
        'fecha': fecha,
        'claveIdempotencia': clave,
        'destinoId': ?destinoId,
        if (motivo != null && motivo.isNotEmpty) 'motivo': motivo,
        'detalles': lineas
            .map((LineaSalida linea) => linea.aJson())
            .toList(growable: false),
      },
      etiqueta:
          'Salida a ${destino ?? 'sin destino'}: $paletas paletas en ${lineas.length} sabores',
      respaldo: 'No se pudo registrar la salida',
      mapear: Salida.desdeJson,
    );
  }
}
