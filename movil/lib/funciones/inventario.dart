import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../datos/repos/inventario_repo.dart';
import '../dominio/modelos.dart';
import '../nucleo/formato.dart';
import '../nucleo/proveedores.dart';
import '../nucleo/tema.dart';
import '../ui/detalle.dart';
import '../ui/filtros.dart';
import '../ui/pantalla.dart';
import '../ui/piezas.dart';
import 'lotes.dart';

enum _Vista { stock, movimientos }

const List<Opcion<String>> _ordenes = <Opcion<String>>[
  Opcion<String>(valor: 'urgencia', texto: 'Por urgencia'),
  Opcion<String>(valor: 'nombre', texto: 'Por nombre'),
  Opcion<String>(valor: 'stock', texto: 'Por stock'),
];

const List<Opcion<String>> _estados = <Opcion<String>>[
  Opcion<String>(valor: 'TODOS', texto: 'Todos'),
  Opcion<String>(valor: 'REPONER', texto: 'Piden reposición'),
  Opcion<String>(valor: 'AGOTADO', texto: 'Agotados'),
  Opcion<String>(valor: 'DISPONIBLE', texto: 'Con stock'),
];

class PantallaInventario extends ConsumerStatefulWidget {
  const PantallaInventario({super.key});

  @override
  ConsumerState<PantallaInventario> createState() => _PantallaInventarioState();
}

class _PantallaInventarioState extends ConsumerState<PantallaInventario> {
  final TextEditingController _busqueda = TextEditingController();

  _Vista _vista = _Vista.stock;
  String _estado = 'TODOS';
  String _orden = 'urgencia';

  @override
  void dispose() {
    _busqueda.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Pantalla(
      titulo: 'Inventario',
      acciones: <Widget>[
        IconButton(
          tooltip: 'Buscar un lote por su código',
          icon: const Icon(Icons.qr_code_2_outlined),
          onPressed: () => buscarLote(context, ref),
        ),
      ],
      filtros: BarraDeFiltros(
        children: <Widget>[
          FilaDeChips<_Vista>(
            opciones: const <Opcion<_Vista>>[
              Opcion<_Vista>(valor: _Vista.stock, texto: 'Stock por sabor'),
              Opcion<_Vista>(
                valor: _Vista.movimientos,
                texto: 'Movimientos',
              ),
            ],
            elegida: _vista,
            alElegir: (_Vista vista) => setState(() => _vista = vista),
          ),
          const SizedBox(height: 10),
          if (_vista == _Vista.stock) ..._filtrosDeStock() else _filtroDeTipo(),
        ],
      ),
      cuerpo: _vista == _Vista.stock ? _stock() : _movimientos(),
    );
  }

