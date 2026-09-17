import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../datos/fallo_api.dart';
import '../datos/repos/sabores_repo.dart';
import '../dominio/modelos.dart';
import '../nucleo/formato.dart';
import '../nucleo/proveedores.dart';
import '../nucleo/tema.dart';
import '../ui/detalle.dart';
import '../ui/filtros.dart';
import '../ui/pantalla.dart';
import '../ui/piezas.dart';

class PantallaSabores extends ConsumerStatefulWidget {
  const PantallaSabores({super.key});

  @override
  ConsumerState<PantallaSabores> createState() => _PantallaSaboresState();
}

class _PantallaSaboresState extends ConsumerState<PantallaSabores> {
  String? _categoria;

  @override
  Widget build(BuildContext context) {
    final Usuario? usuario = ref.watch(sesionProvider).value;
    final bool puede = usuario?.puede(Permisos.administrarSabores) ?? false;

    return Pantalla(
      titulo: 'Sabores',
      filtros: BarraDeFiltros(
        children: <Widget>[
          FilaDeChips<String?>(
            opciones: <Opcion<String?>>[
              const Opcion<String?>(valor: null, texto: 'Todas'),
              for (final MapEntry<String, String> fila
                  in Etiquetas.categoriaSabor.entries)
                Opcion<String?>(valor: fila.key, texto: fila.value),
            ],
            elegida: _categoria,
            alElegir: (String? categoria) =>
                setState(() => _categoria = categoria),
          ),
        ],
      ),
      flotante: puede
          ? Boton(
              icono: Icons.add,
              texto: 'Nuevo sabor',
              alTocar: () => _editar(context, ref, null),
            )
          : null,
      cuerpo: Cargado<List<Sabor>>(
        valor: ref.watch(catalogoProvider),
        alRefrescar: () => ref.invalidate(catalogoProvider),
        construir: (List<Sabor> todos) {
          final List<Sabor> sabores = _categoria == null
              ? todos
              : todos
                  .where((Sabor sabor) => sabor.categoria == _categoria)
                  .toList(growable: false);

          if (sabores.isEmpty) {
            return const ListaVacia('No hay sabores en esa categoría.');
          }

          return ListView.separated(
            padding: margenDeLista(context, abajo: 96),
            itemCount: sabores.length,
            separatorBuilder: (BuildContext contexto, int indice) =>
                const SizedBox(height: 10),
            itemBuilder: (BuildContext contexto, int indice) => _Ficha(
              sabor: sabores[indice],
              puede: puede,
              alEditar: () => _editar(context, ref, sabores[indice]),
              alCambiarEstado: () =>
                  _cambiarEstado(context, ref, sabores[indice]),
            ),
          );
        },
      ),
    );
  }
}

class _Ficha extends ConsumerWidget {
  const _Ficha({
    required this.sabor,
    required this.puede,
    required this.alEditar,
    required this.alCambiarEstado,
  });

