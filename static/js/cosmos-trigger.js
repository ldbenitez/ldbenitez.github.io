(() => {
  const launcher = document.querySelector('[data-cosmos-launcher]');
  if (!launcher || typeof HTMLDialogElement === 'undefined') return;
  const ERROR = 'The playground could not start. Please close it and try again.';
  let buffer = '';
  let lastLetter = 0;
  let active = null;
  let failedLoads = 0;

  function clearPhrase() { buffer = ''; lastLetter = 0; }
  function preserveStyles(element, properties) {
    const saved = properties.map((name) => [name, element.style.getPropertyValue(name), element.style.getPropertyPriority(name)]);
    return () => saved.forEach(([name, value, priority]) => {
      if (value) element.style.setProperty(name, value, priority);
      else element.style.removeProperty(name);
    });
  }
  function close(session) {
    if (active !== session) return;
    active = null;
    clearPhrase();
    session.abort.abort();
    session.playground?.dispose();
    session.dialog.close();
    session.dialog.remove();
    session.restoreBody(); session.restoreRoot();
    const target = session.invoker?.isConnected ? session.invoker : document.body;
    const oldTabIndex = target.getAttribute('tabindex');
    if (target === document.body) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
    if (target === document.body) {
      if (oldTabIndex === null) target.removeAttribute('tabindex');
      else target.setAttribute('tabindex', oldTabIndex);
    }
    window.scrollTo({ left: session.x, top: session.y, behavior: 'instant' });
  }
  function createShell() {
    clearPhrase();
    const dialog = document.createElement('dialog');
    dialog.className = 'cosmos-dialog cosmos-prompt';
    dialog.setAttribute('aria-labelledby', 'cosmos-title');
    dialog.innerHTML = `<header class="cosmos-heading">
      <div><p class="cosmos-prompt-label">~/cosmos</p><h2 id="cosmos-title">Command prompt</h2></div>
      <button type="button" class="cosmos-close" aria-label="Close">Close <span aria-hidden="true">[esc]</span></button>
      </header><div class="cosmos-content"></div>`;
    const session = {
      dialog, host: dialog.querySelector('.cosmos-content'), abort: new AbortController(),
      invoker: document.activeElement, x: scrollX, y: scrollY, playground: null, state: 'prompt',
      restoreBody: preserveStyles(document.body, ['position', 'top', 'left', 'right', 'width', 'overflow']),
      restoreRoot: preserveStyles(document.documentElement, ['overflow']),
    };
    active = session;
    document.body.append(dialog);
    try {
      document.body.style.position = 'fixed';
      document.body.style.top = `${-session.y}px`;
      document.body.style.left = `${-session.x}px`;
      document.body.style.right = '0';
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      dialog.showModal();
    } catch (error) { close(session); throw error; }
    const options = { signal: session.abort.signal };
    dialog.querySelector('.cosmos-close').addEventListener('click', () => close(session), options);
    dialog.addEventListener('cancel', (event) => {
      event.preventDefault();
      if (!session.playground?.cancelAim()) close(session);
    }, options);
    // Native close requests must take the same cleanup path as the button.
    dialog.addEventListener('close', () => close(session), options);
    return session;
  }
  function showError(session) {
    if (active !== session) return;
    session.playground?.dispose();
    session.playground = null;
    session.state = 'error';
    session.host.replaceChildren();
    const message = document.createElement('p');
    message.className = 'cosmos-message';
    message.setAttribute('role', 'alert');
    message.textContent = ERROR;
    session.host.append(message);
    session.dialog.querySelector('.cosmos-close').focus({ preventScroll: true });
  }
  async function openPlayground(session = null) {
    if (!session && active) return;
    session ??= createShell();
    if (active !== session || session.state !== 'prompt') return;
    session.state = 'loading';
    session.dialog.classList.remove('cosmos-prompt');
    session.dialog.querySelector('#cosmos-title').textContent = 'Orbital notebook';
    session.dialog.querySelector('.cosmos-prompt-label').textContent = '~/cosmos';
    session.host.innerHTML = '<p class="cosmos-message" role="status">Opening a small universe…</p>';
    session.dialog.querySelector('.cosmos-close').focus({ preventScroll: true });
    try {
      const url = new URL(launcher.dataset.cosmosModule, location.href);
      if (failedLoads) url.searchParams.set('retry', String(failedLoads));
      const { mountPlayground } = await import(url.href);
      // Session identity is the generation token: dismissed imports cannot reopen UI.
      if (active !== session || session.abort.signal.aborted) return;
      session.playground = mountPlayground({ host: session.host, signal: session.abort.signal, onFatalError: () => showError(session) });
      session.state = 'open';
    } catch {
      failedLoads++;
      showError(session);
    }
  }
  function openPrompt() {
    if (active) return;
    const session = createShell();
    session.dialog.querySelector('.cosmos-prompt-label').textContent = '~/';
    session.host.innerHTML = `<form class="cosmos-command-form">
      <label for="cosmos-command">Enter a command</label>
      <div class="cosmos-command-row"><input id="cosmos-command" name="command" type="text"
        autocomplete="off" autocapitalize="none" spellcheck="false" required aria-describedby="cosmos-command-error">
        <button type="submit">Run</button></div>
      <p id="cosmos-command-error" role="status"></p></form>`;
    const input = session.host.querySelector('input');
    session.host.querySelector('form').addEventListener('submit', (event) => {
      event.preventDefault();
      if (input.value.trim().toLowerCase() === 'cosmos') {
        input.blur();
        void openPlayground(session);
      } else {
        session.host.querySelector('#cosmos-command-error').textContent = 'Unknown command.';
      }
    }, { signal: session.abort.signal });
    input.focus({ preventScroll: true });
  }

  function isEditing(event) {
    return event.composedPath().some((element) => element instanceof HTMLElement
      && (element.isContentEditable || element.matches('input, textarea, select, [role="textbox"]')));
  }
  document.addEventListener('keydown', (event) => {
    if (active || document.querySelector('dialog[open], [role="dialog"][aria-modal="true"]')
      || isEditing(event) || event.isComposing || event.repeat || event.ctrlKey || event.metaKey || event.altKey) {
      clearPhrase(); return;
    }
    if (event.key === 'Shift') return;
    if (!/^[a-z]$/i.test(event.key)) { clearPhrase(); return; }
    const now = performance.now();
    if (now - lastLetter > 3000) buffer = '';
    lastLetter = now;
    buffer = (buffer + event.key.toLowerCase()).slice(-6);
    if (buffer === 'cosmos') { clearPhrase(); void openPlayground(); }
  });
  window.addEventListener('blur', clearPhrase);
  document.addEventListener('focusin', (event) => { if (isEditing(event)) clearPhrase(); });
  launcher.addEventListener('click', openPrompt);
  launcher.hidden = false;
})();
