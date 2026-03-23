(function () {
  "use strict";

  // 你的原始数据列表
  var rawData = `23001	1729415629395169834	US	培心
22121	1729408883847369258	US	雅清
24150	1729504874295956010	US	张欣
21958	1729408899147993642	US	雅清
24196	1730194912294572586	US	张欣
23071	1729440540740260394	US	培心
24022	1730351131079053866	US	雅清
LF230037	1729409186457293354	US	雅清
Vanity	1729410422839022122	US	雅清
22100	1729419294241034794	US	培心
24461	1730743209291059754	US	张欣
22121.B	1729408879196541482	US	雅清
22051	1729408884091621930	US	其他
24282	1730775637544964650	US	其他
23119	1729425808334754346	US	张欣
22053	1729408895532962346	US	其他
24265	1731334600618906154	US	培心
24089	1730387420304216618	US	雅清
24268	1730849018972246570	US	其他
烘焙包	1729409175118582314	US	其他
24004	1729588858097209898	US	培心
23177	1729710363369640490	US	培心
24178	1729996909341938218	US	其他
24035	1729699328859935274	US	培心
23001B	1729530360832365098	US	培心
22062	1729410425595925034	US	张欣
22051	1729399168555715874	UK	舒畅
22062	1729399823208058146	UK	舒畅
21958	1729588295786924322	UK	其他
23155	1729450978682050674	DE	舒畅
22100	1729478458675403706	DE	舒畅
23092	1729658572248422514	DE	舒畅
23001	1729480077769415610	DE	舒畅
22051	1729474413580228722	DE	舒畅
21958	1729449585093286002	DE	舒畅
22094	1729474538525137010	DE	其他
22062	1729474790870784114	DE	舒畅
24150	1729541335483191754	US2	培心
22053	1729438880697455050	US2	其他
23225	1730458837852394026	US	其他
23001	1730394356788728127	US3	培心
24372	1730506896511504938	US	培心
拼图桌	1730965916083261994	US	其他
24055	1729713775398457898	US	其他
24150.B	1730369243836420650	US	其他
22121.C	1729620724390007338	US	其他
22172	1729408891298222634	US	其他
23001.C	1729448320482513450	US	其他
22104	1729444370114187818	US	其他
22164	1729419299388822058	US	其他
24102	1729715509490389546	US	其他
TN120110	1729466403814150698	US	其他
24034	1730090741564019242	US	其他
24361	1730777166427296298	US	其他
23095	1729589671239782954	US	其他
24076.B	1729553836908384810	US	其他
24488	1730994115720811050	US	其他
24156	1730365809254175274	US	其他
24412	1731132486098194986	US	其他
LF230066	1730369144680256042	US	其他
24018	1729551851226829354	US	其他
24150	1729424680486472994	UK	其他
23227	1729424680540409122	UK	其他
23095	1729485449697926074	DE	其他
22094	729474538525137010	DE	其他
22010	1729453074160392306	DE	舒畅
24196	1730816655036289578	US	张欣
22055	1729474989236656242	DE	其他
LP250050	1729444147251483178	US	其他
23023	1729418573855625770	US	培心
23079	1731796183275311562	US2	其他
23142	1729439624445530666	US	培心`;
const obb = rawData.split('\n')
        .map(item => item.trim().split('\t'))
        .filter(item => item.length >= 4)
        .reduce((acc, e) => {
            acc[e[1]] = { spu: e[0], site: e[2], level: e[3] };
            return acc;
        }, {});

    // 2. 核心标注函数：增加性能锁
    function fastAnnotate() {
        // 仅选择未处理过的 .first-col 元素，显著提升滚动性能
        const rows = document.querySelectorAll('.bi-dynamic-summary-tree-table .first-col:not([data-spu-processed])');
        
        rows.forEach(row => {
            const listingId = row.textContent.trim();
            const data = obb[listingId];

            if (data) {
                const container = row.querySelector('.bi-text.f-auto.c-e.f-c.l-c');
                if (container) {
                    const span = document.createElement('span');
                    span.className = 'spu-tag-added';
                    // 更加紧凑的视觉设计
                    span.textContent = ` ${data.site}[${data.level}]>${data.spu}`;
                    span.style.cssText = `
                        color: #ff4d4f;
                        font-weight: 600;
                        margin-left: 4px;
                        font-size: 11px;
                        background: #fff1f0;
                        border: 1px solid #ffccc7;
                        padding: 0px 2px;
                        border-radius: 2px;
                        white-space: nowrap;
                        pointer-events: none;
                    `;
                    container.appendChild(span);
                }
            }
            // 标记已处理，防止 MutationObserver 重复扫描同一行
            row.setAttribute('data-spu-processed', 'true');
        });
    }

    // 3. 针对滚动丢失的“深度监听”方案
    let scrollTimer = null;
    const observer = new MutationObserver((mutations) => {
        // 如果发现节点增减，立即触发（带 100ms 极短防抖）
        clearTimeout(scrollTimer);
        scrollTimer = setTimeout(fastAnnotate, 100);
    });

    // 4. 监听插件图标点击（手动强制刷新）
    chrome.runtime.onMessage.addListener((request) => {
        if (request.action === "RUN_SPU_CHECK") {
            // 手动运行时，清除所有标记重新扫描，确保万无一失
            document.querySelectorAll('[data-spu-processed]').forEach(el => el.removeAttribute('data-spu-processed'));
            fastAnnotate();
        }
    });

    // 5. 初始化配置
    function init() {
        fastAnnotate();
        // 监听整个 body 的子节点变化，覆盖异步翻页、滚动加载
        observer.observe(document.body, { 
            childList: true, 
            subtree: true 
        });
        console.log('SPU-BD v2.0 高性能模式已就绪');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
  console.log("SPU-BD 插件已就绪，请点击工具栏图标运行。");
})();
