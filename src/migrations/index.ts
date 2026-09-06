import * as migration_20260812_114823_initial from './20260812_114823_initial';
import * as migration_20260906_131031_roles_et_tailles_images from './20260906_131031_roles_et_tailles_images';

export const migrations = [
  {
    up: migration_20260812_114823_initial.up,
    down: migration_20260812_114823_initial.down,
    name: '20260812_114823_initial',
  },
  {
    up: migration_20260906_131031_roles_et_tailles_images.up,
    down: migration_20260906_131031_roles_et_tailles_images.down,
    name: '20260906_131031_roles_et_tailles_images'
  },
];