  final Sabor sabor;
  final bool puede;
  final VoidCallback alEditar;
  final VoidCallback alCambiarEstado;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final bool activo = sabor.estado == 'ACTIVO';
    final IndicadorSabor? medida = _medidaDe(ref);

    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(20),
        onTap: () => _abrir(context, ref, medida),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Container(
                    width: 44,
                    height: 44,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: activo
                          ? Paleta.helado.withValues(alpha: 0.16)
                          : Paleta.hundido,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      sabor.abreviatura,
                      style: TextStyle(
                        fontWeight: FontWeight.w700,
                        fontSize: 13,
                        letterSpacing: 0.5,
                        color: activo ? Paleta.marino : Paleta.tenue,
                      ),
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: <Widget>[
                        Text(
                          sabor.nombre,
                          style: const TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w600,
                            color: Paleta.tinta,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          Etiquetas.categoriaSabor[sabor.categoria] ??
                              sabor.categoria,
                          style: const TextStyle(
                            color: Paleta.tenue,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Etiqueta(
                    Etiquetas.estadoSabor[sabor.estado] ?? sabor.estado,
                    tono: activo ? Paleta.hoja : Paleta.tenue,
                  ),
                ],
              ),
              const SizedBox(height: 14),
              Row(
                children: <Widget>[
                  Expanded(
                    child: _Precio(
                      rotulo: 'Por unidad',
                      importe: sabor.precioUnidad,
                    ),
                  ),
                  Expanded(
                    child: _Precio(
                      rotulo: 'Por mayor',
                      importe: sabor.precioMayor,
                    ),
                  ),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: <Widget>[
                        const Rotulo('Mínimo'),
                        const SizedBox(height: 2),
                        Cifra(miles(sabor.stockMinimo), tamano: 18),
                      ],
                    ),
                  ),
                ],
              ),
              if (medida != null) ...<Widget>[
                const SizedBox(height: 14),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 12,
                  ),
                  decoration: BoxDecoration(
                    color: Paleta.hundido,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: <Widget>[
                      Expanded(
                        child: _Medida(
                          rotulo: 'Stock',
                          valor: miles(medida.stock),
                          tono: tonoDelEstado(medida.estado),
                        ),
                      ),
                      Expanded(
                        child: _Medida(
                          rotulo: 'Produjo',
                          valor: miles(medida.producido),
                        ),
                      ),
                      Expanded(
                        child: _Medida(
                          rotulo: 'Salió',
                          valor: miles(medida.salido),
                        ),
                      ),
                      Expanded(
                        child: _Medida(
                          rotulo: 'Dura',
                          valor: medida.cobertura == null
                              ? '—'
                              : '${medida.cobertura} d',
                        ),
                      ),
                    ],
                  ),
                ),
              ],
              if (puede) ...<Widget>[
                const SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: <Widget>[
                    TextButton.icon(
                      onPressed: alEditar,
                      icon: const Icon(Icons.edit_outlined, size: 18),
                      label: const Text('Editar'),
                    ),
                    TextButton.icon(
                      onPressed: alCambiarEstado,
                      style: TextButton.styleFrom(
                        foregroundColor: activo ? Paleta.granate : Paleta.hoja,
                      ),
                      icon: Icon(
                        activo
                            ? Icons.pause_circle_outline
                            : Icons.play_circle_outline,
                        size: 18,
                      ),
                      label: Text(activo ? 'Retirar' : 'Reactivar'),
                    ),
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  IndicadorSabor? _medidaDe(WidgetRef ref) {
    final Indicadores? medidas = ref.watch(indicadoresProvider).value;

    if (medidas == null) {
      return null;
    }

    for (final IndicadorSabor cada in medidas.sabores) {
      if (cada.saborId == sabor.id) {
        return cada;
      }
    }

    return null;
  }

  Future<void> _abrir(
    BuildContext context,
    WidgetRef ref,
    IndicadorSabor? medida,
  ) =>
      abrirDetalle(
        context,
        titulo: sabor.nombre,
        subtitulo:
            '${sabor.abreviatura} · ${Etiquetas.categoriaSabor[sabor.categoria] ?? sabor.categoria}',
        children: <Widget>[
          FilaDetalle(
            rotulo: 'Estado',
            valor: Etiquetas.estadoSabor[sabor.estado] ?? sabor.estado,
            tono: sabor.estado == 'ACTIVO' ? Paleta.hoja : Paleta.tenue,
          ),
          FilaDetalle(
            rotulo: 'Precio por unidad',
            valor: sabor.precioUnidad == null
                ? 'Sin precio'
                : soles(sabor.precioUnidad!),
          ),
          FilaDetalle(
            rotulo: 'Precio por mayor',
            valor: sabor.precioMayor == null
                ? 'Sin precio'
                : soles(sabor.precioMayor!),
          ),
          FilaDetalle(
            rotulo: 'Stock mínimo',
            valor: miles(sabor.stockMinimo),
          ),
          if (medida != null) ...<Widget>[
            const Seccion('EN EL PERIODO'),
            FilaDetalle(rotulo: 'Stock ahora', valor: miles(medida.stock)),
            FilaDetalle(rotulo: 'Produjo', valor: miles(medida.producido)),
            FilaDetalle(rotulo: 'Salió', valor: miles(medida.salido)),
            FilaDetalle(
              rotulo: 'Merma',
              valor: miles(medida.merma),
              tono: medida.merma > 0 ? Paleta.granate : Paleta.tinta,
            ),
            FilaDetalle(
              rotulo: 'Alcanza para',
              valor: medida.cobertura == null
                  ? 'Sin salidas para estimar'
                  : '${medida.cobertura} días',
            ),
          ],
          if (puede) ...<Widget>[
            const SizedBox(height: 18),
            FilledButton.icon(
              onPressed: () {
                Navigator.of(context).pop();
                alEditar();
              },
              icon: const Icon(Icons.edit_outlined, size: 18),
              label: const Text('Editar este sabor'),
            ),
          ],
        ],
      );
}

class _Medida extends StatelessWidget {
  const _Medida({
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
          Text(
            rotulo,
            style: const TextStyle(fontSize: 11, color: Paleta.tenue),
          ),
          const SizedBox(height: 2),
          Text(
            valor,
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w700,
              color: tono,
            ),
          ),
        ],
      );
}

