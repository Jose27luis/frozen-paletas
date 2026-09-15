import { Injectable, signal } from '@angular/core';

export type TonoAviso = 'exito' | 'error';

export interface Aviso {
  id: number;
  tono: TonoAviso;
  texto: string;
}

const DURACION = 5000;

@Injectable({ providedIn: 'root' })
export class AvisosService {
  private siguienteId = 0;

  private readonly lista = signal<Aviso[]>([]);

  readonly avisos = this.lista.asReadonly();

  exito(texto: string): void {
    this.mostrar('exito', texto);
  }

  error(texto: string): void {
    this.mostrar('error', texto);
  }

  cerrar(id: number): void {
    this.lista.update((avisos) => avisos.filter((aviso) => aviso.id !== id));
  }

  private mostrar(tono: TonoAviso, texto: string): void {
    const id = this.siguienteId++;

    this.lista.update((avisos) => [...avisos, { id, tono, texto }]);

    setTimeout(() => {
      this.cerrar(id);
    }, DURACION);
  }
}
