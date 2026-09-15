-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ADMIN', 'OPERACIONES', 'PRODUCCION', 'CONSULTA');

-- CreateEnum
CREATE TYPE "CategoriaSabor" AS ENUM ('CON_RELLENO', 'AMAZONICO', 'FRUTAL', 'CREMOSO', 'BEBIDA');

-- CreateEnum
CREATE TYPE "EstadoSabor" AS ENUM ('ACTIVO', 'PROXIMO', 'INACTIVO');

-- CreateEnum
CREATE TYPE "EstadoProduccion" AS ENUM ('REGISTRADA', 'EMBOLSADA', 'ANULADA');

-- CreateEnum
CREATE TYPE "EstadoLote" AS ENUM ('PENDIENTE', 'ABIERTO', 'PARCIAL', 'AGOTADO');

-- CreateEnum
CREATE TYPE "TipoMovimiento" AS ENUM ('INGRESO_PRODUCCION', 'SALIDA', 'MERMA', 'AJUSTE');

-- CreateEnum
CREATE TYPE "TipoSalida" AS ENUM ('PDV', 'MAYORISTA', 'DELIVERY', 'FERIA', 'OTRA');

-- CreateEnum
CREATE TYPE "OrigenMerma" AS ENUM ('PRODUCCION', 'EMBOLSADO', 'STOCK');

-- CreateEnum
CREATE TYPE "EstadoConteo" AS ENUM ('ABIERTO', 'CERRADO');

