/* **********************************************************
 * Plugin Fibaro pour Avatar.IA
 * Permet de commander vocalement votre HomeCenter FIBARO
 * Eddy TELLIER
 * Release Version : 1.0.0
 * Date Release : 22/09/2018
 ************************************************************
 */

var status;
var data_request, data_module, data_room, data_value;
exports.init = function() {
  fibaro = status();
}

exports.action = function(data, callback) {
  var sentence = data.action.sentence;
  var client = setClient(data);

  data_request = data.action.request;
  data_module = data.action.req_module;
  data_room = data.action.req_room;
  data_value = data.action.req_value;

  if (data_room == "") data_room = client;

  if (Config.modules.fibaro.info == true) info(' FIBARO - Module : ' + data_module + ' Pièce : ' + data_room);
  var tblCommand = {
    turn_on: function() {
      get_rooms(data_request, data, callback, client);
    },
    turn_off: function() {
      get_rooms(data_request, data, callback, client);
    },
    status: function() {
      get_rooms(data_request, data, callback, client);
    },
    run_scene: function() {
      get_rooms(data_request, data, callback, client);
    }

  }

  info("FIBARO Command : ", data.action.command.yellow, " From : ", data.client.yellow, " To : ", client.yellow);
  tblCommand[data.action.command]();
  callback();
}

// Fonction rooms
var get_rooms = function(action, data, callback, client) {
  var http = require('http');
  var options = {
    hostname: Config.modules.fibaro.ip,
    port: Config.modules.fibaro.port,
    path: '/api/rooms',
    auth: Config.modules.fibaro.user + ':' + Config.modules.fibaro.password
  };

  http.get(options, function(res) {
    var buffer = '';
    res.on('data', function(chunk) {
      buffer += chunk;
    });

    res.on('end', function() {
      var jsonrooms = JSON.parse(buffer);
      get_modules(jsonrooms, action, data, client);
    });
  }).on('error', function(e) {
    Avatar.speak('Une erreur s\'est produite !', client, function() {
      Avatar.Speech.end(client);
    });
  });

}

// Fonction activation module
var get_modules = function(jsonrooms, action, data, client) {
  var http = require('http');
  var options = {
    hostname: Config.modules.fibaro.ip,
    port: Config.modules.fibaro.port,
    path: '/api/devices',
    auth: Config.modules.fibaro.user + ':' + Config.modules.fibaro.password
  };

  http.get(options, function(res) {
    var buffer = '';
    res.on('data', function(chunk) {
      buffer += chunk;
    });

    res.on('end', function() {
      var json = JSON.parse(buffer);
      get_scenes(jsonrooms, json, action, data, client);
    });
  }).on('error', function(e) {
    Avatar.speak('Une erreur s\'est produite !', client, function() {
      Avatar.Speech.end(client);
    });
  });

}

// Fonction activation scène en attente
var get_scenes = function(jsonrooms, json, action, data, client) {
  var http = require('http');
  var options = {
    hostname: Config.modules.fibaro.ip,
    port: Config.modules.fibaro.port,
    path: '/api/scenes',
    auth: Config.modules.fibaro.user + ':' + Config.modules.fibaro.password
  };

  http.get(options, function(res) {
    var buffer = '';
    res.on('data', function(chunk) {
      buffer += chunk;
    });

    res.on('end', function() {
      json = json.concat(JSON.parse(buffer));
      set(jsonrooms, json, data, client);
    });
  }).on('error', function(e) {
    Avatar.speak('Une erreur s\'est produite !', client, function() {
      Avatar.Speech.end(client);
    });
  });
}

// Fonction get (récupération d'information)
var get = function(jsonrooms, json, data, client) {
  for (var i = 0; i < jsonrooms.length; i++) {
    var rooms = jsonrooms[i];
    var tokens = rooms.name.split(' ');
    var found = true;
    for (var j = 0; found && j < tokens.length; j++) {
      found = new RegExp(tokens[j], 'i').test(data_room);
    }
    if (Config.modules.fibaro.info == true) info(" Pièces trouvées : " + rooms.name);
    if (found) {
      for (var i = 0; i < json.length; i++) {
        var module = json[i];
        var tokens = module.name.split(' ');
        var found = true;
        if (rooms.id == module.roomID) {
          for (var j = 0; found && j < tokens.length; j++) {
            found = new RegExp(tokens[j], 'i').test(data_module);
          }

          if (Config.modules.fibaro.info == true) info(" Modules trouvés : " + module.name);
          if (found) {
            return speakBaseType(module, client);
          } else {
            Avatar.speak('Je n\'ai rien trouvé !', client, function() {
              Avatar.Speech.end(client);
            });
          }
        }
      }
    }
  }
}

