import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/date_symbol_data_local.dart';

import 'dominio/modelos.dart';
import 'funciones/acceso.dart';
import 'funciones/marco.dart';
import 'nucleo/proveedores.dart';
import 'nucleo/tema.dart';
import 'ui/piezas.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await initializeDateFormatting('es_PE');

  runApp(const ProviderScope(child: AppFrozen()));
}

class AppFrozen extends StatelessWidget {
  const AppFrozen({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Frozen Paletas',
      debugShowCheckedModeBanner: false,
      theme: Tema.claro,
      locale: const Locale('es', 'PE'),
      supportedLocales: const <Locale>[Locale('es', 'PE')],
      localizationsDelegates: const <LocalizationsDelegate<Object>>[
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      home: const _Entrada(),
    );
  }
}

class _Entrada extends ConsumerStatefulWidget {
  const _Entrada();

  @override
  ConsumerState<_Entrada> createState() => _EntradaState();
}

class _EntradaState extends ConsumerState<_Entrada>
    with WidgetsBindingObserver {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState estado) {
    if (estado == AppLifecycleState.resumed) {
      _vaciarCola();
    }
  }

  void _vaciarCola() {
    if (ref.read(sesionProvider).value == null) {
      return;
    }

    ref.read(pendientesColaProvider.notifier).sincronizar();
  }

  @override
  Widget build(BuildContext context) {
    final AsyncValue<Usuario?> sesion = ref.watch(sesionProvider);

    ref.listen<AsyncValue<Usuario?>>(sesionProvider, (
      AsyncValue<Usuario?>? antes,
      AsyncValue<Usuario?> ahora,
    ) {
      if (ahora.value != null) {
        _vaciarCola();
      }
    });

    return sesion.when(
      loading: () => const Scaffold(body: Cargando()),
      error: (Object error, StackTrace rastro) => Scaffold(
        body: Fallo(
          mensaje: error.toString(),
          reintentar: () => ref.invalidate(sesionProvider),
        ),
      ),
      data: (Usuario? usuario) =>
          usuario == null ? const PantallaAcceso() : const Marco(),
    );
  }
}
