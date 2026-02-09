import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Vehicle } from './vehicle.entity';

@Entity('reservations')
export class Reservation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  vehicleId: string;

  @ManyToOne(() => Vehicle, (v) => v.reservations)
  @JoinColumn({ name: 'vehicle_id' })
  vehicle: Vehicle;

  @Column({ type: 'timestamptz' })
  startDatetime: Date;

  @Column({ type: 'timestamptz' })
  endDatetime: Date;

  @Column({ default: 'pending' })
  status: string;

  @Column({ type: 'int', nullable: true })
  checkinOdometer: number;

  @Column({ type: 'int', nullable: true })
  checkoutOdometer: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
