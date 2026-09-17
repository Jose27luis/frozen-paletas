import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../nucleo/proveedores.dart';
import '../nucleo/tema.dart';

class Opcion<T> {
  const Opcion({required this.valor, required this.texto});

  final T valor;
  final String texto;
}

class FilaDeChips<T> extends ConsumerWidget {
  const FilaDeChips({
    required this.opciones,
    required this.elegida,
    required this.alElegir,
    super.key,
  });

  final List<Opcion<T>> opciones;
  final T elegida;
  final ValueChanged<T> alElegir;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final Color tono = ref.watch(moduloProvider).tono;

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        children: <Widget>[
          for (final Opcion<T> opcion in opciones)
            Padding(
              padding: const EdgeInsets.only(right: 8),
              child: _Chip(
                texto: opcion.texto,
                activo: opcion.valor == elegida,
                tono: tono,
                alTocar: () => alElegir(opcion.valor),
              ),
            ),
        ],
      ),
    );
  }
}

class _Chip extends StatelessWidget {
  const _Chip({
    required this.texto,
    required this.activo,
    required this.tono,
    required this.alTocar,
  });

  final String texto;
  final bool activo;
  final Color tono;
  final VoidCallback alTocar;

  @override
  Widget build(BuildContext context) => Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(999),
          onTap: alTocar,
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 160),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 9),
            decoration: BoxDecoration(
              color: activo ? tono : tono.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(999),
              border: Border.all(
                color: activo ? tono : tono.withValues(alpha: 0.24),
              ),
            ),
            child: Text(
              texto,
              style: TextStyle(
                color: activo ? Paleta.superficie : tono,
                fontWeight: FontWeight.w600,
                fontSize: 13,
              ),
            ),
          ),
        ),
      );
}

class Interruptor extends ConsumerWidget {
  const Interruptor({
    required this.texto,
    required this.activo,
    required this.alTocar,
    super.key,
  });

  final String texto;
  final bool activo;
  final ValueChanged<bool> alTocar;

  @override
  Widget build(BuildContext context, WidgetRef ref) => _Chip(
        texto: texto,
        activo: activo,
        tono: ref.watch(moduloProvider).tono,
        alTocar: () => alTocar(!activo),
      );
}

class BarraDeFiltros extends StatelessWidget {
  const BarraDeFiltros({required this.children, super.key});

  final List<Widget> children;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.fromLTRB(0, 12, 0, 14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: children,
        ),
      );
}

class SelectorDesplegable<T> extends StatelessWidget {
  const SelectorDesplegable({
    required this.rotulo,
    required this.opciones,
    required this.elegida,
    required this.alElegir,
    this.textoDeTodos = 'Todos',
    super.key,
  });

  final String rotulo;
  final List<Opcion<T>> opciones;
  final T? elegida;
  final ValueChanged<T?> alElegir;
  final String textoDeTodos;

  @override
  Widget build(BuildContext context) {
    return DropdownButtonFormField<T?>(
      initialValue: elegida,
      isExpanded: true,
      decoration: InputDecoration(labelText: rotulo, isDense: true),
      items: <DropdownMenuItem<T?>>[
        DropdownMenuItem<T?>(child: Text(textoDeTodos)),
        for (final Opcion<T> opcion in opciones)
          DropdownMenuItem<T?>(
            value: opcion.valor,
            child: Text(opcion.texto, overflow: TextOverflow.ellipsis),
          ),
      ],
      onChanged: alElegir,
    );
  }
}
