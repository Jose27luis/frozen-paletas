import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:uuid/uuid.dart';

import '../datos/escritor.dart';
import '../datos/fallo_api.dart';
import '../datos/repos/salidas_repo.dart';
import '../dominio/modelos.dart';
import '../nucleo/formato.dart';
import '../nucleo/proveedores.dart';
import '../nucleo/tema.dart';
import '../ui/detalle.dart';
import '../ui/filtros.dart';
import '../ui/pantalla.dart';
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
    final Usuario? usuario = ref.watch(sesionProvider).value;
    final bool puede = usuario?.puede(Permisos.registrarSalidas) ?? false;
    final FiltroSalidas filtro = ref.watch(filtroSalidasProvider);

    return Pantalla(
      titulo: 'Salidas',
      filtros: BarraDeFiltros(
        children: <Widget>[
          FilaDeChips<String?>(
            opciones: <Opcion<String?>>[
              const Opcion<String?>(valor: null, texto: 'Todos los canales'),
              for (final MapEntry<String, String> fila
                  in Etiquetas.tipoSalida.entries)
                Opcion<String?>(valor: fila.key, texto: fila.value),
            ],
            elegida: filtro.tipo,
            alElegir: (String? tipo) =>
                ref.read(filtroSalidasProvider.notifier).porTipo(tipo),
          ),
          const SizedBox(height: 8),
          _RangoDeFechas(filtro: filtro),
        ],
      ),
      flotante: puede
          ? FloatingActionButton.extended(
              backgroundColor: Paleta.marino,
              foregroundColor: Paleta.superficie,
              onPressed: () => showModalBottomSheet<void>(
                context: context,
                isScrollControlled: true,
                builder: (BuildContext hoja) =>
                    const Hoja(child: _FormularioSalida()),
              ),
              icon: const Icon(Icons.add),
              label: const Text('Registrar'),
            )
          : null,
      cuerpo: Cargado<List<Salida>>(
        valor: ref.watch(salidasProvider),
        alRefrescar: () => ref.invalidate(salidasProvider),
        construir: (List<Salida> filas) => filas.isEmpty
            ? const ListaVacia('No hay salidas con ese filtro.')
            : ListView.separated(
                padding: margenDeLista(context, abajo: 96),
                itemCount: filas.length + 1,
                separatorBuilder: (BuildContext contexto, int indice) =>
                    const SizedBox(height: 10),
                itemBuilder: (BuildContext contexto, int indice) => indice == 0
                    ? _Resumen(salidas: filas)
                    : _Ficha(salida: filas[indice - 1]),
              ),
      ),
    );
  }
}

class _RangoDeFechas extends ConsumerWidget {
  const _RangoDeFechas({required this.filtro});

  final FiltroSalidas filtro;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final bool hayRango = filtro.desde != null || filtro.hasta != null;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        children: <Widget>[
          Expanded(
            child: OutlinedButton.icon(
              onPressed: () => _elegir(context, ref),
              icon: const Icon(Icons.date_range_outlined, size: 18),
              label: Text(
                hayRango
                    ? '${fechaCorta('${filtro.desde}T00:00:00Z')} al ${fechaCorta('${filtro.hasta}T00:00:00Z')}'
                    : 'Todas las fechas',
              ),
            ),
          ),
          if (hayRango)
            IconButton(
              tooltip: 'Quitar el rango de fechas',
              icon: const Icon(Icons.close, color: Paleta.tenue),
              onPressed: () =>
                  ref.read(filtroSalidasProvider.notifier).enRango(null, null),
            ),
        ],
      ),
    );
  }

  Future<void> _elegir(BuildContext context, WidgetRef ref) async {
    final DateTimeRange? rango = await showDateRangePicker(
      context: context,
      firstDate: DateTime(2025),
      lastDate: DateTime.now().add(const Duration(days: 1)),
    );

    if (rango == null) {
      return;
    }

    ref.read(filtroSalidasProvider.notifier).enRango(
          rango.start.toIso8601String().substring(0, 10),
          rango.end.toIso8601String().substring(0, 10),
        );
  }
}

class _Resumen extends StatelessWidget {
  const _Resumen({required this.salidas});

  final List<Salida> salidas;

