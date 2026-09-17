enum EstadoOperacion { pendiente, rechazada }

class Operacion {
  const Operacion({
    required this.id,
    required this.ruta,
    required this.cuerpo,
    required this.etiqueta,
    required this.creadaEn,
    this.estado = EstadoOperacion.pendiente,
    this.motivo,
  });

  factory Operacion.desdeJson(Map<String, Object?> json) => Operacion(
        id: json['id']! as String,
        ruta: json['ruta']! as String,
        cuerpo: json['cuerpo']! as Map<String, Object?>,
        etiqueta: json['etiqueta']! as String,
        creadaEn: json['creadaEn']! as String,
        estado: EstadoOperacion.values.firstWhere(
          (EstadoOperacion cada) => cada.name == json['estado'],
          orElse: () => EstadoOperacion.pendiente,
        ),
        motivo: json['motivo'] as String?,
      );

  final String id;
  final String ruta;
  final Map<String, Object?> cuerpo;
  final String etiqueta;
  final String creadaEn;
  final EstadoOperacion estado;
  final String? motivo;

  Operacion rechazada(String razon) => Operacion(
        id: id,
        ruta: ruta,
        cuerpo: cuerpo,
        etiqueta: etiqueta,
        creadaEn: creadaEn,
        estado: EstadoOperacion.rechazada,
        motivo: razon,
      );

  Operacion reintentada() => Operacion(
        id: id,
        ruta: ruta,
        cuerpo: cuerpo,
        etiqueta: etiqueta,
        creadaEn: creadaEn,
      );

  Map<String, Object?> aJson() => <String, Object?>{
        'id': id,
        'ruta': ruta,
        'cuerpo': cuerpo,
        'etiqueta': etiqueta,
        'creadaEn': creadaEn,
        'estado': estado.name,
        'motivo': motivo,
      };
}
