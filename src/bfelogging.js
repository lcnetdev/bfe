/*eslint no-console: 0*/
bfe.define('src/bfelogging', ['require', 'exports' ], function(require, exports) {

    var level = "INFO";
    var toConsole = true;
    var domain = window.location.protocol + "//" + window.location.host + "/";
    
    exports.log = [];
    
    exports.getLog = function() {
        return exports.log;
    }
    
    exports.init = function(config) {
        if (config.logging !== undefined) {
            if (config.logging.level !== undefined && config.logging.level == "DEBUG") {
                level = config.logging.level;
            }
            if (config.logging.toConsole !== undefined && !config.logging.toConsole) {
                toConsole = config.logging.toConsole;
            }
        }
        var msg = "Logging instantiated: level is " + level + "; log to console is set to " + toConsole;
        exports.addMsg(new Error(), "INFO", msg);
        exports.addMsg(new Error(), "INFO", domain);
    };
    
    // acceptable ltypes are:  INFO, DEBUG, WARN, ERROR
    exports.addMsg = function(error, ltype, data, obj) {
        if (error.lineNumber === undefined && error.fileName === undefined) {
            // Not firefox, so let's try and see if it is chrome
            try {
                var stack = error.stack.split("\n");
                var fileinfo = stack[1].substring(stack[1].indexOf("(") + 1);
                fileinfo = fileinfo.replace(domain, "");
                var infoparts = fileinfo.split(":");
                error.fileName = infoparts[0];
                error.lineNumber = infoparts[1]; 
            } catch(e) {
                // Probably IE.
                error.fileName = "unknown";
                error.lineNumber = "?";     
                
            }
        }
        error.fileName = error.fileName.replace(domain, "");
        if (level == "INFO" && ltype.match(/INFO|WARN|ERROR/)) {
            setMsg(ltype, data, error, obj);
            consoleOut(ltype, data, error, obj);
        } else if (level == "DEBUG")  {
            setMsg(ltype, data, error, obj);
            consoleOut(ltype, data, error, obj);
        }
    };
    
    function consoleOut(ltype, data, error, obj) {
        if (toConsole) {
            console.log(error.fileName + ":" + error.lineNumber + " -> " + data);
            if (typeof data==="object" || data instanceof Array) {
                console.log(data);
            }
            if (obj !== undefined && (typeof obj==="object" || obj instanceof Array)) {
                console.log(obj);
            }
        }
    }
    
    function setMsg(ltype, data, error, obj) {
        var dateTime = new Date();
        var locale = dateTime.toJSON();
        var localestr = dateTime.toLocaleString();
        var entry = {};
        entry.dt = dateTime;
        entry.dtLocaleSort = locale;
        entry.dtLocaleReadable = localestr;
        entry.type = ltype;
        entry.fileName = error.fileName;
        entry.lineNumber = error.lineNumber;
        if (typeof data==="object" || data instanceof Array) {
            entry.msg = JSON.stringify(data);
        } else {
            entry.msg = data;
        }
        if (obj !== undefined && (typeof obj==="object" || obj instanceof Array)) {
            entry.obj = JSON.stringify(obj);
        }
        exports.log.push(entry);
    }

});