import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../datos/operacion.dart';
import '../datos/sincronizador.dart';
import '../nucleo/formato.dart';
import '../nucleo/proveedores.dart';
import '../nucleo/tema.dart';
import 'detalle.dart';
import 'piezas.dart';

class AvisoCola extends ConsumerWidget {
  const AvisoCola({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final List<Operacion> cola =
        ref.watch(pendientesColaProvider).value ?? const <Operacion>[];

    if (cola.isEmpty) {
      return const SizedBox.shrink();
    }

    final int rechazadas = cola
        .where((Operacion cada) => cada.estado == EstadoOperacion.rechazada)
        .length;
    final int esperando = cola.length - rechazadas;
    final bool hayProblema = rechazadas > 0;

    return Material(
      color: hayProblema
          ? Paleta.granate.withValues(alpha: 0.10)
          : Paleta.aguajeVivo.withValues(alpha: 0.12),
      child: InkWell(
        onTap: () => abrirCola(context, ref),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Row(
            children: <Widget>[
              Icon(
                hayProblema ? Icons.error_outline : Icons.cloud_upload_outlined,
                size: 20,
                color: hayProblema ? Paleta.granate : Paleta.aguaje,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  hayProblema
                      ? '$rechazadas ${rechazadas == 1 ? 'registro rechazado' : 'registros rechazados'} por el servidor'
                      : '$esperando ${esperando == 1 ? 'registro guardado en el celular' : 'registros guardados en el celular'}, falta enviarlos',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: hayProblema ? Paleta.granate : Paleta.aguaje,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Icon(
                Icons.chevron_right,
                size: 20,
                color: hayProblema ? Paleta.granate : Paleta.aguaje,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

Future<void> abrirCola(BuildContext context, WidgetRef ref) async {
  final List<Operacion> cola =
      ref.read(pendientesColaProvider).value ?? const <Operacion>[];

  await abrirDetalle(
    context,
    titulo: 'Registros por enviar',
    subtitulo:
        'Se guardaron en el celular porque no había conexión. Se mandan solos '
        'al volver la señal.',
    children: <Widget>[
      for (final Operacion operacion in cola)
        _FichaOperacion(operacion: operacion),
      const SizedBox(height: 16),
      FilledButton.icon(
        onPressed: () async {
          final ResultadoSincronia resultado =
              await ref.read(pendientesColaProvider.notifier).sincronizar();

          if (!context.mounted) {
            return;
          }

          Navigator.of(context).pop();
          avisar(
            context,
            resultado.enviadas == 0
                ? 'Todavía no se pudo enviar nada'
                : 'Se enviaron ${resultado.enviadas}',
            error: resultado.enviadas == 0,
          );
        },
        icon: const Icon(Icons.sync),
        label: const Text('Intentar enviar ahora'),
      ),
    ],
  );
}

class _FichaOperacion extends ConsumerWidget {
  const _FichaOperacion({required this.operacion});

  final Operacion operacion;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final bool rechazada = operacion.estado == EstadoOperacion.rechazada;

    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Row(
              children: <Widget>[
                Expanded(
                  child: Text(
                    operacion.etiqueta,
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: Paleta.tinta,
                    ),
                  ),
                ),
                Etiqueta(
                  rechazada ? 'Rechazado' : 'En espera',
                  tono: rechazada ? Paleta.granate : Paleta.aguajeVivo,
                ),
              ],
            ),
            const SizedBox(height: 6),
            Text(
              fechaLarga(operacion.creadaEn),
              style: const TextStyle(color: Paleta.tenue, fontSize: 12),
            ),
            if (operacion.motivo != null) ...<Widget>[
              const SizedBox(height: 8),
              Text(
                operacion.motivo!,
                style: const TextStyle(color: Paleta.granate, fontSize: 12),
              ),
            ],
            if (rechazada) ...<Widget>[
              const SizedBox(height: 6),
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: <Widget>[
                  TextButton(
                    onPressed: () => ref
                        .read(pendientesColaProvider.notifier)
                        .reintentar(operacion.id),
                    child: const Text('Reintentar'),
                  ),
                  TextButton(
                    style: TextButton.styleFrom(
                      foregroundColor: Paleta.granate,
                    ),
                    onPressed: () => ref
                        .read(pendientesColaProvider.notifier)
                        .descartar(operacion.id),
                    child: const Text('Descartar'),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}
