import { test, expect } from '@playwright/test'

/*
  Ce projet n'a pas de site public : la racine doit renvoyer vers l'admin.
*/
test.describe('Racine du domaine', () => {
  test("redirige vers le tableau de bord", async ({ page }) => {
    await page.goto('http://localhost:3000')

    await expect(page).toHaveURL(/\/admin/)
    await expect(page).toHaveTitle(/OPTINOV/)
  })
})
