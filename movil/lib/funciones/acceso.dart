import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../datos/almacen_sesion.dart';
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
  final FocusNode _focoPassword = FocusNode();

  bool _enviando = false;
  bool _oculta = true;
  bool _recordar = false;
  String _error = '';

  @override
  void initState() {
    super.initState();
    _recuperar();
  }

  @override
  void dispose() {
    _correo.dispose();
    _password.dispose();
    _focoPassword.dispose();
    super.dispose();
  }

  Future<void> _recuperar() async {
    final Credenciales? guardadas =
        await ref.read(credencialesProvider.future);

    if (!mounted || guardadas == null) {
      return;
    }

    setState(() {
      _correo.text = guardadas.correo;
      _password.text = guardadas.password;
      _recordar = true;
    });
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
      await ref.read(sesionProvider.notifier).entrar(
            _correo.text.trim(),
            _password.text,
            recordar: _recordar,
          );
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
      backgroundColor: Paleta.celeste,
      body: DecoratedBox(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: <Color>[
              Paleta.celeste,
              Paleta.fondo,
              Paleta.superficie,
            ],
            stops: <double>[0, 0.55, 1],
          ),
        ),
        child: Stack(
          children: <Widget>[
            const Positioned(top: -80, right: -60, child: _Burbuja(220)),
            const Positioned(top: 140, left: -70, child: _Burbuja(150)),
            SafeArea(
              child: Center(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 24,
                    vertical: 32,
                  ),
                  child: _Entrada(child: _formulario()),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _formulario() {
    return Container(
      decoration: BoxDecoration(
        color: Paleta.superficie,
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: Paleta.superficie),
        boxShadow: <BoxShadow>[
          BoxShadow(
            color: Paleta.marino.withValues(alpha: 0.16),
            blurRadius: 40,
            offset: const Offset(0, 18),
          ),
          BoxShadow(
            color: Paleta.helado.withValues(alpha: 0.12),
            blurRadius: 18,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      padding: const EdgeInsets.fromLTRB(24, 32, 24, 28),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: <Widget>[
          Center(child: Image.asset('recursos/fronzenlogo.png', height: 64)),
          const SizedBox(height: 18),
          Center(
            child: SizedBox(
              width: 120,
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
          const SizedBox(height: 26),
          const Text(
            'Entrar',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.w700,
              color: Paleta.tinta,
            ),
          ),
          const SizedBox(height: 6),
          const Text(
            'Usa el correo con el que te dieron de alta.',
            textAlign: TextAlign.center,
            style: TextStyle(color: Paleta.tenue),
          ),
          const SizedBox(height: 26),
          TextField(
            controller: _correo,
            keyboardType: TextInputType.emailAddress,
            textInputAction: TextInputAction.next,
            autocorrect: false,
            enabled: !_enviando,
            onSubmitted: (String _) => _focoPassword.requestFocus(),
            decoration: const InputDecoration(
              labelText: 'Correo',
              prefixIcon: Icon(Icons.mail_outline, color: Paleta.tenue),
            ),
          ),
          const SizedBox(height: 14),
          TextField(
            controller: _password,
            focusNode: _focoPassword,
            obscureText: _oculta,
            enabled: !_enviando,
            textInputAction: TextInputAction.done,
            onSubmitted: (String _) => _entrar(),
            decoration: InputDecoration(
              labelText: 'Contraseña',
              prefixIcon: const Icon(Icons.lock_outline, color: Paleta.tenue),
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
          ),
          const SizedBox(height: 6),
          InkWell(
            borderRadius: BorderRadius.circular(12),
            onTap: _enviando
                ? null
                : () => setState(() => _recordar = !_recordar),
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 6),
              child: Row(
                children: <Widget>[
                  Checkbox(
                    value: _recordar,
                    activeColor: Paleta.marino,
                    visualDensity: VisualDensity.compact,
                    materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    onChanged: _enviando
                        ? null
                        : (bool? marcado) =>
                            setState(() => _recordar = marcado ?? false),
                  ),
                  const SizedBox(width: 6),
                  const Expanded(
                    child: Text(
                      'Recordar mi contraseña en este celular',
                      style: TextStyle(color: Paleta.tenue, fontSize: 13),
                    ),
                  ),
                ],
              ),
            ),
          ),
          if (_error.isNotEmpty) ...<Widget>[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.symmetric(
                horizontal: 14,
                vertical: 12,
              ),
              decoration: BoxDecoration(
                color: Paleta.granate.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  const Icon(
                    Icons.error_outline,
                    size: 18,
                    color: Paleta.granate,
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      _error,
                      style: const TextStyle(
                        color: Paleta.granate,
                        fontSize: 13,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
          const SizedBox(height: 22),
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
    );
  }
}

class _Entrada extends StatelessWidget {
  const _Entrada({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return TweenAnimationBuilder<double>(
      tween: Tween<double>(begin: 0, end: 1),
      duration: const Duration(milliseconds: 520),
      curve: Curves.easeOutCubic,
      builder: (BuildContext contexto, double avance, Widget? contenido) =>
          Opacity(
        opacity: avance,
        child: Transform.translate(
          offset: Offset(0, 28 * (1 - avance)),
          child: contenido,
        ),
      ),
      child: child,
    );
  }
}

class _Burbuja extends StatelessWidget {
  const _Burbuja(this.diametro);

  final double diametro;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: diametro,
      height: diametro,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: Paleta.helado.withValues(alpha: 0.14),
      ),
    );
  }
}
