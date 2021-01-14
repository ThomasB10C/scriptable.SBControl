// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: green; icon-glyph: magic;
/*
These must be at the very top of the file. Do not edit.
SB-Control2.js V1.0 1
Run Script with Scriptable.
Parameter use by Scriptable
10C.Thomas Burchert, MIT-Lizenz; paypal.me/10CSoftware 
Script/Widget nutzt die REST-API der sonnenBatterie
*** Beschreibung: *********************************************
Das Programm stellt einen Dashboard als Widget zur Verfügung
und zeigt ausgewählte Systemzustände und Statusdaten der 
sonnenBatterie an. Die folgenden Status-Daten werden angezeigt: 
- Internetverbindung: Online/Offline, 
- Ladezustand der Batterie SOC in %
- Netzverbindung: OnGrid/OffGrid,
- Ladezähler: Anzahl der Vollzyklen als Zahl,
- Temperatur der Zellen: min. und max. Temp. in Grad Celsius
- Abregelung der Stufe 1: Reduction1 R1: On/Off, 
- Abregelung der Stufe 2: Reduction2 R2: On/Off, 
- Status des Self Consumption Relais: R3: On/Off
*** Parameter: ************************************************
1. IP-Adresse der sonnenBatterie im LAN
*** Dateien: **************************************************
*** Prokolldateien ********************************************
Die folgenden Protokolldateien werden als JSON-Dateien gelesen:
- MonitoringData.json, wichtige Monitoring-Daten der Batterie
*** Anmerkungen: **********************************************
1. Dieses Dashboard-Widget verwendet die Statusdaten der Datei 
"Monitoring.js", die von dem Livedaten-Widget "SB-Control1.js"
von der API der Batterie zyklisch ausgelesen und im Memory des 
Handys bzw. iPads gespeichert werden. Für einen ordnungsgemäßen
Betrieb des Widgets "SB-Control2" muss deshalb gleichzeitig das
Live-Widget "SB-Control1.js" installiert werden und laufen.
2. Bei einer Störung der WLAN/LAN-Verbindung werden die zuletzt
gelesenenen Daten der Batterie aus der Monitoring-Datei in der 
Widget-Ansicht in hellgrauer Schrift angezeigt; sobald wieder 
eine Verbindung zur Batterie besteht, werden die aktuellen Daten
erneut im Farbmodus angezeigt.
*/

const fileManagerMode = 'ICLOUD'; // default is ICLOUD. If you don't use iCloud Drive use option LOCAL
let MONITORING_JSON_VERSION = 1 // never change this value

// Stop edit from this point - ab hier keine Änderungen mehr vornahmen!
//============================================

let stateTrend = "?"
let stateProd = ''
let stateOnline = ''
let MonitoringCounter, LogCounter = 0

// Start
// Init Widget for data view
let widget = await createWidget()
if (!config.runsInWidget) {
   await widget.presentSmall()}
 
Script.setWidget(widget)
Script.complete()

//********************************************

