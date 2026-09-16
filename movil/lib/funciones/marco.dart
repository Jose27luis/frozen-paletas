import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../nucleo/modulos.dart';
import '../nucleo/proveedores.dart';
import 'inventario.dart';
import 'lotes.dart';
import 'mermas.dart';
import 'panel.dart';
import 'produccion.dart';
import 'sabores.dart';
import 'salidas.dart';
import 'usuarios.dart';

const Map<Modulo, Widget> _pantallas = <Modulo, Widget>{
  Modulo.panel: PantallaPanel(),
  Modulo.inventario: PantallaInventario(),
  Modulo.produccion: PantallaProduccion(),
  Modulo.salidas: PantallaSalidas(),
  Modulo.mermas: PantallaMermas(),
  Modulo.lotes: PantallaLotes(),
  Modulo.sabores: PantallaSabores(),
  Modulo.usuarios: PantallaUsuarios(),
};

class Marco extends ConsumerStatefulWidget {
  const Marco({super.key});

  @override
  ConsumerState<Marco> createState() => _MarcoState();
}

class _MarcoState extends ConsumerState<Marco> {
  final Set<Modulo> _visitados = <Modulo>{Modulo.panel};

  @override
  Widget build(BuildContext context) {
    final Modulo modulo = ref.watch(moduloProvider);

    _visitados.add(modulo);

    return IndexedStack(
      index: modulo.index,
      children: <Widget>[
        for (final Modulo cada in Modulo.values)
          if (_visitados.contains(cada))
            _pantallas[cada]!
          else
            const SizedBox.shrink(),
      ],
    );
  }
}
