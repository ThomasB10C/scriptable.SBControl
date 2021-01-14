#### scriptable.SBControl V1

# sonnenBatterie-Widget: SBControl V1
Widgets für das Monitoring der sonnenBatterien Eco 8.0/SB10
- Widget1: Monitoring von Betriebsdaten  --> SBControl1.js 
- Widget2: Monitoring von Statusdaten  --> SBControl2.js 

#### Übersicht der Daten im Day-Mode
(Links: SBControl1, Rechts: SBControl2)

![dayWidget](/image/sbcontrol1-4.jpeg) 

#### Übersicht der Daten im Night-Mode
(Links: SBControl1, Rechts: SBControl2)

![nightWidget](/image/sbcontrol1-1.jpeg) 

### Download der Scripte
- Download von SBControl1: >>> [hier](SonnenBatterieV4.01.js)
- Download von SBControl2: >>> [hier](SonnenBatterieV4.01.js)

## Kurzbeschreibung
Das Widget1 SBControl1 und das Widget2 SBControl2 bilden eine Einheit. 

- Das Widget1 führt ein Monitoring der wichtigsten Leistungsdaten einer Solar-Batterie durch, bspw. der Livedaten für die Stromproduktion, der Verbrauchsdaten oder der Einspeisung, und ist kompatibel zu den sonnenBatterien Eco 8.0 und SB10. Es fragt Betriebsdaten der sonnenBatterie über API-Schnittstellen der REST-API ab und stellt diese im Widget in einer Übersicht zur Verfügung.

- Das Widget2 kann als Ergänzung zum Widget1 angesehen werden. Es kontrolliert Statusdaten der sonnenBatterie, bspw. den Schaltzustand der Abregelungsrelais oder des Self Consumption Relais, und auch den Verbindungsstatus der sonnenBatterie zum Internet und mit dem Stromnetz.

- Das Widget1 kann auch alleine betrieben werden. Das Widget2 benötigt die Daten des Widget1, es läuft nur, wenn auch das Widget1 installiert worden ist!

Beide Widgets laufen nur mit Unterstützung der iPhone-/iPad-App _Scriptable ab iOS14_.

#### Übersicht von Betriebsdaten im Widget1: SBControl1

![widget1](/image/sbControl1-5.jpeg)

Die folgenden Daten werden im Widget1 SBControl1.js dargestellt:

**1. Zeile**
- 🔅/☁️/🌔 - Status für die gestartete Produktion/Erzeugung der PV-Anlage On/Off
  - 🔅 - sonnig, die PV-Anlage erzeugt Strom
  - ☁️ - bewölkt, die PV-Anlage liefert keinen Strom
  - 🌔 - nachts, die PV-Anlage liefert keinen Strom

- 19:44 - Uhrzeit des letzten Datenupdates der Abfrage der sonnenBatterie (Timestamp)
- Online/⚡️Offline - Status der Verbindung der sonnenBatterie zum Internet (Status der Eclipse)

**2. Zeile**
- Name des Widgets

**3. Zeile**
- **99% ↑↓** - Ladezustand der sonnenBatterie mit Trendanzeige bei Ladung= On.

**4. bis 7. Zeile**
- **Produktion** in kW, Erzeugung der PV-Anlage
- **Verbrauch** in kW, Verbrauch im Haus
- **Einspeisung/Bezug** in kW, die Anzeige wechselt zwischen Einspeisung und Bezug, abhängig vom Status
- **Ladung/Entladung** in kW, die Anzeige wechselt zwischen Ladung und Entladung, abhängig vom Status

#### Übersicht von Statusdaten Widget2: SBControl2

![widget2](/image/sbControl1-6.jpeg)

Die folgenden Daten werden im Widget2 SBControl2.js dargestellt:

**1. Zeile**
- 🔅/☁️/🌔 - Status für die gestartete Produktion/Erzeugung der PV-Anlage On/Off
- 🔅 - sonnig, die PV-Anlage erzeugt Strom
- ☁️ - bewölkt, die PV-Anlage liefert keinen Strom
- 🌔 - nachts, die PV-Anlage liefert keinen Strom

- 19:44 - Uhrzeit des letzten Datenupdates der Abfrage der sonnenBatterie (Timestamp)
- Online/⚡️Offline - Status der Verbindung der sonnenBatterie zum Internet (Status der Eclipse)

**2. Zeile**
- Name des Widgets

**3. bis 7. Zeile**
- **Grid:** OnGrid/⚡️OffGrid - Status der Verbindung der sonnenBatterie zum Stromnetz.
- **Counter:** - 999⤒ - Anzahl der gezählten Ladezyklen (Vollzyklen) für die Batterie.
- **T:** 23,45º-25,77º - Temperaturwerte der Zellen, minimaler Temperaturwert, maximaler Temperaturwert
- **R1**: Off/On **R2**: Off/On - Status der Abregelung der Limitstufe1 (Reduction1) und der Limitstufe2 (Reduction2), Off= Aus, On= Ein
- **R3**: Off/On - Status des Self Consumption Relay, Off= Aus, On= Ein

