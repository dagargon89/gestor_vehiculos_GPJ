import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { User } from './user.entity';
import { Permission } from './permission.entity';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  description: string;

  @OneToMany(() => User, (u) => u.role)
  users: User[];

  @ManyToMany(() => Permission, (p) => p.roles, { cascade: true })
  @JoinTable({ name: 'role_permissions' })
  permissions: Permission[];
}
