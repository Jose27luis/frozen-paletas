import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../datos/fallo_api.dart';
import '../datos/repos/usuarios_repo.dart';
import '../dominio/modelos.dart';
import '../nucleo/proveedores.dart';
import '../nucleo/tema.dart';
import '../ui/filtros.dart';
import '../ui/pantalla.dart';
import '../ui/piezas.dart';

enum _Vista { gente, permisos }

class PantallaUsuarios extends ConsumerStatefulWidget {
  const PantallaUsuarios({super.key});

  @override
  ConsumerState<PantallaUsuarios> createState() => _PantallaUsuariosState();
}

class _PantallaUsuariosState extends ConsumerState<PantallaUsuarios> {
  _Vista _vista = _Vista.gente;

  @override
  Widget build(BuildContext context) {
    final Usuario? sesion = ref.watch(sesionProvider).value;

    if (!(sesion?.puede(Permisos.administrarUsuarios) ?? false)) {
      return const Pantalla(
        titulo: 'Usuarios',
        cuerpo: Vacio('Tu rol no administra usuarios.'),
      );
    }

    return Pantalla(
      titulo: 'Usuarios',
      filtros: BarraDeFiltros(
        children: <Widget>[
          FilaDeChips<_Vista>(
            opciones: const <Opcion<_Vista>>[
              Opcion<_Vista>(valor: _Vista.gente, texto: 'Gente'),
              Opcion<_Vista>(valor: _Vista.permisos, texto: 'Permisos por rol'),
            ],
            elegida: _vista,
            alElegir: (_Vista vista) => setState(() => _vista = vista),
          ),
        ],
      ),
      flotante: _vista == _Vista.gente
          ? FloatingActionButton.extended(
              backgroundColor: Paleta.marino,
              foregroundColor: Paleta.superficie,
              onPressed: () => _editar(context, ref, null),
              icon: const Icon(Icons.person_add_alt),
              label: const Text('Dar de alta'),
            )
          : null,
      cuerpo: _vista == _Vista.gente ? _gente() : const _Permisos(),
    );
  }

  Widget _gente() => Cargado<List<UsuarioListado>>(
        valor: ref.watch(usuariosProvider),
        alRefrescar: () => ref.invalidate(usuariosProvider),
        construir: (List<UsuarioListado> filas) => filas.isEmpty
            ? const ListaVacia('No hay usuarios.')
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
      );
}

class _Permisos extends ConsumerStatefulWidget {
  const _Permisos();

  @override
  ConsumerState<_Permisos> createState() => _PermisosState();
}

class _PermisosState extends ConsumerState<_Permisos> {
  String _rol = 'OPERACIONES';
  bool _guardando = false;

  Future<void> _alternar(Permiso permiso, List<Permiso> todos) async {
    final List<String> claves = <String>[
      for (final Permiso cada in todos)
        if (cada.clave == permiso.clave
            ? !cada.lotiene(_rol)
            : cada.lotiene(_rol))
          cada.clave,
    ];

    setState(() => _guardando = true);

    try {
      await ref.read(usuariosRepoProvider).guardarPermisos(_rol, claves);

      ref.invalidate(permisosProvider);

      if (mounted) {
        avisar(context, 'Permisos guardados');
      }
    } on FalloApi catch (fallo) {
      if (mounted) {
        avisar(context, fallo.mensaje, error: true);
      }
    } finally {
      if (mounted) {
        setState(() => _guardando = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final bool editable = _rol != 'ADMIN';

    return Cargado<List<Permiso>>(
      valor: ref.watch(permisosProvider),
      alRefrescar: () => ref.invalidate(permisosProvider),
      construir: (List<Permiso> permisos) => ListView(
        padding: margenDeLista(context),
        children: <Widget>[
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  const Text(
                    'Los permisos viven en la base de datos: cambiarlos no '
                    'obliga a recompilar nada.',
                    style: TextStyle(color: Paleta.tenue, fontSize: 13),
                  ),
                  const SizedBox(height: 14),
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
                    onChanged: (String? valor) =>
                        setState(() => _rol = valor ?? _rol),
                  ),
                  if (!editable) ...<Widget>[
                    const SizedBox(height: 12),
                    const Text(
                      'Administración conserva todos los permisos y no se '
                      'edita, para que nadie se quede fuera del sistema.',
                      style: TextStyle(color: Paleta.aguaje, fontSize: 12),
                    ),
                  ],
                ],
              ),
            ),
          ),
          const SizedBox(height: 14),
          for (final Permiso permiso in permisos)
            Card(
              margin: const EdgeInsets.only(bottom: 10),
              child: SwitchListTile(
                value: permiso.lotiene(_rol),
                activeThumbColor: Paleta.marino,
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 4,
                ),
                title: Text(
                  permiso.nombre,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: Paleta.tinta,
                  ),
                ),
                subtitle: Padding(
                  padding: const EdgeInsets.only(top: 4),
                  child: Text(
                    permiso.descripcion,
                    style: const TextStyle(
                      color: Paleta.tenue,
                      fontSize: 12,
                    ),
                  ),
                ),
                onChanged: !editable || _guardando
                    ? null
                    : (bool _) => _alternar(permiso, permisos),
              ),
            ),
        ],
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
    final UsuariosRepo repositorio = ref.read(usuariosRepoProvider);

    if (usuario.activo) {
      await repositorio.desactivar(usuario.id);
    } else {
      await repositorio.reactivar(usuario.id);
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
      final UsuariosRepo repositorio = ref.read(usuariosRepoProvider);

      if (usuario == null) {
        await repositorio.crear(datos);
      } else {
        await repositorio.actualizar(usuario.id, datos);
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
