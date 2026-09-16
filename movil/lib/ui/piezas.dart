import 'package:flutter/material.dart';

import '../nucleo/tema.dart';

class Cargando extends StatelessWidget {
  const Cargando({super.key});

  @override
  Widget build(BuildContext context) => const Center(
        child: Padding(
          padding: EdgeInsets.all(40),
          child: CircularProgressIndicator(color: Paleta.marino),
        ),
      );
}

class Fallo extends StatelessWidget {
  const Fallo({required this.mensaje, required this.reintentar, super.key});

  final String mensaje;
  final VoidCallback reintentar;

  @override
  Widget build(BuildContext context) => Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: <Widget>[
              Text(
                mensaje,
                textAlign: TextAlign.center,
                style: const TextStyle(color: Paleta.tenue),
              ),
              const SizedBox(height: 20),
              FilledButton(
                onPressed: reintentar,
                child: const Text('Reintentar'),
              ),
            ],
          ),
        ),
      );
}

class Vacio extends StatelessWidget {
  const Vacio(this.mensaje, {super.key});

  final String mensaje;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 40, horizontal: 24),
        child: Text(
          mensaje,
          textAlign: TextAlign.center,
          style: const TextStyle(color: Paleta.tenue),
        ),
      );
}

class Etiqueta extends StatelessWidget {
  const Etiqueta(this.texto, {required this.tono, super.key});

  final String texto;
  final Color tono;

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        decoration: BoxDecoration(
          color: tono.withValues(alpha: 0.12),
          borderRadius: BorderRadius.circular(999),
        ),
        child: Text(
          texto,
          style: TextStyle(
            color: tono,
            fontSize: 12,
            fontWeight: FontWeight.w500,
          ),
        ),
      );
}

class Cifra extends StatelessWidget {
  const Cifra(
    this.valor, {
    this.tamano = 28,
    this.tono = Paleta.tinta,
    super.key,
  });

  final String valor;
  final double tamano;
  final Color tono;

  @override
  Widget build(BuildContext context) => Text(
        valor,
        style: TextStyle(
          fontSize: tamano,
          fontWeight: FontWeight.w600,
          height: 1.1,
          letterSpacing: -0.5,
          color: tono,
        ),
      );
}

class Rotulo extends StatelessWidget {
  const Rotulo(this.texto, {super.key});

  final String texto;

  @override
  Widget build(BuildContext context) => Text(
        texto,
        style: const TextStyle(
          fontSize: 13,
          color: Paleta.tenue,
          fontWeight: FontWeight.w500,
        ),
      );
}

class BarraStock extends StatelessWidget {
  const BarraStock({
    required this.stock,
    required this.minimo,
    required this.tono,
    super.key,
  });

  final int stock;
  final int minimo;
  final Color tono;

  @override
  Widget build(BuildContext context) {
    final int tope = (minimo < 1 ? 1 : minimo) * 2;
    final double relleno = (stock / tope).clamp(0, 1).toDouble();

    return LayoutBuilder(
      builder: (BuildContext contexto, BoxConstraints medidas) => SizedBox(
        height: 10,
        child: Stack(
          children: <Widget>[
            Container(
              decoration: BoxDecoration(
                color: Paleta.hundido,
                borderRadius: BorderRadius.circular(999),
              ),
            ),
            FractionallySizedBox(
              widthFactor: relleno,
              child: Container(
                decoration: BoxDecoration(
                  color: tono,
                  borderRadius: BorderRadius.circular(999),
                ),
              ),
            ),
            Positioned(
              left: medidas.maxWidth / 2,
              top: -2,
              bottom: -2,
              child: Container(width: 2, color: Paleta.tinta.withValues(alpha: 0.5)),
            ),
          ],
        ),
      ),
    );
  }
}

Color tonoDelEstado(String estado) => switch (estado) {
      'DISPONIBLE' => Paleta.hoja,
      'REPONER' => Paleta.aguajeVivo,
      _ => Paleta.granate,
    };

void avisar(BuildContext contexto, String mensaje, {bool error = false}) {
  ScaffoldMessenger.of(contexto)
    ..clearSnackBars()
    ..showSnackBar(
      SnackBar(
        content: Text(mensaje),
        backgroundColor: error ? Paleta.granate : Paleta.marino,
      ),
    );
}
