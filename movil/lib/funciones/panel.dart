import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../dominio/modelos.dart';
import '../nucleo/formato.dart';
import '../nucleo/modulos.dart';
import '../nucleo/proveedores.dart';
import '../nucleo/tema.dart';
import '../ui/barras.dart';
import '../ui/filtros.dart';
import '../ui/pantalla.dart';
import '../ui/piezas.dart';

enum _Metrica { stock, producido, salido, merma }

class _Vista {
  const _Vista({
    required this.titulo,
    required this.apunte,
    required this.tono,
    required this.valor,
  });

  final String titulo;
  final String apunte;
  final Color tono;
  final int Function(IndicadorSabor) valor;
}

const Map<_Metrica, _Vista> _vistas = <_Metrica, _Vista>{
  _Metrica.stock: _Vista(
    titulo: 'Paletas disponibles ahora',
    apunte: 'Lo que hay hoy en el almacén, sabor por sabor.',
    tono: Paleta.marino,
    valor: _stock,
  ),
  _Metrica.producido: _Vista(
    titulo: 'Entró al stock en el periodo',
    apunte: 'Solo cuenta lo embolsado: el stock sube ahí, no antes.',
    tono: Paleta.helado,
    valor: _producido,
  ),
  _Metrica.salido: _Vista(
    titulo: 'Salió en el periodo',
    apunte: 'Paletas despachadas a todos los canales.',
    tono: Paleta.hoja,
    valor: _salido,
  ),
  _Metrica.merma: _Vista(
    titulo: 'Se perdió en el periodo',
    apunte: 'Mermas de producción, embolsado y almacén.',
    tono: Paleta.granate,
    valor: _merma,
  ),
};

int _stock(IndicadorSabor sabor) => sabor.stock;
int _producido(IndicadorSabor sabor) => sabor.producido;
int _salido(IndicadorSabor sabor) => sabor.salido;
int _merma(IndicadorSabor sabor) => sabor.merma;

class PantallaPanel extends ConsumerStatefulWidget {
  const PantallaPanel({super.key});

  @override
  ConsumerState<PantallaPanel> createState() => _PantallaPanelState();
}

class _PantallaPanelState extends ConsumerState<PantallaPanel> {
  _Metrica _metrica = _Metrica.stock;

