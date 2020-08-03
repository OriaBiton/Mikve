function isInt(n) { return n % 1 === 0 }
function insertBefore(newNode, referenceNode) {
    referenceNode.parentNode
      .insertBefore(newNode, referenceNode);
}
function insertAfter(newNode, referenceNode) {
    referenceNode.parentNode
      .insertBefore(newNode, referenceNode.nextSibling);
}
function isHidden(el) {
  return el.offsetParent === null;
}
function loadCss(path) {
    let l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = path;
    let h = document.getElementsByTagName('head')[0];
    h.parentNode.insertBefore(l, h);
}
function toggleHide(el){ el.hidden = !isHidden(el); }
function unhide(el){
  if (el.tagName == 'svg') return el.classList.remove('hidden');
  el.hidden = false;
}
function hide(el){
  if (el.tagName == 'svg') return el.classList.add('hidden');
  el.hidden = true;
}
function q(selector){
  return document.querySelector(selector);
}
function qAll(selector){
  return document.querySelectorAll(selector);
}
function byId(selector){
  return document.getElementById(selector);
}
function byClass(selector){
  return document.getElementsByClassName(selector);
}
function byTag(selector){
  return document.getElementsByTagName(selector);
}
Object.defineProperty(HTMLElement.prototype, 'hasClass', {
  value: function(name) { return this.classList.contains(name); }
});
Object.defineProperty(Notyf.prototype, 'info', {
  value: function(msg) { this.open({type: 'info', message: msg}); }
})
function timeSince(date) {
  let seconds = Math.floor((new Date() - date) / 1000);
  let interval = Math.floor(seconds / 31536000);
  if (interval >= 1) return interval + " שנים";
  interval = Math.floor(seconds / 2592000);
  if (interval >= 1) return interval + " חודשים";
  interval = Math.floor(seconds / 86400);
  if (interval >= 1){
    if (interval == 1) return 'יום אחד';
    return interval + " ימים";
  }
  interval = Math.floor(seconds / 3600);
  if (interval >= 1) {
    if (interval == 1) return "שעה אחת";
    return interval + " שעות";
  }
  interval = Math.floor(seconds / 60);
  if (interval >= 1) return interval + " דקות";
  return Math.floor(seconds) + " שניות";
}
function findGetParameter(parameterName) {
  let result = null;
  let tmp = [];
  location.search.substr(1).split("&").forEach(item => {
    tmp = item.split("=");
    if (tmp[0] === parameterName) result = decodeURIComponent(tmp[1]);
  });
  return result;
}
