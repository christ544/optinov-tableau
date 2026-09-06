import { redirect } from 'next/navigation'

/*
  La racine du domaine n'affiche rien : elle envoie directement vers le
  tableau de bord. Le site vitrine, lui, lit ce projet par son API REST
  (/api/blog, /api/globals/service-images, /api/media...).
*/
export default function Accueil() {
  redirect('/admin')
}
