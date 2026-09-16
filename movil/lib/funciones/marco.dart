import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../nucleo/modulos.dart';
import '../nucleo/proveedores.dart';
import 'inventario.dart';
import 'mermas.dart';
import 'panel.dart';
import 'produccion.dart';
import 'salidas.dart';

class Marco extends ConsumerWidget {
  const Marco({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final Modulo modulo = ref.watch(moduloProvider);

    return IndexedStack(
      index: modulo.index,
      children: const <Widget>[
        PantallaPanel(),
        PantallaInventario(),
        PantallaProduccion(),
        PantallaSalidas(),
        PantallaMermas(),
      ],
    );
  }
}
