import { test, expect, Page } from '@playwright/test'
import { login } from '../helpers/login'
import { seedTestUser, cleanupTestUser, testUser } from '../helpers/seedUser'

/*
  Parcours de base dans l'admin : accueil, liste, formulaire de création.
  Les libellés attendus sont ceux de l'interface en français (voir
  `i18n` dans src/payload.config.ts et `labels` dans src/collections/Users.ts).
*/
test.describe("Tableau de bord d'administration", () => {
  let page: Page

  test.beforeAll(async ({ browser }) => {
    await seedTestUser()

    const context = await browser.newContext()
    page = await context.newPage()

    await login({ page, user: testUser })
  })

  test.afterAll(async () => {
    await cleanupTestUser()
  })

  test("affiche l'accueil", async () => {
    await page.goto('http://localhost:3000/admin')
    await expect(page).toHaveURL('http://localhost:3000/admin')
    const accueil = page.locator('span[title="Tableau de bord"]').first()
    await expect(accueil).toBeVisible()
  })

  test('affiche la liste des utilisateurs', async () => {
    await page.goto('http://localhost:3000/admin/collections/users')
    await expect(page).toHaveURL('http://localhost:3000/admin/collections/users')
    const titre = page.locator('h1', { hasText: 'Utilisateurs' }).first()
    await expect(titre).toBeVisible()
  })

  test("ouvre le formulaire de création d'un utilisateur", async () => {
    await page.goto('http://localhost:3000/admin/collections/users/create')
    await expect(page).toHaveURL(/\/admin\/collections\/users\/[a-zA-Z0-9-_]+/)
    const champEmail = page.locator('input[name="email"]')
    await expect(champEmail).toBeVisible()
  })
})
