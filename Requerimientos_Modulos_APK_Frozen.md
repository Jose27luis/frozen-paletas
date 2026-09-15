# FROZEN PALETAS ARTESANALES

## Requerimientos funcionales para la APK de control operativo

**Documento de trabajo para José -- Soporte Tecnológico**\
**Versión:** septiembre de 2026

------------------------------------------------------------------------

## 1. Objetivo

Desarrollar una APK que permita controlar de forma simple y confiable el
inventario de paletas de Frozen, desde la producción hasta la salida del
producto.

El sistema debe permitir responder rápidamente:

-   ¿Cuántas paletas hay disponibles?
-   ¿Cuántas hay por sabor?
-   ¿Qué se produjo y cuándo?
-   ¿Cuántas quedaron listas después del embolsado?
-   ¿Qué producto salió y hacia dónde?
-   ¿Qué mermas ocurrieron?
-   ¿Qué sabores necesitan producirse?
-   ¿El stock del sistema coincide con el conteo físico?

------------------------------------------------------------------------

## 2. Lógica general

**Producción → Embolsado → Stock disponible → Salidas → Inventario
actual**

Movimientos que afectan el stock:

  Movimiento                                               Efecto
  --------------------------------- -----------------------------
  Paletas terminadas y embolsadas                        \+ Stock
  Salida a PDV                                           \- Stock
  Venta a cliente mayorista                              \- Stock
  Delivery                                               \- Stock
  Salida a feria                                         \- Stock
  Merma                                                  \- Stock
  Ajuste de inventario físico         +/- Stock con justificación

> El stock disponible debe incrementarse cuando las paletas hayan
> terminado su producción y embolsado y estén aptas para
> comercialización.

------------------------------------------------------------------------

# MÓDULO 1. SABORES

## Finalidad

Administrar el catálogo de sabores que maneja Frozen.

## Sabores actuales

### Con relleno

1.  Maracuyá con relleno de leche condensada
2.  Fresa con relleno de leche condensada
3.  Coco con relleno de manjar
4.  Cacao con relleno de fresa
5.  Café con relleno de chocolate

### Amazónicos

6.  Aguaje
7.  Copoazú

### Frutales

8.  Limón
9.  Plátano

### Cremosos y clásicos

10. Queso helado
11. Yogurt
12. Oreo

### Inspirados en bebidas

13. Ron con pasas

## Sabores próximos

-   Cocona
-   Lúcuma
-   Dulce de leche
-   Pisco Sour

## Funciones

-   Crear sabor.
-   Editar sabor.
-   Activar o desactivar sabor.
-   Clasificar sabores.
-   Diferenciar entre **Activo** y **Próximo/Inactivo**.
-   Solo los sabores activos deben generar alertas de stock.

------------------------------------------------------------------------

# MÓDULO 2. PRODUCCIÓN

## Finalidad

Registrar las paletas elaboradas y conocer el rendimiento real de cada
producción.

Actualmente se producen normalmente alrededor de **3 baldes por día**,
equivalentes aproximadamente a **450 paletas**, aunque la cantidad puede
variar.

## Responsable principal

**Katerin**

## Datos mínimos

-   Fecha.
-   Sabor.
-   Cantidad obtenida al terminar la producción.
-   Cantidad final después del embolsado.
-   Merma, si existe.
-   Responsable.
-   Lote.

## Flujo

**Producción terminada → Conteo → Embolsado → Conteo final → Ingreso al
stock**

### Ejemplo

-   Sabor: Coco
-   Producción obtenida: 150 paletas
-   Paletas embolsadas y aptas: 147
-   Merma: 3
-   **Ingreso al stock: 147 paletas**

El sistema debe conservar tanto la cantidad producida como la cantidad
final apta para venta.

------------------------------------------------------------------------

# MÓDULO 3. LOTES Y TRAZABILIDAD

## Finalidad

Identificar cuándo fue producido cada grupo de paletas.

Cada producción debe generar o asociarse a un lote.

### Ejemplo de código

`FRE-140926-01`

Interpretación: - FRE = Fresa - 140926 = 14/09/2026 - 01 = primera
producción/lote del día

## Información del lote

-   Código.
-   Sabor.
-   Fecha de producción.
-   Cantidad producida.
-   Cantidad embolsada.
-   Merma.
-   Responsable.
-   Stock restante del lote.

------------------------------------------------------------------------

# MÓDULO 4. INVENTARIO DE PRODUCTO TERMINADO

## Finalidad

