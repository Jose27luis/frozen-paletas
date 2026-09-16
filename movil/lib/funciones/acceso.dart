import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../datos/fallo_api.dart';
import '../nucleo/proveedores.dart';
import '../nucleo/tema.dart';

class PantallaAcceso extends ConsumerStatefulWidget {
  const PantallaAcceso({super.key});

  @override
  ConsumerState<PantallaAcceso> createState() => _PantallaAccesoState();
}

class _PantallaAccesoState extends ConsumerState<PantallaAcceso> {
  final TextEditingController _correo = TextEditingController();
  final TextEditingController _password = TextEditingController();

  bool _enviando = false;
  bool _oculta = true;
  String _error = '';

  @override
  void dispose() {
    _correo.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _entrar() async {
    if (_enviando) {
      return;
    }

    setState(() {
      _enviando = true;
      _error = '';
    });

    try {
      await ref
          .read(sesionProvider.notifier)
          .entrar(_correo.text.trim(), _password.text);
    } on FalloApi catch (fallo) {
      setState(() => _error = fallo.mensaje);
    } finally {
      if (mounted) {
        setState(() => _enviando = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Paleta.fondo,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Card(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: <Widget>[
                    Center(
                      child: Image.asset(
                        'recursos/fronzenlogo.png',
                        height: 56,
                      ),
                    ),
                    const SizedBox(height: 20),
                    Center(
                      child: SizedBox(
                        width: 112,
                        height: 4,
                        child: Row(
                          children: <Widget>[
                            Expanded(child: ColoredBox(color: Paleta.helado)),
                            Expanded(child: ColoredBox(color: Paleta.granate)),
                            Expanded(child: ColoredBox(color: Paleta.marino)),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 28),
                    const Text(
                      'Entrar',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.w600,
                        color: Paleta.tinta,
                      ),
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      'Usa el correo con el que te dieron de alta.',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: Paleta.tenue),
                    ),
                    const SizedBox(height: 24),
                    TextField(
                      controller: _correo,
                      keyboardType: TextInputType.emailAddress,
                      autocorrect: false,
                      decoration: const InputDecoration(labelText: 'Correo'),
                    ),
                    const SizedBox(height: 14),
                    TextField(
                      controller: _password,
                      obscureText: _oculta,
                      decoration: InputDecoration(
                        labelText: 'Contraseña',
                        suffixIcon: IconButton(
                          tooltip: _oculta
                              ? 'Mostrar la contraseña'
                              : 'Ocultar la contraseña',
                          icon: Icon(
                            _oculta
                                ? Icons.visibility_outlined
                                : Icons.visibility_off_outlined,
                            color: Paleta.tenue,
                          ),
                          onPressed: () => setState(() => _oculta = !_oculta),
                        ),
                      ),
                      onSubmitted: (String _) => _entrar(),
                    ),
                    if (_error.isNotEmpty) ...<Widget>[
                      const SizedBox(height: 14),
                      Text(
                        _error,
                        style: const TextStyle(color: Paleta.granate),
                      ),
                    ],
                    const SizedBox(height: 24),
                    FilledButton(
                      onPressed: _enviando ? null : _entrar,
                      child: _enviando
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Paleta.superficie,
                              ),
                            )
                          : const Text('Entrar'),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
