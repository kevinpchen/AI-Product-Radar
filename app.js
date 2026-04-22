(function () {
  const data = window.AI_RADAR_DATA || { items: [], insights: [] };
  const state = {
    search: "",
    region: "all",
    category: "all",
    sort: "score",
    activeTag: ""
  };

  const nodes = {
    generatedAt: document.getElementById("generatedAt"),
    coverageNote: document.getElementById("coverageNote"),
    metricTotal: document.getElementById("metricTotal"),
    metricOfficial: document.getElementById("metricOfficial"),
    metricOverseas: document.getElementById("metricOverseas"),
    metricScore: document.getElementById("metricScore"),
    scoreMetricCard: document.getElementById("scoreMetricCard"),
    scoreModal: document.getElementById("scoreModal"),
    closeScoreModal: document.getElementById("closeScoreModal"),
    searchInput: document.getElementById("searchInput"),
    regionFilter: document.getElementById("regionFilter"),
    categoryFilter: document.getElementById("categoryFilter"),
    sortFilter: document.getElementById("sortFilter"),
    resetBtn: document.getElementById("resetBtn"),
    insightRail: document.querySelector(".insight-rail"),
    trendChips: document.getElementById("trendChips"),
    insightList: document.getElementById("insightList"),
    resultCount: document.getElementById("resultCount"),
    cards: document.getElementById("cards"),
    copyBriefBtn: document.getElementById("copyBriefBtn"),
    exportBtn: document.getElementById("exportBtn")
  };

  function unique(values) {
    return Array.from(new Set(values)).filter(Boolean).sort((a, b) => a.localeCompare(b, "zh-Hans-CN"));
  }

  function getHost(url) {
    try {
      return new URL(url).hostname.replace(/^www\./, "");
    } catch (error) {
      return "";
    }
  }

  function favicon(url) {
    const host = getHost(url);
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=64`;
  }

  function formatDate(dateText) {
    const date = new Date(`${dateText}T12:00:00`);
    if (Number.isNaN(date.getTime())) return dateText;
    return new Intl.DateTimeFormat("zh-CN", { month: "2-digit", day: "2-digit" }).format(date);
  }

  function populateFilters() {
    unique(data.items.map((item) => item.region)).forEach((region) => {
      nodes.regionFilter.append(new Option(region, region));
    });
    unique(data.items.map((item) => item.category)).forEach((category) => {
      nodes.categoryFilter.append(new Option(category, category));
    });
  }

  function updateMetrics(items) {
    const total = data.items.length;
    const official = data.items.filter((item) => item.sourceTier === "Official").length;
    const overseas = data.items.filter((item) => item.region === "海外").length;
    const average = total ? Math.round(data.items.reduce((sum, item) => sum + item.score, 0) / total) : 0;

    nodes.generatedAt.textContent = data.generatedAt || "-";
    nodes.coverageNote.textContent = data.coverageNote || "";
    nodes.metricTotal.textContent = String(total);
    nodes.metricOfficial.textContent = `${Math.round((official / Math.max(total, 1)) * 100)}%`;
    nodes.metricOverseas.textContent = `${Math.round((overseas / Math.max(total, 1)) * 100)}%`;
    nodes.metricScore.textContent = String(average);
    nodes.resultCount.textContent = `当前显示 ${items.length} 条，数据池共 ${total} 条`;
  }

  function tagCounts() {
    const counts = new Map();
    data.items.forEach((item) => {
      item.tags.forEach((tag) => counts.set(tag, (counts.get(tag) || 0) + 1));
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 18);
  }

  function renderChips() {
    nodes.trendChips.innerHTML = "";
    tagCounts().forEach(([tag, count]) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `chip${state.activeTag === tag ? " active" : ""}`;
      button.textContent = `${tag} ${count}`;
      button.addEventListener("click", () => {
        state.activeTag = state.activeTag === tag ? "" : tag;
        render();
      });
      nodes.trendChips.append(button);
    });
  }

  function renderInsights() {
    nodes.insightList.innerHTML = "";
    data.insights.forEach((insight) => {
      const item = document.createElement("li");
      item.textContent = insight;
      nodes.insightList.append(item);
    });
  }

  function matchesSearch(item) {
    const haystack = [
      item.company,
      item.title,
      item.summaryZh,
      item.whyItMattersZh,
      item.businessAngleZh,
      item.region,
      item.category,
      item.productType,
      item.tags.join(" ")
    ].join(" ").toLowerCase();
    return haystack.includes(state.search.trim().toLowerCase());
  }

  function filteredItems() {
    return data.items
      .filter((item) => state.region === "all" || item.region === state.region)
      .filter((item) => state.category === "all" || item.category === state.category)
      .filter((item) => !state.activeTag || item.tags.includes(state.activeTag))
      .filter((item) => !state.search || matchesSearch(item))
      .sort((a, b) => {
        if (state.sort === "date") return b.date.localeCompare(a.date);
        if (state.sort === "company") return a.company.localeCompare(b.company);
        return b.score - a.score || b.date.localeCompare(a.date);
      });
  }

  function renderCards(items) {
    nodes.cards.innerHTML = "";
    if (!items.length) {
      const empty = document.createElement("div");
      empty.className = "empty";
      empty.textContent = "没有匹配结果，可以重置筛选或换一个关键词。";
      nodes.cards.append(empty);
      return;
    }

    const fragment = document.createDocumentFragment();
    items.forEach((item) => {
      const article = document.createElement("article");
      article.className = "update-card";

      const image = document.createElement("img");
      image.className = "source-image";
      image.alt = `${item.company} source icon`;
      image.src = favicon(item.sourceUrl);
      image.loading = "lazy";

      const main = document.createElement("div");
      main.className = "card-main";

      const meta = document.createElement("div");
      meta.className = "card-meta";
      meta.innerHTML = `
        <span>${formatDate(item.date)}</span>
        <span>${item.company}</span>
        <span class="badge region">${item.region}</span>
        <span class="badge official">${item.sourceTier === "Official" ? "官方源" : "分析源"}</span>
        <span class="badge analysis">${item.category}</span>
      `;

      const title = document.createElement("h3");
      title.className = "card-title";
      title.textContent = item.title;

      const summary = document.createElement("p");
      summary.className = "card-summary";
      summary.textContent = item.summaryZh;

      const angle = document.createElement("p");
      angle.className = "card-angle";
      angle.innerHTML = `<strong>商业判断：</strong>${item.businessAngleZh}`;

      const why = document.createElement("p");
      why.className = "card-angle";
      why.innerHTML = `<strong>为什么重要：</strong>${item.whyItMattersZh}`;

      const tagRow = document.createElement("div");
      tagRow.className = "tag-row";
      item.tags.forEach((tag) => {
        const tagNode = document.createElement("span");
        tagNode.textContent = tag;
        tagRow.append(tagNode);
      });

      const link = document.createElement("a");
      link.className = "source-link";
      link.href = item.sourceUrl;
      link.target = "_blank";
      link.rel = "noreferrer";
      link.textContent = `查看来源：${item.sourceName}`;

      main.append(meta, title, summary, why, angle, tagRow, link);

      const score = document.createElement("div");
      score.className = "score-box";
      score.innerHTML = `<div><strong>${item.score}</strong><span>影响分</span></div>`;

      article.append(image, main, score);
      fragment.append(article);
    });
    nodes.cards.append(fragment);
  }

  function briefText(items) {
    const top = items.slice(0, 6);
    const lines = top.map((item, index) => {
      return `${index + 1}. ${item.company}｜${item.title}｜${item.category}｜影响分 ${item.score}`;
    });
    return [
      "AI Product Radar 简报",
      `生成时间：${data.generatedAt}`,
      `筛选结果：${items.length} 条`,
      "",
      ...lines,
      "",
      "核心观察：",
      ...data.insights.map((insight) => `- ${insight}`)
    ].join("\n");
  }

  function csvText(items) {
    const headers = ["date", "company", "region", "category", "score", "title", "source"];
    const rows = items.map((item) => {
      return [
        item.date,
        item.company,
        item.region,
        item.category,
        item.score,
        item.title,
        item.sourceUrl
      ].map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",");
    });
    return [headers.join(","), ...rows].join("\n");
  }

  async function copyBrief(items) {
    const text = briefText(items);
    try {
      await navigator.clipboard.writeText(text);
      nodes.copyBriefBtn.textContent = "已复制";
      setTimeout(() => {
        nodes.copyBriefBtn.textContent = "复制简报";
      }, 1400);
    } catch (error) {
      window.prompt("复制下面的简报文本：", text);
    }
  }

  function exportCsv(items) {
    const blob = new Blob([csvText(items)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "ai-product-radar.csv";
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function openScoreModal() {
    nodes.scoreModal.hidden = false;
    nodes.scoreMetricCard.setAttribute("aria-expanded", "true");
    nodes.closeScoreModal.focus();
  }

  function closeScoreModal() {
    nodes.scoreModal.hidden = true;
    nodes.scoreMetricCard.setAttribute("aria-expanded", "false");
    nodes.scoreMetricCard.focus();
  }

  function handleScoreMetricKeydown(event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openScoreModal();
    }
  }

  function handOffScrollAtTop(event) {
    const scroller = event.currentTarget;
    if (event.deltaY < 0 && scroller.scrollTop <= 0) {
      event.preventDefault();
      window.scrollBy({ top: event.deltaY, left: 0, behavior: "auto" });
    }
  }

  function render() {
    const items = filteredItems();
    renderChips();
    renderInsights();
    updateMetrics(items);
    renderCards(items);
  }

  function bindEvents() {
    nodes.searchInput.addEventListener("input", (event) => {
      state.search = event.target.value;
      render();
    });
    nodes.regionFilter.addEventListener("change", (event) => {
      state.region = event.target.value;
      render();
    });
    nodes.categoryFilter.addEventListener("change", (event) => {
      state.category = event.target.value;
      render();
    });
    nodes.sortFilter.addEventListener("change", (event) => {
      state.sort = event.target.value;
      render();
    });
    nodes.resetBtn.addEventListener("click", () => {
      state.search = "";
      state.region = "all";
      state.category = "all";
      state.sort = "score";
      state.activeTag = "";
      nodes.searchInput.value = "";
      nodes.regionFilter.value = "all";
      nodes.categoryFilter.value = "all";
      nodes.sortFilter.value = "score";
      render();
    });
    nodes.copyBriefBtn.addEventListener("click", () => copyBrief(filteredItems()));
    nodes.exportBtn.addEventListener("click", () => exportCsv(filteredItems()));
    nodes.scoreMetricCard.addEventListener("click", openScoreModal);
    nodes.scoreMetricCard.addEventListener("keydown", handleScoreMetricKeydown);
    nodes.closeScoreModal.addEventListener("click", closeScoreModal);
    nodes.scoreModal.addEventListener("click", (event) => {
      if (event.target === nodes.scoreModal) closeScoreModal();
    });
    nodes.insightRail.addEventListener("wheel", handOffScrollAtTop, { passive: false });
    nodes.cards.addEventListener("wheel", handOffScrollAtTop, { passive: false });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !nodes.scoreModal.hidden) closeScoreModal();
    });
  }

  populateFilters();
  bindEvents();
  render();
})();
