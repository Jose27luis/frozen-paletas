import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../dominio/modelos.dart';
import '../nucleo/formato.dart';
import '../nucleo/modulos.dart';
import '../nucleo/proveedores.dart';
import '../nucleo/tema.dart';
import '../ui/menu_lateral.dart';
import '../ui/piezas.dart';

const List<int> _rangos = <int>[7, 30, 90];

class PantallaPanel extends ConsumerWidget {
  const PantallaPanel({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final AsyncValue<Panel> panel = ref.watch(panelProvider);
    final AsyncValue<Indicadores> indicadores = ref.watch(indicadoresProvider);
    final Usuario? usuario = ref.watch(sesionProvider).value;

    return Scaffold(
      drawer: const MenuLateral(),
      appBar: AppBar(
        title: Text('Hola, ${usuario?.nombres ?? ''}'),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(52),
          child: _Rangos(dias: ref.watch(rangoProvider)),
        ),
      ),
      body: panel.when(
        loading: () => const Cargando(),
        error: (Object error, StackTrace rastro) => Fallo(
          mensaje: error.toString(),
          reintentar: () => ref.invalidate(panelProvider),
        ),
        data: (Panel datos) => RefreshIndicator(
          onRefresh: () async {
            ref
              ..invalidate(panelProvider)
              ..invalidate(indicadoresProvider);
          },
          child: ListView(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
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
                data: (Indicadores medidas) => _Indicadores(medidas: medidas),
              ),
              const SizedBox(height: 22),
              const _Titulo('Últimas salidas'),
              const SizedBox(height: 10),
              if (datos.salidasRecientes.isEmpty)
                const Vacio('Todavía no hay salidas registradas.')
              else
                Card(
                  child: Column(
                    children: <Widget>[
                      for (final Salida salida in datos.salidasRecientes)
                        ListTile(
                          leading: const Icon(
                            Icons.local_shipping_outlined,
                            color: Paleta.marino,
                          ),
                          title: Text(
                            Etiquetas.tipoSalida[salida.tipo] ?? salida.tipo,
                          ),
                          subtitle: Text(
                            '${fechaCorta(salida.fecha)} · ${salida.destino ?? 'Sin destino'}',
                          ),
                          trailing: Text(
                            '${miles(salida.cantidadTotal)} p.',
                            style: const TextStyle(
                              fontWeight: FontWeight.w600,
                              color: Paleta.tinta,
                            ),
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

class _Rangos extends ConsumerWidget {
  const _Rangos({required this.dias});

  final int dias;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Container(
      color: Paleta.superficie,
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
      child: Row(
        children: <Widget>[
          for (final int opcion in _rangos)
            Padding(
              padding: const EdgeInsets.only(right: 8),
              child: ChoiceChip(
                label: Text('$opcion días'),
                selected: opcion == dias,
                showCheckmark: false,
                selectedColor: Paleta.marino,
                backgroundColor: Paleta.hundido,
                side: BorderSide.none,
                labelStyle: TextStyle(
                  color: opcion == dias ? Paleta.superficie : Paleta.tenue,
                  fontWeight: FontWeight.w600,
                  fontSize: 13,
                ),
                onSelected: (bool _) =>
                    ref.read(rangoProvider.notifier).cambiar(opcion),
              ),
            ),
        ],
      ),
    );
  }
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
              const Icon(
                Icons.schedule,
                size: 16,
                color: Paleta.superficie,
              ),
              const SizedBox(width: 8),
              Text(
                cobertura == null
                    ? 'Sin salidas en el periodo para estimar duración'
                    : 'Alcanzan para unos $cobertura días al ritmo actual',
                style: const TextStyle(
                  color: Paleta.superficie,
                  fontSize: 13,
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
                : panel.aReponer.map((StockSabor s) => s.nombre).join(', '),
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
  Widget build(BuildContext context) {
    return Card(
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
}

class _Indicadores extends StatelessWidget {
  const _Indicadores({required this.medidas});

  final Indicadores medidas;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        _Titulo('Los últimos ${medidas.dias} días'),
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
        const SizedBox(height: 22),
        const _Titulo('A dónde fue el producto'),
        const SizedBox(height: 10),
        _Canales(canales: medidas.salidasPorCanal, total: medidas.salidas),
        const SizedBox(height: 22),
        const _Titulo('Movimiento por sabor'),
        const SizedBox(height: 10),
        _Sabores(sabores: medidas.sabores),
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

class _Canales extends StatelessWidget {
  const _Canales({required this.canales, required this.total});

  final List<SalidaPorCanal> canales;
  final int total;

  @override
  Widget build(BuildContext context) {
    if (canales.isEmpty) {
      return const Card(
        child: Vacio('No salió producto en este periodo.'),
      );
    }

    final int mayor = canales
        .map((SalidaPorCanal canal) => canal.cantidad)
        .reduce((int a, int b) => a > b ? a : b);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          children: <Widget>[
            for (final SalidaPorCanal canal in canales)
              Padding(
                padding: const EdgeInsets.only(bottom: 14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    Row(
                      children: <Widget>[
                        Expanded(
                          child: Text(
                            Etiquetas.tipoSalida[canal.tipo] ?? canal.tipo,
                            style: const TextStyle(
                              fontSize: 13,
                              color: Paleta.tinta,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                        Text(
                          '${miles(canal.cantidad)} · ${_parte(canal.cantidad)}%',
                          style: const TextStyle(
                            fontSize: 12,
                            color: Paleta.tenue,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(999),
                      child: LinearProgressIndicator(
                        value: mayor == 0 ? 0 : canal.cantidad / mayor,
                        minHeight: 9,
                        backgroundColor: Paleta.hundido,
                        valueColor: const AlwaysStoppedAnimation<Color>(
                          Paleta.marino,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }

  String _parte(int cantidad) =>
      total == 0 ? '0' : (cantidad / total * 100).toStringAsFixed(0);
}

class _Sabores extends StatelessWidget {
  const _Sabores({required this.sabores});

  final List<IndicadorSabor> sabores;

  @override
  Widget build(BuildContext context) {
    if (sabores.isEmpty) {
      return const Card(child: Vacio('No hay sabores activos.'));
    }

    final int tope = sabores
        .map((IndicadorSabor sabor) =>
            sabor.producido > sabor.salido ? sabor.producido : sabor.salido)
        .fold(1, (int mayor, int valor) => valor > mayor ? valor : mayor);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          children: <Widget>[
            for (final IndicadorSabor sabor in sabores)
              Padding(
                padding: const EdgeInsets.only(bottom: 16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    Row(
                      children: <Widget>[
                        Expanded(
                          child: Text(
                            sabor.nombre,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              color: Paleta.tinta,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Etiqueta(
                          sabor.cobertura == null
                              ? '${miles(sabor.stock)} en stock'
                              : '${sabor.cobertura} días',
                          tono: tonoDelEstado(sabor.estado),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    _Doble(
                      rotulo: 'Produjo',
                      valor: sabor.producido,
                      tope: tope,
                      tono: Paleta.marino,
                    ),
                    const SizedBox(height: 5),
                    _Doble(
                      rotulo: 'Salió',
                      valor: sabor.salido,
                      tope: tope,
                      tono: Paleta.helado,
                    ),
                    if (sabor.merma > 0) ...<Widget>[
                      const SizedBox(height: 5),
                      _Doble(
                        rotulo: 'Merma',
                        valor: sabor.merma,
                        tope: tope,
                        tono: Paleta.granate,
                      ),
                    ],
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _Doble extends StatelessWidget {
  const _Doble({
    required this.rotulo,
    required this.valor,
    required this.tope,
    required this.tono,
  });

  final String rotulo;
  final int valor;
  final int tope;
  final Color tono;

  @override
  Widget build(BuildContext context) => Row(
        children: <Widget>[
          SizedBox(
            width: 54,
            child: Text(
              rotulo,
              style: const TextStyle(fontSize: 11, color: Paleta.tenue),
            ),
          ),
          Expanded(
            child: ClipRRect(
              borderRadius: BorderRadius.circular(999),
              child: LinearProgressIndicator(
                value: tope == 0 ? 0 : valor / tope,
                minHeight: 7,
                backgroundColor: Paleta.hundido,
                valueColor: AlwaysStoppedAnimation<Color>(tono),
              ),
            ),
          ),
          SizedBox(
            width: 52,
            child: Text(
              miles(valor),
              textAlign: TextAlign.right,
              style: const TextStyle(
                fontSize: 12,
                color: Paleta.tinta,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      );
}

class _Titulo extends StatelessWidget {
  const _Titulo(this.texto);

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
