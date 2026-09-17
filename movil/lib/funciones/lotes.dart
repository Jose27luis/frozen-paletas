import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../datos/fallo_api.dart';
import '../dominio/modelos.dart';
import '../nucleo/formato.dart';
import '../nucleo/proveedores.dart';
import '../nucleo/tema.dart';
import '../ui/menu_lateral.dart';
import '../ui/piezas.dart';

class PantallaLotes extends ConsumerWidget {
  const PantallaLotes({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final AsyncValue<List<Lote>> lotes = ref.watch(lotesProvider);
    final FiltroLotes filtro = ref.watch(filtroLotesProvider);

    return Scaffold(
      drawer: const MenuLateral(),
      appBar: AppBar(
        title: const Text('Lotes'),
        actions: <Widget>[
          IconButton(
            tooltip: 'Buscar un lote por su código',
            icon: const Icon(Icons.search),
            onPressed: () => buscarLote(context, ref),
          ),
        ],
      ),
      body: Column(
        children: <Widget>[
          _Filtros(filtro: filtro),
          const Divider(height: 1),
          Expanded(
            child: lotes.when(
              loading: () => const Cargando(),
              error: (Object error, StackTrace rastro) => Fallo(
                mensaje: error.toString(),
                reintentar: () => ref.invalidate(lotesProvider),
              ),
              data: (List<Lote> filas) => RefreshIndicator(
                onRefresh: () async => ref.invalidate(lotesProvider),
                child: filas.isEmpty
                    ? ListView(
                        children: const <Widget>[
                          Vacio('No hay lotes que cumplan el filtro.'),
                        ],
                      )
                    : ListView.separated(
                        padding: margenDeLista(context),
                        itemCount: filas.length,
                        separatorBuilder:
                            (BuildContext contexto, int indice) =>
                                const SizedBox(height: 10),
                        itemBuilder: (BuildContext contexto, int indice) =>
                            _Ficha(lote: filas[indice]),
                      ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _Filtros extends ConsumerWidget {
  const _Filtros({required this.filtro});

  final FiltroLotes filtro;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final AsyncValue<List<Sabor>> sabores = ref.watch(saboresProvider);

    return Container(
      color: Paleta.superficie,
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
      child: Row(
        children: <Widget>[
          Expanded(
            child: sabores.when(
              loading: () => const SizedBox(height: 48),
              error: (Object error, StackTrace rastro) =>
                  const SizedBox(height: 48),
              data: (List<Sabor> catalogo) => DropdownButtonFormField<String?>(
                initialValue: filtro.saborId,
                isExpanded: true,
                decoration: const InputDecoration(
                  labelText: 'Sabor',
                  isDense: true,
                ),
                items: <DropdownMenuItem<String?>>[
                  const DropdownMenuItem<String?>(child: Text('Todos')),
                  for (final Sabor sabor in catalogo)
                    DropdownMenuItem<String?>(
                      value: sabor.id,
                      child: Text(sabor.nombre, overflow: TextOverflow.ellipsis),
                    ),
                ],
                onChanged: (String? id) =>
                    ref.read(filtroLotesProvider.notifier).porSabor(id),
              ),
            ),
          ),
          const SizedBox(width: 12),
          FilterChip(
            label: const Text('Con stock'),
            selected: filtro.soloConStock,
            showCheckmark: false,
            selectedColor: Paleta.marino,
            backgroundColor: Paleta.hundido,
            side: BorderSide.none,
            labelStyle: TextStyle(
              color: filtro.soloConStock ? Paleta.superficie : Paleta.tenue,
              fontWeight: FontWeight.w600,
              fontSize: 13,
            ),
            onSelected: (bool marcado) =>
                ref.read(filtroLotesProvider.notifier).soloConStock(marcado),
          ),
        ],
      ),
    );
  }
}

class _Ficha extends StatelessWidget {
  const _Ficha({required this.lote});

  final Lote lote;

  @override
  Widget build(BuildContext context) {
    final double consumido = lote.cantidadIngresada == 0
        ? 0
        : 1 - lote.stockRestante / lote.cantidadIngresada;
    final int dias = diasDesde(lote.fechaProduccion);

    return Card(
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
                  tono: _tonoDelLote(lote.estado),
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
                valueColor: const AlwaysStoppedAnimation<Color>(Paleta.helado),
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
            const SizedBox(height: 12),
            Row(
              children: <Widget>[
                const Icon(
                  Icons.event_outlined,
                  size: 14,
                  color: Paleta.tenue,
                ),
                const SizedBox(width: 6),
                Text(
                  fechaLarga(lote.fechaProduccion),
                  style: const TextStyle(color: Paleta.tenue, fontSize: 12),
                ),
                const SizedBox(width: 14),
                const Icon(
                  Icons.person_outline,
                  size: 14,
                  color: Paleta.tenue,
                ),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    lote.responsable,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(color: Paleta.tenue, fontSize: 12),
                  ),
                ),
              ],
            ),
          ],
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

Color _tonoDelLote(String estado) => switch (estado) {
      'ABIERTO' => Paleta.hoja,
      'PARCIAL' => Paleta.helado,
      'PENDIENTE' => Paleta.aguajeVivo,
      _ => Paleta.tenue,
    };

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
        .read(repositorioProvider)
        .lotePorCodigo(buscado.trim().toUpperCase());

    if (!context.mounted) {
      return;
    }

    await showDialog<void>(
      context: context,
      builder: (BuildContext dialogo) => AlertDialog(
        title: Text(lote.codigo),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Text(lote.sabor),
            const SizedBox(height: 12),
            Text('Quedan ${miles(lote.stockRestante)} paletas'),
            Text('Ingresaron ${miles(lote.cantidadIngresada)}'),
            Text('Producido el ${fechaLarga(lote.fechaProduccion)}'),
            Text('Responsable: ${lote.responsable}'),
          ],
        ),
        actions: <Widget>[
          FilledButton(
            onPressed: () => Navigator.of(dialogo).pop(),
            child: const Text('Cerrar'),
          ),
        ],
      ),
    );
  } on FalloApi catch (fallo) {
    if (context.mounted) {
      avisar(context, fallo.mensaje, error: true);
    }
  }
}