Mostrar en tiempo real cuántas paletas están disponibles para
comercialización.

## Unidad de control

**Paletas individuales (unidades).**

## Funciones

-   Stock total.
-   Stock por sabor.
-   Consulta por lote.
-   Historial de movimientos.
-   Stock mínimo.
-   Alertas de reposición.
-   Ajustes autorizados.

## Stock mínimo inicial

**80 paletas por sabor activo.**

### Estado sugerido

-   **Más de 80 unidades:** Stock disponible.
-   **80 unidades o menos:** Requiere reposición.
-   **0 unidades:** Agotado.

> El valor de 80 unidades será una regla inicial. Más adelante podrá
> ajustarse por sabor según la rotación y demanda real.

------------------------------------------------------------------------

# MÓDULO 5. SALIDAS DE PRODUCTO

## Finalidad

Registrar hacia dónde salen las paletas y descontarlas automáticamente
del inventario.

## Tipos de salida

### 1. Punto de Venta (PDV)

Abastecimiento a establecimientos incorporados como puntos de venta de
Frozen.

### 2. Cliente mayorista

Persona o comercio que compra una cantidad mayorista, por ejemplo 100
paletas, sin necesariamente formar parte de la red de PDV.

### 3. Delivery

Venta directa al consumidor. Actualmente se plantea un pedido mínimo de
**12 unidades**, a **S/ 5.00 por paleta**, con delivery gratuito dentro
de Puerto Maldonado.

### 4. Feria

Paletas retiradas del inventario para comercialización en ferias.

### 5. Otra salida

Para movimientos excepcionales. Debe ser obligatorio indicar el motivo.

## Datos mínimos

-   Fecha.
-   Tipo de salida.
-   Cliente/PDV/destino.
-   Sabor.
-   Cantidad.
-   Lote, cuando corresponda.
-   Usuario que registra.

## Formas de registro

La APK debe permitir: 1. Descontar producto desde un pedido registrado.
2. Registrar una salida manual cuando sea necesario.

------------------------------------------------------------------------

# MÓDULO 6. MERMAS

## Finalidad

Registrar producto que se pierde y ya no queda disponible para la venta.

## Responsable principal

**Katerin**

## Causas iniciales

-   Rotura.
-   Defecto de presentación.
-   Caída o contaminación.
-   Descongelamiento.
-   Error durante producción.
-   Error durante embolsado.
-   Otro motivo, con descripción obligatoria.

Actualmente no se considera **vencimiento** como causa predeterminada.

## Datos mínimos

-   Fecha.
-   Sabor.
-   Lote.
-   Cantidad.
-   Causa.
-   Observación.
-   Responsable del registro.

La merma debe descontarse automáticamente del inventario cuando
corresponda a producto que ya había ingresado al stock.

------------------------------------------------------------------------

# MÓDULO 7. INVENTARIO FÍSICO Y AJUSTES

## Finalidad

Comprobar que el stock registrado en la APK coincida con las paletas que
realmente existen.

## Responsable

**Katerin**

## Frecuencia

**Cada 15 días.**

## Flujo

**Stock del sistema → Conteo físico → Comparación → Diferencia → Ajuste
justificado**

El sistema debe guardar: - Fecha del conteo. - Stock registrado. - Stock
físico. - Diferencia. - Motivo del ajuste. - Usuario que realizó el
conteo. - Usuario que autorizó la corrección, cuando corresponda.

No se requiere contar todo diariamente. El inventario se actualiza
mediante los movimientos y el conteo físico sirve como verificación
periódica.

------------------------------------------------------------------------

# MÓDULO 8. ALERTAS Y REPOSICIÓN

## Finalidad

Ayudar a decidir qué sabores deben producirse.

## Regla inicial

Cuando un sabor activo tenga **80 paletas o menos**, debe aparecer como
producto que requiere reposición.

### Ejemplo

-   Coco: 54 → **Reponer**
-   Aguaje: 72 → **Reponer**
-   Oreo: 86 → Disponible
-   Fresa: 143 → Disponible

## Vista sugerida

### Sabores a producir

Mostrar automáticamente los sabores que alcanzaron o bajaron del stock
mínimo.

En una etapa posterior, el sistema podrá sugerir cantidades de
producción utilizando ventas históricas y velocidad de rotación.

------------------------------------------------------------------------

# MÓDULO 9. PANEL PRINCIPAL / DASHBOARD

## Finalidad

Permitir conocer el estado de Frozen sin revisar varios registros.

