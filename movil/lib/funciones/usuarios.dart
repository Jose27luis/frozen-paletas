import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../datos/fallo_api.dart';
import '../datos/repositorio.dart';
import '../dominio/modelos.dart';
import '../nucleo/proveedores.dart';
import '../nucleo/tema.dart';
import '../ui/menu_lateral.dart';
import '../ui/piezas.dart';

class PantallaUsuarios extends ConsumerWidget {
  const PantallaUsuarios({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final Usuario? sesion = ref.watch(sesionProvider).value;

    if (!(sesion?.puede(Permisos.administrarUsuarios) ?? false)) {
      return Scaffold(
        drawer: const MenuLateral(),
        appBar: AppBar(title: const Text('Usuarios')),
        body: const Vacio('Tu rol no administra usuarios.'),
      );
    }

    final AsyncValue<List<UsuarioListado>> usuarios =
        ref.watch(usuariosProvider);

    return Scaffold(
      drawer: const MenuLateral(),
      appBar: AppBar(title: const Text('Usuarios')),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: Paleta.marino,
        foregroundColor: Paleta.superficie,
        onPressed: () => _editar(context, ref, null),
        icon: const Icon(Icons.person_add_alt),
        label: const Text('Dar de alta'),
      ),
      body: usuarios.when(
        loading: () => const Cargando(),
        error: (Object error, StackTrace rastro) => Fallo(
          mensaje: error.toString(),
          reintentar: () => ref.invalidate(usuariosProvider),
        ),
        data: (List<UsuarioListado> filas) => RefreshIndicator(
          onRefresh: () async => ref.invalidate(usuariosProvider),
          child: filas.isEmpty
              ? ListView(
                  children: const <Widget>[Vacio('No hay usuarios.')],
                )
              : ListView.separated(
                  padding: margenDeLista(context, abajo: 96),
                  itemCount: filas.length,
                  separatorBuilder: (BuildContext contexto, int indice) =>
                      const SizedBox(height: 10),
                  itemBuilder: (BuildContext contexto, int indice) => _Ficha(
                    usuario: filas[indice],
                    alEditar: () => _editar(context, ref, filas[indice]),
                    alCambiarEstado: () =>
                        _cambiarEstado(context, ref, filas[indice]),
                  ),
                ),
        ),
      ),
    );
  }
}

class _Ficha extends StatelessWidget {
  const _Ficha({
    required this.usuario,
    required this.alEditar,
    required this.alCambiarEstado,
  });

  final UsuarioListado usuario;
  final VoidCallback alEditar;
  final VoidCallback alCambiarEstado;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(20),
        onTap: alEditar,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: <Widget>[
              Container(
                width: 46,
                height: 46,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: usuario.activo
                      ? Paleta.marino.withValues(alpha: 0.12)
                      : Paleta.hundido,
                ),
                child: Text(
                  _iniciales,
                  style: TextStyle(
                    fontWeight: FontWeight.w700,
                    color: usuario.activo ? Paleta.marino : Paleta.tenue,
                  ),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    Text(
                      usuario.nombreCompleto,
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                        color: Paleta.tinta,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      usuario.correo,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: Paleta.tenue,
                        fontSize: 12,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: <Widget>[
                        Etiqueta(
                          Etiquetas.rol[usuario.rol] ?? usuario.rol,
                          tono: Paleta.marino,
                        ),
                        const SizedBox(width: 8),
                        if (!usuario.activo)
                          const Etiqueta('Sin acceso', tono: Paleta.granate),
                      ],
                    ),
                  ],
                ),
              ),
              IconButton(
                tooltip: usuario.activo ? 'Quitar el acceso' : 'Devolver el acceso',
                onPressed: alCambiarEstado,
                icon: Icon(
                  usuario.activo ? Icons.block : Icons.check_circle_outline,
                  color: usuario.activo ? Paleta.granate : Paleta.hoja,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String get _iniciales {
    final String nombre =
        usuario.nombres.isEmpty ? '?' : usuario.nombres.substring(0, 1);
    final String apellido =
        usuario.apellidos.isEmpty ? '' : usuario.apellidos.substring(0, 1);

    return '$nombre$apellido'.toUpperCase();
  }
}

Future<void> _cambiarEstado(
  BuildContext context,
  WidgetRef ref,
  UsuarioListado usuario,
) async {
  final bool? confirmado = await showDialog<bool>(
    context: context,
    builder: (BuildContext dialogo) => AlertDialog(
      title: Text(usuario.activo ? 'Quitar el acceso' : 'Devolver el acceso'),
      content: Text(
        usuario.activo
            ? '${usuario.nombreCompleto} ya no podrá entrar. Todo lo que registró se conserva.'
            : '${usuario.nombreCompleto} vuelve a poder entrar con su contraseña de siempre.',
      ),
      actions: <Widget>[
        TextButton(
          onPressed: () => Navigator.of(dialogo).pop(false),
          child: const Text('Cancelar'),
        ),
        FilledButton(
          onPressed: () => Navigator.of(dialogo).pop(true),
          child: Text(usuario.activo ? 'Quitar' : 'Devolver'),
        ),
      ],
    ),
  );

  if (confirmado != true) {
    return;
  }

  try {
    final Repositorio repositorio = ref.read(repositorioProvider);

    if (usuario.activo) {
      await repositorio.desactivarUsuario(usuario.id);
    } else {
      await repositorio.reactivarUsuario(usuario.id);
    }

    ref.invalidate(usuariosProvider);

    if (context.mounted) {
      avisar(context, 'Acceso actualizado');
    }
  } on FalloApi catch (fallo) {
    if (context.mounted) {
      avisar(context, fallo.mensaje, error: true);
    }
  }
}

Future<void> _editar(
  BuildContext context,
  WidgetRef ref,
  UsuarioListado? usuario,
) async {
  await showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    builder: (BuildContext hoja) => Hoja(child: _Formulario(usuario: usuario)),
  );
}

