import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../dominio/modelos.dart';
import '../nucleo/modulos.dart';
import '../nucleo/proveedores.dart';
import '../nucleo/tema.dart';

class MenuLateral extends ConsumerWidget {
  const MenuLateral({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final Modulo actual = ref.watch(moduloProvider);
    final Usuario? usuario = ref.watch(sesionProvider).value;

    return Drawer(
      backgroundColor: Paleta.superficie,
      width: 292,
      child: Column(
        children: <Widget>[
          _Cabecera(usuario: usuario),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.symmetric(
                horizontal: 12,
                vertical: 12,
              ),
              children: <Widget>[
                for (final Modulo modulo in Modulo.values)
                  _Enlace(
                    modulo: modulo,
                    activo: modulo == actual,
                    alTocar: () {
                      ref.read(moduloProvider.notifier).abrir(modulo);
                      Navigator.of(context).pop();
                    },
                  ),
              ],
            ),
          ),
          const Divider(height: 1),
          SafeArea(
            top: false,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(12, 8, 12, 12),
              child: InkWell(
                borderRadius: BorderRadius.circular(14),
                onTap: () {
                  Navigator.of(context).pop();
                  ref.read(sesionProvider.notifier).salir();
                },
                child: const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 14, vertical: 14),
                  child: Row(
                    children: <Widget>[
                      Icon(Icons.logout, size: 20, color: Paleta.granate),
                      SizedBox(width: 14),
                      Text(
                        'Cerrar sesión',
                        style: TextStyle(
                          color: Paleta.granate,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _Cabecera extends StatelessWidget {
  const _Cabecera({required this.usuario});

  final Usuario? usuario;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: <Color>[Paleta.marino, Paleta.helado],
        ),
      ),
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 22),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 14,
                  vertical: 10,
                ),
                decoration: BoxDecoration(
                  color: Paleta.superficie,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Image.asset('recursos/fronzenlogo.png', height: 36),
              ),
              const SizedBox(height: 18),
              Text(
                _nombre,
                style: const TextStyle(
                  color: Paleta.superficie,
                  fontSize: 17,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 6),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 4,
                ),
                decoration: BoxDecoration(
                  color: Paleta.superficie.withValues(alpha: 0.22),
                  borderRadius: BorderRadius.circular(999),
                ),
                child: Text(
                  usuario?.rol ?? '',
                  style: const TextStyle(
                    color: Paleta.superficie,
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    letterSpacing: 0.6,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String get _nombre {
    final Usuario? actual = usuario;

    if (actual == null) {
      return 'Frozen Paletas';
    }

    return '${actual.nombres} ${actual.apellidos}'.trim();
  }
}

class _Enlace extends StatelessWidget {
  const _Enlace({
    required this.modulo,
    required this.activo,
    required this.alTocar,
  });

  final Modulo modulo;
  final bool activo;
  final VoidCallback alTocar;

  @override
  Widget build(BuildContext context) {
    final Color tinta = activo ? Paleta.superficie : Paleta.tinta;

    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(14),
          onTap: alTocar,
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 180),
            curve: Curves.easeOut,
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            decoration: BoxDecoration(
              color: activo ? Paleta.marino : Colors.transparent,
              borderRadius: BorderRadius.circular(14),
            ),
            child: Row(
              children: <Widget>[
                Icon(
                  activo ? modulo.iconoActivo : modulo.icono,
                  size: 22,
                  color: activo ? Paleta.helado : Paleta.tenue,
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: <Widget>[
                      Text(
                        modulo.rotulo,
                        style: TextStyle(
                          color: tinta,
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        modulo.detalle,
                        style: TextStyle(
                          color: activo
                              ? Paleta.superficie.withValues(alpha: 0.72)
                              : Paleta.tenue,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
