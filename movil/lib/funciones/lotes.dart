import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../datos/fallo_api.dart';
import '../datos/repos/lotes_repo.dart';
import '../dominio/modelos.dart';
import '../nucleo/formato.dart';
import '../nucleo/proveedores.dart';
import '../nucleo/tema.dart';
import '../ui/detalle.dart';
import '../ui/filtros.dart';
import '../ui/pantalla.dart';
import '../ui/piezas.dart';

class PantallaLotes extends ConsumerWidget {
  const PantallaLotes({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final FiltroLotes filtro = ref.watch(filtroLotesProvider);

    return Pantalla(
      titulo: 'Lotes',
      acciones: <Widget>[
        IconButton(
          tooltip: 'Buscar un lote por su código',
          icon: const Icon(Icons.search),
          onPressed: () => buscarLote(context, ref),
        ),
      ],
      filtros: BarraDeFiltros(
        children: <Widget>[
          FilaDeChips<String?>(
            opciones: <Opcion<String?>>[
              const Opcion<String?>(valor: null, texto: 'Todos los estados'),
              for (final MapEntry<String, String> fila
                  in Etiquetas.estadoLote.entries)
                Opcion<String?>(valor: fila.key, texto: fila.value),
            ],
            elegida: filtro.estado,
            alElegir: (String? estado) =>
                ref.read(filtroLotesProvider.notifier).porEstado(estado),
          ),
          const SizedBox(height: 10),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              children: <Widget>[
                Expanded(child: _SelectorDeSabor(filtro: filtro)),
                const SizedBox(width: 12),
                FilterChip(
                  label: const Text('Con stock'),
                  selected: filtro.soloConStock,
                  showCheckmark: false,
                  selectedColor: Paleta.marino,
                  backgroundColor: Paleta.hundido,
                  side: BorderSide.none,
                  labelStyle: TextStyle(
                    color: filtro.soloConStock
                        ? Paleta.superficie
                        : Paleta.tenue,
                    fontWeight: FontWeight.w600,
                    fontSize: 13,
                  ),
                  onSelected: (bool marcado) => ref
                      .read(filtroLotesProvider.notifier)
                      .soloConStock(marcado),
                ),
              ],
            ),
          ),
        ],
      ),
      cuerpo: Cargado<List<Lote>>(
        valor: ref.watch(lotesProvider),
        alRefrescar: () => ref.invalidate(lotesProvider),
        construir: (List<Lote> filas) => filas.isEmpty
            ? const ListaVacia('No hay lotes que cumplan el filtro.')
            : ListView.separated(
                padding: margenDeLista(context),
                itemCount: filas.length + 1,
                separatorBuilder: (BuildContext contexto, int indice) =>
                    const SizedBox(height: 10),
                itemBuilder: (BuildContext contexto, int indice) => indice == 0
                    ? _Resumen(lotes: filas)
                    : _Ficha(lote: filas[indice - 1]),
              ),
      ),
    );
  }
}

class _SelectorDeSabor extends ConsumerWidget {
  const _SelectorDeSabor({required this.filtro});

  final FiltroLotes filtro;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return ref.watch(saboresProvider).when(
          loading: () => const SizedBox(height: 48),
          error: (Object error, StackTrace rastro) => const SizedBox(height: 48),
          data: (List<Sabor> catalogo) => SelectorDesplegable<String>(
            rotulo: 'Sabor',
            textoDeTodos: 'Todos los sabores',
            elegida: filtro.saborId,
            opciones: <Opcion<String>>[
              for (final Sabor sabor in catalogo)
                Opcion<String>(valor: sabor.id, texto: sabor.nombre),
            ],
            alElegir: (String? id) =>
                ref.read(filtroLotesProvider.notifier).porSabor(id),
          ),
        );
  }
}

class _Resumen extends StatelessWidget {
  const _Resumen({required this.lotes});

  final List<Lote> lotes;

