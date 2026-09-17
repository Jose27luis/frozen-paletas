import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'aviso_cola.dart';
import 'menu_lateral.dart';
import 'piezas.dart';

class Pantalla extends StatelessWidget {
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
  Widget build(BuildContext context) {
    final Widget? barra = filtros;

    return Scaffold(
      drawer: const MenuLateral(),
      appBar: AppBar(title: Text(titulo), actions: acciones),
      floatingActionButton: flotante,
      body: Column(
        children: <Widget>[
          const AvisoCola(),
          if (barra != null) ...<Widget>[barra, const Divider(height: 1)],
          Expanded(child: cuerpo),
        ],
      ),
    );
  }
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