-- CreateTable
CREATE TABLE "usuario" (
    "id" TEXT NOT NULL,
    "nombres" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "rol" "Rol" NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permiso" (
    "id" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,

    CONSTRAINT "permiso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rol_permiso" (
    "id" TEXT NOT NULL,
    "rol" "Rol" NOT NULL,
    "permiso_id" TEXT NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rol_permiso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sabor" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "abreviatura" CHAR(3) NOT NULL,
    "categoria" "CategoriaSabor" NOT NULL,
    "estado" "EstadoSabor" NOT NULL DEFAULT 'ACTIVO',
    "stock_minimo" INTEGER NOT NULL DEFAULT 80,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sabor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produccion" (
    "id" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "sabor_id" TEXT NOT NULL,
    "cantidad_obtenida" INTEGER NOT NULL,
    "cantidad_embolsada" INTEGER,
    "estado" "EstadoProduccion" NOT NULL DEFAULT 'REGISTRADA',
    "responsable_id" TEXT NOT NULL,
    "clave_idempotencia" TEXT NOT NULL,
    "motivo_anulacion" TEXT,
    "embolsado_en" TIMESTAMP(3),
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "produccion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lote" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "sabor_id" TEXT NOT NULL,
    "produccion_id" TEXT NOT NULL,
    "fecha_produccion" DATE NOT NULL,
    "correlativo" INTEGER NOT NULL,
    "cantidad_ingresada" INTEGER NOT NULL DEFAULT 0,
    "stock_restante" INTEGER NOT NULL DEFAULT 0,
    "estado" "EstadoLote" NOT NULL DEFAULT 'PENDIENTE',
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimiento" (
    "id" TEXT NOT NULL,
    "tipo" "TipoMovimiento" NOT NULL,
    "fecha" DATE NOT NULL,
    "sabor_id" TEXT NOT NULL,
    "lote_id" TEXT,
    "cantidad" INTEGER NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "referencia_tipo" TEXT,
    "referencia_id" TEXT,
    "motivo" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimiento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "destino" (
    "id" TEXT NOT NULL,
    "tipo" "TipoSalida" NOT NULL,
    "nombre" TEXT NOT NULL,
    "direccion" TEXT,
    "telefono" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "destino_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "salida" (
    "id" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "tipo" "TipoSalida" NOT NULL,
    "destino_id" TEXT,
    "motivo" TEXT,
    "usuario_id" TEXT NOT NULL,
    "clave_idempotencia" TEXT NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "salida_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "salida_detalle" (
    "id" TEXT NOT NULL,
    "salida_id" TEXT NOT NULL,
    "sabor_id" TEXT NOT NULL,
    "lote_id" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precio_unitario" DECIMAL(10,2),
    "lote_manual" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "salida_detalle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "causa_merma" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "requiere_descripcion" BOOLEAN NOT NULL DEFAULT false,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "causa_merma_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "merma" (
    "id" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "sabor_id" TEXT NOT NULL,
    "lote_id" TEXT,
    "produccion_id" TEXT,
    "cantidad" INTEGER NOT NULL,
    "causa_id" TEXT NOT NULL,
    "origen" "OrigenMerma" NOT NULL,
    "observacion" TEXT,
    "usuario_id" TEXT NOT NULL,
    "clave_idempotencia" TEXT NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "merma_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conteo" (
    "id" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "estado" "EstadoConteo" NOT NULL DEFAULT 'ABIERTO',
    "usuario_id" TEXT NOT NULL,
    "autorizado_por_id" TEXT,
    "cerrado_en" TIMESTAMP(3),
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conteo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conteo_detalle" (
    "id" TEXT NOT NULL,
    "conteo_id" TEXT NOT NULL,
    "sabor_id" TEXT NOT NULL,
    "stock_sistema" INTEGER NOT NULL,
    "stock_fisico" INTEGER,
    "diferencia" INTEGER,
    "motivo" TEXT,

    CONSTRAINT "conteo_detalle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ajuste" (
    "id" TEXT NOT NULL,
    "conteo_detalle_id" TEXT NOT NULL,
    "sabor_id" TEXT NOT NULL,
    "lote_id" TEXT,
    "movimiento_id" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "motivo" TEXT NOT NULL,
    "autorizado_por_id" TEXT NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ajuste_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auditoria" (
    "id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuario_id" TEXT NOT NULL,
    "entidad" TEXT NOT NULL,
    "entidad_id" TEXT NOT NULL,
    "accion" TEXT NOT NULL,
    "movimiento_id" TEXT,
    "valor_anterior" JSONB,
    "valor_nuevo" JSONB,
    "motivo" TEXT,

    CONSTRAINT "auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuario_correo_key" ON "usuario"("correo");

-- CreateIndex
CREATE INDEX "usuario_rol_idx" ON "usuario"("rol");

-- CreateIndex
CREATE UNIQUE INDEX "permiso_clave_key" ON "permiso"("clave");

-- CreateIndex
CREATE INDEX "rol_permiso_rol_idx" ON "rol_permiso"("rol");

-- CreateIndex
CREATE UNIQUE INDEX "rol_permiso_rol_permiso_id_key" ON "rol_permiso"("rol", "permiso_id");

-- CreateIndex
CREATE UNIQUE INDEX "sabor_nombre_key" ON "sabor"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "sabor_abreviatura_key" ON "sabor"("abreviatura");

-- CreateIndex
CREATE INDEX "sabor_estado_idx" ON "sabor"("estado");

-- CreateIndex
CREATE INDEX "produccion_sabor_id_fecha_idx" ON "produccion"("sabor_id", "fecha");

-- CreateIndex
CREATE INDEX "produccion_estado_idx" ON "produccion"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "produccion_responsable_id_clave_idempotencia_key" ON "produccion"("responsable_id", "clave_idempotencia");

-- CreateIndex
CREATE UNIQUE INDEX "lote_codigo_key" ON "lote"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "lote_produccion_id_key" ON "lote"("produccion_id");

-- CreateIndex
CREATE INDEX "lote_sabor_id_estado_idx" ON "lote"("sabor_id", "estado");

-- CreateIndex
CREATE INDEX "lote_fecha_produccion_idx" ON "lote"("fecha_produccion");

-- CreateIndex
CREATE UNIQUE INDEX "lote_sabor_id_fecha_produccion_correlativo_key" ON "lote"("sabor_id", "fecha_produccion", "correlativo");

-- CreateIndex
CREATE INDEX "movimiento_sabor_id_fecha_idx" ON "movimiento"("sabor_id", "fecha");

-- CreateIndex
CREATE INDEX "movimiento_lote_id_idx" ON "movimiento"("lote_id");

-- CreateIndex
CREATE INDEX "movimiento_tipo_fecha_idx" ON "movimiento"("tipo", "fecha");

-- CreateIndex
CREATE INDEX "movimiento_referencia_tipo_referencia_id_idx" ON "movimiento"("referencia_tipo", "referencia_id");

-- CreateIndex
CREATE INDEX "destino_tipo_activo_idx" ON "destino"("tipo", "activo");

-- CreateIndex
CREATE UNIQUE INDEX "destino_tipo_nombre_key" ON "destino"("tipo", "nombre");

-- CreateIndex
CREATE INDEX "salida_tipo_fecha_idx" ON "salida"("tipo", "fecha");

-- CreateIndex
CREATE INDEX "salida_destino_id_idx" ON "salida"("destino_id");

-- CreateIndex
CREATE UNIQUE INDEX "salida_usuario_id_clave_idempotencia_key" ON "salida"("usuario_id", "clave_idempotencia");

-- CreateIndex
CREATE INDEX "salida_detalle_salida_id_idx" ON "salida_detalle"("salida_id");

-- CreateIndex
CREATE INDEX "salida_detalle_sabor_id_idx" ON "salida_detalle"("sabor_id");

-- CreateIndex
CREATE INDEX "salida_detalle_lote_id_idx" ON "salida_detalle"("lote_id");

-- CreateIndex
CREATE UNIQUE INDEX "causa_merma_nombre_key" ON "causa_merma"("nombre");

-- CreateIndex
CREATE INDEX "merma_sabor_id_fecha_idx" ON "merma"("sabor_id", "fecha");

-- CreateIndex
CREATE INDEX "merma_causa_id_idx" ON "merma"("causa_id");

-- CreateIndex
CREATE INDEX "merma_origen_idx" ON "merma"("origen");

-- CreateIndex
CREATE UNIQUE INDEX "merma_usuario_id_clave_idempotencia_key" ON "merma"("usuario_id", "clave_idempotencia");

-- CreateIndex
CREATE INDEX "conteo_estado_idx" ON "conteo"("estado");

-- CreateIndex
CREATE INDEX "conteo_fecha_idx" ON "conteo"("fecha");

-- CreateIndex
CREATE INDEX "conteo_detalle_sabor_id_idx" ON "conteo_detalle"("sabor_id");

-- CreateIndex
CREATE UNIQUE INDEX "conteo_detalle_conteo_id_sabor_id_key" ON "conteo_detalle"("conteo_id", "sabor_id");

-- CreateIndex
CREATE UNIQUE INDEX "ajuste_conteo_detalle_id_key" ON "ajuste"("conteo_detalle_id");

-- CreateIndex
CREATE UNIQUE INDEX "ajuste_movimiento_id_key" ON "ajuste"("movimiento_id");

-- CreateIndex
CREATE INDEX "ajuste_sabor_id_idx" ON "ajuste"("sabor_id");

-- CreateIndex
CREATE INDEX "auditoria_entidad_entidad_id_idx" ON "auditoria"("entidad", "entidad_id");

-- CreateIndex
CREATE INDEX "auditoria_usuario_id_idx" ON "auditoria"("usuario_id");

-- CreateIndex
CREATE INDEX "auditoria_fecha_idx" ON "auditoria"("fecha");

-- AddForeignKey
ALTER TABLE "rol_permiso" ADD CONSTRAINT "rol_permiso_permiso_id_fkey" FOREIGN KEY ("permiso_id") REFERENCES "permiso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produccion" ADD CONSTRAINT "produccion_sabor_id_fkey" FOREIGN KEY ("sabor_id") REFERENCES "sabor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produccion" ADD CONSTRAINT "produccion_responsable_id_fkey" FOREIGN KEY ("responsable_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lote" ADD CONSTRAINT "lote_sabor_id_fkey" FOREIGN KEY ("sabor_id") REFERENCES "sabor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lote" ADD CONSTRAINT "lote_produccion_id_fkey" FOREIGN KEY ("produccion_id") REFERENCES "produccion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimiento" ADD CONSTRAINT "movimiento_sabor_id_fkey" FOREIGN KEY ("sabor_id") REFERENCES "sabor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimiento" ADD CONSTRAINT "movimiento_lote_id_fkey" FOREIGN KEY ("lote_id") REFERENCES "lote"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimiento" ADD CONSTRAINT "movimiento_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salida" ADD CONSTRAINT "salida_destino_id_fkey" FOREIGN KEY ("destino_id") REFERENCES "destino"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salida" ADD CONSTRAINT "salida_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salida_detalle" ADD CONSTRAINT "salida_detalle_salida_id_fkey" FOREIGN KEY ("salida_id") REFERENCES "salida"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salida_detalle" ADD CONSTRAINT "salida_detalle_sabor_id_fkey" FOREIGN KEY ("sabor_id") REFERENCES "sabor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salida_detalle" ADD CONSTRAINT "salida_detalle_lote_id_fkey" FOREIGN KEY ("lote_id") REFERENCES "lote"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "merma" ADD CONSTRAINT "merma_sabor_id_fkey" FOREIGN KEY ("sabor_id") REFERENCES "sabor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "merma" ADD CONSTRAINT "merma_lote_id_fkey" FOREIGN KEY ("lote_id") REFERENCES "lote"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "merma" ADD CONSTRAINT "merma_produccion_id_fkey" FOREIGN KEY ("produccion_id") REFERENCES "produccion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "merma" ADD CONSTRAINT "merma_causa_id_fkey" FOREIGN KEY ("causa_id") REFERENCES "causa_merma"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "merma" ADD CONSTRAINT "merma_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conteo" ADD CONSTRAINT "conteo_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conteo" ADD CONSTRAINT "conteo_autorizado_por_id_fkey" FOREIGN KEY ("autorizado_por_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conteo_detalle" ADD CONSTRAINT "conteo_detalle_conteo_id_fkey" FOREIGN KEY ("conteo_id") REFERENCES "conteo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conteo_detalle" ADD CONSTRAINT "conteo_detalle_sabor_id_fkey" FOREIGN KEY ("sabor_id") REFERENCES "sabor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ajuste" ADD CONSTRAINT "ajuste_conteo_detalle_id_fkey" FOREIGN KEY ("conteo_detalle_id") REFERENCES "conteo_detalle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ajuste" ADD CONSTRAINT "ajuste_sabor_id_fkey" FOREIGN KEY ("sabor_id") REFERENCES "sabor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ajuste" ADD CONSTRAINT "ajuste_lote_id_fkey" FOREIGN KEY ("lote_id") REFERENCES "lote"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ajuste" ADD CONSTRAINT "ajuste_movimiento_id_fkey" FOREIGN KEY ("movimiento_id") REFERENCES "movimiento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ajuste" ADD CONSTRAINT "ajuste_autorizado_por_id_fkey" FOREIGN KEY ("autorizado_por_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditoria" ADD CONSTRAINT "auditoria_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditoria" ADD CONSTRAINT "auditoria_movimiento_id_fkey" FOREIGN KEY ("movimiento_id") REFERENCES "movimiento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
