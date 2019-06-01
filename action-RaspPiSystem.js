#!/usr/bin/env node

/**
 * Documentation
 * @requires mqtt   Need to install mqtt library ">$ npm install mqtt --save"
 * @requires child_process   Need to execute the system commands
 * @var announceTimer   timer to announce le time before to execute "shutdown" system command
 * @var shutdownTimer   timer to execute "shutdown" system command
 * @var systemStatus    status of the system (default="on")
 */

var mqtt = require('mqtt');
var exec = require('child_process').exec;
var spawn = require('child_process').spawn;
var announceTimer;
var shutdownTimer;
var systemStatus="on";


/**
 * Documentation
 * @constant hostmane   IP or hostname of the Raspberry Pi (default="localhost")
 * @constant port       Port connection of the Raspberry Pi (default=1883)
 * @constant INTENT_*   Intent(s) to listen to
 */

const raspi = {
    hostname: "localhost",
    port: 1883
}
const INTENT_SHUTDOWN_SYSTEM = "Snips-RS-User:askShutdownSystem";
const INTENT_RESTART_SYSTEM = "Snips-RS-User:askRestartSystem";
const INTENT_CANCEL_SHUTDOWN_SYSTEM = "Snips-RS-User:askCancelShutdownSystem";
const INTENT_YES = "Snips-RS-User:answerYes";
const INTENT_NO = "Snips-RS-User:answerNo";
const INTENT_SYSTEM_TEMPERATURE = "Snips-RS-User:askSystemTemperature";
const INTENT_START_WIFI = "Snips-RS-User:askStartWifi";
const INTENT_STOP_WIFI = "Snips-RS-User:askStopWifi";


/**
 * Documentation
 * Connection to the Raspberry Pi
 * Listener to intents
 */

var client = mqtt.connect('mqtt://' + raspi.hostname, raspi.port);

client.on('connect', function () {
    console.log("[Snips Log] Connected to MQTT broker " + raspi.hostname + ":" + raspi.port);
    if (client.subscribe('hermes/#')) {
        console.log("[Snips Log] Subscription to /hermes/# is OK");
    } else {
        console.log("[Snips Log] ERROR - Subscription to /hermes/# is KO");
    }
});


client.on('message', function (topic, payload) {
    if (topic.match(/hermes\/intent\/.+/g) !== null) {
        onIntentDetected(JSON.parse(payload));
    }
});


/**
 * Documentation
 * @function execute    
 * @param {*} command   
 * @description Execute the shell "command" 
 */

var execute = function (command) {
    exec(command, function (err, stdout, stderr) {
        if (err) {
            console.error(err);
        } else {
            console.log(stdout);
        }
    });
}


/**
 * Documentation
 * @function publishTTS
 * @description Announce a message TTS with Snips
 */
var publishTTS = function (message) {
    var sentence = JSON.stringify({ siteId: 'default', init: { type: 'notification', text: message }});
    /** LOG description of the sended sentence */
    console.log("[Snips Log] TTS: sentence=" + message);
    client.publish('hermes/dialogueManager/startSession', sentence);
}


/**
 * Documentation
 * @function onIntentDetected
 * @param {*} payload
 * @returns
 * @description Main actions when the listener is detected
 */

