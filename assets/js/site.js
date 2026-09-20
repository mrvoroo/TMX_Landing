(function () {
	'use strict';

	var WEB3FORMS_ACCESS_KEY = 'YOUR_WEB3FORMS_ACCESS_KEY';
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

	function applyLanguage(lang) {
		var dict = window.TMX_I18N[lang];
		if (!dict) return;

		document.title = dict.meta.title;
		var metaDesc = document.querySelector('meta[name="description"]');
		if (metaDesc) metaDesc.setAttribute('content', dict.meta.description);

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

		form.addEventListener('click', function (e) {
			e.stopPropagation();
		});

		form.addEventListener('submit', function (e) {
			e.preventDefault();
			e.stopPropagation();
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
			var fd = new FormData(form);
			fd.set('access_key', WEB3FORMS_ACCESS_KEY);
			var serviceKey = fd.get('service');
			if (serviceKey) {
				fd.set('subject', 'Anfrage: ' + t(lang, 'items.' + serviceKey + '.title'));
			}

			if (status) {
				status.hidden = true;
				status.className = 'form-status';
			}

			fetch('https://api.web3forms.com/submit', {
				method: 'POST',
				body: fd,
			})
				.then(function (res) {
					return res.json();
				})
				.then(function (data) {
					if (!status) return;
					if (data.success) {
						status.textContent = t(lang, 'contact.success');
						status.className = 'form-status is-success';
						form.reset();
						document.getElementById('service-note').hidden = true;
					} else {
						status.textContent = t(lang, 'contact.error');
						status.className = 'form-status is-error';
					}
					status.hidden = false;
				})
				.catch(function () {
					if (status) {
						status.textContent = t(lang, 'contact.error');
						status.className = 'form-status is-error';
						status.hidden = false;
					}
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

	window.applyTMXLanguage = applyLanguage;
	window.getTMXLang = getLang;
	window.setTMXLang = setLang;
	window.rebuildTMXServiceSelect = rebuildServiceSelect;
})();
