import 'reflect-metadata';
import { REQUIRE_PERMISSION_KEY } from '../../common/guards/permissions.guard';
import { StorageController } from './storage.controller';

describe('StorageController — metadata de permisos', () => {
  it('upload() requiere storage_files:create', () => {
    const meta = Reflect.getMetadata(REQUIRE_PERMISSION_KEY, StorageController.prototype.upload);
    expect(meta).toEqual({ resource: 'storage_files', action: 'create' });
  });

  it('delete() requiere storage_files:delete', () => {
    const meta = Reflect.getMetadata(REQUIRE_PERMISSION_KEY, StorageController.prototype.delete);
    expect(meta).toEqual({ resource: 'storage_files', action: 'delete' });
  });
});
