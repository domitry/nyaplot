(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.downloadable = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

module.exports = window.d3;

},{}],2:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _d3 = require('d3');

var _d32 = _interopRequireDefault(_d3);

'use strict';

var css = '.download-menu {\n  position: absolute;\n  top: 100%;\n  left: 0;\n  z-index: 1000;\n  display: inline-block;\n  float: left;\n  min-width: 160px;\n  padding: 5px 0;\n  margin: 2px 0 0;\n  list-style: none;\n  font-size: 14px;\n  background-color: #fff;\n  border: 1px solid #ccc;\n  border: 1px solid rgba(0,0,0,.15);\n  border-radius: 4px;\n  -webkit-box-shadow: 0 6px 12px rgba(0,0,0,.175);\n  box-shadow: 0 6px 12px rgba(0,0,0,.175);\n  background-clip: padding-box;\n}\n\n.download-menu>li>a {\n  display: block;\n  padding: 3px 20px;\n  clear: both;\n  font-weight: 400;\n  line-height: 1.42857143;\n  color: #333;\n  white-space: nowrap;\n  text-decoration: none;\n  background: 0 0;\n}\n\n.download-menu>li>a:hover, .download-menu>li>a:focus {\n  text-decoration: none;\n  color: #262626;\n  background-color: #f5f5f5;\n}';

var toCanvas = function toCanvas(svgData, width, height, callback) {
  var src = 'data:image/svg+xml;charset=utf-8;base64,' + svgData;
  var canvas = document.createElement('canvas');
  var context = canvas.getContext('2d');
  var image = new Image();
  canvas.width = width;
  canvas.height = height;
  image.onload = function () {
    context.drawImage(image, 0, 0);
    callback(canvas);
  };
  image.src = src;
};

var createMenu = function createMenu(pos, filename, canvas, base64SvgText) {
  var menu = _d32['default'].select('body').append('ul').classed('download-menu', true).style({
    left: '' + pos[0] + 'px',
    top: '' + pos[1] + 'px',
    position: 'absolute',
    'z-index': '1000',
    display: 'inline-block',
    float: 'left',
    'min-width': '160px',
    padding: '5px 0',
    margin: '2px 0 0',
    'list-style': 'none',
    'font-size': '14px',
    'background-color': '#fff',
    border: '1px solid #ccc',
    'border-radius': '4px',
    '-webkit-box-shadow': '0 6px 12px rgba(0,0,0,.175)',
    'box-shadow': '0 6px 12px rgba(0,0,0,.175)',
    'background-clip': 'padding-box'
  });
  var list = menu.append('li');
  list.append('a').text('Save as SVG').attr({
    download: filename + '.svg',
    href: 'data:image/svg+xml;charset=utf-8;base64,' + base64SvgText
  });
  list.append('a').text('Save as PNG').attr({
    download: filename + '.png',
    href: canvas.toDataURL('image/png')
  });
  list.append('a').text('Save as JPG').attr({
    download: filename + '.jpeg',
    href: canvas.toDataURL('image/jpeg')
  });
};

var downloadable = function downloadable() {
  var filename = 'image';

  var downloadableImpl = function downloadableImpl(selection) {
    if (_d32['default'].select('#downloadable-css').empty()) {
      _d32['default'].select('head').append('style').attr('id', 'downloadable-css').text(css);
    }

    selection.on('contextmenu', function () {
      _d32['default'].selectAll('.download-menu').remove();

      var pos = _d32['default'].mouse(document.body);
      var origSvgNode = selection.node();

      var _origSvgNode$getBoundingClientRect = origSvgNode.getBoundingClientRect();

      var width = _origSvgNode$getBoundingClientRect.width;
      var height = _origSvgNode$getBoundingClientRect.height;

      var svgNode = origSvgNode.cloneNode(true);
      _d32['default'].select(svgNode).attr({
        version: '1.1',
        xmlns: 'http://www.w3.org/2000/svg',
        'xmlns:xmlns:xlink': 'http://www.w3.org/1999/xlink',
        width: width,
        height: height
      });
      var svgText = svgNode.outerHTML;
      var base64SvgText = btoa(encodeURIComponent(svgText).replace(/%([0-9A-F]{2})/g, function (match, p1) {
        return String.fromCharCode('0x' + p1);
      }));
      toCanvas(base64SvgText, width, height, function (canvas) {
        createMenu(pos, filename, canvas, base64SvgText);
      });
      _d32['default'].event.preventDefault();

      _d32['default'].select('body').on('click.download-menu', function () {
        _d32['default'].selectAll('.download-menu').remove();
      });
    });
  };

  downloadableImpl.filename = function () {
    if (arguments.length === 0) {
      return filename;
    }
    filename = arguments[0];
    return downloadableImpl;
  };

  return downloadableImpl;
};

exports['default'] = downloadable;
module.exports = exports['default'];

},{"d3":1}]},{},[2])(2)
});