  @override
  Widget build(BuildContext context) {
    final int paletas = salidas.fold(
      0,
      (int suma, Salida salida) => suma + salida.cantidadTotal,
    );
    final double importe = salidas.fold(
      0,
      (double suma, Salida salida) =>
          suma + (double.tryParse(salida.importe) ?? 0),
    );

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Row(
          children: <Widget>[
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  const Rotulo('Paletas despachadas'),
                  const SizedBox(height: 4),
                  Cifra(miles(paletas), tamano: 30),
                ],
              ),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: <Widget>[
                const Rotulo('Importe'),
                const SizedBox(height: 4),
                Cifra(
                  soles(importe.toStringAsFixed(2)),
                  tamano: 22,
                  tono: Paleta.hoja,
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
  const _Ficha({required this.salida});

  final Salida salida;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
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
                          salida.destino ?? 'Sin destino',
                          style: const TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w600,
                            color: Paleta.tinta,
                          ),
                        ),
                        const SizedBox(height: 3),
                        Text(
                          '${fechaCorta(salida.fecha)} · ${Etiquetas.tipoSalida[salida.tipo] ?? salida.tipo}',
                          style: const TextStyle(
                            color: Paleta.tenue,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Etiqueta(
                    Etiquetas.listaPrecios[salida.listaPrecios] ??
                        salida.listaPrecios,
                    tono: Paleta.marino,
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: <Widget>[
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: <Widget>[
                        Rotulo(
                          '${salida.detalles.length} ${salida.detalles.length == 1 ? 'sabor' : 'sabores'}',
                        ),
                        const SizedBox(height: 2),
                        Cifra('${miles(salida.cantidadTotal)} paletas',
                            tamano: 18),
                      ],
                    ),
                  ),
                  Cifra(soles(salida.importe), tamano: 22, tono: Paleta.hoja),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _abrir(BuildContext context, WidgetRef ref) async {
    Salida completa = salida;

    if (salida.detalles.isEmpty) {
      try {
        completa = await ref.read(salidasRepoProvider).detalle(salida.id);
      } on FalloApi catch (fallo) {
        if (context.mounted) {
          avisar(context, fallo.mensaje, error: true);
        }

        return;
      }
    }

    if (!context.mounted) {
      return;
    }

    await abrirDetalle(
      context,
      titulo: completa.destino ?? 'Salida sin destino',
      subtitulo:
          '${fechaLarga(completa.fecha)} · ${Etiquetas.tipoSalida[completa.tipo] ?? completa.tipo}',
      children: <Widget>[
        FilaDetalle(
          rotulo: 'Lista de precios',
          valor: Etiquetas.listaPrecios[completa.listaPrecios] ??
              completa.listaPrecios,
        ),
        FilaDetalle(
          rotulo: 'Paletas',
          valor: miles(completa.cantidadTotal),
        ),
        FilaDetalle(
          rotulo: 'Importe',
          valor: soles(completa.importe),
          tono: Paleta.hoja,
        ),
        FilaDetalle(rotulo: 'Registró', valor: completa.usuario),
        if (completa.motivo != null)
          FilaDetalle(rotulo: 'Motivo', valor: completa.motivo!),
        const Seccion('QUÉ SALIÓ'),
        for (final SalidaDetalle linea in completa.detalles)
          _LineaDetalle(linea: linea),
      ],
    );
  }
}

class _LineaDetalle extends StatelessWidget {
  const _LineaDetalle({required this.linea});

  final SalidaDetalle linea;

  @override
  Widget build(BuildContext context) => Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Paleta.hundido,
          borderRadius: BorderRadius.circular(14),
        ),
        child: Row(
          children: <Widget>[
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Text(
                    linea.sabor,
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: Paleta.tinta,
                    ),
                  ),
                  const SizedBox(height: 3),
                  Text(
                    '${linea.lote}${linea.loteManual ? ' · lote elegido a mano' : ''}',
                    style: const TextStyle(color: Paleta.tenue, fontSize: 12),
                  ),
                ],
              ),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: <Widget>[
                Text(
                  '${miles(linea.cantidad)} p.',
                  style: const TextStyle(
                    fontWeight: FontWeight.w700,
                    color: Paleta.tinta,
                  ),
                ),
                if (linea.precioUnitario != null)
                  Text(
                    '${soles(linea.precioUnitario!)} c/u',
                    style: const TextStyle(
                      color: Paleta.tenue,
                      fontSize: 11,
                    ),
                  ),
              ],
            ),
          ],
        ),
      );
}

class _Linea {
  _Linea();

  String? saborId;
  final TextEditingController cantidad = TextEditingController();
  final TextEditingController precio = TextEditingController();

  void liberar() {
    cantidad.dispose();
    precio.dispose();
  }