class _Formulario extends ConsumerStatefulWidget {
  const _Formulario({required this.usuario});

  final UsuarioListado? usuario;

  @override
  ConsumerState<_Formulario> createState() => _FormularioState();
}

class _FormularioState extends ConsumerState<_Formulario> {
  late final TextEditingController _nombres;
  late final TextEditingController _apellidos;
  late final TextEditingController _correo;
  final TextEditingController _password = TextEditingController();

  late String _rol;
  bool _enviando = false;
  bool _oculta = true;

  @override
  void initState() {
    super.initState();

    final UsuarioListado? usuario = widget.usuario;

    _nombres = TextEditingController(text: usuario?.nombres ?? '');
    _apellidos = TextEditingController(text: usuario?.apellidos ?? '');
    _correo = TextEditingController(text: usuario?.correo ?? '');
    _rol = usuario?.rol ?? 'OPERACIONES';
  }

  @override
  void dispose() {
    _nombres.dispose();
    _apellidos.dispose();
    _correo.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _guardar() async {
    if (_enviando) {
      return;
    }

    setState(() => _enviando = true);

    final String password = _password.text.trim();

    final Map<String, Object?> datos = <String, Object?>{
      'nombres': _nombres.text.trim(),
      'apellidos': _apellidos.text.trim(),
      'correo': _correo.text.trim(),
      'rol': _rol,
      if (password.isNotEmpty) 'password': password,
    };

    try {
      final UsuarioListado? usuario = widget.usuario;
      final Repositorio repositorio = ref.read(repositorioProvider);

      if (usuario == null) {
        await repositorio.crearUsuario(datos);
      } else {
        await repositorio.actualizarUsuario(usuario.id, datos);
      }

      ref.invalidate(usuariosProvider);

      if (mounted) {
        Navigator.of(context).pop();
        avisar(context, 'Usuario guardado');
      }
    } on FalloApi catch (fallo) {
      if (mounted) {
        setState(() => _enviando = false);
        avisar(context, fallo.mensaje, error: true);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final bool nuevo = widget.usuario == null;

    return SingleChildScrollView(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: <Widget>[
            Text(
              nuevo ? 'Dar de alta a alguien' : 'Editar usuario',
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: Paleta.tinta,
              ),
            ),
            const SizedBox(height: 18),
            Row(
              children: <Widget>[
                Expanded(
                  child: TextField(
                    controller: _nombres,
                    textCapitalization: TextCapitalization.words,
                    decoration: const InputDecoration(labelText: 'Nombres'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: TextField(
                    controller: _apellidos,
                    textCapitalization: TextCapitalization.words,
                    decoration: const InputDecoration(labelText: 'Apellidos'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _correo,
              keyboardType: TextInputType.emailAddress,
              autocorrect: false,
              decoration: const InputDecoration(labelText: 'Correo'),
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              initialValue: _rol,
              isExpanded: true,
              decoration: const InputDecoration(labelText: 'Rol'),
              items: <DropdownMenuItem<String>>[
                for (final MapEntry<String, String> fila
                    in Etiquetas.rol.entries)
                  DropdownMenuItem<String>(
                    value: fila.key,
                    child: Text(fila.value),
                  ),
              ],
              onChanged: (String? elegido) =>
                  setState(() => _rol = elegido ?? _rol),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _password,
              obscureText: _oculta,
              decoration: InputDecoration(
                labelText: nuevo ? 'Contraseña' : 'Contraseña nueva',
                helperText: nuevo
                    ? 'Mínimo 8 caracteres'
                    : 'Déjalo vacío para no cambiarla',
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
            const SizedBox(height: 20),
            FilledButton(
              onPressed: _enviando ? null : _guardar,
              child: _enviando
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Paleta.superficie,
                      ),
                    )
                  : const Text('Guardar'),
            ),
          ],
        ),
      ),
    );
  }
}
