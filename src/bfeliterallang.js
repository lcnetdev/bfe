/*eslint no-console: 0*/
bfe.define('src/bfeliterallang', ['require', 'exports','src/bfelogging' ], function(require, exports) {
  
  
  var bfelog = require('src/bfelogging');

  exports.iso6391 = [];
  exports.iso6392 = [];
  exports.iso6392to6391 = [];
  exports.iso15924 = [];
  exports.languagePatterns = [];

  exports.loadData = function(config){
      bfelog.addMsg(new Error(), 'DEBUG', "Literal Lang URL: " + config.literalLangDataUrl);
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
  
});