  int get paletas => int.tryParse(cantidad.text.trim()) ?? 0;

  double? get importe {
    final String limpio = precio.text.replaceAll(',', '.').trim();

    return limpio.isEmpty ? null : double.tryParse(limpio);
  }

  bool get completa => saborId != null && paletas > 0;
}

class _FormularioSalida extends ConsumerStatefulWidget {
  const _FormularioSalida();

  @override
  ConsumerState<_FormularioSalida> createState() => _FormularioSalidaState();
}

class _FormularioSalidaState extends ConsumerState<_FormularioSalida> {
  final TextEditingController _motivo = TextEditingController();
  final List<_Linea> _lineas = <_Linea>[_Linea()];

  String _tipo = 'PDV';
  String _lista = 'MAYOR';
  String? _destinoId;
  bool _enviando = false;

  @override
  void dispose() {
    _motivo.dispose();

    for (final _Linea linea in _lineas) {
      linea.liberar();
    }

    super.dispose();
  }

  List<Sabor> get _catalogo =>
      ref.read(catalogoProvider).value ?? const <Sabor>[];

  String? _precioDelCatalogo(String saborId) {
    for (final Sabor sabor in _catalogo) {
      if (sabor.id == saborId) {
        return _lista == 'MAYOR' ? sabor.precioMayor : sabor.precioUnidad;
      }
    }

    return null;
  }

  double get _total {
    double suma = 0;

    for (final _Linea linea in _lineas) {
      final String? saborId = linea.saborId;

      if (saborId == null) {
        continue;
      }

      final double precio = linea.importe ??
          double.tryParse(_precioDelCatalogo(saborId) ?? '') ??
          0;

      suma += precio * linea.paletas;
    }

    return suma;
  }

