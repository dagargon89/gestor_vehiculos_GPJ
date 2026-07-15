import 'reflect-metadata';
import { REQUIRE_PERMISSION_KEY } from '../../common/guards/permissions.guard';
import { NotificationsController } from './notifications.controller';

describe('NotificationsController — metadata de permisos', () => {
  it('create() requiere notifications:create', () => {
    const meta = Reflect.getMetadata(REQUIRE_PERMISSION_KEY, NotificationsController.prototype.create);
    expect(meta).toEqual({ resource: 'notifications', action: 'create' });
  });

  it('remove() requiere notifications:delete', () => {
    const meta = Reflect.getMetadata(REQUIRE_PERMISSION_KEY, NotificationsController.prototype.remove);
    expect(meta).toEqual({ resource: 'notifications', action: 'delete' });
  });
});