  @override
  Widget build(BuildContext context) {
    final int paletas = lotes.fold(
      0,
      (int suma, Lote lote) => suma + lote.stockRestante,
    );
    final int masViejo = lotes.isEmpty
        ? 0
        : lotes
            .map((Lote lote) => diasDesde(lote.fechaProduccion))
            .reduce((int a, int b) => a > b ? a : b);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Row(
          children: <Widget>[
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  const Rotulo('Paletas en estos lotes'),
                  const SizedBox(height: 4),
                  Cifra(miles(paletas), tamano: 30),
                ],
              ),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: <Widget>[
                Etiqueta('${lotes.length} lotes', tono: Paleta.marino),
                const SizedBox(height: 8),
                Etiqueta(
                  'el más viejo, $masViejo d',
                  tono: masViejo >= 30 ? Paleta.aguajeVivo : Paleta.tenue,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _Ficha extends ConsumerWidget {
  const _Ficha({required this.lote});

  final Lote lote;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final double consumido = lote.cantidadIngresada == 0
        ? 0
        : 1 - lote.stockRestante / lote.cantidadIngresada;
    final int dias = diasDesde(lote.fechaProduccion);

    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(20),
        onTap: () => abrirLote(context, ref, lote),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Row(
                children: <Widget>[
                  Expanded(
                    child: Text(
                      lote.codigo,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: Paleta.tinta,
                        letterSpacing: 0.4,
                      ),
                    ),
                  ),
                  Etiqueta(
                    Etiquetas.estadoLote[lote.estado] ?? lote.estado,
                    tono: tonoDelLote(lote.estado),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              Text(
                lote.sabor,
                style: const TextStyle(color: Paleta.tenue, fontSize: 13),
              ),
              const SizedBox(height: 14),
              ClipRRect(
                borderRadius: BorderRadius.circular(999),
                child: LinearProgressIndicator(
                  value: consumido.clamp(0, 1).toDouble(),
                  minHeight: 8,
                  backgroundColor: Paleta.hundido,
                  valueColor:
                      const AlwaysStoppedAnimation<Color>(Paleta.helado),
                ),
              ),
              const SizedBox(height: 10),
              Row(
                children: <Widget>[
                  Expanded(
                    child: _Dato(
                      rotulo: 'Quedan',
                      valor: miles(lote.stockRestante),
                      tono: lote.stockRestante == 0
                          ? Paleta.tenue
                          : Paleta.tinta,
                    ),
                  ),
                  Expanded(
                    child: _Dato(
                      rotulo: 'Ingresaron',
                      valor: miles(lote.cantidadIngresada),
                    ),
                  ),
                  Expanded(
                    child: _Dato(
                      rotulo: 'Antigüedad',
                      valor: dias == 0 ? 'Hoy' : '$dias d',
                      tono: dias >= 30 ? Paleta.aguajeVivo : Paleta.tinta,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Dato extends StatelessWidget {
  const _Dato({
    required this.rotulo,
    required this.valor,
    this.tono = Paleta.tinta,
  });

  final String rotulo;
  final String valor;
  final Color tono;

  @override
  Widget build(BuildContext context) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Rotulo(rotulo),
          const SizedBox(height: 2),
          Cifra(valor, tamano: 19, tono: tono),
        ],
      );
}

Color tonoDelLote(String estado) => switch (estado) {
      'ABIERTO' => Paleta.hoja,
      'PARCIAL' => Paleta.helado,
      'PENDIENTE' => Paleta.aguajeVivo,
      _ => Paleta.tenue,
    };

Future<void> abrirLote(
  BuildContext context,
  WidgetRef ref,
  Lote lote,
) async {
  final List<Movimiento> movimientos = await _movimientosDe(ref, lote.id);

  if (!context.mounted) {
    return;
  }

  await abrirDetalle(
    context,
    titulo: lote.codigo,
    subtitulo: lote.sabor,
    children: <Widget>[
      FilaDetalle(
        rotulo: 'Estado',
        valor: Etiquetas.estadoLote[lote.estado] ?? lote.estado,
        tono: tonoDelLote(lote.estado),
      ),
      FilaDetalle(rotulo: 'Quedan', valor: '${miles(lote.stockRestante)} paletas'),
      FilaDetalle(
        rotulo: 'Ingresaron',
        valor: '${miles(lote.cantidadIngresada)} paletas',
      ),
      FilaDetalle(
        rotulo: 'Producido',
        valor:
            '${fechaLarga(lote.fechaProduccion)} · hace ${diasDesde(lote.fechaProduccion)} días',
      ),
      FilaDetalle(rotulo: 'Responsable', valor: lote.responsable),
      const Seccion('MOVIMIENTOS DE ESTE LOTE'),
      if (movimientos.isEmpty)
        const Vacio('Todavía no se descontó nada de este lote.')
      else
        for (final Movimiento movimiento in movimientos)
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Row(
              children: <Widget>[
                Expanded(
                  child: Text(
                    '${fechaCorta(movimiento.fecha)} · ${Etiquetas.tipoMovimiento[movimiento.tipo] ?? movimiento.tipo}',
                    style: const TextStyle(fontSize: 13, color: Paleta.tinta),
                  ),
                ),
                Text(
                  '${movimiento.entra ? '+' : ''}${miles(movimiento.cantidad)}',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: movimiento.entra ? Paleta.hoja : Paleta.granate,
                  ),
                ),
              ],
            ),
          ),
    ],
  );
}

Future<List<Movimiento>> _movimientosDe(WidgetRef ref, String loteId) async {
  try {
    return await ref.read(lotesRepoProvider).movimientos(loteId);
  } on FalloApi {
    return const <Movimiento>[];
  }
}

Future<void> buscarLote(BuildContext context, WidgetRef ref) async {
  final TextEditingController codigo = TextEditingController();

  final String? buscado = await showDialog<String>(
    context: context,
    builder: (BuildContext dialogo) => AlertDialog(
      title: const Text('Buscar un lote'),
      content: TextField(
        controller: codigo,
        autofocus: true,
        textCapitalization: TextCapitalization.characters,
        decoration: const InputDecoration(labelText: 'Código del lote'),
        onSubmitted: (String texto) => Navigator.of(dialogo).pop(texto),
      ),
      actions: <Widget>[
        TextButton(
          onPressed: () => Navigator.of(dialogo).pop(),
          child: const Text('Cancelar'),
        ),
        FilledButton(
          onPressed: () => Navigator.of(dialogo).pop(codigo.text),
          child: const Text('Buscar'),
        ),
      ],
    ),
  );

  codigo.dispose();

  if (buscado == null || buscado.trim().isEmpty || !context.mounted) {
    return;
  }

  try {
    final Lote lote = await ref
        .read(lotesRepoProvider)
        .porCodigo(buscado.trim().toUpperCase());

    if (context.mounted) {
      await abrirLote(context, ref, lote);
    }
  } on FalloApi catch (fallo) {
    if (context.mounted) {
      avisar(context, fallo.mensaje, error: true);
    }
  }
}