  Future<void> _guardar() async {
    final List<_Linea> listas =
        _lineas.where((_Linea linea) => linea.completa).toList();

    if (listas.isEmpty) {
      avisar(context, 'Agrega al menos un sabor con cantidad.', error: true);
      return;
    }

    final Set<String> vistos = <String>{};

    for (final _Linea linea in listas) {
      if (!vistos.add(linea.saborId!)) {
        avisar(context, 'Hay un sabor repetido en el pedido.', error: true);
        return;
      }
    }

    if (_destinoId == null && _motivo.text.trim().length < 5) {
      avisar(context, 'Sin destino hay que explicar a dónde va.', error: true);
      return;
    }

    setState(() => _enviando = true);

    try {
      final List<Destino> destinos =
          ref.read(destinosProvider).value ?? const <Destino>[];
      final String? nombreDestino = _destinoId == null
          ? null
          : destinos
              .firstWhere((Destino destino) => destino.id == _destinoId)
              .nombre;

      final Anotado<Salida> anotado =
          await ref.read(salidasRepoProvider).registrar(
                tipo: _tipo,
                listaPrecios: _lista,
                fecha: hoyEnIso(),
                clave: const Uuid().v4(),
                destinoId: _destinoId,
                destino: nombreDestino,
                motivo: _motivo.text,
                lineas: <LineaSalida>[
                  for (final _Linea linea in listas)
                    LineaSalida(
                      saborId: linea.saborId!,
                      sabor: _nombreDe(linea.saborId!),
                      cantidad: linea.paletas,
                      precioUnitario: linea.importe,
                    ),
                ],
              );

      await ref.read(pendientesColaProvider.notifier).releer();
      refrescarDesde(ref);

      if (mounted) {
        Navigator.of(context).pop();
        avisar(
          context,
          anotado.encolado
              ? 'Sin señal: el pedido quedó guardado en el celular'
              : 'Salida registrada',
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

  String _nombreDe(String saborId) {
    for (final Sabor sabor in _catalogo) {
      if (sabor.id == saborId) {
        return sabor.nombre;
      }
    }

    return 'sabor';
  }

  @override
  Widget build(BuildContext context) {
    final AsyncValue<Inventario> inventario = ref.watch(inventarioProvider);
    final AsyncValue<List<Destino>> destinos = ref.watch(destinosProvider);
    final List<StockSabor> stock =
        inventario.value?.sabores ?? const <StockSabor>[];

    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
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
            'Los lotes salen por antigüedad.',
            style: const TextStyle(color: Paleta.tenue, fontSize: 13),
          ),
          const SizedBox(height: 18),
          DropdownButtonFormField<String>(
            initialValue: _tipo,
            decoration: const InputDecoration(labelText: 'Canal'),
            items: <DropdownMenuItem<String>>[
              for (final MapEntry<String, String> fila
                  in Etiquetas.tipoSalida.entries)
                DropdownMenuItem<String>(
                  value: fila.key,
                  child: Text(fila.value),
                ),
            ],
            onChanged: (String? valor) => setState(() {
              _tipo = valor ?? _tipo;
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
                setState(() => _lista = valor ?? _lista),
          ),
          if (_tiposConDestino.contains(_tipo)) ...<Widget>[
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

                return Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: <Widget>[
                    DropdownButtonFormField<String>(
                      initialValue: _destinoId,
                      isExpanded: true,
                      decoration: const InputDecoration(labelText: 'Destino'),
                      items: <DropdownMenuItem<String>>[
                        for (final Destino destino in propios)
                          DropdownMenuItem<String>(
                            value: destino.id,
                            child: Text(
                              destino.nombre,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                      ],
                      onChanged: (String? valor) =>
                          setState(() => _destinoId = valor),
                    ),
                    const SizedBox(height: 6),
                    Align(
                      alignment: Alignment.centerLeft,
                      child: TextButton.icon(
                        onPressed: _nuevoDestino,
                        icon: const Icon(Icons.add_location_alt_outlined,
                            size: 18),
                        label: const Text('Nuevo destino'),
                      ),
                    ),
                  ],
                );
              },
            ),
          ],
          if (_destinoId == null) ...<Widget>[
            const SizedBox(height: 8),
            TextField(
              controller: _motivo,
              decoration: const InputDecoration(
                labelText: 'A dónde va',
                helperText: 'Obligatorio cuando no eliges un destino.',
              ),
            ),
          ],
          const SizedBox(height: 22),
          const Text(
            'Qué sale',
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w600,
              color: Paleta.tinta,
            ),
          ),
          const SizedBox(height: 10),
          for (int indice = 0; indice < _lineas.length; indice += 1)
            _FilaLinea(
              linea: _lineas[indice],
              numero: indice + 1,
              stock: stock,
              catalogo: _catalogo,
              lista: _lista,
              sePuedeQuitar: _lineas.length > 1,
              alCambiar: () => setState(() {}),
              alQuitar: () => setState(() {
                _lineas.removeAt(indice).liberar();
              }),
            ),
          Align(
            alignment: Alignment.centerLeft,
            child: TextButton.icon(
              onPressed: () => setState(() => _lineas.add(_Linea())),
              icon: const Icon(Icons.add, size: 18),
              label: const Text('Agregar otro sabor'),
            ),
          ),
          const SizedBox(height: 10),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Paleta.hundido,
              borderRadius: BorderRadius.circular(14),
            ),
            child: Row(
              children: <Widget>[
                const Expanded(child: Rotulo('Total del pedido')),
                Cifra(
                  soles(_total.toStringAsFixed(2)),
                  tamano: 22,
                  tono: Paleta.marino,
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          FilledButton(
            onPressed: _enviando ? null : _guardar,
            child: _enviando
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: Paleta.superficie,
                    ),
                  )
                : const Text('Registrar salida'),
          ),
          const SizedBox(height: 8),
        ],
      ),
    );
  }

  Future<void> _nuevoDestino() async {
    final Destino? creado = await showModalBottomSheet<Destino>(
      context: context,
      isScrollControlled: true,
      builder: (BuildContext hoja) => Hoja(child: _FormularioDestino(tipo: _tipo)),
    );

    if (creado == null) {
      return;
    }

    ref.invalidate(destinosProvider);

    setState(() => _destinoId = creado.id);
  }
}

class _FilaLinea extends StatelessWidget {
  const _FilaLinea({
    required this.linea,
    required this.numero,
    required this.stock,
    required this.catalogo,
    required this.lista,
    required this.sePuedeQuitar,
    required this.alCambiar,
    required this.alQuitar,
  });

  final _Linea linea;
  final int numero;
  final List<StockSabor> stock;
  final List<Sabor> catalogo;
  final String lista;
  final bool sePuedeQuitar;
  final VoidCallback alCambiar;
  final VoidCallback alQuitar;

