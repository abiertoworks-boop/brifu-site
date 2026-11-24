/* =========================================================
   Brifu — お問い合わせフォーム
   info@brifu.co.jp へ FormSubmit 経由で送信し、送信者へ自動返信します。
   URL パラメータ：
     ?type=academy|humanity|eqtm|nexus|corecard|other … お問い合わせ種別を選択
       （旧リンク互換：business→nexus、shop→corecard、media→other）
     ?topic=no2|nexus|corecard|bulk|academy|humanity|eqtm … タイトルを入力
     ?subject=...                               … タイトルを直接入力（旧リンク互換）
   ========================================================= */
(function () {
  'use strict';
  var MAIL_TO = 'info@brifu.co.jp';
  var ENDPOINT = 'https://formsubmit.co/ajax/' + MAIL_TO;

  var TOPICS = {
    no2: { type: 'nexus', title: 'No.2・右腕人材育成のご相談' },
    nexus: { type: 'nexus', title: 'EQ Business Nexus のご相談' },
    corecard: { type: 'corecard', title: 'EQコアカード 体験会・研修のご相談' },
    bulk: { type: 'corecard', title: 'EQコアカード・書籍のまとめ購入について' },
    academy: { type: 'academy', title: 'EQ Academy（講座・認定）について' },
    humanity: { type: 'humanity', title: 'EQ Humanity（EQプロ育成コース）について' },
    eqtm: { type: 'eqtm', title: 'EQTM について' }
  };
  // 以前の種別名で作られたリンクも、そのまま使えるようにする
  var LEGACY = { business: 'nexus', shop: 'corecard', media: 'other' };

  var form = document.getElementById('contactForm');
  if (!form) return;
  var f = function (n) { return form.elements.namedItem(n); }; // form.name / form.title は form 自身のプロパティなので使わない
  var err = document.getElementById('formError');
  var done = document.getElementById('formDone');

  var params = new URLSearchParams(location.search);
  var topic = TOPICS[params.get('topic')];
  var type = params.get('type') || (topic && topic.type);
  if (type && LEGACY[type]) type = LEGACY[type];
  if (type && f('type').querySelector('option[value="' + type + '"]')) f('type').value = type;
  if (topic) f('title').value = topic.title;
  if (params.get('subject')) f('title').value = params.get('subject');

  var fail = function (msg) {
    err.textContent = msg;
    err.hidden = false;
    err.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    err.hidden = true;
    var typeSel = f('type');
    var name = f('name').value.trim();
    var org = f('org').value.trim();
    var email = f('email').value.trim();
    var tel = f('tel').value.trim();
    var title = f('title').value.trim();
    var message = f('message').value.trim();
    if (!typeSel.value) return fail('お問い合わせ種別を選択してください。');
    if (!name || !email || !title || !message) return fail('未入力の必須項目があります。ご確認ください。');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail('メールアドレスの形式をご確認ください。');
    if (!f('agree').checked) return fail('プライバシーポリシーをご確認のうえ、チェックを付けてください。');

    var typeLabel = typeSel.options[typeSel.selectedIndex].text;
    var btn = form.querySelector('.form-submit');
    btn.disabled = true;
    var body = {
      'お問い合わせ種別': typeLabel,
      'お名前': name,
      '会社・団体名': org || '（未入力）',
      'メールアドレス': email,
      '電話番号': tel || '（未入力）',
      'お問い合わせタイトル': title,
      'お問い合わせ内容': message,
      _replyto: email,
      _subject: '【Brifu お問い合わせ／' + typeLabel + '】' + title + '｜' + name + '様',
      _template: 'table',
      _captcha: 'false',
      _autoresponse: name + '様\n\n株式会社Brifuへお問い合わせいただき、ありがとうございます。\n以下の内容で受け付けました。担当者より折り返しご連絡いたします。\n\n' +
        '■お問い合わせ種別\n' + typeLabel + '\n\n■お問い合わせタイトル\n' + title + '\n\n■お問い合わせ内容\n' + message + '\n\n株式会社Brifu\ninfo@brifu.co.jp'
    };
    fetch(ENDPOINT, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' }
    })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (String(res.success) !== 'true') throw new Error(res.message || 'failed');
        form.hidden = true;
        done.hidden = false;
        done.scrollIntoView({ behavior: 'smooth', block: 'center' });
      })
      .catch(function () {
        btn.disabled = false;
        fail('送信できませんでした。時間をおいて再度お試しいただくか、info@brifu.co.jp へ直接メールでご連絡ください。');
      });
  });
})();
