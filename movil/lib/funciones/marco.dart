import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../nucleo/tema.dart';
import 'inventario.dart';
import 'mermas.dart';
import 'panel.dart';
import 'produccion.dart';
import 'salidas.dart';

class Marco extends ConsumerStatefulWidget {
  const Marco({super.key});

  @override
  ConsumerState<Marco> createState() => _MarcoState();
}

class _MarcoState extends ConsumerState<Marco> {
  int _pestana = 0;

  void _irA(int indice) => setState(() => _pestana = indice);

  @override
  Widget build(BuildContext context) {
    final List<Widget> pantallas = <Widget>[
      PantallaPanel(irA: _irA),
      const PantallaInventario(),
      const PantallaProduccion(),
      const PantallaSalidas(),
      const PantallaMermas(),
    ];

    return Scaffold(
      body: IndexedStack(index: _pestana, children: pantallas),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _pestana,
        onDestinationSelected: _irA,
        destinations: const <NavigationDestination>[
          NavigationDestination(
            icon: Icon(Icons.dashboard_outlined),
            selectedIcon: Icon(Icons.dashboard, color: Paleta.marino),
            label: 'Panel',
          ),
          NavigationDestination(
            icon: Icon(Icons.inventory_2_outlined),
            selectedIcon: Icon(Icons.inventory_2, color: Paleta.marino),
            label: 'Inventario',
          ),
          NavigationDestination(
            icon: Icon(Icons.icecream_outlined),
            selectedIcon: Icon(Icons.icecream, color: Paleta.marino),
            label: 'Producción',
          ),
          NavigationDestination(
            icon: Icon(Icons.local_shipping_outlined),
            selectedIcon: Icon(Icons.local_shipping, color: Paleta.marino),
            label: 'Salidas',
          ),
          NavigationDestination(
            icon: Icon(Icons.report_gmailerrorred_outlined),
            selectedIcon: Icon(Icons.report, color: Paleta.marino),
            label: 'Mermas',
          ),
        ],
      ),
    );
  }
}
