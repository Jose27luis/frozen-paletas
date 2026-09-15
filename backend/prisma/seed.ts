import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { hash } from 'bcrypt';
import { PrismaClient } from '../src/generated/prisma/client';
import {
  CategoriaSabor,
  EstadoSabor,
  Rol,
} from '../src/generated/prisma/enums';
import { CATALOGO_PERMISOS, PERMISOS_POR_DEFECTO } from '../src/permisos/claves';

const RONDAS = 12;

interface SaborInicial {
  nombre: string;
  abreviatura: string;
  categoria: CategoriaSabor;
  estado: EstadoSabor;
}

const SABORES: readonly SaborInicial[] = [
  {
    nombre: 'Maracuyá con relleno de leche condensada',
    abreviatura: 'MAR',
    categoria: CategoriaSabor.CON_RELLENO,
    estado: EstadoSabor.ACTIVO,
  },
  {
    nombre: 'Fresa con relleno de leche condensada',
    abreviatura: 'FRE',
    categoria: CategoriaSabor.CON_RELLENO,
    estado: EstadoSabor.ACTIVO,
  },
  {
    nombre: 'Coco con relleno de manjar',
    abreviatura: 'COC',
    categoria: CategoriaSabor.CON_RELLENO,
    estado: EstadoSabor.ACTIVO,
  },
  {
    nombre: 'Cacao con relleno de fresa',
    abreviatura: 'CAC',
    categoria: CategoriaSabor.CON_RELLENO,
    estado: EstadoSabor.ACTIVO,
  },
  {
    nombre: 'Café con relleno de chocolate',
    abreviatura: 'CAF',
    categoria: CategoriaSabor.CON_RELLENO,
    estado: EstadoSabor.ACTIVO,
  },
  {
    nombre: 'Aguaje',
    abreviatura: 'AGU',
    categoria: CategoriaSabor.AMAZONICO,
    estado: EstadoSabor.ACTIVO,
  },
  {
    nombre: 'Copoazú',
    abreviatura: 'COP',
    categoria: CategoriaSabor.AMAZONICO,
    estado: EstadoSabor.ACTIVO,
  },
  {
    nombre: 'Limón',
    abreviatura: 'LIM',
    categoria: CategoriaSabor.FRUTAL,
    estado: EstadoSabor.ACTIVO,
  },
  {
    nombre: 'Plátano',
    abreviatura: 'PLA',
    categoria: CategoriaSabor.FRUTAL,
    estado: EstadoSabor.ACTIVO,
  },
  {
    nombre: 'Queso helado',
    abreviatura: 'QUE',
    categoria: CategoriaSabor.CREMOSO,
    estado: EstadoSabor.ACTIVO,
  },
  {
    nombre: 'Yogurt',
    abreviatura: 'YOG',
    categoria: CategoriaSabor.CREMOSO,
    estado: EstadoSabor.ACTIVO,
  },
  {
    nombre: 'Oreo',
    abreviatura: 'ORE',
    categoria: CategoriaSabor.CREMOSO,
    estado: EstadoSabor.ACTIVO,
  },
  {
    nombre: 'Ron con pasas',
    abreviatura: 'RON',
    categoria: CategoriaSabor.BEBIDA,
    estado: EstadoSabor.ACTIVO,
  },
  {
    nombre: 'Cocona',
    abreviatura: 'CON',
    categoria: CategoriaSabor.AMAZONICO,
    estado: EstadoSabor.PROXIMO,
  },
  {
    nombre: 'Lúcuma',
    abreviatura: 'LUC',
    categoria: CategoriaSabor.CREMOSO,
    estado: EstadoSabor.PROXIMO,
  },
  {
    nombre: 'Dulce de leche',
    abreviatura: 'DUL',
    categoria: CategoriaSabor.CREMOSO,
    estado: EstadoSabor.PROXIMO,
  },
  {
    nombre: 'Pisco Sour',
    abreviatura: 'PIS',
    categoria: CategoriaSabor.BEBIDA,
    estado: EstadoSabor.PROXIMO,
  },
];

const CAUSAS_DE_MERMA: readonly {
  nombre: string;
  requiereDescripcion: boolean;
}[] = [
  { nombre: 'Rotura', requiereDescripcion: false },
  { nombre: 'Defecto de presentación', requiereDescripcion: false },
  { nombre: 'Caída o contaminación', requiereDescripcion: false },
  { nombre: 'Descongelamiento', requiereDescripcion: false },
  { nombre: 'Error durante producción', requiereDescripcion: false },
  { nombre: 'Error durante embolsado', requiereDescripcion: false },
  { nombre: 'Otro motivo', requiereDescripcion: true },
];

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env['DATABASE_URL'] ?? '',
  }),
});

function exigirVariable(nombre: string): string {
  const valor = process.env[nombre];

  if (valor === undefined || valor.trim() === '') {
    throw new Error(`Falta la variable de entorno ${nombre}`);
  }

  return valor;
}

async function sembrarPermisos(): Promise<void> {
  for (const permiso of CATALOGO_PERMISOS) {
    await prisma.permiso.upsert({
      where: { clave: permiso.clave },
      update: { nombre: permiso.nombre, descripcion: permiso.descripcion },
      create: {
        clave: permiso.clave,
        nombre: permiso.nombre,
        descripcion: permiso.descripcion,
      },
    });
  }

  for (const [rol, claves] of Object.entries(PERMISOS_POR_DEFECTO)) {
    for (const clave of claves) {
      const permiso = await prisma.permiso.findUniqueOrThrow({
        where: { clave },
        select: { id: true },
      });

      await prisma.rolPermiso.upsert({
        where: {
          rol_permisoId: { rol: rol as Rol, permisoId: permiso.id },
        },
        update: {},
        create: { rol: rol as Rol, permisoId: permiso.id },
      });
    }
  }
}

async function sembrarSabores(): Promise<void> {
  for (const sabor of SABORES) {
    await prisma.sabor.upsert({
      where: { nombre: sabor.nombre },
      update: { abreviatura: sabor.abreviatura, categoria: sabor.categoria },
      create: sabor,
    });
  }
}

async function sembrarCausas(): Promise<void> {
  for (const causa of CAUSAS_DE_MERMA) {
    await prisma.causaMerma.upsert({
      where: { nombre: causa.nombre },
      update: { requiereDescripcion: causa.requiereDescripcion },
      create: causa,
    });
  }
}

async function sembrarAdministrador(): Promise<void> {
  const correo = exigirVariable('ADMIN_CORREO');

  await prisma.usuario.upsert({
    where: { correo },
    update: { rol: Rol.ADMIN, activo: true },
    create: {
      nombres: exigirVariable('ADMIN_NOMBRES'),
      apellidos: exigirVariable('ADMIN_APELLIDOS'),
      correo,
      rol: Rol.ADMIN,
      passwordHash: await hash(exigirVariable('ADMIN_PASSWORD'), RONDAS),
    },
  });
}

async function sembrar(): Promise<void> {
  await sembrarPermisos();
  await sembrarSabores();
  await sembrarCausas();
  await sembrarAdministrador();
}

sembrar()
  .then(() => prisma.$disconnect())
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
    return prisma.$disconnect();
  });
