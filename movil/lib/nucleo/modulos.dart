import 'package:flutter/material.dart';

enum Modulo {
  panel(
    'Panel',
    'Resumen del día',
    Icons.dashboard_outlined,
    Icons.dashboard,
  ),
  inventario(
    'Inventario',
    'Stock por sabor',
    Icons.inventory_2_outlined,
    Icons.inventory_2,
  ),
  produccion(
    'Producción',
    'Obtenido y embolsado',
    Icons.icecream_outlined,
    Icons.icecream,
  ),
  salidas(
    'Salidas',
    'Ventas y despachos',
    Icons.local_shipping_outlined,
    Icons.local_shipping,
  ),
  mermas(
    'Mermas',
    'Paletas perdidas',
    Icons.report_gmailerrorred_outlined,
    Icons.report,
  );

  const Modulo(this.rotulo, this.detalle, this.icono, this.iconoActivo);

  final String rotulo;
  final String detalle;
  final IconData icono;
  final IconData iconoActivo;
}
