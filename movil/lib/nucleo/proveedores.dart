import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../datos/almacen_sesion.dart';
import '../datos/cliente_api.dart';
import '../datos/repositorio.dart';
import '../dominio/modelos.dart';
import 'modulos.dart';

final Provider<AlmacenSesion> almacenProvider =
    Provider<AlmacenSesion>((Ref ref) => AlmacenSesion());

final Provider<ClienteApi> clienteProvider =
    Provider<ClienteApi>((Ref ref) => ClienteApi(ref.watch(almacenProvider)));

final Provider<Repositorio> repositorioProvider = Provider<Repositorio>(
  (Ref ref) => Repositorio(
    ref.watch(clienteProvider),
    ref.watch(almacenProvider),
  ),
);

class SesionNotifier extends AsyncNotifier<Usuario?> {
  @override
  Future<Usuario?> build() => ref.watch(repositorioProvider).sesionGuardada();

  Future<void> entrar(
    String correo,
    String password, {
    required bool recordar,
  }) async {
    final Sesion sesion = await ref
        .read(repositorioProvider)
        .entrar(correo, password, recordar: recordar);

    ref.invalidate(credencialesProvider);

    state = AsyncValue<Usuario?>.data(sesion.usuario);
  }

  Future<void> salir() async {
    await ref.read(repositorioProvider).salir();
    ref.read(moduloProvider.notifier).abrir(Modulo.panel);
    state = const AsyncValue<Usuario?>.data(null);
  }
}

final AsyncNotifierProvider<SesionNotifier, Usuario?> sesionProvider =
    AsyncNotifierProvider<SesionNotifier, Usuario?>(SesionNotifier.new);

final FutureProvider<Credenciales?> credencialesProvider =
    FutureProvider<Credenciales?>(
  (Ref ref) => ref.watch(repositorioProvider).credencialesRecordadas(),
);

class ModuloNotifier extends Notifier<Modulo> {
  @override
  Modulo build() => Modulo.panel;

  void abrir(Modulo modulo) => state = modulo;
}

final NotifierProvider<ModuloNotifier, Modulo> moduloProvider =
    NotifierProvider<ModuloNotifier, Modulo>(ModuloNotifier.new);

final FutureProvider<Panel> panelProvider =
    FutureProvider<Panel>((Ref ref) => ref.watch(repositorioProvider).panel());

final FutureProvider<Inventario> inventarioProvider = FutureProvider<Inventario>(
  (Ref ref) => ref.watch(repositorioProvider).inventario(),
);

final FutureProvider<List<Sabor>> saboresProvider = FutureProvider<List<Sabor>>(
  (Ref ref) => ref.watch(repositorioProvider).sabores(),
);

final FutureProvider<List<Produccion>> pendientesProvider =
    FutureProvider<List<Produccion>>(
  (Ref ref) => ref.watch(repositorioProvider).pendientesDeEmbolsar(),
);

final FutureProvider<List<Produccion>> produccionesProvider =
    FutureProvider<List<Produccion>>(
  (Ref ref) => ref.watch(repositorioProvider).producciones(),
);

final FutureProvider<List<Destino>> destinosProvider =
    FutureProvider<List<Destino>>(
  (Ref ref) => ref.watch(repositorioProvider).destinos(),
);

final FutureProvider<List<Salida>> salidasProvider = FutureProvider<List<Salida>>(
  (Ref ref) => ref.watch(repositorioProvider).salidas(),
);

final FutureProvider<List<CausaMerma>> causasProvider =
    FutureProvider<List<CausaMerma>>(
  (Ref ref) => ref.watch(repositorioProvider).causas(),
);

final FutureProvider<List<Merma>> mermasProvider = FutureProvider<List<Merma>>(
  (Ref ref) => ref.watch(repositorioProvider).mermas(),
);

class RangoNotifier extends Notifier<int> {
  @override
  int build() => 30;

  void cambiar(int dias) => state = dias;
}

final NotifierProvider<RangoNotifier, int> rangoProvider =
    NotifierProvider<RangoNotifier, int>(RangoNotifier.new);

final FutureProvider<Indicadores> indicadoresProvider =
    FutureProvider<Indicadores>(
  (Ref ref) =>
      ref.watch(repositorioProvider).indicadores(ref.watch(rangoProvider)),
);

class FiltroLotes {
  const FiltroLotes({this.saborId, this.soloConStock = true});

  final String? saborId;
  final bool soloConStock;

  FiltroLotes conSabor(String? id) =>
      FiltroLotes(saborId: id, soloConStock: soloConStock);

  FiltroLotes conStock(bool solo) =>
      FiltroLotes(saborId: saborId, soloConStock: solo);
}

class FiltroLotesNotifier extends Notifier<FiltroLotes> {
  @override
  FiltroLotes build() => const FiltroLotes();

  void porSabor(String? saborId) => state = state.conSabor(saborId);

  void soloConStock(bool solo) => state = state.conStock(solo);
}

final NotifierProvider<FiltroLotesNotifier, FiltroLotes> filtroLotesProvider =
    NotifierProvider<FiltroLotesNotifier, FiltroLotes>(FiltroLotesNotifier.new);

final FutureProvider<List<Lote>> lotesProvider = FutureProvider<List<Lote>>(
  (Ref ref) {
    final FiltroLotes filtro = ref.watch(filtroLotesProvider);

    return ref.watch(repositorioProvider).lotes(
          saborId: filtro.saborId,
          soloConStock: filtro.soloConStock,
        );
  },
);

final FutureProvider<List<Sabor>> catalogoProvider = FutureProvider<List<Sabor>>(
  (Ref ref) => ref.watch(repositorioProvider).catalogo(),
);

final FutureProvider<List<UsuarioListado>> usuariosProvider =
    FutureProvider<List<UsuarioListado>>(
  (Ref ref) => ref.watch(repositorioProvider).usuarios(),
);

void refrescarTodo(WidgetRef ref) {
  ref
    ..invalidate(panelProvider)
    ..invalidate(indicadoresProvider)
    ..invalidate(inventarioProvider)
    ..invalidate(pendientesProvider)
    ..invalidate(produccionesProvider)
    ..invalidate(salidasProvider)
    ..invalidate(mermasProvider)
    ..invalidate(lotesProvider);
}
