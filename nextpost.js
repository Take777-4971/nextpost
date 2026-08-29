javascript:(function () {
    const inputTime = prompt("送信したい時刻を入力してください（例: 15:30 や 15:30:00）", "18:00");
    if (inputTime === null) return;

    const parts = inputTime.split(':').map(Number);
    if (parts.length < 2 || parts.some(isNaN)) {
        alert("時刻の形式が正しくありません。「15:30」のように入力してください。");
        return;
    }

    const now = new Date();
    const target = new Date();
    target.setHours(parts[0], parts[1], parts[2] || 0, 0);

    if (target.getTime() <= now.getTime()) {
        target.setDate(target.getDate() + 1);
    }

    const diffMs = target.getTime() - now.getTime();

    /* 右上のカウントダウンバッジ作成 */
    const badge = document.createElement("div");
    badge.style.position = "fixed";
    badge.style.top = "20px";
    badge.style.right = "20px";
    badge.style.zIndex = "999999";
    badge.style.backgroundColor = "rgba(0, 0, 0, 0.85)";
    badge.style.color = "#ffffff";
    badge.style.padding = "10px 14px";
    badge.style.borderRadius = "8px";
    badge.style.fontFamily = "sans-serif";
    badge.style.fontSize = "13px";
    badge.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.3)";
    badge.style.display = "flex";
    badge.style.alignItems = "center";
    badge.style.gap = "10px";

    const textSpan = document.createElement("span");
    badge.appendChild(textSpan);

    const cancelBtn = document.createElement("button");
    cancelBtn.innerText = "キャンセル";
    cancelBtn.style.backgroundColor = "#ff4d4f";
    cancelBtn.style.color = "#ffffff";
    cancelBtn.style.border = "none";
    cancelBtn.style.padding = "4px 8px";
    cancelBtn.style.borderRadius = "4px";
    cancelBtn.style.cursor = "pointer";
    cancelBtn.style.fontSize = "12px";
    cancelBtn.style.fontWeight = "bold";
    badge.appendChild(cancelBtn);

    document.body.appendChild(badge);

    let sendTimeoutId = null;
    let timerIntervalId = null;

    cancelBtn.addEventListener("click", () => {
        if (sendTimeoutId) clearTimeout(sendTimeoutId);
        if (timerIntervalId) clearInterval(timerIntervalId);
        textSpan.innerText = "✕ 予約送信をキャンセルしました";
        cancelBtn.remove();
        setTimeout(() => badge.remove(), 2500);
    });

    timerIntervalId = setInterval(() => {
        const remainingMs = target.getTime() - new Date().getTime();
        if (remainingMs <= 0) {
            clearInterval(timerIntervalId);
            textSpan.innerText = "送信処理中...";
            cancelBtn.remove();
            return;
        }
        const totalSec = Math.floor(remainingMs / 1000);
        const h = String(Math.floor(totalSec / 3600)).padStart(2, "0");
        const m = String(Math.floor((totalSec % 3600) / 60)).padStart(2, "0");
        const s = String(totalSec % 60).padStart(2, "0");
        
        textSpan.innerText = `⏱ ${target.toLocaleTimeString()} 送信予定 (残り ${h}:${m}:${s})`;
    }, 1000);

    function clickButton(btn) {
        try {
            btn.focus();
            btn.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true }));
            btn.dispatchEvent(new MouseEvent("mouseup", { bubbles: true, cancelable: true }));
            btn.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
            return true;
        } catch (e) {
            return false;
        }
    }

    function findSendButton() {
        /* まず入力エリア（テキストボックス）を特定する */
        const editors = Array.from(document.querySelectorAll('[contenteditable="true"], textarea, div[role="textbox"]'));
        /* 画面上に表示されているメインの入力エリアを抽出 */
        const activeEditor = editors.find(e => e.offsetParent !== null && !e.closest('nav') && !e.closest('aside'));

        if (activeEditor) {
            /* 入力欄の周囲（祖先要素）から送信ボタンを探すことで、サイドバーの誤検知を完全に防ぐ */
            let container = activeEditor.parentElement;
            for (let i = 0; i < 5; i++) {
                if (!container) break;
                
                /* Claude / Gemini / ChatGPT 用セレクタ */
                const btn = container.querySelector(
                    'button[aria-label*="Send"]' +
                    ', button[aria-label*="送信"]' +
                    ', button[data-testid="send-button"]' +
                    ', button.send-button' +
                    ', button[type="submit"]'
                );

                if (btn && !btn.disabled && btn.offsetParent !== null) {
                    return { button: btn, editor: activeEditor };
                }
                container = container.parentElement;
            }
        }

        return { button: null, editor: activeEditor };
    }

    sendTimeoutId = setTimeout(() => {
        clearInterval(timerIntervalId);
        cancelBtn.remove();

        const { button, editor } = findSendButton();

        /* 1. 送信ボタンが見つかった場合 */
        if (button && clickButton(button)) {
            console.log("ボタンクリックで送信");
            textSpan.innerText = "✓ 送信完了";
            setTimeout(() => badge.remove(), 3000);
            return;
        }

        /* 2. ボタンが見つからない・押せない場合、入力欄でEnter疑似操作 */
        if (editor) {
            editor.focus();
            const eventOpts = { key: "Enter", code: "Enter", keyCode: 13, which: 13, bubbles: true, cancelable: true };
            editor.dispatchEvent(new KeyboardEvent("keydown", eventOpts));
            editor.dispatchEvent(new KeyboardEvent("keyup", eventOpts));
            console.log("Enterキーで送信試行");
            textSpan.innerText = "✓ 送信完了";
            setTimeout(() => badge.remove(), 3000);
            return;
        }

        alert("送信先（入力欄または送信ボタン）が見つかりませんでした。");
        badge.remove();
    }, diffMs);
})();
