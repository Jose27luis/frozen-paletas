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

class PantallaProduccion extends ConsumerWidget {
  const PantallaProduccion({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final AsyncValue<List<Produccion>> pendientes =
        ref.watch(pendientesProvider);
    final Usuario? usuario = ref.watch(sesionProvider).value;
    final bool puede = usuario?.puede(Permisos.registrarProduccion) ?? false;

    return Scaffold(
      drawer: const MenuLateral(),
      appBar: AppBar(title: const Text('Producción')),
      floatingActionButton: puede
          ? FloatingActionButton.extended(
              backgroundColor: Paleta.marino,
              foregroundColor: Paleta.superficie,
              onPressed: () => _registrar(context, ref),
              icon: const Icon(Icons.add),
              label: const Text('Registrar'),
            )
          : null,
      body: pendientes.when(
        loading: () => const Cargando(),
        error: (Object error, StackTrace rastro) => Fallo(
          mensaje: error.toString(),
          reintentar: () => ref.invalidate(pendientesProvider),
        ),
        data: (List<Produccion> filas) => RefreshIndicator(
          onRefresh: () async => refrescarTodo(ref),
          child: ListView(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 96),
            children: <Widget>[
              const Text(
                'Falta embolsar',
                style: TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.w600,
                  color: Paleta.tinta,
                ),
              ),
              const SizedBox(height: 4),
              const Text(
                'Estas producciones todavía no suman al inventario.',
                style: TextStyle(color: Paleta.tenue),
              ),
              const SizedBox(height: 12),
              if (filas.isEmpty)
                const Card(
                  child: Vacio('Todo lo producido ya pasó por el conteo.'),
                )
              else
                for (final Produccion fila in filas)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: _TarjetaPendiente(
                      produccion: fila,
                      puedeEmbolsar: puede,
                    ),
                  ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _registrar(BuildContext contexto, WidgetRef ref) =>
      showModalBottomSheet<void>(
        context: contexto,
        isScrollControlled: true,
        builder: (BuildContext hoja) => Padding(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(hoja).viewInsets.bottom,
          ),
          child: const _FormularioProduccion(),
        ),
      );
}

class _TarjetaPendiente extends ConsumerStatefulWidget {
  const _TarjetaPendiente({
    required this.produccion,
    required this.puedeEmbolsar,
  });

  final Produccion produccion;
  final bool puedeEmbolsar;

  @override
  ConsumerState<_TarjetaPendiente> createState() => _TarjetaPendienteState();
}

class _TarjetaPendienteState extends ConsumerState<_TarjetaPendiente> {
  late final TextEditingController _cantidad = TextEditingController(
    text: '${widget.produccion.cantidadObtenida}',
  );

  bool _abierta = false;
  bool _enviando = false;
  String? _causaId;

  @override
  void dispose() {
    _cantidad.dispose();
    super.dispose();
  }

  int get _embolsada => int.tryParse(_cantidad.text) ?? 0;

  bool get _hayMerma => _embolsada < widget.produccion.cantidadObtenida;

  Future<void> _embolsar() async {
    if (_hayMerma && _causaId == null) {
      avisar(context, 'Falta la causa de las paletas perdidas.', error: true);
      return;
    }

    setState(() => _enviando = true);

    try {
      await ref.read(repositorioProvider).registrarEmbolsado(
            id: widget.produccion.id,
            cantidadEmbolsada: _embolsada,
            causaId: _causaId,
          );

      if (mounted) {
        avisar(context, 'Las paletas ya están en el stock.');
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
    final Produccion produccion = widget.produccion;
    final int espera = diasDesde(produccion.fecha);
    final AsyncValue<List<CausaMerma>> causas = ref.watch(causasProvider);

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
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: <Widget>[
                      Text(
                        produccion.sabor,
                        style: const TextStyle(
                          fontWeight: FontWeight.w600,
                          color: Paleta.tinta,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '${fechaCorta(produccion.fecha)}   ${produccion.responsable}',
                        style: const TextStyle(
                          color: Paleta.tenue,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: <Widget>[
                    Cifra('${produccion.cantidadObtenida}', tamano: 22),
                    const Text(
                      'del balde',
                      style: TextStyle(color: Paleta.tenue, fontSize: 11),
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 12),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Paleta.hundido,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Cifra(
                    produccion.lote ?? 'Sin lote',
                    tamano: 18,
                    tono: Paleta.marino,
                  ),
                  const SizedBox(height: 2),
                  const Text(
                    'Código para rotular las bolsas',
                    style: TextStyle(color: Paleta.tenue, fontSize: 11),
                  ),
                ],
              ),
            ),
            if (espera >= 1) ...<Widget>[
              const SizedBox(height: 10),
              Etiqueta('Esperando $espera días', tono: Paleta.aguajeVivo),
            ],
            if (widget.puedeEmbolsar) ...<Widget>[
              const SizedBox(height: 12),
              if (!_abierta)
                OutlinedButton(
                  onPressed: () => setState(() => _abierta = true),
                  child: const Text('Registrar embolsado'),
                )
              else ...<Widget>[
                TextField(
                  controller: _cantidad,
                  keyboardType: TextInputType.number,
                  decoration: InputDecoration(
                    labelText: 'Paletas embolsadas y aptas',
                    helperText:
                        'Como máximo ${produccion.cantidadObtenida}, que salieron del balde.',
                  ),
                  onChanged: (String _) => setState(() {}),
                ),
                if (_hayMerma) ...<Widget>[
                  const SizedBox(height: 12),
                  causas.when(
                    loading: () => const LinearProgressIndicator(),
                    error: (Object error, StackTrace rastro) => Text(
                      error.toString(),
                      style: const TextStyle(color: Paleta.granate),
                    ),
                    data: (List<CausaMerma> lista) =>
                        DropdownButtonFormField<String>(
                      initialValue: _causaId,
                      decoration: const InputDecoration(
                        labelText: 'Causa de las paletas perdidas',
                      ),
                      items: <DropdownMenuItem<String>>[
                        for (final CausaMerma causa in lista)
                          DropdownMenuItem<String>(
                            value: causa.id,
                            child: Text(causa.nombre),
                          ),
                      ],
                      onChanged: (String? valor) =>
                          setState(() => _causaId = valor),
                    ),
                  ),
                ],
                const SizedBox(height: 14),
                Row(
                  children: <Widget>[
                    Expanded(
                      child: FilledButton(
                        onPressed: _enviando ? null : _embolsar,
                        child: const Text('Ingresar al stock'),
                      ),
                    ),
                    const SizedBox(width: 10),
                    TextButton(
                      onPressed: () => setState(() => _abierta = false),
                      child: const Text('Cerrar'),
                    ),
                  ],
                ),
              ],
            ],
          ],
        ),
      ),
    );
  }
}

class _FormularioProduccion extends ConsumerStatefulWidget {
  const _FormularioProduccion();

  @override
  ConsumerState<_FormularioProduccion> createState() =>
      _FormularioProduccionState();
}

class _FormularioProduccionState extends ConsumerState<_FormularioProduccion> {
  final TextEditingController _cantidad = TextEditingController();

  String? _saborId;
  bool _enviando = false;

  @override
  void dispose() {
    _cantidad.dispose();
    super.dispose();
  }

  Future<void> _guardar() async {
    final String? saborId = _saborId;
    final int cantidad = int.tryParse(_cantidad.text) ?? 0;

    if (saborId == null || cantidad < 1) {
      avisar(context, 'Elige el sabor y las paletas obtenidas.', error: true);
      return;
    }

    setState(() => _enviando = true);

    try {
      final Produccion creada =
          await ref.read(repositorioProvider).registrarProduccion(
                saborId: saborId,
                cantidadObtenida: cantidad,
                fecha: hoyEnIso(),
                clave: const Uuid().v4(),
              );

      if (mounted) {
        Navigator.of(context).pop();
        avisar(context, 'Lote ${creada.lote ?? ''} registrado.');
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
    final AsyncValue<List<Sabor>> sabores = ref.watch(saboresProvider);

    return Padding(
      padding: const EdgeInsets.all(20),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: <Widget>[
          const Text(
            'Registrar producción',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: Paleta.tinta,
            ),
          ),
          const SizedBox(height: 4),
          const Text(
            'Lo que salió del balde, antes de embolsar.',
            style: TextStyle(color: Paleta.tenue),
          ),
          const SizedBox(height: 18),
          sabores.when(
            loading: () => const LinearProgressIndicator(),
            error: (Object error, StackTrace rastro) => Text(
              error.toString(),
              style: const TextStyle(color: Paleta.granate),
            ),
            data: (List<Sabor> lista) => DropdownButtonFormField<String>(
              initialValue: _saborId,
              decoration: const InputDecoration(labelText: 'Sabor'),
              items: <DropdownMenuItem<String>>[
                for (final Sabor sabor in lista)
                  DropdownMenuItem<String>(
                    value: sabor.id,
                    child: Text(sabor.nombre),
                  ),
              ],
              onChanged: (String? valor) => setState(() => _saborId = valor),
            ),
          ),
          const SizedBox(height: 14),
          TextField(
            controller: _cantidad,
            keyboardType: TextInputType.number,
            decoration: const InputDecoration(
              labelText: 'Paletas obtenidas',
              helperText: 'Un balde rinde unas 150 paletas.',
            ),
          ),
          const SizedBox(height: 20),
          FilledButton(
            onPressed: _enviando ? null : _guardar,
            child: const Text('Registrar producción'),
          ),
          const SizedBox(height: 8),
        ],
      ),
    );
  }
}
