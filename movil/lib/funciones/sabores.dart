import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../datos/fallo_api.dart';
import '../datos/repositorio.dart';
import '../dominio/modelos.dart';
import '../nucleo/formato.dart';
import '../nucleo/proveedores.dart';
import '../nucleo/tema.dart';
import '../ui/menu_lateral.dart';
import '../ui/piezas.dart';

class PantallaSabores extends ConsumerWidget {
  const PantallaSabores({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final AsyncValue<List<Sabor>> catalogo = ref.watch(catalogoProvider);
    final Usuario? usuario = ref.watch(sesionProvider).value;
    final bool puede = usuario?.puede(Permisos.administrarSabores) ?? false;

    return Scaffold(
      drawer: const MenuLateral(),
      appBar: AppBar(title: const Text('Sabores')),
      floatingActionButton: puede
          ? FloatingActionButton.extended(
              backgroundColor: Paleta.marino,
              foregroundColor: Paleta.superficie,
              onPressed: () => _editar(context, ref, null),
              icon: const Icon(Icons.add),
              label: const Text('Nuevo sabor'),
            )
          : null,
      body: catalogo.when(
        loading: () => const Cargando(),
        error: (Object error, StackTrace rastro) => Fallo(
          mensaje: error.toString(),
          reintentar: () => ref.invalidate(catalogoProvider),
        ),
        data: (List<Sabor> sabores) => RefreshIndicator(
          onRefresh: () async => ref.invalidate(catalogoProvider),
          child: sabores.isEmpty
              ? ListView(
                  children: const <Widget>[
                    Vacio('Todavía no hay sabores en el catálogo.'),
                  ],
                )
              : ListView.separated(
                  padding: const EdgeInsets.fromLTRB(16, 16, 16, 96),
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
                ),
        ),
      ),
    );
  }
}

class _Ficha extends StatelessWidget {
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
  Widget build(BuildContext context) {
    final bool activo = sabor.estado == 'ACTIVO';

    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(20),
        onTap: puede ? alEditar : null,
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
    final Repositorio repositorio = ref.read(repositorioProvider);

    if (activo) {
      await repositorio.desactivarSabor(sabor.id);
    } else {
      await repositorio.activarSabor(sabor.id);
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
    builder: (BuildContext hoja) => Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(hoja).viewInsets.bottom,
      ),
      child: _Formulario(sabor: sabor),
    ),
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
      'stockMinimo': int.tryParse(_minimo.text.trim()) ?? 80,
      'precioUnidad': ?_decimal(_unidad),
      'precioMayor': ?_decimal(_mayor),
    };

    try {
      final Sabor? sabor = widget.sabor;
      final Repositorio repositorio = ref.read(repositorioProvider);

      if (sabor == null) {
        await repositorio.crearSabor(datos);
      } else {
        await repositorio.actualizarSabor(sabor.id, datos);
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
    return SafeArea(
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
