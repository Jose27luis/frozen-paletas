import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:uuid/uuid.dart';

import '../datos/escritor.dart';
import '../datos/fallo_api.dart';
import '../dominio/modelos.dart';
import '../nucleo/formato.dart';
import '../nucleo/proveedores.dart';
import '../nucleo/tema.dart';
import '../ui/barras.dart';
import '../ui/detalle.dart';
import '../ui/filtros.dart';
import '../ui/pantalla.dart';
import '../ui/piezas.dart';

enum _Vista { registro, resumen, causas }

class PantallaMermas extends ConsumerStatefulWidget {
  const PantallaMermas({super.key});

  @override
  ConsumerState<PantallaMermas> createState() => _PantallaMermasState();
}

class _PantallaMermasState extends ConsumerState<PantallaMermas> {
  _Vista _vista = _Vista.registro;

  @override
  Widget build(BuildContext context) {
    final Usuario? usuario = ref.watch(sesionProvider).value;
    final bool puede = usuario?.puede(Permisos.registrarMermas) ?? false;

    return Pantalla(
      titulo: 'Mermas',
      filtros: BarraDeFiltros(
        children: <Widget>[
          FilaDeChips<_Vista>(
            opciones: const <Opcion<_Vista>>[
              Opcion<_Vista>(valor: _Vista.registro, texto: 'Registro'),
              Opcion<_Vista>(valor: _Vista.resumen, texto: 'Resumen'),
              Opcion<_Vista>(valor: _Vista.causas, texto: 'Causas'),
            ],
            elegida: _vista,
            alElegir: (_Vista vista) => setState(() => _vista = vista),
          ),
          if (_vista == _Vista.registro) ...<Widget>[
            const SizedBox(height: 8),
            const _FiltroOrigen(),
          ],
          if (_vista == _Vista.resumen) ...<Widget>[
            const SizedBox(height: 8),
            const _FiltroRango(),
          ],
        ],
      ),
      flotante: puede && _vista == _Vista.registro
          ? FloatingActionButton.extended(
              backgroundColor: Paleta.marino,
              foregroundColor: Paleta.superficie,
              onPressed: () => showModalBottomSheet<void>(
                context: context,
                isScrollControlled: true,
                builder: (BuildContext hoja) =>
                    const Hoja(child: _FormularioMerma()),
              ),
              icon: const Icon(Icons.add),
              label: const Text('Registrar'),
            )
          : null,
      cuerpo: switch (_vista) {
        _Vista.registro => const _Registro(),
        _Vista.resumen => const _Resumen(),
        _Vista.causas => const _Causas(),
      },
    );
  }
}

class _FiltroOrigen extends ConsumerWidget {
  const _FiltroOrigen();

  @override
  Widget build(BuildContext context, WidgetRef ref) => FilaDeChips<String?>(
        opciones: <Opcion<String?>>[
          const Opcion<String?>(valor: null, texto: 'Todos los orígenes'),
          for (final MapEntry<String, String> fila
              in Etiquetas.origenMerma.entries)
            Opcion<String?>(valor: fila.key, texto: fila.value),
        ],
        elegida: ref.watch(filtroMermasProvider).origen,
        alElegir: (String? origen) =>
            ref.read(filtroMermasProvider.notifier).porOrigen(origen),
      );
}

class _FiltroRango extends ConsumerWidget {
  const _FiltroRango();

  @override
  Widget build(BuildContext context, WidgetRef ref) => FilaDeChips<int>(
        opciones: const <Opcion<int>>[
          Opcion<int>(valor: 7, texto: '7 días'),
          Opcion<int>(valor: 30, texto: '30 días'),
          Opcion<int>(valor: 90, texto: '90 días'),
        ],
        elegida: ref.watch(rangoProvider),
        alElegir: (int dias) => ref.read(rangoProvider.notifier).cambiar(dias),
      );
}

class _Registro extends ConsumerWidget {
  const _Registro();

