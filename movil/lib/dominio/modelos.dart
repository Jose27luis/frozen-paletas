class Usuario {
  const Usuario({
    required this.id,
    required this.nombres,
    required this.apellidos,
    required this.correo,
    required this.rol,
    required this.permisos,
  });

  factory Usuario.desdeJson(Map<String, Object?> json) => Usuario(
        id: json['id']! as String,
        nombres: json['nombres']! as String,
        apellidos: json['apellidos']! as String,
        correo: json['correo']! as String,
        rol: json['rol']! as String,
        permisos: (json['permisos']! as List<Object?>)
            .map((Object? clave) => clave! as String)
            .toList(growable: false),
      );

  final String id;
  final String nombres;
  final String apellidos;
  final String correo;
  final String rol;
  final List<String> permisos;

  bool puede(String clave) => permisos.contains(clave);
}

class Sesion {
  const Sesion({required this.token, required this.usuario});

  factory Sesion.desdeJson(Map<String, Object?> json) => Sesion(
        token: json['accessToken']! as String,
        usuario: Usuario.desdeJson(json['usuario']! as Map<String, Object?>),
      );

  final String token;
  final Usuario usuario;
}

class StockSabor {
  const StockSabor({
    required this.saborId,
    required this.nombre,
    required this.abreviatura,
    required this.stock,
    required this.stockMinimo,
    required this.estado,
    required this.lotesAbiertos,
    required this.antiguedadDelMasViejo,
  });

  factory StockSabor.desdeJson(Map<String, Object?> json) {
    final Object? viejo = json['loteMasAntiguo'];

    return StockSabor(
      saborId: json['saborId']! as String,
      nombre: json['nombre']! as String,
      abreviatura: json['abreviatura']! as String,
      stock: json['stock']! as int,
      stockMinimo: json['stockMinimo']! as int,
      estado: json['estado']! as String,
      lotesAbiertos: json['lotesAbiertos']! as int,
      antiguedadDelMasViejo:
          viejo is Map<String, Object?> ? viejo['antiguedad']! as int : null,
    );
  }

  final String saborId;
  final String nombre;
  final String abreviatura;
  final int stock;
  final int stockMinimo;
  final String estado;
  final int lotesAbiertos;
  final int? antiguedadDelMasViejo;
}

class Inventario {
  const Inventario({required this.total, required this.sabores});

  factory Inventario.desdeJson(Map<String, Object?> json) => Inventario(
        total: json['total']! as int,
        sabores: (json['sabores']! as List<Object?>)
            .map((Object? fila) =>
                StockSabor.desdeJson(fila! as Map<String, Object?>))
            .toList(growable: false),
      );

  final int total;
  final List<StockSabor> sabores;
}

class Sabor {
  const Sabor({
    required this.id,
    required this.nombre,
    required this.estado,
  });

  factory Sabor.desdeJson(Map<String, Object?> json) => Sabor(
        id: json['id']! as String,
        nombre: json['nombre']! as String,
        estado: json['estado']! as String,
      );

  final String id;
  final String nombre;
  final String estado;
}

class Produccion {
  const Produccion({
    required this.id,
    required this.fecha,
    required this.sabor,
    required this.cantidadObtenida,
    required this.cantidadEmbolsada,
    required this.estado,
    required this.lote,
    required this.responsable,
  });

  factory Produccion.desdeJson(Map<String, Object?> json) => Produccion(
        id: json['id']! as String,
        fecha: json['fecha']! as String,
        sabor: json['sabor']! as String,
        cantidadObtenida: json['cantidadObtenida']! as int,
        cantidadEmbolsada: json['cantidadEmbolsada'] as int?,
        estado: json['estado']! as String,
        lote: json['lote'] as String?,
        responsable: json['responsable']! as String,
      );

  final String id;
  final String fecha;
  final String sabor;
  final int cantidadObtenida;
  final int? cantidadEmbolsada;
  final String estado;
  final String? lote;
  final String responsable;
}

class Lote {
  const Lote({
    required this.id,
    required this.codigo,
    required this.sabor,
    required this.fechaProduccion,
    required this.cantidadIngresada,
    required this.stockRestante,
    required this.estado,
    required this.responsable,
  });

  factory Lote.desdeJson(Map<String, Object?> json) => Lote(
        id: json['id']! as String,
        codigo: json['codigo']! as String,
        sabor: json['sabor']! as String,
        fechaProduccion: json['fechaProduccion']! as String,
        cantidadIngresada: json['cantidadIngresada']! as int,
        stockRestante: json['stockRestante']! as int,
        estado: json['estado']! as String,
        responsable: json['responsable']! as String,
      );

  final String id;
  final String codigo;
  final String sabor;
  final String fechaProduccion;
  final int cantidadIngresada;
  final int stockRestante;
  final String estado;
  final String responsable;
}

class Destino {
  const Destino({required this.id, required this.tipo, required this.nombre});

  factory Destino.desdeJson(Map<String, Object?> json) => Destino(
        id: json['id']! as String,
        tipo: json['tipo']! as String,
        nombre: json['nombre']! as String,
      );

