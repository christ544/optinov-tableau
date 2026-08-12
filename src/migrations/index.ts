import * as migration_20260812_092627_initial from './20260812_092627_initial';

export const migrations = [
  {
    up: migration_20260812_092627_initial.up,
    down: migration_20260812_092627_initial.down,
    name: '20260812_092627_initial'
  },
];