var set = function(jsonrooms, json, data, client) {
  for (var i = 0; i < jsonrooms.length; i++) {
    var rooms = jsonrooms[i];
    var tokens = rooms.name.split(' ');
    var found = true;
    for (var j = 0; found && j < tokens.length; j++) {
      found = new RegExp(tokens[j], 'i').test(data_room);
    }

    if (Config.modules.fibaro.info == true) info("Pièces trouvées : " + rooms.name + ": " + found);
    if (found) {
      for (var i = 0; i < json.length; i++) {
        var module = json[i];
        var tokens = module.name.split(' ');
        var found = true;
        if (rooms.id == module.roomID) {
          for (var j = 0; found && j < tokens.length; j++) {
            found = new RegExp(tokens[j], 'i').test(data_module);
          }
          if (found) {
            if (data_request == "set") {
              var http = require('http');
              var options = {
                hostname: Config.modules.fibaro.ip,
                port: Config.modules.fibaro.port,
                path: '/api/callAction?deviceID=' + module.id + "&name=setValue&arg1=" + get_value(module, data_value),
                auth: Config.modules.fibaro.user + ':' + Config.modules.fibaro.password
              };
            } else {
              if (Config.modules.fibaro.info == true) info('Exécuter scene');
              var http = require('http');
              var options = {
                hostname: Config.modules.fibaro.ip,
                port: Config.modules.fibaro.port,
                path: '/api/sceneControl?id=' + module.id + "&14&action=start",
                auth: Config.modules.fibaro.user + ':' + Config.modules.fibaro.password
              };
            }

            http.get(options, function(res) {
              var buffer = '';
              res.on('data', function(chunk) {
                buffer += chunk;
              });

              res.on('end', function() {
                setTimeout((function() {
                  speakBaseType(module, rooms, client);
                }), 50);
              });
            }).on('error', function(e) {
              Avatar.speak('Une erreur c\'est produite', client, function() {
                Avatar.Speech.end(client);
              });
            });

            return
          }
        }
      }
    }
  }

  if (Config.modules.fibaro.info == true) info('Je n\'ai rien trouvé !');
  Avatar.speak('Je n\'ai pas pu éxécuter cette action ! ', client, function() {
    Avatar.Speech.end(client);
  });
}


var get_value = function(module, value) {
  switch (module.type) {
    case 'com.fibaro.binarySwitch':
      return (value == 'false' ? 0 : 1);
      break;
    case 'com.fibaro.multilevelSwitch':
      if (value == 'true' || value == 'false') {
        return (value == 'false' ? 0 : 99);
      } else {
        return value;
        break;
      }
    case 'com.fibaro.rollerShutter':
      if (value == 'true' || value == 'false') {
        return (value == 'false' ? 0 : 99);
      } else {
        return value;
        break;
      }
    case 'com.fibaro.motionSensor':
      return (value == 'false' ? 0 : 1);
      break;

    case 'com.fibaro.FGS211':
      return (value == 'false' ? 0 : 1);
      break;
    case 'com.fibaro.FGK101':
      return (value == 'false' ? 0 : 1);
      break;
    case 'com.fibaro.FGS221':
      return (value == 'false' ? 0 : 1);
      break;
    case 'com.fibaro.FGD211':
      if (value == 'true' || value == 'false') {
        return (value == 'false' ? 0 : 99);
      } else {
        return value;
        break;
      }
    case 'com.fibaro.FGR221':
      if (value == 'true' || value == 'false') {
        return (value == 'false' ? 0 : 99);
      } else {
        return value;
        break;
      }
    case 'com.fibaro.FGWPE101':
      if (value == 'true' || value == 'false') {
        return (value == 'false' ? 0 : 1);
      } else {
        return value;
        break;
      }
  }
}

// RECUPERE LES INFOS UNITE DU MODULE
var get_unit = function(module) {
  var unit = module.properties.unit;
  if (unit == "") unit = module.properties.unitSensor
  switch (unit) {
    case 'W':
      return ' watt';
    case '%':
      return ' pour cent';
    case 'C':
      return ' degrés';
    case 'F':
      return ' fahrenheit';
    case 'Lux':
      return ' Lux';
    default:
      return ' ';
  }
}