  @override
  Widget build(BuildContext context) {
    final AsyncValue<Indicadores> indicadores = ref.watch(indicadoresProvider);
    final Usuario? usuario = ref.watch(sesionProvider).value;

    return Pantalla(
      titulo: 'Hola, ${usuario?.nombres ?? ''}',
      filtros: BarraDeFiltros(
        children: <Widget>[
          FilaDeChips<int>(
            opciones: const <Opcion<int>>[
              Opcion<int>(valor: 7, texto: '7 días'),
              Opcion<int>(valor: 30, texto: '30 días'),
              Opcion<int>(valor: 90, texto: '90 días'),
            ],
            elegida: ref.watch(rangoProvider),
            alElegir: (int dias) =>
                ref.read(rangoProvider.notifier).cambiar(dias),
          ),
        ],
      ),
      cuerpo: Cargado<Panel>(
        valor: ref.watch(panelProvider),
        alRefrescar: () {
          ref
            ..invalidate(panelProvider)
            ..invalidate(indicadoresProvider);
        },
        construir: (Panel datos) => ListView(
          padding: margenDeLista(context, abajo: 32),
          children: <Widget>[
            _Cabecera(panel: datos, indicadores: indicadores.value),
            const SizedBox(height: 16),
            _Alertas(panel: datos),
            const SizedBox(height: 22),
            indicadores.when(
              loading: () => const Cargando(),
              error: (Object error, StackTrace rastro) => Fallo(
                mensaje: error.toString(),
                reintentar: () => ref.invalidate(indicadoresProvider),
              ),
              data: (Indicadores medidas) => Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  _Kpis(medidas: medidas),
                  const SizedBox(height: 22),
                  const Titulo('Comparar los sabores'),
                  const SizedBox(height: 10),
                  FilaDeChips<_Metrica>(
                    opciones: const <Opcion<_Metrica>>[
                      Opcion<_Metrica>(valor: _Metrica.stock, texto: 'Stock'),
                      Opcion<_Metrica>(
                        valor: _Metrica.producido,
                        texto: 'Produjo',
                      ),
                      Opcion<_Metrica>(valor: _Metrica.salido, texto: 'Salió'),
                      Opcion<_Metrica>(valor: _Metrica.merma, texto: 'Merma'),
                    ],
                    elegida: _metrica,
                    alElegir: (_Metrica metrica) =>
                        setState(() => _metrica = metrica),
                  ),
                  const SizedBox(height: 12),
                  _PorSabor(medidas: medidas, vista: _vistas[_metrica]!),
                  const SizedBox(height: 22),
                  const Titulo('A dónde fue el producto'),
                  const SizedBox(height: 10),
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(18),
                      child: Barras(
                        vacio: 'No salió producto en este periodo.',
                        datos: <FilaBarra>[
                          for (final SalidaPorCanal canal
                              in medidas.salidasPorCanal)
                            FilaBarra(
                              rotulo: Etiquetas.tipoSalida[canal.tipo] ??
                                  canal.tipo,
                              valor: canal.cantidad,
                              apunte:
                                  '${_parte(canal.cantidad, medidas.salidas)}%',
                            ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 22),
            const Titulo('Lo último que pasó'),
            const SizedBox(height: 10),
            _Recientes(panel: datos),
          ],
        ),
      ),
    );
  }

  String _parte(int cantidad, int total) =>
      total == 0 ? '0' : (cantidad / total * 100).toStringAsFixed(0);
}

class _Cabecera extends StatelessWidget {
  const _Cabecera({required this.panel, required this.indicadores});

  final Panel panel;
  final Indicadores? indicadores;

  @override
  Widget build(BuildContext context) {
    final int? cobertura = indicadores?.stock.cobertura;

    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(22),
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: <Color>[Paleta.marino, Paleta.helado],
        ),
      ),
      padding: const EdgeInsets.all(22),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          const Text(
            'Paletas disponibles',
            style: TextStyle(color: Paleta.superficie, fontSize: 13),
          ),
          const SizedBox(height: 6),
          Text(
            miles(panel.stockTotal),
            style: const TextStyle(
              color: Paleta.superficie,
              fontSize: 46,
              fontWeight: FontWeight.w700,
              height: 1.05,
              letterSpacing: -1,
            ),
          ),
          const SizedBox(height: 14),
          Row(
            children: <Widget>[
              const Icon(Icons.schedule, size: 16, color: Paleta.superficie),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  cobertura == null
                      ? 'Sin salidas en el periodo para estimar duración'
                      : 'Alcanzan para unos $cobertura días al ritmo actual',
                  style: const TextStyle(
                    color: Paleta.superficie,
                    fontSize: 13,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _Alertas extends ConsumerWidget {
  const _Alertas({required this.panel});

  final Panel panel;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Row(
      children: <Widget>[
        Expanded(
          child: _Aviso(
            icono: Icons.trending_down,
            rotulo: 'Piden reposición',
            valor: '${panel.aReponer.length}',
            detalle: panel.aReponer.isEmpty
                ? 'Todo por encima del mínimo'
                : panel.aReponer
                    .map((StockSabor sabor) => sabor.nombre)
                    .join(', '),
            tono: panel.aReponer.isEmpty ? Paleta.hoja : Paleta.aguajeVivo,
            alTocar: () =>
                ref.read(moduloProvider.notifier).abrir(Modulo.inventario),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _Aviso(
            icono: Icons.inbox_outlined,
            rotulo: 'Falta embolsar',
            valor: '${panel.pendientesDeEmbolsar}',
            detalle: panel.pendientesDeEmbolsar == 0
                ? 'Sin producciones abiertas'
                : 'El stock sube recién al embolsar',
            tono: panel.pendientesDeEmbolsar == 0
                ? Paleta.hoja
                : Paleta.aguajeVivo,
            alTocar: () =>
                ref.read(moduloProvider.notifier).abrir(Modulo.produccion),
          ),
        ),
      ],
    );
  }
}

class _Aviso extends StatelessWidget {
  const _Aviso({
    required this.icono,
    required this.rotulo,
    required this.valor,
    required this.detalle,
    required this.tono,
    required this.alTocar,
  });

  final IconData icono;
  final String rotulo;
  final String valor;
  final String detalle;
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
                Row(
                  children: <Widget>[
                    Icon(icono, size: 18, color: tono),
                    const SizedBox(width: 8),
                    Expanded(child: Rotulo(rotulo)),
                  ],
                ),
                const SizedBox(height: 8),
                Cifra(valor, tamano: 32, tono: tono),
                const SizedBox(height: 6),
                Text(
                  detalle,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(color: Paleta.tenue, fontSize: 12),
                ),
              ],
            ),
          ),
        ),
      );
}

class _Kpis extends StatelessWidget {
  const _Kpis({required this.medidas});

