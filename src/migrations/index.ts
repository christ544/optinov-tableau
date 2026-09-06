import * as migration_20260812_114823_initial from './20260812_114823_initial';
import * as migration_20260906_131031_roles_et_tailles_images from './20260906_131031_roles_et_tailles_images';
import * as migration_20260906_184600_contenus_du_site from './20260906_184600_contenus_du_site';
import * as migration_20260906_190000_faq_et_parametres_initiaux from './20260906_190000_faq_et_parametres_initiaux';
import * as migration_20260906_232705_demandes from './20260906_232705_demandes';

export const migrations = [
  {
    up: migration_20260812_114823_initial.up,
    down: migration_20260812_114823_initial.down,
    name: '20260812_114823_initial',
  },
  {
    up: migration_20260906_131031_roles_et_tailles_images.up,
    down: migration_20260906_131031_roles_et_tailles_images.down,
    name: '20260906_131031_roles_et_tailles_images',
  },
  {
    up: migration_20260906_184600_contenus_du_site.up,
    down: migration_20260906_184600_contenus_du_site.down,
    name: '20260906_184600_contenus_du_site',
  },
  {
    up: migration_20260906_190000_faq_et_parametres_initiaux.up,
    down: migration_20260906_190000_faq_et_parametres_initiaux.down,
    name: '20260906_190000_faq_et_parametres_initiaux',
  },
  {
    up: migration_20260906_232705_demandes.up,
    down: migration_20260906_232705_demandes.down,
    name: '20260906_232705_demandes'
  },
];