  @override
  Widget build(BuildContext context, WidgetRef ref) => Cargado<List<Merma>>(
        valor: ref.watch(mermasProvider),
        alRefrescar: () => ref.invalidate(mermasProvider),
        construir: (List<Merma> filas) => filas.isEmpty
            ? const ListaVacia('No hay mermas con ese filtro.')
            : ListView.separated(
                padding: margenDeLista(context, abajo: 96),
                itemCount: filas.length,
                separatorBuilder: (BuildContext contexto, int indice) =>
                    const SizedBox(height: 10),
                itemBuilder: (BuildContext contexto, int indice) =>
                    _Ficha(merma: filas[indice]),
              ),
      );
}

class _Ficha extends StatelessWidget {
  const _Ficha({required this.merma});

  final Merma merma;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(20),
        onTap: () => abrirDetalle(
          context,
          titulo: merma.sabor,
          subtitulo: '${fechaLarga(merma.fecha)} · ${merma.causa}',
          children: <Widget>[
            FilaDetalle(
              rotulo: 'Paletas perdidas',
              valor: miles(merma.cantidad),
              tono: Paleta.granate,
            ),
            FilaDetalle(rotulo: 'Causa', valor: merma.causa),
            FilaDetalle(
              rotulo: 'Origen',
              valor: Etiquetas.origenMerma[merma.origen] ?? merma.origen,
            ),
            FilaDetalle(rotulo: 'Lote', valor: merma.lote ?? 'Sin lote'),
            FilaDetalle(
              rotulo: 'Tocó el stock',
              valor: merma.descontoStock
                  ? 'Sí, se descontó del almacén'
                  : 'No, se perdió antes de entrar',
            ),
            FilaDetalle(rotulo: 'Registró', valor: merma.responsable),
            if (merma.observacion != null)
              FilaDetalle(rotulo: 'Observación', valor: merma.observacion!),
          ],
        ),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: <Widget>[
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    Text(
                      merma.sabor,
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                        color: Paleta.tinta,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${fechaCorta(merma.fecha)} · ${merma.causa}',
                      style: const TextStyle(
                        color: Paleta.tenue,
                        fontSize: 12,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Etiqueta(
                      Etiquetas.origenMerma[merma.origen] ?? merma.origen,
                      tono: merma.descontoStock
                          ? Paleta.granate
                          : Paleta.aguajeVivo,
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              Cifra('-${miles(merma.cantidad)}',
                  tamano: 24, tono: Paleta.granate),
            ],
          ),
        ),
      ),
    );
  }
}

