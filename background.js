/*
 * @Author: xx1czj 306205161@qq.com
 * @Date: 2026-03-05 14:31:57
 * @LastEditors: xx1czj 306205161@qq.com
 * @LastEditTime: 2026-03-05 14:32:06
 * @FilePath: /chrome-extension-seller/background.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
// 监听插件图标点击事件
chrome.action.onClicked.addListener((tab) => {
  // 向当前标签页发送一个自定义消息
  chrome.tabs.sendMessage(tab.id, { action: "RUN_SPU_CHECK" });
});