(function (global) {
  function addFont(doc, file, family, style, base64) {
    doc.addFileToVFS(file, base64);
    doc.addFont(file, family, style);
  }
  function registerFonts(doc) {
    addFont(doc, "Poppins-Black.ttf", "Poppins", "black", global.FONT_POPPINS_BLACK_B64);
    addFont(doc, "Poppins-ExtraBold.ttf", "Poppins", "extrabold", global.FONT_POPPINS_EXTRABOLD_B64);
    addFont(doc, "Vollkorn-Regular.ttf", "Vollkorn", "normal", global.FONT_VOLLKORN_REGULAR_B64);
    addFont(doc, "Aptos-Serif.ttf", "AptosSerif", "normal", global.FONT_APTOSSERIF_REG_B64);
    addFont(doc, "Aptos-Serif-Bold.ttf", "AptosSerif", "bold", global.FONT_APTOSSERIF_BOLD_B64);
    // Register Wingdings 2 font (ensure FONT_WINGDINGS_2_B64 is defined globally)
    if (global.FONT_WINGDINGS_2_B64) {
      addFont(doc, "Wingdings2.ttf", "Wingdings2", "normal", global.FONT_WINGDINGS_2_B64);
    }
    
  }
  global.registerFontsUMD = registerFonts;
})(window);