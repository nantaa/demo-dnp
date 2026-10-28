/**
 * Anti-Reverse Engineering & Client Inspection Deterrent
 * Active in production environments to deter casual source inspection and scraping.
 */
(function initAntiReverseEngineering() {
    // Only activate in production mode (leave local development unhindered)
    if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
        return;
    }
    if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
        return;
    }

    // 1. Anti-Frame Clickjacking Protection (Frame Buster)
    try {
        if (window.top !== window.self) {
            window.top.location = window.self.location;
        }
    } catch {
        // Sandboxed iframe protection
        window.self.location.replace('about:blank');
    }

    // 2. Prevent Right-Click Context Menu on App Elements
    document.addEventListener('contextmenu', function (e) {
        // Allow right-click on input, textarea, and editable elements for copy-paste
        var tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : '';
        if (tag === 'input' || tag === 'textarea' || e.target.isContentEditable) {
            return;
        }
        e.preventDefault();
    }, false);

    // 3. Block Inspection Keyboard Shortcuts (F12, Ctrl+Shift+I/J/C, Ctrl+U)
    document.addEventListener('keydown', function (e) {
        // F12 key
        if (e.key === 'F12' || e.keyCode === 123) {
            e.preventDefault();
            return false;
        }

        // Ctrl+Shift+I (Inspect), Ctrl+Shift+J (Console), Ctrl+Shift+C (Element Picker)
        if ((e.ctrlKey || e.metaKey) && e.shiftKey) {
            var key = (e.key || '').toUpperCase();
            if (key === 'I' || key === 'J' || key === 'C') {
                e.preventDefault();
                return false;
            }
        }

        // Ctrl+U (View Source)
        if ((e.ctrlKey || e.metaKey) && ((e.key || '').toUpperCase() === 'U')) {
            e.preventDefault();
            return false;
        }
    }, false);
})();
