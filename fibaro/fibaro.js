/* **********************************************************
 * Plugin Fibaro pour Avatar.IA
 * Permet de commander vocalement votre HomeCenter FIBARO
 * Eddy TELLIER
 * Version : 1.2.0
 * Date : 22/09/2018
 ************************************************************
 */

let status,
    debug,
    cyto,
    google_assistant,
    smartlife,
    sonoff,
    sentence,
    data_request,
    data_module,
    data_room,
    data_set,
    data_enabled,
    module_data;

const {Graph} = require('cyto-avatar');
const {remote} = require('electron');
const {Menu, BrowserWindow} = remote;
const fs = require('fs-extra');
const nodeType = "fibaro";

exports.init = function() {
    get_status();
};

exports.addPluginElements = function(CY) {
  if (Config.modules.fibaro.node.displayNode) {
    cyto = new Graph(CY, __dirname);
    cyto.loadAllGraphElements()
      .then(elems => {
        elems.forEach(function(ele) {
          if (ele.hasClass(nodeType)) {
            cyto.onClick(ele, (evt) => {
                showContextMenu(evt, module_data);
              })
              .then(elem => cyto.onRightClick(elem, (evt) => {
                showContextMenu(evt, module_data);
              }))
          }
        })
      })
      .catch(err => {
        warn('Error loading Elements', err);
      })
  } else {
    info ('Les modules ne sont pas visibles, vous pouvez mettre le paramètre displayNode dans le fichier de config sur (true) pour les affichés.')
  }
}

// Sauvegarde les modules (nodes) à la fermeture du serveur
exports.onAvatarClose = function(callback) {
  cyto.saveAllGraphElements(nodeType)
  .then(() => {
    callback();
  })
  .catch(err => {
    if (debug) warn('Error saving Elements', err)
    callback();
  })
}

exports.action = function(data, callback) {

  let client = data.client;
      sentence = data.action.sentence;
      debug = Config.modules.fibaro.debug;

      smartlife = Config.modules.fibaro.smartlife;
      sonoff = Config.modules.fibaro.sonoff;
      google_assistant = Config.modules.fibaro.google_assistant;

      data_request = data.action.request;
      data_module = data.action.req_module;
      data_room = data.action.req_room;
      data_set = data.action.req_value;
      data_enabled = data.action.req_enabled;


  if (!data_room) data_room = data.client.toLowerCase();

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
    weather: function() {
        get_weather(data_request, data, callback, client);
    },

    wakeup: function(){
        data_request = "set";
        data_module = Config.modules.fibaro.reveil.module;
        data_room = Config.modules.fibaro.reveil.room;
        data_set = Config.modules.fibaro.reveil.open;
        get_rooms(data_request, data, callback, client);
    }

  };
    if (debug) info('FIBARO v', Config.modules.fibaro.version, ' Sentence:', sentence, ' Module:', data_module, ' Pièce:', data_room, " Command: ",  data.action.command, " From: ", data.client, " To: ", client);


  tblCommand[data.action.command]();
  callback();
};

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

};

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
      get_icons(jsonrooms, json, action, data, client);
    });
  }).on('error', function(e) {
    Avatar.speak('Une erreur s\'est produite !', client, function() {
      Avatar.Speech.end(client);
    });
  });

};

var get_icons = function(jsonrooms, json, action, data, client) {
  var http = require('http');
  var options = {
    hostname: Config.modules.fibaro.ip,
    port: Config.modules.fibaro.port,
    path: '/api/icons',
    auth: Config.modules.fibaro.user + ':' + Config.modules.fibaro.password
  };

  http.get(options, function(res) {
    var buffer = '';
    res.on('data', function(chunk) {
      buffer += chunk;
    });

    res.on('end', function() {
      var jsonicons = JSON.parse(buffer);
      get_scenes(jsonrooms, json, jsonicons, action, data, client);
    });
  }).on('error', function(e) {
    Avatar.speak('Une erreur s\'est produite !', client, function() {
      Avatar.Speech.end(client);
    });
  });

};

var get_scenes = function(jsonrooms, json, jsonicons, action, data, client) {
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
      set(jsonrooms, json, jsonicons, data, client);
    });
  }).on('error', function(e) {
    Avatar.speak('Une erreur s\'est produite !', client, function() {
      Avatar.Speech.end(client);
    });
  });
};


