import * as migration_20260812_114823_initial from './20260812_114823_initial';

export const migrations = [
  {
    up: migration_20260812_114823_initial.up,
    down: migration_20260812_114823_initial.down,
    name: '20260812_114823_initial'
  },
];
