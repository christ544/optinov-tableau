import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'

export interface LoginOptions {
  page: Page
  serverURL?: string
  user: {
    email: string
    password: string
  }
}

/**
 * Connecte un utilisateur au tableau de bord par la page de connexion,
 * puis attend l'affichage de l'accueil (libellé « Tableau de bord » dans
 * la navigation, l'interface étant en français).
 */
export async function login({
  page,
  serverURL = 'http://localhost:3000',
  user,
}: LoginOptions): Promise<void> {
  await page.goto(`${serverURL}/admin/login`)

  await page.fill('#field-email', user.email)
  await page.fill('#field-password', user.password)
  await page.click('button[type="submit"]')

  await page.waitForURL(`${serverURL}/admin`)

  const accueil = page.locator('span[title="Tableau de bord"]')
  await expect(accueil).toBeVisible()
}
