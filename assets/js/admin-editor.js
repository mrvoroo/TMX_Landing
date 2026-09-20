/**
 * TMX Magmafy — Client-Side Admin Editing Panel
 * 
 * NOTICE / SECURITY DISCLAIMER:
 * This client-side password check and local editing panel is NOT true security,
 * only a deterrent for casual visitors, since this is a static frontend-only site
 * where all files and client scripts are publicly accessible.
 * 
 * Shortcut to activate: Ctrl + Shift + E
 */
(function () {
	'use strict';

	// Default password: "admin123" (SHA-256 hash)
	var PASSWORD_HASH_HEX = '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9';
	var STORAGE_KEY = 'tmx_admin_saved_content';
	var AUTH_SESSION_KEY = 'tmx_admin_auth';

	var isEditModeActive = false;
	var floatingToolbar = null;
	var loginModal = null;

	// SHA-256 with fallback for non-HTTPS / file:// contexts
	async function sha256(message) {
		if (window.crypto && window.crypto.subtle) {
			try {
				var msgBuffer = new TextEncoder().encode(message);
				var hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
				var hashArray = Array.from(new Uint8Array(hashBuffer));
				return hashArray.map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
			} catch (e) {}
		}
		// Fallback simple bitwise SHA-256 implementation
		return simpleSha256(message);
	}

	function simpleSha256(ascii) {
		function rightRotate(value, amount) {
			return (value >>> amount) | (value << (32 - amount));
		}
		var mathPow = Math.pow;
		var maxWord = mathPow(2, 32);
		var lengthProperty = 'length';
		var i, j;
		var result = '';
		var words = [];
		var asciiBitLength = ascii[lengthProperty] * 8;
		var hash = [];
		var k = [];
		var primeCounter = 0;

		var isComposite = {};
		for (var candidate = 2; primeCounter < 64; candidate++) {
			if (!isComposite[candidate]) {
				for (i = 0; i < 313; i += candidate) {
					isComposite[i] = candidate;
				}
				hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
				k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
			}
		}

		ascii += '\x80';
		while ((ascii[lengthProperty] % 64) - 56) ascii += '\x00';
		for (i = 0; i < ascii[lengthProperty]; i++) {
			j = ascii.charCodeAt(i);
			if (j >> 8) return;
			words[i >> 2] |= j << (((3 - i) % 4) * 8);
		}
		words[words[lengthProperty]] = (asciiBitLength / maxWord) | 0;
		words[words[lengthProperty]] = asciiBitLength;

		for (j = 0; j < words[lengthProperty];) {
			var w = words.slice(j, (j += 16));
			var oldHash = hash;
			hash = hash.slice(0, 8);

			for (i = 0; i < 64; i++) {
				var w15 = w[i - 15],
					w2 = w[i - 2];
				var s0 = rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3);
				var s1 = rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10);
				w[i] =
					i < 16
						? w[i]
						: (w[i - 16] + s0 + w[i - 7] + s1) | 0;

				var s1h = rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25);
				var ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
				var temp1 = hash[7] + s1h + ch + k[i] + w[i];
				var s0h = rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22);
				var maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
				var temp2 = s0h + maj;

				hash = [(temp1 + temp2) | 0].concat(hash);
				hash[4] = (hash[4] + temp1) | 0;
			}

			for (i = 0; i < 8; i++) {
				hash[i] = (hash[i] + oldHash[i]) | 0;
			}
		}

		for (i = 0; i < 8; i++) {
			for (i = 0; i < 8; i++) {
				for (j = 3; j + 1; j--) {
					var b = (hash[i] >> (j * 8)) & 255;
					result += (b < 16 ? '0' : '') + b.toString(16);
				}
			}
		}
		return result.slice(0, 64);
	}

	function showNotification(msg, isSuccess) {
		var notif = document.getElementById('admin-toast');
		if (!notif) {
			notif = document.createElement('div');
			notif.id = 'admin-toast';
			notif.className = 'admin-toast';
			document.body.appendChild(notif);
		}
		notif.textContent = msg;
		notif.classList.toggle('is-error', !isSuccess);
		notif.classList.add('is-visible');
		setTimeout(function () {
			notif.classList.remove('is-visible');
		}, 3000);
	}

	function getEditableElements() {
		var elements = [];
		var wrapper = document.getElementById('wrapper');
		if (!wrapper) return elements;

		var candidates = wrapper.querySelectorAll('h1, h2, h3, p, .pillar-intro, span[data-i18n]');
		candidates.forEach(function (el) {
			// Skip UI controls, lang switch, and admin components
			if (
				el.closest('#lang-fixed') ||
				el.closest('#admin-floating-bar') ||
				el.closest('#admin-modal') ||
				el.closest('#contact-form') ||
				el.closest('.icons')
			) {
				return;
			}
			elements.push(el);
		});
		return elements;
	}

	function enableContentEditable() {
		isEditModeActive = true;
		document.body.classList.add('tmx-admin-active');

		var editables = getEditableElements();
		editables.forEach(function (el, index) {
			el.setAttribute('contenteditable', 'true');
			el.setAttribute('data-admin-editable', 'true');
			if (!el.getAttribute('data-admin-id')) {
				el.setAttribute('data-admin-id', 'ae-' + index);
			}
		});

		createFloatingToolbar();
		showNotification('Admin-Modus aktiv: Texte direkt anklicken und bearbeiten.', true);
	}

	function disableContentEditable() {
		isEditModeActive = false;
		document.body.classList.remove('tmx-admin-active');

		var editables = document.querySelectorAll('[contenteditable]');
		editables.forEach(function (el) {
			el.removeAttribute('contenteditable');
			el.removeAttribute('data-admin-editable');
		});

		if (floatingToolbar && floatingToolbar.parentNode) {
			floatingToolbar.parentNode.removeChild(floatingToolbar);
			floatingToolbar = null;
		}

		sessionStorage.removeItem(AUTH_SESSION_KEY);
		showNotification('Admin-Modus beendet. Normale Besucheransicht wiederhergestellt.', true);
	}

	function createFloatingToolbar() {
		if (floatingToolbar) return;

		floatingToolbar = document.createElement('div');
		floatingToolbar.id = 'admin-floating-bar';
		floatingToolbar.className = 'admin-floating-bar';
		floatingToolbar.innerHTML =
			'<div class="admin-bar-inner">' +
			'  <div class="admin-bar-badge">' +
			'    <span class="admin-indicator"></span>' +
			'    <strong>ADMIN-MODUS</strong>' +
			'  </div>' +
			'  <div class="admin-bar-actions">' +
			'    <button type="button" id="admin-btn-save" class="button primary small">Änderungen speichern</button>' +
			'    <button type="button" id="admin-btn-download" class="button small">HTML herunterladen</button>' +
			'    <button type="button" id="admin-btn-reset" class="button small">Zurücksetzen</button>' +
			'    <button type="button" id="admin-btn-exit" class="button small is-exit">Beenden</button>' +
			'  </div>' +
			'</div>';

		document.body.appendChild(floatingToolbar);

		document.getElementById('admin-btn-save').addEventListener('click', saveChangesToStorage);
		document.getElementById('admin-btn-download').addEventListener('click', downloadUpdatedHtml);
		document.getElementById('admin-btn-reset').addEventListener('click', resetChanges);
		document.getElementById('admin-btn-exit').addEventListener('click', disableContentEditable);
	}

	function saveChangesToStorage() {
		var editables = document.querySelectorAll('[data-admin-id]');
		var data = {};
		editables.forEach(function (el) {
			var id = el.getAttribute('data-admin-id');
			data[id] = el.innerHTML;
		});

		localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
		showNotification('Änderungen erfolgreich lokal gespeichert!', true);
	}

	function restoreSavedChanges() {
		var raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return;

		try {
			var data = JSON.parse(raw);
			var editables = getEditableElements();
			editables.forEach(function (el, index) {
				var id = el.getAttribute('data-admin-id') || 'ae-' + index;
				if (data[id]) {
					el.innerHTML = data[id];
				}
			});
		} catch (e) {
			console.warn('Could not restore saved changes', e);
		}
	}

	function resetChanges() {
		if (confirm('Möchten Sie alle gespeicherten Änderungen verwerfen und auf den Standard zurücksetzen?')) {
			localStorage.removeItem(STORAGE_KEY);
			window.location.reload();
		}
	}

	function downloadUpdatedHtml() {
		// Clone document element to produce a clean, production-ready export
		var clone = document.documentElement.cloneNode(true);

		// Clean up admin DOM artifacts from the clone
		var adminNodes = clone.querySelectorAll(
			'#admin-floating-bar, #admin-modal, #admin-toast, .admin-floating-bar, .admin-modal-overlay'
		);
		adminNodes.forEach(function (n) {
			if (n.parentNode) n.parentNode.removeChild(n);
		});

		// Remove edit mode classes and contenteditable attributes
		var cloneBody = clone.querySelector('body');
		if (cloneBody) {
			cloneBody.classList.remove('tmx-admin-active');
		}

		var editables = clone.querySelectorAll('[contenteditable], [data-admin-editable]');
		editables.forEach(function (el) {
			el.removeAttribute('contenteditable');
			el.removeAttribute('data-admin-editable');
		});

		// Produce sanitized HTML string
		var htmlString = '<!DOCTYPE HTML>\n' + clone.outerHTML;

		// Create download link
		var blob = new Blob([htmlString], { type: 'text/html;charset=utf-8' });
		var url = URL.createObjectURL(blob);
		var a = document.createElement('a');
		a.href = url;
		a.download = 'index.html';
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);

		showNotification('index.html heruntergeladen! Bereit zum Hochladen auf Ihr Hosting.', true);
	}

	function promptLogin() {
		if (loginModal) return;

		loginModal = document.createElement('div');
		loginModal.id = 'admin-modal';
		loginModal.className = 'admin-modal-overlay';
		loginModal.innerHTML =
			'<div class="admin-modal-dialog">' +
			'  <button type="button" class="admin-modal-close" aria-label="Schließen">&times;</button>' +
			'  <h3>Admin-Bereich entsperren</h3>' +
			'  <p class="admin-modal-sub">Geben Sie das Passwort ein, um den Live-Bearbeitungsmodus zu aktivieren.</p>' +
			'  <form id="admin-login-form">' +
			'    <div class="field">' +
			'      <input type="password" id="admin-password" placeholder="Passwort eingeben" autocomplete="current-password" autofocus required />' +
			'    </div>' +
			'    <p id="admin-auth-error" class="admin-error-msg" hidden>Ungültiges Passwort.</p>' +
			'    <div class="actions" style="margin-top: 1.25rem;">' +
			'      <button type="submit" class="button primary">Entsperren</button>' +
			'      <button type="button" id="admin-login-cancel" class="button">Abbrechen</button>' +
			'    </div>' +
			'  </form>' +
			'</div>';

		document.body.appendChild(loginModal);

		var input = document.getElementById('admin-password');
		var form = document.getElementById('admin-login-form');
		var errorMsg = document.getElementById('admin-auth-error');
		var closeBtn = loginModal.querySelector('.admin-modal-close');
		var cancelBtn = document.getElementById('admin-login-cancel');

		setTimeout(function () {
			input.focus();
		}, 50);

		function closeModal() {
			if (loginModal && loginModal.parentNode) {
				loginModal.parentNode.removeChild(loginModal);
				loginModal = null;
			}
		}

		closeBtn.addEventListener('click', closeModal);
		cancelBtn.addEventListener('click', closeModal);
		loginModal.addEventListener('click', function (e) {
			if (e.target === loginModal) closeModal();
		});

		form.addEventListener('submit', async function (e) {
			e.preventDefault();
			var pwd = input.value;
			var hash = await sha256(pwd);

			if (hash === PASSWORD_HASH_HEX) {
				sessionStorage.setItem(AUTH_SESSION_KEY, 'true');
				closeModal();
				enableContentEditable();
			} else {
				errorMsg.hidden = false;
				input.value = '';
				input.focus();
			}
		});
	}

	function toggleAdminMode() {
		if (isEditModeActive) {
			disableContentEditable();
		} else {
			if (sessionStorage.getItem(AUTH_SESSION_KEY) === 'true') {
				enableContentEditable();
			} else {
				promptLogin();
			}
		}
	}

	// Global shortcut listener: Ctrl + Shift + E
	window.addEventListener('keydown', function (e) {
		if (e.ctrlKey && e.shiftKey && (e.key === 'E' || e.key === 'e')) {
			e.preventDefault();
			toggleAdminMode();
		}
	});

	// Restore any previously saved localStorage content on load
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', restoreSavedChanges);
	} else {
		restoreSavedChanges();
	}

	// Expose minimal API for debugging or testing if required
	window.TMX_ADMIN_EDITOR = {
		toggle: toggleAdminMode,
		isActive: function () { return isEditModeActive; }
	};
})();
