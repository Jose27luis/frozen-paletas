import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:uuid/uuid.dart';

import '../datos/escritor.dart';
import '../datos/fallo_api.dart';
import '../dominio/modelos.dart';
import '../nucleo/formato.dart';
import '../nucleo/proveedores.dart';
import '../nucleo/tema.dart';
import '../ui/detalle.dart';
import '../ui/filtros.dart';
import '../ui/pantalla.dart';
import '../ui/piezas.dart';

enum _Vista { pendientes, historial }

class PantallaProduccion extends ConsumerStatefulWidget {
  const PantallaProduccion({super.key});

  @override
  ConsumerState<PantallaProduccion> createState() => _PantallaProduccionState();
}

class _PantallaProduccionState extends ConsumerState<PantallaProduccion> {
  _Vista _vista = _Vista.pendientes;

  @override
  Widget build(BuildContext context) {
    final Usuario? usuario = ref.watch(sesionProvider).value;
    final bool puede = usuario?.puede(Permisos.registrarProduccion) ?? false;

    return Pantalla(
      titulo: 'Producción',
      filtros: BarraDeFiltros(
        children: <Widget>[
          FilaDeChips<_Vista>(
            opciones: const <Opcion<_Vista>>[
              Opcion<_Vista>(
                valor: _Vista.pendientes,
                texto: 'Falta embolsar',
              ),
              Opcion<_Vista>(valor: _Vista.historial, texto: 'Historial'),
            ],
            elegida: _vista,
            alElegir: (_Vista vista) => setState(() => _vista = vista),
          ),
        ],
      ),
      flotante: puede
          ? FloatingActionButton.extended(
              backgroundColor: Paleta.marino,
              foregroundColor: Paleta.superficie,
              onPressed: () => _registrar(context),
              icon: const Icon(Icons.add),
              label: const Text('Registrar'),
            )
          : null,
      cuerpo: _vista == _Vista.pendientes
          ? _pendientes(puede)
          : _historial(puede),
    );
  }

  Widget _pendientes(bool puede) => Cargado<List<Produccion>>(
        valor: ref.watch(pendientesProvider),
        alRefrescar: () => ref.invalidate(pendientesProvider),
        construir: (List<Produccion> filas) => filas.isEmpty
            ? const ListaVacia(
                'No hay producciones esperando su conteo de embolsado.',
              )
            : ListView.separated(
                padding: margenDeLista(context, abajo: 96),
                itemCount: filas.length,
                separatorBuilder: (BuildContext contexto, int indice) =>
                    const SizedBox(height: 10),
                itemBuilder: (BuildContext contexto, int indice) =>
                    _TarjetaPendiente(
                  produccion: filas[indice],
                  puedeEmbolsar: puede,
                ),
              ),
      );

  Widget _historial(bool puede) => Cargado<List<Produccion>>(
        valor: ref.watch(produccionesProvider),
        alRefrescar: () => ref.invalidate(produccionesProvider),
        construir: (List<Produccion> filas) => filas.isEmpty
            ? const ListaVacia('Todavía no se registró ninguna producción.')
            : ListView.separated(
                padding: margenDeLista(context, abajo: 96),
                itemCount: filas.length,
                separatorBuilder: (BuildContext contexto, int indice) =>
                    const SizedBox(height: 10),
                itemBuilder: (BuildContext contexto, int indice) => _FilaHistorial(
                  produccion: filas[indice],
                  puedeAnular: puede,
                ),
              ),
      );

  Future<void> _registrar(BuildContext contexto) => showModalBottomSheet<void>(
        context: contexto,
        isScrollControlled: true,
        builder: (BuildContext hoja) =>
            const Hoja(child: _FormularioProduccion()),
      );
}

class _FilaHistorial extends ConsumerWidget {
  const _FilaHistorial({required this.produccion, required this.puedeAnular});

