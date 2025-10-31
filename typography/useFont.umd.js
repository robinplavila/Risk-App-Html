(function (global) {
  function useFont(doc, tokenKey) {
    var t = global.FONT_TOKENS[tokenKey];
    if (!t) throw new Error("Unknown font token: " + tokenKey);
    doc.setFont(t.family, t.style);
    doc.setFontSize(t.size);
  }
  global.useFontUMD = useFont;
})(window);