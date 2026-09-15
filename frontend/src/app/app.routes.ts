import { Routes } from '@angular/router';
import { PERMISOS } from './nucleo/etiquetas';
import { exigePermiso, exigeSesion, soloInvitados } from './nucleo/sesion.guard';
import { Marco } from './ui/marco';

export const routes: Routes = [
  {
    path: 'acceso',
    canActivate: [soloInvitados],
    loadComponent: () => import('./paginas/acceso.pagina').then((m) => m.AccesoPagina),
  },
  {
    path: '',
    component: Marco,
    canActivate: [exigeSesion],
    children: [
      {
        path: 'panel',
        loadComponent: () => import('./paginas/panel.pagina').then((m) => m.PanelPagina),
      },
      {
        path: 'inventario',
        loadComponent: () => import('./paginas/inventario.pagina').then((m) => m.InventarioPagina),
      },
      {
        path: 'produccion',
        loadComponent: () => import('./paginas/produccion.pagina').then((m) => m.ProduccionPagina),
      },
      {
        path: 'salidas',
        loadComponent: () => import('./paginas/salidas.pagina').then((m) => m.SalidasPagina),
      },
      {
        path: 'mermas',
        loadComponent: () => import('./paginas/mermas.pagina').then((m) => m.MermasPagina),
      },
      {
        path: 'lotes',
        loadComponent: () => import('./paginas/lotes.pagina').then((m) => m.LotesPagina),
      },
      {
        path: 'sabores',
        loadComponent: () => import('./paginas/sabores.pagina').then((m) => m.SaboresPagina),
      },
      {
        path: 'usuarios',
        canActivate: [exigePermiso(PERMISOS.ADMINISTRAR_USUARIOS)],
        loadComponent: () => import('./paginas/usuarios.pagina').then((m) => m.UsuariosPagina),
      },
      { path: '', pathMatch: 'full', redirectTo: 'panel' },
    ],
  },
  { path: '**', redirectTo: '' },
];
