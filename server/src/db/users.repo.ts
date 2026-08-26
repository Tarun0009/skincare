import { db } from './index.js';

export interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  created_at: string;
}

const insertStmt = db.prepare(
  `INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)`
);
const findByEmailStmt = db.prepare(
  `SELECT * FROM users WHERE email = ?`
);
const findByIdStmt = db.prepare(`SELECT * FROM users WHERE id = ?`);

export const usersRepo = {
  insert(user: { id: string; email: string; passwordHash: string }): void {
    insertStmt.run(user.id, user.email, user.passwordHash);
  },
  findByEmail(email: string): UserRow | undefined {
    return findByEmailStmt.get(email) as UserRow | undefined;
  },
  findById(id: string): UserRow | undefined {
    return findByIdStmt.get(id) as UserRow | undefined;
  },
};
