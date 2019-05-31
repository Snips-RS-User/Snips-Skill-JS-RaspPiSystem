# Description

Skill for Snips : 
 - to shutdown or restart the raspberry Pi,
 - to start or stop the wifi communication,
 - to announce the temperature of the system.

Snips App : "Actions sur le Raspberry Pi" by Snips-RS-User.


# Generated Snips skill

This is a generated javascript snips skill using the `snips-template` tool.
It is compatible with the format expected by the `snips-skill-server`


## Setup

This skill requires some javascript dependencies to work properly, these are
listed in the `package.json` file. You can use the `setup.sh` script to install
them.


## Executables

This dir contains a number of javascript executables named `action-*.js`.
One such file is generated per intent supported. These are standalone
executables and will perform a connection to MQTT and register on the
given intent using the `mqtt` helper lib ($ npm install mqtt –save).



# Versionning

## 1.0.0 (31/05/2019)
 - New function : to shutdown or restart the raspberry Pi.
 - New function : to start or stop the wifi communication.
 - New function : to announce the temperature of the system.