'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _helpers = require('../../node_modules/ava-ia/lib/helpers');

exports.default = function(state) {

  return new Promise(function(resolve, reject) {

      var request, req_value, req_room, req_module;

      var turn_on = ["allume", "ouvre"];
      var turn_off = ["éteins", "éteint", "ferme", "coupe"];
      var turn_state = ["statut", "valeur", "météo"];
      var piece = ["salon", "chambre", "cuisine", "sdb", "couloir", "bureau"];

      for (var i = 0; i < turn_on.length; i++) {
         if (state.rawSentence.indexOf(turn_on[i]) != -1 ) {
           request = "set";
           req_value = "true";
         };
      }
      for (var i = 0; i < turn_off.length; i++) {
         if (state.rawSentence.indexOf(turn_off[i]) != -1 ) {
           request = "set";
           req_value = "false";
         };
      }
      for (var i = 0; i < turn_state.length; i++) {
         if (state.rawSentence.indexOf(turn_state[i]) != -1 ) {
           request = "get";
           req_value = "";
         };
      }

      for (var i = 0; i < piece.length; i++) {
         if (state.rawSentence.indexOf(piece[i]) != -1 ) {
           req_room = piece[i];
         }
      }
      req_module = state.rawSentence.supprimer().reformat();

    /* pour la pièce en multiroom */
    var room = Avatar.ia.clientFromRule(state.rawSentence);

    for (var rule in Config.modules.fibaro.rules) {
      var match = (0, _helpers.syntax)(state.sentence, Config.modules.fibaro.rules[rule]);
      if (match) break;
    }

    if (state.debug) info('ActionFibaro'.bold.yellow, rule.yellow);

    setTimeout(function() {
      state.action = {
        module: 'fibaro',
        command: rule,
        request: request,
        req_value: req_value,
        req_room: req_room,
        req_module: req_module,
        room: room,
        sentence: state.rawSentence
      };
      resolve(state);
    }, 500);
  });
};

String.prototype.supprimer = function () {
    var TERM = ["allume", "allumer", "ouvre", "ouvrir", "éteins", "éteint", "éteindre", "ferme", "donne", "le", "la", "du", "de", "coupe", "statut", "valeur", "salon", "bureau", "chambre", "cuisine", "sdb","couloir" ];
    var str = this;
    for (var i = 0; i < TERM.length; i++) {
        var reg= new RegExp(TERM[i], "i");
      //  var reg = new RegExp('\\b' + TERM[i] + '\\b\\s?');
        str = str.replace(reg, "").replace(':', '').trim();
    }
    return str;
};

String.prototype.reformat = function(){
    var accent = [
        /[\300-\306]/g, /[\340-\346]/g, // A, a
        /[\310-\313]/g, /[\350-\353]/g, // E, e
        /[\314-\317]/g, /[\354-\357]/g, // I, i
        /[\322-\330]/g, /[\362-\370]/g, // O, o
        /[\331-\334]/g, /[\371-\374]/g, // U, u
        /[\321]/g, /[\361]/g, // N, n
        /[\307]/g, /[\347]/g, // C, c
        / /g, /'/g,
        /"/g
    ];
    var noaccent = ['A','a','E','e','I','i','O','o','U','u','N','n','C','c','_','_','_'];

    var str = this;
    for(var i = 0; i < accent.length; i++){
        str = str.replace(accent[i], noaccent[i]);
    }

    return str;
};
