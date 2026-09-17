import '../../dominio/modelos.dart';
import '../../nucleo/formato.dart';
import '../cliente_api.dart';
import '../peticion.dart';

class PanelRepo {
  const PanelRepo(this._api);

  final ClienteApi _api;

  Future<Panel> resumen() => pedir(
        () async => Panel.desdeJson(await _api.objeto('/panel')),
        'No se pudo cargar el panel',
      );

  Future<Indicadores> indicadores(int dias) => pedir(
        () async => Indicadores.desdeJson(
          await _api.objeto(
            '/panel/indicadores',
            parametros: <String, Object?>{'desde': haceDias(dias)},
          ),
        ),
        'No se pudieron calcular los indicadores',
      );
}
