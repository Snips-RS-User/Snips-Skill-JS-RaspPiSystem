#!/usr/bin/env node
/**
 * Documentation
 * @requires mqtt   need to install mqtt library ">$ npm install mqtt --save"
 */

var mqtt = require('mqtt');


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
const INTENT_SHUTDOWN = "Snips-RS-User:askShutdown";
const INTENT_RESTART = "Snips-RS-User:askRestart";
const INTENT_CANCEL = "Snips-RS-User:askCancellation";
const INTENT_YES = "Snips-RS-User:answerYes";
const INTENT_NO = "Snips-RS-User:answerNo";

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
 * @function onIntentDetected
 * @param {*} payload
 * @returns
 * @description Main actions when the listener is detected
 */

var onIntentDetected = function (payload) {
    /** LOG description of the detected intent */
    console.log("[Snips Log] Intent detected: sessionId=" + payload.sessionId + " - siteId=" + payload.siteId);
    console.log("[Snips Log] Intent detected: IntentName=" + payload.intent.intentName + " - Slots=" + JSON.stringify(payload.slots) + " - confidenceScore=" + payload.intent.confidenceScore);
    /** ACTION if INTENT_SHUTDOWN */
    if (payload.intent.intentName == INTENT_SHUTDOWN) {

        ttsText = defineTime();
    }
    /** ACTION if INTENT_RESTART */
    if (payload.intent.intentName == INTENT_RESTART) {

    }
    /** ACTION if INTENT_INTENT_CANCEL */
    if (payload.intent.intentName == INTENT_CANCEL) {

    }
    
    // /** ACTION send the sentence and close the session */
    // if (detectedIntent) {
    //     var sentence = JSON.stringify({ sessionId: payload.sessionId, text: ttsText });
    //     /** LOG description of the sended sentence */
    //     console.log("[Snips Log] TTS: sentence=" + ttsText);
    //     client.publish('hermes/dialogueManager/endSession', sentence);
    // }
}
