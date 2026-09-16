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

const List<String> _tiposConDestino = <String>[
  'PDV',
  'MAYORISTA',
  'DELIVERY',
  'FERIA',
];

const List<String> _canalesPorMayor = <String>['PDV', 'MAYORISTA'];

class PantallaSalidas extends ConsumerWidget {
  const PantallaSalidas({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final AsyncValue<List<Salida>> salidas = ref.watch(salidasProvider);
    final Usuario? usuario = ref.watch(sesionProvider).value;
    final bool puede = usuario?.puede(Permisos.registrarSalidas) ?? false;

    return Scaffold(
      drawer: const MenuLateral(),
      appBar: AppBar(title: const Text('Salidas')),
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
                  child: const _FormularioSalida(),
                ),
              ),
              icon: const Icon(Icons.add),
              label: const Text('Registrar'),
            )
          : null,
      body: salidas.when(
        loading: () => const Cargando(),
        error: (Object error, StackTrace rastro) => Fallo(
          mensaje: error.toString(),
          reintentar: () => ref.invalidate(salidasProvider),
        ),
        data: (List<Salida> filas) => RefreshIndicator(
          onRefresh: () async => refrescarTodo(ref),
          child: filas.isEmpty
              ? ListView(
                  children: const <Widget>[
                    SizedBox(height: 80),
                    Vacio('Todavía no hay salidas registradas.'),
                  ],
                )
              : ListView.separated(
                  padding: const EdgeInsets.fromLTRB(16, 16, 16, 96),
                  itemCount: filas.length,
                  separatorBuilder: (BuildContext contexto, int indice) =>
                      const SizedBox(height: 10),
                  itemBuilder: (BuildContext contexto, int indice) {
                    final Salida salida = filas[indice];

                    return Card(
                      child: ListTile(
                        title: Text(
                          salida.destino ??
                              salida.motivo ??
                              Etiquetas.tipoSalida[salida.tipo] ??
                              salida.tipo,
                        ),
                        subtitle: Text(
                          '${fechaCorta(salida.fecha)}   '
                          '${Etiquetas.tipoSalida[salida.tipo] ?? salida.tipo}',
                        ),
                        trailing: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: <Widget>[
                            Cifra(
                              '−${salida.cantidadTotal}',
                              tamano: 18,
                              tono: Paleta.aguaje,
                            ),
                            Text(
                              soles(salida.importe),
                              style: const TextStyle(
                                color: Paleta.tenue,
                                fontSize: 12,
                              ),
                            ),
                          ],
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

class _FormularioSalida extends ConsumerStatefulWidget {
  const _FormularioSalida();

  @override
  ConsumerState<_FormularioSalida> createState() => _FormularioSalidaState();
}

class _FormularioSalidaState extends ConsumerState<_FormularioSalida> {
  final TextEditingController _cantidad = TextEditingController();
  final TextEditingController _motivo = TextEditingController();

  String _tipo = 'PDV';
  String _lista = 'MAYOR';
  String? _destinoId;
  String? _saborId;
  bool _enviando = false;

  @override
  void dispose() {
    _cantidad.dispose();
    _motivo.dispose();
    super.dispose();
  }

  bool get _pideDestino => _tiposConDestino.contains(_tipo);

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

    if (saborId == null || _paletas < 1) {
      avisar(context, 'Elige el sabor y la cantidad.', error: true);
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

    if (_destinoId == null && _motivo.text.trim().length < 5) {
      avisar(context, 'Sin destino hay que explicar a dónde va.', error: true);
      return;
    }

    setState(() => _enviando = true);

    try {
      final Salida salida = await ref.read(repositorioProvider).registrarSalida(
            tipo: _tipo,
            listaPrecios: _lista,
            saborId: saborId,
            cantidad: _paletas,
            fecha: hoyEnIso(),
            clave: const Uuid().v4(),
            destinoId: _destinoId,
            motivo: _motivo.text.trim(),
          );

      if (mounted) {
        Navigator.of(context).pop();
        avisar(context, 'Salieron ${salida.cantidadTotal} paletas.');
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
    final AsyncValue<List<Destino>> destinos = ref.watch(destinosProvider);
    final List<StockSabor> stock = inventario.value?.sabores ?? <StockSabor>[];

    return Padding(
      padding: const EdgeInsets.all(20),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: <Widget>[
            const Text(
              'Registrar salida',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: Paleta.tinta,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              'Se cobra con la lista ${Etiquetas.listaPrecios[_lista]?.toLowerCase()}. '
              'El descuento sale del lote más antiguo.',
              style: const TextStyle(color: Paleta.tenue),
            ),
            const SizedBox(height: 18),
            DropdownButtonFormField<String>(
              initialValue: _tipo,
              decoration: const InputDecoration(labelText: 'Tipo de salida'),
              items: <DropdownMenuItem<String>>[
                for (final MapEntry<String, String> tipo
                    in Etiquetas.tipoSalida.entries)
                  DropdownMenuItem<String>(
                    value: tipo.key,
                    child: Text(tipo.value),
                  ),
              ],
              onChanged: (String? valor) => setState(() {
                _tipo = valor ?? 'PDV';
                _lista = _canalesPorMayor.contains(_tipo) ? 'MAYOR' : 'UNIDAD';
                _destinoId = null;
              }),
            ),
            const SizedBox(height: 14),
            DropdownButtonFormField<String>(
              initialValue: _lista,
              decoration: const InputDecoration(labelText: 'Lista de precios'),
              items: <DropdownMenuItem<String>>[
                for (final MapEntry<String, String> lista
                    in Etiquetas.listaPrecios.entries)
                  DropdownMenuItem<String>(
                    value: lista.key,
                    child: Text(lista.value),
                  ),
              ],
              onChanged: (String? valor) =>
                  setState(() => _lista = valor ?? 'UNIDAD'),
            ),
            if (_pideDestino) ...<Widget>[
              const SizedBox(height: 14),
              destinos.when(
                loading: () => const LinearProgressIndicator(),
                error: (Object error, StackTrace rastro) => Text(
                  error.toString(),
                  style: const TextStyle(color: Paleta.granate),
                ),
                data: (List<Destino> lista) {
                  final List<Destino> propios = lista
                      .where((Destino destino) => destino.tipo == _tipo)
                      .toList(growable: false);

                  if (propios.isEmpty) {
                    return const Text(
                      'No hay destinos de ese tipo. Créalos desde la web y '
                      'mientras tanto explica el motivo.',
                      style: TextStyle(color: Paleta.tenue, fontSize: 12),
                    );
                  }

                  return DropdownButtonFormField<String>(
                    initialValue: _destinoId,
                    decoration: const InputDecoration(labelText: 'Destino'),
                    items: <DropdownMenuItem<String>>[
                      for (final Destino destino in propios)
                        DropdownMenuItem<String>(
                          value: destino.id,
                          child: Text(destino.nombre),
                        ),
                    ],
                    onChanged: (String? valor) =>
                        setState(() => _destinoId = valor),
                  );
                },
              ),
            ],
            if (_destinoId == null) ...<Widget>[
              const SizedBox(height: 14),
              TextField(
                controller: _motivo,
                decoration: const InputDecoration(
                  labelText: 'Motivo',
                  helperText: 'Explica a dónde va el producto.',
                ),
              ),
            ],
            const SizedBox(height: 14),
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
                labelText: 'Cantidad',
                helperText: _saborId == null
                    ? 'Elige primero el sabor.'
                    : 'Quedan ${_disponible(stock)} paletas.',
              ),
              onChanged: (String _) => setState(() {}),
            ),
            const SizedBox(height: 20),
            FilledButton(
              onPressed: _enviando ? null : () => _guardar(stock),
              child: const Text('Registrar salida'),
            ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }
}
