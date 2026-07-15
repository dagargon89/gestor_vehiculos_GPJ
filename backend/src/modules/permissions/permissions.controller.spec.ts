import 'reflect-metadata';
import { REQUIRE_PERMISSION_KEY } from '../../common/guards/permissions.guard';
import { PermissionsController } from './permissions.controller';

describe('PermissionsController — metadata de permisos', () => {
  it('create() requiere permissions:create', () => {
    const meta = Reflect.getMetadata(REQUIRE_PERMISSION_KEY, PermissionsController.prototype.create);
    expect(meta).toEqual({ resource: 'permissions', action: 'create' });
  });

  it('update() requiere permissions:update', () => {
    const meta = Reflect.getMetadata(REQUIRE_PERMISSION_KEY, PermissionsController.prototype.update);
    expect(meta).toEqual({ resource: 'permissions', action: 'update' });
  });

  it('remove() requiere permissions:delete', () => {
    const meta = Reflect.getMetadata(REQUIRE_PERMISSION_KEY, PermissionsController.prototype.remove);
    expect(meta).toEqual({ resource: 'permissions', action: 'delete' });
  });
});