Al ingresar, Darwin debería visualizar como mínimo:

1.  **Stock total de paletas.**
2.  **Stock por sabor.**
3.  **Sabores que requieren reposición.**
4.  **Producciones recientes.**
5.  **Salidas recientes.**
6.  **Mermas registradas.**

## Indicadores posteriores

Cuando exista suficiente información histórica, se pueden incorporar: -
Producción por periodo. - Salidas por sabor. - Sabores de mayor
rotación. - Sabores de menor rotación. - Porcentaje de merma. -
Diferencias de inventario. - Salidas por canal: PDV, mayorista, delivery
y feria.

------------------------------------------------------------------------

# MÓDULO 10. USUARIOS Y PERMISOS

## Usuarios operativos

-   Franklin
-   Darwin
-   Katerin
-   María

José tendrá acceso técnico para desarrollo, mantenimiento y
administración del sistema según sea necesario.

## Permisos sugeridos

### Franklin

-   Visualizar información general.
-   Consultar inventario, movimientos e indicadores.

### Darwin

-   Acceso operativo completo.
-   Consultar inventario.
-   Registrar y revisar movimientos.
-   Autorizar/corregir ajustes cuando corresponda.
-   Consultar reportes.

### Katerin

-   Registrar producción.
-   Registrar cantidad final embolsada.
-   Registrar mermas.
-   Realizar conteo físico.
-   Consultar inventario.

### María

-   Consultar inventario.
-   Acceso a las funciones operativas que posteriormente se le asignen
    formalmente.

> Los permisos deben poder modificarse sin necesidad de reprogramar la
> APK.

------------------------------------------------------------------------

# MÓDULO 11. HISTORIAL Y AUDITORÍA

## Finalidad

Evitar que una modificación elimine la trazabilidad del inventario.

Cada movimiento debe guardar: - Fecha y hora. - Usuario. - Tipo de
movimiento. - Sabor. - Cantidad. - Valor anterior. - Valor nuevo. -
Motivo, cuando exista corrección.

Los registros importantes no deberían eliminarse sin dejar evidencia.
Las correcciones deben realizarse mediante ajustes trazables.

------------------------------------------------------------------------

# MÓDULO 12. REPORTES

## Reportes iniciales

-   Stock actual por sabor.
-   Producción por fecha.
-   Producción por sabor.
-   Salidas por periodo.
-   Salidas por tipo de cliente/canal.
-   Mermas por periodo.
-   Mermas por causa.
-   Historial de ajustes físicos.
-   Sabores bajo stock mínimo.

Los reportes deben poder filtrarse por fechas.

------------------------------------------------------------------------

## 3. Alcance recomendado de desarrollo

No es necesario desarrollar todos los módulos completos desde el primer
día.

### Fase 1 --- Control básico

1.  Sabores.
2.  Producción.
3.  Lotes.
4.  Inventario.
5.  Salidas.
6.  Mermas.
7.  Panel básico.

### Fase 2 --- Control y verificación

8.  Inventario físico.
9.  Alertas de reposición.
10. Usuarios y permisos.
11. Historial/auditoría.

### Fase 3 --- Gestión y análisis

12. Reportes.
13. Indicadores.
14. Reposición basada en rotación.
15. Integración con otros controles de Frozen.

------------------------------------------------------------------------

## 4. Decisiones que aún deben validarse con José

Antes de cerrar el desarrollo, deben definirse técnicamente los
siguientes puntos:

-   Cómo se generará automáticamente el código de lote.
-   Si una salida descontará primero los lotes más antiguos (PEPS/FIFO).
-   Qué movimientos podrán corregirse y quién podrá autorizarlos.
-   Cómo funcionará el inventario si temporalmente no hay conexión a
    internet.
-   Si la APK enviará notificaciones cuando un sabor alcance el stock
    mínimo.
-   Cómo se relacionará este módulo con el sistema actual de gastos,
    fondos, entregas y pagos.
-   Qué información deberá respaldarse y cómo se recuperará ante una
    pérdida de datos.

------------------------------------------------------------------------

## 5. Resultado esperado

El sistema no debe limitarse a mostrar una cantidad de paletas. Debe
registrar el movimiento del producto desde que termina su producción
hasta que sale de Frozen.

El resultado esperado es que Darwin pueda abrir la APK y conocer
inmediatamente:

> **qué hay disponible, qué se produjo, qué salió, qué se perdió, qué
> necesita reposición y si el inventario registrado coincide con la
> existencia física.**
