import { v4 as uuidv4 } from 'uuid';

export type UserRole = 'admin' | 'operator' | 'viewer';

export interface UserProps {
  id?: string;
  email: string;
  name: string;
  phone: string;
  role: UserRole;
  isActive: boolean;
  notifyByEmail: boolean;
  notifyBySms: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class User {
  public readonly id: string;
  public email: string;
  public name: string;
  public phone: string;
  public role: UserRole;
  public isActive: boolean;
  public notifyByEmail: boolean;
  public notifyBySms: boolean;
  public readonly createdAt: Date;
  public updatedAt: Date;

  constructor(props: UserProps) {
    this.id = props.id || uuidv4();
    this.email = props.email;
    this.name = props.name;
    this.phone = props.phone;
    this.role = props.role;
    this.isActive = props.isActive;
    this.notifyByEmail = props.notifyByEmail;
    this.notifyBySms = props.notifyBySms;
    this.createdAt = props.createdAt || new Date();
    this.updatedAt = props.updatedAt || new Date();
  }

  static create(
    email: string,
    name: string,
    role: UserRole = 'viewer',
    phone?: string
  ): User {
    return new User({
      email,
      name,
      phone,
      role,
      isActive: true,
      notifyByEmail: true,
      notifyBySms: !!phone,
    });
  }

  getNotificationChannel(): 'email' | 'sms' | 'both' | 'none' {
    if (this.notifyByEmail && this.notifyBySms && this.phone) return 'both';
    if (this.notifyByEmail) return 'email';
    if (this.notifyBySms && this.phone) return 'sms';
    return 'none';
  }

  toJSON() {
    return {
      id: this.id,
      email: this.email,
      name: this.name,
      phone: this.phone,
      role: this.role,
      isActive: this.isActive,
      notifyByEmail: this.notifyByEmail,
      notifyBySms: this.notifyBySms,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