var onIntentDetected = function (payload) {
    /** LOG description of the detected intent */
    console.log("[Snips Log] Intent detected: sessionId=" + payload.sessionId + " - siteId=" + payload.siteId);
    console.log("[Snips Log] Intent detected: IntentName=" + payload.intent.intentName + " - Slots=" + JSON.stringify(payload.slots) + " - confidenceScore=" + payload.intent.confidenceScore);
    /** ACTION if INTENT_SHUTDOWN_SYSTEM */
    if (payload.intent.intentName == INTENT_SHUTDOWN_SYSTEM) {
        if (systemStatus == "on") {
            var ttsText = "Voulez vous vraiment arrêter le système ?";
            var customParam = JSON.stringify({ sessionId: payload.sessionId, contextFunction: "ShutdownSystemDemand" });
            var sentence = JSON.stringify({ sessionId: payload.sessionId, text: ttsText, intentFilter: [INTENT_YES, INTENT_NO], customData: customParam });
            /** LOG description of the sended sentence */
            console.log("[Snips Log] TTS: sentence=" + ttsText);
            client.publish('hermes/dialogueManager/continueSession', sentence);
        } else {
            if (systemStatus == "restarting") {
                var ttsText = "Le système est déjà en cours de redémarrage.";
            } else {
                if (systemStatus == "stopping") {
                    var ttsText = "Le système est déjà en cours d'arrêt.";
                } else {
                    var ttsText = "Le système est dans une situation inconnue.";
                }
            }
            var sentence = JSON.stringify({ sessionId: payload.sessionId, text: ttsText });
            client.publish('hermes/dialogueManager/endSession', sentence);
        }
    }
    /** ACTION if INTENT_RESTART_SYSTEM */
    if (payload.intent.intentName == INTENT_RESTART_SYSTEM) {
        if (systemStatus == "on") {
            var ttsText = "Voulez vous vraiment redémarrer le système ?";
            var customParam = JSON.stringify({ sessionId: payload.sessionId, contextFunction: "RestartSystemDemand" });
            var sentence = JSON.stringify({ sessionId: payload.sessionId, text: ttsText, intentFilter: [INTENT_YES, INTENT_NO], customData: customParam });
            /** LOG description of the sended sentence */
            console.log("[Snips Log] TTS: sentence=" + ttsText);
            client.publish('hermes/dialogueManager/continueSession', sentence);
        } else {
            if (systemStatus == "restarting") {
                var ttsText = "Le système est déjà en cours de redémarrage.";
            } else {
                if (systemStatus == "stopping") {
                    var ttsText = "Le système est déjà en cours d'arrêt.";
                } else {
                    var ttsText = "Le système est dans une situation inconnue.";
                }
            }
            var sentence = JSON.stringify({ sessionId: payload.sessionId, text: ttsText });
            client.publish('hermes/dialogueManager/endSession', sentence);
        }
    }
    /** ACTION if INTENT_CANCEL_SHUTDOWN_SYSTEM */
    if (payload.intent.intentName == INTENT_CANCEL_SHUTDOWN_SYSTEM) {
        if (systemStatus == "on") {
            var ttsText = "Le système n'est pas en cours d'arrêt ou de redémarrage.";
            /** LOG description of the sended sentence */
            console.log("[Snips Log] TTS: sentence=" + ttsText);
            var sentence = JSON.stringify({ sessionId: payload.sessionId, text: ttsText });
            client.publish('hermes/dialogueManager/endSession', sentence);
        } else {
            if (systemStatus == "restarting") {
                var ttsText = "Voulez vous vraiment annuler le redémarrage du système ?";
            }
            if (systemStatus == "stopping") {
                var ttsText = "Voulez vous vraiment annuler l'arrêt du système ?";
            }
            var customParam = JSON.stringify({ sessionId: payload.sessionId, contextFunction: "CancelSystemDemand" });
            var sentence = JSON.stringify({ sessionId: payload.sessionId, text: ttsText, intentFilter: [INTENT_YES, INTENT_NO], customData: customParam });
            /** LOG description of the sended sentence */
            console.log("[Snips Log] TTS: sentence=" + ttsText);
            client.publish('hermes/dialogueManager/continueSession', sentence);
        }
    }
    /** ACTION if INTENT_SYSTEM_TEMPERATURE */
    if (payload.intent.intentName == INTENT_SYSTEM_TEMPERATURE) {
        temperature = spawn('cat', ['/sys/class/thermal/thermal_zone0/temp']);
        temperature.stdout.on('data', function (data) {
            var ttsText = "La température du système est de " + Math.round(data / 1000) + " degrés Celcius";
            /** LOG description of the sended sentence */
            console.log("[Snips Log] TTS: sentence=" + ttsText);
            var sentence = JSON.stringify({ sessionId: payload.sessionId, text: ttsText });
            client.publish('hermes/dialogueManager/endSession', sentence);
        });
    }
    /** ACTION if INTENT_START_WIFI */
    if (payload.intent.intentName == INTENT_START_WIFI) {
        var ttsText = "J'active le wifi.";
        /** LOG description of the sended sentence */
        console.log("[Snips Log] TTS: sentence=" + ttsText);
        var sentence = JSON.stringify({ sessionId: payload.sessionId, text: ttsText });
        client.publish('hermes/dialogueManager/endSession', sentence);
        execute('rfkill unblock all');
    }
     /** ACTION if INTENT_STOP_WIFI */
     if (payload.intent.intentName == INTENT_STOP_WIFI) {
        var ttsText = "Je désactive le wifi.";
        /** LOG description of the sended sentence */
        console.log("[Snips Log] TTS: sentence=" + ttsText);
        var sentence = JSON.stringify({ sessionId: payload.sessionId, text: ttsText });
        client.publish('hermes/dialogueManager/endSession', sentence);
        execute('rfkill block all');
    }   
    /** ACTION if INTENT_YES */
    if (payload.intent.intentName == INTENT_YES) {
        var customParam=JSON.parse(payload.customData);
        /** ACTION if INTENT_SHUTDOWN_SYSTEM CONFIRMED */
        if (customParam.contextFunction == "ShutdownSystemDemand") {
            var ttsText = "Le système va s'éteindre dans une minute.";
            var sentence = JSON.stringify({ sessionId: payload.sessionId, text: ttsText });
            /** LOG description of the sended sentence */
            console.log("[Snips Log] TTS: sentence=" + ttsText);
            client.publish('hermes/dialogueManager/endSession', sentence);
            // stop the system after many announces
            announceTimer = setTimeout(function () {publishTTS("arrêt du système dans 30 secondes.");},30000);
            shutdownTimer = setTimeout(function () {publishTTS("arrêt du système imminent.");},50000);
            execute('shutdown +1 "System stopping..."');
            systemStatus = "stopping";
        }
        /** ACTION if INTENT_RESTART_SYSTEM CONFIRMED */
        if (customParam.contextFunction == "RestartSystemDemand") {
            var ttsText = "Le système va redémarrer dans une minute.";
            var sentence = JSON.stringify({ sessionId: payload.sessionId, text: ttsText });
            /** LOG description of the sended sentence */
            console.log("[Snips Log] TTS: sentence=" + ttsText);
            client.publish('hermes/dialogueManager/endSession', sentence);
            // restart the system after many announces
            announceTimer = setTimeout(function () {publishTTS("redémarrage du système dans 30 secondes.");},30000);
            shutdownTimer = setTimeout(function () {publishTTS("redémarrage du système imminent.");},50000);
            execute('shutdown -r +1 "System restarting..."');
            systemStatus = "restarting";
        }
        /** ACTION if INTENT_CANCEL_SHUTDOWN_SYSTEM CONFIRMED */
        if (customParam.contextFunction == "CancelSystemDemand") {
            if (systemStatus == "restarting") {
                var ttsText = "Le redémarrage du système est annulé.";
            }
            if (systemStatus == "stopping") {
                var ttsText = "L'arrêt du système est annulé ?";
            }
            var sentence = JSON.stringify({ sessionId: payload.sessionId, text: ttsText });
            /** LOG description of the sended sentence */
            console.log("[Snips Log] TTS: sentence=" + ttsText);
            client.publish('hermes/dialogueManager/endSession', sentence);
            // restart the system after many announces
            clearTimeout(announceTimer);
            clearTimeout(shutdownTimer);
            execute('shutdown -c "Canceling..."');
            systemStatus = "on";
        }
    }
     /** ACTION if INTENT_NO */
    if (payload.intent.intentName == INTENT_NO) {
        var customParam=JSON.parse(payload.customData);
        if (customParam.contextFunction == "RestartSystemDemand" || customParam.contextFunction == "ShutdownSystemDemand" || customParam.contextFunction == "CancelSystemDemand" ) {
            var ttsText = "Très bien.";
            var sentence = JSON.stringify({ sessionId: payload.sessionId, text: ttsText });
            /** LOG description of the sended sentence */
            console.log("[Snips Log] TTS: sentence=" + ttsText);
            client.publish('hermes/dialogueManager/endSession', sentence);
        }
    }
};
