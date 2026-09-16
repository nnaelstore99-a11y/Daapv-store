
(function () {
    var continueBtn   = document.getElementById('continueBtn');
    var loaderSection = document.getElementById('loaderSection');
    var loginSection  = document.getElementById('loginSection');
    var overlay       = document.getElementById('transitionOverlay');
    var signInBtn     = document.getElementById('landingSignInBtn');
    var btnText       = document.getElementById('landingBtnSignInText');
    var btnArrow      = document.getElementById('landingBtnSignInArrow');
    var btnLoader     = document.getElementById('landingBtnLoader');
    var errorToast    = document.getElementById('landingErrorToast');
    var errorText     = document.getElementById('landingErrorText');
    var usernameField = document.getElementById('landingUsernameField');
    var passwordField = document.getElementById('landingPasswordField');
    var eyeBtn        = document.getElementById('landingEyeBtn');
    var eyeIcon       = document.getElementById('landingEyeIcon');
    var dashWrap      = document.getElementById('dashboardWrapper');

    var transitioning = false;
    var isSubmitting  = false;

    applyThemeToDOM(localStorage.getItem('4vell_theme') || 'light');

    if (dashWrap) dashWrap.style.display = 'none';

    var savedSession = localStorage.getItem('daapv_session');
    if (savedSession) {
        loaderSection.classList.remove('active');
        loaderSection.classList.add('hidden');
        loginSection.classList.remove('active');
        loginSection.classList.add('hidden');
        dashWrap.style.display = 'block';
        document.documentElement.classList.remove('landing-html');
        document.body.classList.remove('landing-body');
        document.body.classList.add('dashboard-active');
        if (typeof initDashboard === 'function') initDashboard();
        if (typeof loadUsername === 'function') loadUsername();
        if (typeof initDaapvRole === 'function') initDaapvRole();
        return;
    }

    startScrambleEffect();

    function startScrambleEffect() {
        var el = document.getElementById('title-scramble');
        if (!el) return;
        var target = 'Selamat Datang';
        var chars = 'abcdefghijklmnopqrstuvwxyz';
        var frame = 0;
        function scramble() {
            var progress = frame / 50;
            var output = '';
            for (var i = 0; i < target.length; i++) {
                output += i < Math.floor(progress * target.length)
                    ? target[i]
                    : chars[Math.floor(Math.random() * chars.length)];
            }
            el.textContent = output;
            frame++;
            if (frame <= 50) requestAnimationFrame(scramble);
            else el.textContent = target;
        }
        setTimeout(scramble, 3000);
    }

    continueBtn.addEventListener('click', function () {
        if (transitioning) return;
        transitioning = true;
        continueBtn.style.pointerEvents = 'none';
        overlay.className = 'transition-overlay flash-in';

        setTimeout(function () {
            loaderSection.classList.remove('active');
            loaderSection.classList.add('hidden');
            loginSection.classList.remove('hidden');
            loginSection.classList.add('active');
            prefillUsername();
        }, 240);

        setTimeout(function () {
            overlay.className = 'transition-overlay flash-out';
            loginSection.classList.add('entered');
        }, 480);

        setTimeout(function () {
            overlay.className = 'transition-overlay';
            transitioning = false;
        }, 900);
    });

    eyeBtn.addEventListener('click', function () {
        var show = passwordField.type === 'password';
        passwordField.type = show ? 'text' : 'password';
        eyeIcon.innerHTML = show
            ? '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>'
            : '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
    });

    function prefillUsername() {
        var saved = localStorage.getItem('daapv_username') || localStorage.getItem('4vell_username');
        if (saved) {
            usernameField.value = saved;
            passwordField.focus();
        }
    }

    function showError(message) {
        errorText.textContent = message;
        errorToast.style.display = 'block';
        errorToast.style.animation = 'none';
        setTimeout(function () {
            errorToast.style.animation = 'loginEnter 0.4s ease-out';
        }, 10);
        clearTimeout(showError._timer);
        showError._timer = setTimeout(function () {
            if (errorToast.style.display === 'block') errorToast.style.display = 'none';
        }, 5000);
    }

    function hideError() { errorToast.style.display = 'none'; }

    function setLoading(state) {
        isSubmitting = state;
        if (state) {
            signInBtn.disabled = true;
            btnText.style.display = 'none';
            btnArrow.style.display = 'none';
            btnLoader.style.display = 'block';
        } else {
            signInBtn.disabled = false;
            btnText.style.display = '';
            btnArrow.style.display = '';
            btnLoader.style.display = 'none';
        }
    }

    signInBtn.addEventListener('click', function () {
        if (isSubmitting) return;
        hideError();
        var username = usernameField.value.trim();
        var key      = passwordField.value.trim();
        if (!username || !key) {
            showError('Please fill in both username and password!');
            return;
        }
        localStorage.setItem('indictive_username', username);
        setLoading(true);

        setTimeout(async function () {
            try {
                const res = await fetch('/api/auth/login', {
                    method:'POST',
                    headers:{'Content-Type':'application/json'},
                    body:JSON.stringify({username,password:key})
                });
                const data = await res.json();
                if(!res.ok) throw new Error(data.message || 'Login gagal');
                localStorage.setItem('daapv_session', data.token);
                localStorage.setItem('daapv_username', username);
                localStorage.setItem('4vell_username', username);
                localStorage.setItem('4vell_session', 'true');
                localStorage.setItem('daapv_role', data.role);
                if (typeof currentUsername !== 'undefined') currentUsername = username;
                if (typeof STATE !== 'undefined') STATE.username = username;

                if (typeof notifyLogin === 'function') { try { await notifyLogin(username); } catch (e) {} }

                loaderSection.classList.remove('active');
            loaderSection.classList.add('hidden');
            loginSection.classList.remove('active');
            loginSection.classList.add('hidden');

            document.documentElement.classList.remove('landing-html');
            document.body.classList.remove('landing-body');
            document.body.classList.add('dashboard-active');
            dashWrap.style.display = 'block';

            if (typeof initDashboard === 'function') initDashboard();
            if (typeof loadUsername === 'function') loadUsername();

            setLoading(false);
            if (typeof showToast === 'function') {
                showToast('👋 Selamat datang, ' + username + '!', '#A78BFA');
            }
            } catch (e) {
                setLoading(false);
                showError(e.message || 'Login gagal.');
            }
        }, 700);
    });

    document.addEventListener('touchmove', function (e) {
        if (!e.target.closest('input, textarea') && loginSection.classList.contains('active')) {
            e.preventDefault();
        }
    }, { passive: false });
})();
