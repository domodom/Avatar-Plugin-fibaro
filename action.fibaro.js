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
      var piece = ["salon", "chambre", "cuisine", "sdb", "couloir"];

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
      req_module = state.rawSentence.supprimer();

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
    var TERM = ["allume", "ouvre", "éteins", "éteint", "ferme", "donne", "le", "la", "du", "de", "coupe", "statut", "valeur", "salon", "chambre", "cuisine", "sdb","couloir" ];
    var str = this;
    for (var i = 0; i < TERM.length; i++) {
        var reg= new RegExp(TERM[i], "gi");
      //  var reg = new RegExp('\\b' + TERM[i] + '\\b\\s?');
        str = str.replace(reg, "").replace(':', '').trim();
    }
    return str;
};
