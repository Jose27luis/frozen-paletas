import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../datos/almacen_sesion.dart';
import '../datos/cliente_api.dart';
import '../datos/cola_pendientes.dart';
import '../datos/escritor.dart';
import '../datos/operacion.dart';
import '../datos/repos/destinos_repo.dart';
import '../datos/repos/inventario_repo.dart';
import '../datos/repos/lotes_repo.dart';
import '../datos/repos/mermas_repo.dart';
import '../datos/repos/panel_repo.dart';
import '../datos/repos/produccion_repo.dart';
import '../datos/repos/sabores_repo.dart';
import '../datos/repos/salidas_repo.dart';
import '../datos/repos/sesion_repo.dart';
import '../datos/repos/usuarios_repo.dart';
import '../datos/sincronizador.dart';
import '../dominio/modelos.dart';
import 'modulos.dart';

final Provider<AlmacenSesion> almacenProvider =
    Provider<AlmacenSesion>((Ref ref) => AlmacenSesion());

final Provider<ColaPendientes> colaProvider =
    Provider<ColaPendientes>((Ref ref) => ColaPendientes());

final Provider<ClienteApi> clienteProvider =
    Provider<ClienteApi>((Ref ref) => ClienteApi(ref.watch(almacenProvider)));

final Provider<Escritor> escritorProvider = Provider<Escritor>(
  (Ref ref) => Escritor(ref.watch(clienteProvider), ref.watch(colaProvider)),
);

final Provider<Sincronizador> sincronizadorProvider = Provider<Sincronizador>(
  (Ref ref) =>
      Sincronizador(ref.watch(clienteProvider), ref.watch(colaProvider)),
);

final Provider<SesionRepo> sesionRepoProvider = Provider<SesionRepo>(
  (Ref ref) => SesionRepo(
    ref.watch(clienteProvider),
    ref.watch(almacenProvider),
  ),
);

final Provider<PanelRepo> panelRepoProvider =
    Provider<PanelRepo>((Ref ref) => PanelRepo(ref.watch(clienteProvider)));

final Provider<InventarioRepo> inventarioRepoProvider =
    Provider<InventarioRepo>(
  (Ref ref) => InventarioRepo(ref.watch(clienteProvider)),
);

final Provider<ProduccionRepo> produccionRepoProvider =
    Provider<ProduccionRepo>(
  (Ref ref) => ProduccionRepo(
    ref.watch(clienteProvider),
    ref.watch(escritorProvider),
  ),
);

final Provider<SalidasRepo> salidasRepoProvider = Provider<SalidasRepo>(
  (Ref ref) => SalidasRepo(
    ref.watch(clienteProvider),
    ref.watch(escritorProvider),
  ),
);

final Provider<MermasRepo> mermasRepoProvider = Provider<MermasRepo>(
  (Ref ref) => MermasRepo(
    ref.watch(clienteProvider),
    ref.watch(escritorProvider),
  ),
);

final Provider<LotesRepo> lotesRepoProvider =
    Provider<LotesRepo>((Ref ref) => LotesRepo(ref.watch(clienteProvider)));

final Provider<SaboresRepo> saboresRepoProvider =
    Provider<SaboresRepo>((Ref ref) => SaboresRepo(ref.watch(clienteProvider)));

final Provider<DestinosRepo> destinosRepoProvider = Provider<DestinosRepo>(
  (Ref ref) => DestinosRepo(ref.watch(clienteProvider)),
);

final Provider<UsuariosRepo> usuariosRepoProvider = Provider<UsuariosRepo>(
  (Ref ref) => UsuariosRepo(ref.watch(clienteProvider)),
);

class SesionNotifier extends AsyncNotifier<Usuario?> {
  @override
  Future<Usuario?> build() => ref.watch(sesionRepoProvider).guardada();

  Future<void> entrar(
    String correo,
    String password, {
    required bool recordar,
  }) async {
    final Sesion sesion = await ref
        .read(sesionRepoProvider)
        .entrar(correo, password, recordar: recordar);

    ref.invalidate(credencialesProvider);

    state = AsyncValue<Usuario?>.data(sesion.usuario);
  }

  Future<void> salir() async {
    await ref.read(sesionRepoProvider).salir();
    ref.read(moduloProvider.notifier).abrir(Modulo.panel);
    state = const AsyncValue<Usuario?>.data(null);
  }
}

final AsyncNotifierProvider<SesionNotifier, Usuario?> sesionProvider =
    AsyncNotifierProvider<SesionNotifier, Usuario?>(SesionNotifier.new);

