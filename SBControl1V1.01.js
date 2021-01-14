// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: green; icon-glyph: magic;
/*
These must be at the very top of the file. Do not edit.
SBControl1.js V1.0 1
Run Script with Scriptable.
Parameter use by Scriptable
10C.Thomas Burchert, MIT-Lizenz; paypal.me/10CSoftware 
Script/Widget nutzt die REST-API der sonnenBatterie
*** Beschreibung: *********************************************
Das Programm stellt eine Datenübersicht als Widget zur 
Verfügung und zeigt die wichtigsten Live-Betriebsdaten der 
sonnenBatterie an. Die folgenden Daten werden angezeigt: 
- Internetverbindung: Online/Offline, 
- Production, Consumption, GridFeedIn, Pac_total, SOC
Die Daten werden zyklisch aus der REST-API der sonnenBatterie 
ausgelesen und angezeigt. 
*** Parameter: ************************************************
1. IP-Adresse der sonnenBatterie im LAN 
2. Token für den Zugriff auf die API der sonnenBatterie.
Hinweis: Der Token kann dem Dashboard der sonnenBatterie unter
dem Menüpunkt "Software-"Integration entnommen werden.
3. setLogDataSave, 'yes' aktiviert die Speicherung einer Log-
Protokoll-Datei mit Meldungen bzw. Fehlermeldungen, 'no'= Off
4. setapiDataSave, 'yes' aktiviert die Speicherung der Daten,
die aus den API-Endpoints ausgelesen werden, 'no'= Off
Die Live-Daten zu 3. und 4. werden im Ordner "iCloud/Scriptable"
im Memory des iPhones bzw. iPads als JSON-Dateien gespeichert.
*** Dateien: **************************************************
Das Script schreibt die Daten der folgenden APIs-Endpoints nach
jedem Lesezyklus als JSON-Dateien in die iCloud oder in 
den Local-Bereich der Speichers, steuerbar über den Parameter:
fileManagerMode = LOCAL/ICLOUD
- ...IP:80/api/v2/latestdata, ...IP:80/api/v2/status, 
- ...IP:8080/api/battery, ...IP:8080/api/ios
*** Prokolldateien ********************************************
Die folgenden Protokolldateien werden als JSON-Dateien erzeugt:
- MonitoringData.json, wichtige Monitoring-Daten der Batterie
- LogData.json, Protokollierung von Systemmeldungen
*** Anmerkung: ************************************************
Bei einer Störung der WLAN/LAN-Verbindung werden die zuletzt
gelesenenen Daten der Batterie im Widget in hellgrauer Schrift
angezeigt; sobald die Verbindung wieder intakt ist, werden die
Betriebsdaten wieder im Farbmodus angezeigt.
*/

const IP = "999.999.999.99"
const Token = "xxxxxxxxx-xxxxx-xxxx-xxxx-xxxxxxxxxxx"
const reqTimeoutInterval = 2 //Zeitinterval bis zum Abbruch der Datenanforderung
const fileManagerMode = 'ICLOUD'; // default is ICLOUD. If you don't use iCloud Drive use option LOCAL

let MONITORING_JSON_VERSION = 1 // never change this value
let LOG_JSON_VERSION = 1 // never change this value
let setLogDataSave = 'yes' // "yes" activate the LogData-Report, "no" deactivate the it
let setApiDataSave = 'yes' // "yes" activate Saving API-Data, "no" deactivate it

// Stop edit from this point - ab hier keine Änderungen mehr vornahmen!
//=====================================

const apiURL1 = "http://" + IP + ":80/api/v2/latestdata" // latestdata
const apiURL2 = "http://" + IP + ":80/api/v2/status" // status data
const apiURL3 = "http://" + IP + ":8080/api/battery" // CycleCount, CellTemperature
const apiURL4 = "http://" + IP + ":8080/api/ios" // Reduction 1, 2

let stateGrid = ""
let stateBattery = ""
let valueGrid = 0
let valueBattery = 0
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

