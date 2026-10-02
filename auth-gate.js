// Yksinkertainen selainpuolen kirjautumismuuri.
// HUOM: Tämä EI ole todellinen tietoturvaratkaisu – salasanan tiiviste (hash) on
// luettavissa sivun lähdekoodista, joten tekninen käyttäjä voisi periaatteessa
// ohittaa tarkistuksen. Tarkoitus on vain estää sivun sisällön näkyminen
// vahingossa tai sivullisille, kunnes vahvempi suojaus (esim. Cloudflare Access)
// otetaan käyttöön.
(function () {
  const unlockStorageKey = "mhu-tyokartta-unlocked-v2";
  const allowedUsername = "veeti nurminen";
  const passwordHashHex = "c3976205e7ef1917478b29af460fe0b7cc1f2bb2d8ae155dc02d5ccb7417ba05";

  if (localStorage.getItem(unlockStorageKey) === "1") return;

  async function sha256Hex(text) {
    const bytes = new TextEncoder().encode(text);
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest)).map(byte => byte.toString(16).padStart(2, "0")).join("");
  }

  document.documentElement.classList.add("auth-locked");

  const overlay = document.createElement("div");
  overlay.id = "auth-gate-overlay";
  overlay.innerHTML = `
    <form id="auth-gate-form">
      <h1>Kirjaudu sisään</h1>
      <p>Työkartta on suojattu. Syötä käyttäjätunnus ja salasana jatkaaksesi.</p>
      <label for="auth-gate-username">Käyttäjätunnus</label>
      <input type="text" id="auth-gate-username" autocomplete="username" autofocus required>
      <label for="auth-gate-input">Salasana</label>
      <input type="password" id="auth-gate-input" autocomplete="current-password" required>
      <button type="submit">Jatka</button>
      <p id="auth-gate-error" hidden>Virheellinen käyttäjätunnus tai salasana. Yritä uudelleen.</p>
    </form>
  `;

  const style = document.createElement("style");
  style.textContent = `
    html.auth-locked body > *:not(#auth-gate-overlay) { visibility: hidden !important; }
    #auth-gate-overlay {
      position: fixed; inset: 0; z-index: 999999;
      display: flex; align-items: center; justify-content: center;
      background: #1c2321; font-family: system-ui, sans-serif;
    }
    #auth-gate-overlay form {
      background: #fff; padding: 2rem 2.5rem; border-radius: 12px;
      width: min(320px, 90vw); box-shadow: 0 10px 30px rgba(0,0,0,0.3);
      display: flex; flex-direction: column; gap: 0.75rem;
    }
    #auth-gate-overlay h1 { font-size: 1.25rem; margin: 0; }
    #auth-gate-overlay p { margin: 0; color: #555; font-size: 0.9rem; }
    #auth-gate-overlay label { margin-bottom: -0.5rem; color: #38483e; font-size: 0.85rem; font-weight: 600; }
    #auth-gate-overlay input {
      padding: 0.6rem 0.75rem; border: 1px solid #ccc; border-radius: 8px; font-size: 1rem;
    }
    #auth-gate-overlay button {
      padding: 0.6rem 0.75rem; border: none; border-radius: 8px; background: #2f6f4f;
      color: #fff; font-size: 1rem; cursor: pointer;
    }
    #auth-gate-overlay button:hover { background: #255c40; }
    #auth-gate-error { color: #b3261e !important; }
  `;

  document.addEventListener("DOMContentLoaded", () => {
    document.head.appendChild(style);
    document.body.appendChild(overlay);
    const form = document.querySelector("#auth-gate-form");
    const username = document.querySelector("#auth-gate-username");
    const input = document.querySelector("#auth-gate-input");
    const error = document.querySelector("#auth-gate-error");
    form.addEventListener("submit", async event => {
      event.preventDefault();
      const enteredUsername = username.value.trim().replace(/\s+/g, " ").toLocaleLowerCase("fi-FI");
      const enteredHash = await sha256Hex(input.value);
      if (enteredUsername === allowedUsername && enteredHash === passwordHashHex) {
        localStorage.setItem(unlockStorageKey, "1");
        document.documentElement.classList.remove("auth-locked");
        overlay.remove();
        document.dispatchEvent(new Event("mhu-authenticated"));
      } else {
        error.hidden = false;
        input.value = "";
        username.focus();
      }
    });
  });
})();