  final Produccion produccion;
  final bool puedeAnular;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final Color tono = _tonoDeLaProduccion(produccion.estado);
    final bool anulable = puedeAnular && produccion.estado != 'ANULADA';

    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(20),
        onTap: () => _abrir(context, ref),
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
                            fontSize: 15,
                            fontWeight: FontWeight.w600,
                            color: Paleta.tinta,
                          ),
                        ),
                        const SizedBox(height: 3),
                        Text(
                          '${fechaCorta(produccion.fecha)} · ${produccion.lote ?? 'sin lote'}',
                          style: const TextStyle(
                            color: Paleta.tenue,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Etiqueta(
                    Etiquetas.estadoProduccion[produccion.estado] ??
                        produccion.estado,
                    tono: tono,
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: <Widget>[
                  Expanded(
                    child: _Dato(
                      rotulo: 'Del balde',
                      valor: miles(produccion.cantidadObtenida),
                    ),
                  ),
                  Expanded(
                    child: _Dato(
                      rotulo: 'Al stock',
                      valor: produccion.cantidadEmbolsada == null
                          ? 'pendiente'
                          : miles(produccion.cantidadEmbolsada!),
                    ),
                  ),
                  Expanded(
                    child: _Dato(
                      rotulo: 'Merma',
                      valor: produccion.merma == null
                          ? '—'
                          : miles(produccion.merma!),
                      tono: (produccion.merma ?? 0) > 0
                          ? Paleta.granate
                          : Paleta.tinta,
                    ),
                  ),
                ],
              ),
              if (anulable) ...<Widget>[
                const SizedBox(height: 6),
                Align(
                  alignment: Alignment.centerRight,
                  child: TextButton.icon(
                    style: TextButton.styleFrom(
                      foregroundColor: Paleta.granate,
                    ),
                    onPressed: () => anularProduccion(context, ref, produccion),
                    icon: const Icon(Icons.block, size: 18),
                    label: const Text('Anular'),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _abrir(BuildContext context, WidgetRef ref) => abrirDetalle(
        context,
        titulo: produccion.sabor,
        subtitulo:
            '${fechaLarga(produccion.fecha)} · ${produccion.lote ?? 'sin lote'}',
        children: <Widget>[
          FilaDetalle(
            rotulo: 'Estado',
            valor: Etiquetas.estadoProduccion[produccion.estado] ??
                produccion.estado,
            tono: _tonoDeLaProduccion(produccion.estado),
          ),
          FilaDetalle(
            rotulo: 'Salió del balde',
            valor: '${miles(produccion.cantidadObtenida)} paletas',
          ),
          FilaDetalle(
            rotulo: 'Entró al stock',
            valor: produccion.cantidadEmbolsada == null
                ? 'Todavía sin embolsar'
                : '${miles(produccion.cantidadEmbolsada!)} paletas',
          ),
          FilaDetalle(
            rotulo: 'Se perdieron',
            valor: produccion.merma == null
                ? '—'
                : '${miles(produccion.merma!)} paletas',
            tono: (produccion.merma ?? 0) > 0 ? Paleta.granate : Paleta.tinta,
          ),
          FilaDetalle(rotulo: 'Responsable', valor: produccion.responsable),
          if (produccion.motivoAnulacion != null)
            FilaDetalle(
              rotulo: 'Motivo de anulación',
              valor: produccion.motivoAnulacion!,
              tono: Paleta.granate,
            ),
        ],
      );
}

Future<void> anularProduccion(
  BuildContext context,
  WidgetRef ref,
  Produccion produccion,
) async {
  final TextEditingController motivo = TextEditingController();

  final String? razon = await showDialog<String>(
    context: context,
    builder: (BuildContext dialogo) => AlertDialog(
      title: const Text('Anular la producción'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Text(
            'Se revierte el ingreso de ${produccion.sabor} y su lote queda sin stock. '
            'El registro no se borra, queda anulado.',
            style: const TextStyle(color: Paleta.tenue, fontSize: 13),
          ),
          const SizedBox(height: 14),
          TextField(
            controller: motivo,
            autofocus: true,
            maxLines: 2,
            decoration: const InputDecoration(
              labelText: 'Motivo',
              helperText: 'Mínimo 5 caracteres',
            ),
          ),
        ],
      ),
      actions: <Widget>[
        TextButton(
          onPressed: () => Navigator.of(dialogo).pop(),
          child: const Text('Cancelar'),
        ),
        FilledButton(
          style: FilledButton.styleFrom(backgroundColor: Paleta.granate),
          onPressed: () => Navigator.of(dialogo).pop(motivo.text),
          child: const Text('Anular'),
        ),
      ],
    ),
  );

  motivo.dispose();

  if (razon == null || razon.trim().length < 5) {
    return;
  }

  try {
    await ref.read(produccionRepoProvider).anular(produccion.id, razon.trim());

    refrescarDesde(ref);

    if (context.mounted) {
      avisar(context, 'Producción anulada');
    }
  } on FalloApi catch (fallo) {
    if (context.mounted) {
      avisar(context, fallo.mensaje, error: true);
    }
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
          Cifra(valor, tamano: 18, tono: tono),
        ],
      );
}

Color _tonoDeLaProduccion(String estado) => switch (estado) {
      'EMBOLSADA' => Paleta.hoja,
      'REGISTRADA' => Paleta.aguajeVivo,
      _ => Paleta.tenue,
    };

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
      final Anotado<Produccion> anotado =
          await ref.read(produccionRepoProvider).embolsar(
                id: widget.produccion.id,
                sabor: widget.produccion.sabor,
                cantidadEmbolsada: _embolsada,
                causaId: _causaId,
              );

      await ref.read(pendientesColaProvider.notifier).releer();
      refrescarDesde(ref);

      if (mounted) {
        avisar(
          context,
          anotado.encolado
              ? 'Sin señal: el embolsado quedó guardado en el celular'
              : 'Las paletas ya están en el stock.',
        );
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
                          if (causa.activa)
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
      final List<Sabor> catalogo =
          ref.read(saboresProvider).value ?? const <Sabor>[];
      final Sabor sabor = catalogo.firstWhere(
        (Sabor cada) => cada.id == saborId,
      );

      final Anotado<Produccion> anotado =
          await ref.read(produccionRepoProvider).registrar(
                saborId: saborId,
                sabor: sabor.nombre,
                cantidadObtenida: cantidad,
                fecha: hoyEnIso(),
                clave: const Uuid().v4(),
              );

      await ref.read(pendientesColaProvider.notifier).releer();
      refrescarDesde(ref);

      if (mounted) {
        Navigator.of(context).pop();
        avisar(
          context,
          anotado.encolado
              ? 'Sin señal: la producción quedó guardada en el celular'
              : 'Lote ${anotado.valor?.lote ?? ''} registrado.',
        );
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

    return SingleChildScrollView(
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