  final Indicadores medidas;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        Titulo('Los últimos ${medidas.dias} días'),
        const SizedBox(height: 10),
        Row(
          children: <Widget>[
            Expanded(
              child: _Kpi(
                rotulo: 'Entró al stock',
                valor: miles(medidas.produccion.embolsado),
                pie: 'de ${miles(medidas.produccion.obtenido)} obtenidas',
                tono: Paleta.marino,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _Kpi(
                rotulo: 'Salió',
                valor: miles(medidas.salidas),
                pie: '${_porDia(medidas.salidas, medidas.dias)} por día',
                tono: Paleta.helado,
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: <Widget>[
            Expanded(
              child: _Kpi(
                rotulo: 'Rendimiento',
                valor: '${medidas.produccion.rendimiento}%',
                pie: 'de lo obtenido llegó a venderse',
                tono: Paleta.hoja,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _Kpi(
                rotulo: 'Merma',
                valor: '${medidas.mermas.porcentaje}%',
                pie: '${miles(medidas.mermas.total)} paletas perdidas',
                tono: _tonoDeMerma(medidas.mermas.porcentaje),
              ),
            ),
          ],
        ),
      ],
    );
  }

  String _porDia(int total, int dias) =>
      dias == 0 ? '0' : (total / dias).toStringAsFixed(0);
}

class _Kpi extends StatelessWidget {
  const _Kpi({
    required this.rotulo,
    required this.valor,
    required this.pie,
    required this.tono,
  });

  final String rotulo;
  final String valor;
  final String pie;
  final Color tono;

  @override
  Widget build(BuildContext context) => Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Container(width: 26, height: 3, color: tono),
              const SizedBox(height: 12),
              Rotulo(rotulo),
              const SizedBox(height: 4),
              Cifra(valor, tamano: 26),
              const SizedBox(height: 4),
              Text(
                pie,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(color: Paleta.tenue, fontSize: 11),
              ),
            ],
          ),
        ),
      );
}

class _PorSabor extends StatelessWidget {
  const _PorSabor({required this.medidas, required this.vista});

  final Indicadores medidas;
  final _Vista vista;

  @override
  Widget build(BuildContext context) {
    final List<IndicadorSabor> ordenados = <IndicadorSabor>[...medidas.sabores]
      ..sort(
        (IndicadorSabor a, IndicadorSabor b) =>
            vista.valor(b).compareTo(vista.valor(a)),
      );

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Text(
              vista.titulo,
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: Paleta.tinta,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              vista.apunte,
              style: const TextStyle(color: Paleta.tenue, fontSize: 12),
            ),
            const SizedBox(height: 16),
            Barras(
              vacio: 'No hay nada que mostrar en este periodo.',
              datos: <FilaBarra>[
                for (final IndicadorSabor sabor in ordenados)
                  if (vista.valor(sabor) > 0)
                    FilaBarra(
                      rotulo: sabor.nombre,
                      valor: vista.valor(sabor),
                      apunte: sabor.cobertura == null
                          ? null
                          : '${sabor.cobertura} d',
                      tono: vista.tono,
                    ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _Recientes extends ConsumerWidget {
  const _Recientes({required this.panel});

  final Panel panel;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Card(
      child: Column(
        children: <Widget>[
          for (final Salida salida in panel.salidasRecientes.take(4))
            ListTile(
              leading: const Icon(
                Icons.local_shipping_outlined,
                color: Paleta.marino,
              ),
              title: Text(salida.destino ?? 'Salida sin destino'),
              subtitle: Text(
                '${fechaCorta(salida.fecha)} · ${Etiquetas.tipoSalida[salida.tipo] ?? salida.tipo}',
              ),
              trailing: Text(
                '${miles(salida.cantidadTotal)} p.',
                style: const TextStyle(
                  fontWeight: FontWeight.w600,
                  color: Paleta.tinta,
                ),
              ),
              onTap: () =>
                  ref.read(moduloProvider.notifier).abrir(Modulo.salidas),
            ),
          for (final Merma merma in panel.mermasRecientes.take(3))
            ListTile(
              leading: const Icon(
                Icons.report_gmailerrorred_outlined,
                color: Paleta.granate,
              ),
              title: Text(merma.sabor),
              subtitle: Text(
                '${fechaCorta(merma.fecha)} · ${merma.causa}',
              ),
              trailing: Text(
                '-${miles(merma.cantidad)}',
                style: const TextStyle(
                  fontWeight: FontWeight.w600,
                  color: Paleta.granate,
                ),
              ),
              onTap: () =>
                  ref.read(moduloProvider.notifier).abrir(Modulo.mermas),
            ),
          if (panel.salidasRecientes.isEmpty && panel.mermasRecientes.isEmpty)
            const Vacio('Todavía no hay movimientos registrados.'),
        ],
      ),
    );
  }
}

class Titulo extends StatelessWidget {
  const Titulo(this.texto, {super.key});

  final String texto;

  @override
  Widget build(BuildContext context) => Text(
        texto,
        style: const TextStyle(
          fontSize: 17,
          fontWeight: FontWeight.w600,
          color: Paleta.tinta,
        ),
      );
}

Color _tonoDeMerma(String porcentaje) {
  final double valor = double.tryParse(porcentaje) ?? 0;

  if (valor >= 5) {
    return Paleta.granate;
  }

  return valor >= 3 ? Paleta.aguajeVivo : Paleta.hoja;
}