var get_weather = function(action, data, callback, client) {
    var http = require('http');
    var options = {
        hostname: Config.modules.fibaro.ip,
        port: Config.modules.fibaro.port,
        path: '/api/weather',
        auth: Config.modules.fibaro.user + ':' + Config.modules.fibaro.password
    };

    http.get(options, function(res) {
        var buffer = '';
        res.on('data', function(chunk) {
            buffer += chunk;
        });

        res.on('end', function() {
            var jsonweather = JSON.parse(buffer);
            Avatar.speak('Météo via la fibaro, température : '+ jsonweather.Temperature + '°C, l\'humidité est de : '+jsonweather.Humidity+ ' avec un vent de : '+jsonweather.Wind+' '+jsonweather.WindUnit, client, function() {
                Avatar.Speech.end(client);
            });
        });
    }).on('error', function(e) {
        Avatar.speak('Une erreur s\'est produite !', client, function() {
            Avatar.Speech.end(client);
        });
    });
};


var get = function(jsonrooms, json, jsonicons, data, client) {
  for (var i = 0; i < jsonrooms.length; i++) {
    var rooms = jsonrooms[i];
    var tokens = rooms.name.split(' ');
    var found = true;
    for (var j = 0; found && j < tokens.length; j++) {
      found = new RegExp(tokens[j], 'i').test(data_room);
    }
    if (debug) info(" Pièces trouvées : " + rooms.name);
    if (found) {
      for (var i = 0; i < json.length; i++) {
        var module = json[i];
        var tokens = module.name.split(' ');
        var found = true;
        if (rooms.id == module.roomID) {
          for (var j = 0; found && j < tokens.length; j++) {
            found = new RegExp(tokens[j], 'i').test(data_module);
          }
          if (debug) info(" Modules trouvés : " + module.name);
          if (found) {
            return setTimeout((function() {
                speakType(module, rooms, client);
            }), 250);
          } else {
            Avatar.speak('Je n\'ai rien trouvé !', client, function() {
              Avatar.Speech.end(client);
            });
          }
        }
      }
    }
  }
};

