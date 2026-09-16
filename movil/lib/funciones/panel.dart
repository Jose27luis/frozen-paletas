import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../dominio/modelos.dart';
import '../nucleo/formato.dart';
import '../nucleo/proveedores.dart';
import '../nucleo/tema.dart';
import '../ui/piezas.dart';

class PantallaPanel extends ConsumerWidget {
  const PantallaPanel({required this.irA, super.key});

  final void Function(int) irA;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final AsyncValue<Panel> panel = ref.watch(panelProvider);
    final Usuario? usuario = ref.watch(sesionProvider).value;

    return Scaffold(
      appBar: AppBar(
        title: Text('Hola, ${usuario?.nombres ?? ''}'),
        actions: <Widget>[
          IconButton(
            tooltip: 'Cerrar sesión',
            icon: const Icon(Icons.logout),
            onPressed: () => ref.read(sesionProvider.notifier).salir(),
          ),
        ],
      ),
      body: panel.when(
        loading: () => const Cargando(),
        error: (Object error, StackTrace rastro) => Fallo(
          mensaje: error.toString(),
          reintentar: () => ref.invalidate(panelProvider),
        ),
        data: (Panel datos) => RefreshIndicator(
          onRefresh: () async => ref.invalidate(panelProvider),
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: <Widget>[
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: <Widget>[
                      const Rotulo('Paletas disponibles'),
                      const SizedBox(height: 6),
                      Cifra(miles(datos.stockTotal), tamano: 44),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 12),
              Row(
                children: <Widget>[
                  Expanded(
                    child: _Ficha(
                      rotulo: 'Piden reposición',
                      valor: '${datos.aReponer.length}',
                      tono: datos.aReponer.isEmpty
                          ? Paleta.tinta
                          : Paleta.aguajeVivo,
                      alTocar: () => irA(1),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _Ficha(
                      rotulo: 'Falta embolsar',
                      valor: '${datos.pendientesDeEmbolsar}',
                      tono: datos.pendientesDeEmbolsar == 0
                          ? Paleta.tinta
                          : Paleta.aguajeVivo,
                      alTocar: () => irA(2),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),
              const Text(
                'Qué hay que producir',
                style: TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.w600,
                  color: Paleta.tinta,
                ),
              ),
              const SizedBox(height: 10),
              if (datos.aReponer.isEmpty)
                const Card(
                  child: Vacio('Ningún sabor activo llegó a su mínimo.'),
                )
              else
                Card(
                  child: Column(
                    children: <Widget>[
                      for (final StockSabor sabor in datos.aReponer)
                        ListTile(
                          title: Text(sabor.nombre),
                          subtitle: Text('mínimo ${sabor.stockMinimo}'),
                          trailing: Cifra(
                            '${sabor.stock}',
                            tamano: 20,
                            tono: tonoDelEstado(sabor.estado),
                          ),
                        ),
                    ],
                  ),
                ),
              const SizedBox(height: 24),
              const Text(
                'Últimas salidas',
                style: TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.w600,
                  color: Paleta.tinta,
                ),
              ),
              const SizedBox(height: 10),
              Card(
                child: datos.salidasRecientes.isEmpty
                    ? const Vacio('Sin salidas registradas.')
                    : Column(
                        children: <Widget>[
                          for (final Salida salida in datos.salidasRecientes)
                            ListTile(
                              title: Text(
                                salida.destino ??
                                    Etiquetas.tipoSalida[salida.tipo] ??
                                    salida.tipo,
                              ),
                              subtitle: Text(
                                '${fechaCorta(salida.fecha)}  ${Etiquetas.tipoSalida[salida.tipo] ?? ''}',
                              ),
                              trailing: Cifra(
                                '−${salida.cantidadTotal}',
                                tamano: 18,
                                tono: Paleta.aguaje,
                              ),
                            ),
                        ],
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Ficha extends StatelessWidget {
  const _Ficha({
    required this.rotulo,
    required this.valor,
    required this.tono,
    required this.alTocar,
  });

  final String rotulo;
  final String valor;
  final Color tono;
  final VoidCallback alTocar;

  @override
  Widget build(BuildContext context) => Card(
        child: InkWell(
          borderRadius: BorderRadius.circular(20),
          onTap: alTocar,
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Rotulo(rotulo),
                const SizedBox(height: 6),
                Cifra(valor, tamano: 26, tono: tono),
              ],
            ),
          ),
        ),
      );
}
