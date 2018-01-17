const path = require("path");
const fancylog = require("fancy-log");
const chalk = require("chalk");
const treeify = require("treeify");

const resource = require("inline-js/lib/resource");
const conf = require("inline-js/lib/conf");
const inlineJs = require("inline-js")

const through = require('through2');
const PluginError = require('plugin-error');

const PLUGIN_NAME = 'gulp-inlinerjs';

function inline({ resources, transforms, shortcuts, logger } = {}) {
  //process.on('unhandledRejection', r => console.log(r)); // for debugging

  let log = fancylog;
  if (logger) { log = logger; }

  // Pass configuration
  conf.load({ resources, transforms, shortcuts });

  if (!resource.has("gulpstream")) {
    resource.add({
      name: "gulpstream",
      read: (source, target) => target.contents
    });
    resource.PATH_LIKE.add("gulpstream");
  }

  let stream = through.obj(function (file, encoding, callback) {
    $gulp = this;

    if (file.isNull()) {
      return callback(null, file);
    }
    else if (file.isStream()) {
      $gulp.emit('error', new PluginError(PLUGIN_NAME, 'Streams not supported!'));
    }
    else if (file.isBuffer()) {

      let target = {
        name: "gulpstream",
        args: [file.path],
        contents: file.contents.toString(encoding)
      }
      const dependency = {};

      inlineJs.inline({
        target,
        dependency
      })
        .then(result => {
          let basedir = path.resolve(".");
          let shorttree = changeKeys(dependency, path =>
            path.startsWith(basedir) ? path.slice(basedir.length + 1) : path);

          let tree = treeify.asTree(Object.values(shorttree)[0]);
          if (tree) {
            log(PLUGIN_NAME + ": " + Object.keys(shorttree)[0]);
            tree.trim('\n').split('\n')
              .forEach((line, i, array) => {
                let newline = "";
                if (i === array.length - 1) newline = "\n";
                log(PLUGIN_NAME + ": " + line + newline)
              });
          }
          function changeKeys(node, newKeyFunc) {
            Object.keys(node).forEach(key => {
              let value = node[key];
              node[newKeyFunc(key)] = value;
              delete node[key];
              if (value) changeKeys(value, newKeyFunc);
            });
            return node;
          }

          file.contents = new Buffer(result);
          callback(null, file);
        })
        .catch(function (err) {
          err.message = "include-js '" + file.path + "' got: " + err.message;
          if (err.errno == -4058) {
            err = { message: err.message };
          }
          $gulp.emit('error', new PluginError(PLUGIN_NAME, err));
        });
    }
  });

  return stream;
}

module.exports = inline;
