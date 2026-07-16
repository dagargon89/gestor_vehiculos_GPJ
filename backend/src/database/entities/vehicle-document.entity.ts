import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
} from 'typeorm';
import { Vehicle } from './vehicle.entity';

@Entity('vehicle_documents')
export class VehicleDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Vehicle)
  @JoinColumn({ name: 'vehicle_id' })
  vehicle: Vehicle;

  @Column({ name: 'vehicle_id' })
  @Index()
  vehicleId: string;

  @Column()
  documentType: string; // 'insurance' | 'circulation_card' | 'inspection'

  @Column({ type: 'date' })
  @Index()
  expiryDate: Date;

  @Column({ nullable: true })
  storageFileId: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
