import 'package:flutter/material.dart';

import '../nucleo/tema.dart';
import 'piezas.dart';

class HojaDetalle extends StatelessWidget {
  const HojaDetalle({
    required this.titulo,
    required this.subtitulo,
    required this.children,
    super.key,
  });

  final String titulo;
  final String subtitulo;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      initialChildSize: 0.62,
      minChildSize: 0.35,
      maxChildSize: 0.92,
      expand: false,
      builder: (BuildContext contexto, ScrollController control) => Column(
        children: <Widget>[
          const SizedBox(height: 10),
          Container(
            width: 42,
            height: 4,
            decoration: BoxDecoration(
              color: Paleta.linea,
              borderRadius: BorderRadius.circular(999),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text(
                  titulo,
                  style: const TextStyle(
                    fontSize: 19,
                    fontWeight: FontWeight.w700,
                    color: Paleta.tinta,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  subtitulo,
                  style: const TextStyle(color: Paleta.tenue, fontSize: 13),
                ),
              ],
            ),
          ),
          const Divider(height: 1),
          Expanded(
            child: ListView(
              controller: control,
              padding: margenDeLista(contexto, abajo: 28),
              children: children,
            ),
          ),
        ],
      ),
    );
  }
}

class FilaDetalle extends StatelessWidget {
  const FilaDetalle({
    required this.rotulo,
    required this.valor,
    this.tono = Paleta.tinta,
    super.key,
  });

  final String rotulo;
  final String valor;
  final Color tono;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 7),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            SizedBox(width: 118, child: Rotulo(rotulo)),
            Expanded(
              child: Text(
                valor,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                  color: tono,
                ),
              ),
            ),
          ],
        ),
      );
}

class Seccion extends StatelessWidget {
  const Seccion(this.texto, {super.key});

  final String texto;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(top: 18, bottom: 8),
        child: Text(
          texto,
          style: const TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w700,
            letterSpacing: 0.8,
            color: Paleta.tenue,
          ),
        ),
      );
}

Future<void> abrirDetalle(
  BuildContext context, {
  required String titulo,
  required String subtitulo,
  required List<Widget> children,
}) =>
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Paleta.superficie,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (BuildContext hoja) => HojaDetalle(
        titulo: titulo,
        subtitulo: subtitulo,
        children: children,
      ),
    );