  List<Widget> _filtrosDeStock() => <Widget>[
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: TextField(
            controller: _busqueda,
            onChanged: (String _) => setState(() {}),
            decoration: InputDecoration(
              labelText: 'Buscar un sabor',
              isDense: true,
              prefixIcon: const Icon(Icons.search, color: Paleta.tenue),
              suffixIcon: _busqueda.text.isEmpty
                  ? null
                  : IconButton(
                      tooltip: 'Limpiar la búsqueda',
                      icon: const Icon(Icons.close, color: Paleta.tenue),
                      onPressed: () => setState(_busqueda.clear),
                    ),
            ),
          ),
        ),
        const SizedBox(height: 10),
        FilaDeChips<String>(
          opciones: _estados,
          elegida: _estado,
          alElegir: (String estado) => setState(() => _estado = estado),
        ),
        const SizedBox(height: 8),
        FilaDeChips<String>(
          opciones: _ordenes,
          elegida: _orden,
          alElegir: (String orden) => setState(() => _orden = orden),
        ),
      ];

  Widget _filtroDeTipo() {
    final FiltroMovimientos filtro = ref.watch(filtroMovimientosProvider);

    return FilaDeChips<String?>(
      opciones: <Opcion<String?>>[
        const Opcion<String?>(valor: null, texto: 'Todos'),
        for (final MapEntry<String, String> fila
            in Etiquetas.tipoMovimiento.entries)
          Opcion<String?>(valor: fila.key, texto: fila.value),
      ],
      elegida: filtro.tipo,
      alElegir: (String? tipo) =>
          ref.read(filtroMovimientosProvider.notifier).porTipo(tipo),
    );
  }

  Widget _stock() {
    return Cargado<Inventario>(
      valor: ref.watch(inventarioProvider),
      alRefrescar: () => ref.invalidate(inventarioProvider),
      construir: (Inventario datos) {
        final List<StockSabor> visibles = _ordenar(_filtrar(datos.sabores));

        if (visibles.isEmpty) {
          return const ListaVacia('Ningún sabor cumple ese filtro.');
        }

        return ListView.separated(
          padding: margenDeLista(context),
          itemCount: visibles.length + 1,
          separatorBuilder: (BuildContext contexto, int indice) =>
              const SizedBox(height: 10),
          itemBuilder: (BuildContext contexto, int indice) => indice == 0
              ? _Resumen(inventario: datos, visibles: visibles.length)
              : _FilaSabor(sabor: visibles[indice - 1]),
        );
      },
    );
  }

  Widget _movimientos() {
    return Cargado<List<Movimiento>>(
      valor: ref.watch(movimientosProvider),
      alRefrescar: () => ref.invalidate(movimientosProvider),
      construir: (List<Movimiento> filas) => filas.isEmpty
          ? const ListaVacia('No hay movimientos con ese filtro.')
          : ListView.separated(
              padding: margenDeLista(context),
              itemCount: filas.length,
              separatorBuilder: (BuildContext contexto, int indice) =>
                  const SizedBox(height: 8),
              itemBuilder: (BuildContext contexto, int indice) =>
                  _FilaMovimiento(movimiento: filas[indice]),
            ),
    );
  }

  List<StockSabor> _filtrar(List<StockSabor> sabores) {
    final String texto = _busqueda.text.trim().toLowerCase();

    return sabores.where((StockSabor sabor) {
      final bool coincide =
          texto.isEmpty || sabor.nombre.toLowerCase().contains(texto);
      final bool pasa = _estado == 'TODOS' || sabor.estado == _estado;

      return coincide && pasa;
    }).toList();
  }

  List<StockSabor> _ordenar(List<StockSabor> sabores) {
    final List<StockSabor> copia = <StockSabor>[...sabores];

    switch (_orden) {
      case 'nombre':
        copia.sort((StockSabor a, StockSabor b) => a.nombre.compareTo(b.nombre));
      case 'stock':
        copia.sort((StockSabor a, StockSabor b) => b.stock.compareTo(a.stock));
      default:
        copia.sort(
          (StockSabor a, StockSabor b) => _urgencia(a).compareTo(_urgencia(b)),
        );
    }

    return copia;
  }

  double _urgencia(StockSabor sabor) =>
      sabor.stock / (sabor.stockMinimo < 1 ? 1 : sabor.stockMinimo);
}

class _Resumen extends StatelessWidget {
  const _Resumen({required this.inventario, required this.visibles});

  final Inventario inventario;
  final int visibles;

  @override
  Widget build(BuildContext context) {
    final int reponer = inventario.sabores
        .where((StockSabor sabor) => sabor.estado != 'DISPONIBLE')
        .length;

    return Cabecera(
      rotulo: 'Paletas en almacén',
      valor: miles(inventario.total),
      apunte: reponer == 0
          ? 'Todos los sabores por encima del mínimo'
          : '$reponer ${reponer == 1 ? 'sabor pide' : 'sabores piden'} reposición',
      derecha: <Widget>[
        Insignia('$visibles de ${inventario.sabores.length} sabores'),
      ],
    );
  }
}

class _FilaMovimiento extends StatelessWidget {
  const _FilaMovimiento({required this.movimiento});

  final Movimiento movimiento;

