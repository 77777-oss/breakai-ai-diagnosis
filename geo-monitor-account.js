/* Secure purchaser portal; token held only in memory. No cookies/localStorage. */
(function () {
  "use strict";
  const AUTH = "https://yqzxoiogkylgbmaftesv.supabase.co/auth/v1";
  const EDGE = "https://yqzxoiogkylgbmaftesv.supabase.co/functions/v1/geo-monitor-buyer";
  const ANON = "sb_publishable_ryCsnRG0MhzP9sT7OIGrgg_yJQwSpJA";
  let accessToken = "";
  let expiryAt = 0;
  let orders = [];
  const byId = id => document.getElementById(id);
  const status = (message, error=false) => {
    const target = byId("login-status");
    target.textContent = message;
    target.className = error ? "status error" : "status";
  };
  const safeLink = url => {
    if (typeof url !== "string" || url.length > 1000) return false;
    try {
      const p = new URL(url);
      return p.protocol === "https:" &&
        p.hostname === "docs.google.com" && p.pathname.startsWith("/document/d/");
    } catch { return false; }
  };
  function logout(message = "ログアウトしました。認証情報はこの画面から破棄されました。") {
    accessToken = "";
    expiryAt = 0;
    orders = [];
    byId("logout").hidden = true;
    byId("orders-panel").hidden = true;
    byId("order-list").replaceChildren();
    status(message);
  }
  const jwtValidLocally = () => accessToken !== "" && Date.now() + 15000 < expiryAt;
  async function buyerApi(body) {
    if (!jwtValidLocally()) {
      logout("認証の有効期間が終了しました。メールリンクからログインし直してください。");
      throw new Error("LOGIN_REQUIRED");
    }
    const res = await fetch(EDGE, {
      method:"POST",
      headers:{"Content-Type":"application/json","apikey":ANON,"Authorization":"Bearer "+accessToken},
      cache:"no-store",
      body:JSON.stringify(body),
    });
    const payload=await res.json().catch(()=>({error:"INVALID_SERVER_REPLY"}));
    if (!res.ok) {
      if (res.status === 401) logout("認証期限切れです。メールリンクから再ログインしてください。");
      throw new Error(payload.error || "認証済みAPIとの通信に失敗しました。");
    }
    return payload;
  }
  function fmt(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "日付不明" : date.toLocaleDateString("ja-JP", { year:"numeric",month:"2-digit",day:"2-digit" });
  }
  function addText(parent,name,text,klass) {
    const node = document.createElement(name);
    if (klass) node.className = klass;
    node.textContent = text;
    parent.appendChild(node);
    return node;
  }
  function render(knownOrders) {
    orders=knownOrders;
    const list=byId("order-list");
    list.replaceChildren();
    byId("orders-panel").hidden = false;
    if (!orders.length) {
      byId("orders-status").textContent="このメールで確認できる支払済みのGEO注文はありません。別の購入時メールをお確かめください。";
      return;
    }
    byId("orders-status").textContent=orders.length+"件の購入済みGEO注文を確認しました。継続監視・月額課金はまだ開始されていません。";
    orders.forEach(order => {
      const box=document.createElement("article");
      box.className="buyer-order";
      addText(box,"h3","GEO診断 / "+fmt(order.recorded_at));
      addText(box,"p","対象サイト: "+String(order.website||"確認中"),"small");
      addText(box,"p","納品状況: "+String(order.fulfillment_status||"確認中"),"small");
      if(order.delivery_doc_url && safeLink(order.delivery_doc_url) && order.fulfillment_status==="delivered") {
        const anchor=document.createElement("a");
        anchor.href=order.delivery_doc_url;
        anchor.rel="noopener noreferrer";anchor.target="_blank";
        anchor.textContent="納品済みレポートを見る ↗";
        box.appendChild(anchor);
      }
      const monitorLabel=document.createElement("label");
      monitorLabel.className="check-row";
      const monitor=document.createElement("input");
      monitor.type="checkbox";monitor.checked=order.monitoring_requested === true;
      monitorLabel.append(monitor,document.createTextNode(" 継続監視の案内・開始手続きを希望する（まだ課金・測定は開始しません）"));
      box.appendChild(monitorLabel);
      const benchLabel=document.createElement("label");
      benchLabel.className="check-row";
      const benchmark=document.createElement("input");
      benchmark.type="checkbox";benchmark.checked=order.benchmark_consent === true;
      benchLabel.append(benchmark,document.createTextNode(" 将来の匿名ベンチマーク集計への利用に別途同意する"));
      box.appendChild(benchLabel);
      monitor.addEventListener("change",()=>{
        if(!monitor.checked){benchmark.checked=false;benchmark.disabled=true;}
        else benchmark.disabled=false;
      });
      benchmark.disabled=!monitor.checked;
      addText(box,"p","両方のチェックを外して「設定を保存」すると停止希望を記録します。正式な契約や購入データの削除ではありません。","small");
      const save=document.createElement("button");
      save.type="button";save.className="primary";
      save.textContent="設定を保存";
      const result=addText(box,"p","","status");
      save.addEventListener("click",async()=>{
        save.disabled=true;result.textContent="本人確認と保存を実行中…";
        try {
          const updated=await buyerApi({
            action:"set-consent",order_id:order.order_id,
            monitoring_requested:monitor.checked,
            benchmark_consent:benchmark.checked,
          });
          order.monitoring_requested=updated.monitoring_requested;
          order.benchmark_consent=updated.benchmark_consent;
          result.textContent=updated.status==="UNCHANGED"?
            "設定に変更はありません。自動課金・再観測は停止中です。" :
            "設定を記録しました。自動課金・再観測は停止中です。";
        }catch {
          result.textContent="保存できませんでした。画面を再読み込みして状態を確認してください。";
        }finally{save.disabled=false;}
      });
      box.appendChild(save);
      list.appendChild(box);
    });
  }
  async function load() {
    try {
      status("認証済みの購入履歴を照合しています…");
      const result=await buyerApi({action:"orders"});
      if(result.status!=="VERIFIED_PURCHASER")throw new Error("ORDER_LOOKUP_FAILED");
      render(result.orders || []);
      byId("logout").hidden=false;
      status("メール本人確認が完了しました。");
    }catch(error) {
      if(error.message!=="LOGIN_REQUIRED")status("本人確認または注文照合に失敗しました。時間をおいて再試行してください。",true);
    }
  }
  function handleReturn() {
    const hash=location.hash.slice(1);
    const params=new URLSearchParams(hash);
    const token=params.get("access_token");
    const type=params.get("token_type");
    const ttl=Number(params.get("expires_in"));
    const searchParams = new URLSearchParams(location.search);
    const authError=params.get("error_description") || searchParams.get("error_description");
    const oauthCode = searchParams.get("code");
    if(hash || location.search)history.replaceState(null,"",location.pathname);
    if(authError){status("認証に失敗しました。メール内のリンクをもう一度お確かめください。",true);return;}
    if(typeof token==="string" && token.length>=40 && type==="bearer" && Number.isFinite(ttl) && ttl>0 && ttl<=86400) {
      accessToken=token;
      expiryAt=Date.now()+ttl*1000;
      load();
    } else if (oauthCode) {
      status("認証リンクの方式が対応外です。運営者へご連絡ください。",true);
    }
  }
  byId("send-login").addEventListener("click",async()=>{
    const input=byId("customer-email");
    const email=input.value.trim().toLowerCase();
    if(!input.validity.valid || !email.includes("@") || email.length>254) {
      status("有効なメールアドレスを入力してください。",true);return;
    }
    const button=byId("send-login");
    button.disabled=true;
    status("認証リンクを申請しています…");
    try {
      const redirect=location.origin+location.pathname;
      const response=await fetch(AUTH+"/otp?redirect_to="+encodeURIComponent(redirect),{
        method:"POST",cache:"no-store",
        headers:{"apikey":ANON,"Content-Type":"application/json"},
        body:JSON.stringify({email,create_user:true}),
      });
      if(!response.ok)throw new Error("MAILER_NOT_READY");
      status("認証メールを申請しました。届いたメール内のリンクを開いてください（購入情報の表示には別途照合が必要です）。");
    }catch{
      status("認証メールを送れませんでした。認証サービスの設定または送信制限を確認してください。",true);
    }finally{
      button.disabled=false;
    }
  });
  byId("logout").addEventListener("click",()=>logout());
  handleReturn();
})();