class _Resumen extends ConsumerWidget {
  const _Resumen();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Cargado<ResumenMermas>(
      valor: ref.watch(resumenMermasProvider),
      alRefrescar: () => ref.invalidate(resumenMermasProvider),
      construir: (ResumenMermas resumen) => ListView(
        padding: margenDeLista(context),
        children: <Widget>[
          Card(
            child: Padding(
              padding: const EdgeInsets.all(18),
              child: Row(
                children: <Widget>[
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: <Widget>[
                        const Rotulo('Paletas perdidas'),
                        const SizedBox(height: 4),
                        Cifra(
                          miles(resumen.total),
                          tamano: 32,
                          tono: Paleta.granate,
                        ),
                      ],
                    ),
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: <Widget>[
                      Etiqueta(
                        '${miles(resumen.enProceso)} en proceso',
                        tono: Paleta.aguajeVivo,
                      ),
                      const SizedBox(height: 8),
                      Etiqueta(
                        '${miles(resumen.enAlmacen)} en almacén',
                        tono: Paleta.granate,
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 20),
          const _Titulo('Por qué se perdieron'),
          const SizedBox(height: 10),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(18),
              child: Barras(
                vacio: 'No se registraron mermas en el periodo.',
                datos: <FilaBarra>[
                  for (final MermaPorCausa fila in resumen.porCausa)
                    FilaBarra(
                      rotulo: fila.causa,
                      valor: fila.cantidad,
                      apunte:
                          '${fila.registros} ${fila.registros == 1 ? 'vez' : 'veces'}',
                      tono: Paleta.granate,
                    ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 20),
          const _Titulo('Qué sabor se pierde más'),
          const SizedBox(height: 10),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(18),
              child: Barras(
                vacio: 'No se registraron mermas en el periodo.',
                datos: <FilaBarra>[
                  for (final MermaPorSabor fila in resumen.porSabor)
                    FilaBarra(
                      rotulo: fila.sabor,
                      valor: fila.cantidad,
                      tono: Paleta.aguaje,
                    ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _Titulo extends StatelessWidget {
  const _Titulo(this.texto);

  final String texto;

  @override
  Widget build(BuildContext context) => Text(
        texto,
        style: const TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.w600,
          color: Paleta.tinta,
        ),
      );
}

class _Causas extends ConsumerWidget {
  const _Causas();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Cargado<List<CausaMerma>>(
      valor: ref.watch(causasProvider),
      alRefrescar: () => ref.invalidate(causasProvider),
      construir: (List<CausaMerma> causas) => ListView(
        padding: margenDeLista(context),
        children: <Widget>[
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  const Text(
                    'Las causas explican por qué se pierde el producto.',
                    style: TextStyle(color: Paleta.tenue, fontSize: 13),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'Una causa que ya se usó no se puede borrar, solo desactivar: '
                    'el histórico perdería sentido.',
                    style: TextStyle(color: Paleta.tenue, fontSize: 12),
                  ),
                  const SizedBox(height: 14),
                  FilledButton.icon(
                    onPressed: () => _crear(context, ref),
                    icon: const Icon(Icons.add, size: 18),
                    label: const Text('Nueva causa'),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 14),
          for (final CausaMerma causa in causas)
            _FichaCausa(causa: causa),
        ],
      ),
    );
  }

  Future<void> _crear(BuildContext context, WidgetRef ref) async {
    final TextEditingController nombre = TextEditingController();
    bool pideTexto = false;

    final bool? confirmado = await showDialog<bool>(
      context: context,
      builder: (BuildContext dialogo) => StatefulBuilder(
        builder: (BuildContext contexto, StateSetter refrescar) => AlertDialog(
          title: const Text('Nueva causa'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: <Widget>[
              TextField(
                controller: nombre,
                autofocus: true,
                textCapitalization: TextCapitalization.sentences,
                decoration: const InputDecoration(labelText: 'Nombre'),
              ),
              const SizedBox(height: 10),
              CheckboxListTile(
                value: pideTexto,
                contentPadding: EdgeInsets.zero,
                controlAffinity: ListTileControlAffinity.leading,
                title: const Text(
                  'Pedir una explicación al usarla',
                  style: TextStyle(fontSize: 13),
                ),
                onChanged: (bool? marcado) =>
                    refrescar(() => pideTexto = marcado ?? false),
              ),
            ],
          ),
          actions: <Widget>[
            TextButton(
              onPressed: () => Navigator.of(dialogo).pop(false),
              child: const Text('Cancelar'),
            ),
            FilledButton(
              onPressed: () => Navigator.of(dialogo).pop(true),
              child: const Text('Crear'),
            ),
          ],
        ),
      ),
    );

    final String texto = nombre.text.trim();

    nombre.dispose();

    if (confirmado != true || texto.isEmpty) {
      return;
    }

    try {
      await ref.read(mermasRepoProvider).crearCausa(texto, pideTexto);

      ref.invalidate(causasProvider);

      if (context.mounted) {
        avisar(context, 'Causa creada');
      }
    } on FalloApi catch (fallo) {
      if (context.mounted) {
        avisar(context, fallo.mensaje, error: true);
      }
    }
  }
}

class _FichaCausa extends ConsumerWidget {
  const _FichaCausa({required this.causa});

  final CausaMerma causa;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Row(
              children: <Widget>[
                Expanded(
                  child: Text(
                    causa.nombre,
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      color: Paleta.tinta,
                    ),
                  ),
                ),
                Etiqueta(
                  causa.activa ? 'Activa' : 'Desactivada',
                  tono: causa.activa ? Paleta.hoja : Paleta.tenue,
                ),
              ],
            ),
            const SizedBox(height: 6),
            Text(
              causa.usos == 0
                  ? 'Todavía sin usar'
                  : 'Usada en ${causa.usos} ${causa.usos == 1 ? 'merma' : 'mermas'}',
              style: const TextStyle(color: Paleta.tenue, fontSize: 12),
            ),
            if (causa.requiereDescripcion) ...<Widget>[
              const SizedBox(height: 8),
              const Etiqueta('Pide explicación', tono: Paleta.marino),
            ],
            const SizedBox(height: 6),
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: <Widget>[
                TextButton(
                  onPressed: () => _alternar(context, ref),
                  child: Text(causa.activa ? 'Desactivar' : 'Activar'),
                ),
                if (causa.sePuedeEliminar)
                  TextButton(
                    style: TextButton.styleFrom(
                      foregroundColor: Paleta.granate,
                    ),
                    onPressed: () => _eliminar(context, ref),
                    child: const Text('Eliminar'),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _alternar(BuildContext context, WidgetRef ref) async {
    try {
      if (causa.activa) {
        await ref.read(mermasRepoProvider).desactivarCausa(causa.id);
      } else {
        await ref.read(mermasRepoProvider).activarCausa(causa.id);
      }

      ref.invalidate(causasProvider);
    } on FalloApi catch (fallo) {
      if (context.mounted) {
        avisar(context, fallo.mensaje, error: true);
      }
    }
  }

  Future<void> _eliminar(BuildContext context, WidgetRef ref) async {
    final bool? confirmado = await showDialog<bool>(
      context: context,
      builder: (BuildContext dialogo) => AlertDialog(
        title: const Text('Eliminar la causa'),
        content: Text('"${causa.nombre}" desaparece del catálogo.'),
        actions: <Widget>[
          TextButton(
            onPressed: () => Navigator.of(dialogo).pop(false),
            child: const Text('Cancelar'),
          ),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: Paleta.granate),
            onPressed: () => Navigator.of(dialogo).pop(true),
            child: const Text('Eliminar'),
          ),
        ],
      ),
    );

    if (confirmado != true) {
      return;
    }

    try {
      await ref.read(mermasRepoProvider).eliminarCausa(causa.id);

      ref.invalidate(causasProvider);

      if (context.mounted) {
        avisar(context, 'Causa eliminada');
      }
    } on FalloApi catch (fallo) {
      if (context.mounted) {
        avisar(context, fallo.mensaje, error: true);
      }
    }
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
  String? _loteId;
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

  CausaMerma? _causa(List<CausaMerma> causas) {
    for (final CausaMerma causa in causas) {
      if (causa.id == _causaId) {
        return causa;
      }
    }

    return null;
  }

  Future<void> _guardar(
    List<StockSabor> stock,
    List<CausaMerma> causas,
  ) async {
    final String? saborId = _saborId;
    final CausaMerma? causa = _causa(causas);

    if (saborId == null || causa == null || _paletas < 1) {
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

    if (causa.requiereDescripcion && _observacion.text.trim().isEmpty) {
      avisar(context, 'Esta causa pide una explicación.', error: true);
      return;
    }

    setState(() => _enviando = true);

    try {
      final Anotado<Merma> anotado = await ref.read(mermasRepoProvider).registrar(
            saborId: saborId,
            sabor: _nombreDe(stock, saborId),
            cantidad: _paletas,
            causaId: causa.id,
            causa: causa.nombre,
            fecha: hoyEnIso(),
            clave: const Uuid().v4(),
            loteId: _loteId,
            observacion: _observacion.text.trim(),
          );

      await ref.read(pendientesColaProvider.notifier).releer();
      refrescarDesde(ref);

      if (mounted) {
        Navigator.of(context).pop();
        avisar(
          context,
          anotado.encolado
              ? 'Sin señal: la merma quedó guardada en el celular'
              : 'Merma registrada y descontada del inventario.',
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

  String _nombreDe(List<StockSabor> stock, String saborId) {
    for (final StockSabor sabor in stock) {
      if (sabor.saborId == saborId) {
        return sabor.nombre;
      }
    }

    return 'sabor';
  }

  @override
  Widget build(BuildContext context) {
    final AsyncValue<Inventario> inventario = ref.watch(inventarioProvider);
    final AsyncValue<List<CausaMerma>> causas = ref.watch(causasProvider);
    final List<StockSabor> stock =
        inventario.value?.sabores ?? const <StockSabor>[];
    final List<CausaMerma> catalogo = causas.value ?? const <CausaMerma>[];
    final CausaMerma? elegida = _causa(catalogo);

    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
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
            'Paletas que ya estaban en el almacén y se perdieron.',
            style: TextStyle(color: Paleta.tenue, fontSize: 13),
          ),
          const SizedBox(height: 18),
          DropdownButtonFormField<String>(
            initialValue: _saborId,
            isExpanded: true,
            decoration: const InputDecoration(labelText: 'Sabor'),
            items: <DropdownMenuItem<String>>[
              for (final StockSabor sabor in stock)
                DropdownMenuItem<String>(
                  value: sabor.saborId,
                  child: Text(
                    '${sabor.nombre} (${miles(sabor.stock)})',
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
            ],
            onChanged: (String? valor) => setState(() {
              _saborId = valor;
              _loteId = null;
            }),
          ),
          const SizedBox(height: 14),
          TextField(
            controller: _cantidad,
            keyboardType: TextInputType.number,
            onChanged: (String _) => setState(() {}),
            decoration: InputDecoration(
              labelText: 'Paletas perdidas',
              helperText: _saborId == null
                  ? null
                  : 'Hay ${miles(_disponible(stock))} disponibles.',
            ),
          ),
          if (_saborId != null) ...<Widget>[
            const SizedBox(height: 14),
            _SelectorDeLote(
              saborId: _saborId!,
              loteId: _loteId,
              alElegir: (String? id) => setState(() => _loteId = id),
            ),
          ],
          const SizedBox(height: 14),
          DropdownButtonFormField<String>(
            initialValue: _causaId,
            isExpanded: true,
            decoration: const InputDecoration(labelText: 'Causa'),
            items: <DropdownMenuItem<String>>[
              for (final CausaMerma causa in catalogo)
                if (causa.activa)
                  DropdownMenuItem<String>(
                    value: causa.id,
                    child: Text(causa.nombre),
                  ),
            ],
            onChanged: (String? valor) => setState(() => _causaId = valor),
          ),
          const SizedBox(height: 14),
          TextField(
            controller: _observacion,
            textCapitalization: TextCapitalization.sentences,
            decoration: InputDecoration(
              labelText: 'Observación',
              helperText: elegida?.requiereDescripcion ?? false
                  ? 'Esta causa pide una explicación.'
                  : 'Opcional.',
            ),
          ),
          const SizedBox(height: 20),
          FilledButton(
            onPressed: _enviando ? null : () => _guardar(stock, catalogo),
            child: _enviando
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: Paleta.superficie,
                    ),
                  )
                : const Text('Registrar merma'),
          ),
          const SizedBox(height: 8),
        ],
      ),
    );
  }
}

class _SelectorDeLote extends ConsumerStatefulWidget {
  const _SelectorDeLote({
    required this.saborId,
    required this.loteId,
    required this.alElegir,
  });

  final String saborId;
  final String? loteId;
  final ValueChanged<String?> alElegir;

  @override
  ConsumerState<_SelectorDeLote> createState() => _SelectorDeLoteState();
}

class _SelectorDeLoteState extends ConsumerState<_SelectorDeLote> {
  late Future<List<Lote>> _lotes = _cargar();

  @override
  void didUpdateWidget(_SelectorDeLote anterior) {
    super.didUpdateWidget(anterior);

    if (anterior.saborId != widget.saborId) {
      setState(() => _lotes = _cargar());
    }
  }

  Future<List<Lote>> _cargar() =>
      ref.read(lotesRepoProvider).conStock(widget.saborId);

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<Lote>>(
      future: _lotes,
      builder: (BuildContext contexto, AsyncSnapshot<List<Lote>> estado) {
        final List<Lote> lotes = estado.data ?? const <Lote>[];

        if (lotes.isEmpty) {
          return const SizedBox.shrink();
        }

        return DropdownButtonFormField<String>(
          initialValue: widget.loteId,
          isExpanded: true,
          decoration: const InputDecoration(
            labelText: 'Lote',
            helperText: 'Déjalo vacío para descontar del más viejo.',
          ),
          items: <DropdownMenuItem<String>>[
            for (final Lote lote in lotes)
              DropdownMenuItem<String>(
                value: lote.id,
                child: Text('${lote.codigo} (${miles(lote.stockRestante)})'),
              ),
          ],
          onChanged: widget.alElegir,
        );
      },
    );
  }
}