var set = function(jsonrooms, json, jsonicons, data, client) {
let iconeName = 'pc' ;

  for (var i = 0; i < jsonrooms.length; i++) {
    var rooms = jsonrooms[i];
    var tokens = rooms.name.split(' ');
    var found = true;
    for (var j = 0; found && j < tokens.length; j++) {
      found = new RegExp(tokens[j], 'i').test(data_room);
    }


    if (found) {
      if (debug) info('Pièce trouvée : ' + rooms.name);
      for (var i = 0; i < json.length; i++) {
        var module = json[i];
        var tokens = module.name.split(' ');
        var found = true;
        if (rooms.id == module.roomID) {
          for (var j = 0; found && j < tokens.length; j++) {
            found = new RegExp(tokens[j], 'i').test(data_module);
          }

          for (var k = 0; k < jsonicons.device.length; k++) {
            if (jsonicons.device[k].id == module.properties.deviceIcon) {
            iconeName = jsonicons.device[k].iconSetName;
          }
        }
          if (found) {

            if (debug) info ('Module trouvé : ', module.name);

            fs.access('./resources/core/plugins/fibaro/assets/images/modules/'+iconeName +'.png', fs.F_OK, (err) => {
              if (err) { saveImageToDisk(iconeName); }
            })

            if (data_request == "set") {
              var http = require('http');
              var options = {
                hostname: Config.modules.fibaro.ip,
                port: Config.modules.fibaro.port,
                path: '/api/callAction?deviceID=' + module.id + "&name=" + get_value(module, data_set),
                auth: Config.modules.fibaro.user + ':' + Config.modules.fibaro.password
              };
            } else {
              if (debug) info('Exécuter scene');
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
                module_data = { "name": module.name, "room": rooms.name, "icone": iconeName, "set": data_set } ;
                  addFibaroGraph(module_data);
                setTimeout((function() {
                  speakType(module, rooms, client);
                }), 250);
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

  if (debug) info('Je n\'ai pas trouvé de module correspondant dans la HomeCenter.');

// Si activé dans la configuration, je passe la commande aux plugins
  if (smartlife){
    info('La commande à été envoyée au plugin SmartLife');
    Avatar.trigger('smartlife', { module: data_module, room: data_room, set: data_set, client: client });
  }
  if (sonoff){
    info('La commande à été envoyée au plugin SonOff');
    Avatar.trigger('sonoff', { module: data_module, room: data_room, set: data_set, client: client });
  }
  if (google_assistant) {
      info('La commande à été envoyée au plugin Google-Assistant');
      Avatar.trigger('GoogleHome',{ client: data.client, sentence: sentence, callback: function (response, continueConversation) {
              if (response) {
                  Avatar.speak(response, data.client, function() {
                      if (!continueConversation)
                          Avatar.Speech.end(data.client);
                  })
              } else {
                  response = "La commande a été exécutée avec succès.";
                  Avatar.speak(response, data.client, function() {
                      if (!continueConversation)
                          Avatar.Speech.end(data.client);
                  })
              }
          }});
  }
}


var get_value = function(module, value) {
  switch (module.type) {
    case 'com.fibaro.binarySwitch':
      return (value == false ? 'turnOff' : 'turnOn');
      break;
    case 'com.fibaro.multilevelSwitch':
      if (value == 'true' || value == 'false') {
        return (value == false ? 0 : 99);
      } else {
        return value;
        break;
      }
    case 'com.fibaro.rollerShutter':
      if (value == 'true' || value == 'false') {
        return (value == false ? 0 : 99);
      } else {
        return value;
        break;
      }
    case 'com.fibaro.motionSensor':
      return (value == false ? 0 : 1);
      break;

    case 'com.fibaro.FGS211':
      return (value == false ? 0 : 1);
      break;
    case 'com.fibaro.FGK101':
      return (value == false ? 0 : 1);
      break;
    case 'com.fibaro.FGS221':
      return (value == false ? 0 : 1);
      break;
    case 'com.fibaro.FGD211':
      if (value == true || value == false) {
        return (value == false ? 0 : 99);
      } else {
        return value;
        break;
      }
    case 'com.fibaro.FGR221':
      if (value == true || value == false) {
        return (value == false ? 'turnOff' : 'turnOn');
      } else {
        return value;
        break;
      }
    case 'com.fibaro.FGWPE101':
      if (value == true || value == false) {
        return (value == false ? 0 : 1);
      } else {
        return value;
        break;
      }
  }
};

// RECUPERE LES INFOS UNITE DU MODULE
var get_unit = function(module) {
  var unit = module.properties.unit;
  if (unit == "") unit = module.properties.unitSensor ;
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
};

// SPEAK SELON TYPE DU MODULE
var speakType = function(module, rooms, client) {
  switch (module.type) {
    case 'com.fibaro.temperatureSensor':
      Avatar.speak('la ' + module.name + ' ' + rooms.name + ' est de ' + module.properties.value + get_unit(module), client, function() {
        Avatar.Speech.end(client);
      });
      break;
    case 'com.fibaro.binarySwitch':
      var str = module.name + " est " + (data_set == false ? ' éteint' : ' allumé');
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
    Avatar.speak((module.properties.value == '0' ? ' pas de mouvements sur ' : ' detection présence sur') + module.name + ' ' + rooms.name, client, function() {
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
    case 'com.fibaro.FGR221':
        Avatar.speak(module.name + (module.properties.value == 'false' ? ' est éteint' : ' est allumé '), client, function() {
            Avatar.Speech.end(client);
        });
      break;
    default:
      //speakType(module, rooms, client);
        Avatar.Speech.end(client);
  }
};


// INFORMATION SUR LE STATUT DE LA HOMECENTER
var get_status = function() {
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
      if (debug) info ("Fibaro HomeCenter 2 : " + status);
    });
  }).on('error', function(e) {
    status = 'Hors ligne';
    if (debug) info ("Fibaro HomeCenter 2 : " + status);
  });
  return status;
};

var setClient = function(data) {
  var client = data.client;
  if (data.action.room)
    client = (data.action.room != 'current') ? data.action.room : (Avatar.currentRoom) ? Avatar.currentRoom : Config.default.client;
  if (data.action.setRoom)
    client = data.action.setRoom;
  return client;
};



/* PARTIE POUR AFFICHER UN NODE SUR LA PARTIE SERVEUR */

function addFibaroGraph(module_data) {
    let style = { };
    let id;

    id = module_data.name.toLowerCase() + '_' + module_data.room.toLowerCase();

    style.x = 150;
    style.y = 150;
    style.img = '';

cyto.removeGraphElementByID(id);

 if ((Config.modules.fibaro.node.delNodeAfterCommand) && (module_data.set == false)) {
   return;
 } else {
              if (fs.existsSync('./resources/core/plugins/fibaro/modules.json')) {
                let prop = fs.readJsonSync('./resources/core/plugins/fibaro/modules.json', { throws: false });
                if (prop[id]) {
                    style.x = prop[id].x;
                    style.y = prop[id].y;
                }
              }

              if (fs.existsSync('./resources/core/plugins/fibaro/assets/nodes/'+ module_data.name +'.json')) {
                let prop = fs.readJsonSync('./resources/core/plugins/fibaro/assets/nodes/'+ module_data.name +'.json', { throws: false });
                if (prop) {
                    style.x = prop.position.x;
                    style.y = prop.position.y;
                }
              }

  return new Promise((resolve, reject) => {
    cyto.getGraph()
    .then(cy => cyto.addGraphElement(cy, id))
    .then(elem => cyto.addElementName(elem, id))
    .then(elem => cyto.addElementClass(elem, nodeType))
    .then(elem => cyto.addElementImage(elem, __dirname + '/assets/images/modules/' + module_data.icone + '.png'))
    .then(elem => cyto.addElementSize(elem, 45))
    .then(elem => cyto.selectElement(elem, false))
    .then(elem => cyto.addElementRenderedPosition(elem, style.x, style.y))
    .then(elem => cyto.onClick(elem, (evt) => {
          // cyto.selectElement(evt, !cyto.isElementSelected(evt))
          showContextMenu(evt, module_data);
    }))

    .then(elem => {
        resolve(elem);
    })
    .catch(err => {
      reject();
    })
  })
}
}

// menu contextuel pour les modules
function showContextMenu(elem, module_data) {

let id = elem.id();

        data_room = id.substring(id.lastIndexOf("_"));
        data_room = data_room.replace('_','');
        data_module = id.slice(0,id.indexOf("_"));

    let pluginMenu = [
      {
          label: 'Allumer / Ouvrir',
          icon: 'resources/app/images/icons/activate.png',
          click: () => {
            data_request = 'set';
            data_set = true;

            get_rooms(data_request, null, null, Config.default.client);
            mute_Client(Config.default.client);
          }
      },
      {
          label: 'Eteindre / Fermer',
          icon: 'resources/app/images/icons/desactivate.png',
          click: () => {
            data_request = 'set'; data_set = false;
            get_rooms(data_request, null, null, Config.default.client);
            mute_Client(Config.default.client);
          }
      },
      {type: 'separator'},
      {
          label: 'Paramètres',
          icon: 'resources/app/images/icons/settings.png',
          click: () => {Avatar.Interface.nodeSettings()}
      },
      {type: 'separator'},
      {
          label: 'Sauvegarder',
          icon: 'resources/app/images/icons/save.png',
          click: () => { Avatar.Interface.onAvatarClose(0, function() {
                        let module_data = {"name": data_module, "room": data_room };
            saveModuleNode(module_data, elem);
            if (debug) info (elem.id() + ' sauvegardé !');
        })}
      },
      {
          label: 'Effacer',
          icon: 'resources/app/images/icons/trash.png',
          click: () => {
            cyto.removeGraphElementByID(elem.id());
            if (debug) info (elem.id() + ' à été éffacé !');
          }
      }
    ];

    // Création du menu
    var handler = function (e) {
      e.preventDefault();
      menu.popup({window: remote.getCurrentWindow()});
      window.removeEventListener('contextmenu', handler, false);
    }
    const menu = Menu.buildFromTemplate(pluginMenu);
    window.addEventListener('contextmenu', handler, false);
}

// Sauvegarde les infos des modules dans le fichier modules.json
// Cette fonction est appelée lorsque vous enregistrez individuellement les modules (clic droit).
// Enregistre l'emplacement du module, utilsée pour réafficher à l'emplacement enregistré !

function saveModuleNode(module_data, elem) {
  let id = elem.id();

    let moduleJSON = fs.readJsonSync('./resources/core/plugins/fibaro/modules.json', 'utf-8', (err) => {
      if (err) throw err;
      info('Le fichier n\'existe pas');
    });

    moduleJSON[id] = { };
    moduleJSON[id].name = module_data.name;
    moduleJSON[id].room = module_data.room;
    moduleJSON[id].icon = module_data.icon;
    moduleJSON[id].x = elem.renderedPosition('x');
    moduleJSON[id].y = elem.renderedPosition('y');

   fs.writeFileSync('./resources/core/plugins/fibaro/modules.json', JSON.stringify(moduleJSON, null, 4), 'utf8');

}

// Enregistre l'image correspondante au modules
function saveImageToDisk(iconeName) {
  let fs = require('fs');
  let http = require('http');

  let url = 'http://' + Config.modules.fibaro.ip + ':' + Config.modules.fibaro.port + '/fibaro/icons/';
  let path = './resources/core/plugins/fibaro/assets/images/modules/'+iconeName+'.png';

if (iconeName.indexOf('User') != -1) {
  url = url + iconeName + '/' + iconeName + '0.png';
} else {
  url = url + iconeName + '/' + iconeName + '100.png';
}

  let file = fs.createWriteStream(path);
  let request = http.get(url, function(response) {
    response.pipe(file);
  });
}

// lors de l'action sur un node, test la valeur de muteOnOffClient
function mute_Client (client) {
  let muteClient = fs.readJsonSync('./resources/core/muteClient.json', 'utf-8', (err) => {
          if (err) throw err;
          if (debug) info('Le fichier muteClient.json n\'existe pas');
  });
          if (muteClient[client] == true) {
                setTimeout(function () {
                Avatar.call('generic', {command: 'muteOnOffClient', set : '0', client: client});
        }, 10000);
      }
}
