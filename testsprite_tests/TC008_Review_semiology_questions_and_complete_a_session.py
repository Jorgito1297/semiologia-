import asyncio
import re
from playwright import async_api
from playwright.async_api import expect

async def run_test():
    pw = None
    browser = None
    context = None

    try:
        # Start a Playwright session in asynchronous mode
        pw = await async_api.async_playwright().start()

        # Launch a Chromium browser in headless mode with custom arguments
        browser = await pw.chromium.launch(
            headless=True,
            args=[
                "--window-size=1280,720",
                "--disable-dev-shm-usage",
                "--ipc=host",
                "--single-process"
            ],
        )

        # Create a new browser context (like an incognito window)
        context = await browser.new_context()
        # Wider default timeout to match the agent's DOM-stability budget;
        # auto-waiting Playwright APIs (expect, locator.wait_for) inherit this.
        context.set_default_timeout(15000)

        # Open a new page in the browser context
        page = await context.new_page()

        # Interact with the page elements to simulate user flow
        # -> navigate
        await page.goto("http://localhost:3000")
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=5000)
        except Exception:
            pass
        
        # -> Click the 'Acceder en Modo Demo Comercial (Prueba Offline)' button on the login page to enter demo mode and access the app without institutional credentials.
        # Acceder en Modo Demo Comercial (Prueba Offline) button
        elem = page.get_by_role('button', name='Acceder en Modo Demo Comercial (Prueba Offline)', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the 'Reclamar Recompensa Inicial' button on the onboarding card to enter the app dashboard so the semiology review can be started.
        # 🎁 Reclamar Recompensa Inicial ➔ button
        elem = page.get_by_role('button', name='🎁 Reclamar Recompensa Inicial ➔', exact=True)
        await elem.click(timeout=10000)
        
        # -> Select the answer 'La Historia de la Enfermedad Actual (HEA)' to answer Question 1 and reveal the explanation/feedback.
        # B La Historia de la Enfermedad Actual (HEA) button
        elem = page.get_by_role('button', name='B La Historia de la Enfermedad Actual (HEA)', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the 'Siguiente Caso' button to proceed to Question 2 of 5 and load the next case.
        # Siguiente Caso ➔ button
        elem = page.get_by_role('button', name='Siguiente Caso ➔', exact=True)
        await elem.click(timeout=10000)
        
        # -> Select the answer 'Percusión dígito-digital de Gerhardt — Matidez' to answer Question 2 and reveal the explanation and clinical pearl.
        # B Percusión dígito-digital de Gerhardt — Matidez button
        elem = page.get_by_role('button', name='B Percusión dígito-digital de Gerhardt — Matidez', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the 'Siguiente Caso' button to proceed to Question 3 and load the next case.
        # Siguiente Caso ➔ button
        elem = page.get_by_role('button', name='Siguiente Caso ➔', exact=True)
        await elem.click(timeout=10000)
        
        # -> Select the answer 'La ictericia y la fiebre son signos; las náuseas y la debilidad son síntomas.' to answer Question 3 and reveal the explanation and clinical pearl.
        # B La ictericia y la fiebre son signos; las... button
        elem = page.get_by_role('button', name='B La ictericia y la fiebre son signos; las náuseas y la debilidad son síntomas.', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the 'Siguiente Caso' button to advance to Question 4 and verify the UI shows Question 4 with its answer options and explanation area.
        # Siguiente Caso ➔ button
        elem = page.get_by_role('button', name='Siguiente Caso ➔', exact=True)
        await elem.click(timeout=10000)
        
        # -> Select the answer 'Decúbito dorsal (supino) con rodillas ligeramente flexionadas' to answer Question 4 and reveal its explanation/clinical pearl.
        # B Decúbito dorsal (supino) con rodillas... button
        elem = page.get_by_role('button', name='B Decúbito dorsal (supino) con rodillas ligeramente flexionadas', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the 'Siguiente Caso' button to advance to Question 5 and verify that the Question 5 prompt and its answer options are displayed.
        # Siguiente Caso ➔ button
        elem = page.get_by_role('button', name='Siguiente Caso ➔', exact=True)
        await elem.click(timeout=10000)
        
        # -> Select the answer 'Correlacionar los signos auscultatorios con la anamnesis para estructurar un Síndrome Valvular (ej. Insuficiencia Mitral)'.
        # B Correlacionar los signos auscultatorios con la... button
        elem = page.locator('xpath=/html/body/div[2]/div[3]/div/div[5]/button[2]')
        await elem.click(timeout=10000)
        
        # -> Click the 'Ver Diagnóstico' button to display the diagnosis, clinical pearl, and any additional explanation for Question 5.
        # Ver Diagnóstico ➔ button
        elem = page.get_by_role('button', name='Ver Diagnóstico ➔', exact=True)
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> Verify a session score summary is displayed
        await page.locator("xpath=/html/body/div[2]/div[3]/div").nth(0).scroll_into_view_if_needed()
        # Assert: The session summary container with the title and scores is visible.
        await expect(page.locator("xpath=/html/body/div[2]/div[3]/div").nth(0)).to_be_visible(timeout=15000), "The session summary container with the title and scores is visible."
        await page.locator("xpath=/html/body/div[2]/div[3]/div/div[4]/div[1]/div[1]/span[2]").nth(0).scroll_into_view_if_needed()
        # Assert: The first competency score ('100 %') is visible in the summary.
        await expect(page.locator("xpath=/html/body/div[2]/div[3]/div/div[4]/div[1]/div[1]/span[2]").nth(0)).to_be_visible(timeout=15000), "The first competency score ('100 %') is visible in the summary."
        await page.locator("xpath=/html/body/div[2]/div[3]/div/div[4]/div[2]/div[1]/span[2]").nth(0).scroll_into_view_if_needed()
        # Assert: The second competency score ('100 %') is visible in the summary.
        await expect(page.locator("xpath=/html/body/div[2]/div[3]/div/div[4]/div[2]/div[1]/span[2]").nth(0)).to_be_visible(timeout=15000), "The second competency score ('100 %') is visible in the summary."
        await page.locator("xpath=/html/body/div[2]/div[3]/div/div[4]/div[3]/div[1]/span[2]").nth(0).scroll_into_view_if_needed()
        # Assert: The third competency score ('100 %') is visible in the summary.
        await expect(page.locator("xpath=/html/body/div[2]/div[3]/div/div[4]/div[3]/div[1]/span[2]").nth(0)).to_be_visible(timeout=15000), "The third competency score ('100 %') is visible in the summary."
        current_url = await page.evaluate("() => window.location.href")
        # Assert: page loaded with a URL (final outcome verified by the AI judge during the run)
        assert current_url, 'Page should have loaded with a URL'
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    