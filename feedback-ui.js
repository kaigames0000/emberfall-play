const feedbackCategories = {
  bug: '遊戲異常',
  balance: '戰鬥與平衡',
  controls: '操作與介面',
  performance: '效能',
  save: '角色與存檔',
  other: '其他'
};
const feedbackContextFields = [
  ['version', '遊戲版本'], ['device', '裝置'], ['chapter', '章節'], ['difficulty', '難度']
];
const maxFeedbackLength = 1000;
let feedbackPanelCount = 0;

function formatFeedback({ category, message, context }) {
  const lines = ['裂界遺火玩家回報', '分類　' + feedbackCategories[category]];
  for (const [key, label] of feedbackContextFields) {
    if (context?.[key]) lines.push(label + '　' + context[key]);
  }
  return [...lines, '', message, ''].join('\n');
}

// The host supplies coarse context labels and rejects sendReport on failure.
export function createFeedbackPanel({ getContext = () => ({}), canSend = () => false, sendReport } = {}) {
  const id = 'feedback-' + (++feedbackPanelCount);
  const form = document.createElement('form');
  form.className = 'feedback-panel';
  form.noValidate = true;
  form.innerHTML = `
    <fieldset class="feedback-fields">
      <label class="feedback-field feedback-category">回報分類
        <select name="category" required>
          <option value="">請選擇分類</option>
          ${Object.entries(feedbackCategories).map(([key, label]) => `<option value="${key}">${label}</option>`).join('')}
        </select>
      </label>
      <label class="feedback-field feedback-description">回報內容
        <textarea name="message" rows="4" maxlength="${maxFeedbackLength}" required aria-describedby="${id}-help"></textarea>
      </label>
      <div class="feedback-guidance">
        <small id="${id}-help">若能重現，請記下操作步驟。請勿填寫帳號、密碼或個人資料。</small>
        <span data-feedback-length aria-hidden="true"></span>
      </div>
      <div class="feedback-context">
        <label class="feedback-consent"><input name="includeContext" type="checkbox"> 附上以下遊戲資訊</label>
        <dl>${feedbackContextFields.map(([key, label]) => `<div><dt>${label}</dt><dd data-feedback-context="${key}"></dd></div>`).join('')}</dl>
      </div>
    </fieldset>
    <div class="feedback-actions">
      <button class="gold-btn" type="submit" hidden>送出回報</button>
      <button class="text-btn" type="button" data-feedback-copy>複製文字</button>
      <button class="text-btn" type="button" data-feedback-download>下載文字檔</button>
    </div>
    <p class="feedback-availability" data-feedback-availability></p>
    <p class="feedback-status" role="status"></p>
    <label class="feedback-field" data-feedback-manual hidden>回報文字
      <textarea rows="4" readonly></textarea>
    </label>`;

  const win = form.ownerDocument.defaultView;
  const fields = form.querySelector('.feedback-fields');
  const category = form.elements.namedItem('category');
  const message = form.elements.namedItem('message');
  const consent = form.elements.namedItem('includeContext');
  const count = form.querySelector('[data-feedback-length]');
  const send = form.querySelector('[type="submit"]');
  const availability = form.querySelector('[data-feedback-availability]');
  const status = form.querySelector('[role="status"]');
  const manual = form.querySelector('[data-feedback-manual]');
  const manualText = manual.querySelector('textarea');
  let context = {};
  let sending = false;

  function refreshAvailability() {
    const authorized = typeof sendReport === 'function' && canSend();
    const online = win.navigator.onLine !== false;
    send.hidden = !authorized;
    send.disabled = sending || !online;
    if (!online) availability.textContent = '目前離線，可複製或下載回報。';
    else if (authorized) availability.textContent = '';
    else if (typeof sendReport === 'function') availability.textContent = '登入後可線上送出。也可以先複製或下載回報。';
    else availability.textContent = '可複製或下載回報，稍後分享。';
    return authorized && online;
  }

  function refresh() {
    const values = getContext();
    context = {};
    for (const [key] of feedbackContextFields) {
      const node = form.querySelector(`[data-feedback-context="${key}"]`);
      const value = values?.[key];
      const preview = typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, 80) : '';
      node.textContent = preview || '未提供';
      if (preview) context[key] = preview;
    }
    refreshAvailability();
  }

  function updateDraft() {
    count.textContent = message.value.length + ' / ' + maxFeedbackLength;
    status.textContent = '';
    category.removeAttribute('aria-invalid');
    message.removeAttribute('aria-invalid');
    manual.hidden = true;
    manualText.value = '';
  }

  function readReport() {
    const text = message.value.trim();
    let invalid = null;
    if (!Object.hasOwn(feedbackCategories, category.value)) {
      invalid = category;
      status.textContent = '請選擇回報分類。';
    } else if (!text || message.value.length > maxFeedbackLength) {
      invalid = message;
      status.textContent = `請填寫回報內容，最多 ${maxFeedbackLength} 字。`;
    }
    if (invalid) {
      invalid.setAttribute('aria-invalid', 'true');
      invalid.focus();
      return null;
    }
    const report = { category: category.value, message: text };
    if (consent.checked && Object.keys(context).length) report.context = { ...context };
    return report;
  }

  function showManualCopy(text) {
    manual.hidden = false;
    manualText.value = text;
    manualText.focus();
    manualText.select();
    status.textContent = '請手動複製已選取的回報文字。';
  }

  form.addEventListener('input', updateDraft);
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (sending || !refreshAvailability()) return;
    const report = readReport();
    if (!report) return;

    sending = true;
    fields.disabled = true;
    send.disabled = true;
    status.textContent = '正在送出回報…';
    try {
      await sendReport(report);
      form.reset();
      updateDraft();
      status.textContent = '已送出回報，感謝你的協助。';
    } catch {
      status.textContent = '目前無法送出，請重試或複製、下載回報。';
    } finally {
      sending = false;
      fields.disabled = false;
      refreshAvailability();
    }
  });

  form.querySelector('[data-feedback-copy]').addEventListener('click', async () => {
    const report = readReport();
    if (!report) return;
    const text = formatFeedback(report);
    try {
      await win.navigator.clipboard.writeText(text);
      status.textContent = '已複製回報。';
    } catch {
      showManualCopy(text);
    }
  });

  form.querySelector('[data-feedback-download]').addEventListener('click', () => {
    const report = readReport();
    if (!report) return;
    const text = formatFeedback(report);
    try {
      const url = win.URL.createObjectURL(new win.Blob([text], { type: 'text/plain;charset=utf-8' }));
      win.setTimeout(() => win.URL.revokeObjectURL(url), 1000);
      const link = form.ownerDocument.createElement('a');
      link.href = url;
      link.download = 'emberfall-feedback.txt';
      link.hidden = true;
      form.append(link);
      try { link.click(); } finally { link.remove(); }
      status.textContent = '已準備下載回報。';
    } catch {
      showManualCopy(text);
    }
  });

  updateDraft();
  refresh();
  return { element: form, refresh };
}
