(function () {
    "use strict";
    let activeSources = [];
    let formatStr = " ";

    async function load() {
        const res = await chrome.storage.local.get(['sources', 'activeIds', 'displayFormat']);
        formatStr = res.displayFormat !== undefined ? res.displayFormat : " ";
        const all = res.sources || [];
        const ids = res.activeIds || [];
        activeSources = all.filter(s => ids.includes(s.id));
        refresh();
    }

    function refresh() {
        document.querySelectorAll('.spu-wrapper-container').forEach(e => e.remove());
        document.querySelectorAll('[data-spu-processed]').forEach(e => e.removeAttribute('data-spu-processed'));
        apply();
    }

    function apply() {
        if (activeSources.length === 0) return;

        // 优化选择器：匹配 15-20位数字(数据行) 或者 包含 "listing" 字样的表头
        // 移除 children.length 限制，以兼容某些 BI 系统在文本外包裹 span 的情况
        const allNodes = document.querySelectorAll('div, td, span');
        const cells = Array.from(allNodes).filter(el => {
            if (el.children.length > 0 && !el.classList.contains('bi-text')) return false;
            const text = el.textContent.trim().toLowerCase();
            // 匹配数字 ID 或者 精确匹配 "listing"
            return /^\d{15,20}$/.test(text) || text === "listing";
        });

        cells.forEach(cell => {
            const rawText = cell.textContent.trim();
            const container = document.createElement('div');
            container.className = 'spu-wrapper-container';
            container.style.cssText = "display: inline-flex; gap: 6px; margin-left: 10px; vertical-align: middle;";

            let matchedCount = 0;

            activeSources.forEach((source, sIdx) => {
                const headers = source.headers || [];
                // 核心逻辑：无论页面上是 ID 还是 "listing"，统一在 rows 中查找匹配项
                // 如果是表头，它会去 rows 里找有没有哪一行包含 "listing" 这个字符串
                const matchRow = source.rows.find(row => row.includes(rawText));
                
                if (matchRow) {
                    matchedCount++;
                    const span = document.createElement('span');
                    let labelParts = [];
                    
                    matchRow.forEach((val, idx) => {
                        // 过滤掉当前作为 Key 的原始文本
                        if (val !== rawText) {
                            const headerName = headers[idx] ? `${headers[idx]}:` : "";
                            labelParts.push(`${headerName}${val}`);
                        }
                    });

                    const themes = [
                        {b:'#ffccc7', g:'#fff1f0', t:'#ff4d4f'},
                        {b:'#b7eb8f', g:'#f6ffed', t:'#52c41a'},
                        {b:'#91d5ff', g:'#e6f7ff', t:'#1890ff'},
                        {b:'#ffd591', g:'#fff7e6', t:'#faad14'}
                    ];
                    const theme = themes[sIdx % themes.length];
                    
                    span.style.cssText = `
                        color:${theme.t} !important; background:${theme.g} !important; 
                        border: 1px solid ${theme.b} !important; font-size: 10px !important; 
                        padding: 2px 6px !important; border-radius: 4px !important; 
                        font-weight: 600 !important; white-space: nowrap !important; line-height: 1.2;
                        display: inline-block !important;
                    `;
                    span.textContent = labelParts.join(formatStr);
                    container.appendChild(span);
                }
            });

            if (matchedCount > 0) {
                // 检查是否已经存在标签，避免 MutationObserver 重复触发
                if (!cell.parentElement.querySelector(':scope > .spu-wrapper-container')) {
                    cell.style.display = "inline-flex";
                    cell.style.alignItems = "center";
                    cell.after(container);
                }
            }
            cell.setAttribute('data-spu-processed', 'true');
        });
    }

    chrome.runtime.onMessage.addListener((m, s, send) => {
        if (m.action === "REFRESH_TAGS") { load(); if(send) send({status:1}); }
        return true;
    });

    let t;
    const obs = new MutationObserver(() => {
        clearTimeout(t);
        t = setTimeout(apply, 400);
    });

    load();
    obs.observe(document.body, { childList: true, subtree: true });
})();