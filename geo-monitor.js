/* GEO local comparison. No fetch, cookies, storage, SDK, billing or telemetry. */
(function (root) {
  "use strict";
  var NAMES = ["openai", "gemini", "perplexity"];
  var ALLOWED = [
    "schema_version", "subject_id", "cohort", "source_kind", "consent_ref_key",
    "snapshot_id", "question_set_key", "captured_at", "capture_started_at",
    "locale", "region", "providers", "observations",
    "category_questions_per_provider", "brand_questions_per_provider"
  ];
  var PROVIDER_ALLOWED = [
    "model", "retrieval_mode", "category_mentions", "brand_mentions", "site_citations"
  ];
  function fail(message) { throw new Error(message); }
  function object(value) { return value !== null && typeof value === "object" && !Array.isArray(value); }
  function isExactKeys(value, keys) {
    return Object.keys(value).every(function (key) { return keys.indexOf(key) !== -1; });
  }
  function count(value, max) { return Number.isInteger(value) && value >= 0 && value <= max; }
  function hashValue(value, prefix) {
    return typeof value === "string" && new RegExp("^" + prefix + "[a-f0-9]{32}$").test(value);
  }
  function timestamp(value) {
    return typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d\d:\d\d)$/.test(value)
      && Number.isFinite(Date.parse(value));
  }
  function normalizeSnapshot(raw) {
    if (!object(raw) || !isExactKeys(raw, ALLOWED)) fail("匿名化済みの監視スナップショット以外は読み込めません。");
    if (raw.schema_version !== "BREAKAI_GEO_MONITOR_SNAPSHOT_V1") fail("観測ファイルの形式が異なります。");
    if (!hashValue(raw.subject_id, "gm_") || !hashValue(raw.snapshot_id, "gs_") || !hashValue(raw.question_set_key, "gq_")) fail("匿名識別子が無効です。");
    if (["B2B_IT", "SAAS", "PROFESSIONAL", "HR", "MARKETING", "OTHER"].indexOf(raw.cohort) < 0) fail("業種区分が無効です。");
    if (["FIRST_PARTY", "OPTED_IN_CUSTOMER", "CUSTOMER_PORTABLE"].indexOf(raw.source_kind) < 0) fail("観測データの種別が不明です。");
    if (raw.source_kind === "OPTED_IN_CUSTOMER" && !(typeof raw.consent_ref_key === "string" && /^[a-f0-9]{24}$/.test(raw.consent_ref_key))) fail("同意参照情報がありません。");
    if ((raw.source_kind === "FIRST_PARTY" || raw.source_kind === "CUSTOMER_PORTABLE") && raw.consent_ref_key !== "") fail("観測の同意参照情報が不正です。");
    if (!timestamp(raw.captured_at) || !timestamp(raw.capture_started_at) || Date.parse(raw.captured_at) < Date.parse(raw.capture_started_at) || Date.parse(raw.captured_at) - Date.parse(raw.capture_started_at) > 181 * 60 * 1000) fail("観測時刻が無効です。");
    if (!/^[a-z]{2}(?:-[A-Z]{2})?$/.test(raw.locale) || !/^[A-Z]{2}$/.test(raw.region)) fail("言語・地域情報が無効です。");
    if (raw.observations !== 36 || raw.category_questions_per_provider !== 8 || raw.brand_questions_per_provider !== 4) fail("3AI×12問＝36観測のファイルが必要です。");
    if (!object(raw.providers) || Object.keys(raw.providers).length !== 3 || !NAMES.every(function (name) { return Object.prototype.hasOwnProperty.call(raw.providers, name); })) fail("3種類のAIの結果が揃っていません。");
    var p = {};
    NAMES.forEach(function (name) {
      var row = raw.providers[name];
      if (!object(row) || !isExactKeys(row, PROVIDER_ALLOWED)) fail(name + " の情報に未知の項目があります。");
      if (!(typeof row.model === "string" && row.model.length > 0 && row.model.length < 101 && typeof row.retrieval_mode === "string" && row.retrieval_mode.length > 0 && row.retrieval_mode.length < 101)) fail(name + " のモデル情報が無効です。");
      if (!count(row.category_mentions, 8) || !count(row.brand_mentions, 4) || !count(row.site_citations, 12)) fail(name + " の件数が無効です。");
      p[name] = {
        model: row.model,
        retrieval_mode: row.retrieval_mode,
        category_mentions: row.category_mentions,
        brand_mentions: row.brand_mentions,
        site_citations: row.site_citations
      };
    });
    return {
      subject_id: raw.subject_id, snapshot_id: raw.snapshot_id, question_set_key: raw.question_set_key,
      captured_at: raw.captured_at, locale: raw.locale, region: raw.region, cohort: raw.cohort,
      providers: p
    };
  }
  function compare(previous, current) {
    var before = normalizeSnapshot(previous);
    var after = normalizeSnapshot(current);
    if (before.subject_id !== after.subject_id) return { status: "DIFFERENT_COMPANY", message: "対象企業が異なります。同一企業の2ファイルを指定してください。" };
    if (before.snapshot_id === after.snapshot_id || Date.parse(before.captured_at) >= Date.parse(after.captured_at)) return { status: "ORDER_INVALID", message: "前回より後の観測ファイルを「今回」に指定してください。" };
    if (before.cohort !== after.cohort) return { status: "COHORT_CHANGED", message: "業種分類が変わったため、今回は新しい基準値として扱ってください。" };
    if (before.question_set_key !== after.question_set_key) return { status: "QUESTION_CHANGED", message: "12問の質問群が異なるため、この2回を直接比較できません。" };
    if (before.locale !== after.locale || before.region !== after.region) return { status: "REGION_CHANGED", message: "言語または地域が異なるため、直接比較できません。" };
    var mismatched = NAMES.some(function (name) {
      return before.providers[name].model !== after.providers[name].model
        || before.providers[name].retrieval_mode !== after.providers[name].retrieval_mode;
    });
    if (mismatched) return { status: "MODEL_CHANGED", message: "AIモデルまたは検索方式が変わったため、今回は新しい基準値として扱ってください。" };
    var metrics = {};
    NAMES.forEach(function (name) {
      metrics[name] = {};
      ["category_mentions", "brand_mentions", "site_citations"].forEach(function (metric) {
        var prior = before.providers[name][metric];
        var latest = after.providers[name][metric];
        metrics[name][metric] = { previous: prior, current: latest, delta: latest - prior };
      });
    });
    return { status: "COMPARABLE", previous_at: before.captured_at, current_at: after.captured_at, metrics: metrics };
  }
  function demoRecords() {
    var digest = "a".repeat(32);
    var q = "b".repeat(32);
    function snapshot(i, time, numbers) {
      var providers = {};
      NAMES.forEach(function (name, idx) {
        providers[name] = {
          model: name + "-demo-model", retrieval_mode: "web_search",
          category_mentions: numbers[idx][0], brand_mentions: numbers[idx][1], site_citations: numbers[idx][2]
        };
      });
      return {
        schema_version: "BREAKAI_GEO_MONITOR_SNAPSHOT_V1",
        subject_id: "gm_" + digest, snapshot_id: "gs_" + String(i).repeat(32), question_set_key: "gq_" + q,
        cohort: "B2B_IT", source_kind: "FIRST_PARTY", consent_ref_key: "",
        captured_at: time, capture_started_at: time,
        locale: "ja-JP", region: "JP", providers: providers, observations: 36,
        category_questions_per_provider: 8, brand_questions_per_provider: 4
      };
    }
    return [
      snapshot(1, "2026-09-01T12:00:00Z", [[0, 4, 4], [0, 4, 0], [0, 4, 4]]),
      snapshot(2, "2026-10-01T12:00:00Z", [[2, 4, 5], [1, 4, 1], [1, 4, 5]])
    ];
  }
  var publicApi = { normalizeSnapshot: normalizeSnapshot, compare: compare, demoRecords: demoRecords };
  if (typeof module !== "undefined" && module.exports) module.exports = publicApi;
  if (!root.document) return;
  var doc = root.document;
  function byId(id) { return doc.getElementById(id); }
  var consent = byId("local-consent"), previous = byId("previous-file"), current = byId("current-file");
  if (!consent || !previous || !current) return;
  var previousData = null, currentData = null, lastReport = null, lastIsDemo = false;
  var msg = byId("message"), state = byId("comparison-state"), cards = byId("metric-cards");
  function showMessage(content, error) { msg.textContent = content; msg.className = error ? "status error" : "status"; }
  function dropAll(revoke) {
    previousData = currentData = lastReport = null;
    lastIsDemo = false;
    previous.value = "";
    current.value = "";
    byId("previous-label").textContent = "ファイルを選択";
    byId("current-label").textContent = "ファイルを選択";
    byId("results").hidden = true;
    cards.textContent = "";
    if (revoke) consent.checked = false;
    var enabled = consent.checked;
    previous.disabled = current.disabled = !enabled;
    byId("compare").disabled = !enabled;
    byId("demo").disabled = !enabled;
    byId("consent-status").textContent = enabled ? "端末内での比較を許可中" : "未許可・データ未読込";
    showMessage(enabled ? "比較ファイルを選択してください。未読込データは保持しません。" : "利用に同意するとファイルを選択できます。", false);
  }
  consent.addEventListener("change", function () { dropAll(false); });
  byId("clear-data").addEventListener("click", function () { dropAll(true); showMessage("許可を取り消し、読み込んだデータをこの画面から破棄しました。", false); });
  function loadInput(input, previousFlag, labelId) {
    if (!consent.checked) return;
    var file = input.files && input.files[0];
    if (!file) return;
    if (file.size > 200000 || !/\.json$/i.test(file.name)) { showMessage("200KB以内のJSONファイルを選んでください。", true); input.value = ""; return; }
    file.text().then(function (text) {
      if (!consent.checked || !(input.files && input.files[0] === file)) return;
      var parsed = JSON.parse(text);
      normalizeSnapshot(parsed);
      if (previousFlag) previousData = parsed;
      else currentData = parsed;
      lastReport = null;
      byId("results").hidden = true;
      byId(labelId).textContent = file.name;
      showMessage("読み込みが完了しました。実測データの真正性はファイル発行元でも確認してください。", false);
    }).catch(function () {
      if (previousFlag) previousData = null;
      else currentData = null;
      byId(labelId).textContent = "ファイルを選択";
      input.value = "";
      byId("results").hidden = true;
      showMessage("匿名化36観測のJSONだけを受け付けます。個人情報を含むファイルは読み込まないでください。", true);
    });
  }
  previous.addEventListener("change", function () { loadInput(previous, true, "previous-label"); });
  current.addEventListener("change", function () { loadInput(current, false, "current-label"); });
  function metricText(row) {
    var sign = row.delta > 0 ? "+" : "";
    return row.current + "/"+ (this.max || 12) + " (" + sign + row.delta + ")";
  }
  function render(report, demo) {
    lastReport = report.status === "COMPARABLE" ? report : null;
    lastIsDemo = demo;
    byId("results").hidden = false;
    cards.textContent = "";
    byId("download-result").hidden = !lastReport;
    if (!lastReport) {
      state.className = "result-state warning";
      state.textContent = report.message;
      byId("result-dates").textContent = "";
      byId("result-note").textContent = "未比較：条件が異なるものを改善実績として扱いません。";
      byId("results").scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    state.className = "result-state";
    state.textContent = demo ? "サンプル表示です。これは顧客の実測結果ではありません。" : "比較可能な条件を確認しました（ファイルの真正性は未検証）。";
    function date(value) { return new Date(value).toLocaleDateString("ja-JP", { year:"numeric", month:"2-digit", day:"2-digit", timeZone:"UTC" }); }
    byId("result-dates").textContent = date(report.previous_at) + " → " + date(report.current_at);
    var labels = { category_mentions:["カテゴリ言及",8], brand_mentions:["社名指定言及",4], site_citations:["自社サイト引用",12] };
    NAMES.forEach(function (name) {
      var article = doc.createElement("article");
      article.className = "metric";
      var title = doc.createElement("h3");
      title.textContent = name === "openai" ? "OpenAI" : name === "gemini" ? "Gemini" : "Perplexity";
      article.appendChild(title);
      var dl = doc.createElement("dl");
      Object.keys(labels).forEach(function (key) {
        var detail = report.metrics[name][key];
        var row = doc.createElement("div");
        var dtEl = doc.createElement("dt");
        dtEl.textContent = labels[key][0];
        var dd = doc.createElement("dd");
        var delta = detail.delta > 0 ? "+" + detail.delta : "" + detail.delta;
        dd.textContent = detail.previous + " → " + detail.current + " / " + labels[key][1] + " (" + delta + ")";
        if (detail.delta > 0) dd.className = "positive";
        if (detail.delta < 0) dd.className = "negative";
        row.appendChild(dtEl);
        row.appendChild(dd);
        dl.appendChild(row);
      });
      article.appendChild(dl);
      cards.appendChild(article);
    });
    byId("result-note").textContent = "言及・引用の回数差分です。順位・推薦・改善効果や売上の増加を保証しません。"
      + (demo ? " サンプル数値であり、実測の証拠ではありません。" : " アップロードファイルの真正性は、この画面では証明できません。");
    byId("results").scrollIntoView({ behavior: "smooth", block: "start" });
  }
  byId("compare").addEventListener("click", function () {
    if (!consent.checked) return;
    if (!previousData || !currentData) { showMessage("前回・今回の2つのファイルを選択してください。", true); return; }
    try { render(compare(previousData, currentData), false); showMessage("条件を検査しました。", false); }
    catch (error) { byId("results").hidden = true; showMessage(error.message || "比較に失敗しました。", true); }
  });
  byId("demo").addEventListener("click", function () {
    if (!consent.checked) return;
    previousData = currentData = null;
    previous.value = current.value = "";
    byId("previous-label").textContent = byId("current-label").textContent = "ファイル未選択（サンプルのみ表示）";
    var demo = demoRecords();
    render(compare(demo[0], demo[1]), true);
    showMessage("サンプルを表示中です。実測データではありません。", false);
  });
  byId("download-result").addEventListener("click", function () {
    if (!consent.checked || !lastReport) return;
    var result = lastReport;
    var text = "BreakAI GEO / ローカル観測比較\n" + (lastIsDemo ? "サンプル結果（実測ではありません）\n" : "アップロードデータによる比較（発行元検証は未実施）\n")
      + "前回: " + result.previous_at + "\n今回: " + result.current_at + "\n";
    NAMES.forEach(function (name) {
      text += "\n" + name + "\n";
      ["category_mentions", "brand_mentions", "site_citations"].forEach(function (field) {
        var r = result.metrics[name][field];
        text += field + ": " + r.previous + " -> " + r.current + " (" + (r.delta >= 0 ? "+" : "") + r.delta + ")\n";
      });
    });
    text += "\n取得時点の言及・引用数の差分であり、順位・改善効果を保証しません。";
    var url = root.URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
    var a = doc.createElement("a");
    a.href = url;
    a.download = "geo-monitor-comparison.txt";
    doc.body.appendChild(a);
    a.click();
    a.remove();
    root.setTimeout(function () { root.URL.revokeObjectURL(url); }, 1000);
  });
  dropAll(false);
})(typeof globalThis !== "undefined" ? globalThis : this);