final FutureProvider<Credenciales?> credencialesProvider =
    FutureProvider<Credenciales?>(
  (Ref ref) => ref.watch(sesionRepoProvider).recordadas(),
);

class ModuloNotifier extends Notifier<Modulo> {
  @override
  Modulo build() => Modulo.panel;

  void abrir(Modulo modulo) => state = modulo;
}

final NotifierProvider<ModuloNotifier, Modulo> moduloProvider =
    NotifierProvider<ModuloNotifier, Modulo>(ModuloNotifier.new);

class PendientesNotifier extends AsyncNotifier<List<Operacion>> {
  @override
  Future<List<Operacion>> build() =>
      ref.watch(sincronizadorProvider).pendientes();

  Future<ResultadoSincronia> sincronizar() async {
    final ResultadoSincronia resultado =
        await ref.read(sincronizadorProvider).vaciar();

    state = AsyncValue<List<Operacion>>.data(resultado.restantes);

    if (resultado.enviadas > 0) {
      refrescarTodo(ref);
    }

    return resultado;
  }

  Future<void> releer() async {
    state = AsyncValue<List<Operacion>>.data(
      await ref.read(sincronizadorProvider).pendientes(),
    );
  }

  Future<void> reintentar(String id) async {
    state = AsyncValue<List<Operacion>>.data(
      await ref.read(sincronizadorProvider).reintentar(id),
    );

    await sincronizar();
  }

  Future<void> descartar(String id) async {
    state = AsyncValue<List<Operacion>>.data(
      await ref.read(sincronizadorProvider).descartar(id),
    );
  }
}

final AsyncNotifierProvider<PendientesNotifier, List<Operacion>>
    pendientesColaProvider =
    AsyncNotifierProvider<PendientesNotifier, List<Operacion>>(
  PendientesNotifier.new,
);

class RangoNotifier extends Notifier<int> {
  @override
  int build() => 30;

  void cambiar(int dias) => state = dias;
}

final NotifierProvider<RangoNotifier, int> rangoProvider =
    NotifierProvider<RangoNotifier, int>(RangoNotifier.new);

final FutureProvider<Panel> panelProvider = FutureProvider<Panel>(
  (Ref ref) => ref.watch(panelRepoProvider).resumen(),
);

final FutureProvider<Indicadores> indicadoresProvider =
    FutureProvider<Indicadores>(
  (Ref ref) =>
      ref.watch(panelRepoProvider).indicadores(ref.watch(rangoProvider)),
);

final FutureProvider<Inventario> inventarioProvider = FutureProvider<Inventario>(
  (Ref ref) => ref.watch(inventarioRepoProvider).actual(),
);

class FiltroMovimientosNotifier extends Notifier<FiltroMovimientos> {
  @override
  FiltroMovimientos build() => const FiltroMovimientos();

  void porSabor(String? saborId) => state = FiltroMovimientos(
        saborId: saborId,
        tipo: state.tipo,
        desde: state.desde,
        hasta: state.hasta,
      );

  void porTipo(String? tipo) => state = FiltroMovimientos(
        saborId: state.saborId,
        tipo: tipo,
        desde: state.desde,
        hasta: state.hasta,
      );

  void enRango(String? desde, String? hasta) => state = FiltroMovimientos(
        saborId: state.saborId,
        tipo: state.tipo,
        desde: desde,
        hasta: hasta,
      );
}

final NotifierProvider<FiltroMovimientosNotifier, FiltroMovimientos>
    filtroMovimientosProvider =
    NotifierProvider<FiltroMovimientosNotifier, FiltroMovimientos>(
  FiltroMovimientosNotifier.new,
);

final FutureProvider<List<Movimiento>> movimientosProvider =
    FutureProvider<List<Movimiento>>(
  (Ref ref) => ref
      .watch(inventarioRepoProvider)
      .movimientos(ref.watch(filtroMovimientosProvider)),
);

final FutureProvider<List<Sabor>> saboresProvider = FutureProvider<List<Sabor>>(
  (Ref ref) => ref.watch(saboresRepoProvider).activos(),
);

final FutureProvider<List<Sabor>> catalogoProvider = FutureProvider<List<Sabor>>(
  (Ref ref) => ref.watch(saboresRepoProvider).catalogo(),
);

final FutureProvider<List<Produccion>> pendientesProvider =
    FutureProvider<List<Produccion>>(
  (Ref ref) => ref.watch(produccionRepoProvider).pendientes(),
);