// SPEAK SELON BASETYPE DU MODULE
var speakBaseType = function(module, rooms, client) {
  switch (module.Basetype) {
    case 'com.fibaro.temperatureSensor':
      Avatar.speak('la ' + module.name + ' ' + rooms.name + ' est de ' + module.properties.value + get_unit(module), client, function() {
        Avatar.Speech.end(client);
      });
      break;
    case 'com.fibaro.binarySwitch':
      var str = module.name + " est " + (module.properties.value == '0' ? ' éteint' : ' allumé');
      if (module.properties.valueSensor && module.properties.valueSensor != "") str += ' et la consommation est de ' + returnString(module.properties.valueSensor, ".", ",") + get_unit(module);
      Avatar.speak(str, client, function() {
        Avatar.Speech.end(client);
      });
      break;
    case 'com.fibaro.multilevelSwitch':
      Avatar.speak(module.properties.value == '0' ? 'c\'est éteint' : 'c\'est allumé à ' + module.properties.value + ' pour cent', client, function() {
        Avatar.Speech.end(client);
      });
      break;
    case 'com.fibaro.humiditySensor':
      Avatar.speak('le taux d\'humidité est de ' + module.properties.value + get_unit(module), client, function() {
        Avatar.Speech.end(client);
      });
      break;
    case 'com.fibaro.lightSensor':
      Avatar.speak('la ' + module.name + ' est de ' + module.properties.value + get_unit(module), client, function() {
        Avatar.Speech.end(client);
      });
      break;
    case 'com.fibaro.multilevelSensor':
      Avatar.speak('la valeur de ' + module.name + ' est de ' + module.properties.value + get_unit(module), client, function() {
        Avatar.Speech.end(client);
      });
      break;
    case 'com.fibaro.doorSensor':
      Avatar.speak(module.name + (module.properties.value == '0' ? ' est fermé' : ' est ouvert '), client, function() {
        Avatar.Speech.end(client);
      });
      break;
    case 'com.fibaro.motionSensor':
    Avatar.speak((module.properties.value == '0' ? ' pas de mouvements sur ' : ' detection présence sur') + module.name, client, function() {
      Avatar.Speech.end(client);
    });
      break;
    case 'com.fibaro.seismometer':
    Avatar.speak('la valeur du ' + module.name + ' est de ' + module.properties.value + get_unit(module), client, function() {
      Avatar.Speech.end(client);
    });
      break;
    case 'virtual_device':
    Avatar.speak('Pas de données pour le moment ...', client, function() {
      Avatar.Speech.end(client);
    });
      break;
    default:
      speakType(module, rooms, client);
  }
}


// SPEAK SELON TYPE DE MODULE
var speakType = function(module, rooms, client) {
  switch (module.type) {
    case 'com.fibaro.FGR221':
      if (data_value == 'true') {
        Avatar.speak(module.name + " " + rooms.name + ' allumée', client, function() {
          Avatar.Speech.end(client);
        });
      }
      if (data_value == 'false') {
        Avatar.speak(module.name + " " + rooms.name + ' éteinte', client, function() {
          Avatar.Speech.end(client);
        });
      }
      if (data_value == '') {
        Avatar.speak(module.name + " " + rooms.name + (module.properties.value == '0' ? ' éteinte' : ' allumée '), client, function() {
          Avatar.Speech.end(client);
        });
      }
      break;
    case 'virtual_device':
      break;
    default:
      Avatar.speak('Je n\'ai pas pu exécuter cette action', client, function() {
        Avatar.Speech.end(client);
      });
  }
}

// INFORMATION SUR LE STATUT DE LA HOMECENTER
var status = function() {
  var http = require('http');
  var options = {
    hostname: Config.modules.fibaro.ip,
    port: Config.modules.fibaro.port,
    path: '/api/devices',
    auth: Config.modules.fibaro.user + ':' + Config.modules.fibaro.password
  };

  http.get(options, function(res) {
    res.on('data', function(chunk) {});
    res.on('end', function() {
      status = 'En ligne';
      if (Config.modules.fibaro.info == true) info("Fibaro HomeCenter 2 : " + status);
    });
  }).on('error', function(e) {
    status = 'Hors ligne';
    if (Config.modules.fibaro.info == true) info("Fibaro HomeCenter 2 : " + status);
  });
  return status;
}

var setClient = function(data) {
  var client = data.client;
  if (data.action.room)
    client = (data.action.room != 'current') ? data.action.room : (Avatar.currentRoom) ? Avatar.currentRoom : Config.default.client;
  if (data.action.setRoom)
    client = data.action.setRoom;
  return client;
}
