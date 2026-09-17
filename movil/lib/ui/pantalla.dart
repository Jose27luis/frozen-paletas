import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../nucleo/modulos.dart';
import '../nucleo/proveedores.dart';
import '../nucleo/tema.dart';
import 'aviso_cola.dart';
import 'menu_lateral.dart';
import 'piezas.dart';

class Pantalla extends ConsumerWidget {
  const Pantalla({
    required this.titulo,
    required this.cuerpo,
    this.acciones = const <Widget>[],
    this.filtros,
    this.flotante,
    super.key,
  });

  final String titulo;
  final Widget cuerpo;
  final List<Widget> acciones;
  final Widget? filtros;
  final Widget? flotante;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final Modulo modulo = ref.watch(moduloProvider);
    final Widget? barra = filtros;

    return Scaffold(
      drawer: const MenuLateral(),
      appBar: AppBar(
        title: Text(titulo),
        actions: acciones,
        backgroundColor: modulo.tono,
        flexibleSpace: DecoratedBox(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.centerLeft,
              end: Alignment.centerRight,
              colors: <Color>[modulo.tono, modulo.tonoClaro],
            ),
          ),
        ),
      ),
      floatingActionButton: flotante,
      body: Column(
        children: <Widget>[
          const AvisoCola(),
          if (barra != null)
            DecoratedBox(
              decoration: BoxDecoration(
                color: Paleta.superficie,
                border: Border(
                  bottom: BorderSide(
                    color: modulo.tono.withValues(alpha: 0.22),
                    width: 2,
                  ),
                ),
              ),
              child: barra,
            ),
          Expanded(child: cuerpo),
        ],
      ),
    );
  }
}

class Boton extends ConsumerWidget {
  const Boton({
    required this.icono,
    required this.texto,
    required this.alTocar,
    super.key,
  });

  final IconData icono;
  final String texto;
  final VoidCallback alTocar;

  @override
  Widget build(BuildContext context, WidgetRef ref) =>
      FloatingActionButton.extended(
        backgroundColor: ref.watch(moduloProvider).tono,
        foregroundColor: Paleta.superficie,
        onPressed: alTocar,
        icon: Icon(icono),
        label: Text(texto),
      );
}

class Cabecera extends ConsumerWidget {
  const Cabecera({
    required this.rotulo,
    required this.valor,
    required this.apunte,
    this.derecha = const <Widget>[],
    super.key,
  });

  final String rotulo;
  final String valor;
  final String apunte;
  final List<Widget> derecha;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final Modulo modulo = ref.watch(moduloProvider);

    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(22),
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: <Color>[modulo.tono, modulo.tonoClaro],
        ),
        boxShadow: <BoxShadow>[
          BoxShadow(
            color: modulo.tono.withValues(alpha: 0.28),
            blurRadius: 18,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      padding: const EdgeInsets.all(20),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text(
                  rotulo,
                  style: TextStyle(
                    color: Paleta.superficie.withValues(alpha: 0.85),
                    fontSize: 13,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  valor,
                  style: const TextStyle(
                    color: Paleta.superficie,
                    fontSize: 34,
                    fontWeight: FontWeight.w700,
                    height: 1.1,
                    letterSpacing: -0.8,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  apunte,
                  style: TextStyle(
                    color: Paleta.superficie.withValues(alpha: 0.85),
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
          if (derecha.isNotEmpty)
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: derecha,
            ),
        ],
      ),
    );
  }
}

class Insignia extends StatelessWidget {
  const Insignia(this.texto, {super.key});

  final String texto;

  @override
  Widget build(BuildContext context) => Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
        decoration: BoxDecoration(
          color: Paleta.superficie.withValues(alpha: 0.22),
          borderRadius: BorderRadius.circular(999),
        ),
        child: Text(
          texto,
          style: const TextStyle(
            color: Paleta.superficie,
            fontSize: 12,
            fontWeight: FontWeight.w600,
          ),
        ),
      );
}

class Cargado<T> extends StatelessWidget {
  const Cargado({
    required this.valor,
    required this.alRefrescar,
    required this.construir,
    super.key,
  });

  final AsyncValue<T> valor;
  final VoidCallback alRefrescar;
  final Widget Function(T datos) construir;

  @override
  Widget build(BuildContext context) => valor.when(
        loading: () => const Cargando(),
        error: (Object error, StackTrace rastro) => Fallo(
          mensaje: error.toString(),
          reintentar: alRefrescar,
        ),
        data: (T datos) => RefreshIndicator(
          onRefresh: () async => alRefrescar(),
          child: construir(datos),
        ),
      );
}

class ListaVacia extends StatelessWidget {
  const ListaVacia(this.mensaje, {super.key});

  final String mensaje;

  @override
  Widget build(BuildContext context) => ListView(
        padding: margenDeLista(context),
        children: <Widget>[Vacio(mensaje)],
      );
}