class _Precio extends StatelessWidget {
  const _Precio({required this.rotulo, required this.importe});

  final String rotulo;
  final String? importe;

  @override
  Widget build(BuildContext context) {
    final String? valor = importe;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        Rotulo(rotulo),
        const SizedBox(height: 2),
        if (valor == null)
          const Text(
            'Sin precio',
            style: TextStyle(color: Paleta.tenue, fontSize: 14),
          )
        else
          Cifra(soles(valor), tamano: 18),
      ],
    );
  }
}

Future<void> _cambiarEstado(
  BuildContext context,
  WidgetRef ref,
  Sabor sabor,
) async {
  final bool activo = sabor.estado == 'ACTIVO';

  final bool? confirmado = await showDialog<bool>(
    context: context,
    builder: (BuildContext dialogo) => AlertDialog(
      title: Text(activo ? 'Retirar el sabor' : 'Reactivar el sabor'),
      content: Text(
        activo
            ? 'Deja de contar para las alertas de stock y no aparece al registrar. Sus lotes y su histórico se conservan.'
            : 'Vuelve a la lista de sabores en producción y a las alertas de stock.',
      ),
      actions: <Widget>[
        TextButton(
          onPressed: () => Navigator.of(dialogo).pop(false),
          child: const Text('Cancelar'),
        ),
        FilledButton(
          onPressed: () => Navigator.of(dialogo).pop(true),
          child: Text(activo ? 'Retirar' : 'Reactivar'),
        ),
      ],
    ),
  );

  if (confirmado != true) {
    return;
  }

  try {
    final SaboresRepo repositorio = ref.read(saboresRepoProvider);

    if (activo) {
      await repositorio.desactivar(sabor.id);
    } else {
      await repositorio.activar(sabor.id);
    }

    ref
      ..invalidate(catalogoProvider)
      ..invalidate(saboresProvider)
      ..invalidate(inventarioProvider);

    if (context.mounted) {
      avisar(
        context,
        activo ? 'Sabor retirado del catálogo' : 'Sabor de vuelta en producción',
      );
    }
  } on FalloApi catch (fallo) {
    if (context.mounted) {
      avisar(context, fallo.mensaje, error: true);
    }
  }
}

Future<void> _editar(
  BuildContext context,
  WidgetRef ref,
  Sabor? sabor,
) async {
  await showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    builder: (BuildContext hoja) => Hoja(child: _Formulario(sabor: sabor)),
  );
}

class _Formulario extends ConsumerStatefulWidget {
  const _Formulario({required this.sabor});

  final Sabor? sabor;

  @override
  ConsumerState<_Formulario> createState() => _FormularioState();
}

class _FormularioState extends ConsumerState<_Formulario> {
  late final TextEditingController _nombre;
  late final TextEditingController _abreviatura;
  late final TextEditingController _minimo;
  late final TextEditingController _unidad;
  late final TextEditingController _mayor;

  late String _categoria;
  late String _estado;
  bool _enviando = false;

  @override
  void initState() {
    super.initState();

    final Sabor? sabor = widget.sabor;

    _nombre = TextEditingController(text: sabor?.nombre ?? '');
    _abreviatura = TextEditingController(text: sabor?.abreviatura ?? '');
    _minimo = TextEditingController(text: '${sabor?.stockMinimo ?? 80}');
    _unidad = TextEditingController(text: sabor?.precioUnidad ?? '');
    _mayor = TextEditingController(text: sabor?.precioMayor ?? '');
    _categoria = sabor?.categoria ?? 'CON_RELLENO';
    _estado = sabor?.estado ?? 'ACTIVO';
  }

