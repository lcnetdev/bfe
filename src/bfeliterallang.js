/*eslint no-console: 0*/
/*eslint no-usless-escape: 0*/
bfe.define('src/bfeliterallang', ['require', 'exports','src/bfelogging' ], function(require, exports) {
  
  
  var bfelog = require('src/bfelogging');

  exports.iso6391 = [];
  exports.iso6392 = [];
  exports.iso6392to6391 = [];
  exports.iso15924 = [];
  exports.languagePatterns = [];

  exports.loadData = function(config){
    $.ajax({
      context: this,
      url: config.literalLangDataUrl,
      success: function (data) {
        bfelog.addMsg(new Error(), 'INFO', 'Fetched external source baseURI' + config.literalLangDataUrl);
        bfelog.addMsg(new Error(), 'DEBUG', 'Source data', data);
        
        // save off each of the data pieces
        data.forEach(function(d){
          if (d.name==='literalLangPatterns') this.languagePatterns = d.json;
          if (d.name==='iso6391') this.iso6391 = d.json;
          if (d.name==='iso6392') this.iso6392 = d.json;
          if (d.name==='iso15924') this.iso15924 = d.json;
          if (d.name==='iso6392to6391') this.iso6392to6391 = d.json;
        }.bind(this));
        
        // turn all the strings into real regexes right now for later
        this.languagePatterns.forEach(function(p){
          p.regex = new RegExp(p.regex, "ig");
        });
      },
      error: function (XMLHttpRequest, textStatus, errorThrown) {
        bfelog.addMsg(new Error(), 'ERROR', 'FAILED to load external source: ' + config.literalLangDataUrl);
        bfelog.addMsg(new Error(), 'ERROR', 'Request status: ' + textStatus + '; Error msg: ' + errorThrown);
      }
    });    
  }
  
  
  // sent text from the literal input to try detect lang and script
  exports.identifyLangScript = function(text){
    
    var bestGuess = [];
    
    this.languagePatterns.forEach(function(p){
      
      var count = ((text || '').match(p.regex) || []).length;
      if (count>0){
        bestGuess.push([p.name, count])
      }
      
    
    
    })
    // sort them to get the best one, the one with most hits
    bestGuess.sort(function(a, b) {
        return b[1] - a[1];
    });
    
    // if we got one use it
    if (bestGuess.length>0){
      var usePattern = this.languagePatterns.filter(function(p){return p.name === bestGuess[0][0]})[0];     
      if (usePattern.script === 'Latn'){
        usePattern.script = null;
      }
      return {script: usePattern.script, iso6391: usePattern['iso639-1']}
    }else{
      return {script: null, iso6391: null}

    }
    
  
  }

  exports.characterShortcuts = function (chr) {
    //chr + meta key (aka ⊞ Win) + alt key
    var charMap = [
      {"g": {name: "Soft Sign", val: "ʹ", code:0x02b9 }},
      {"G": {name: "Hard Sign", val: "ʺ", code:0x02ba }},
      {"k": {name: "Ligature Left", val: "", code:0xfe20 }},
      {"l": {name: "Ligature Right", val: "", code:0xfe21 }},
      {".": {name: "Breve", val: "", code:0x0306 }},
      {"N": {name: "Dot above", val: "", code:0x0307 }},
      {"f": {name: "Macron", val: "", code:0x0304 }},
      {"m": {name: "Umlaut", val: "", code:0x0308 }},
      {"p": {name: "Hachek", val: "", code:0x0161 }},
      {"U": {name: "Dyet upper", val: "Đ", code:0x0110 }},
      {"u": {name: "Dyet lower", val: "đ", code:0x0111 }},
      {"A": {name: "Ya upper", val: "Я", code:0x042F }},
      {"a": {name: "Ya lower", val: "я", code:0x044F }},
      {"I": {name: "Yat upper", val: "Ѣ", code:0x0462 }},
      {"i": {name: "Yat lower", val: "ѣ", code:0x0463 }},
      {"R": {name: "Yu upper", val: "Ю", code:0x042F }},
      {"r": {name: "Yu lower", val: "ю", code:0x0444E }},
      {"T": {name: "Tse upper", val: "Ц", code:0x0426 }},
      {"t": {name: "Tse lower", val: "ц", code:0x0446 }},
      {"o": {name: "Acute", val: "", code:0x0301}},
      {"`": {name: "Grave", val: "", code:0x0300}},
      {"h": {name: "Hook right", val: "", code:0x0328}},
      {"<": {name: "Non-sort beg", val: "", code:0x0098}},
      {">": {name: "Non-sort end", val: "", code:0x009C}}
    ]

    var returnChar = _.find(charMap, chr);

    if(_.isEmpty(returnChar)) {
      return ""
    } else {
      if (!_.isEmpty(returnChar[chr].val)) {
        return returnChar[chr].val;
      } else {
        return String.fromCodePoint(returnChar[chr].code)
      }
    }
  }
  
});