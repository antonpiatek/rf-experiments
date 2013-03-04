;(function(e,t,n,r){function i(r){if(!n[r]){if(!t[r]){if(e)return e(r);throw new Error("Cannot find module '"+r+"'")}var s=n[r]={exports:{}};t[r][0](function(e){var n=t[r][1][e];return i(n?n:e)},s,s.exports)}return n[r].exports}for(var s=0;s<r.length;s++)i(r[s]);return i})(typeof require!=="undefined"&&require,{1:[function(require,module,exports){// Generated by CoffeeScript 1.5.0

/*
This file is to be ran on the browser.
*/


(function() {
  var LightwaveRF, dataEl, formEl, output, outputEl, sampleData;

  LightwaveRF = require('./lightwaverf.coffee');

  sampleData = require('./sample.coffee');

  formEl = null;

  outputEl = null;

  dataEl = null;

  output = function(results) {
    var html, lastData, outputRepeats, repeatCount, result, _i, _len, _ref;
    html = "";
    lastData = null;
    repeatCount = 0;
    outputRepeats = function() {
      if (repeatCount > 0) {
        html += "Repeats: <span class='data'>" + repeatCount + "</span><br />";
      }
      repeatCount = 0;
      if (lastData != null) {
        return html += "</div>";
      }
    };
    for (_i = 0, _len = results.length; _i < _len; _i++) {
      result = results[_i];
      if (result.valid) {
        if (lastData === result.data) {
          repeatCount++;
        } else {
          outputRepeats();
          lastData = result.data;
          html += "<div class='entry'>";
          html += "<tt>" + result.pretty + "</tt> <span class='debug'>from " + result.startIndex + ".." + result.stopIndex + "</span><br />";
          html += "Remote: <span class='data'>" + result.remoteId + "</span>, subunit: <span class='data'>" + result.subunit + "</span> <span class='debug'>(" + result.subunitName + ")</span>, command: <span class='data'>" + result.command + "</span> <span class='debug'>(" + result.commandName + ")</span>, parameter: <span class='data'>" + result.parameter + "</span> <span class='debug'>(" + ((_ref = result.level) != null ? _ref : "-") + ")</span><br />";
        }
      }
    }
    outputRepeats();
    return outputEl.innerHTML = html;
  };

  window.addEventListener('DOMContentLoaded', function() {
    var onsubmit, sampleEl;
    formEl = document.getElementById('input');
    outputEl = document.getElementById('output');
    dataEl = document.getElementById('data');
    sampleEl = document.getElementById('sample');
    sampleEl.onclick = function(e) {
      if (typeof e.preventDefault === "function") {
        e.preventDefault();
      }
      dataEl.value = JSON.stringify(sampleData);
      onsubmit();
      return false;
    };
    onsubmit = function(e) {
      var data, results;
      if (e != null) {
        if (typeof e.preventDefault === "function") {
          e.preventDefault();
        }
      }
      data = dataEl.value.replace(/[^0-9,]/, "");
      data = data.split(",");
      results = LightwaveRF.decode(data);
      console.log(results);
      output(results);
      return false;
    };
    return formEl.onsubmit = onsubmit;
  });

}).call(this);

},{"./lightwaverf.coffee":2,"./sample.coffee":3}],2:[function(require,module,exports){// Generated by CoffeeScript 1.5.0

/*
LightwaveRF by @Benjie
*/


(function() {
  var DURATION_HIGH, DURATION_ONE, DURATION_TEN, ERROR_MARGIN, TRANSMISSION_GAP, commandNames, commands, decodeLightwaveRF, k, v, withinErrorMargin;

  TRANSMISSION_GAP = 10250;

  DURATION_TEN = 1250;

  DURATION_ONE = 250;

  DURATION_HIGH = 250;

  ERROR_MARGIN = 150;

  commands = {
    OFF: 0,
    ON: 1,
    MOOD: 2
  };

  commandNames = [];

  for (k in commands) {
    v = commands[k];
    commandNames[v] = k;
  }

  withinErrorMargin = function(val, expected) {
    var margin;
    margin = ERROR_MARGIN + expected / 8;
    return (expected - margin < val && val < expected + margin);
  };

  /*
  `analogReads` is an array of durations in us (microseconds).
  
  If the data you pass has been divided by a divisor (e.g. 40) then pass this
  divisor via the `options` hash, e.g. `options.divisor=40`
  */


  decodeLightwaveRF = function(analogReads, options) {
    var bits, byte, divisor, endData, i, id, index, isHigh, l, letter, nibble, nibbleLookup, nibbles, number, result, results, sensibleData, startData, startIndex, stopIndex, str, subunitNameLookup, _i, _j, _k, _l, _len, _len1, _len2, _m, _ref;
    if (options == null) {
      options = {};
    }
    divisor = options.divisor;
    if (divisor == null) {
      divisor = 1;
    }
    results = [];
    sensibleData = false;
    isHigh = false;
    bits = null;
    startIndex = null;
    stopIndex = null;
    endData = function(index) {
      var binStr, data, pretty, raw;
      stopIndex = index;
      sensibleData = false;
      binStr = bits.join("");
      if (binStr.length < 8) {
        return;
      }
      raw = binStr;
      pretty = raw.substr(0, 1) + " " + raw.substr(1).replace(/1(....)(....)/g, " 1  $1 $2 ");
      data = raw.substr(1).replace(/1(........)/g, "$1");
      return results.push({
        startIndex: startIndex,
        stopIndex: stopIndex,
        raw: raw,
        pretty: pretty,
        data: data
      });
    };
    startData = function(index) {
      startIndex = index;
      sensibleData = true;
      isHigh = true;
      return bits = [];
    };
    for (index = _i = 0, _len = analogReads.length; _i < _len; index = ++_i) {
      l = analogReads[index];
      l *= divisor;
      if (sensibleData) {
        if (isHigh) {
          if (l > DURATION_HIGH + ERROR_MARGIN) {
            isHigh = false;
          }
        }
        if (!isHigh) {
          if (withinErrorMargin(l, DURATION_ONE)) {
            bits.push("1");
          } else if (withinErrorMargin(l, DURATION_TEN)) {
            bits.push("10");
          } else {
            endData(index);
          }
        }
        isHigh = !isHigh;
      }
      if (!sensibleData) {
        if (withinErrorMargin(l, TRANSMISSION_GAP)) {
          startData(index);
        }
      }
    }
    nibbleLookup = ["11110110", "11101110", "11101101", "11101011", "11011110", "11011101", "11011011", "10111110", "10111101", "10111011", "10110111", "01111110", "01111101", "01111011", "01110111", "01101111"];
    subunitNameLookup = [];
    _ref = "ABCD".split("");
    for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
      letter = _ref[_j];
      for (number = _k = 1; _k <= 4; number = ++_k) {
        subunitNameLookup.push(letter + number);
      }
    }
    for (_l = 0, _len2 = results.length; _l < _len2; _l++) {
      result = results[_l];
      str = result.data;
      nibbles = [];
      while (str.length >= 8) {
        byte = str.substr(0, 8);
        str = str.substr(8);
        nibble = nibbleLookup.indexOf(byte);
        if (nibble < 0) {
          break;
        }
        nibbles.push(nibble);
      }
      result.nibbles = nibbles;
      if (nibbles.length >= 10) {
        result.valid = true;
        result.parameter = nibbles[0] << 4 + nibbles[1];
        if (result.parameter >= 0x80) {
          result.level = result.parameter - 0x80;
        }
        result.subunit = nibbles[2];
        result.subunitName = subunitNameLookup[nibbles[2]];
        result.command = nibbles[3];
        result.commandName = commandNames[nibbles[3]];
        id = 0;
        for (i = _m = 0; _m <= 5; i = ++_m) {
          id += nibbles[4 + i] << (4 * (5 - i));
        }
        result.remoteIdInt = id;
        result.remoteId = "0x" + id.toString(16).toUpperCase();
      }
    }
    return results;
  };

  exports.decode = decodeLightwaveRF;

  exports.commands = commands;

  exports.commandNames = commandNames;

}).call(this);

},{}],3:[function(require,module,exports){// Generated by CoffeeScript 1.5.0
(function() {

  module.exports = [50196, 0, 2008, 240, 356, 196, 268, 228, 2664, 140, 1068, 192, 2556, 220, 288, 200, 3252, 652, 616, 204, 380, 0, 2136, 132, 0, 524, 3200, 140, 956, 596, 304, 0, 1960, 1820, 2228, 1824, 164, 100, 1892, 536, 120, 280, 0, 444, 0, 220, 2436, 292, 284, 188, 124, 272, 372, 360, 2152, 228, 392, 992, 2088, 192, 244, 340, 172, 356, 172, 312, 0, 292, 1944, 844, 248, 880, 1996, 184, 248, 188, 3304, 21124, 120, 240, 1548, 22604, 256, 0, 2008, 200, 124, 392, 336, 396, 0, 640, 2060, 13344, 220, 128, 1308, 420, 224, 14676, 180, 184, 1236, 348, 152, 284, 192, 508, 0, 412, 2176, 576, 516, 648, 1968, 6976, 140, 216, 1676, 340, 0, 148, 392, 600, 2480, 15584, 212, 116, 2032, 8928, 256, 0, 1728, 2816, 204, 156, 1844, 1876, 124, 216, 1756, 22164, 148, 208, 1608, 376, 516, 404, 376, 172, 2060, 6140, 116, 204, 1572, 308, 324, 212, 188, 676, 2240, 1792, 2176, 7264, 316, 0, 1504, 2820, 188, 140, 1736, 268, 212, 432, 0, 132, 1048, 1788, 4516, 196, 132, 1348, 308, 192, 252, 356, 348, 148, 224, 2144, 1848, 0, 344, 1568, 23568, 204, 164, 2040, 0, 2452, 156, 188, 2044, 1888, 124, 212, 1796, 252, 0, 204, 428, 936, 2052, 8164, 0, 292, 1524, 2224, 0, 300, 1472, 3660, 124, 156, 2016, 8064, 120, 248, 1532, 4948, 0, 124, 1856, 8896, 2092, 12128, 0, 340, 1608, 112, 176, 160, 152, 0, 260, 152, 352, 504, 2204, 4772, 188, 164, 1704, 2996, 0, 360, 1672, 7092, 196, 164, 1496, 7972, 184, 112, 1736, 5884, 0, 324, 1668, 12256, 152, 192, 1476, 896, 100, 108, 344, 460, 0, 2120, 3088, 188, 156, 1432, 684, 0, 244, 208, 916, 1828, 2980, 108, 240, 1656, 284, 184, 832, 192, 692, 1840, 6068, 1936, 3012, 156, 188, 1628, 5328, 148, 224, 1312, 464, 0, 232, 0, 356, 380, 668, 1908, 652, 0, 1984, 2188, 12744, 0, 324, 1916, 268, 192, 416, 0, 1040, 136, 104, 2000, 5852, 132, 168, 1648, 8344, 0, 320, 1364, 5044, 128, 252, 1492, 908, 312, 828, 1984, 276, 172, 14832, 0, 284, 1424, 9232, 168, 168, 1524, 164, 892, 320, 140, 0, 2352, 176, 452, 6156, 200, 140, 1740, 176, 268, 680, 340, 368, 228, 116, 1952, 9320, 1540, 320, 152, 3352, 2172, 124, 196, 0, 260, 300, 208, 248, 636, 2028, 10108, 132, 232, 1476, 1308, 2600, 404, 108, 780, 176, 372, 2172, 620, 0, 5484, 132, 220, 1536, 5700, 152, 212, 1876, 18712, 120, 212, 1992, 1056, 600, 164, 2204, 152, 584, 384, 2880, 216, 576, 0, 156, 664, 2268, 14000, 996, 372, 160, 428, 1120, 456, 0, 396, 152, 380, 160, 368, 172, 368, 1164, 460, 0, 440, 1168, 332, 184, 352, 172, 428, 108, 400, 136, 412, 1168, 328, 196, 340, 1216, 388, 140, 400, 140, 348, 204, 344, 1216, 368, 148, 392, 136, 388, 1208, 328, 1216, 372, 140, 384, 1196, 320, 204, 320, 224, 312, 232, 340, 180, 368, 168, 372, 164, 364, 172, 336, 1244, 304, 212, 352, 1208, 348, 196, 324, 224, 308, 1240, 348, 172, 348, 1228, 296, 232, 308, 236, 296, 248, 332, 180, 356, 180, 344, 196, 344, 200, 312, 1252, 300, 224, 324, 1248, 312, 228, 292, 248, 292, 240, 296, 244, 316, 1224, 324, 200, 308, 1272, 292, 236, 328, 196, 332, 208, 328, 1240, 284, 252, 284, 1260, 304, 224, 320, 10188, 316, 212, 332, 204, 332, 200, 332, 204, 312, 244, 288, 1252, 320, 208, 312, 1264, 292, 248, 288, 248, 288, 248, 300, 216, 332, 1228, 292, 252, 280, 1284, 304, 220, 320, 212, 316, 220, 316, 232, 284, 1272, 284, 232, 316, 1256, 312, 228, 288, 252, 280, 256, 280, 1264, 300, 232, 308, 220, 288, 1300, 276, 1260, 304, 220, 316, 1248, 276, 264, 292, 228, 312, 216, 316, 232, 324, 220, 292, 264, 268, 264, 268, 1268, 304, 236, 300, 1260, 268, 284, 272, 264, 272, 1272, 292, 228, 300, 1264, 276, 260, 292, 236, 304, 248, 296, 244, 288, 236, 284, 268, 264, 268, 272, 1272, 292, 240, 296, 1280, 268, 272, 264, 268, 276, 248, 292, 248, 292, 1264, 264, 272, 264, 1288, 296, 236, 304, 228, 300, 248, 268, 1284, 268, 256, 292, 1260, 288, 256, 264, 10220, 296, 244, 300, 236, 288, 256, 272, 264, 264, 268, 272, 1272, 300, 228, 308, 1268, 268, 268, 272, 256, 296, 244, 296, 232, 296, 1264, 272, 260, 272, 1292, 292, 240, 296, 240, 272, 276, 260, 272, 260, 1276, 292, 248, 288, 1284, 264, 268, 268, 268, 276, 248, 292, 1260, 284, 260, 260, 268, 272, 1292, 288, 1256, 272, 272, 264, 1284, 284, 240, 296, 240, 292, 240, 284, 280, 264, 272, 260, 272, 264, 276, 276, 1264, 284, 248, 268, 1288, 264, 280, 288, 248, 288, 1272, 260, 268, 264, 1280, 280, 252, 288, 244, 292, 260, 292, 248, 268, 272, 260, 276, 260, 268, 280, 1268, 284, 256, 256, 1312, 260, 268, 288, 236, 300, 244, 284, 248, 272, 1288, 260, 272, 280, 1276, 284, 244, 276, 276, 252, 280, 252, 1288, 280, 256, 280, 1272, 260, 276, 264, 10220, 284, 268, 268, 260, 276, 264, 268, 268, 280, 244, 296, 1256, 276, 264, 264, 1292, 292, 236, 300, 240, 292, 240, 292, 256, 256, 1288, 268, 260, 280, 1284, 276, 268, 264, 272, 268, 264, 264, 268, 284, 1260, 292, 236, 276, 1296, 268, 264, 288, 244, 296, 244, 280, 1276, 252, 276, 264, 272, 276, 1284, 280, 1272, 256, 284, 256, 1280, 276, 260, 276, 260, 260, 276, 260, 288, 264, 272, 268, 264, 280, 252, 288, 1264, 260, 280, 256, 1280, 280, 272, 284, 252, 280, 1280, 252, 280, 252, 1288, 276, 256, 276, 264, 252, 304, 252, 284, 248, 284, 260, 268, 268, 272, 268, 1280, 256, 280, 248, 1304, 272, 264, 276, 264, 268, 268, 252, 284, 252, 1288, 272, 264, 272, 1300, 240, 292, 248, 284, 252, 280, 264, 1280, 268, 264, 260, 1300, 244, 288, 268, 10212, 264, 284, 260, 276, 260, 264, 288, 248, 284, 248, 284, 1272, 260, 276, 256, 1296, 284, 252, 284, 248, 276, 272, 252, 280, 256, 1284, 280, 244, 288, 1292, 256, 288, 248, 276, 268, 264, 280, 256, 280, 1280, 244, 280, 256, 1304, 268, 268, 268, 260, 268, 268, 256, 1300, 240, 288, 268, 264, 260, 1312, 248, 1296, 264, 264, 276, 1268, 264, 276, 260, 276, 252, 288, 252, 288, 276, 260, 276, 256, 276, 256, 276, 1280, 252, 284, 252, 1284, 272, 280, 264, 288, 240, 1296, 268, 264, 268, 1276, 260, 280, 248, 288, 248, 304, 248, 276, 268, 268, 272, 260, 272, 264, 276, 1280, 244, 288, 260, 1296, 272, 268, 252, 288, 244, 288, 244, 296, 236, 1300, 268, 264, 264, 1312, 240, 284, 252, 280, 268, 272, 260, 1288, 244, 288, 244, 1300, 260, 272, 268, 10240, 252, 292, 276, 252, 276, 256, 280, 256, 280, 256, 256, 1300, 248, 276, 276, 1292, 264, 276, 248, 280, 252, 288, 248, 284, 264, 1272, 280, 252, 260, 1320, 244, 280, 272, 260, 276, 256, 280, 256, 272, 1284, 244, 296, 252, 1296, 272, 264, 256, 288, 248, 284, 244, 1300, 264, 260, 272, 268, 268, 1300, 248, 1292, 276, 256, 276, 1280, 248, 284, 248, 288, 260, 264, 276, 272, 276, 268, 272, 260, 248, 296, 240, 1296, 268, 264, 264, 1280, 256, 312, 240, 292, 244, 1292, 272, 260, 268, 1284, 244, 300, 236, 288, 264, 280, 272, 268, 264, 260, 272, 276, 244, 288, 244, 1296, 272, 260, 264, 1308, 248, 288, 244, 288, 244, 296, 256, 264, 268, 1284, 248, 292, 240, 1316, 260, 276, 256, 276, 260, 272, 264, 1292, 240, 292, 240, 1300, 264, 268, 268, 10212, 272, 268, 280, 260, 260, 272, 260, 280, 248, 288, 248, 1288, 280, 256, 276, 1288, 256, 280, 256, 280, 256, 272, 272, 260, 280, 1276, 248, 284, 252, 1308, 272, 260, 276, 252, 284, 256, 256, 284, 248, 1296, 264, 268, 268, 1288, 260, 284, 252, 280, 256, 280, 260, 1280, 276, 248, 276, 272, 252, 1312, 264, 1284, 272, 256, 260, 1296, 248, 276, 276, 260, 272, 260, 272, 276, 276, 264, 248, 288, 252, 284, 252, 1288, 268, 268, 272, 1280, 248, 300, 256, 280, 268, 1272, 268, 264, 260, 1292, 252, 272, 276, 264, 268, 280, 272, 260, 272, 276, 244, 288, 244, 288, 248, 1292, 268, 268, 272, 1296, 256, 280, 248, 280, 268, 268, 260, 272, 268, 1280, 244, 292, 248, 1308, 268, 264, 268, 268, 256, 284, 248, 1304, 252, 268, 236, 1308, 260, 288, 248, 10224, 260, 296, 232, 300, 224, 324, 208, 324, 200, 340, 196, 1320, 280, 244, 288, 1288, 260, 276, 272, 256, 284, 240, 288, 252, 280, 1276, 244, 288, 244, 1316, 264, 276, 244, 288, 244, 308, 224, 304, 228, 1304, 264, 264, 284, 1288, 244, 292, 244, 296, 228, 300, 240, 1296, 252, 284, 260, 276, 260, 1300, 272, 1280, 248, 288, 244, 1288, 292, 236, 296, 236, 308, 232, 272, 284, 264, 272, 264, 268, 268, 268, 276, 1268, 264, 272, 244, 1308, 248, 300, 264, 268, 264, 1288, 244, 288, 248, 1288, 280, 260, 284, 236, 296, 260, 276, 268, 264, 264, 264, 276, 264, 260, 288, 1256, 280, 268, 240, 1320, 260, 272, 260, 272, 264, 272, 264, 272, 244, 1304, 252, 280, 272, 1280, 280, 252, 272, 268, 264, 272, 264, 1276, 284, 252, 288, 1260, 260, 288, 240, 36572, 0, 10832, 0, 2572, 0, 1076, 0, 444, 0, 8288, 0, 1756, 340, 132, 240, 368, 0, 6912, 0, 1948, 0, 1232, 240, 208, 148, 1984, 460, 0, 668, 364, 320, 3196, 108, 2840, 140, 556, 0, 316, 112, 2652, 3412, 3240, 216, 2980, 40292, 112, 252, 1464, 5284, 192, 136, 1524, 9828, 284, 0, 1672, 20160, 136, 216, 1524, 428, 0, 3528, 0, 260, 1676, 4000, 192, 0, 1780, 312, 208, 320, 152, 420, 208, 280, 2432, 100, 1168, 0, 4112, 320, 1808, 27480, 0, 292, 1352, 14748, 112, 248, 1764, 5952, 0, 156, 1668, 2668, 0, 256, 2080, 344, 296, 420, 620, 472, 1832, 176, 340, 7300, 196, 152, 1924, 7288, 188, 0, 1444, 3476, 116, 128, 2156, 628, 600, 196, 2592, 132, 244, 684, 508, 608, 1816, 148, 1232, 616, 2360, 29988, 0, 328, 1308, 3476, 196, 184, 1264, 380, 152, 1020, 0, 280, 1984, 2104, 1884, 7588, 0, 284, 2052, 7344, 176, 168, 1360, 376, 116, 668, 404, 320, 2072, 13464, 132, 252, 1220, 4396, 0, 396, 1300, 1788, 3436, 124, 4260, 436, 732, 0, 2584, 456, 1756, 0, 2784, 3968, 396, 1840, 13312, 1712, 560, 6068, 372, 2024, 392, 0, 888, 276, 584, 1784, 648, 6032, 372, 1952, 30840, 2184, 9416, 12236, 0, 1464, 132, 672, 12836, 232, 428, 124, 420, 112, 400, 140, 432, 0, 504, 1040, 404, 140, 376, 1212, 444, 0, 476, 0, 472, 0, 468, 0, 388, 1192, 360, 144, 428, 1132, 460, 0, 360, 180, 356, 184, 352, 1172, 428, 112, 432, 100, 368, 1232, 336, 1180, 400, 136, 400, 1168, 328, 196, 352, 172, 400, 132, 396, 156, 384, 148, 380, 172, 332, 208, 328, 1208, 356, 168, 384, 1188, 332, 208, 332, 200, 332, 1212, 368, 152, 376, 1200, 320, 204, 360, 156, 372, 180, 368, 176, 360, 164, 344, 208, 324, 216, 316, 1224, 344, 176, 356, 1236, 308, 216, 312, 228, 312, 204, 356, 180, 344, 1224, 300, 232, 304, 1252, 340, 184, 344, 192, 344, 184, 316, 1256, 292, 228, 332, 1220, 332, 188, 316, 10180, 328, 192, 352, 188, 356, 184, 312, 236, 296, 240, 292, 1248, 336, 176, 352, 1236, 296, 240, 288, 240, 316, 204, 336, 196, 332, 1240, 292, 240, 284, 1268, 324, 200, 336, 196, 328, 228, 288, 248, 284, 1256, 312, 212, 296, 1292, 260, 272, 268, 268, 260, 268, 300, 1232, 308, 220, 296, 268, 256, 1292, 308, 1236, 296, 240, 292, 1264, 300, 208, 328, 208, 320, 212, 324, 236, 288, 252, 288, 248, 284, 252, 284, 1260, 300, 220, 316, 1248, 272, 284, 288, 228, 308, 1248, 280, 252, 284, 1268, 292, 224, 316, 220, 316, 236, 308, 228, 288, 260, 272, 260, 272, 268, 288, 1244, 300, 232, 292, 1284, 268, 268, 288, 228, 308, 220, 308, 236, 308, 1248, 272, 264, 268, 1284, 300, 228, 304, 240, 272, 268, 268, 1268, 296, 236, 296, 1264, 264, 272, 268, 10196, 304, 232, 284, 272, 268, 260, 280, 256, 272, 256, 300, 1240, 304, 228, 288, 1284, 288, 236, 304, 224, 312, 228, 304, 228, 288, 1272, 272, 260, 292, 1264, 304, 232, 276, 264, 276, 264, 268, 264, 276, 1268, 288, 236, 300, 1276, 260, 272, 280, 240, 296, 240, 292, 1264, 268, 268, 264, 268, 268, 1296, 288, 1260, 268, 264, 260, 1276, 292, 244, 296, 228, 304, 248, 268, 276, 272, 272, 264, 268, 280, 244, 292, 1256, 268, 272, 268, 1268, 292, 264, 288, 240, 292, 1260, 272, 264, 264, 1280, 284, 244, 288, 248, 276, 280, 264, 276, 252, 280, 256, 272, 280, 252, 280, 1276, 256, 276, 260, 1300, 284, 248, 280, 248, 276, 264, 276, 264, 256, 1300, 240, 284, 256, 1300, 260, 284, 248, 288, 240, 300, 236, 1304, 240, 292, 244, 1304, 248, 288, 260, 10212, 256, 288, 256, 280, 260, 272, 276, 248, 284, 252, 288, 1272, 256, 272, 252, 1308, 276, 252, 276, 260, 276, 272, 240, 288, 252, 1284, 284, 252, 280, 1292, 248, 288, 248, 288, 244, 284, 268, 260, 272, 1276, 260, 284, 244, 1308, 264, 264, 276, 260, 276, 260, 264, 1292, 244, 288, 260, 268, 268, 1292, 256, 1300, 252, 276, 276, 1264, 272, 268, 252, 292, 240, 292, 240, 304, 260, 264, 276, 256, 280, 252, 276, 1284, 244, 292, 248, 1296, 264, 280, 272, 256, 256, 1308, 236, 292, 256, 1284, 268, 276, 244, 288, 244, 308, 240, 296, 252, 272, 264, 276, 260, 264, 268, 1284, 248, 288, 244, 1316, 268, 260, 268, 284, 232, 296, 244, 292, 240, 1292, 260, 280, 268, 1304, 240, 296, 232, 296, 260, 260, 276, 1272, 256, 292, 236, 1300, 260, 276, 264, 10224, 244, 296, 248, 280, 272, 252, 280, 260, 280, 252, 268, 1288, 248, 288, 264, 1288, 272, 256, 272, 284, 240, 284, 256, 280, 248, 1292, 272, 256, 268, 1316, 232, 296, 240, 284, 268, 268, 264, 268, 268, 1288, 244, 288, 244, 1308, 268, 268, 248, 296, 224, 308, 240, 1308, 236, 300, 236, 300, 240, 1320, 240, 1300, 260, 264, 276, 1280, 244, 288, 252, 284, 248, 284, 264, 276, 272, 260, 272, 264, 268, 272, 252, 1300, 248, 272, 280, 1272, 260, 296, 252, 288, 240, 1292, 276, 256, 272, 1288, 236, 300, 236, 296, 244, 296, 268, 268, 272, 252, 280, 260, 276, 268, 240, 1300, 264, 268, 268, 1296, 272, 276, 240, 288, 244, 288, 248, 280, 268, 1276, 268, 264, 252, 1324, 236, 284, 268, 268, 272, 260, 272, 1284, 240, 292, 244, 1292, 276, 260, 272, 10232, 272, 260, 292, 236, 300, 244, 284, 252, 260, 284, 248, 1292, 276, 252, 284, 1288, 256, 276, 256, 280, 248, 284, 272, 244, 284, 1272, 272, 272, 248, 1312, 276, 244, 288, 244, 292, 244, 288, 260, 248, 1300, 256, 256, 296, 1280, 264, 276, 252, 280, 252, 288, 244, 1288, 280, 252, 284, 244, 272, 1312, 248, 1288, 268, 264, 280, 1272, 256, 284, 256, 268, 276, 252, 284, 268, 276, 260, 280, 264, 248, 288, 248, 1292, 268, 264, 272, 1280, 252, 300, 244, 296, 240, 1292, 272, 260, 264, 1292, 244, 292, 256, 276, 256, 284, 268, 268, 272, 264, 256, 284, 244, 288, 244, 1296, 256, 276, 264, 1312, 236, 296, 232, 312, 232, 296, 232, 292, 256, 1296, 232, 300, 244, 1308, 268, 264, 272, 264, 268, 276, 220, 1336, 208, 308, 264, 1280, 268, 276, 240, 10220, 296, 248, 296, 236, 276, 276, 252, 284, 248, 280, 260, 1276, 288, 236, 292, 1292, 248, 284, 260, 264, 288, 244, 292, 236, 292, 1268, 260, 280, 252, 1304, 276, 252, 280, 260, 284, 260, 248, 284, 252, 1288, 276, 248, 284, 1296, 244, 288, 244, 292, 244, 280, 268, 1280, 272, 268, 244, 296, 244, 1304, 284, 1264, 272, 272, 248, 1292, 268, 256, 280, 252, 280, 256, 284, 272, 256, 280, 248, 288, 248, 288, 256, 1280, 272, 260, 260, 1300, 244, 304, 268, 256, 280, 1264, 260, 284, 248, 1292, 276, 252, 276, 264, 272, 272, 284, 264, 244, 292, 244, 292, 244, 288, 264, 1268, 276, 256, 272, 1300, 248, 296, 268, 236, 280, 268, 272, 260, 272, 1288, 240, 300, 232, 1320, 256, 272, 252, 292, 232, 304, 232, 1304, 260, 272, 268, 1284, 248, 292, 244, 10216, 288, 248, 276, 276, 256, 284, 256, 276, 248, 272, 288, 1260, 284, 264, 248, 1308, 272, 252, 284, 240, 296, 244, 284, 252, 272, 1288, 248, 280, 264, 1304, 260, 280, 236, 304, 216, 320, 216, 316, 232, 1296, 276, 252, 264, 1308, 252, 284, 264, 260, 272, 264, 272, 1292, 232, 288, 244, 296, 240, 1308, 280, 1276, 252, 280, 256, 1284, 276, 252, 284, 260, 272, 264, 252, 300, 252, 284, 248, 280, 272, 256, 276, 1272, 256, 288, 244, 1284, 284, 276, 272, 252, 284, 1280, 248, 284, 252, 1284, 280, 244, 288, 248, 276, 292, 248, 284, 252, 284, 248, 276, 280, 256, 272, 1280, 248, 288, 248, 1312, 268, 264, 264, 264, 276, 260, 260, 288, 244, 1296, 272, 248, 284, 1284, 256, 288, 244, 292, 244, 288, 244, 1292, 272, 260, 276, 1280, 248, 288, 268, 43316, 0, 4952, 0, 4784, 0, 2372, 100, 1420, 0, 3216, 0, 3452, 0, 1204, 0, 2428, 104, 1280, 0, 2512, 144, 1076, 0, 2760, 0, 1116, 188, 304, 0, 2192, 204, 892, 252, 240, 100, 2264, 132, 364, 136, 484, 128, 352, 308, 2420, 100, 1004, 232, 2360, 412, 576, 248, 3448, 132, 5424, 356, 1280, 6424, 196, 144, 1376, 17176, 104, 232, 1480, 232, 192, 1188, 172, 0, 2024, 5712, 0, 348, 1928, 11348, 196, 136, 1456, 252, 0, 2140, 108, 252, 2008, 3656, 112, 248, 1988, 316, 228, 7196, 0, 280, 1888, 7308, 224, 120, 1468, 11276, 3132, 0, 456, 0, 3580, 356, 1960, 22900, 120, 244, 1740, 12472, 0, 288, 1408, 1812, 100, 148, 1752, 16556, 304, 0, 1264, 10424, 2368, 188, 796, 2212, 1804, 4976, 0, 348, 1664, 4360, 1632, 536, 484, 760, 2228, 404, 180, 212, 296, 256, 212, 0, 2652, 19192, 176, 180, 1264, 6284, 200, 172, 1336, 9764, 236, 104, 1808, 420, 180, 220, 192, 140, 244, 512, 100, 164, 1988, 856, 0, 1012, 1880, 2300, 1680, 12988, 0, 340, 1616, 4088, 116, 212, 1628, 2368, 200, 128, 1392, 3112, 3720, 388, 1660, 1476, 4044, 676, 1868, 6644, 204, 0, 1992, 39456, 140, 216, 1280, 8616, 2352, 10548, 272, 0, 2084, 1364, 0, 288, 0, 176, 2180, 536, 624, 180, 328, 100, 2048, 7804, 168, 176, 1896, 448, 0, 496, 108, 344, 224, 176, 2292, 8576, 2280, 396, 120, 2132, 2324, 7012, 196, 148, 1620, 3864, 0, 220, 1904, 11700, 0, 292, 1980, 5024, 128, 212, 1660, 328, 120, 780, 300, 396, 2032, 912, 108, 364, 0, 608, 2004, 9100, 972, 384, 148, 460, 1088, 484, 0, 408, 144, 372, 160, 364, 172, 364, 1172, 460, 0, 408, 1184, 344, 176, 360, 164, 416, 116, 428, 100, 412, 1168, 340, 180, 348, 1196, 420, 112, 408, 132, 356, 192, 344, 1216, 372, 132, 404, 136, 388, 1204, 312, 1228, 372, 136, 380, 1180, 328, 212, 328, 204, 328, 212, 360, 172, 368, 164, 368, 168, 360, 188, 324, 1240, 300, 216, 348, 1212, 352, 180, 328, 220, 312, 1232, 344, 176, 352, 1212, 304, 224, 312, 228, 304, 248, 332, 180, 356, 180, 352, 180, 336, 216, 296, 1256, 296, 232, 328, 1240, 320, 208, 304, 244, 292, 236, 288, 252, 308, 1228, 320, 204, 300, 1276, 288, 244, 316, 200, 336, 204, 328, 1236, 280, 252, 288, 1248, 312, 220, 316, 10168, 320, 204, 344, 192, 336, 192, 344, 192, 320, 232, 300, 1252, 324, 192, 340, 1252, 280, 248, 288, 240, 288, 248, 296, 224, 328, 1224, 316, 220, 296, 1280, 308, 200, 332, 204, 328, 208, 328, 204, 300, 1272, 276, 244, 304, 1264, 304, 216, 292, 260, 276, 260, 276, 1260, 304, 224, 308, 220, 304, 1280, 272, 1268, 304, 220, 312, 1248, 276, 260, 264, 264, 296, 232, 304, 244, 300, 240, 296, 240, 280, 260, 268, 1268, 300, 228, 308, 1252, 272, 284, 272, 260, 268, 1272, 292, 236, 300, 1260, 268, 264, 272, 248, 300, 248, 300, 236, 296, 240, 296, 244, 276, 264, 268, 1276, 288, 240, 288, 1280, 272, 268, 264, 268, 268, 252, 300, 236, 300, 1256, 268, 268, 256, 1296, 292, 248, 284, 240, 296, 236, 280, 1284, 264, 264, 292, 1252, 288, 264, 256, 10200, 304, 236, 308, 224, 300, 248, 272, 264, 268, 264, 272, 1268, 300, 224, 304, 1272, 272, 264, 268, 264, 292, 228, 300, 240, 296, 1260, 268, 268, 264, 1292, 288, 240, 296, 240, 288, 256, 264, 268, 264, 1280, 288, 240, 288, 1280, 272, 264, 272, 260, 264, 268, 284, 1256, 292, 248, 268, 272, 260, 1296, 288, 1256, 284, 264, 252, 1288, 272, 252, 284, 252, 280, 256, 276, 276, 264, 276, 252, 280, 256, 280, 252, 1280, 288, 244, 284, 1272, 256, 304, 264, 256, 284, 1264, 264, 276, 252, 1296, 272, 248, 280, 256, 280, 272, 276, 264, 252, 284, 248, 288, 248, 280, 260, 1288, 268, 260, 272, 1300, 252, 280, 268, 256, 280, 260, 272, 260, 276, 1284, 240, 288, 244, 1312, 264, 268, 272, 272, 244, 288, 244, 1292, 272, 264, 268, 1284, 244, 300, 236, 10224, 280, 268, 260, 280, 252, 280, 252, 284, 256, 272, 280, 1264, 276, 264, 256, 1304, 256, 272, 268, 268, 268, 256, 280, 264, 276, 1276, 248, 284, 272, 1288, 272, 252, 268, 284, 244, 288, 248, 284, 244, 1292, 272, 252, 276, 1308, 240, 296, 252, 268, 268, 268, 268, 1284, 248, 292, 236, 296, 240, 1316, 268, 1284, 236, 300, 240, 1292, 272, 260, 272, 264, 272, 268, 248, 312, 232, 296, 244, 292, 260, 252, 280, 1276, 252, 292, 236, 1300, 272, 280, 268, 268, 268, 1284, 244, 288, 244, 1296, 264, 268, 268, 264, 268, 292, 240, 296, 236, 296, 236, 296, 264, 260, 268, 1284, 244, 296, 240, 1316, 264, 268, 264, 264, 276, 268, 264, 276, 236, 1308, 256, 268, 264, 1296, 256, 296, 228, 304, 232, 304, 224, 1304, 264, 272, 260, 1300, 228, 308, 228, 10248, 244, 292, 248, 288, 248, 284, 256, 280, 264, 252, 280, 1284, 240, 296, 248, 1304, 276, 244, 288, 260, 276, 252, 260, 284, 244, 1292, 280, 248, 276, 1304, 248, 296, 236, 292, 244, 296, 260, 252, 280, 1272, 248, 296, 236, 1316, 264, 264, 272, 268, 264, 268, 268, 1288, 232, 304, 240, 280, 264, 1296, 284, 1272, 248, 288, 260, 1276, 276, 248, 268, 284, 244, 288, 248, 304, 244, 276, 276, 264, 272, 260, 268, 1288, 236, 296, 236, 1308, 260, 284, 268, 260, 264, 1296, 236, 296, 260, 1280, 264, 276, 244, 292, 240, 312, 240, 296, 236, 288, 264, 264, 268, 272, 268, 1284, 240, 292, 244, 1312, 268, 264, 268, 268, 248, 296, 236, 300, 236, 1308, 260, 260, 268, 1308, 236, 296, 236, 300, 256, 256, 272, 1280, 264, 288, 228, 1312, 256, 268, 264, 10244, 244, 308, 244, 272, 280, 244, 288, 256, 280, 252, 280, 1280, 240, 292, 256, 1296, 268, 264, 276, 268, 248, 288, 244, 288, 244, 1296, 284, 236, 288, 1296, 248, 284, 248, 276, 272, 256, 280, 256, 284, 1284, 240, 292, 240, 1308, 272, 252, 280, 260, 260, 288, 240, 1300, 268, 256, 284, 248, 280, 1296, 244, 1300, 272, 244, 276, 1292, 240, 292, 244, 288, 244, 292, 264, 268, 284, 248, 284, 252, 284, 256, 252, 1308, 236, 284, 272, 1272, 276, 300, 228, 296, 244, 1292, 268, 260, 280, 1280, 240, 300, 240, 288, 240, 312, 260, 252, 276, 272, 264, 264, 268, 272, 244, 1312, 236, 272, 284, 1288, 260, 284, 244, 292, 240, 292, 240, 300, 256, 1272, 272, 268, 248, 1320, 236, 288, 272, 256, 280, 264, 264, 1292, 236, 292, 244, 1292, 272, 260, 276, 10212, 268, 256, 296, 244, 284, 248, 292, 248, 268, 276, 252, 1288, 276, 256, 276, 1292, 248, 288, 244, 288, 248, 292, 248, 268, 284, 1264, 268, 276, 248, 1316, 268, 248, 288, 244, 288, 248, 284, 252, 260, 1300, 244, 284, 268, 1288, 272, 276, 244, 288, 240, 292, 256, 1280, 280, 260, 268, 260, 272, 1304, 244, 1292, 280, 248, 284, 1276, 252, 284, 240, 284, 276, 252, 280, 280, 268, 256, 264, 280, 248, 292, 236, 1292, 272, 272, 268, 1284, 232, 328, 228, 296, 240, 1296, 276, 256, 272, 1280, 252, 288, 240, 280, 276, 264, 280, 268, 276, 248, 284, 268, 240, 296, 240, 1296, 272, 256, 272, 1312, 232, 296, 236, 304, 232, 288, 268, 268, 264, 1288, 244, 292, 228, 1320, 268, 260, 276, 256, 276, 268, 256, 1300, 236, 284, 268, 1276, 276, 268, 244, 10228, 276, 256, 292, 240, 292, 260, 252, 288, 244, 288, 248, 1288, 284, 240, 296, 1284, 248, 284, 248, 284, 280, 232, 292, 252, 280, 1280, 244, 288, 248, 1308, 280, 248, 292, 240, 272, 284, 236, 292, 240, 1296, 272, 260, 280, 1292, 248, 288, 240, 296, 244, 276, 280, 1264, 288, 252, 252, 284, 248, 1308, 284, 1260, 268, 276, 252, 1296, 272, 248, 280, 256, 280, 248, 280, 280, 252, 296, 236, 296, 236, 300, 228, 1304, 272, 272, 260, 1288, 232, 320, 260, 256, 280, 1276, 260, 272, 248, 1300, 268, 248, 292, 252, 276, 260, 292, 260, 248, 296, 240, 288, 244, 292, 248, 1288, 264, 268, 260, 1316, 240, 296, 252, 272, 268, 268, 264, 272, 260, 1288, 236, 300, 240, 1308, 268, 264, 276, 268, 244, 292, 244, 1296, 264, 276, 260, 1284, 240, 300, 236, 60788, 0, 1824, 0, 1664, 0, 2540, 0, 1336, 0, 2436, 0, 1320, 0, 2436, 0, 1148, 0, 452, 0, 2180, 0, 1220, 0, 2516, 184, 1052, 336, 2412, 392, 0, 264, 988, 232, 2156, 0, 1108, 116, 2496, 152, 408, 172, 244, 272, 232, 144, 2664, 2320, 0, 276, 2084, 836, 0, 620, 2388, 3304, 0, 284, 1432, 6432, 144, 208, 1324, 1992, 144, 204, 1580, 19500, 0, 316, 2044, 9912, 120, 0, 1976, 564, 116, 812, 112, 332, 1868, 11812, 168, 160, 1884, 6980, 128, 220, 1732, 22636, 288, 0, 1976, 208, 260, 260, 352, 1120, 1836, 7748, 164, 196, 1960, 6676, 324, 0, 1836, 1028, 196, 764, 0, 108, 1868, 12828, 124, 204, 1824, 1860, 132, 212, 1872, 5848, 2104, 20524, 304, 0, 1296, 480, 148, 512, 320, 340, 2056, 756, 544, 0, 252, 272, 2068, 6936, 0, 352, 1648, 372, 120, 660, 216, 848, 1800, 11196, 116, 180, 1540, 816, 204, 148, 212, 568, 2020, 10356, 240, 0, 1408, 2024, 132, 196, 1528, 3264, 144, 216, 1408, 236, 0, 4892, 100, 240, 1472, 1920, 148, 204, 1680, 4724, 2272, 2896, 136, 0, 1872, 3680, 100, 264, 2004, 25508, 224, 152, 1248, 2096, 256, 0, 1508, 488, 172, 636, 304, 152, 2184, 4876, 124, 244, 1764, 9740, 312, 0, 1888, 872, 156, 972, 1984, 5032, 124, 224, 1624, 8892, 304, 0, 1720, 5308, 1736, 1800, 2208, 952, 576, 612, 1840, 1204, 164, 336, 2300, 1240, 308, 556, 1884, 732, 120, 148, 184, 956, 1872, 1328, 132, 480, 2020, 9096, 136, 196, 1588, 3876, 2080, 216, 132, 772, 168, 576, 2152, 1924, 152, 196, 1752, 2360, 100, 288, 1360, 7292, 212, 144, 1320, 248, 0, 7020, 116, 236, 1248, 1932, 112, 220, 1796, 1736, 144, 180, 1940, 13224, 248, 0, 1472, 532, 0, 2288, 2032, 1832, 128, 164, 1804, 9832, 152, 124, 1896, 15280, 140, 216, 1444, 14212, 0, 252, 1396, 984, 148, 820, 116, 0, 1880, 404, 0, 740, 672, 264, 1864, 488, 120, 7332, 136, 224, 1712, 136, 0, 1236, 196, 544, 1820, 4220, 296, 0, 1516, 1328, 0, 536, 2068, 11488, 0, 324, 1288, 4196, 0, 288, 1316, 4396, 1028, 384, 144, 496, 1056, 484, 0, 384, 164, 368, 168, 364, 168, 440, 1096, 456, 0, 384, 1212, 344, 172, 404, 116, 412, 124, 408, 128, 404, 1176, 324, 188, 356, 1200, 416, 108, 396, 152, 344, 196, 340, 1204, 388, 128, 392, 148, 380, 1212, 332, 1204, 384, 128, 384, 1196, 316, 204, 328, 212, 336, 176, 368, 180, 368, 172, 364, 168, 348, 208, 308, 1240, 336, 180, 352, 1208, 308, 248, 308, 228, 308, 1232, 344, 168, 360, 1212, 304, 224, 304, 236, 324, 200, 356, 176, 356, 184, 352, 176, 324, 240, 296, 1248, 312, 200, 344, 1248, 284, 244, 288, 248, 292, 244, 292, 224, 324, 1228, 332, 204, 292, 1276, 312, 204, 332, 196, 336, 204, 328, 1236, 288, 244, 288, 1256, 312, 212, 324, 10160, 324, 192, 348, 188, 356, 188, 336, 212, 296, 240, 296, 1244, 332, 184, 340, 1252, 292, 240, 292, 244, 284, 244, 316, 204, 332, 1228, 288, 248, 292, 1272, 312, 208, 320, 216, 320, 212, 316, 236, 280, 1264, 300, 220, 320, 1252, 284, 256, 276, 256, 284, 248, 280, 1264, 308, 212, 312, 232, 280, 1292, 292, 1256, 296, 220, 300, 1260, 284, 252, 288, 236, 300, 228, 312, 240, 308, 236, 276, 264, 264, 268, 276, 1264, 296, 228, 304, 1256, 276, 280, 264, 264, 304, 1236, 300, 228, 284, 1284, 264, 260, 288, 236, 300, 252, 296, 236, 300, 236, 280, 264, 268, 268, 264, 1276, 292, 232, 300, 1276, 268, 272, 264, 264, 284, 240, 296, 248, 280, 1264, 268, 272, 264, 1288, 284, 248, 292, 240, 292, 252, 264, 1280, 292, 232, 300, 1252, 272, 272, 268, 10212, 296, 236, 300, 232, 280, 264, 276, 256, 272, 264, 268, 1272, 296, 232, 304, 1272, 268, 264, 284, 236, 300, 236, 296, 240, 292, 1264, 264, 272, 264, 1292, 292, 236, 292, 252, 264];

}).call(this);

},{}]},{},[1]);