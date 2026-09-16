import 'package:flutter/material.dart';

import '../dominio/modelos.dart';

enum Modulo {
  panel(
    'Panel',
    'Resumen e indicadores',
    Icons.dashboard_outlined,
    Icons.dashboard,
    Permisos.consultarInventario,
  ),
  inventario(
    'Inventario',
    'Stock por sabor',
    Icons.inventory_2_outlined,
    Icons.inventory_2,
    Permisos.consultarInventario,
  ),
  produccion(
    'Producción',
    'Obtenido y embolsado',
    Icons.icecream_outlined,
    Icons.icecream,
    Permisos.consultarInventario,
  ),
  salidas(
    'Salidas',
    'Ventas y despachos',
    Icons.local_shipping_outlined,
    Icons.local_shipping,
    Permisos.consultarInventario,
  ),
  mermas(
    'Mermas',
    'Paletas perdidas',
    Icons.report_gmailerrorred_outlined,
    Icons.report,
    Permisos.consultarInventario,
  ),
  lotes(
    'Lotes',
    'Trazabilidad por código',
    Icons.qr_code_2_outlined,
    Icons.qr_code_2,
    Permisos.consultarInventario,
  ),
  sabores(
    'Sabores',
    'Catálogo y precios',
    Icons.palette_outlined,
    Icons.palette,
    Permisos.consultarInventario,
  ),
  usuarios(
    'Usuarios',
    'Accesos y roles',
    Icons.group_outlined,
    Icons.group,
    Permisos.administrarUsuarios,
  );

  const Modulo(
    this.rotulo,
    this.detalle,
    this.icono,
    this.iconoActivo,
    this.permiso,
  );

  final String rotulo;
  final String detalle;
  final IconData icono;
  final IconData iconoActivo;
  final String permiso;

  bool visiblePara(Usuario? usuario) => usuario?.puede(permiso) ?? false;
}
