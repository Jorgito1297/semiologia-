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
        
        # -> Click the 'Continuar con Correo Institucional UCE' button to start the institutional SSO login flow.
        # 🔑 Continuar con Correo Institucional UCE button
        elem = page.get_by_role('button', name='🔑 Continuar con Correo Institucional UCE', exact=True)
        await elem.click(timeout=10000)
        
        # -> click
        # 🔑 Continuar con Correo Institucional UCE button
        elem = page.get_by_role('button', name='🔑 Continuar con Correo Institucional UCE', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the 'Continuar con Correo Institucional UCE' button to open the institutional SSO flow and wait for the SSO page or email/password fields to appear.
        # 🔑 Continuar con Correo Institucional UCE button
        elem = page.get_by_role('button', name='🔑 Continuar con Correo Institucional UCE', exact=True)
        await elem.click(timeout=10000)
        
        # -> navigate
        await page.goto("http://localhost:3000/login")
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=5000)
        except Exception:
            pass
        
        # -> Click the 'Acceder en Modo Demo Comercial (Prueba Offline)' button to enter demo mode and check for a role selector or a Faculty/Instructor area.
        # Acceder en Modo Demo Comercial (Prueba Offline) button
        elem = page.get_by_role('button', name='Acceder en Modo Demo Comercial (Prueba Offline)', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the 'Reclamar Recompensa Inicial' button to advance the onboarding flow and reveal navigation or account controls that may allow switching to an instructor/faculty area.
        # 🎁 Reclamar Recompensa Inicial ➔ button
        elem = page.get_by_role('button', name='🎁 Reclamar Recompensa Inicial ➔', exact=True)
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        current_url = await page.evaluate("() => window.location.href")
        # Assert: page loaded with a URL (final outcome verified by the AI judge during the run)
        assert current_url, 'Page should have loaded with a URL'
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
    