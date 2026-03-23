let sources = [];
let activeIds = [];
let displayFormat = " "; // 默认一个空格

const listEl = document.getElementById('sourceList');
const formatInput = document.getElementById('formatInput');

chrome.storage.local.get(['sources', 'activeIds', 'displayFormat'], (res) => {
    sources = res.sources || [];
    activeIds = res.activeIds || [];
    displayFormat = res.displayFormat !== undefined ? res.displayFormat : " ";
    formatInput.value = displayFormat;
    renderList();
});

formatInput.oninput = () => {
    displayFormat = formatInput.value;
    chrome.storage.local.set({ displayFormat }, () => notifyContent());
};

document.getElementById('addBtn').onclick = () => {
    const text = document.getElementById('dataInput').value.trim();
    if (!text) return;

    const newSource = {
        id: Date.now(),
        name: `源_${new Date().toLocaleTimeString()}`,
        // 存储原始数组，不再提前指定 key
        rows: text.split('\n').map(l => l.trim().split(/\s+/)).filter(p => p.length >= 2)
    };

    sources.unshift(newSource);
    activeIds.push(newSource.id);
    saveAll();
    document.getElementById('dataInput').value = '';
};

function renderList() {
    listEl.innerHTML = '';
    sources.forEach(s => {
        const isActive = activeIds.includes(s.id);
        const div = document.createElement('div');
        div.className = `source-item ${isActive ? 'active' : ''}`;
        div.innerHTML = `
            <div class="checkbox-wrapper"><div class="checkbox"></div></div>
            <div class="item-info"><input class="item-name" value="${s.name}"></div>
            <button class="btn-del">删除</button>
        `;
        div.querySelector('.checkbox-wrapper').onclick = () => {
            isActive ? activeIds = activeIds.filter(id => id !== s.id) : activeIds.push(s.id);
            saveAll();
        };
        const nameInput = div.querySelector('.item-name');
        nameInput.onblur = () => { s.name = nameInput.value; saveAll(); };
        div.querySelector('.btn-del').onclick = () => {
            sources = sources.filter(x => x.id !== s.id);
            activeIds = activeIds.filter(x => x.id !== s.id);
            saveAll();
        };
        listEl.appendChild(div);
    });
}

function saveAll() {
    chrome.storage.local.set({ sources, activeIds }, () => {
        renderList();
        notifyContent();
    });
}

function notifyContent() {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        if(!tabs[0]?.id) return;
        chrome.tabs.sendMessage(tabs[0].id, { action: "REFRESH_TAGS" }, () => {
            if (chrome.runtime.lastError) { /* 静默处理 */ }
        });
    });
}