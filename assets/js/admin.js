/**
 * TMX Magmafy — Admin View & Site Controller
 * Secret Shortcut: Ctrl + Shift + Q (Windows/Linux) or Cmd + Shift + Q (macOS)
 * Stealth: Fully unmounted from DOM when closed (100% invisible in DevTools Inspect)
 * Capabilities:
 *  - Hide/Show sections (cascades: hides nav button first, closes active view, and hides content)
 *  - Hide/Show buttons, CTAs, and individual services
 *  - Complete Bilingual Support (DE / EN) for Admin UI and all website content
 *  - Live text editor with LocalStorage persistence & immediate refresh application
 *  - Direct On-Page Live Visual Editing (contenteditable)
 *  - JSON Backup Export, Import, and Factory Defaults Reset
 */
(function () {
	'use strict';

	var STORAGE_KEY = 'tmx_admin_config_v1';

	// Cache initial factory defaults for reset
	var INITIAL_I18N = JSON.parse(JSON.stringify(window.TMX_I18N || {}));

	// Default Admin State
	var state = {
		hidden: {},      // { id: true }
		content: {       // overrides by lang: { 'intro.title': '...' }
			de: {},
			en: {}
		},
		liveEdit: false,
		activeTab: 'visibility',
		editLang: 'de'
	};

	// Keep track of which accordion IDs are currently opened by the admin
	var openAccordionIds = { 'hero': true };

	// Comprehensive bilingual translations for the Admin View UI itself
	var ADMIN_STRINGS = {
		de: {
			title: 'TMX Admin-Verwaltung',
			liveBadge: 'Live-Modus',
			closeTitle: 'Admin-Ansicht schließen (Esc)',
			tabs: {
				visibility: 'Sichtbarkeit & Navigation',
				content: 'Texte & Inhalte bearbeiten',
				live: 'Direktes Live-Editing',
				backup: 'Backup & Zurücksetzen'
			},
			footerShortcut: 'Geheimer Shortcut:',
			footerDone: 'Fertig & Schließen',
			vis: {
				heading: 'Elemente auf der Website ein- oder ausblenden',
				desc: 'Schalten Sie Bereiche, Navigations-Buttons, Aktionen oder Leistungen aus. Beim Deaktivieren eines Bereichs wird dessen Navigations-Button sofort ausgeblendet und der Inhalt verborgen.',
				searchPlaceholder: 'Schnellsuche für Leistungen, Buttons oder Bereiche...',
				groupSections: 'Hauptbereiche & Navigations-Buttons',
				groupButtons: 'Buttons & Handlungsaufforderungen (CTAs)',
				groupServices: 'Alle 18 Einzelleistungen (Karten & Dropdown)',
				servicesHelp: 'Ausgeblendete Leistungen werden sofort aus den Säulen und dem Kontakt-Dropdown entfernt.',
				autoHiddenBadge: 'Mit Bereich ausgeblendet',
				pillarHiddenBadge: 'Säule ausgeblendet'
			},
			content: {
				heading: 'Website-Texte & Inhalte bearbeiten (Deutsch / DE)',
				desc: 'Ändern Sie Texte in den Feldern unten. Änderungen werden sofort gespeichert und live auf der Website aktualisiert.',
				searchPlaceholder: 'Textstelle, Überschrift oder Schlüsselwort suchen...',
				updatedToast: 'Text gespeichert & live aktualisiert ✓'
			},
			live: {
				heading: 'Direktes Live-Editing (Point & Click)',
				desc: 'Aktivieren Sie das direkte Bearbeiten auf der Seite, um beliebige Texte durch Anklicken direkt im Browser zu ändern.',
				statusTitle: 'Direkter Klick-Modus:',
				statusEnabled: 'AKTIV',
				statusDisabled: 'INAKTIV',
				statusDescActive: 'Klicken Sie auf einen beliebigen Text auf der Website, um ihn zu bearbeiten.',
				statusDescInactive: 'Aktivieren, um Texte direkt auf der Seite mit einem Klick zu bearbeiten.',
				instructionsTitle: 'So funktioniert es:',
				steps: [
					'Aktivieren Sie oben den Schalter für Direktes Bearbeiten.',
					'Schließen Sie diese Leiste (oder drücken Sie Ctrl + Shift + Q).',
					'Fahren Sie mit der Maus über einen Text oder Button — eine leuchtende Kontur erscheint.',
					'Klicken Sie auf den Text und tippen Sie den neuen Inhalt ein.',
					'Beim Verlassen des Feldes wird der Text automatisch dauerhaft gespeichert.'
				],
				activatedToast: 'Live-Editing aktiviert! Klicken Sie auf Texte zum Bearbeiten.',
				deactivatedToast: 'Live-Editing deaktiviert.'
			},
			backup: {
				heading: 'Backup, Export, Import & Zurücksetzen',
				desc: 'Exportieren Sie Ihre benutzerdefinierten Texte und Sichtbarkeiten oder stellen Sie die Standardeinstellungen wieder her.',
				exportTitle: 'Konfiguration exportieren',
				exportDesc: 'Kopieren oder laden Sie Ihre Einstellungen als JSON-Datei herunter.',
				btnCopy: 'JSON in Zwischenablage kopieren',
				btnDownload: '.json-Datei herunterladen',
				importTitle: 'Konfiguration importieren',
				importDesc: 'Fügen Sie eine zuvor exportierte JSON-Konfiguration ein.',
				importPlaceholder: 'Exportiertes JSON hier einfügen...',
				btnApply: 'Importierte Konfiguration anwenden',
				resetTitle: 'Auf Werkseinstellungen zurücksetzen',
				resetDesc: 'Löscht alle Textanpassungen und stellt alle Sichtbarkeiten auf den Originalzustand zurück.',
				btnReset: 'Alles auf Standard zurücksetzen',
				copiedToast: 'Konfiguration in Zwischenablage kopiert! ✓',
				downloadedToast: 'Konfigurationsdatei heruntergeladen! ✓',
				importedToast: 'Konfiguration erfolgreich importiert! ✓',
				resetToast: 'Erfolgreich auf Werkseinstellungen zurückgesetzt! ✓',
				resetConfirm: 'Möchten Sie wirklich alle benutzerdefinierten Texte und Sichtbarkeitseinstellungen auf die Werkseinstellungen zurücksetzen?'
			},
			sections: {
				'sec-intro': 'Intro-Bereich (Navigation & Inhalt)',
				'sec-about': 'Über uns (Navigation & Inhalt)',
				'sec-services': 'Leistungen (Navigation & Hub)',
				'sec-entwicklung': 'Entwicklung (Navigation & Säule)',
				'sec-ki': 'Künstliche Intelligenz (Navigation & Säule)',
				'sec-marketing': 'Digitales Marketing (Navigation & Säule)',
				'sec-it': 'IT & Beratung (Navigation & Säule)',
				'sec-contact': 'Kontakt (Navigation & Formular)'
			},
			buttons: {
				'btn-header-cta': 'Header-Button: "Unsere Leistungen entdecken"',
				'btn-intro-cta': 'Intro-Button: "Unsere Leistungen entdecken"',
				'btn-intro-contact': 'Intro-Button: "Kontakt"',
				'btn-pillar-contact': 'Säulen-Aktion: "Kontakt"-Button (Alle Säulen)',
				'btn-pillar-services': 'Säulen-Aktion: "Leistungen"-Button (Alle Säulen)',
				'btn-contact-submit': 'Kontaktformular: "Nachricht senden"-Button',
				'btn-contact-reset': 'Kontaktformular: "Zurücksetzen"-Button',
				'btn-contact-social': 'Kontakt Social-Icons (E-Mail, LinkedIn, Instagram)'
			},
			categories: {
				hero: 'Hero & Intro-Bereich',
				about: 'Über uns (About Us)',
				services_hub: 'Leistungsübersicht (Services Hub)',
				pillars: 'Die 4 Säulen (Kategorien)',
				services_items: 'Alle 18 Einzelleistungen (Titel & Beschreibungen)',
				contact: 'Kontaktformular & Texte',
				navigation: 'Navigationsbeschriftungen',
				footer: 'Footer & Meta-Angaben'
			}
		},
		en: {
			title: 'TMX Admin Control',
			liveBadge: 'Live Mode',
			closeTitle: 'Close Admin View (Esc)',
			tabs: {
				visibility: 'Visibility & Navigation',
				content: 'Text & Copy Editor',
				live: 'On-Page Live Edit',
				backup: 'Backup & Reset'
			},
			footerShortcut: 'Secret Shortcut:',
			footerDone: 'Done & Close',
			vis: {
				heading: 'Show or Hide Elements on the Website',
				desc: 'Toggle sections, navigation buttons, CTAs, or individual services off. Hiding a section instantly removes its navigation button and hides its content.',
				searchPlaceholder: 'Quick filter services, buttons, or sections...',
				groupSections: 'Main Sections & Nav Buttons',
				groupButtons: 'Call-to-Action & Action Buttons',
				groupServices: 'All 18 Individual Services (Features & Dropdown)',
				servicesHelp: 'Hiding a service removes its card and excludes it from the Contact inquiry dropdown.',
				autoHiddenBadge: 'Auto-Hidden with Section',
				pillarHiddenBadge: 'Pillar Hidden'
			},
			content: {
				heading: 'Edit Website Text & Copy (English / EN)',
				desc: 'Type into any field below to update website copy in real time. Changes are saved instantly and applied dynamically.',
				searchPlaceholder: 'Search any sentence or headline to edit...',
				updatedToast: 'Text saved & live updated ✓'
			},
			live: {
				heading: 'On-Page Live Visual Editing (Point & Click)',
				desc: 'Enable direct on-page editing to modify any text simply by clicking on it on the website.',
				statusTitle: 'Direct Click-to-Edit Mode:',
				statusEnabled: 'ENABLED',
				statusDisabled: 'DISABLED',
				statusDescActive: 'Click any text on the website directly to edit it live.',
				statusDescInactive: 'Turn this on to click directly on headings and paragraphs to change text.',
				instructionsTitle: 'How It Works:',
				steps: [
					'Turn ON Click-to-Edit mode above.',
					'Close or minimize this panel (or press Ctrl + Shift + Q).',
					'Hover over any headline, paragraph, or button — a glowing highlight will appear.',
					'Click on the text and type your new copy.',
					'When you click away, your edits are automatically saved into browser storage.'
				],
				activatedToast: 'Live Edit Mode Activated! Click anywhere to edit.',
				deactivatedToast: 'Live Edit Mode Disabled.'
			},
			backup: {
				heading: 'Backup, Export, Import & Reset',
				desc: 'Export your custom texts and visibility configuration to JSON, or restore original factory defaults.',
				exportTitle: 'Export Configuration',
				exportDesc: 'Download or copy your complete configuration as a JSON file.',
				btnCopy: 'Copy JSON to Clipboard',
				btnDownload: 'Download .json File',
				importTitle: 'Import Configuration',
				importDesc: 'Paste a JSON configuration below to restore or overwrite your settings.',
				importPlaceholder: 'Paste exported JSON here...',
				btnApply: 'Apply Imported Config',
				resetTitle: 'Reset to Factory Defaults',
				resetDesc: 'This will erase all custom text edits and reset all visibility toggles back to original defaults.',
				btnReset: 'Reset All to Defaults',
				copiedToast: 'Configuration copied to clipboard! ✓',
				downloadedToast: 'Configuration downloaded! ✓',
				importedToast: 'Configuration imported successfully! ✓',
				resetToast: 'Reset to original defaults completed! ✓',
				resetConfirm: 'Are you sure you want to reset all custom text edits and visibility to original defaults?'
			},
			sections: {
				'sec-intro': 'Intro Section (Navigation & Content)',
				'sec-about': 'About Us (Navigation & Content)',
				'sec-services': 'Services Hub (Navigation & Hub)',
				'sec-entwicklung': 'Development Pillar (Navigation & Pillar)',
				'sec-ki': 'Artificial Intelligence (Navigation & Pillar)',
				'sec-marketing': 'Digital Marketing (Navigation & Pillar)',
				'sec-it': 'IT & Consulting (Navigation & Pillar)',
				'sec-contact': 'Contact Section (Navigation & Form)'
			},
			buttons: {
				'btn-header-cta': 'Header Button: "Explore our services"',
				'btn-intro-cta': 'Intro Button: "Explore our services"',
				'btn-intro-contact': 'Intro Button: "Contact"',
				'btn-pillar-contact': 'Pillar Action: "Contact" Button (All Pillars)',
				'btn-pillar-services': 'Pillar Action: "Services" Button (All Pillars)',
				'btn-contact-submit': 'Contact Form: "Send Message" Button',
				'btn-contact-reset': 'Contact Form: "Reset" Button',
				'btn-contact-social': 'Contact Social Icons (Email, LinkedIn, Instagram)'
			},
			categories: {
				hero: 'Hero & Intro Section',
				about: 'About Us Section',
				services_hub: 'Services Hub (Overview)',
				pillars: 'Service Pillars (Categories)',
				services_items: 'All 18 Individual Services (Titles & Descriptions)',
				contact: 'Contact Form & Messaging',
				navigation: 'Navigation Labels',
				footer: 'Footer & Meta'
			}
		}
	};

	// Helper to get nested object property
	function getNested(obj, path) {
		if (!obj || !path) return '';
		var parts = path.split('.');
		var cur = obj;
		for (var i = 0; i < parts.length; i++) {
			if (!cur) return '';
			cur = cur[parts[i]];
		}
		return cur !== undefined && cur !== null ? cur : '';
	}

	// Helper to set nested object property
	function setNested(obj, path, val) {
		if (!obj || !path) return;
		var parts = path.split('.');
		var cur = obj;
		for (var i = 0; i < parts.length - 1; i++) {
			if (!cur[parts[i]]) cur[parts[i]] = {};
			cur = cur[parts[i]];
		}
		cur[parts[parts.length - 1]] = val;
	}

	// Load persisted state
	function loadState() {
		try {
			var raw = localStorage.getItem(STORAGE_KEY);
			if (raw) {
				var parsed = JSON.parse(raw);
				if (parsed.hidden) state.hidden = parsed.hidden;
				if (parsed.content) {
					state.content.de = parsed.content.de || {};
					state.content.en = parsed.content.en || {};
				}
				if (typeof parsed.liveEdit === 'boolean') state.liveEdit = parsed.liveEdit;
			}
		} catch (e) {
			console.warn('[TMX Admin] Could not load state from localStorage', e);
		}
	}

	// Save state to localStorage
	function saveState() {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify({
				hidden: state.hidden,
				content: state.content,
				liveEdit: state.liveEdit
			}));
		} catch (e) {
			console.warn('[TMX Admin] Could not save state to localStorage', e);
		}
	}

	// Apply text overrides into window.TMX_I18N
	function applyContentOverrides() {
		['de', 'en'].forEach(function (lang) {
			if (!window.TMX_I18N || !window.TMX_I18N[lang]) return;
			var overrides = state.content[lang] || {};
			for (var key in overrides) {
				if (Object.prototype.hasOwnProperty.call(overrides, key)) {
					setNested(window.TMX_I18N[lang], key, overrides[key]);
				}
			}
		});
	}

	// Check if an item is hidden
	function isItemHidden(id) {
		return !!state.hidden[id];
	}

	// Service keys and titles mapping for 18 services
	var SERVICE_ITEMS = [
		// Entwicklung
		{ key: 'web', pillar: 'entwicklung', defaultTitle: 'Web Design & Development' },
		{ key: 'app', pillar: 'entwicklung', defaultTitle: 'App Development' },
		{ key: 'ecom', pillar: 'entwicklung', defaultTitle: 'E-Commerce Shops' },
		{ key: 'dashboard', pillar: 'entwicklung', defaultTitle: 'Internal Systems & Dashboards' },
		{ key: 'chat', pillar: 'entwicklung', defaultTitle: 'Chat & Support Systems' },
		// KI
		{ key: 'aiSolutions', pillar: 'ki', defaultTitle: 'AI-powered Solutions' },
		{ key: 'aiIntegration', pillar: 'ki', defaultTitle: 'AI Integration into Existing Systems' },
		{ key: 'aiConsult', pillar: 'ki', defaultTitle: 'AI Consulting & Strategy' },
		{ key: 'aiTraining', pillar: 'ki', defaultTitle: 'AI Training & Workshops' },
		{ key: 'aiCs', pillar: 'ki', defaultTitle: 'AI Customer Service Automation' },
		{ key: 'aiProcess', pillar: 'ki', defaultTitle: 'AI Process Automation' },
		// Marketing
		{ key: 'socialAuto', pillar: 'marketing', defaultTitle: 'Social Media Process Automation' },
		{ key: 'dataAnalysis', pillar: 'marketing', defaultTitle: 'AI-supported Data Analysis' },
		{ key: 'content', pillar: 'marketing', defaultTitle: 'AI-powered Content Creation' },
		{ key: 'mediaBuying', pillar: 'marketing', defaultTitle: 'Media Buying & Placement' },
		{ key: 'campaign', pillar: 'marketing', defaultTitle: 'Digital Ad Campaign Management' },
		// IT
		{ key: 'itServices', pillar: 'it', defaultTitle: 'IT Services' },
		{ key: 'digitalConsult', pillar: 'it', defaultTitle: 'Digital Consulting' }
	];

	// Sections config
	var SECTION_ITEMS = [
		{ id: 'sec-intro', targetArticle: '#intro', navId: 'intro' },
		{ id: 'sec-about', targetArticle: '#about', navId: 'about' },
		{ id: 'sec-services', targetArticle: '#services', navId: 'services' },
		{ id: 'sec-entwicklung', targetArticle: '#services-entwicklung', navId: 'services-entwicklung', hubId: 'services-entwicklung' },
		{ id: 'sec-ki', targetArticle: '#services-ki', navId: 'services-ki', hubId: 'services-ki' },
		{ id: 'sec-marketing', targetArticle: '#services-marketing', navId: 'services-marketing', hubId: 'services-marketing' },
		{ id: 'sec-it', targetArticle: '#services-it', navId: 'services-it', hubId: 'services-it' },
		{ id: 'sec-contact', targetArticle: '#contact', navId: 'contact' }
	];

	// Buttons config with parent section mapping
	var BUTTON_ITEMS = [
		{ id: 'btn-header-cta', selector: '[data-admin-btn="header-cta"]', parentSec: 'sec-services' },
		{ id: 'btn-intro-cta', selector: '[data-admin-btn="intro-cta"]', parentSec: 'sec-services' },
		{ id: 'btn-intro-contact', selector: '[data-admin-btn="intro-contact"]', parentSec: 'sec-contact' },
		{ id: 'btn-pillar-contact', selector: '[data-admin-btn="pillar-contact"]', parentSec: 'sec-contact' },
		{ id: 'btn-pillar-services', selector: '[data-admin-btn="pillar-services"]', parentSec: 'sec-services' },
		{ id: 'btn-contact-submit', selector: '[data-admin-btn="contact-submit"]', parentSec: 'sec-contact' },
		{ id: 'btn-contact-reset', selector: '[data-admin-btn="contact-reset"]', parentSec: 'sec-contact' },
		{ id: 'btn-contact-social', selector: '[data-admin-btn="contact-social"]', parentSec: 'sec-contact' }
	];

	// Apply visibility classes and inline styles to DOM
	function applyVisibility() {
		// 1. Sections: Cascaded hiding of Navigation Button, Active View, and Content
		SECTION_ITEMS.forEach(function (sec) {
			var isHidden = isItemHidden(sec.id);
			var targetId = sec.targetArticle.replace('#', '');

			// Hide/show the article element itself
			var articleEl = document.querySelector(sec.targetArticle);
			if (articleEl) {
				articleEl.classList.toggle('tmx-hidden', isHidden);
				articleEl.style.setProperty('display', isHidden ? 'none' : '', 'important');
			}

			// If active article is hidden, close cleanly back to the home view
			if (isHidden) {
				if (window.location.hash === '#' + targetId || (articleEl && articleEl.classList.contains('active'))) {
					if (typeof window.jQuery !== 'undefined' && window.jQuery('#main').length && typeof window.jQuery('#main')[0]._hide === 'function') {
						window.jQuery('#main')[0]._hide(true);
					} else {
						window.location.hash = '';
					}
				}
			}

			// Hide/show the specific Navigation Button in the top header nav bar
			if (sec.navId) {
				document.querySelectorAll('[data-admin-nav="' + sec.navId + '"]').forEach(function (navEl) {
					navEl.classList.toggle('tmx-hidden', isHidden);
					navEl.style.setProperty('display', isHidden ? 'none' : '', 'important');
					var aLink = navEl.querySelector('a');
					if (aLink) {
						aLink.classList.toggle('tmx-hidden', isHidden);
						aLink.style.setProperty('display', isHidden ? 'none' : '', 'important');
					}
				});
			}

			// Hide/show specific Hub Item in Services Hub
			if (sec.hubId) {
				document.querySelectorAll('[data-admin-hub="' + sec.hubId + '"]').forEach(function (hubEl) {
					hubEl.classList.toggle('tmx-hidden', isHidden);
					hubEl.style.setProperty('display', isHidden ? 'none' : '', 'important');
				});
			}

			// Hide/show ALL links and buttons anywhere pointing to this section (href="#targetId")
			document.querySelectorAll('a[href="#' + targetId + '"]').forEach(function (link) {
				link.classList.toggle('tmx-hidden', isHidden);
				link.style.setProperty('display', isHidden ? 'none' : '', 'important');
				var parentLi = link.closest('li');
				if (parentLi) {
					parentLi.classList.toggle('tmx-hidden', isHidden);
					parentLi.style.setProperty('display', isHidden ? 'none' : '', 'important');
				}
			});

			// If header CTA points to #services, hide the wrapper .header-cta container when services is hidden
			if (targetId === 'services') {
				var headerCta = document.querySelector('.header-cta');
				if (headerCta) {
					var hideCta = isHidden || isItemHidden('btn-header-cta');
					headerCta.classList.toggle('tmx-hidden', hideCta);
					headerCta.style.setProperty('display', hideCta ? 'none' : '', 'important');
				}
			}
		});

		// 2. Individual Button Overrides
		BUTTON_ITEMS.forEach(function (btn) {
			var parentSecHidden = btn.parentSec ? isItemHidden(btn.parentSec) : false;
			var isHidden = parentSecHidden || isItemHidden(btn.id);
			document.querySelectorAll(btn.selector).forEach(function (el) {
				el.classList.toggle('tmx-hidden', isHidden);
				el.style.setProperty('display', isHidden ? 'none' : '', 'important');
				var parentLi = el.closest('li');
				if (parentLi) {
					parentLi.classList.toggle('tmx-hidden', isHidden);
					parentLi.style.setProperty('display', isHidden ? 'none' : '', 'important');
				}
			});
		});

		// 3. Hide vertical connector line above nav if Header CTA or Services is hidden
		var isHeaderCtaHidden = isItemHidden('sec-services') || isItemHidden('btn-header-cta');
		document.body.classList.toggle('tmx-no-header-cta', isHeaderCtaHidden);

		// 4. Dynamic adjustment of Nav Bar item separators so first visible item has no left border
		var visibleNavLis = document.querySelectorAll('#header nav ul li:not(.tmx-hidden)');
		visibleNavLis.forEach(function (li, idx) {
			if (idx === 0) {
				li.style.setProperty('border-left', '0', 'important');
			} else {
				li.style.removeProperty('border-left');
			}
		});

		// 5. Individual Services
		SERVICE_ITEMS.forEach(function (srv) {
			var isPillarHidden = isItemHidden('sec-' + srv.pillar);
			var isHidden = isPillarHidden || isItemHidden('service-' + srv.key);
			document.querySelectorAll('[data-service-key="' + srv.key + '"]').forEach(function (featureLi) {
				featureLi.classList.toggle('tmx-hidden', isHidden);
				featureLi.style.setProperty('display', isHidden ? 'none' : '', 'important');
			});
		});

		// Rebuild dropdown in contact form
		if (typeof window.rebuildTMXServiceSelect === 'function' && typeof window.getTMXLang === 'function') {
			window.rebuildTMXServiceSelect(window.getTMXLang());
		}
	}

	// Show toast notification
	function showToast(msg, isSuccess) {
		var toast = document.getElementById('tmx-admin-toast');
		if (!toast) {
			toast = document.createElement('div');
			toast.id = 'tmx-admin-toast';
			toast.className = 'tmx-admin-toast';
			document.body.appendChild(toast);
		}
		toast.textContent = msg;
		toast.className = 'tmx-admin-toast ' + (isSuccess !== false ? 'is-success' : 'is-error');
		toast.classList.add('is-visible');
		clearTimeout(toast._timer);
		toast._timer = setTimeout(function () {
			toast.classList.remove('is-visible');
			setTimeout(function () {
				if (toast && !toast.classList.contains('is-visible') && toast.parentNode) {
					toast.parentNode.removeChild(toast);
				}
			}, 300);
		}, 2600);
	}

	// Get active admin strings
	function getAdminStrings() {
		var lang = state.editLang || 'de';
		return ADMIN_STRINGS[lang] || ADMIN_STRINGS.de;
	}

	// Create and inject Admin UI on demand
	function buildAdminUI() {
		if (document.getElementById('tmx-admin-overlay')) return;

		var curLang = state.editLang || 'de';
		var str = getAdminStrings();

		// Modal Overlay (created only when shortcut is pressed)
		var overlay = document.createElement('div');
		overlay.id = 'tmx-admin-overlay';
		overlay.className = 'tmx-admin-overlay';
		overlay.innerHTML = [
			'<div class="tmx-admin-modal" id="tmx-admin-modal" role="dialog" aria-modal="true" aria-labelledby="tmx-admin-title">',
			'  <div class="tmx-admin-header">',
			'    <div class="tmx-admin-header-title">',
			'      <span class="icon solid fa-sliders-h"></span>',
			'      <h3 id="tmx-admin-title">' + str.title + '</h3>',
			'      <span class="tmx-admin-badge"><span class="pulse-dot"></span> <span id="tmx-admin-badge-text">' + str.liveBadge + '</span></span>',
			'    </div>',
			'    <div class="tmx-admin-header-actions">',
			'      <div class="tmx-lang-pill" id="tmx-admin-lang-toggle" role="group" aria-label="Editing Language">',
			'        <button type="button" data-admin-lang="de" class="' + (curLang === 'de' ? 'is-active' : '') + '">DE</button>',
			'        <button type="button" data-admin-lang="en" class="' + (curLang === 'en' ? 'is-active' : '') + '">EN</button>',
			'      </div>',
			'      <button type="button" class="tmx-admin-close" id="tmx-admin-close" title="' + str.closeTitle + '">&times;</button>',
			'    </div>',
			'  </div>',
			'  <div class="tmx-admin-nav-tabs">',
			'    <button type="button" data-tab="visibility" class="tmx-tab-btn ' + (state.activeTab === 'visibility' ? 'is-active' : '') + '"><span class="icon solid fa-eye"></span> <span class="tab-label">' + str.tabs.visibility + '</span></button>',
			'    <button type="button" data-tab="content" class="tmx-tab-btn ' + (state.activeTab === 'content' ? 'is-active' : '') + '"><span class="icon solid fa-font"></span> <span class="tab-label">' + str.tabs.content + '</span></button>',
			'    <button type="button" data-tab="live" class="tmx-tab-btn ' + (state.activeTab === 'live' ? 'is-active' : '') + '"><span class="icon solid fa-magic"></span> <span class="tab-label">' + str.tabs.live + '</span></button>',
			'    <button type="button" data-tab="backup" class="tmx-tab-btn ' + (state.activeTab === 'backup' ? 'is-active' : '') + '"><span class="icon solid fa-database"></span> <span class="tab-label">' + str.tabs.backup + '</span></button>',
			'  </div>',
			'  <div class="tmx-admin-body" id="tmx-admin-body">',
			'    <!-- Tabs Content Injected Dynamically -->',
			'  </div>',
			'  <div class="tmx-admin-footer">',
			'    <div class="tmx-admin-footer-left">',
			'      <span class="icon solid fa-keyboard"></span> <span id="tmx-admin-footer-shortcut">' + str.footerShortcut + '</span> <code>Ctrl + Shift + Q</code>',
			'    </div>',
			'    <div class="tmx-admin-footer-right">',
			'      <button type="button" id="tmx-btn-done" class="button primary small">' + str.footerDone + '</button>',
			'    </div>',
			'  </div>',
			'</div>'
		].join('\n');

		document.body.appendChild(overlay);

		// Event: Close handlers
		document.getElementById('tmx-admin-close').addEventListener('click', closeAdminModal);
		document.getElementById('tmx-btn-done').addEventListener('click', closeAdminModal);
		overlay.addEventListener('click', function (e) {
			if (e.target === overlay) closeAdminModal();
		});

		// Event: Tabs
		overlay.querySelectorAll('.tmx-tab-btn').forEach(function (btn) {
			btn.addEventListener('click', function () {
				state.activeTab = btn.getAttribute('data-tab');
				overlay.querySelectorAll('.tmx-tab-btn').forEach(function (b) {
					b.classList.toggle('is-active', b === btn);
				});
				renderAdminTabs();
			});
		});

		// Event: Lang toggle in Admin header
		overlay.querySelectorAll('#tmx-admin-lang-toggle button').forEach(function (btn) {
			btn.addEventListener('click', function () {
				var lang = btn.getAttribute('data-admin-lang');
				if (state.editLang === lang) return;
				state.editLang = lang;
				overlay.querySelectorAll('#tmx-admin-lang-toggle button').forEach(function (b) {
					b.classList.toggle('is-active', b === btn);
				});
				if (typeof window.setTMXLang === 'function') {
					window.setTMXLang(lang);
				}
				updateAdminStaticLabels();
				renderAdminTabs();
				showToast(lang === 'de' ? 'Sprache auf Deutsch gewechselt ✓' : 'Switched language to English ✓');
			});
		});
	}

	// Update static modal labels when language switches
	function updateAdminStaticLabels() {
		var str = getAdminStrings();
		var titleEl = document.getElementById('tmx-admin-title');
		if (titleEl) titleEl.textContent = str.title;

		var badgeEl = document.getElementById('tmx-admin-badge-text');
		if (badgeEl) badgeEl.textContent = str.liveBadge;

		var closeEl = document.getElementById('tmx-admin-close');
		if (closeEl) closeEl.title = str.closeTitle;

		var doneBtn = document.getElementById('tmx-btn-done');
		if (doneBtn) doneBtn.textContent = str.footerDone;

		var shortcutEl = document.getElementById('tmx-admin-footer-shortcut');
		if (shortcutEl) shortcutEl.textContent = str.footerShortcut;

		var tabBtns = document.querySelectorAll('#tmx-admin-modal .tmx-tab-btn');
		tabBtns.forEach(function (btn) {
			var tab = btn.getAttribute('data-tab');
			var labelSpan = btn.querySelector('.tab-label');
			if (labelSpan && str.tabs[tab]) {
				labelSpan.textContent = str.tabs[tab];
			}
		});
	}

	// Render the active tab content
	function renderAdminTabs() {
		var container = document.getElementById('tmx-admin-body');
		if (!container) return;

		// Sync header language toggle buttons
		document.querySelectorAll('#tmx-admin-lang-toggle button').forEach(function (b) {
			b.classList.toggle('is-active', b.getAttribute('data-admin-lang') === state.editLang);
		});

		if (state.activeTab === 'visibility') {
			renderVisibilityTab(container);
		} else if (state.activeTab === 'content') {
			renderContentTab(container);
		} else if (state.activeTab === 'live') {
			renderLiveEditTab(container);
		} else if (state.activeTab === 'backup') {
			renderBackupTab(container);
		}
	}

	// TAB 1: Visibility Controls (Show/Hide Elements)
	function renderVisibilityTab(container) {
		var str = getAdminStrings();
		var curLang = state.editLang || 'de';
		var dict = (window.TMX_I18N && window.TMX_I18N[curLang]) ? window.TMX_I18N[curLang] : {};

		var html = [
			'<div class="tmx-tab-pane">',
			'  <div class="tmx-section-intro">',
			'    <h4>' + str.vis.heading + '</h4>',
			'    <p>' + str.vis.desc + '</p>',
			'  </div>',
			'',
			'  <!-- Quick Filter -->',
			'  <div class="tmx-search-wrap">',
			'    <input type="text" id="tmx-vis-filter" class="tmx-input" placeholder="' + str.vis.searchPlaceholder + '" />',
			'  </div>',
			'',
			'  <!-- Group 1: Main Sections & Nav Buttons -->',
			'  <div class="tmx-group-card">',
			'    <h5 class="tmx-group-title"><span class="icon solid fa-columns"></span> ' + str.vis.groupSections + '</h5>',
			'    <div class="tmx-toggle-grid">'
		];

		SECTION_ITEMS.forEach(function (sec) {
			var checked = !isItemHidden(sec.id);
			var label = (str.sections && str.sections[sec.id]) ? str.sections[sec.id] : sec.id;
			html.push([
				'      <label class="tmx-switch-row" data-search="' + label.toLowerCase() + '">',
				'        <span class="tmx-switch-label">' + label + '</span>',
				'        <div class="tmx-switch">',
				'          <input type="checkbox" data-vis-id="' + sec.id + '" ' + (checked ? 'checked' : '') + ' />',
				'          <span class="tmx-slider"></span>',
				'        </div>',
				'      </label>'
			].join('\n'));
		});

		html.push('    </div>\n  </div>');

		// Group 2: Key Buttons & CTAs
		html.push([
			'  <div class="tmx-group-card">',
			'    <h5 class="tmx-group-title"><span class="icon solid fa-mouse-pointer"></span> ' + str.vis.groupButtons + '</h5>',
			'    <div class="tmx-toggle-grid">'
		].join('\n'));

		BUTTON_ITEMS.forEach(function (btn) {
			var parentSecHidden = btn.parentSec ? isItemHidden(btn.parentSec) : false;
			var checked = !parentSecHidden && !isItemHidden(btn.id);
			var disabledAttr = parentSecHidden ? 'disabled' : '';
			var label = (str.buttons && str.buttons[btn.id]) ? str.buttons[btn.id] : btn.id;
			var statusBadge = parentSecHidden ? ' <span class="tmx-mini-badge" style="background: rgba(239, 68, 68, 0.2); color: #fca5a5; border: 1px solid rgba(239, 68, 68, 0.4); margin-left: 0.5rem;">' + str.vis.autoHiddenBadge + '</span>' : '';

			html.push([
				'      <label class="tmx-switch-row ' + (parentSecHidden ? 'is-disabled' : '') + '" data-search="' + label.toLowerCase() + '">',
				'        <span class="tmx-switch-label">' + label + statusBadge + '</span>',
				'        <div class="tmx-switch">',
				'          <input type="checkbox" data-vis-id="' + btn.id + '" ' + (checked ? 'checked' : '') + ' ' + disabledAttr + ' />',
				'          <span class="tmx-slider"></span>',
				'        </div>',
				'      </label>'
			].join('\n'));
		});

		html.push('    </div>\n  </div>');

		// Group 3: 18 Individual Services
		html.push([
			'  <div class="tmx-group-card">',
			'    <h5 class="tmx-group-title"><span class="icon solid fa-th-list"></span> ' + str.vis.groupServices + '</h5>',
			'    <p class="tmx-help-text">' + str.vis.servicesHelp + '</p>',
			'    <div class="tmx-toggle-grid">'
		].join('\n'));

		SERVICE_ITEMS.forEach(function (srv) {
			var id = 'service-' + srv.key;
			var parentPillarHidden = isItemHidden('sec-' + srv.pillar);
			var checked = !parentPillarHidden && !isItemHidden(id);
			var disabledAttr = parentPillarHidden ? 'disabled' : '';
			var title = getNested(dict, 'items.' + srv.key + '.title') || srv.defaultTitle;
			var pillarBadge = srv.pillar.toUpperCase();
			var statusBadge = parentPillarHidden ? ' <span class="tmx-mini-badge" style="background: rgba(239, 68, 68, 0.2); color: #fca5a5; border: 1px solid rgba(239, 68, 68, 0.4); margin-left: 0.5rem;">' + str.vis.pillarHiddenBadge + '</span>' : '';

			html.push([
				'      <label class="tmx-switch-row ' + (parentPillarHidden ? 'is-disabled' : '') + '" data-search="' + (title + ' ' + srv.pillar).toLowerCase() + '">',
				'        <span class="tmx-switch-label">',
				'          <span class="tmx-mini-badge tmx-pillar-' + srv.pillar + '">' + pillarBadge + '</span> ' + title + statusBadge,
				'        </span>',
				'        <div class="tmx-switch">',
				'          <input type="checkbox" data-vis-id="' + id + '" ' + (checked ? 'checked' : '') + ' ' + disabledAttr + ' />',
				'          <span class="tmx-slider"></span>',
				'        </div>',
				'      </label>'
			].join('\n'));
		});

		html.push([
			'    </div>',
			'  </div>',
			'</div>'
		].join('\n'));

		container.innerHTML = html.join('\n');

		// Event: Toggle visibility changes
		container.querySelectorAll('input[data-vis-id]').forEach(function (chk) {
			chk.addEventListener('change', function () {
				var id = chk.getAttribute('data-vis-id');
				if (chk.checked) {
					delete state.hidden[id];
				} else {
					state.hidden[id] = true;
				}
				saveState();
				applyVisibility();
				// When a section is toggled, re-render to update the dependent buttons and services
				if (id.indexOf('sec-') === 0) {
					renderVisibilityTab(container);
				}
				showToast(curLang === 'de' ? 'Sichtbarkeit aktualisiert ✓' : 'Visibility updated ✓');
			});
		});

		// Event: Search filter
		var visFilter = document.getElementById('tmx-vis-filter');
		if (visFilter) {
			visFilter.addEventListener('input', function () {
				var q = visFilter.value.trim().toLowerCase();
				container.querySelectorAll('.tmx-switch-row').forEach(function (row) {
					var text = row.getAttribute('data-search') || '';
					row.style.display = !q || text.indexOf(q) !== -1 ? '' : 'none';
				});
			});
		}
	}

	// Content categories definitions
	var CONTENT_CATEGORIES = [
		{
			id: 'hero',
			icon: 'fa-home',
			fields: [
				{ key: 'intro.title', labelDe: 'Firmenname / Hero-Titel', labelEn: 'Company / Hero Title', type: 'text' },
				{ key: 'intro.tagline', labelDe: 'Haupt-Slogan / Untertitel', labelEn: 'Main Tagline / Pitch', type: 'textarea' },
				{ key: 'intro.cta', labelDe: 'Header-Button Text', labelEn: 'Header CTA Button Text', type: 'text' }
			]
		},
		{
			id: 'about',
			icon: 'fa-user-friends',
			fields: [
				{ key: 'about.title', labelDe: 'Über uns Titel', labelEn: 'About Section Title', type: 'text' },
				{ key: 'about.text', labelDe: 'Über uns Haupttext', labelEn: 'About Us Main Description', type: 'textarea' }
			]
		},
		{
			id: 'services_hub',
			icon: 'fa-cubes',
			fields: [
				{ key: 'services.title', labelDe: 'Leistungen Seitentitel', labelEn: 'Services Page Title', type: 'text' },
				{ key: 'services.intro', labelDe: 'Leistungsübersicht Einleitungstext', labelEn: 'Services Hub Intro Paragraph', type: 'textarea' }
			]
		},
		{
			id: 'pillars',
			icon: 'fa-sitemap',
			fields: [
				{ key: 'pillars.entwicklung.title', labelDe: 'Entwicklung Titel', labelEn: 'Development Pillar Title', type: 'text' },
				{ key: 'pillars.entwicklung.intro', labelDe: 'Entwicklung Einleitungstext', labelEn: 'Development Intro Paragraph', type: 'textarea' },
				{ key: 'pillars.ki.title', labelDe: 'Künstliche Intelligenz Titel', labelEn: 'Artificial Intelligence Pillar Title', type: 'text' },
				{ key: 'pillars.ki.intro', labelDe: 'Künstliche Intelligenz Einleitungstext', labelEn: 'Artificial Intelligence Intro Paragraph', type: 'textarea' },
				{ key: 'pillars.marketing.title', labelDe: 'Digitales Marketing Titel', labelEn: 'Digital Marketing Pillar Title', type: 'text' },
				{ key: 'pillars.marketing.intro', labelDe: 'Digitales Marketing Einleitungstext', labelEn: 'Digital Marketing Intro Paragraph', type: 'textarea' },
				{ key: 'pillars.it.title', labelDe: 'IT & Beratung Titel', labelEn: 'IT & Consulting Pillar Title', type: 'text' },
				{ key: 'pillars.it.intro', labelDe: 'IT & Beratung Einleitungstext', labelEn: 'IT & Consulting Intro Paragraph', type: 'textarea' }
			]
		},
		{
			id: 'services_items',
			icon: 'fa-layer-group',
			fields: (function () {
				var res = [];
				SERVICE_ITEMS.forEach(function (srv) {
					res.push({
						key: 'items.' + srv.key + '.title',
						labelDe: '[' + srv.pillar.toUpperCase() + '] ' + srv.defaultTitle + ' (Titel)',
						labelEn: '[' + srv.pillar.toUpperCase() + '] ' + srv.defaultTitle + ' (Title)',
						type: 'text'
					});
					res.push({
						key: 'items.' + srv.key + '.desc',
						labelDe: '[' + srv.pillar.toUpperCase() + '] ' + srv.defaultTitle + ' (Beschreibung)',
						labelEn: '[' + srv.pillar.toUpperCase() + '] ' + srv.defaultTitle + ' (Description)',
						type: 'textarea'
					});
				});
				return res;
			})()
		},
		{
			id: 'contact',
			icon: 'fa-envelope',
			fields: [
				{ key: 'contact.title', labelDe: 'Kontakt Titel', labelEn: 'Contact Section Title', type: 'text' },
				{ key: 'contact.intro', labelDe: 'Kontakt Einleitungstext', labelEn: 'Contact Intro Text', type: 'textarea' },
				{ key: 'contact.name', labelDe: 'Name Feld-Label', labelEn: 'Name Field Label', type: 'text' },
				{ key: 'contact.email', labelDe: 'E-Mail Feld-Label', labelEn: 'Email Field Label', type: 'text' },
				{ key: 'contact.phone', labelDe: 'Telefon Feld-Label', labelEn: 'Phone Field Label', type: 'text' },
				{ key: 'contact.service', labelDe: 'Leistung Dropdown-Label', labelEn: 'Service Select Label', type: 'text' },
				{ key: 'contact.servicePlaceholder', labelDe: 'Leistung Platzhalter-Option', labelEn: 'Service Dropdown Placeholder', type: 'text' },
				{ key: 'contact.message', labelDe: 'Nachricht Feld-Label', labelEn: 'Message Field Label', type: 'text' },
				{ key: 'contact.submit', labelDe: 'Senden Button-Label', labelEn: 'Submit Button Label', type: 'text' },
				{ key: 'contact.reset', labelDe: 'Zurücksetzen Button-Label', labelEn: 'Reset Button Label', type: 'text' },
				{ key: 'contact.serviceNote', labelDe: 'Spezialisten Hinweis', labelEn: 'Specialist Contact Note', type: 'textarea' },
				{ key: 'contact.success', labelDe: 'Erfolgsmeldung Text', labelEn: 'Success Notification Message', type: 'text' },
				{ key: 'contact.error', labelDe: 'Fehlermeldung Text', labelEn: 'Error Notification Message', type: 'text' }
			]
		},
		{
			id: 'navigation',
			icon: 'fa-bars',
			fields: [
				{ key: 'nav.intro', labelDe: 'Nav: Intro', labelEn: 'Nav: Intro', type: 'text' },
				{ key: 'nav.about', labelDe: 'Nav: Über uns', labelEn: 'Nav: About Us', type: 'text' },
				{ key: 'nav.services', labelDe: 'Nav: Leistungen', labelEn: 'Nav: Services', type: 'text' },
				{ key: 'navShort.entwicklung', labelDe: 'Nav Kurz: Entwicklung', labelEn: 'Nav Short: Dev', type: 'text' },
				{ key: 'navShort.ki', labelDe: 'Nav Kurz: KI', labelEn: 'Nav Short: AI', type: 'text' },
				{ key: 'navShort.marketing', labelDe: 'Nav Kurz: Marketing', labelEn: 'Nav Short: Mktg', type: 'text' },
				{ key: 'navShort.it', labelDe: 'Nav Kurz: IT', labelEn: 'Nav Short: IT', type: 'text' },
				{ key: 'nav.contact', labelDe: 'Nav: Kontakt', labelEn: 'Nav: Contact', type: 'text' }
			]
		},
		{
			id: 'footer',
			icon: 'fa-info-circle',
			fields: [
				{ key: 'footer.tagline', labelDe: 'Footer Slogan', labelEn: 'Footer Tagline', type: 'text' },
				{ key: 'footer.copyright', labelDe: 'Copyright Text', labelEn: 'Copyright Notice', type: 'text' },
				{ key: 'meta.title', labelDe: 'Seite Meta-Titel', labelEn: 'Page Meta Title', type: 'text' },
				{ key: 'meta.description', labelDe: 'Seite Meta-Beschreibung', labelEn: 'Page Meta Description', type: 'textarea' }
			]
		}
	];

	// TAB 2: Text & Copy Editor (DE & EN with clean persistence)
	function renderContentTab(container) {
		var str = getAdminStrings();
		var lang = state.editLang || 'de';
		var dict = (window.TMX_I18N && window.TMX_I18N[lang]) ? window.TMX_I18N[lang] : {};

		var html = [
			'<div class="tmx-tab-pane">',
			'  <div class="tmx-section-intro">',
			'    <h4>' + str.content.heading + '</h4>',
			'    <p>' + str.content.desc + '</p>',
			'  </div>',
			'',
			'  <!-- Search text fields -->',
			'  <div class="tmx-search-wrap">',
			'    <input type="text" id="tmx-content-search" class="tmx-input" placeholder="' + str.content.searchPlaceholder + '" />',
			'  </div>',
			''
		];

		CONTENT_CATEGORIES.forEach(function (cat) {
			var catTitle = (str.categories && str.categories[cat.id]) ? str.categories[cat.id] : cat.id;
			var isOpen = !!openAccordionIds[cat.id];

			html.push([
				'  <div class="tmx-accordion-group ' + (isOpen ? 'is-open' : '') + '" data-group-id="' + cat.id + '">',
				'    <div class="tmx-accordion-header">',
				'      <span class="icon solid ' + cat.icon + '"></span>',
				'      <span class="tmx-accordion-title">' + catTitle + '</span>',
				'      <span class="icon solid fa-chevron-down tmx-accordion-arrow"></span>',
				'    </div>',
				'    <div class="tmx-accordion-body">'
			].join('\n'));

			cat.fields.forEach(function (f) {
				var val = getNested(dict, f.key) || '';
				var fieldLabel = (lang === 'de') ? (f.labelDe || f.labelEn) : (f.labelEn || f.labelDe);

				html.push([
					'      <div class="tmx-field-row" data-search="' + (fieldLabel + ' ' + f.key + ' ' + val).toLowerCase() + '">',
					'        <label class="tmx-field-label">',
					'          <span class="tmx-field-name">' + fieldLabel + '</span>',
					'          <code class="tmx-field-key">' + f.key + '</code>',
					'        </label>'
				].join('\n'));

				if (f.type === 'textarea') {
					html.push('        <textarea class="tmx-textarea" data-i18n-key="' + f.key + '" rows="3">' + escapeHtml(val) + '</textarea>');
				} else {
					html.push('        <input type="text" class="tmx-input" data-i18n-key="' + f.key + '" value="' + escapeHtml(val) + '" />');
				}

				html.push('      </div>');
			});

			html.push('    </div>\n  </div>');
		});

		html.push('</div>');

		container.innerHTML = html.join('\n');

		// Event: Accordion headers toggle (remembering open state across re-renders)
		container.querySelectorAll('.tmx-accordion-header').forEach(function (hdr) {
			hdr.addEventListener('click', function () {
				var group = hdr.closest('.tmx-accordion-group');
				var groupId = group.getAttribute('data-group-id');
				group.classList.toggle('is-open');
				openAccordionIds[groupId] = group.classList.contains('is-open');
			});
		});

		// Event: Input change listener for live editing & persistence
		container.querySelectorAll('[data-i18n-key]').forEach(function (input) {
			input.addEventListener('input', function () {
				var key = input.getAttribute('data-i18n-key');
				var val = input.value;
				var l = state.editLang;

				// Update memory
				if (!state.content[l]) state.content[l] = {};
				state.content[l][key] = val;
				setNested(window.TMX_I18N[l], key, val);

				// Save to LocalStorage
				saveState();

				// If site is currently viewing this language, update DOM immediately
				if (typeof window.getTMXLang === 'function' && window.getTMXLang() === l) {
					if (typeof window.applyTMXLanguage === 'function') {
						window.applyTMXLanguage(l);
					}
				}

				showToast(str.content.updatedToast);
			});
		});

		// Event: Search filter
		var searchInput = document.getElementById('tmx-content-search');
		if (searchInput) {
			searchInput.addEventListener('input', function () {
				var q = searchInput.value.trim().toLowerCase();
				container.querySelectorAll('.tmx-accordion-group').forEach(function (grp) {
					var hasVisible = false;
					grp.querySelectorAll('.tmx-field-row').forEach(function (row) {
						var strData = row.getAttribute('data-search') || '';
						var match = !q || strData.indexOf(q) !== -1;
						row.style.display = match ? '' : 'none';
						if (match) hasVisible = true;
					});
					if (q) {
						grp.classList.toggle('is-open', hasVisible);
						grp.style.display = hasVisible ? '' : 'none';
					} else {
						var groupId = grp.getAttribute('data-group-id');
						grp.classList.toggle('is-open', !!openAccordionIds[groupId]);
						grp.style.display = '';
					}
				});
			});
		}
	}

	// TAB 3: On-Page Live Visual Editing
	function renderLiveEditTab(container) {
		var str = getAdminStrings();
		var isLive = !!state.liveEdit;

		var stepsHtml = str.live.steps.map(function (s) {
			return '<li>' + s + '</li>';
		}).join('\n');

		container.innerHTML = [
			'<div class="tmx-tab-pane">',
			'  <div class="tmx-section-intro">',
			'    <h4>' + str.live.heading + '</h4>',
			'    <p>' + str.live.desc + '</p>',
			'  </div>',
			'',
			'  <div class="tmx-live-card ' + (isLive ? 'is-active' : '') + '">',
			'    <div class="tmx-live-status">',
			'      <div class="tmx-live-indicator"><span class="pulse-dot"></span></div>',
			'      <div>',
			'        <h5>' + str.live.statusTitle + ' <strong>' + (isLive ? str.live.statusEnabled : str.live.statusDisabled) + '</strong></h5>',
			'        <p>' + (isLive ? str.live.statusDescActive : str.live.statusDescInactive) + '</p>',
			'      </div>',
			'    </div>',
			'    <div class="tmx-switch-large">',
			'      <div class="tmx-switch">',
			'        <input type="checkbox" id="tmx-toggle-live-mode" ' + (isLive ? 'checked' : '') + ' />',
			'        <span class="tmx-slider"></span>',
			'      </div>',
			'    </div>',
			'  </div>',
			'',
			'  <div class="tmx-live-instructions">',
			'    <h5><span class="icon solid fa-lightbulb"></span> ' + str.live.instructionsTitle + '</h5>',
			'    <ol>',
			stepsHtml,
			'    </ol>',
			'  </div>',
			'</div>'
		].join('\n');

		var chk = document.getElementById('tmx-toggle-live-mode');
		if (chk) {
			chk.addEventListener('change', function () {
				setLiveEditMode(chk.checked);
				renderAdminTabs();
				showToast(chk.checked ? str.live.activatedToast : str.live.deactivatedToast);
			});
		}
	}

	// TAB 4: Backup, Export, Import & Reset
	function renderBackupTab(container) {
		var str = getAdminStrings();

		container.innerHTML = [
			'<div class="tmx-tab-pane">',
			'  <div class="tmx-section-intro">',
			'    <h4>' + str.backup.heading + '</h4>',
			'    <p>' + str.backup.desc + '</p>',
			'  </div>',
			'',
			'  <div class="tmx-backup-grid">',
			'    <!-- Export Card -->',
			'    <div class="tmx-backup-card">',
			'      <h5><span class="icon solid fa-file-export"></span> ' + str.backup.exportTitle + '</h5>',
			'      <p>' + str.backup.exportDesc + '</p>',
			'      <button type="button" id="tmx-btn-export-copy" class="button small primary"><span class="icon solid fa-copy"></span> ' + str.backup.btnCopy + '</button>',
			'      <button type="button" id="tmx-btn-export-download" class="button small"><span class="icon solid fa-download"></span> ' + str.backup.btnDownload + '</button>',
			'    </div>',
			'',
			'    <!-- Import Card -->',
			'    <div class="tmx-backup-card">',
			'      <h5><span class="icon solid fa-file-import"></span> ' + str.backup.importTitle + '</h5>',
			'      <p>' + str.backup.importDesc + '</p>',
			'      <textarea id="tmx-import-json" class="tmx-textarea" rows="3" placeholder="' + str.backup.importPlaceholder + '"></textarea>',
			'      <button type="button" id="tmx-btn-import" class="button small primary"><span class="icon solid fa-check"></span> ' + str.backup.btnApply + '</button>',
			'    </div>',
			'  </div>',
			'',
			'  <!-- Reset Card -->',
			'  <div class="tmx-reset-card">',
			'    <div class="tmx-reset-info">',
			'      <h5><span class="icon solid fa-undo"></span> ' + str.backup.resetTitle + '</h5>',
			'      <p>' + str.backup.resetDesc + '</p>',
			'    </div>',
			'    <button type="button" id="tmx-btn-reset-defaults" class="button small danger"><span class="icon solid fa-trash-alt"></span> ' + str.backup.btnReset + '</button>',
			'  </div>',
			'</div>'
		].join('\n');

		// Export Copy
		document.getElementById('tmx-btn-export-copy').addEventListener('click', function () {
			var jsonStr = JSON.stringify({
				version: '1.0',
				timestamp: new Date().toISOString(),
				hidden: state.hidden,
				content: state.content
			}, null, 2);

			if (navigator.clipboard && navigator.clipboard.writeText) {
				navigator.clipboard.writeText(jsonStr).then(function () {
					showToast(str.backup.copiedToast);
				}).catch(function () {
					showToast('Could not copy to clipboard. Please copy manually.', false);
				});
			} else {
				showToast('Clipboard API not available.', false);
			}
		});

		// Export Download
		document.getElementById('tmx-btn-export-download').addEventListener('click', function () {
			var jsonStr = JSON.stringify({
				version: '1.0',
				timestamp: new Date().toISOString(),
				hidden: state.hidden,
				content: state.content
			}, null, 2);

			var blob = new Blob([jsonStr], { type: 'application/json' });
			var url = URL.createObjectURL(blob);
			var a = document.createElement('a');
			a.href = url;
			a.download = 'tmx-magmafy-config-' + new Date().toISOString().slice(0, 10) + '.json';
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
			showToast(str.backup.downloadedToast);
		});

		// Import JSON
		document.getElementById('tmx-btn-import').addEventListener('click', function () {
			var textarea = document.getElementById('tmx-import-json');
			var val = textarea.value.trim();
			if (!val) {
				showToast('Please paste a JSON configuration first.', false);
				return;
			}
			try {
				var parsed = JSON.parse(val);
				if (parsed.hidden) state.hidden = parsed.hidden;
				if (parsed.content) {
					state.content.de = parsed.content.de || {};
					state.content.en = parsed.content.en || {};
				}
				saveState();
				applyContentOverrides();
				applyVisibility();
				if (typeof window.applyTMXLanguage === 'function' && typeof window.getTMXLang === 'function') {
					window.applyTMXLanguage(window.getTMXLang());
				}
				showToast(str.backup.importedToast);
				renderAdminTabs();
			} catch (e) {
				showToast('Invalid JSON syntax: ' + e.message, false);
			}
		});

		// Reset to Defaults
		document.getElementById('tmx-btn-reset-defaults').addEventListener('click', function () {
			if (!window.confirm(str.backup.resetConfirm)) {
				return;
			}
			localStorage.removeItem(STORAGE_KEY);
			state.hidden = {};
			state.content = { de: {}, en: {} };
			state.liveEdit = false;

			// Restore initial I18N
			window.TMX_I18N = JSON.parse(JSON.stringify(INITIAL_I18N));

			setLiveEditMode(false);
			applyVisibility();
			if (typeof window.applyTMXLanguage === 'function' && typeof window.getTMXLang === 'function') {
				window.applyTMXLanguage(window.getTMXLang());
			}

			showToast(str.backup.resetToast);
			renderAdminTabs();
		});
	}

	// Turn On-Page Live Edit Mode on/off
	function setLiveEditMode(enable) {
		state.liveEdit = !!enable;
		saveState();
		document.body.classList.toggle('tmx-live-edit-active', state.liveEdit);

		var banner = document.getElementById('tmx-live-edit-banner');
		if (banner) banner.classList.toggle('is-visible', state.liveEdit);

		var editableElements = document.querySelectorAll('[data-i18n]');
		editableElements.forEach(function (el) {
			if (state.liveEdit) {
				el.setAttribute('contenteditable', 'true');
				el.setAttribute('spellcheck', 'false');
				el.classList.add('tmx-live-editable');
				el.addEventListener('blur', onLiveEditBlur);
				el.addEventListener('keydown', onLiveEditKeydown);
			} else {
				el.removeAttribute('contenteditable');
				el.classList.remove('tmx-live-editable');
				el.removeEventListener('blur', onLiveEditBlur);
				el.removeEventListener('keydown', onLiveEditKeydown);
			}
		});
	}

	function onLiveEditKeydown(e) {
		// Prevent Enter submitting forms or navigating when inline editing buttons/links
		if (e.key === 'Enter' && !e.shiftKey && e.target.tagName !== 'P') {
			e.preventDefault();
			e.target.blur();
		}
	}

	function onLiveEditBlur(e) {
		var el = e.target;
		var key = el.getAttribute('data-i18n');
		if (!key) return;

		var newText = el.textContent.trim();
		var lang = (typeof window.getTMXLang === 'function') ? window.getTMXLang() : 'de';

		// Update state
		if (!state.content[lang]) state.content[lang] = {};
		state.content[lang][key] = newText;
		setNested(window.TMX_I18N[lang], key, newText);

		saveState();
		showToast((lang === 'de' ? 'Gespeichert: "' : 'Saved: "') + key + '" ✓');
	}

	// Modal Visibility
	function isAdminOpen() {
		var overlay = document.getElementById('tmx-admin-overlay');
		return overlay && overlay.classList.contains('is-open');
	}

	function openAdminModal() {
		// Sync edit language with site's current language
		if (typeof window.getTMXLang === 'function') {
			state.editLang = window.getTMXLang();
		}
		buildAdminUI();
		var overlay = document.getElementById('tmx-admin-overlay');
		if (overlay) {
			updateAdminStaticLabels();
			renderAdminTabs();
			// Force reflow for smooth glass transition
			void overlay.offsetHeight;
			overlay.classList.add('is-open');
			document.body.classList.add('tmx-admin-open');
		}
	}

	function closeAdminModal() {
		var overlay = document.getElementById('tmx-admin-overlay');
		if (overlay) {
			overlay.classList.remove('is-open');
			document.body.classList.remove('tmx-admin-open');
			// Completely remove from DOM after fade out so it stays 100% hidden from DevTools Inspect
			setTimeout(function () {
				if (overlay && !overlay.classList.contains('is-open') && overlay.parentNode) {
					overlay.parentNode.removeChild(overlay);
				}
			}, 300);
		}
	}

	function toggleAdminModal() {
		if (isAdminOpen()) {
			closeAdminModal();
		} else {
			openAdminModal();
		}
	}

	// Escape HTML helper
	function escapeHtml(str) {
		if (!str) return '';
		return String(str)
			.replace(/&/g, '&amp;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#039;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;');
	}

	// Initialize keyboard shortcut (Ctrl + Shift + Q / Cmd + Shift + Q)
	function initShortcut() {
		window.addEventListener('keydown', function (e) {
			var isCtrlOrCmd = e.ctrlKey || e.metaKey;
			var isShift = e.shiftKey;
			var isQ = (e.key && e.key.toLowerCase() === 'q') || e.code === 'KeyQ';

			if (isCtrlOrCmd && isShift && isQ) {
				e.preventDefault();
				e.stopPropagation();
				toggleAdminModal();
			} else if (e.key === 'Escape') {
				if (isAdminOpen()) {
					closeAdminModal();
				}
			}
		}, true);
	}

	// Boot up Admin module
	function init() {
		loadState();
		applyContentOverrides();
		initShortcut();

		if (document.readyState === 'loading') {
			document.addEventListener('DOMContentLoaded', onReady);
		} else {
			onReady();
		}
	}

	function onReady() {
		if (typeof window.getTMXLang === 'function') {
			state.editLang = window.getTMXLang();
		}

		// Apply content overrides immediately to the DOM so custom edits are visible on reload
		if (typeof window.applyTMXLanguage === 'function' && typeof window.getTMXLang === 'function') {
			window.applyTMXLanguage(window.getTMXLang());
		}

		applyVisibility();

		if (state.liveEdit) {
			setLiveEditMode(true);
		}
	}

	// Expose globally for site.js integration
	window.TMX_ADMIN = {
		isServiceHidden: function (serviceKey) {
			for (var i = 0; i < SERVICE_ITEMS.length; i++) {
				if (SERVICE_ITEMS[i].key === serviceKey) {
					if (isItemHidden('sec-' + SERVICE_ITEMS[i].pillar)) return true;
					break;
				}
			}
			return isItemHidden('service-' + serviceKey);
		},
		isItemHidden: isItemHidden,
		onLangChange: function (lang) {
			state.editLang = lang;
			var overlay = document.getElementById('tmx-admin-overlay');
			if (overlay && overlay.classList.contains('is-open')) {
				updateAdminStaticLabels();
				renderAdminTabs();
			}
			// If live edit is active, re-bind listeners
			if (state.liveEdit) {
				setLiveEditMode(true);
			}
		},
		open: openAdminModal,
		close: closeAdminModal,
		toggle: toggleAdminModal
	};

	init();
})();
