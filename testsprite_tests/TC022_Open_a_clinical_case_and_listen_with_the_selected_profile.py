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
        
        # -> Open the Auscultation page by navigating to the 'Auscultación' page URL (/auscultacion) so the clinical cases and body map can be interacted with.
        await page.goto("http://localhost:3000/auscultacion")
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=5000)
        except Exception:
            pass
        
        # -> Open the 'Caso Clínico' dropdown and select the clinical case 'Estenosis Aórtica Severa' from the list.
        # -- Práctica Libre -- Estenosis Aórtica Severa... dropdown
        elem = page.locator('xpath=/html/body/div[2]/div[3]/div/div/div/div[3]/div[2]/select')
        await elem.click(timeout=10000)
        
        # -> Select the clinical case 'Estenosis Aórtica Severa' from the 'Caso Clínico' dropdown so the case becomes active.
        # -- Práctica Libre -- Estenosis Aórtica Severa... dropdown
        elem = page.locator("xpath=/html/body/div[2]/div[3]/div/div/div/div[3]/div[2]/select").nth(0)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.select_option("")
        
        # -> Click the 'Auscultar' button to start auscultation playback for the currently shown focus ('Foco Aórtico').
        # 🔊 Auscultar button
        elem = page.get_by_role('button', name='🔊 Auscultar', exact=True)
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> Verify the chosen clinical case is active
        # Assert: The Caso Clínico control shows 'Estenosis Aórtica Severa' as the selected clinical case.
        await expect(page.locator("xpath=/html/body/div[2]/div[3]/div/div[1]/div[1]/div[3]/div[2]/select").nth(0)).to_contain_text("Estenosis A\u00f3rtica Severa", timeout=15000), "The Caso Cl\u00ednico control shows 'Estenosis A\u00f3rtica Severa' as the selected clinical case."
        
        # --> Verify playback is active for the selected focus
        # Assert: The auscultation panel shows 'Auscultando...' indicating playback is active.
        await expect(page.locator("xpath=/html/body/div[2]/div[3]/div/div[2]/div[1]").nth(0)).to_contain_text("Auscultando...", timeout=15000), "The auscultation panel shows 'Auscultando...' indicating playback is active."
        await page.locator("xpath=/html/body/div[2]/div[3]/div/div[2]/div[1]/div[3]/div[2]/button").nth(0).scroll_into_view_if_needed()
        # Assert: The '⏸️ Pausar' button is visible, confirming playback is running.
        await expect(page.locator("xpath=/html/body/div[2]/div[3]/div/div[2]/div[1]/div[3]/div[2]/button").nth(0)).to_be_visible(timeout=15000), "The '\u23f8\ufe0f Pausar' button is visible, confirming playback is running."
        # Assert: The selected focus 'Foco Aórtico' is shown for the active playback.
        await expect(page.locator("xpath=/html/body/div[2]/div[3]/div/div[2]/div[1]").nth(0)).to_contain_text("Foco A\u00f3rtico", timeout=15000), "The selected focus 'Foco A\u00f3rtico' is shown for the active playback."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    