import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import { usersRepo, type UserRow } from '../db/users.repo.js';

const BCRYPT_ROUNDS = 10;

export const authService = {
  async register(email: string, password: string): Promise<UserRow> {
    const normalized = email.trim().toLowerCase();
    if (usersRepo.findByEmail(normalized)) {
      throw new AuthError('email_taken', 409);
    }
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const id = nanoid();
    usersRepo.insert({ id, email: normalized, passwordHash });
    return usersRepo.findByEmail(normalized)!;
  },

  async verify(email: string, password: string): Promise<UserRow> {
    const normalized = email.trim().toLowerCase();
    const user = usersRepo.findByEmail(normalized);
    if (!user) throw new AuthError('invalid_credentials', 401);
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) throw new AuthError('invalid_credentials', 401);
    return user;
  },
};

export class AuthError extends Error {
  constructor(message: string, public statusCode: number) {
    super(message);
  }
}