final FutureProvider<List<Produccion>> produccionesProvider =
    FutureProvider<List<Produccion>>(
  (Ref ref) => ref.watch(produccionRepoProvider).historial(),
);

final FutureProvider<List<Destino>> destinosProvider =
    FutureProvider<List<Destino>>(
  (Ref ref) => ref.watch(destinosRepoProvider).activos(),
);

class FiltroSalidasNotifier extends Notifier<FiltroSalidas> {
  @override
  FiltroSalidas build() => const FiltroSalidas();

  void porTipo(String? tipo) =>
      state = FiltroSalidas(tipo: tipo, desde: state.desde, hasta: state.hasta);

  void enRango(String? desde, String? hasta) =>
      state = FiltroSalidas(tipo: state.tipo, desde: desde, hasta: hasta);
}

final NotifierProvider<FiltroSalidasNotifier, FiltroSalidas>
    filtroSalidasProvider =
    NotifierProvider<FiltroSalidasNotifier, FiltroSalidas>(
  FiltroSalidasNotifier.new,
);

final FutureProvider<List<Salida>> salidasProvider = FutureProvider<List<Salida>>(
  (Ref ref) =>
      ref.watch(salidasRepoProvider).listar(ref.watch(filtroSalidasProvider)),
);

class FiltroMermasNotifier extends Notifier<FiltroMermas> {
  @override
  FiltroMermas build() => const FiltroMermas();

  void porOrigen(String? origen) =>
      state = FiltroMermas(origen: origen, causaId: state.causaId);

  void porCausa(String? causaId) =>
      state = FiltroMermas(origen: state.origen, causaId: causaId);
}

final NotifierProvider<FiltroMermasNotifier, FiltroMermas>
    filtroMermasProvider =
    NotifierProvider<FiltroMermasNotifier, FiltroMermas>(
  FiltroMermasNotifier.new,
);

final FutureProvider<List<Merma>> mermasProvider = FutureProvider<List<Merma>>(
  (Ref ref) =>
      ref.watch(mermasRepoProvider).listar(ref.watch(filtroMermasProvider)),
);

final FutureProvider<ResumenMermas> resumenMermasProvider =
    FutureProvider<ResumenMermas>(
  (Ref ref) => ref.watch(mermasRepoProvider).resumen(ref.watch(rangoProvider)),
);

final FutureProvider<List<CausaMerma>> causasProvider =
    FutureProvider<List<CausaMerma>>(
  (Ref ref) => ref.watch(mermasRepoProvider).causas(),
);

class FiltroLotesNotifier extends Notifier<FiltroLotes> {
  @override
  FiltroLotes build() => const FiltroLotes();

  void porSabor(String? saborId) => state = state.copiar(
        saborId: saborId,
        limpiarSabor: saborId == null,
      );

  void porEstado(String? estado) => state = state.copiar(
        estado: estado,
        limpiarEstado: estado == null,
      );

  void soloConStock(bool solo) => state = state.copiar(soloConStock: solo);
}

final NotifierProvider<FiltroLotesNotifier, FiltroLotes> filtroLotesProvider =
    NotifierProvider<FiltroLotesNotifier, FiltroLotes>(FiltroLotesNotifier.new);

final FutureProvider<List<Lote>> lotesProvider = FutureProvider<List<Lote>>(
  (Ref ref) => ref.watch(lotesRepoProvider).listar(ref.watch(filtroLotesProvider)),
);

final FutureProvider<List<UsuarioListado>> usuariosProvider =
    FutureProvider<List<UsuarioListado>>(
  (Ref ref) => ref.watch(usuariosRepoProvider).listar(),
);

final FutureProvider<List<Permiso>> permisosProvider =
    FutureProvider<List<Permiso>>(
  (Ref ref) => ref.watch(usuariosRepoProvider).permisos(),
);

final List<ProviderOrFamily> _dependenDelLibro = <ProviderOrFamily>[
  panelProvider,
  indicadoresProvider,
  inventarioProvider,
  movimientosProvider,
  pendientesProvider,
  produccionesProvider,
  salidasProvider,
  mermasProvider,
  resumenMermasProvider,
  lotesProvider,
];

void refrescarTodo(Ref ref) {
  for (final ProviderOrFamily proveedor in _dependenDelLibro) {
    ref.invalidate(proveedor);
  }
}

void refrescarDesde(WidgetRef ref) {
  for (final ProviderOrFamily proveedor in _dependenDelLibro) {
    ref.invalidate(proveedor);
  }
}
