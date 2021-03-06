'use strict';

var packageJson = require('../package.json'),
    lib = require('../lib'),
    cssParser = require('css');

var nativeCSS = function() {};

nativeCSS.prototype.version = function() {
    return ('native-css version: ' + packageJson.version)
}

nativeCSS.prototype.help = function() {
    return lib.readFile(__dirname + '/../docs/help.md')
}

nativeCSS.prototype.indentObject = function(obj, indent) {
    var self = this,
        result = '';
    return JSON.stringify(obj, null, indent || 0);
}

nativeCSS.prototype.nameGenerator = function (name) {
    name = name.replace(/\s\s+/g, ' ');
    name = name.replace(/[^a-zA-Z0-9]/g, '_');
    name = name.replace(/^_+/g, '');
    name = name.replace(/_+$/g, '');
    return name;
}

nativeCSS.prototype.mediaNameGenerator = function(name) {
    return '@media ' + name;
}

function transformRules(self, rules, result) {
    rules.forEach(function(rule) {
        var obj = {};
        if (rule.type === 'media') {
            var name = self.mediaNameGenerator(rule.media);
            var media = result[name] = result[name] || {
                "__expression__": rule.media
            };
            transformRules(self, rule.rules, media)
        } else if (rule.type === 'rule') {
            rule.declarations.forEach(function (declaration) {
                if (declaration.type === 'declaration') {
                    obj[declaration.property] = declaration.value;
                }
            });
            rule.selectors.forEach(function(selector) {
                var name = self.nameGenerator(selector.trim());
                result[name] = obj;
            });
        }
    });
}

nativeCSS.prototype.transform = function(css) {
    var result = {};
    transformRules(this, css.stylesheet.rules, result);
    return result;
}

nativeCSS.prototype.convert = function(cssFile) {
    var path = process.cwd() + '/' + cssFile;

    if (!(require('fs').existsSync(path)))
        return 'Ooops!\nError: CSS file not found!';

    var self = this,
        css = lib.readFile(path);
        css = cssParser.parse(css, {silent: false, source: path});

    return self.transform(css);
}

nativeCSS.prototype.generateFile = function(obj, where, react) {
    if (!where || where.indexOf('--') > -1)
        return console.log('Please, set a output path!');

    var self = this,
        body;

    where = process.cwd() + '/' + where;

    if (react) {
        lib.writeFile(where, 'var styles = StyleSheet.create({\n');
        body = self.indentObject(obj, 2);
        lib.appendFile(where, body + '\n});');
        return;
    }

    body = self.indentObject({
        'styles': obj
    }, 2);
    lib.writeFile(where, body);
}

module.exports = new nativeCSS();
