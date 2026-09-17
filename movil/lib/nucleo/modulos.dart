import 'package:flutter/material.dart';

import '../dominio/modelos.dart';
import 'tema.dart';

enum Modulo {
  panel(
    'Panel',
    'Resumen e indicadores',
    Icons.dashboard_outlined,
    Icons.dashboard,
    Permisos.consultarInventario,
    Paleta.marino,
  ),
  inventario(
    'Inventario',
    'Stock por sabor',
    Icons.inventory_2_outlined,
    Icons.inventory_2,
    Permisos.consultarInventario,
    Paleta.heladoHondo,
  ),
  produccion(
    'Producción',
    'Obtenido y embolsado',
    Icons.icecream_outlined,
    Icons.icecream,
    Permisos.consultarInventario,
    Paleta.aguaje,
  ),
  salidas(
    'Salidas',
    'Ventas y despachos',
    Icons.local_shipping_outlined,
    Icons.local_shipping,
    Permisos.consultarInventario,
    Paleta.hoja,
  ),
  mermas(
    'Mermas',
    'Paletas perdidas',
    Icons.report_gmailerrorred_outlined,
    Icons.report,
    Permisos.consultarInventario,
    Paleta.granate,
  ),
  lotes(
    'Lotes',
    'Trazabilidad por código',
    Icons.qr_code_2_outlined,
    Icons.qr_code_2,
    Permisos.consultarInventario,
    Paleta.tinta,
  ),
  sabores(
    'Sabores',
    'Catálogo y precios',
    Icons.palette_outlined,
    Icons.palette,
    Permisos.consultarInventario,
    Paleta.uva,
  ),
  usuarios(
    'Usuarios',
    'Accesos y roles',
    Icons.group_outlined,
    Icons.group,
    Permisos.administrarUsuarios,
    Paleta.marino,
  );

  const Modulo(
    this.rotulo,
    this.detalle,
    this.icono,
    this.iconoActivo,
    this.permiso,
    this.tono,
  );

  final String rotulo;
  final String detalle;
  final IconData icono;
  final IconData iconoActivo;
  final String permiso;
  final Color tono;

  bool visiblePara(Usuario? usuario) => usuario?.puede(permiso) ?? false;

  Color get tonoClaro => Color.lerp(tono, Paleta.helado, 0.45) ?? tono;
}
