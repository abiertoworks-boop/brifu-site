/* =========================================================
   Brifu — お問い合わせフォーム
   Sends to info@brifu.co.jp through FormSubmit (same service as EQ Gate),
   with an automatic reply to the sender. ?subject=... pre-fills the title.
   ========================================================= */
(function () {
  'use strict';
  const MAIL_TO = 'info@brifu.co.jp';
  const ENDPOINT = 'https://formsubmit.co/ajax/' + MAIL_TO;

  const form = document.getElementById('contactForm');
  if (!form) return;
  const f = (n) => form.elements.namedItem(n); // not form.name / form.title, which are the form's own properties
  const err = document.getElementById('cformErr');
  const done = document.getElementById('cformDone');
  const subj = new URLSearchParams(location.search).get('subject');
  if (subj) f('title').value = subj;

  const fail = (msg) => { err.textContent = msg; err.hidden = false; };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    err.hidden = true;
    const name = f('name').value.trim(), email = f('email').value.trim();
    const title = f('title').value.trim(), message = f('message').value.trim();
    if (!name || !email || !title || !message) return fail('未入力の項目があります。すべての項目をご入力ください。');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail('メールアドレスの形式をご確認ください。');
    if (!f('agree').checked) return fail('内容をご確認の上、チェックを付けてください。');

    const btn = form.querySelector('.cform__send');
    btn.disabled = true;
    const body = {
      'お名前': name, 'メールアドレス': email, 'お問い合わせタイトル': title, 'お問い合わせ内容': message,
      _replyto: email,
      _subject: '【Brifu お問い合わせ】' + title + '｜' + name + '様',
      _template: 'table', _captcha: 'false',
      _autoresponse: name + '様\n\n株式会社Brifuへお問い合わせいただき、ありがとうございます。\n以下の内容で受け付けました。担当者より折り返しご連絡いたします。\n\n' +
        '■お問い合わせタイトル\n' + title + '\n\n■お問い合わせ内容\n' + message + '\n\n株式会社Brifu\ninfo@brifu.co.jp'
    };
    fetch(ENDPOINT, { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json', Accept: 'application/json' } })
      .then((r) => r.json())
      .then((res) => {
        if (String(res.success) !== 'true') throw new Error(res.message || 'failed');
        form.hidden = true; done.hidden = false;
        window.scrollTo({ top: done.getBoundingClientRect().top + window.scrollY - 140, behavior: 'smooth' });
      })
      .catch(() => { btn.disabled = false; fail('送信できませんでした。時間をおいて再度お試しいただくか、info@brifu.co.jp へ直接メールでご連絡ください。'); });
  });
})();