async function createWidget(items) {
  
  let apiError = false
  let catchError = false
  let stateRed = false
  
  // *****************************************
  // fileManagerMode is LOCAL, create new Folder
  let fm = fileManagerMode === 'LOCAL' ? FileManager.local() : FileManager.iCloud();
  let dirPath = fm.joinPath(fm.documentsDirectory(), "SBControl12");
  
  if (!fm.fileExists(dirPath)) {
    fm.createDirectory(dirPath);
  }
  
  // Adresses for data query
  let path = fm.joinPath(dirPath, "MonitoringData.json"); // monitoring-data
  
  // Prepare Systemtime
  let newDate = new Date();
  let month = "" + (newDate.getMonth() + 1);
  let day = "" + newDate.getDate();
  let year = newDate.getFullYear();
  if (month.length < 2) {month = "0" + month};
  if (day.length < 2) {day = "0" + day};
  
  let hour = '' + newDate.getHours();
  let minutes = ''+ newDate.getMinutes();
  let seconds = '' + newDate.getSeconds();
  if (hour.length < 2) {hour = "0" + hour};
  if (minutes.length < 2) {minutes = "0" + minutes};
  if (seconds.length < 2) {seconds = "0" + seconds};
  
  let SystemTime = [year, month, day].join("-") + ' ' + [hour, minutes, seconds].join(":");
  console.log ("SystemTime: " + SystemTime);
  
  // Create new ListWidget
  const list = new ListWidget()
    
  // *****************************************
  // Evaluate data and prepare Widget View
  // *****************************************
  // Fetch Monitoring State from iCloud
  let state = getMonitoringState(fm, path);
  console.log (SystemTime + ": Read Monitoring-Data OK: " + state.jsonVersion)
  
  // *****************************************
  // Prepare Output for Monitoring
  // *****************************************
  // Read Battery State data
  let health = state.stateofhealth
  let relayState = ''
  let stateGuarantee = ''
  
  let now = state.Timestamp
  let timeLabel = now.substr(11,5);
  
  // Prepare latest Battery data for View
  // Check PV-Production works
  
  if ( hour >= '19' && hour <= '7' ) { stateProd = '🌔' }
  else if (state.Production_W == 0) { stateProd = '☁️' }
  else { stateProd = "🔆" }
  
  // 🌘🌔🌙
  
  // Check rend txtTrend = '→'
  if (state.BatteryCharging == true )  {stateTrend = '↑' }
  else if ( state.BatteryDischarging == true ) { stateTrend = '↓' }
  else { stateTrend = ' ' }
  
  // Evaluate Internet Connection State
  if (state.ConnectState = true ) { stateOnline = "Online"}
  else { stateOnline = '⚡️Offline'}
  if (stateRed == true) { stateOnline = '⚠️ ⇒ ☎️' }
  
  // Check OnGrid state
  if (state.SystemState == "OnGrid") { stateOnGrid = 'OnGrid' }
  else { stateOnGrid = '⚡️OffGrid' }
  
  // Read Battery iOS data Check Reduction State (API4)
  if (state.PV_Reduction_state.PV_Reduction_1 == 0) { txtReduction1 = 'Off'}
  else {txtReduction1 = 'On'}
  
  if (state.PV_Reduction_state.PV_Reduction_2 == 0) { txtReduction2 = 'Off'}
  else {txtReduction2 = 'On'}
  
  if (state.selfConsumptionRelay == 0) { relayState = 'Off'}
  else { relayState = 'On'}
  
  // *****************************************
  // Prepare Header Output to Widget
  list.addSpacer(2)
  
  const line1 = list.addText('-' + stateProd + '-' + timeLabel + '-' + stateOnline + '-');
  if ( stateOnline == "Offline") { line1.textColor = Color.red() };
  line1.font = Font.mediumSystemFont(10)
  
  const line2 = list.addText("sonnenBatterie")
  line2.font = Font.boldSystemFont(14)
  
  list.addSpacer(1)

  const line3 = list.addText('Grid: ' + stateOnGrid);
  line3.font = Font.mediumSystemFont(12);
  if ( stateOnGrid == "OffGrid") { line3.textColor = Color.orange() }
  else {line3.textColor = Color.green() };
  
  const line4 = list.addText('Counter: ' + state.cyclecount + "⤒ " + stateGuarantee );
  line4.font = Font.mediumSystemFont(12);
  if (state.BatteryCharging == true) { line4.textColor = Color.orange() }
  if (state.BatteryDischarging == true) { line4.textColor = Color.blue() }
  
  // Check Guarantee expiration
  if (state.cyclecount >= 10000 ) { 
      line4.textColor = Color.red()
      stateGuarantee = '!'
    }

  // Prepare data from apiEndpoint battery state
  const line5 = list.addText("T: " + '' + state.minimumcelltemperature + '°' + '-' + state.maximumcelltemperature + '°');
  line5.font = Font.mediumSystemFont(12)
  
  const line6 = list.addText('Reduction R1: ' + txtReduction1 );
  line6.font = Font.mediumSystemFont(12);
  if ( state.PV_Reduction_state.PV_Reduction_1 == 1) {line6.textColor = Color.red()};
  
  const line7 = list.addText('Reduction R2: ' + txtReduction2 );
  line7.font = Font.mediumSystemFont(12);
  if ( state.PV_Reduction_state.PV_Reduction_2 == 1) {line7.textColor = Color.red()};
  
  const line8 = list.addText('SelfConsR R3: ' + relayState);
  line8.font = Font.mediumSystemFont(12);
  if ( state.selfConsumptionRelay == 1) { line8.textColor = Color.green() };
  
  // Mark old data with Color Gray
  if (catchError == true) {
    line3.textColor = Color.gray()
    line4.textColor = Color.gray()
    line5.textColor = Color.gray()
    line6.textColor = Color.gray() 
    line7.textColor = Color.gray()
    line8.textColor = Color.gray();
  }
  return list;

  // Save Monitoringstate to iCloud-Memory
  function getMonitoringState(fm, path) {
    if (fm.fileExists(path)) {
        let raw, savedState;
        try {
            raw = fm.readString(path);
            savedState = JSON.parse(raw);
            catchError = false
        } 
        catch (e) {
              catchError = true
              console.log ("CatchError Monitoring-Data: " + state.jsonVersion)
              // file corrupted -> remove it
              fm.remove(path);
        }
        
    if (savedState && savedState.jsonVersion === undefined || savedState.jsonVersion < MONITORING_JSON_VERSION) {
      // the version of the json file is outdated -> remove it and recreate it
      fm.remove(path);
    } else {
      return savedState;
    }
  }
  // create a new battery state json
  let state = {
    'jsonVersion': MONITORING_JSON_VERSION,
    'MonitoringCounter': 0,
    'Timestamp': '',
    'ConnectState': '',
    'SystemState': '',
    'Production_W': 0,
    'Consumption_W': 0,
    'Pac_total_W': 0,
    'GridFeedIn_W': 0,
    'RSOC': 0,
    'USOC': 0,
    'BatteryCharging': false,
    'BatteryDischarging': false,
    'cyclecount': '0',
    'stateofhealth': '0',
    'minimumcelltemperature': '0',
    'maximumcelltemperature': '0',
    'selfConsumptionRelay': '0',
    'PV_Reduction_state': {
      'PV_Reduction_1': 0,
      'PV_Reduction_2': 0,
    },
    'Eclipse_Led': {
      'Pulsing_White': false,
      'Pulsing_Orange': false,
      'Solid_Red': false,
      'Pulsing_Green': false,
    },
  };
  saveMonitoringState(fm, state, path);
  console.log ("Create Monitoring-Data OK: " + state.jsonVersion)
  return state;
}

  function saveMonitoringState(fm, state, path) {
  // Write JSON data to backup
  fm.writeString(path,JSON.stringify(state, null, 2)) 
  return;
  }
}

// End of script, please copy to this endpoint
// Script Ende, bis hier markieren und kopieren!
