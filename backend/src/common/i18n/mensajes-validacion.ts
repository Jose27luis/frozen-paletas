import { ValidationError } from 'class-validator';

const ETIQUETAS: Readonly<Record<string, string>> = {
  nombres: 'los nombres',
  apellidos: 'los apellidos',
  correo: 'el correo',
  password: 'la contraseña',
  rol: 'el rol',
  activo: 'el estado',
  nombre: 'el nombre',
  abreviatura: 'la abreviatura',
  categoria: 'la categoría',
  estado: 'el estado',
  stockMinimo: 'el stock mínimo',
  saborId: 'el sabor',
  loteId: 'el lote',
  destinoId: 'el destino',
  causaId: 'la causa',
  produccionId: 'la producción',
  conteoId: 'el conteo',
  usuarioId: 'el usuario',
  fecha: 'la fecha',
  desde: 'la fecha inicial',
  hasta: 'la fecha final',
  cantidad: 'la cantidad',
  cantidadObtenida: 'la cantidad obtenida',
  cantidadEmbolsada: 'la cantidad embolsada',
  stockFisico: 'el stock contado',
  precioUnitario: 'el precio unitario',
  tipo: 'el tipo',
  origen: 'el origen',
  motivo: 'el motivo',
  observacion: 'la observación',
  direccion: 'la dirección',
  telefono: 'el teléfono',
  detalles: 'el detalle',
  claves: 'los permisos',
  claveIdempotencia: 'la clave de idempotencia',
  requiereDescripcion: 'la descripción obligatoria',
};

function etiquetaDe(propiedad: string): string {
  return ETIQUETAS[propiedad] ?? `el campo ${propiedad}`;
}

function limiteDe(mensaje: string): string {
  const encontrado = /\d+/.exec(mensaje);

  return encontrado === null ? '' : encontrado[0];
}

function valoresDe(mensaje: string): string {
  const separador = mensaje.lastIndexOf(': ');

  return separador === -1 ? '' : mensaje.slice(separador + 2);
}

const PLANTILLAS: Readonly<
  Record<string, (etiqueta: string, original: string) => string>
> = {
  isNotEmpty: (etiqueta) => `Falta completar ${etiqueta}`,
  isDefined: (etiqueta) => `Falta indicar ${etiqueta}`,
  isString: (etiqueta) => `Se esperaba texto en ${etiqueta}`,
  isNumber: (etiqueta) => `Se esperaba un número en ${etiqueta}`,
  isInt: (etiqueta) => `Se esperaba un número entero en ${etiqueta}`,
  isBoolean: (etiqueta) => `Se esperaba verdadero o falso en ${etiqueta}`,
  isArray: (etiqueta) => `Se esperaba una lista en ${etiqueta}`,
  isDateString: (etiqueta) => `Se esperaba una fecha válida en ${etiqueta}`,
  isEmail: () => 'El correo no tiene un formato válido',
  isUuid: (etiqueta) => `Identificador no válido en ${etiqueta}`,
  isPositive: (etiqueta) =>
    `Se esperaba un valor mayor que cero en ${etiqueta}`,
  isEnum: (etiqueta, original) =>
    `Valor no admitido en ${etiqueta}. Opciones: ${valoresDe(original)}`,
  maxLength: (etiqueta, original) =>
    `Máximo ${limiteDe(original)} caracteres en ${etiqueta}`,
  minLength: (etiqueta, original) =>
    `Mínimo ${limiteDe(original)} caracteres en ${etiqueta}`,
  max: (etiqueta, original) =>
    `El máximo permitido en ${etiqueta} es ${limiteDe(original)}`,
  min: (etiqueta, original) =>
    `El mínimo permitido en ${etiqueta} es ${limiteDe(original)}`,
  arrayMinSize: (etiqueta, original) =>
    `Se esperaban al menos ${limiteDe(original)} elementos en ${etiqueta}`,
  arrayMaxSize: (etiqueta, original) =>
    `Se admiten como máximo ${limiteDe(original)} elementos en ${etiqueta}`,
  whitelistValidation: (etiqueta) => `No se puede enviar ${etiqueta}`,
};

function traducir(
  propiedad: string,
  restriccion: string,
  original: string,
): string {
  const plantilla = PLANTILLAS[restriccion];
  const etiqueta = etiquetaDe(propiedad);

  return plantilla === undefined
    ? `Revisa ${etiqueta}`
    : plantilla(etiqueta, original);
}

export interface ErroresTraducidos {
  mensajes: string[];
  campos: Record<string, string>;
}

export function aErroresEnEspanol(
  errores: ValidationError[],
): ErroresTraducidos {
  const mensajes: string[] = [];
  const campos: Record<string, string> = {};

  const recorrer = (lista: ValidationError[]): void => {
    for (const error of lista) {
      for (const [restriccion, original] of Object.entries(
        error.constraints ?? {},
      )) {
        const mensaje = traducir(error.property, restriccion, original);

        mensajes.push(mensaje);
        campos[error.property] ??= mensaje;
      }

      if (error.children !== undefined && error.children.length > 0) {
        recorrer(error.children);
      }
    }
  };

  recorrer(errores);

  return { mensajes, campos };
}
