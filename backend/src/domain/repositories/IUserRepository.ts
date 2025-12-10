import { User } from '../entities/User';

export interface IUserRepository {
  save(user: User, password: string): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByEmailWithPassword(email: string): Promise<{ user: User; password: string } | null>;
  findAll(): Promise<User[]>;
  update(user: User): Promise<User>;
  delete(id: string): Promise<void>;
}