  @override
  Widget build(BuildContext context) {
    final Color tono = movimiento.entra ? Paleta.hoja : Paleta.granate;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          children: <Widget>[
            Container(
              width: 38,
              height: 38,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: tono.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(
                movimiento.entra ? Icons.south_west : Icons.north_east,
                size: 18,
                color: tono,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Text(
                    movimiento.sabor,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: Paleta.tinta,
                    ),
                  ),
                  const SizedBox(height: 3),
                  Text(
                    '${fechaCorta(movimiento.fecha)} · ${Etiquetas.tipoMovimiento[movimiento.tipo] ?? movimiento.tipo}'
                    '${movimiento.lote == null ? '' : ' · ${movimiento.lote}'}',
                    style: const TextStyle(color: Paleta.tenue, fontSize: 12),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 10),
            Text(
              '${movimiento.entra ? '+' : ''}${miles(movimiento.cantidad)}',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: tono,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _FilaSabor extends ConsumerWidget {
  const _FilaSabor({required this.sabor});

  final StockSabor sabor;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final Color tono = tonoDelEstado(sabor.estado);

    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(20),
        onTap: () => _abrir(context, ref),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Expanded(
                    child: Text(
                      sabor.nombre,
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                        color: Paleta.tinta,
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Etiqueta(
                    Etiquetas.estadoStock[sabor.estado] ?? sabor.estado,
                    tono: tono,
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: <Widget>[
                  Cifra(miles(sabor.stock), tamano: 28, tono: tono),
                  const SizedBox(width: 8),
                  Padding(
                    padding: const EdgeInsets.only(bottom: 4),
                    child: Text(
                      'de ${miles(sabor.stockMinimo)} mínimo',
                      style: const TextStyle(
                        color: Paleta.tenue,
                        fontSize: 12,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              BarraStock(
                stock: sabor.stock,
                minimo: sabor.stockMinimo,
                tono: tono,
              ),
              const SizedBox(height: 10),
              Text(
                '${sabor.lotesAbiertos} ${sabor.lotesAbiertos == 1 ? 'lote abierto' : 'lotes abiertos'}'
                '${sabor.antiguedadDelMasViejo == null ? '' : ' · el más viejo de hace ${sabor.antiguedadDelMasViejo} días'}',
                style: const TextStyle(color: Paleta.tenue, fontSize: 12),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _abrir(BuildContext context, WidgetRef ref) async {
    ref.read(filtroMovimientosProvider.notifier).porSabor(sabor.saborId);

    await abrirDetalle(
      context,
      titulo: sabor.nombre,
      subtitulo: '${miles(sabor.stock)} paletas disponibles',
      children: <Widget>[
        FilaDetalle(rotulo: 'Estado', valor: Etiquetas.estadoStock[sabor.estado] ?? sabor.estado),
        FilaDetalle(rotulo: 'Stock mínimo', valor: miles(sabor.stockMinimo)),
        FilaDetalle(
          rotulo: 'Lotes abiertos',
          valor: '${sabor.lotesAbiertos}',
        ),
        FilaDetalle(
          rotulo: 'Lote más viejo',
          valor: sabor.antiguedadDelMasViejo == null
              ? 'Sin lotes con stock'
              : 'hace ${sabor.antiguedadDelMasViejo} días',
        ),
        const Seccion('ÚLTIMOS MOVIMIENTOS'),
        Consumer(
          builder: (BuildContext contexto, WidgetRef lector, Widget? hijo) =>
              lector.watch(movimientosProvider).when(
                    loading: () => const Cargando(),
                    error: (Object error, StackTrace rastro) =>
                        Vacio(error.toString()),
                    data: (List<Movimiento> filas) => filas.isEmpty
                        ? const Vacio('Este sabor todavía no tiene movimientos.')
                        : Column(
                            children: <Widget>[
                              for (final Movimiento movimiento
                                  in filas.take(12))
                                _FilaMovimiento(movimiento: movimiento),
                            ],
                          ),
                  ),
        ),
      ],
    );

    ref.read(filtroMovimientosProvider.notifier).porSabor(null);
  }
}
