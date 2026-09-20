(function () {
	'use strict';

	var WEB3FORMS_ACCESS_KEY = '61827a29-34be-47f7-922a-0e93bc707870';
	var STORAGE_KEY = 'tmx-lang';
	var DEFAULT_LANG = 'de';

	function getLang() {
		var stored = localStorage.getItem(STORAGE_KEY);
		return stored === 'en' || stored === 'de' ? stored : DEFAULT_LANG;
	}

	function setLang(lang) {
		localStorage.setItem(STORAGE_KEY, lang);
		document.documentElement.lang = lang;
		applyLanguage(lang);
		updateLangToggle(lang);
	}

	function t(lang, path) {
		var parts = path.split('.');
		var cur = window.TMX_I18N[lang];
		for (var i = 0; i < parts.length; i++) {
			if (!cur) return '';
			cur = cur[parts[i]];
		}
		return cur || '';
	}

	function updatePageSEO(lang) {
		var dict = window.TMX_I18N[lang];
		if (!dict) return;

		var hash = (window.location.hash || '').replace(/^#/, '');
		var metaData = (hash && dict.sectionMeta && dict.sectionMeta[hash]) ? dict.sectionMeta[hash] : dict.meta;

		if (metaData) {
			document.title = metaData.title;
			var metaDesc = document.querySelector('meta[name="description"]');
			if (metaDesc) metaDesc.setAttribute('content', metaData.description);
		}
	}

	function applyLanguage(lang) {
		var dict = window.TMX_I18N[lang];
		if (!dict) return;

		updatePageSEO(lang);

		document.querySelectorAll('[data-i18n]').forEach(function (el) {
			var key = el.getAttribute('data-i18n');
			var val = t(lang, key);
			if (val) el.textContent = val;
		});

		document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
			var key = el.getAttribute('data-i18n-placeholder');
			var val = t(lang, key);
			if (val) el.setAttribute('placeholder', val);
		});

		document.querySelectorAll('[data-i18n-value]').forEach(function (el) {
			var key = el.getAttribute('data-i18n-value');
			var val = t(lang, key);
			if (val) el.setAttribute('value', val);
		});

		document.querySelectorAll('#main article .close').forEach(function (el) {
			el.textContent = t(lang, 'ui.close');
		});

		rebuildServiceSelect(lang);

		var note = document.getElementById('service-note');
		var serviceSelect = document.getElementById('service');
		if (note && serviceSelect) {
			note.hidden = !serviceSelect.value;
		}
	}

	function rebuildServiceSelect(lang) {
		var select = document.getElementById('service');
		if (!select) return;
		var current = select.value;
		select.innerHTML = '';
		var opt0 = document.createElement('option');
		opt0.value = '';
		opt0.textContent = t(lang, 'contact.servicePlaceholder');
		select.appendChild(opt0);

		window.TMX_SERVICE_KEYS.forEach(function (key) {
			if (window.TMX_ADMIN && typeof window.TMX_ADMIN.isServiceHidden === 'function' && window.TMX_ADMIN.isServiceHidden(key)) {
				return;
			}
			var opt = document.createElement('option');
			opt.value = key;
			opt.textContent = t(lang, 'items.' + key + '.title');
			select.appendChild(opt);
		});

		if (current) select.value = current;
	}

	function updateLangToggle(lang) {
		document.querySelectorAll('.lang-switch button').forEach(function (btn) {
			var isActive = btn.getAttribute('data-lang') === lang;
			btn.classList.toggle('is-active', isActive);
			btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
		});
	}

	function initLang() {
		document.querySelectorAll('.lang-switch button').forEach(function (btn) {
			btn.addEventListener('click', function (e) {
				e.stopPropagation();
				setLang(btn.getAttribute('data-lang'));
			});
		});
		setLang(getLang());
	}

	function initServiceNote() {
		var select = document.getElementById('service');
		var note = document.getElementById('service-note');
		if (!select || !note) return;
		select.addEventListener('change', function () {
			note.hidden = !select.value;
		});
	}

	function initContactForm() {
		var form = document.getElementById('contact-form');
		var status = document.getElementById('form-status');
		if (!form) return;

		var consentCheckbox = document.getElementById('privacy-consent');
		var submitBtn = document.getElementById('contact-submit') || form.querySelector('input[type="submit"]');

		function updateSubmitState() {
			if (submitBtn && consentCheckbox) {
				submitBtn.disabled = !consentCheckbox.checked;
			}
		}

		if (consentCheckbox) {
			consentCheckbox.addEventListener('change', updateSubmitState);
			updateSubmitState();
		}

		form.addEventListener('reset', function () {
			window.setTimeout(function () {
				if (consentCheckbox) consentCheckbox.checked = false;
				if (submitBtn) submitBtn.disabled = true;
				if (status) status.hidden = true;
			}, 0);
		});

		form.addEventListener('click', function (e) {
			e.stopPropagation();
		});

		form.addEventListener('submit', function (e) {
			e.preventDefault();
			e.stopPropagation();

			if (!consentCheckbox || !consentCheckbox.checked) {
				if (status) {
					status.textContent = 'Bitte stimmen Sie der Datenschutzerklärung zu.';
					status.className = 'form-status is-error';
					status.hidden = false;
				}
				if (submitBtn) submitBtn.disabled = true;
				return;
			}

			if (WEB3FORMS_ACCESS_KEY === 'YOUR_WEB3FORMS_ACCESS_KEY') {
				if (status) {
					status.textContent =
						'Web3Forms access key missing — set WEB3FORMS_ACCESS_KEY in assets/js/site.js';
					status.className = 'form-status is-error';
					status.hidden = false;
				}
				return;
			}

			var lang = getLang();
			// Ensure only name, email, message are collected
			var nameVal = (form.elements['name'] ? form.elements['name'].value : '').trim();
			var emailVal = (form.elements['email'] ? form.elements['email'].value : '').trim();
			var msgVal = (form.elements['message'] ? form.elements['message'].value : '').trim();

			var payload = {
				access_key: WEB3FORMS_ACCESS_KEY,
				name: nameVal,
				email: emailVal,
				message: msgVal,
				subject: 'Neue Kontaktanfrage über tmxmagmafy.de'
			};

			if (status) {
				status.hidden = true;
				status.className = 'form-status';
			}

			if (submitBtn) submitBtn.disabled = true;

			fetch('https://api.web3forms.com/submit', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Accept': 'application/json'
				},
				body: JSON.stringify(payload)
			})
				.then(function (res) {
					return res.json().then(function (data) {
						return { ok: res.ok, status: res.status, data: data };
					}).catch(function () {
						return { ok: res.ok, status: res.status, data: null };
					});
				})
				.then(function (result) {
					if (!status) return;
					if (result.ok && result.data && result.data.success) {
						status.textContent = t(lang, 'contact.success');
						status.className = 'form-status is-success';
						form.reset();
					} else {
						var apiMsg = result.data && result.data.message ? result.data.message : '';
						console.error('Web3Forms submission error:', result.status, apiMsg);
						status.textContent = apiMsg ? apiMsg : t(lang, 'contact.error');
						status.className = 'form-status is-error';
					}
					status.hidden = false;
				})
				.catch(function (err) {
					console.error('Fetch request error:', err);
					if (status) {
						status.textContent = t(lang, 'contact.error');
						status.className = 'form-status is-error';
						status.hidden = false;
					}
				})
				.finally(function () {
					updateSubmitState();
				});
		});
	}

	initLang();
	initServiceNote();
	initContactForm();

	/* main.js injects .close after parse; ensure label is translated */
	window.setTimeout(function () {
		applyLanguage(getLang());
	}, 0);

	window.addEventListener('hashchange', function () {
		updatePageSEO(getLang());
	});
	window.addEventListener('popstate', function () {
		updatePageSEO(getLang());
	});

	window.applyTMXLanguage = applyLanguage;
	window.getTMXLang = getLang;
	window.setTMXLang = setLang;
	window.rebuildTMXServiceSelect = rebuildServiceSelect;
})();
