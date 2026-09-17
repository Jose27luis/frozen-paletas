import 'package:flutter/material.dart';

import '../nucleo/formato.dart';
import '../nucleo/tema.dart';
import 'piezas.dart';

class FilaBarra {
  const FilaBarra({
    required this.rotulo,
    required this.valor,
    this.apunte,
    this.tono = Paleta.marino,
  });

  final String rotulo;
  final int valor;
  final String? apunte;
  final Color tono;
}

class Barras extends StatelessWidget {
  const Barras({required this.datos, required this.vacio, super.key});

  final List<FilaBarra> datos;
  final String vacio;

  @override
  Widget build(BuildContext context) {
    if (datos.isEmpty) {
      return Vacio(vacio);
    }

    final int tope = datos
        .map((FilaBarra fila) => fila.valor)
        .fold(1, (int mayor, int valor) => valor > mayor ? valor : mayor);

    return Column(
      children: <Widget>[
        for (final FilaBarra fila in datos)
          Padding(
            padding: const EdgeInsets.only(bottom: 14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Row(
                  children: <Widget>[
                    Expanded(
                      child: Text(
                        fila.rotulo,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: 13,
                          color: Paleta.tinta,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Text(
                      fila.apunte == null
                          ? miles(fila.valor)
                          : '${miles(fila.valor)} · ${fila.apunte}',
                      style: const TextStyle(
                        fontSize: 12,
                        color: Paleta.tenue,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                ClipRRect(
                  borderRadius: BorderRadius.circular(999),
                  child: LinearProgressIndicator(
                    value: fila.valor / tope,
                    minHeight: 9,
                    backgroundColor: Paleta.hundido,
                    valueColor: AlwaysStoppedAnimation<Color>(fila.tono),
                  ),
                ),
              ],
            ),
          ),
      ],
    );
  }
}
