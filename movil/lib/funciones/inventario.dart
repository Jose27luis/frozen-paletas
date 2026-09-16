import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../datos/fallo_api.dart';
import '../dominio/modelos.dart';
import '../nucleo/formato.dart';
import '../nucleo/proveedores.dart';
import '../nucleo/tema.dart';
import '../ui/menu_lateral.dart';
import '../ui/piezas.dart';

class PantallaInventario extends ConsumerWidget {
  const PantallaInventario({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final AsyncValue<Inventario> inventario = ref.watch(inventarioProvider);

    return Scaffold(
      drawer: const MenuLateral(),
      appBar: AppBar(
        title: const Text('Inventario'),
        actions: <Widget>[
          IconButton(
            tooltip: 'Buscar un lote por su código',
            icon: const Icon(Icons.qr_code_2_outlined),
            onPressed: () => _buscarLote(context, ref),
          ),
        ],
      ),
      body: inventario.when(
        loading: () => const Cargando(),
        error: (Object error, StackTrace rastro) => Fallo(
          mensaje: error.toString(),
          reintentar: () => ref.invalidate(inventarioProvider),
        ),
        data: (Inventario datos) => RefreshIndicator(
          onRefresh: () async => ref.invalidate(inventarioProvider),
          child: ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: datos.sabores.length + 1,
            separatorBuilder: (BuildContext contexto, int indice) =>
                const SizedBox(height: 10),
            itemBuilder: (BuildContext contexto, int indice) {
              if (indice == 0) {
                return Card(
                  child: Padding(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: <Widget>[
                        const Rotulo('Paletas disponibles'),
                        const SizedBox(height: 6),
                        Cifra(miles(datos.total), tamano: 36),
                      ],
                    ),
                  ),
                );
              }

              return _FilaSabor(sabor: datos.sabores[indice - 1]);
            },
          ),
        ),
      ),
    );
  }

  Future<void> _buscarLote(BuildContext contexto, WidgetRef ref) async {
    final TextEditingController codigo = TextEditingController();

    await showModalBottomSheet<void>(
      context: contexto,
      isScrollControlled: true,
      builder: (BuildContext hoja) => Padding(
        padding: EdgeInsets.only(
          left: 20,
          right: 20,
          top: 20,
          bottom: MediaQuery.of(hoja).viewInsets.bottom + 20,
        ),
        child: _BuscadorDeLote(codigo: codigo, ref: ref),
      ),
    );

    codigo.dispose();
  }
}

class _BuscadorDeLote extends StatefulWidget {
  const _BuscadorDeLote({required this.codigo, required this.ref});

  final TextEditingController codigo;
  final WidgetRef ref;

  @override
  State<_BuscadorDeLote> createState() => _BuscadorDeLoteState();
}

class _BuscadorDeLoteState extends State<_BuscadorDeLote> {
  Lote? _lote;
  String _error = '';
  bool _buscando = false;

  Future<void> _buscar() async {
    final String codigo = widget.codigo.text.trim().toUpperCase();

    if (codigo.isEmpty) {
      return;
    }

    setState(() {
      _buscando = true;
      _error = '';
      _lote = null;
    });

    try {
      final Lote lote =
          await widget.ref.read(repositorioProvider).lotePorCodigo(codigo);

      setState(() => _lote = lote);
    } on FalloApi catch (fallo) {
      setState(() => _error = fallo.mensaje);
    } finally {
      if (mounted) {
        setState(() => _buscando = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final Lote? lote = _lote;

    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: <Widget>[
        const Text(
          'Buscar un lote',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w600,
            color: Paleta.tinta,
          ),
        ),
        const SizedBox(height: 4),
        const Text(
          'Escribe el código impreso en la bolsa.',
          style: TextStyle(color: Paleta.tenue),
        ),
        const SizedBox(height: 16),
        TextField(
          controller: widget.codigo,
          textCapitalization: TextCapitalization.characters,
          decoration: const InputDecoration(labelText: 'Código de lote'),
          onSubmitted: (String _) => _buscar(),
        ),
        const SizedBox(height: 14),
        FilledButton(
          onPressed: _buscando ? null : _buscar,
          child: const Text('Buscar'),
        ),
        if (_error.isNotEmpty) ...<Widget>[
          const SizedBox(height: 14),
          Text(_error, style: const TextStyle(color: Paleta.granate)),
        ],
        if (lote != null) ...<Widget>[
          const SizedBox(height: 18),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Paleta.helado.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: Paleta.helado),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Cifra(lote.codigo, tamano: 20, tono: Paleta.marino),
                const SizedBox(height: 6),
                Text(lote.sabor),
                const SizedBox(height: 2),
                Text(
                  'producido el ${fechaLarga(lote.fechaProduccion)}, '
                  'hace ${diasDesde(lote.fechaProduccion)} días',
                  style: const TextStyle(color: Paleta.tenue, fontSize: 12),
                ),
                const SizedBox(height: 12),
                Text(
                  'Quedan ${lote.stockRestante} de ${lote.cantidadIngresada} '
                  'que ingresaron',
                  style: const TextStyle(fontWeight: FontWeight.w500),
                ),
                const SizedBox(height: 4),
                Text(
                  'Producido por ${lote.responsable}',
                  style: const TextStyle(color: Paleta.tenue, fontSize: 12),
                ),
              ],
            ),
          ),
        ],
      ],
    );
  }
}

class _FilaSabor extends StatelessWidget {
  const _FilaSabor({required this.sabor});

  final StockSabor sabor;

  @override
  Widget build(BuildContext context) {
    final Color tono = tonoDelEstado(sabor.estado);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Expanded(
                  child: Text(
                    sabor.nombre,
                    style: const TextStyle(
                      fontWeight: FontWeight.w500,
                      color: Paleta.tinta,
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Cifra('${sabor.stock}', tamano: 24, tono: tono),
              ],
            ),
            const SizedBox(height: 10),
            BarraStock(
              stock: sabor.stock,
              minimo: sabor.stockMinimo,
              tono: tono,
            ),
            const SizedBox(height: 10),
            Row(
              children: <Widget>[
                Etiqueta(
                  Etiquetas.estadoStock[sabor.estado] ?? sabor.estado,
                  tono: tono,
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    'mínimo ${sabor.stockMinimo}   ${sabor.lotesAbiertos} lotes',
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
