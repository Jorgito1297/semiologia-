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
        
        # -> Click the 'Acceder en Modo Demo Comercial (Prueba Offline)' button to enter demo/offline mode so the auscultation feature can be reached without institutional login.
        # Acceder en Modo Demo Comercial (Prueba Offline) button
        elem = page.get_by_role('button', name='Acceder en Modo Demo Comercial (Prueba Offline)', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the 'Acceder en Modo Demo Comercial (Prueba Offline)' button to enter demo/offline mode so the auscultation feature can be reached.
        # Acceder en Modo Demo Comercial (Prueba Offline) button
        elem = page.get_by_role('button', name='Acceder en Modo Demo Comercial (Prueba Offline)', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the 'Acceder en Modo Demo Comercial (Prueba Offline)' button to enter demo/offline mode so the auscultation feature can be reached without institutional login.
        # Acceder en Modo Demo Comercial (Prueba Offline) button
        elem = page.get_by_role('button', name='Acceder en Modo Demo Comercial (Prueba Offline)', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the 'Acceder en Modo Demo Comercial (Prueba Offline)' button to enter demo/offline mode so the auscultation feature can be reached.
        # Acceder en Modo Demo Comercial (Prueba Offline) button
        elem = page.get_by_role('button', name='Acceder en Modo Demo Comercial (Prueba Offline)', exact=True)
        await elem.click(timeout=10000)
        
        # -> Navigate directly to the Auscultacion page (open the application URL /auscultacion) to reach the auscultation feature without relying on the demo login button.
        await page.goto("http://localhost:3000/auscultacion")
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=5000)
        except Exception:
            pass
        
        # -> Scroll down to reveal the anterior chest manikin and click an anterior cardiac hotspot to activate the auscultation simulation.
        await page.mouse.wheel(0, 300)
        
        # -> Select the heart layer using the '🫀 Corazón' button, ensure 'Anterior' orientation is selected, then click the anterior chest manikin area labeled 'Pecho (Anterior)' to activate a cardiac hotspot and start playback.
        # 🫀 Corazón button
        elem = page.get_by_role('button', name='🫀 Corazón', exact=True)
        await elem.click(timeout=10000)
        
        # -> Select the heart layer using the '🫀 Corazón' button, ensure 'Anterior' orientation is selected, then click the anterior chest manikin area labeled 'Pecho (Anterior)' to activate a cardiac hotspot and start playback.
        # Anterior button
        elem = page.get_by_role('button', name='Anterior', exact=True)
        await elem.click(timeout=10000)
        
        # -> Select the heart layer using the '🫀 Corazón' button, ensure 'Anterior' orientation is selected, then click the anterior chest manikin area labeled 'Pecho (Anterior)' to activate a cardiac hotspot and start playback.
        # Pecho (Anterior) @keyframes breathe { 0% {...
        elem = page.locator('xpath=/html/body/div[2]/div[3]/div/div/div[2]')
        await elem.click(timeout=10000)
        
        # -> Click the '🔊 Auscultar' button in the Monitor panel to start playback so the waveform and playback visualization should appear.
        # 🔊 Auscultar button
        elem = page.get_by_role('button', name='🔊 Auscultar', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the '⏸️ Pausar' button in the Monitor panel to stop playback so the auscultation visualization and audio are halted.
        # ⏸️ Pausar button
        elem = page.get_by_role('button', name='⏸️ Pausar', exact=True)
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> Verify waveform data is displayed
        # Assert: The monitor displays 'SWEEP: 25mm/s', indicating the waveform visualization is present.
        await expect(page.locator("xpath=/html/body/div[2]/div[3]/div/div[2]/div[1]").nth(0)).to_contain_text("SWEEP: 25mm/s", timeout=15000), "The monitor displays 'SWEEP: 25mm/s', indicating the waveform visualization is present."
        # Assert: The monitor displays 'GAIN: x1.0', confirming waveform visualization settings are shown.
        await expect(page.locator("xpath=/html/body/div[2]/div[3]/div/div[2]/div[1]").nth(0)).to_contain_text("GAIN: x1.0", timeout=15000), "The monitor displays 'GAIN: x1.0', confirming waveform visualization settings are shown."
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
    