//================================

async function createWidget(items) {
  
  let data1, data2, data3, data4, data5, data6, data7 = 0
  let logMessage1, logMessage2, logMessage3, logMessage4  = '!'
  let apiError = false
  let catchError = false
  
  // *****************************************
  // fileManagerMode is LOCAL, create new Folder
  let fm = fileManagerMode === 'LOCAL' ? FileManager.local() : FileManager.iCloud();
  let dirPath = fm.joinPath(fm.documentsDirectory(), "SBControl12");
  
  if (!fm.fileExists(dirPath)) {
    fm.createDirectory(dirPath);
  }
  
  // Adresses for data query
  let path1 = fm.joinPath(dirPath, "LatestData.json"); //latest data
  let path2 = fm.joinPath(dirPath, "StatusData.json"); // state1 data
  let path3 = fm.joinPath(dirPath, "BatteryData.json"); // state2 data
  let path4 = fm.joinPath(dirPath, "iOSData.json"); // iOS-data
  let path5 = fm.joinPath(dirPath, "MonitoringData.json"); // monitoring-data
  let path6 = fm.joinPath(dirPath, "LogData1.json"); // 24h-data
  let path7 = fm.joinPath(dirPath, "StringData.json"); // string-data from data1
  
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
  
  // *****************************************
  
  // Fetch Monitoring State from iCloud-Memory
  let state = getMonitoringState(fm, path5);
  console.log ("Read Monitoring-Data OK:" + state.jsonVersion)
  
  // Create new ListWidget
  const list = new ListWidget()
  
  // API1: Fetch data from API - latestData
    try {
      let r1 = new Request(apiURL1)
      r1.timeoutInterval = reqTimeoutInterval;
      r1.method = "GET";
      r1.headers = { 'Content-Type': 'application/json','Accept': 'application/json','Auth-Token': Token }
      //, "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 13_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1.1 Mobile/15E148 Safari/604.1"}
      
      // Fetch data1
      data1 = await r1.loadJSON()
      data7 = await r1.loadString()
      
      // Check data for Response, ReturnCode = 200?
      let returnCode = r1.response
      
      if (data1 && returnCode.statusCode == 200 ) {
        
        SystemTime = data1.Timestamp; // Timestamp from Battery
        
        LogMessage1 = SystemTime + ' ReturnCode: ' + returnCode.statusCode + ' OK'
        console.log ("LogMessage 1.1= " + LogMessage1)
        
        if (setApiDataSave === 'yes') {
        // Write JSON STRING data to backup
        fm.writeString(path1,JSON.stringify(data1, null, 2))
        //fm.writeString(path7,JSON.stringify(data7, null, 2)) 
        }
      }
      else
        if (returnCode.statusCode == 401) {
            // Check data for Response, ReturnCode = 401 unautorized?
            LogMessage1 = SystemTime + ' ErrCode: ' + returnCode.statusCode + ' Nicht autorisierter Zugriff - Token!'
            console.log ("LogMessage 1.2= " + LogMessage1)
            apiError = true
           }
        else {
            LogMessage1 = SystemTime + ' ErrCode: ' + returnCode.statusCode + ' API-Lesefehler!'
            console.log ("LogMessage 1.3= " + LogMessage1)
            apiError = true

        }
    }
  
    catch (err1) {
      // Error handling
      catchError = true
      LogMessage1 = SystemTime + ' ' + err1 + ' API-Lesefehler!'
      console.log ("LogMessage 1.4= " + LogMessage1)
    }
    
    // API2: Fetch data - Battery Status
    try {
      let r2= new Request(apiURL2)
      r2.timeoutInterval = reqTimeoutInterval;
      r2.headers = { 'Content-Type': 'application/json','Accept': 'application/json','Auth-Token': Token }
      
      // Fetch data from battery
      data2 = await r2.loadJSON() //Load JSON-Data
      
      let returnCode = r2.response
      
      // Check data for Response, ReturnCode = 200?
      if (data2 && returnCode.statusCode == 200) {
        LogMessage2 = SystemTime + ' ReturnCode: ' + returnCode.statusCode  + ' OK'
        console.log ("LogMessage2.1= " + LogMessage2)
        
        if (setApiDataSave === 'yes') {
        // Write JSON to iCloud file
        fm.writeString(path2,JSON.stringify(data2, null, 2))
        }
      }
      else
        if (returnCode.statusCode == 401) {
          // Check data for Response, ReturnCode = 401 unautorized?
          LogMessage1 = SystemTime + ' ErrCode: ' + returnCode.statusCode + ' Nicht autorisierter Zugriff - Token!'
          console.log ("LogMessage 2.2= " + LogMessage1)
          apiError = true
        }
        else {
          LogMessage1 = SystemTime + ' ErrCode: ' + returnCode.statusCode + ' API-Lesefehler!'
          console.log ("LogMessage 2.3= " + LogMessage1)
          apiError = true
        
      }
    }
    
    catch (err2) {
      // Error handling
      catchError = true
      LogMessage2 = SystemTime + ' ' + err2 + ' API-Lesefehler!'
      console.log ("LogMessage 2.4= " + LogMessage2)
    }
    
    // API3: Fetch data - battery tech data
    try {
      let r3= new Request(apiURL3)
      r3.timeoutInterval = reqTimeoutInterval;
      r3.headers = { 'Content-Type': 'application/json','Accept': 'application/json','Auth-Token': Token }
      
      // Fetch data from battery
      data3= await r3.loadJSON() //Load JSON-Data
      
      let returnCode = r3.response
      
      // Check data for Response, ReturnCode = 200?
      if (data3 && returnCode.statusCode == 200) {
        LogMessage3 = SystemTime + ' ReturnCode: ' + returnCode.statusCode + ' OK'
        console.log ("LogMessage 3.1= " + LogMessage3)
        
        if (setApiDataSave === 'yes') {
        // Write JSON to iCloud file
        fm.writeString(path3,JSON.stringify(data3, null, 2))
        }
      }
      else
        if (returnCode.statusCode == 401) {
          // Check data for Response, ReturnCode = 401 unautorized?
          LogMessage1 = SystemTime + ' ErrCode: ' + returnCode.statusCode + ' Nicht autorisierter Zugriff - Token!'
          console.log ("LogMessage 3.2= " + LogMessage1)
          apiError = true
        }
        else {
          LogMessage1 = SystemTime + ' ErrCode: ' + returnCode.statusCode + ' API-Lesefehler!'
          console.log ("LogMessage 3.3= " + LogMessage1)
          apiError = true
        
      }
    }
    
    catch (err3) {
      // Error handling
      catchError = true
      LogMessage3 = SystemTime + ' ' + err3 + ' API-Lesefehler!'
      console.log ("LogMessage 3.4= " + LogMessage3)
    }
    
    // API4: Fetch Data - iOS-Data 
    try {
      let r4 = new Request(apiURL4)
      r4.timeoutInterval = reqTimeoutInterval;
      
      // r5.headers = {"Content-Type": "charset=utf-8"}
      r4.headers = { 'Content-Type': 'application/json','Accept': 'application/json','Auth-Token': Token }
      
      // Fetch Internet status from battery
      data4 = await r4.loadJSON() //Load String
      
      let returnCode = r4.response
      
      // Check data for Response, ReturnCode = 200?
      if (data4 && returnCode.statusCode == 200) {
        LogMessage4 = SystemTime + ' ReturnCode: ' + returnCode.statusCode + ' OK'
        console.log ("LogMessage 4.1= " + LogMessage4)
        
        if (setApiDataSave === 'yes') {
        // Write JSON to iCloud file
        fm.writeString(path4,JSON.stringify(data4, null, 2))
        }
      }
      else
        if (returnCode.statusCode == 401) {
          // Check data for Response, ReturnCode = 401 unautorized?
          LogMessage1 = SystemTime + ' ErrCode: ' + returnCode.statusCode + ' Nicht autorisierter Zugriff - Token!'
          console.log ("LogMessage 4.2= " + LogMessage1)
          apiError = true
        }
        else {
          LogMessage1 = SystemTime + ' ErrCode: ' + returnCode.statusCode + ' API-Lesefehler!'
          console.log ("LogMessage 4.3= " + LogMessage1)
          apiError = true
        
      }
    }
    catch (err4) {
      // Error handling
      catchError = true
      LogMessage4 = SystemTime + ' ' + err4 + ' API-Lesefehler!'
      console.log ("LogMessage 4.4= " + LogMessage4)
    }
  
    // *****************************************
    // Prepare LogfileData and save
    
    if (setLogDataSave == 'yes') {
      // Fetch Logfile from iCloud-Memory
      let logfile = getLogData(fm, path6);
      console.log ("Read Logfile-Data OK: " + logfile.jsonVersion)
    
      // LogfileData - Prepare new Logfile-Version
      logfile.jsonVersion = LOG_JSON_VERSION
      logfile.LogCounter = logfile.LogCounter + 1
      logfile.latestUpdate = SystemTime
      logfile.data1.url = apiURL1
      logfile.data1.token = Token
      logfile.data1.report = LogMessage1 + ', ' + logfile.data1.report
      logfile.data2.url = apiURL2
      logfile.data2.token = Token
      logfile.data2.report = LogMessage2 + ', ' + logfile.data2.report
      logfile.data3.url = apiURL3
      logfile.data3.token = ''
      logfile.data3.report = LogMessage3 + ', ' + logfile.data3.report
      logfile.data4.url = apiURL4
      logfile.data4.token = ''
      logfile.data4.report = LogMessage4 + ', ' + logfile.data4.report
  
      // Save LogfileData to iCloud-Memory
      saveLogData(fm, logfile, path6);
      console.log ("Save LogData-Data OK: " + logfile.jsonVersion)
    }
    
  // *************************************
  // Evaluate data and prepare Widget View
  // *************************************
  
  // ReturnCode OK for API 1-4
  if (apiError == false && catchError == false) {
    
    // Set Internet Connection State Online/Offline
    // Evaluate Eclipse data
    let EclipseWhite = false
    let EclipseOrange = false
    let EclipseRed = false
    let EclipseGreen = false
  
    // Check Eclipse State
    let stringPos = data7.indexOf('Pulsing White');
    if (data7.substr(stringPos+15,4) == 'true') { 
      EclipseWhite = true }
    
    stringPos = data7.indexOf('Pulsing Orange');
    if (data7.substr(stringPos+16,4) == 'true') { 
      EclipseOrange = true }
    
    stringPos = data7.indexOf('Solid Red');
    if (data7.substr(stringPos+11,4) == 'true') { 
      EclipseRed = true }
    
    stringPos = data7.indexOf('Pulsing Green');
    if (data7.substr(stringPos+11,4) == 'true') { 
      EclipseGreen = true }
    
    // Check Battery State Online or Offline?
    let OnlineState = false
  
    if (EclipseOrange == true && EclipseWhite == false) { OnlineState = false }
    else { OnlineState = true }
  
    // Check Battery State Solid Red = Error?
    if (EclipseRed == true) { stateOnline = '⚠️ ⇒ ☎️' } //battery Error-State, 
    
    // **************************************** 
    // Prepare new Monitoring-Data and Save to JSON-File
    
    state.jsonVersion = MONITORING_JSON_VERSION
    state.MonitoringCounter = state.MonitoringCounter + 1
    state.Timestamp = data1.Timestamp
    state.ConnectState = OnlineState
    state.SystemState = data2.SystemStatus
    state.Production_W = data1.Production_W
    state.Consumption_W = data1.Consumption_W
    state.Pac_total_W = data1.Pac_total_W
    state.GridFeedIn_W = data1.GridFeedIn_W
    state.RSOC = data1.RSOC
    state.USOC = data1.USOC
    state.BatteryCharging = data2.BatteryCharging
    state.BatteryDischarging = data2.BatteryDischarging
    state.cyclecount = data3.battery_status.cyclecount
    state.stateofhealth = data3.battery_status.stateofhealth
    state.minimumcelltemperature = data3.battery_status.minimumcelltemperature
    state.maximumcelltemperature = data3.battery_status.maximumcelltemperature
    state.selfConsumptionRelay = data4.DO_12.status
    state.PV_Reduction_state.PV_Reduction_1 = data4.DO_13.status
    state.PV_Reduction_state.PV_Reduction_2 = data4.DO_14.status
    state.Eclipse_Led.Pulsing_White = EclipseWhite
    state.Eclipse_Led.Pulsing_Orange = EclipseOrange
    state.Eclipse_Led.Solid_Red = EclipseRed
    state.Eclipse_Led.Pulsing_Green = EclipseGreen
    
    // Store Monitoring State to iCloud-Memory
    saveMonitoringState(fm, state, path5);
    console.log ("Save Monitoring-Data OK: " + state.jsonVersion);
    
  }
  else {
    // Fetch Monitoring State from iCloud-Memory, 2. Fetch
    state = getMonitoringState(fm, path5);
    console.log ("Read2 Monitoring-Data OK: " + state.jsonVersion)
  }
  
  // *****************************
  // Prepare Output for Monitoring
  // *****************************
  // Read Battery State data
  let CycleCount = state.cyclecount
  let maxCellTemp = state.maximumcelltemperature
  let minCellTemp = state.minimumcelltemperature
  let health = state.stateofhealth
  let relayState = ''
  
  // Prepare latest Battery data for View
  
  // Check rend txtTrend = '→'
  if (state.BatteryCharging == true )  {stateTrend = '↑' }
  else if ( state.BatteryDischarging == true ) { stateTrend = '↓' }
  else { stateTrend = ' ' }
  
  // Evaluate Internet Connection State
  if (state.ConnectState = true ) { stateOnline = "Online"}
  else { stateOnline = '⚡️Offline'}
    
  // Read Battery iOS data Check Reduction State (API4)
  if (state.PV_Reduction_state.PV_Reduction_1 == 0) { txtReduction1 = '0'}
  else {txtReduction1 = '1'}
    
  if (state.PV_Reduction_state.PV_Reduction_2 == 0) { txtReduction2 = '0'}
  else {txtReduction2 = '1'}
  
  if (state.selfConsumptionRelay == false) { relayState = '0'}
  else { relayState = '1'}
  
  // Prepare Header Output to Widget
  list.addSpacer(2)
    
  // Prepare latest Battery data for View
  // Check PV-Production works
  // 🔆☁️🌘🌔🌙
  
  if ( hour >= '19' && hour <= '7' ) { stateProd = '🌔' }
  else if (state.Production_W == 0) { stateProd = '☁️' }
  else { stateProd = "🔆" }

  // Check OnGrid state
  if (state.SystemState == "OnGrid") { stateOnGrid = '1' }
  else { stateOnGrid = '⚡️' }
    
  let now = state.Timestamp
  let timeLabel = now.substr(11,5);
  
  //list.addSpacer(3)
  
  const line1 = list.addText('-' + stateProd + '-' + timeLabel + '-' + stateOnline + '-' );
  line1.font = Font.mediumSystemFont(10)
    
  if ( stateOnline !== "Online") { line1.textColor = Color.red() }
    
  const line2 = list.addText("sonnenBatterie")
  line2.font = Font.boldSystemFont(14)
    
  const line3 = list.addText(state.USOC + "% " + stateTrend )
  line3.font = Font.mediumSystemFont(28)
  line3.textColor = Color.green()
    
  const line4 = list.addText("Produktion " + Math.round(state.Production_W/100)/10 + " kW");
  line4.font = Font.mediumSystemFont(12);
  if (state.Production_W > 0 ) { line4.textColor = Color.orange() };
  
  const line5 = list.addText("Verbrauch " + Math.round(state.Consumption_W/100)/10 + " kW")
  line5.font = Font.mediumSystemFont(12)
    
  if (state.GridFeedIn_W >= 0) { stateGrid = "Einspeisung " }
  else {stateGrid = "Bezug " }
    
  valueGrid = Math.abs(state.GridFeedIn_W)
    
  const line6= list.addText( stateGrid + (Math.round(valueGrid/100)/10)+ " kW")
  line6.font = Font.mediumSystemFont(12)
    
  if (state.Pac_total_W >=0) { stateBattery = "Entladung " }
  else {stateBattery = "Ladung " }
    
  valueBattery = Math.abs(state.Pac_total_W)
    
  const line7= list.addText(stateBattery + Math.round(valueBattery/100)/10 + " kW")
  line7.font = Font.mediumSystemFont(12)
    
  // Mark old data with Color Gray
  if (apiError == true || catchError == true) {
    line3.textColor = Color.gray()
    line4.textColor = Color.gray()
    line5.textColor = Color.gray()
    line6.textColor = Color.gray() 
    line7.textColor = Color.gray()
  }
  return list;

  // Save Monitoringstate to iCloud-Memory
  function getMonitoringState(fm, path) {
    if (fm.fileExists(path)) {
        let raw, savedState;
        try {
            raw = fm.readString(path);
            savedState = JSON.parse(raw);
        } 
        catch (e) {
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
  return state;
}

  function saveMonitoringState(fm, state, path) {
  //let raw = JSON.stringify(state);
  //fm.writeString(path, raw);
  
  // Write JSON data to backup
  fm.writeString(path,JSON.stringify(state, null, 2)) 
  return;
  }

  function getStoredMonitoringStatePath(fm) {
    let dirPath = fm.joinPath(fm.documentsDirectory(), 'sbBatterieStatus');
    if (!fm.fileExists(dirPath)) {
        fm.createDirectory(dirPath);
    }
    return fm.joinPath(dirPath, 'notificationState.json');
  }
  
  // Prepare LogDataFile
  // Save LogData to iCloud-Memory
  function getLogData(fm, path) {
    if (fm.fileExists(path)) {
      let raw, savedLogfile;
      try {
        raw = fm.readString(path);
        savedLogfile = JSON.parse(raw);
      } 
      catch (e) {
        // file corrupted -> remove it
        fm.remove(path);
      }
      
      if (savedLogfile.LogCounter >= 12) {
          // max number of Records is reached -> remove messages
          savedLogfile.LogCounter = 0
          savedLogfile.data1.report = '#'
          savedLogfile.data2.report = '#'
          savedLogfile.data3.report = '#'
          savedLogfile.data4.report = '#'
      }
      
      if (savedLogfile && savedLogfile.jsonVersion === undefined || savedLogfile.jsonVersion < LOG_JSON_VERSION) {
        // the version of the json file is outdated -> remove it and recreate it
        fm.remove(path);
        //savedLogfile.jsonVersion = 0
        
      } else {
        LogCounter = LogCounter + 1
        return savedLogfile;
      }
    }
    // create a new LogFile state
    let logfile = {
      'jsonVersion': LOG_JSON_VERSION,
      'LogCounter': 0,
      'latestUpdate': '',
      'data1': {
        'url': '',
        'token': '',
        'report':'#',
      },
      'data2': {
        'url': '',
        'token': '',
        'report': '#',
      },
      'data3': {
        'url': '',
        'token': '',
        'report': '#',
      },
      'data4': {
        'url': '',
        'token': '',
        'report': '#',
      },
    };
    saveLogData(fm, logfile, path);
    return logfile;
  }
  
  function saveLogData(fm, logfile, path) {
    
    // Write JSON data to backup
    fm.writeString(path,JSON.stringify(logfile, null, 2)) 
    return;
  }
}

// End of script, please copy to this endpoint
// Script Ende, bis hier markieren und kopieren!
