import { hash } from 'bcrypt';

const RONDAS = 12;

export function cifrarPassword(password: string): Promise<string> {
  return hash(password, RONDAS);
}