  @override
  void dispose() {
    _nombre.dispose();
    _abreviatura.dispose();
    _minimo.dispose();
    _unidad.dispose();
    _mayor.dispose();
    super.dispose();
  }

  double? _decimal(TextEditingController campo) {
    final String limpio = campo.text.replaceAll(',', '.').trim();

    return limpio.isEmpty ? null : double.tryParse(limpio);
  }

  Future<void> _guardar() async {
    if (_enviando) {
      return;
    }

    setState(() => _enviando = true);

    final Map<String, Object?> datos = <String, Object?>{
      'nombre': _nombre.text.trim(),
      'abreviatura': _abreviatura.text.trim().toUpperCase(),
      'categoria': _categoria,
      'estado': _estado,
      'stockMinimo': int.tryParse(_minimo.text.trim()) ?? 80,
      'precioUnidad': ?_decimal(_unidad),
      'precioMayor': ?_decimal(_mayor),
    };

    try {
      final Sabor? sabor = widget.sabor;
      final SaboresRepo repositorio = ref.read(saboresRepoProvider);

      if (sabor == null) {
        await repositorio.crear(datos);
      } else {
        await repositorio.actualizar(sabor.id, datos);
      }

      ref
        ..invalidate(catalogoProvider)
        ..invalidate(saboresProvider)
        ..invalidate(inventarioProvider);

      if (mounted) {
        Navigator.of(context).pop();
        avisar(context, 'Sabor guardado');
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
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: <Widget>[
            Text(
              widget.sabor == null ? 'Nuevo sabor' : 'Editar sabor',
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: Paleta.tinta,
              ),
            ),
            const SizedBox(height: 18),
            TextField(
              controller: _nombre,
              decoration: const InputDecoration(labelText: 'Nombre'),
            ),
            const SizedBox(height: 12),
            Row(
              children: <Widget>[
                SizedBox(
                  width: 110,
                  child: TextField(
                    controller: _abreviatura,
                    maxLength: 3,
                    textCapitalization: TextCapitalization.characters,
                    decoration: const InputDecoration(
                      labelText: 'Sigla',
                      counterText: '',
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: DropdownButtonFormField<String>(
                    initialValue: _categoria,
                    isExpanded: true,
                    decoration: const InputDecoration(labelText: 'Categoría'),
                    items: <DropdownMenuItem<String>>[
                      for (final MapEntry<String, String> fila
                          in Etiquetas.categoriaSabor.entries)
                        DropdownMenuItem<String>(
                          value: fila.key,
                          child: Text(fila.value),
                        ),
                    ],
                    onChanged: (String? elegida) => setState(
                      () => _categoria = elegida ?? _categoria,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: <Widget>[
                Expanded(
                  child: TextField(
                    controller: _unidad,
                    keyboardType: const TextInputType.numberWithOptions(
                      decimal: true,
                    ),
                    decoration: const InputDecoration(
                      labelText: 'Precio por unidad',
                      prefixText: 'S/ ',
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: TextField(
                    controller: _mayor,
                    keyboardType: const TextInputType.numberWithOptions(
                      decimal: true,
                    ),
                    decoration: const InputDecoration(
                      labelText: 'Precio por mayor',
                      prefixText: 'S/ ',
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _minimo,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(
                labelText: 'Stock mínimo antes de avisar',
              ),
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              initialValue: _estado,
              isExpanded: true,
              decoration: const InputDecoration(
                labelText: 'Estado',
                helperText: 'Retirado deja de contar para las alertas de stock.',
              ),
              items: <DropdownMenuItem<String>>[
                for (final MapEntry<String, String> fila
                    in Etiquetas.estadoSabor.entries)
                  DropdownMenuItem<String>(
                    value: fila.key,
                    child: Text(fila.value),
                  ),
              ],
              onChanged: (String? elegido) =>
                  setState(() => _estado = elegido ?? _estado),
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
                  : const Text('Guardar'),
            ),
          ],
        ),
      ),
    );
  }
}
