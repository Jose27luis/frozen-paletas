import 'package:flutter/material.dart';

import '../nucleo/tema.dart';

class Opcion<T> {
  const Opcion({required this.valor, required this.texto});

  final T valor;
  final String texto;
}

class FilaDeChips<T> extends StatelessWidget {
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
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        children: <Widget>[
          for (final Opcion<T> opcion in opciones)
            Padding(
              padding: const EdgeInsets.only(right: 8),
              child: ChoiceChip(
                label: Text(opcion.texto),
                selected: opcion.valor == elegida,
                showCheckmark: false,
                selectedColor: Paleta.marino,
                backgroundColor: Paleta.hundido,
                side: BorderSide.none,
                labelStyle: TextStyle(
                  color: opcion.valor == elegida
                      ? Paleta.superficie
                      : Paleta.tenue,
                  fontWeight: FontWeight.w600,
                  fontSize: 13,
                ),
                onSelected: (bool _) => alElegir(opcion.valor),
              ),
            ),
        ],
      ),
    );
  }
}

class BarraDeFiltros extends StatelessWidget {
  const BarraDeFiltros({required this.children, super.key});

  final List<Widget> children;

  @override
  Widget build(BuildContext context) => Container(
        width: double.infinity,
        color: Paleta.superficie,
        padding: const EdgeInsets.fromLTRB(0, 10, 0, 12),
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
