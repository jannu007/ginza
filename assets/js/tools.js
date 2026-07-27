(() => {
  "use strict";

  function el(tag, props = {}, children = []) {
    const node = document.createElement(tag);
    Object.entries(props).forEach(([k, v]) => {
      if (k === "class") node.className = v;
      else if (k === "html") node.innerHTML = v;
      else node.setAttribute(k, v);
    });
    children.forEach((c) => node.appendChild(c));
    return node;
  }

  /* ==========================================================================
     壱: AI秘書 — Priority Scheduler
     ========================================================================== */
  (() => {
    const container = document.getElementById("secretary-rows");
    let rowId = 0;

    function addRow(name = "", importance = "中", time = "") {
      rowId++;
      const row = el("div", { class: "repeat-row", id: "sec-row-" + rowId });
      const nameInput = el("input", { type: "text", placeholder: "タスク名（例：請求書発行）" });
      nameInput.value = name;
      const impSelect = el("select", {});
      ["高", "中", "低"].forEach((v) => {
        const o = el("option", {}, []);
        o.value = v; o.textContent = "重要度：" + v;
        if (v === importance) o.selected = true;
        impSelect.appendChild(o);
      });
      const timeInput = el("input", { type: "time" });
      timeInput.value = time;
      const removeBtn = el("button", { class: "row-remove", type: "button" }, []);
      removeBtn.textContent = "×";
      removeBtn.addEventListener("click", () => row.remove());
      row.append(nameInput, impSelect, timeInput, removeBtn);
      container.appendChild(row);
    }

    addRow("請求書の発行", "高", "");
    addRow("取引先へのメール返信", "中", "");
    addRow("来月の企画資料の下書き", "低", "");

    document.getElementById("secretary-add").addEventListener("click", () => addRow());

    document.getElementById("secretary-run").addEventListener("click", () => {
      const rows = Array.from(container.querySelectorAll(".repeat-row"));
      const weight = { 高: 3, 中: 2, 低: 1 };
      const duration = { 高: 60, 中: 45, 低: 30 };
      const tasks = rows
        .map((row) => {
          const [nameInput, impSelect, timeInput] = row.querySelectorAll("input, select");
          return {
            name: nameInput.value.trim(),
            importance: impSelect.value,
            deadline: timeInput.value,
          };
        })
        .filter((t) => t.name);

      tasks.sort((a, b) => {
        if (weight[b.importance] !== weight[a.importance]) return weight[b.importance] - weight[a.importance];
        if (a.deadline && b.deadline) return a.deadline.localeCompare(b.deadline);
        if (a.deadline) return -1;
        if (b.deadline) return 1;
        return 0;
      });

      let cursorMinutes = 9 * 60;
      const output = document.getElementById("secretary-output");
      output.innerHTML = "";
      if (!tasks.length) {
        output.appendChild(el("li", {}, [document.createTextNode("タスクを入力してください")]));
      }
      tasks.forEach((t, i) => {
        const start = cursorMinutes;
        const dur = duration[t.importance];
        cursorMinutes += dur;
        const fmt = (m) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
        const li = el("li", {});
        li.appendChild(el("span", { class: "rank" }, [document.createTextNode(String(i + 1))]));
        li.appendChild(document.createTextNode(`${fmt(start)}–${fmt(cursorMinutes)}　${t.name}`));
        const badge = el("span", { class: "badge" }, [document.createTextNode("重要度" + t.importance)]);
        li.appendChild(badge);
        if (t.deadline) li.appendChild(el("span", { class: "badge" }, [document.createTextNode("締切" + t.deadline)]));
        output.appendChild(li);
      });
      document.getElementById("secretary-result").classList.add("show");
    });
  })();

  /* ==========================================================================
     弐: AI経理アシスタント — Expense Settlement
     ========================================================================== */
  (() => {
    const container = document.getElementById("accounting-rows");
    const categories = ["交通費", "接待交際費", "消耗品費", "会議費", "通信費", "その他"];

    function addRow(name = "", category = "その他", amount = "") {
      const row = el("div", { class: "repeat-row" });
      const nameInput = el("input", { type: "text", placeholder: "品目（例：タクシー代）" });
      nameInput.value = name;
      const catSelect = el("select", {});
      categories.forEach((c) => {
        const o = el("option", {}, []);
        o.value = c; o.textContent = c;
        if (c === category) o.selected = true;
        catSelect.appendChild(o);
      });
      const amountInput = el("input", { type: "number", min: "0", placeholder: "金額" });
      amountInput.value = amount;
      const removeBtn = el("button", { class: "row-remove", type: "button" }, []);
      removeBtn.textContent = "×";
      removeBtn.addEventListener("click", () => row.remove());
      row.append(nameInput, catSelect, amountInput, removeBtn);
      container.appendChild(row);
    }

    addRow("取引先訪問の電車代", "交通費", "1200");
    addRow("接待の飲食代", "接待交際費", "18000");

    document.getElementById("accounting-add").addEventListener("click", () => addRow());

    document.getElementById("accounting-run").addEventListener("click", () => {
      const mode = document.getElementById("acc-mode").value;
      const rows = Array.from(container.querySelectorAll(".repeat-row"));
      const catTotals = {};
      let grandTotal = 0, grandTax = 0, grandPreTax = 0, count = 0;

      rows.forEach((row) => {
        const [nameInput, catSelect, amountInput] = row.querySelectorAll("input, select");
        const amount = parseFloat(amountInput.value);
        if (!nameInput.value.trim() || !amount || amount <= 0) return;
        count++;
        let total, tax, preTax;
        if (mode === "ex") {
          preTax = amount;
          tax = Math.round(preTax * 0.1);
          total = preTax + tax;
        } else {
          total = amount;
          preTax = Math.round(total / 1.1);
          tax = total - preTax;
        }
        grandTotal += total;
        grandTax += tax;
        grandPreTax += preTax;
        catTotals[catSelect.value] = (catTotals[catSelect.value] || 0) + total;
      });

      const summary = document.getElementById("accounting-summary");
      summary.innerHTML = "";
      const chips = [
        ["合計（税込）", "¥" + grandTotal.toLocaleString()],
        ["うち消費税", "¥" + grandTax.toLocaleString()],
        ["税抜合計", "¥" + grandPreTax.toLocaleString()],
        ["品目数", count + " 件"],
      ];
      chips.forEach(([label, val]) => {
        summary.appendChild(
          el("div", { class: "summary-chip" }, [
            el("p", { class: "n" }, [document.createTextNode(val)]),
            el("p", { class: "l" }, [document.createTextNode(label)]),
          ])
        );
      });

      const catBox = document.getElementById("accounting-categories");
      catBox.innerHTML = "";
      Object.entries(catTotals)
        .sort((a, b) => b[1] - a[1])
        .forEach(([cat, sum]) => {
          catBox.appendChild(el("span", { class: "tag" }, [document.createTextNode(`${cat}：¥${sum.toLocaleString()}`)]));
        });

      document.getElementById("accounting-result").classList.add("show");
    });
  })();

  /* ==========================================================================
     参: AI採用サポーター — Job Posting Generator
     ========================================================================== */
  (() => {
    document.getElementById("recruit-run").addEventListener("click", () => {
      const role = document.getElementById("rec-role").value.trim() || "スタッフ";
      const style = document.getElementById("rec-style").value;
      const employment = document.getElementById("rec-employment").value;
      const must = document.getElementById("rec-must").value.split(",").map((s) => s.trim()).filter(Boolean);
      const nice = document.getElementById("rec-nice").value.split(",").map((s) => s.trim()).filter(Boolean);
      const pr = document.getElementById("rec-pr").value.trim();

      const lines = [];
      lines.push(`【${role} 求人】`);
      lines.push("");
      lines.push(`■ 募集職種`);
      lines.push(`${role}`);
      lines.push("");
      lines.push(`■ 雇用形態・働き方`);
      lines.push(`${employment} ／ ${style}`);
      lines.push("");
      lines.push(`■ 必須スキル・経験`);
      lines.push(must.length ? must.map((m) => "・" + m).join("\n") : "・特になし（意欲重視）");
      lines.push("");
      lines.push(`■ 歓迎スキル・経験`);
      lines.push(nice.length ? nice.map((m) => "・" + m).join("\n") : "・特にありません");
      lines.push("");
      lines.push(`■ 勤務地`);
      lines.push("東京都中央区・銀座四丁目オフィス（" + (style === "フルリモート" ? "リモート勤務可" : "オフィス出社あり") + "）");
      lines.push("");
      lines.push(`■ この仕事の魅力`);
      lines.push(pr || `少人数のオフィスで裁量を持って働ける、${role}のポジションです。`);
      lines.push("");
      lines.push("ご興味のある方は、まずはお気軽にお問い合わせください。");

      document.getElementById("recruit-output").value = lines.join("\n");
      document.getElementById("recruit-result").classList.add("show");
    });
  })();

  /* ==========================================================================
     肆: AI議事録メーカー — Minutes Auto-Formatter
     ========================================================================== */
  (() => {
    document.getElementById("minutes-run").addEventListener("click", () => {
      const title = document.getElementById("min-title").value.trim() || "無題の会議";
      const date = document.getElementById("min-date").value.trim() || "未記入";
      const attendees = document.getElementById("min-attendees").value.trim() || "未記入";
      const notes = document.getElementById("min-notes").value.split("\n").map((s) => s.trim()).filter(Boolean);

      const decisions = [], todos = [], discussion = [];
      notes.forEach((line) => {
        if (/^(決定|決定事項)[:：]/.test(line)) decisions.push(line.replace(/^(決定|決定事項)[:：]/, "").trim());
        else if (/^(TODO|todo|対応|アクション)[:：]/.test(line)) todos.push(line.replace(/^(TODO|todo|対応|アクション)[:：]/, "").trim());
        else discussion.push(line);
      });

      const out = [];
      out.push(`議事録：${title}`);
      out.push(`日時：${date}`);
      out.push(`参加者：${attendees}`);
      out.push("");
      out.push("■ 議論内容");
      out.push(discussion.length ? discussion.map((d) => "・" + d).join("\n") : "・特記事項なし");
      out.push("");
      out.push("■ 決定事項");
      out.push(decisions.length ? decisions.map((d) => "・" + d).join("\n") : "・なし");
      out.push("");
      out.push("■ ネクストアクション");
      out.push(todos.length ? todos.map((d) => "・" + d).join("\n") : "・なし");

      document.getElementById("minutes-output").value = out.join("\n");
      document.getElementById("minutes-result").classList.add("show");
    });
  })();

  /* ==========================================================================
     伍: AI契約書チェッカー — Contract Risk Scanner
     ========================================================================== */
  (() => {
    const RISK_KEYWORDS = [
      { word: "自動更新", level: "high" },
      { word: "損害賠償", level: "high" },
      { word: "免責", level: "high" },
      { word: "反社会的勢力", level: "high" },
      { word: "遅延損害金", level: "high" },
      { word: "秘密保持", level: "low" },
      { word: "準拠法", level: "low" },
      { word: "解除", level: "low" },
      { word: "譲渡禁止", level: "low" },
      { word: "競業避止", level: "high" },
      { word: "違約金", level: "high" },
      { word: "契約不適合", level: "low" },
    ];

    document.getElementById("contract-run").addEventListener("click", () => {
      const text = document.getElementById("con-text").value;
      const sentences = text.split(/(?<=[。\n])/).map((s) => s.trim()).filter(Boolean);

      const found = new Map();
      const flaggedSentences = [];

      sentences.forEach((sentence) => {
        const hits = RISK_KEYWORDS.filter((k) => sentence.includes(k.word));
        if (hits.length) {
          flaggedSentences.push({ sentence, hits });
          hits.forEach((h) => found.set(h.word, (found.get(h.word) || 0) + 1));
        }
      });

      const highCount = Array.from(found.entries()).filter(([w]) => RISK_KEYWORDS.find((k) => k.word === w).level === "high").length;
      const lowCount = found.size - highCount;

      const summary = document.getElementById("contract-summary");
      summary.innerHTML = "";
      [
        ["検出キーワード数", found.size + " 件"],
        ["要注意条項", highCount + " 件"],
        ["確認推奨条項", lowCount + " 件"],
        ["該当文", flaggedSentences.length + " 文"],
      ].forEach(([label, val]) => {
        summary.appendChild(
          el("div", { class: "summary-chip" }, [
            el("p", { class: "n" }, [document.createTextNode(val)]),
            el("p", { class: "l" }, [document.createTextNode(label)]),
          ])
        );
      });

      const tagBox = document.getElementById("contract-tags");
      tagBox.innerHTML = "";
      Array.from(found.keys())
        .sort((a, b) => {
          const la = RISK_KEYWORDS.find((k) => k.word === a).level;
          const lb = RISK_KEYWORDS.find((k) => k.word === b).level;
          return la === lb ? 0 : la === "high" ? -1 : 1;
        })
        .forEach((word) => {
          const level = RISK_KEYWORDS.find((k) => k.word === word).level;
          tagBox.appendChild(
            el("span", { class: "tag" + (level === "low" ? " low" : "") }, [
              document.createTextNode(`${word}（${found.get(word)}）`),
            ])
          );
        });

      const listBox = document.getElementById("contract-sentences");
      listBox.innerHTML = "";
      if (!text.trim()) {
        listBox.appendChild(el("li", {}, [document.createTextNode("契約書の本文を入力してください。")]));
      } else if (!flaggedSentences.length) {
        listBox.appendChild(el("li", {}, [document.createTextNode("登録済みのリスクキーワードは見つかりませんでした。念のため専門家にもご確認ください。")]));
      } else {
        flaggedSentences.forEach((f, i) => {
          const li = el("li", {});
          li.appendChild(el("span", { class: "rank" }, [document.createTextNode(String(i + 1))]));
          li.appendChild(document.createTextNode(f.sentence));
          f.hits.forEach((h) =>
            li.appendChild(el("span", { class: "badge" }, [document.createTextNode(h.word)]))
          );
          listBox.appendChild(li);
        });
      }

      document.getElementById("contract-result").classList.add("show");
    });
  })();

  /* ==========================================================================
     陸: AI競合分析アシスタント — SWOT Generator
     ========================================================================== */
  (() => {
    function toList(id) {
      return document
        .getElementById(id)
        .value.split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
    }
    function renderList(id, items, empty) {
      const ul = document.getElementById(id);
      ul.innerHTML = "";
      if (!items.length) {
        ul.appendChild(el("li", {}, [document.createTextNode(empty)]));
        return;
      }
      items.forEach((item) => ul.appendChild(el("li", {}, [document.createTextNode(item)])));
    }

    document.getElementById("swot-run").addEventListener("click", () => {
      renderList("swot-out-s", toList("swot-s"), "強みを入力してください");
      renderList("swot-out-w", toList("swot-w"), "弱みを入力してください");
      renderList("swot-out-o", toList("swot-o"), "機会を入力してください");
      renderList("swot-out-t", toList("swot-t"), "脅威を入力してください");
      document.getElementById("swot-result").classList.add("show");
    });
  })();

  /* ==========================================================================
     漆: AIカスタマーサポート — Ginza Concierge Chat
     ========================================================================== */
  (() => {
    const KB = [
      { keys: ["営業時間", "何時", "休み", "定休"], reply: "営業時間は平日10:00〜19:00です（土日祝はお休みをいただいております）。" },
      { keys: ["料金", "値段", "価格", "費用", "いくら"], reply: "7つのAIツールはすべて無料でお試しいただけます。本格導入や個別カスタマイズはご相談の上でお見積りします。" },
      { keys: ["アクセス", "場所", "住所", "行き方", "最寄"], reply: "東京都中央区銀座四丁目、東京メトロ銀座駅より徒歩2分の場所にオフィスがございます。" },
      { keys: ["導入", "流れ", "始め方", "使い方"], reply: "まずはホームページ上の7つのAIツールを無料でお試しいただき、業務に合いそうであればメールにてご相談ください。個別ヒアリングの上でご提案します。" },
      { keys: ["経理", "経費"], reply: "AI経理アシスタントでは、品目ごとの金額を入れるだけでカテゴリ別集計と消費税計算が行えます。" },
      { keys: ["採用", "求人", "採用"], reply: "AI採用サポーターでは、職種と必須スキルを入力するだけで求人票の本文を自動生成できます。" },
      { keys: ["契約", "法務"], reply: "AI契約書チェッカーでは、契約書本文を貼り付けるだけで注意すべき条項キーワードを自動検出します。" },
      { keys: ["ありがとう", "感謝"], reply: "こちらこそ、お問い合わせいただきありがとうございます。他にご不明な点があればお申し付けください。" },
    ];
    const FALLBACK = "申し訳ございません、その質問には自動応答できませんでした。詳しくはメール（hello@ginza-ai-office.jp）よりお問い合わせください。";

    function botReply(question) {
      const hit = KB.find((entry) => entry.keys.some((k) => question.includes(k)));
      return hit ? hit.reply : FALLBACK;
    }

    const chatWindow = document.getElementById("chat-window");
    function addBubble(text, who) {
      const bubble = el("div", { class: "chat-bubble " + who }, [document.createTextNode(text)]);
      chatWindow.appendChild(bubble);
      chatWindow.scrollTop = chatWindow.scrollHeight;
    }

    function send(question) {
      const q = question.trim();
      if (!q) return;
      addBubble(q, "user");
      setTimeout(() => addBubble(botReply(q), "bot"), 300);
    }

    const input = document.getElementById("chat-input");
    document.getElementById("chat-send").addEventListener("click", () => {
      send(input.value);
      input.value = "";
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        send(input.value);
        input.value = "";
      }
    });
    document.querySelectorAll(".chat-quick button").forEach((btn) => {
      btn.addEventListener("click", () => send(btn.dataset.q));
    });
  })();
})();
