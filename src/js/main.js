document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    // Icon renderer
    function renderIcons(root) {
        if (window.lucide && typeof window.lucide.createIcons === "function") {
            if (root && root.nodeType === 1) {
                window.lucide.createIcons({ root });
            } else {
                window.lucide.createIcons();
            }
        }
    }
    renderIcons();

    // Clipboard helpers
    function safeCopy(text, onSuccess) {
        if (!text) return;
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => {
                if (typeof onSuccess === "function") onSuccess();
            }).catch(() => {
                fallbackCopy(text, onSuccess);
            });
        } else {
            fallbackCopy(text, onSuccess);
        }
    }

    function fallbackCopy(text, onSuccess) {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand("copy");
            if (typeof onSuccess === "function") onSuccess();
        } catch (err) {
            console.error("Fallback clipboard copy failed:", err);
        } finally {
            document.body.removeChild(textArea);
        }
    }

    // Modal controller
    /**
     * Creates an animated modal controller.
     * @param {HTMLElement|null} modal - Modal backdrop element.
     * @param {HTMLElement|null} card - Dialog card element.
     * @param {Object} [options] - Lifecycle hooks (onOpen, onClose).
     */
    function createModalController(modal, card, options = {}) {
        if (!modal || !card) {
            return {
                open: () => { },
                close: () => { },
                isOpen: () => false
            };
        }

        let isAnimating = false;

        function open(payload) {
            if (isAnimating) return;
            modal.classList.remove("hidden");
            modal.classList.add("flex");
            requestAnimationFrame(() => {
                card.classList.remove("scale-95", "opacity-0");
                card.classList.add("scale-100", "opacity-100");
            });
            document.body.classList.add("overflow-hidden");
            if (typeof options.onOpen === "function") {
                options.onOpen(payload);
            }
        }

        function close() {
            if (isAnimating || modal.classList.contains("hidden")) return;
            isAnimating = true;
            card.classList.remove("scale-100", "opacity-100");
            card.classList.add("scale-95", "opacity-0");
            setTimeout(() => {
                modal.classList.add("hidden");
                modal.classList.remove("flex");
                document.body.classList.remove("overflow-hidden");
                isAnimating = false;
                if (typeof options.onClose === "function") {
                    options.onClose();
                }
            }, 200);
        }

        function isOpen() {
            return !modal.classList.contains("hidden");
        }

        return { open, close, isOpen };
    }

    // Sidebar navigation
    const sidebar = document.getElementById("sidebar");
    const sidebarBackdrop = document.getElementById("sidebar-backdrop");
    const openSidebarBtn = document.getElementById("open-sidebar-btn");
    const closeSidebarBtn = document.getElementById("close-sidebar-btn");
    const collapseSidebarBtn = document.getElementById("collapse-sidebar-btn");

    function openSidebar() {
        if (!sidebar || !sidebarBackdrop) return;
        sidebar.classList.remove("-translate-x-full");
        sidebarBackdrop.classList.remove("hidden");
        requestAnimationFrame(() => {
            sidebarBackdrop.classList.add("opacity-100");
            sidebarBackdrop.classList.remove("opacity-0");
        });
        document.body.classList.add("overflow-hidden", "md:overflow-auto");
    }

    function closeSidebar() {
        if (!sidebar || !sidebarBackdrop) return;
        sidebar.classList.add("-translate-x-full");
        sidebarBackdrop.classList.remove("opacity-100");
        sidebarBackdrop.classList.add("opacity-0");
        setTimeout(() => {
            sidebarBackdrop.classList.add("hidden");
        }, 300);
        document.body.classList.remove("overflow-hidden", "md:overflow-auto");
    }

    if (openSidebarBtn) openSidebarBtn.addEventListener("click", openSidebar);
    if (closeSidebarBtn) closeSidebarBtn.addEventListener("click", closeSidebar);
    if (sidebarBackdrop) sidebarBackdrop.addEventListener("click", closeSidebar);

    let resizeTimer;
    window.addEventListener("resize", () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            if (window.innerWidth >= 768) {
                closeSidebar();
            }
        }, 100);
    });

    if (collapseSidebarBtn && sidebar) {
        collapseSidebarBtn.addEventListener("click", () => {
            const isCollapsed = sidebar.classList.toggle("collapsed");
            const icon = collapseSidebarBtn.querySelector("[data-lucide]");
            if (icon) {
                icon.setAttribute("data-lucide", isCollapsed ? "panel-left-open" : "panel-left-close");
                renderIcons(collapseSidebarBtn);
            }
        });
    }

    // View router
    const navSolve = document.getElementById("nav-solve");
    const navPractice = document.getElementById("nav-practice");
    const navSaved = document.getElementById("nav-saved");
    const navPricingBtn = document.getElementById("nav-pricing-btn");
    const sidebarPricingBtn = document.getElementById("sidebar-pricing-btn");
    const sidebarLoginBtn = document.getElementById("sidebar-login-btn");
    const footerPricingLink = document.getElementById("footer-pricing-link");
    const navHomeBtn = document.getElementById("nav-home-btn");

    const solvePage = document.getElementById("solve-page");
    const practicePage = document.getElementById("practice-test-page");
    const savedView = document.getElementById("saved-view");
    const pricingPage = document.getElementById("pricing-page");

    const allPages = [solvePage, practicePage, savedView, pricingPage];
    const mainNavLinks = [navSolve, navPractice, navSaved, sidebarPricingBtn];

    function showPage(pageToShow, activeNav) {
        allPages.forEach((p) => {
            if (p) p.classList.add("hidden");
        });
        mainNavLinks.forEach((n) => {
            if (n) n.classList.remove("active");
        });

        if (pageToShow) pageToShow.classList.remove("hidden");
        if (activeNav) activeNav.classList.add("active");

        if (navHomeBtn) {
            if (pageToShow === pricingPage) {
                navHomeBtn.classList.remove("hidden");
            } else {
                navHomeBtn.classList.add("hidden");
            }
        }

        window.scrollTo({ top: 0, behavior: "smooth" });
        if (window.innerWidth < 768) {
            closeSidebar();
        }
        updateBackToTopVisibility();
    }

    if (navSolve) navSolve.addEventListener("click", () => showPage(solvePage, navSolve));
    if (navPractice) navPractice.addEventListener("click", () => showPage(practicePage, navPractice));
    if (navSaved) navSaved.addEventListener("click", () => showPage(savedView, navSaved));
    if (navPricingBtn) navPricingBtn.addEventListener("click", () => showPage(pricingPage, sidebarPricingBtn));
    if (sidebarPricingBtn) sidebarPricingBtn.addEventListener("click", () => showPage(pricingPage, sidebarPricingBtn));
    if (footerPricingLink) footerPricingLink.addEventListener("click", () => showPage(pricingPage, sidebarPricingBtn));
    if (navHomeBtn) navHomeBtn.addEventListener("click", () => showPage(solvePage, navSolve));

    // Practice and test mode
    const btnPracticeMode = document.getElementById("btn-practice-mode");
    const btnTestMode = document.getElementById("btn-test-mode");

    if (btnPracticeMode && btnTestMode) {
        btnPracticeMode.addEventListener("click", () => {
            btnPracticeMode.classList.add("active");
            btnTestMode.classList.remove("active");
        });

        btnTestMode.addEventListener("click", () => {
            btnTestMode.classList.add("active");
            btnPracticeMode.classList.remove("active");
        });
    }

    const practiceQuestionsBtn = document.getElementById("practice-questions-btn");
    const practiceQuestionsMenu = document.getElementById("practice-questions-menu");
    const practiceQuestionsText = document.getElementById("practice-questions-text");
    const practiceQuestionsIcon = document.getElementById("practice-questions-icon");
    const practiceQuestionOpts = document.querySelectorAll(".practice-question-opt");

    function togglePracticeQuestionsMenu(show) {
        if (!practiceQuestionsMenu) return;
        const isHidden = practiceQuestionsMenu.classList.contains("hidden");
        const shouldShow = typeof show === "boolean" ? show : isHidden;

        if (shouldShow) {
            practiceQuestionsMenu.classList.remove("hidden");
            if (practiceQuestionsIcon) practiceQuestionsIcon.classList.add("rotate-180");
        } else {
            practiceQuestionsMenu.classList.add("hidden");
            if (practiceQuestionsIcon) practiceQuestionsIcon.classList.remove("rotate-180");
        }
    }

    if (practiceQuestionsBtn && practiceQuestionsMenu) {
        practiceQuestionsBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            togglePracticeQuestionsMenu();
        });

        practiceQuestionOpts.forEach((opt) => {
            opt.addEventListener("click", (e) => {
                e.stopPropagation();
                const selectedVal = opt.getAttribute("data-val") || opt.querySelector("span")?.textContent.trim();
                if (practiceQuestionsText && selectedVal) {
                    practiceQuestionsText.textContent = `# ${selectedVal}`;
                }

                practiceQuestionOpts.forEach((o) => {
                    o.classList.remove("active", "bg-blue-50/70", "dark:bg-blue-950/40", "font-semibold", "text-[var(--primary)]");
                    o.classList.add("font-medium", "text-slate-700", "dark:text-slate-200");
                    const chk = o.querySelector(".check-icon");
                    if (chk) chk.classList.add("opacity-0");
                });

                opt.classList.add("active", "bg-blue-50/70", "dark:bg-blue-950/40", "font-semibold", "text-[var(--primary)]");
                opt.classList.remove("text-slate-700", "dark:text-slate-200");
                const currentChk = opt.querySelector(".check-icon");
                if (currentChk) currentChk.classList.remove("opacity-0");

                togglePracticeQuestionsMenu(false);
            });
        });

        document.addEventListener("click", (e) => {
            if (practiceQuestionsMenu && !practiceQuestionsMenu.contains(e.target) && !practiceQuestionsBtn.contains(e.target)) {
                togglePracticeQuestionsMenu(false);
            }
        });
    }

    const practiceModeButtons = document.querySelectorAll(".practice-mode-toggle-btn");
    practiceModeButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
            practiceModeButtons.forEach((b) => {
                b.classList.remove("border-[var(--primary)]", "text-[var(--primary)]", "font-medium", "bg-[var(--light)]");
                b.classList.add("text-slate-500", "dark:text-slate-400", "hover:text-[var(--dark)]");
            });
            btn.classList.add("border-[var(--primary)]", "text-[var(--primary)]", "font-medium", "bg-[var(--light)]");
            btn.classList.remove("text-slate-500", "dark:text-slate-400");
        });
    });

    // Solve input controls
    const questionInput = document.getElementById("question-input");
    const mathInput = document.getElementById("math-input");
    const mathToggleBtn = document.getElementById("math-toggle-btn");
    const mathCloseBtn = document.getElementById("math-close-btn");
    const solveSubmitBtn = document.getElementById("solve-submit-btn");

    if (questionInput) {
        questionInput.addEventListener("input", function () {
            this.style.height = "auto";
            this.style.height = Math.min(this.scrollHeight, 200) + "px";
        });
    }

    if (solveSubmitBtn) {
        solveSubmitBtn.addEventListener("click", () => {
            const hasText = (questionInput && questionInput.value.trim().length > 0) ||
                (mathInput && mathInput.value && mathInput.value.trim().length > 0);
            if (!hasText) {
                if (mathInput && !mathInput.classList.contains("hidden")) {
                    mathInput.focus();
                } else if (questionInput) {
                    questionInput.focus();
                }
            }
        });
    }

    const solveModeButtons = document.querySelectorAll(".mode-toggle-btn");
    solveModeButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
            solveModeButtons.forEach((b) => {
                b.classList.remove("border-[var(--primary)]", "text-[var(--primary)]", "font-semibold", "bg-blue-50");
                b.classList.add("text-slate-500", "hover:text-slate-700");
            });
            btn.classList.add("border-[var(--primary)]", "text-[var(--primary)]", "font-semibold", "bg-blue-50");
            btn.classList.remove("text-slate-500", "hover:text-slate-700");
        });
    });

    const solveFocusBtn = document.getElementById("solve-focus-btn");
    const solveFocusMenu = document.getElementById("solve-focus-menu");
    const solveFocusText = document.getElementById("solve-focus-text");
    const solveFocusIcon = document.getElementById("solve-focus-icon");
    const solveFocusOpts = document.querySelectorAll(".solve-focus-opt");

    function toggleSolveFocusMenu(show) {
        if (!solveFocusMenu) return;
        const isHidden = solveFocusMenu.classList.contains("hidden");
        const shouldShow = typeof show === "boolean" ? show : isHidden;

        if (shouldShow) {
            solveFocusMenu.classList.remove("hidden");
            if (solveFocusIcon) solveFocusIcon.classList.add("rotate-180");
        } else {
            solveFocusMenu.classList.add("hidden");
            if (solveFocusIcon) solveFocusIcon.classList.remove("rotate-180");
        }
    }

    if (solveFocusBtn && solveFocusMenu) {
        solveFocusBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            toggleSolveFocusMenu();
        });

        solveFocusOpts.forEach((opt) => {
            opt.addEventListener("click", (e) => {
                e.stopPropagation();
                const selectedVal = opt.getAttribute("data-val") || opt.querySelector("span")?.textContent.trim();
                if (solveFocusText && selectedVal) {
                    solveFocusText.textContent = selectedVal;
                }

                solveFocusOpts.forEach((o) => {
                    o.classList.remove("active", "bg-blue-50/70", "dark:bg-blue-950/40", "font-semibold", "text-[var(--primary)]");
                    o.classList.add("font-medium", "text-slate-700", "dark:text-slate-200");
                    const chk = o.querySelector(".check-icon");
                    if (chk) chk.classList.add("opacity-0");
                });

                opt.classList.add("active", "bg-blue-50/70", "dark:bg-blue-950/40", "font-semibold", "text-[var(--primary)]");
                opt.classList.remove("text-slate-700", "dark:text-slate-200");
                const currentChk = opt.querySelector(".check-icon");
                if (currentChk) currentChk.classList.remove("opacity-0");

                toggleSolveFocusMenu(false);
            });
        });

        document.addEventListener("click", (e) => {
            if (solveFocusMenu && !solveFocusMenu.contains(e.target) && !solveFocusBtn.contains(e.target)) {
                toggleSolveFocusMenu(false);
            }
        });
    }

    // MathLive integration
    function setupMathLiveToggle(toggleBtn, closeBtn, mathField, textInput) {
        if (!toggleBtn || !mathField || !textInput) return;

        function showMathInput() {
            textInput.classList.add("hidden");
            mathField.classList.remove("hidden");
            if (closeBtn) closeBtn.classList.remove("hidden");
            mathField.focus();
            if (window.mathVirtualKeyboard) {
                window.mathVirtualKeyboard.show();
            }
        }

        function hideMathInput() {
            mathField.classList.add("hidden");
            if (closeBtn) closeBtn.classList.add("hidden");
            textInput.classList.remove("hidden");
            textInput.focus();
            if (window.mathVirtualKeyboard) {
                window.mathVirtualKeyboard.hide();
            }
        }

        toggleBtn.addEventListener("click", () => {
            const isHidden = mathField.classList.contains("hidden");
            if (isHidden) {
                showMathInput();
            } else {
                hideMathInput();
            }
        });

        if (closeBtn) {
            closeBtn.addEventListener("click", hideMathInput);
        }
    }

    setupMathLiveToggle(mathToggleBtn, mathCloseBtn, mathInput, questionInput);

    const practiceQuestionInput = document.getElementById("practice-question-input");
    const practiceMathToggleBtn = document.getElementById("practice-math-toggle-btn");
    const practiceMathInput = document.getElementById("practice-math-input");
    const practiceMathCloseBtn = document.getElementById("practice-math-close-btn");

    setupMathLiveToggle(practiceMathToggleBtn, practiceMathCloseBtn, practiceMathInput, practiceQuestionInput);

    // Saved content
    const btnSavedConv = document.getElementById("btn-saved-conv");
    const btnSavedQuest = document.getElementById("btn-saved-quest");
    const savedConvContent = document.getElementById("saved-conv-content");
    const savedQuestContent = document.getElementById("saved-quest-content");

    if (btnSavedConv && btnSavedQuest && savedConvContent && savedQuestContent) {
        btnSavedConv.addEventListener("click", () => {
            btnSavedConv.classList.add("active");
            btnSavedQuest.classList.remove("active");
            savedConvContent.classList.remove("hidden");
            savedQuestContent.classList.add("hidden");
        });

        btnSavedQuest.addEventListener("click", () => {
            btnSavedQuest.classList.add("active");
            btnSavedConv.classList.remove("active");
            savedQuestContent.classList.remove("hidden");
            savedConvContent.classList.add("hidden");
        });
    }

    // Practice use cases
    const useCaseTabs = document.querySelectorAll(".use-case-tab");
    const useCaseImage = document.getElementById("use-case-image");

    useCaseTabs.forEach((tab) => {
        tab.addEventListener("click", () => {
            useCaseTabs.forEach((t) => {
                t.classList.remove("border-[var(--primary)]");
                t.classList.add("border-transparent");
                const title = t.querySelector(".use-case-title");
                if (title) {
                    title.classList.remove("text-[var(--primary)]", "text-lg", "sm:text-xl");
                    title.classList.add("text-[var(--dark)]", "text-base", "sm:text-lg");
                }
                const content = t.querySelector(".use-case-content");
                if (content) content.classList.add("hidden");
            });

            tab.classList.remove("border-transparent");
            tab.classList.add("border-[var(--primary)]");
            const activeTitle = tab.querySelector(".use-case-title");
            if (activeTitle) {
                activeTitle.classList.remove("text-[var(--dark)]", "text-base", "sm:text-lg");
                activeTitle.classList.add("text-[var(--primary)]", "text-lg", "sm:text-xl");
            }
            const activeContent = tab.querySelector(".use-case-content");
            if (activeContent) activeContent.classList.remove("hidden");

            const imgSrc = tab.getAttribute("data-img");
            if (useCaseImage && imgSrc) {
                useCaseImage.src = imgSrc;
            }
        });
    });

    // Theme management
    const mobileThemeBtn = document.getElementById("mobile-theme-btn");
    const desktopThemeBtn = document.getElementById("desktop-theme-btn");

    function applyVirtualKeyboardTheme() {
        if (window.mathVirtualKeyboard) {
            const isDark = document.body.classList.contains("dark");
            window.mathVirtualKeyboard.theme = isDark ? "dark" : "light";
        }
    }

    function toggleTheme() {
        const isDark = document.body.classList.toggle("dark");
        [mobileThemeBtn, desktopThemeBtn].forEach((btn) => {
            if (btn) {
                const icon = btn.querySelector("[data-lucide]");
                if (icon) {
                    icon.setAttribute("data-lucide", isDark ? "moon" : "sun");
                    renderIcons(btn);
                }
            }
        });
        applyVirtualKeyboardTheme();
        const graphingView = document.getElementById("calc-graphing-view");
        if (graphingView && !graphingView.classList.contains("hidden") && typeof drawGraph === "function") {
            drawGraph();
        }
    }

    if (mobileThemeBtn) mobileThemeBtn.addEventListener("click", toggleTheme);
    if (desktopThemeBtn) desktopThemeBtn.addEventListener("click", toggleTheme);

    // Language selection
    const mobileLangBtn = document.getElementById("mobile-language-btn");
    const mobileLangMenu = document.getElementById("mobile-language-menu");
    const mobileLangText = document.getElementById("mobile-language-text");

    const desktopLangBtn = document.getElementById("desktop-language-btn");
    const desktopLangMenu = document.getElementById("desktop-language-menu");
    const desktopLangText = document.getElementById("desktop-language-text");

    function toggleLangMenu(menu) {
        if (menu) menu.classList.toggle("hidden");
    }

    if (mobileLangBtn) {
        mobileLangBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            toggleLangMenu(mobileLangMenu);
            if (desktopLangMenu) desktopLangMenu.classList.add("hidden");
        });
    }

    if (desktopLangBtn) {
        desktopLangBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            toggleLangMenu(desktopLangMenu);
            if (mobileLangMenu) mobileLangMenu.classList.add("hidden");
        });
    }

    function selectLanguage(languageName) {
        if (mobileLangText) mobileLangText.textContent = languageName;
        if (desktopLangText) desktopLangText.textContent = languageName;
        if (mobileLangMenu) mobileLangMenu.classList.add("hidden");
        if (desktopLangMenu) desktopLangMenu.classList.add("hidden");
    }

    if (mobileLangMenu) {
        mobileLangMenu.querySelectorAll("button").forEach((btn) => {
            btn.addEventListener("click", (e) => {
                e.stopPropagation();
                selectLanguage(btn.textContent.trim());
            });
        });
    }

    if (desktopLangMenu) {
        desktopLangMenu.querySelectorAll("button").forEach((btn) => {
            btn.addEventListener("click", (e) => {
                e.stopPropagation();
                selectLanguage(btn.textContent.trim());
            });
        });
    }

    document.addEventListener("click", () => {
        if (mobileLangMenu) mobileLangMenu.classList.add("hidden");
        if (desktopLangMenu) desktopLangMenu.classList.add("hidden");
    });

    // Authentication modal
    const loginBtn = document.getElementById("login-btn");
    const loginModal = document.getElementById("login-modal");
    const loginModalCard = document.getElementById("login-modal-card");
    const loginModalBackdrop = document.getElementById("login-modal-backdrop");
    const closeLoginModalBtn = document.getElementById("close-login-modal");

    const loginModalController = createModalController(loginModal, loginModalCard);

    if (loginBtn) loginBtn.addEventListener("click", () => loginModalController.open());
    if (sidebarLoginBtn) {
        sidebarLoginBtn.addEventListener("click", () => {
            closeSidebar();
            loginModalController.open();
        });
    }
    if (closeLoginModalBtn) closeLoginModalBtn.addEventListener("click", () => loginModalController.close());
    if (loginModalBackdrop) loginModalBackdrop.addEventListener("click", () => loginModalController.close());

    // Feedback and support
    const mobileHelpBtn = document.getElementById("mobile-help-btn");
    const desktopHelpBtn = document.getElementById("desktop-help-btn");
    const feedbackModal = document.getElementById("feedback-modal");
    const feedbackModalCard = document.getElementById("feedback-modal-card");
    const feedbackModalBackdrop = document.getElementById("feedback-modal-backdrop");
    const closeFeedbackModalBtn = document.getElementById("close-feedback-modal");

    const feedbackModalController = createModalController(feedbackModal, feedbackModalCard);

    if (mobileHelpBtn) mobileHelpBtn.addEventListener("click", () => feedbackModalController.open());
    if (desktopHelpBtn) desktopHelpBtn.addEventListener("click", () => feedbackModalController.open());
    if (closeFeedbackModalBtn) closeFeedbackModalBtn.addEventListener("click", () => feedbackModalController.close());
    if (feedbackModalBackdrop) feedbackModalBackdrop.addEventListener("click", () => feedbackModalController.close());

    const fileInput = document.getElementById("feedback-image-upload");
    const uploadTrigger = document.getElementById("feedback-upload-trigger");
    const uploadCountLabel = document.getElementById("feedback-upload-count");

    if (uploadTrigger && fileInput) {
        uploadTrigger.addEventListener("click", () => {
            fileInput.click();
        });

        fileInput.addEventListener("change", () => {
            let count = fileInput.files.length;
            if (count > 6) {
                alert("Maximum 6 images allowed.");
                fileInput.value = "";
                count = 0;
            }
            if (uploadCountLabel) {
                uploadCountLabel.textContent = `${count}/6`;
            }
        });
    }

    const copyEmailBtn = document.getElementById("copy-email-btn");
    const copiedBadge = document.getElementById("copied-badge");

    if (copyEmailBtn) {
        copyEmailBtn.addEventListener("click", () => {
            safeCopy("support@askmath.com", () => {
                if (copiedBadge) {
                    copiedBadge.classList.remove("hidden");
                    setTimeout(() => {
                        copiedBadge.classList.add("hidden");
                    }, 2000);
                }
            });
        });
    }

    const feedbackForm = document.getElementById("feedback-form");
    if (feedbackForm) {
        feedbackForm.addEventListener("submit", (e) => {
            e.preventDefault();
            alert("Thank you for your feedback!");
            feedbackModalController.close();
            feedbackForm.reset();
            if (uploadCountLabel) {
                uploadCountLabel.textContent = "0/6";
            }
        });
    }

    // Speech recognition
    const voiceRecordBtn = document.getElementById("voice-record-btn");
    const practiceVoiceRecordBtn = document.getElementById("practice-voice-record-btn");
    const voiceRecordModal = document.getElementById("voice-record-modal");
    const voiceRecordCard = document.getElementById("voice-record-card");
    const voiceRecordBackdrop = document.getElementById("voice-record-backdrop");
    const closeVoiceModalBtn = document.getElementById("close-voice-modal");
    const voiceCancelBtn = document.getElementById("voice-cancel-btn");
    const voiceInsertBtn = document.getElementById("voice-insert-btn");
    const voiceTimer = document.getElementById("voice-timer");
    const voiceTranscriptBox = document.getElementById("voice-transcript-box");
    const voiceStatusTitle = document.getElementById("voice-status-title");

    let voiceInterval = null;
    let voiceSeconds = 0;
    let speechRecognizer = null;
    let currentVoiceTarget = questionInput;

    const sampleVoicePhrases = [
        "x² + 5x + 6 = 0",
        "Find the derivative of f(x) = 3x² + 2x - 5",
        "\\int (2x + 3) dx",
        "Solve the system of equations 2x + y = 7 and x - y = 2",
        "Calculate the limit as x approaches 0 of sin(x)/x"
    ];

    function simulateVoiceSample() {
        setTimeout(() => {
            if (voiceModalController.isOpen()) {
                const randomPhrase = sampleVoicePhrases[Math.floor(Math.random() * sampleVoicePhrases.length)];
                if (voiceTranscriptBox) {
                    voiceTranscriptBox.textContent = `"${randomPhrase}"`;
                }
                if (voiceStatusTitle) {
                    voiceStatusTitle.textContent = "Math Problem Detected!";
                }
            }
        }, 1800);
    }

    const voiceModalController = createModalController(voiceRecordModal, voiceRecordCard, {
        onOpen: (targetInput) => {
            currentVoiceTarget = targetInput || questionInput;
            voiceSeconds = 0;
            if (voiceTimer) voiceTimer.textContent = "00:00";
            if (voiceStatusTitle) voiceStatusTitle.textContent = "Listening...";
            if (voiceTranscriptBox) voiceTranscriptBox.textContent = "Listening to your voice...";

            clearInterval(voiceInterval);
            voiceInterval = setInterval(() => {
                voiceSeconds++;
                const mins = String(Math.floor(voiceSeconds / 60)).padStart(2, '0');
                const secs = String(voiceSeconds % 60).padStart(2, '0');
                if (voiceTimer) voiceTimer.textContent = `${mins}:${secs}`;
            }, 1000);

            const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (SpeechRec) {
                try {
                    speechRecognizer = new SpeechRec();
                    speechRecognizer.continuous = true;
                    speechRecognizer.interimResults = true;
                    speechRecognizer.lang = "en-US";

                    speechRecognizer.onresult = (event) => {
                        let transcript = "";
                        for (let i = 0; i < event.results.length; i++) {
                            transcript += event.results[i][0].transcript;
                        }
                        if (voiceTranscriptBox && transcript) {
                            voiceTranscriptBox.textContent = `"${transcript}"`;
                        }
                    };

                    speechRecognizer.onerror = () => simulateVoiceSample();
                    speechRecognizer.start();
                } catch (e) {
                    simulateVoiceSample();
                }
            } else {
                simulateVoiceSample();
            }
        },
        onClose: () => {
            clearInterval(voiceInterval);
            voiceInterval = null;
            if (speechRecognizer) {
                try { speechRecognizer.stop(); } catch (e) { }
                speechRecognizer = null;
            }
        }
    });

    if (voiceRecordBtn) voiceRecordBtn.addEventListener("click", () => voiceModalController.open(questionInput));
    if (practiceVoiceRecordBtn) practiceVoiceRecordBtn.addEventListener("click", () => voiceModalController.open(practiceQuestionInput));
    if (closeVoiceModalBtn) closeVoiceModalBtn.addEventListener("click", () => voiceModalController.close());
    if (voiceCancelBtn) voiceCancelBtn.addEventListener("click", () => voiceModalController.close());
    if (voiceRecordBackdrop) voiceRecordBackdrop.addEventListener("click", () => voiceModalController.close());

    if (voiceInsertBtn) {
        voiceInsertBtn.addEventListener("click", () => {
            if (voiceTranscriptBox && currentVoiceTarget) {
                const text = voiceTranscriptBox.textContent.replace(/^"|"$/g, '').trim();
                if (text && text !== "Listening to your voice...") {
                    if (typeof currentVoiceTarget.setValue === "function") {
                        currentVoiceTarget.setValue(text);
                    } else {
                        currentVoiceTarget.value = text;
                        currentVoiceTarget.dispatchEvent(new Event("input"));
                    }
                }
            }
            voiceModalController.close();
        });
    }

    // Floating calculator
    const calcToggleBtn = document.getElementById("calculator-toggle-btn");
    const practiceCalcToggleBtn = document.getElementById("practice-calculator-toggle-btn");
    const floatingCalcModal = document.getElementById("floating-calc-modal");
    const floatingCalcCard = document.getElementById("floating-calc-card");
    const floatingCalcBackdrop = document.getElementById("floating-calc-backdrop");
    const closeFloatingCalcBtn = document.getElementById("close-floating-calc");
    const calcExpandBtn = document.getElementById("calc-expand-btn");

    const calcTabBasic = document.getElementById("calc-tab-basic");
    const calcTabGraphing = document.getElementById("calc-tab-graphing");
    const calcBasicView = document.getElementById("calc-basic-view");
    const calcGraphingView = document.getElementById("calc-graphing-view");

    const calcDisplay = document.getElementById("calc-display");
    const calcHistory = document.getElementById("calc-history");
    const calcInsertBtn = document.getElementById("calc-insert-btn");

    let currentCalcTarget = questionInput;

    const calcModalController = createModalController(floatingCalcModal, floatingCalcCard, {
        onOpen: (targetInput) => {
            currentCalcTarget = targetInput || questionInput;
        }
    });

    if (calcToggleBtn) calcToggleBtn.addEventListener("click", () => calcModalController.open(questionInput));
    if (practiceCalcToggleBtn) practiceCalcToggleBtn.addEventListener("click", () => calcModalController.open(practiceQuestionInput));
    if (closeFloatingCalcBtn) closeFloatingCalcBtn.addEventListener("click", () => calcModalController.close());
    if (floatingCalcBackdrop) floatingCalcBackdrop.addEventListener("click", () => calcModalController.close());

    if (calcExpandBtn && floatingCalcCard) {
        let isExpanded = false;
        calcExpandBtn.addEventListener("click", () => {
            isExpanded = !isExpanded;
            if (isExpanded) {
                floatingCalcCard.classList.remove("max-w-[340px]", "sm:max-w-[400px]");
                floatingCalcCard.classList.add("max-w-[500px]", "sm:max-w-[620px]");
            } else {
                floatingCalcCard.classList.remove("max-w-[500px]", "sm:max-w-[620px]");
                floatingCalcCard.classList.add("max-w-[340px]", "sm:max-w-[400px]");
            }
            if (calcGraphingView && !calcGraphingView.classList.contains("hidden")) {
                drawGraph();
            }
        });
    }

    if (calcTabBasic && calcTabGraphing && calcBasicView && calcGraphingView) {
        calcTabBasic.addEventListener("click", () => {
            calcTabBasic.classList.add("bg-[var(--white)]", "font-semibold", "text-[var(--dark)]", "shadow-xs");
            calcTabBasic.classList.remove("text-slate-600", "dark:text-slate-300");
            calcTabGraphing.classList.remove("bg-[var(--white)]", "font-semibold", "text-[var(--dark)]", "shadow-xs");
            calcTabGraphing.classList.add("text-slate-600", "dark:text-slate-300");

            calcBasicView.classList.remove("hidden");
            calcGraphingView.classList.add("hidden");
        });

        calcTabGraphing.addEventListener("click", () => {
            calcTabGraphing.classList.add("bg-[var(--white)]", "font-semibold", "text-[var(--dark)]", "shadow-xs");
            calcTabGraphing.classList.remove("text-slate-600", "dark:text-slate-300");
            calcTabBasic.classList.remove("bg-[var(--white)]", "font-semibold", "text-[var(--dark)]", "shadow-xs");
            calcTabBasic.classList.add("text-slate-600", "dark:text-slate-300");

            calcGraphingView.classList.remove("hidden");
            calcBasicView.classList.add("hidden");
            setTimeout(drawGraph, 50);
        });
    }

    // Arithmetic calculator
    let calcVal = "0";
    let calcPrev = null;
    let calcOp = null;
    let calcResetNext = false;

    function updateCalcDisplay() {
        if (calcDisplay) calcDisplay.textContent = calcVal;
        if (calcHistory) {
            const opSymbol = { '+': '+', '-': '−', '*': '×', '/': '÷', '^': '^' }[calcOp] || '';
            calcHistory.textContent = calcPrev !== null && calcOp ? `${calcPrev} ${opSymbol}` : '';
        }
    }

    function calculateResult(a, b, op) {
        const num1 = parseFloat(a);
        const num2 = parseFloat(b);
        if (isNaN(num1) || isNaN(num2)) return "0";
        switch (op) {
            case '+': return String(num1 + num2);
            case '-': return String(num1 - num2);
            case '*': return String(num1 * num2);
            case '/': return num2 === 0 ? "Error" : String(num1 / num2);
            case '^': return String(Math.pow(num1, num2));
            default: return b;
        }
    }

    document.querySelectorAll("[data-calc-num]").forEach((btn) => {
        btn.addEventListener("click", () => {
            const digit = btn.getAttribute("data-calc-num");
            if (calcResetNext) {
                calcVal = digit === "." ? "0." : digit;
                calcResetNext = false;
            } else {
                if (digit === "." && calcVal.includes(".")) return;
                if (calcVal === "0" && digit !== ".") {
                    calcVal = digit;
                } else {
                    calcVal += digit;
                }
            }
            updateCalcDisplay();
        });
    });

    document.querySelectorAll("[data-calc-op]").forEach((btn) => {
        btn.addEventListener("click", () => {
            const op = btn.getAttribute("data-calc-op");
            if (op === "clear") {
                calcVal = "0";
                calcPrev = null;
                calcOp = null;
                calcResetNext = false;
                if (calcHistory) calcHistory.textContent = "";
                updateCalcDisplay();
            } else if (op === "backspace") {
                if (!calcResetNext) {
                    calcVal = calcVal.slice(0, -1);
                    if (calcVal === "" || calcVal === "-") calcVal = "0";
                    updateCalcDisplay();
                }
            } else if (op === "negate") {
                calcVal = calcVal.startsWith("-") ? calcVal.slice(1) : (calcVal !== "0" ? "-" + calcVal : "0");
                updateCalcDisplay();
            } else if (op === "equals") {
                if (calcOp && calcPrev !== null) {
                    const res = calculateResult(calcPrev, calcVal, calcOp);
                    const opSymbol = { '+': '+', '-': '−', '*': '×', '/': '÷', '^': '^' }[calcOp] || '';
                    if (calcHistory) calcHistory.textContent = `${calcPrev} ${opSymbol} ${calcVal} =`;
                    calcVal = String(Number(parseFloat(res).toFixed(8)));
                    calcPrev = null;
                    calcOp = null;
                    calcResetNext = true;
                    if (calcDisplay) calcDisplay.textContent = calcVal;
                }
            } else {
                if (calcOp && calcPrev !== null && !calcResetNext) {
                    calcVal = String(Number(parseFloat(calculateResult(calcPrev, calcVal, calcOp)).toFixed(8)));
                }
                calcPrev = calcVal;
                calcOp = op;
                calcResetNext = true;
                updateCalcDisplay();
            }
        });
    });

    if (calcInsertBtn) {
        calcInsertBtn.addEventListener("click", () => {
            if (currentCalcTarget) {
                if (typeof currentCalcTarget.setValue === "function") {
                    currentCalcTarget.setValue(calcVal);
                } else {
                    const currentText = currentCalcTarget.value.trim();
                    currentCalcTarget.value = currentText ? `${currentText} ${calcVal}` : calcVal;
                    currentCalcTarget.dispatchEvent(new Event("input"));
                }
            }
            calcModalController.close();
        });
    }

    // Graphing calculator
    const graphCanvas = document.getElementById("graph-canvas");
    const graphExpressionInput = document.getElementById("graph-expression-input");
    const graphZoomIn = document.getElementById("graph-zoom-in");
    const graphZoomOut = document.getElementById("graph-zoom-out");
    const graphReset = document.getElementById("graph-reset");
    const graphPresets = document.querySelectorAll(".graph-preset-btn");

    const graphMenuBtn = document.getElementById("graph-menu-btn");
    const graphMenuPopover = document.getElementById("graph-menu-popover");
    const graphMenuClear = document.getElementById("graph-menu-clear");
    const graphMenuExport = document.getElementById("graph-menu-export");
    const graphMenuDownload = document.getElementById("graph-menu-download");
    const graphMenuPrint = document.getElementById("graph-menu-print");
    const graphMenuSettings = document.getElementById("graph-menu-settings");

    const graphSettingsBtn = document.getElementById("graph-settings-btn");
    const graphSettingsPanel = document.getElementById("graph-settings-panel");
    const graphSettingsClose = document.getElementById("graph-settings-close");
    const graphSettingsSave = document.getElementById("graph-settings-save");
    const graphSettingsRestore = document.getElementById("graph-settings-restore");

    const graphSettingLang = document.getElementById("graph-setting-lang");
    const graphSettingRounding = document.getElementById("graph-setting-rounding");
    const graphSettingLabeling = document.getElementById("graph-setting-labeling");
    const graphSettingFontsize = document.getElementById("graph-setting-fontsize");

    const graphUndoBtn = document.getElementById("graph-undo-btn");
    const graphRedoBtn = document.getElementById("graph-redo-btn");

    let graphScale = 32;
    let graphOffsetX = 0;
    let graphOffsetY = 0;
    let graphFontSize = 10;
    let graphRounding = "13";

    let graphHistory = [graphExpressionInput ? graphExpressionInput.value.trim() : "2 * sin(x)"];
    let graphHistoryIndex = 0;

    function pushGraphHistory(expr) {
        if (!expr) expr = "";
        if (graphHistory[graphHistoryIndex] === expr) return;
        graphHistory = graphHistory.slice(0, graphHistoryIndex + 1);
        graphHistory.push(expr);
        graphHistoryIndex = graphHistory.length - 1;
    }

    if (graphUndoBtn) {
        graphUndoBtn.addEventListener("click", () => {
            if (graphHistoryIndex > 0) {
                graphHistoryIndex--;
                if (graphExpressionInput) {
                    graphExpressionInput.value = graphHistory[graphHistoryIndex];
                    drawGraph();
                }
            }
        });
    }

    if (graphRedoBtn) {
        graphRedoBtn.addEventListener("click", () => {
            if (graphHistoryIndex < graphHistory.length - 1) {
                graphHistoryIndex++;
                if (graphExpressionInput) {
                    graphExpressionInput.value = graphHistory[graphHistoryIndex];
                    drawGraph();
                }
            }
        });
    }

    function openGraphMenu() {
        if (graphMenuPopover) {
            graphMenuPopover.classList.remove("hidden");
            if (graphSettingsPanel) graphSettingsPanel.classList.add("hidden");
        }
    }

    function closeGraphMenu() {
        if (graphMenuPopover) {
            graphMenuPopover.classList.add("hidden");
        }
    }

    if (graphMenuBtn) {
        graphMenuBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            if (graphMenuPopover && graphMenuPopover.classList.contains("hidden")) {
                openGraphMenu();
            } else {
                closeGraphMenu();
            }
        });
    }

    function openGraphSettings() {
        closeGraphMenu();
        if (graphSettingsPanel) {
            graphSettingsPanel.classList.remove("hidden");
            graphSettingsPanel.classList.add("flex");
        }
    }

    function closeGraphSettings() {
        if (graphSettingsPanel) {
            graphSettingsPanel.classList.add("hidden");
            graphSettingsPanel.classList.remove("flex");
        }
    }

    if (graphSettingsBtn) {
        graphSettingsBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            openGraphSettings();
        });
    }

    if (graphSettingsClose) graphSettingsClose.addEventListener("click", closeGraphSettings);
    if (graphMenuSettings) graphMenuSettings.addEventListener("click", openGraphSettings);

    if (graphMenuClear) {
        graphMenuClear.addEventListener("click", () => {
            if (graphExpressionInput) {
                graphExpressionInput.value = "";
                pushGraphHistory("");
            }
            graphScale = 32;
            graphOffsetX = 0;
            graphOffsetY = 0;
            closeGraphMenu();
            drawGraph();
        });
    }

    if (graphMenuExport) {
        graphMenuExport.addEventListener("click", () => {
            if (!graphCanvas) return;
            closeGraphMenu();
            const link = document.createElement("a");
            link.download = "AskMath-Graph.png";
            link.href = graphCanvas.toDataURL("image/png");
            link.click();
        });
    }

    if (graphMenuDownload) {
        graphMenuDownload.addEventListener("click", () => {
            if (!graphCanvas) return;
            closeGraphMenu();
            const expr = graphExpressionInput ? graphExpressionInput.value.trim() : "2 * sin(x)";
            const graphData = {
                expression: expr,
                scale: graphScale,
                rounding: graphRounding,
                fontSize: graphFontSize,
                exportedAt: new Date().toISOString()
            };
            const blob = new Blob([JSON.stringify(graphData, null, 2)], { type: "application/json" });
            const link = document.createElement("a");
            link.download = "AskMath-Graph-Data.json";
            link.href = URL.createObjectURL(blob);
            link.click();
        });
    }

    if (graphMenuPrint) {
        graphMenuPrint.addEventListener("click", () => {
            if (!graphCanvas) return;
            closeGraphMenu();
            const dataUrl = graphCanvas.toDataURL("image/png");
            const printWin = window.open("", "_blank");
            if (printWin) {
                printWin.document.write(`
                    <!DOCTYPE html>
                    <html>
                        <head>
                            <title>Print Graph - AskMath</title>
                            <style>
                                body { display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: sans-serif; margin: 24px; }
                                h2 { color: #2563EB; margin-bottom: 6px; }
                                p { color: #64748B; margin-bottom: 18px; font-size: 16px; }
                                img { max-width: 100%; border: 1px solid #E2E8F0; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
                            </style>
                        </head>
                        <body>
                            <h2>GeoGebra Graphing Calculator - AskMath</h2>
                            <p>f(x) = ${graphExpressionInput ? graphExpressionInput.value : ""}</p>
                            <img src="${dataUrl}" onload="window.print();window.close();" />
                        </body>
                    </html>
                `);
                printWin.document.close();
            }
        });
    }

    if (graphSettingsSave) {
        graphSettingsSave.addEventListener("click", () => {
            if (graphSettingFontsize) {
                const pt = parseInt(graphSettingFontsize.value, 10) || 16;
                graphFontSize = Math.max(9, Math.round((pt / 16) * 10));
            }
            if (graphSettingRounding) {
                graphRounding = graphSettingRounding.value;
            }
            drawGraph();
            closeGraphSettings();
        });
    }

    if (graphSettingsRestore) {
        graphSettingsRestore.addEventListener("click", () => {
            if (graphSettingLang) graphSettingLang.value = "en-US";
            if (graphSettingRounding) graphSettingRounding.value = "13";
            if (graphSettingLabeling) graphSettingLabeling.value = "all";
            if (graphSettingFontsize) graphSettingFontsize.value = "16";
            graphFontSize = 10;
            graphRounding = "13";
            drawGraph();
        });
    }

    const graphSettingsTabBtns = document.querySelectorAll(".graph-settings-tab-btn");
    const activeTabTitle = document.getElementById("graph-settings-active-tab-title");
    graphSettingsTabBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
            const tab = btn.getAttribute("data-tab");
            graphSettingsTabBtns.forEach((b) => {
                b.classList.remove("bg-slate-100", "dark:bg-slate-700", "text-teal-600", "dark:text-teal-400");
                b.classList.add("text-slate-400");
            });
            btn.classList.add("bg-slate-100", "dark:bg-slate-700", "text-teal-600", "dark:text-teal-400");
            btn.classList.remove("text-slate-400");
            if (activeTabTitle) {
                activeTabTitle.textContent = tab === "tools" ? "Tools" : tab === "grid" ? "Grid & Axes" : "Global";
            }
        });
    });

    document.addEventListener("click", (e) => {
        if (graphMenuPopover && !graphMenuPopover.contains(e.target) && graphMenuBtn && !graphMenuBtn.contains(e.target)) {
            closeGraphMenu();
        }
    });

    /**
     * Converts a mathematical expression into an executable JavaScript function.
     * @param {string} expr - Mathematical formula.
     * @returns {Function|null} Evaluation function or null on syntax error.
     */
    function compileMathExpression(expr) {
        if (!expr) return null;
        try {
            const jsExpr = expr
                .replace(/\^/g, '**')
                .replace(/\bsin\b/g, 'Math.sin')
                .replace(/\bcos\b/g, 'Math.cos')
                .replace(/\btan\b/g, 'Math.tan')
                .replace(/\bsqrt\b/g, 'Math.sqrt')
                .replace(/\babs\b/g, 'Math.abs')
                .replace(/\bln\b/g, 'Math.log')
                .replace(/\blog\b/g, 'Math.log10')
                .replace(/\bexp\b/g, 'Math.exp')
                .replace(/\bpi\b/gi, 'Math.PI')
                .replace(/\be\b/g, 'Math.E')
                .replace(/(\d+)\s*([a-zA-Z(])/g, '$1*$2');

            const fn = new Function('x', `with(Math) { return ${jsExpr}; }`);
            fn(1);
            return fn;
        } catch (e) {
            return null;
        }
    }

    let cachedGraphExpr = null;
    let cachedCompiledFn = null;

    /**
     * Retrieves or compiles the executable math function for the given expression.
     * @param {string} expr - Mathematical formula string.
     * @returns {Function|null}
     */
    function getCompiledGraphFn(expr) {
        if (expr === cachedGraphExpr) {
            return cachedCompiledFn;
        }
        cachedGraphExpr = expr;
        cachedCompiledFn = compileMathExpression(expr);
        return cachedCompiledFn;
    }

    function evaluateCompiledFn(fn, x) {
        try {
            const val = fn(x);
            return (typeof val === 'number' && !isNaN(val) && isFinite(val)) ? val : null;
        } catch (e) {
            return null;
        }
    }

    let graphRafId = null;

    function renderGraphCanvas() {
        if (!graphCanvas) return;
        const ctx = graphCanvas.getContext("2d");
        const rect = graphCanvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;

        graphCanvas.width = rect.width * dpr;
        graphCanvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);

        const width = rect.width;
        const height = rect.height;
        const originX = width / 2 + graphOffsetX;
        const originY = height / 2 + graphOffsetY;
        const isDark = document.body.classList.contains("dark");

        ctx.fillStyle = isDark ? "#0f172a" : "#ffffff";
        ctx.fillRect(0, 0, width, height);

        // Batched grid lines
        ctx.lineWidth = 1;
        ctx.strokeStyle = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
        ctx.beginPath();
        const step = graphScale;
        for (let x = originX % step; x < width; x += step) {
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
        }
        for (let y = originY % step; y < height; y += step) {
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
        }
        ctx.stroke();

        // Coordinate axes
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = isDark ? "#64748b" : "#94a3b8";
        ctx.fillStyle = isDark ? "#94a3b8" : "#64748b";
        ctx.font = `${graphFontSize}px sans-serif`;

        ctx.beginPath();
        ctx.moveTo(0, originY);
        ctx.lineTo(width, originY);
        ctx.moveTo(originX, 0);
        ctx.lineTo(originX, height);
        ctx.stroke();

        // Numeric tick labels
        for (let xUnit = -10; xUnit <= 10; xUnit++) {
            if (xUnit === 0) continue;
            const px = originX + xUnit * graphScale;
            if (px >= 0 && px <= width) {
                ctx.fillText(String(xUnit), px - 4, originY + 12);
            }
        }

        for (let yUnit = -10; yUnit <= 10; yUnit++) {
            if (yUnit === 0) continue;
            const py = originY - yUnit * graphScale;
            if (py >= 0 && py <= height) {
                ctx.fillText(String(yUnit), originX + 5, py + 3);
            }
        }

        // Plot function curve
        const expr = graphExpressionInput ? graphExpressionInput.value.trim() : "2 * sin(x)";
        const compiledFn = getCompiledGraphFn(expr);
        if (!compiledFn) return;

        ctx.lineWidth = 2.5;
        ctx.strokeStyle = "#6366f1";
        ctx.beginPath();

        let started = false;
        for (let px = 0; px <= width; px += 1.5) {
            const mathX = (px - originX) / graphScale;
            const mathY = evaluateCompiledFn(compiledFn, mathX);

            if (mathY !== null) {
                const py = originY - mathY * graphScale;
                if (py >= -100 && py <= height + 100) {
                    if (!started) {
                        ctx.moveTo(px, py);
                        started = true;
                    } else {
                        ctx.lineTo(px, py);
                    }
                } else {
                    started = false;
                }
            } else {
                started = false;
            }
        }
        ctx.stroke();
    }

    /**
     * Schedules a single graph redraw on the next animation frame.
     * Batches multiple rapid calls into one render pass.
     */
    function drawGraph() {
        if (graphRafId !== null) return;
        graphRafId = requestAnimationFrame(() => {
            graphRafId = null;
            renderGraphCanvas();
        });
    }

    if (graphExpressionInput) {
        let debounceTimer;
        graphExpressionInput.addEventListener("input", () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                pushGraphHistory(graphExpressionInput.value.trim());
            }, 400);
            drawGraph();
        });
    }

    if (graphZoomIn) {
        graphZoomIn.addEventListener("click", () => {
            graphScale = Math.min(graphScale * 1.25, 120);
            drawGraph();
        });
    }

    if (graphZoomOut) {
        graphZoomOut.addEventListener("click", () => {
            graphScale = Math.max(graphScale / 1.25, 12);
            drawGraph();
        });
    }

    if (graphReset) {
        graphReset.addEventListener("click", () => {
            graphScale = 32;
            graphOffsetX = 0;
            graphOffsetY = 0;
            drawGraph();
        });
    }

    graphPresets.forEach((btn) => {
        btn.addEventListener("click", () => {
            const preset = btn.getAttribute("data-preset");
            if (preset && graphExpressionInput) {
                graphExpressionInput.value = preset;
                pushGraphHistory(preset);
                drawGraph();
            }
        });
    });

    // Back to top navigation
    const backToTopBtn = document.getElementById("back-to-top");

    function updateBackToTopVisibility() {
        if (!backToTopBtn) return;
        const isSolveActive = solvePage && !solvePage.classList.contains("hidden");
        const isPracticeActive = practicePage && !practicePage.classList.contains("hidden");

        if ((isSolveActive || isPracticeActive) && window.scrollY > 300) {
            backToTopBtn.classList.remove("hidden");
            backToTopBtn.classList.add("flex");
        } else {
            backToTopBtn.classList.add("hidden");
            backToTopBtn.classList.remove("flex");
        }
    }

    window.addEventListener("scroll", updateBackToTopVisibility, { passive: true });

    if (backToTopBtn) {
        backToTopBtn.addEventListener("click", () => {
            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });
        });
    }

    // Global keyboard shortcuts
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            if (loginModalController.isOpen()) loginModalController.close();
            if (feedbackModalController.isOpen()) feedbackModalController.close();
            if (calcModalController.isOpen()) calcModalController.close();
            if (voiceModalController.isOpen()) voiceModalController.close();
            closeGraphMenu();
            closeGraphSettings();
        }
    });

    // MathJax rendering
    window.typesetMath = function () {
        if (window.MathJax && typeof window.MathJax.typesetPromise === "function") {
            window.MathJax.typesetPromise().catch((err) => console.warn("MathJax typesetting notice:", err));
        }
    };

    window.addEventListener("load", () => {
        window.typesetMath();
    });
});