Zur Beachtung: Die Aktualisierung der Betriebsdaten der Batterie kann (zurzeit) nur dann durchgeführt werden, wenn sich das iPhone im Empfangsbereich des WLAN befindet. Sollte die Firma sonnen einen für das Widget erforderlichen iCloud-Zugang bereitstellen, dann können auch Daten der Batterien bereitgestellt werden, wenn man mit dem Handy unterwegs und ausserhalb des WLAN-Bereiches ist.

## Settings, Parameter

#### Widget1 - SBControl1

Im Script selbst sind in den dafür markierten Zeilen die folgenden Parameter einzugeben:

1. **IP-Adresse**: Gültige IP-Adresse der sonnenBatterie, über die die Batterie im LAN zu erreichen ist, in der Form 999:999:999:99.
2. **Token**: Gültiger Token für den Zugriff auf die REST-API der sonnenBatterie. Dieser kann dem Dashboard der Batterie, Menü 'Softwareintegration' entnommen werden.
3. **TimeoutInterval**: Zeit für den Abbruch der API-Abfrage, wenn keine Antwort zurück kommt, Standard = 1 Sekunde.
4. **FileManagerMode**: Parameter für die Speicherung der temporären Daten im iPhone-Speicher (LOKAL) oder in der Cloud (iCLOUD), Standard = ICLOUD.

#### Widget2 - SBControl2

Die IP-Adresse und ein Token sind für das Script2 nicht erforderlich. Lediglich die beiden folgenden Parameter sollten mit den Einstellungen im Script1 übereinstimmen:

1. **TimeoutInterval**: Zeit für den Abbruch der API-Abfrage, wenn keine Antwort zurück kommt, Standard = 1 Sekunde.
2. **FileManagerMode**: Parameter für die Speicherung der temporären Daten im iPhone-Speicher (LOKAL) oder in der Cloud (iCLOUD), Standard = ICLOUD.

## API-Schnittstellen

Die JSON-Daten der folgenden API-Schnittstellen werden verarbeitet:

````APIurl1 ="http://xxx.xxx.xxx.xx:80/api/v2/latestdata"```` --> LatestData.js

````APIurl2 ="http://xxx.xxx.xxx.xx:80/api/v2/status"```` --> StatusData.js

````APIurl3 ="http://xxx.xxx.xxx.xx:8080/api/battery"```` --> BatteryData.js

````APIurl4 ="http://xxx.xxx.xxx.xx:8080/api/ios"```` --> iOSData.js

#### Widget1: SBControl1
Die ausgelesenen Daten werden sofort für das Monitoring zur Anzeige gebracht. Eine Langzeitspeicherung der Daten, bspw. in einer Datenbank für die Visualisierung von 24-h-Tagestrends, erfolgt nicht. 

Nach jedem Lesezyklus der API-Daten werden diese jeweils in einer temporären JSON-Datei gespeichert, diese Daten werden bei Störung der Internetverbindung zur Anzeige gebracht und nach Wiederherstellung der Verbindungen sofort wieder überschrieben. 

#### Widget2: SBControl2
Das Widget2 liest die Daten der MonitoringData-Datei ein, die vom Widget1 gespeichert wurden. Es bewertet die Statuswerte der Batterie, gekennzeichnet diese ggf. besonders durch eine Farbzuordnung und bringt diese dann zur Anzeige. 

Die beiden Widgets laufen im Homescreen des iPhones bzw. iPads. Sie werden vom Betriebssystem in festen Zeitzyklen gestartet, dann wird die Datenanzeige aktualisiert. Dieser Zeitzyklus kann zurzeit nicht verändert werden; allerdings startet ein Tippen auf das Widget die Datenabfrage manuell, dann werden die aktuellen Daten der Batterie durch das Widget mit Hilfe der App Scriptable sofort angezeigt und aktualisiert.

Das **Widget01** erzeugt zwei zusätzliche Dateien:
1. für das Monitoring eine eigene JSON-Datei --> MonitoringData.js, die ausgewählte Betriebsdaten enthält.
2. eine Protokoll-Datei --> LogData.js, diese Datei enthält Systemmitteilungen und ggf. Fehlermeldungen.

##### Dateiordner mit API-Dateien und Protokolldatei
![Datenordner](/image/sbcontrol1-2.jpeg)

Die JSON-Datei "MonitoringData.js" hat den folgenden Aufbau hat:

##### JSON - Monitoring-Datei --> MonitoringData

````

{

  "jsonVersion": 1,
  "MonitoringCounter": 5,
  "Timestamp": "2021-01-12 18:37:16",
  "ConnectState": true,
  
  "SystemState": "OnGrid",
  "Production_W": 0,
  "Consumption_W": 560,
  "Pac_total_W": -5,
  "GridFeedIn_W": -565,
  "RSOC": 4,
  "USOC": 0,
  "BatteryCharging": false,
  "BatteryDischarging": false,
  "cyclecount": "802",
  "stateofhealth": "93.2",
  "minimumcelltemperature": "20.85",
  "maximumcelltemperature": "21.95",
  "selfConsumptionRelay": 0,
  "PV_Reduction_state": {
    "PV_Reduction_1": 0,
    "PV_Reduction_2": 0
  },
  "Eclipse_Led": {
    "Pulsing_White": true,
    "Pulsing_Orange": false,
    "Solid_Red": false,
    "Pulsing_Green": false
  }
}
````

## Changelog

2021/01/14: SBControl1, SBControl2 V1.0 (Widget) init