  final String id;
  final String tipo;
  final String nombre;
}

class Salida {
  const Salida({
    required this.id,
    required this.fecha,
    required this.tipo,
    required this.destino,
    required this.motivo,
    required this.cantidadTotal,
    required this.importe,
  });

  factory Salida.desdeJson(Map<String, Object?> json) => Salida(
        id: json['id']! as String,
        fecha: json['fecha']! as String,
        tipo: json['tipo']! as String,
        destino: json['destino'] as String?,
        motivo: json['motivo'] as String?,
        cantidadTotal: json['cantidadTotal']! as int,
        importe: json['importe']! as String,
      );

  final String id;
  final String fecha;
  final String tipo;
  final String? destino;
  final String? motivo;
  final int cantidadTotal;
  final String importe;
}

class CausaMerma {
  const CausaMerma({
    required this.id,
    required this.nombre,
    required this.requiereDescripcion,
    required this.activa,
  });

  factory CausaMerma.desdeJson(Map<String, Object?> json) => CausaMerma(
        id: json['id']! as String,
        nombre: json['nombre']! as String,
        requiereDescripcion: json['requiereDescripcion']! as bool,
        activa: json['activa']! as bool,
      );

  final String id;
  final String nombre;
  final bool requiereDescripcion;
  final bool activa;
}

class Merma {
  const Merma({
    required this.id,
    required this.fecha,
    required this.sabor,
    required this.lote,
    required this.cantidad,
    required this.causa,
    required this.origen,
    required this.responsable,
  });

  factory Merma.desdeJson(Map<String, Object?> json) => Merma(
        id: json['id']! as String,
        fecha: json['fecha']! as String,
        sabor: json['sabor']! as String,
        lote: json['lote'] as String?,
        cantidad: json['cantidad']! as int,
        causa: json['causa']! as String,
        origen: json['origen']! as String,
        responsable: json['responsable']! as String,
      );

  final String id;
  final String fecha;
  final String sabor;
  final String? lote;
  final int cantidad;
  final String causa;
  final String origen;
  final String responsable;
}

class Panel {
  const Panel({
    required this.stockTotal,
    required this.sabores,
    required this.aReponer,
    required this.pendientesDeEmbolsar,
    required this.salidasRecientes,
    required this.mermasRecientes,
  });

  factory Panel.desdeJson(Map<String, Object?> json) => Panel(
        stockTotal: json['stockTotal']! as int,
        sabores: (json['sabores']! as List<Object?>)
            .map((Object? fila) =>
                StockSabor.desdeJson(fila! as Map<String, Object?>))
            .toList(growable: false),
        aReponer: (json['aReponer']! as List<Object?>)
            .map((Object? fila) =>
                StockSabor.desdeJson(fila! as Map<String, Object?>))
            .toList(growable: false),
        pendientesDeEmbolsar: json['pendientesDeEmbolsar']! as int,
        salidasRecientes: (json['salidasRecientes']! as List<Object?>)
            .map((Object? fila) => Salida.desdeJson(fila! as Map<String, Object?>))
            .toList(growable: false),
        mermasRecientes: (json['mermasRecientes']! as List<Object?>)
            .map((Object? fila) => Merma.desdeJson(fila! as Map<String, Object?>))
            .toList(growable: false),
      );

  final int stockTotal;
  final List<StockSabor> sabores;
  final List<StockSabor> aReponer;
  final int pendientesDeEmbolsar;
  final List<Salida> salidasRecientes;
  final List<Merma> mermasRecientes;
}

abstract final class Permisos {
  static const String consultarInventario = 'inventario.consultar';
  static const String registrarProduccion = 'produccion.registrar';
  static const String registrarMermas = 'mermas.registrar';
  static const String registrarSalidas = 'salidas.registrar';
}

abstract final class Etiquetas {
  static const Map<String, String> estadoStock = <String, String>{
    'DISPONIBLE': 'Disponible',
    'REPONER': 'Reponer',
    'AGOTADO': 'Agotado',
  };

  static const Map<String, String> estadoProduccion = <String, String>{
    'REGISTRADA': 'Falta embolsar',
    'EMBOLSADA': 'En stock',
    'ANULADA': 'Anulada',
  };

  static const Map<String, String> estadoLote = <String, String>{
    'PENDIENTE': 'Sin ingresar',
    'ABIERTO': 'Completo',
    'PARCIAL': 'Parcial',
    'AGOTADO': 'Agotado',
  };

  static const Map<String, String> tipoSalida = <String, String>{
    'PDV': 'Punto de venta',
    'MAYORISTA': 'Cliente mayorista',
    'DELIVERY': 'Delivery',
    'FERIA': 'Feria',
    'OTRA': 'Otra salida',
  };

  static const Map<String, String> listaPrecios = <String, String>{
    'UNIDAD': 'Por unidad',
    'MAYOR': 'Por mayor',
  };

  static const Map<String, String> origenMerma = <String, String>{
    'PRODUCCION': 'En producción',
    'EMBOLSADO': 'En embolsado',
    'STOCK': 'En almacén',
  };
}
