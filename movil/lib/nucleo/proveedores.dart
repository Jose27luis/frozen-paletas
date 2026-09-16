import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../datos/almacen_sesion.dart';
import '../datos/cliente_api.dart';
import '../datos/repositorio.dart';
import '../dominio/modelos.dart';

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

  Future<void> entrar(String correo, String password) async {
    final Sesion sesion =
        await ref.read(repositorioProvider).entrar(correo, password);

    state = AsyncValue<Usuario?>.data(sesion.usuario);
  }

  Future<void> salir() async {
    await ref.read(repositorioProvider).salir();
    state = const AsyncValue<Usuario?>.data(null);
  }
}

final AsyncNotifierProvider<SesionNotifier, Usuario?> sesionProvider =
    AsyncNotifierProvider<SesionNotifier, Usuario?>(SesionNotifier.new);

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

void refrescarTodo(WidgetRef ref) {
  ref
    ..invalidate(panelProvider)
    ..invalidate(inventarioProvider)
    ..invalidate(pendientesProvider)
    ..invalidate(produccionesProvider)
    ..invalidate(salidasProvider)
    ..invalidate(mermasProvider);
}