  @override
  Widget build(BuildContext context) {
    final String? saborId = linea.saborId;
    final StockSabor? elegido = saborId == null
        ? null
        : stock.where((StockSabor cada) => cada.saborId == saborId).firstOrNull;
    final String? precio = saborId == null ? null : _precioDe(saborId);

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Paleta.hundido,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: <Widget>[
          Row(
            children: <Widget>[
              Expanded(child: Rotulo('Sabor $numero')),
              if (sePuedeQuitar)
                IconButton(
                  tooltip: 'Quitar este sabor del pedido',
                  visualDensity: VisualDensity.compact,
                  icon: const Icon(
                    Icons.delete_outline,
                    size: 20,
                    color: Paleta.granate,
                  ),
                  onPressed: alQuitar,
                ),
            ],
          ),
          DropdownButtonFormField<String>(
            initialValue: saborId,
            isExpanded: true,
            decoration: const InputDecoration(labelText: 'Sabor', isDense: true),
            items: <DropdownMenuItem<String>>[
              for (final StockSabor cada in stock)
                DropdownMenuItem<String>(
                  value: cada.saborId,
                  child: Text(
                    '${cada.nombre} (${miles(cada.stock)})',
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
            ],
            onChanged: (String? valor) {
              linea.saborId = valor;
              alCambiar();
            },
          ),
          const SizedBox(height: 10),
          Row(
            children: <Widget>[
              Expanded(
                child: TextField(
                  controller: linea.cantidad,
                  keyboardType: TextInputType.number,
                  onChanged: (String _) => alCambiar(),
                  decoration: InputDecoration(
                    labelText: 'Paletas',
                    isDense: true,
                    helperText: elegido == null
                        ? null
                        : 'Hay ${miles(elegido.stock)}',
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: TextField(
                  controller: linea.precio,
                  keyboardType: const TextInputType.numberWithOptions(
                    decimal: true,
                  ),
                  onChanged: (String _) => alCambiar(),
                  decoration: InputDecoration(
                    labelText: 'Precio',
                    isDense: true,
                    prefixText: 'S/ ',
                    helperText: precio == null
                        ? 'Sin precio de catálogo'
                        : 'Catálogo: ${soles(precio)}',
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  String? _precioDe(String saborId) {
    for (final Sabor sabor in catalogo) {
      if (sabor.id == saborId) {
        return lista == 'MAYOR' ? sabor.precioMayor : sabor.precioUnidad;
      }
    }

    return null;
  }
}

class _FormularioDestino extends ConsumerStatefulWidget {
  const _FormularioDestino({required this.tipo});

  final String tipo;

  @override
  ConsumerState<_FormularioDestino> createState() => _FormularioDestinoState();
}

class _FormularioDestinoState extends ConsumerState<_FormularioDestino> {
  final TextEditingController _nombre = TextEditingController();
  final TextEditingController _direccion = TextEditingController();
  final TextEditingController _telefono = TextEditingController();

  bool _enviando = false;

  @override
  void dispose() {
    _nombre.dispose();
    _direccion.dispose();
    _telefono.dispose();
    super.dispose();
  }

  Future<void> _guardar() async {
    if (_nombre.text.trim().length < 3) {
      avisar(context, 'Ponle un nombre al destino.', error: true);
      return;
    }

    setState(() => _enviando = true);

    try {
      final Destino creado = await ref.read(destinosRepoProvider).crear(
            tipo: widget.tipo,
            nombre: _nombre.text.trim(),
            direccion: _direccion.text.trim(),
            telefono: _telefono.text.trim(),
          );

      if (mounted) {
        Navigator.of(context).pop(creado);
      }
    } on FalloApi catch (fallo) {
      if (mounted) {
        setState(() => _enviando = false);
        avisar(context, fallo.mensaje, error: true);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: <Widget>[
          const Text(
            'Nuevo destino',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: Paleta.tinta,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Se guarda como ${Etiquetas.tipoSalida[widget.tipo]?.toLowerCase()}.',
            style: const TextStyle(color: Paleta.tenue, fontSize: 13),
          ),
          const SizedBox(height: 18),
          TextField(
            controller: _nombre,
            textCapitalization: TextCapitalization.words,
            decoration: const InputDecoration(labelText: 'Nombre'),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _direccion,
            textCapitalization: TextCapitalization.sentences,
            decoration: const InputDecoration(labelText: 'Dirección'),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _telefono,
            keyboardType: TextInputType.phone,
            decoration: const InputDecoration(labelText: 'Teléfono'),
          ),
          const SizedBox(height: 20),
          FilledButton(
            onPressed: _enviando ? null : _guardar,
            child: const Text('Guardar destino'),
          ),
          const SizedBox(height: 8),
        ],
      ),
    );
  }
}
