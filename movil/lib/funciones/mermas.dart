import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:uuid/uuid.dart';

import '../datos/fallo_api.dart';
import '../dominio/modelos.dart';
import '../nucleo/formato.dart';
import '../nucleo/proveedores.dart';
import '../nucleo/tema.dart';
import '../ui/menu_lateral.dart';
import '../ui/piezas.dart';

class PantallaMermas extends ConsumerWidget {
  const PantallaMermas({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final AsyncValue<List<Merma>> mermas = ref.watch(mermasProvider);
    final Usuario? usuario = ref.watch(sesionProvider).value;
    final bool puede = usuario?.puede(Permisos.registrarMermas) ?? false;

    return Scaffold(
      drawer: const MenuLateral(),
      appBar: AppBar(title: const Text('Mermas')),
      floatingActionButton: puede
          ? FloatingActionButton.extended(
              backgroundColor: Paleta.marino,
              foregroundColor: Paleta.superficie,
              onPressed: () => showModalBottomSheet<void>(
                context: context,
                isScrollControlled: true,
                builder: (BuildContext hoja) => Padding(
                  padding: EdgeInsets.only(
                    bottom: MediaQuery.of(hoja).viewInsets.bottom,
                  ),
                  child: const _FormularioMerma(),
                ),
              ),
              icon: const Icon(Icons.add),
              label: const Text('Registrar'),
            )
          : null,
      body: mermas.when(
        loading: () => const Cargando(),
        error: (Object error, StackTrace rastro) => Fallo(
          mensaje: error.toString(),
          reintentar: () => ref.invalidate(mermasProvider),
        ),
        data: (List<Merma> filas) => RefreshIndicator(
          onRefresh: () async => refrescarTodo(ref),
          child: filas.isEmpty
              ? ListView(
                  children: const <Widget>[
                    SizedBox(height: 80),
                    Vacio('Todavía no hay mermas registradas.'),
                  ],
                )
              : ListView.separated(
                  padding: const EdgeInsets.fromLTRB(16, 16, 16, 96),
                  itemCount: filas.length,
                  separatorBuilder: (BuildContext contexto, int indice) =>
                      const SizedBox(height: 10),
                  itemBuilder: (BuildContext contexto, int indice) {
                    final Merma merma = filas[indice];

                    return Card(
                      child: ListTile(
                        title: Text(merma.sabor),
                        subtitle: Text(
                          '${fechaCorta(merma.fecha)}   ${merma.causa}\n'
                          '${Etiquetas.origenMerma[merma.origen] ?? merma.origen}',
                        ),
                        isThreeLine: true,
                        trailing: Cifra(
                          '−${merma.cantidad}',
                          tamano: 18,
                          tono: Paleta.granate,
                        ),
                      ),
                    );
                  },
                ),
        ),
      ),
    );
  }
}

class _FormularioMerma extends ConsumerStatefulWidget {
  const _FormularioMerma();

  @override
  ConsumerState<_FormularioMerma> createState() => _FormularioMermaState();
}

class _FormularioMermaState extends ConsumerState<_FormularioMerma> {
  final TextEditingController _cantidad = TextEditingController();
  final TextEditingController _observacion = TextEditingController();

  String? _saborId;
  String? _causaId;
  bool _enviando = false;

  @override
  void dispose() {
    _cantidad.dispose();
    _observacion.dispose();
    super.dispose();
  }

  int get _paletas => int.tryParse(_cantidad.text) ?? 0;

  int _disponible(List<StockSabor> stock) {
    final String? saborId = _saborId;

    if (saborId == null) {
      return 0;
    }

    for (final StockSabor sabor in stock) {
      if (sabor.saborId == saborId) {
        return sabor.stock;
      }
    }

    return 0;
  }

  Future<void> _guardar(List<StockSabor> stock) async {
    final String? saborId = _saborId;
    final String? causaId = _causaId;

    if (saborId == null || causaId == null || _paletas < 1) {
      avisar(context, 'Completa el sabor, la cantidad y la causa.', error: true);
      return;
    }

    if (_paletas > _disponible(stock)) {
      avisar(
        context,
        'Solo quedan ${_disponible(stock)} paletas de ese sabor.',
        error: true,
      );
      return;
    }

    setState(() => _enviando = true);

    try {
      await ref.read(repositorioProvider).registrarMerma(
            saborId: saborId,
            cantidad: _paletas,
            causaId: causaId,
            fecha: hoyEnIso(),
            clave: const Uuid().v4(),
            observacion: _observacion.text.trim(),
          );

      if (mounted) {
        Navigator.of(context).pop();
        avisar(context, 'Merma registrada y descontada del inventario.');
        refrescarTodo(ref);
      }
    } on FalloApi catch (fallo) {
      if (mounted) {
        avisar(context, fallo.mensaje, error: true);
      }
    } finally {
      if (mounted) {
        setState(() => _enviando = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final AsyncValue<Inventario> inventario = ref.watch(inventarioProvider);
    final AsyncValue<List<CausaMerma>> causas = ref.watch(causasProvider);
    final List<StockSabor> stock = inventario.value?.sabores ?? <StockSabor>[];

    return Padding(
      padding: const EdgeInsets.all(20),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: <Widget>[
            const Text(
              'Registrar merma',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: Paleta.tinta,
              ),
            ),
            const SizedBox(height: 4),
            const Text(
              'Producto que ya estaba en almacén. Se descuenta al guardar.',
              style: TextStyle(color: Paleta.tenue),
            ),
            const SizedBox(height: 18),
            DropdownButtonFormField<String>(
              initialValue: _saborId,
              decoration: const InputDecoration(labelText: 'Sabor'),
              items: <DropdownMenuItem<String>>[
                for (final StockSabor sabor in stock)
                  DropdownMenuItem<String>(
                    value: sabor.saborId,
                    child: Text('${sabor.nombre} (${sabor.stock})'),
                  ),
              ],
              onChanged: (String? valor) => setState(() => _saborId = valor),
            ),
            const SizedBox(height: 14),
            TextField(
              controller: _cantidad,
              keyboardType: TextInputType.number,
              decoration: InputDecoration(
                labelText: 'Paletas perdidas',
                helperText: _saborId == null
                    ? 'Elige primero el sabor.'
                    : 'Quedan ${_disponible(stock)} paletas.',
              ),
              onChanged: (String _) => setState(() {}),
            ),
            const SizedBox(height: 14),
            causas.when(
              loading: () => const LinearProgressIndicator(),
              error: (Object error, StackTrace rastro) => Text(
                error.toString(),
                style: const TextStyle(color: Paleta.granate),
              ),
              data: (List<CausaMerma> lista) => DropdownButtonFormField<String>(
                initialValue: _causaId,
                decoration: const InputDecoration(labelText: 'Causa'),
                items: <DropdownMenuItem<String>>[
                  for (final CausaMerma causa in lista)
                    DropdownMenuItem<String>(
                      value: causa.id,
                      child: Text(causa.nombre),
                    ),
                ],
                onChanged: (String? valor) => setState(() => _causaId = valor),
              ),
            ),
            const SizedBox(height: 14),
            TextField(
              controller: _observacion,
              decoration: const InputDecoration(
                labelText: 'Observación',
                helperText: 'Obligatoria cuando la causa lo pide.',
              ),
            ),
            const SizedBox(height: 20),
            FilledButton(
              onPressed: _enviando ? null : () => _guardar(stock),
              child: const Text('Registrar merma'),
            ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }
}
