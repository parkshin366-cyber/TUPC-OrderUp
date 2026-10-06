import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { Alert, Modal, Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { WebView, type WebViewMessageEvent } from "react-native-webview";

export type CampusPin = { latitude: number; longitude: number };

type Props = {
  visible: boolean;
  initialPin?: CampusPin | null;
  phoneLocation?: CampusPin | null;
  onClose: () => void;
  onConfirm: (pin: CampusPin) => void;
};

const CENTER = { latitude: 14.34582, longitude: 120.96589 };
const BOUNDS = { south: 14.3439, west: 120.9637, north: 14.3477, east: 120.9681 };
const CARDINAL = "#A6192E";

function insideCampus(pin: CampusPin) {
  return pin.latitude >= BOUNDS.south && pin.latitude <= BOUNDS.north && pin.longitude >= BOUNDS.west && pin.longitude <= BOUNDS.east;
}

export default function CampusLocationPicker({ visible, initialPin, phoneLocation, onClose, onConfirm }: Props) {
  const [selected, setSelected] = useState<CampusPin | null>(initialPin ?? null);
  const [mapKey, setMapKey] = useState(0);
  useEffect(() => {
    if (visible) {
      setSelected(initialPin ?? null);
      setMapKey((value) => value + 1);
    }
  }, [initialPin?.latitude, initialPin?.longitude, visible]);
  const mapHtml = useMemo(() => {
    const pin = selected ?? (phoneLocation && insideCampus(phoneLocation) ? phoneLocation : CENTER);
    return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <style>html,body,#map{height:100%;margin:0} .leaflet-control-attribution{font-size:9px} .campus-label{background:#A6192E;color:#fff;border:0;border-radius:8px;padding:5px 8px;font:700 11px sans-serif;box-shadow:0 2px 7px #0004}</style></head>
      <body><div id="map"></div><script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script><script>
      const bounds=L.latLngBounds([${BOUNDS.south},${BOUNDS.west}],[${BOUNDS.north},${BOUNDS.east}]);
      const map=L.map('map',{maxBounds:bounds.pad(.25),minZoom:17,maxZoom:20}).setView([${pin.latitude},${pin.longitude}],18);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:20,attribution:'&copy; OpenStreetMap contributors'}).addTo(map);
      L.rectangle(bounds,{color:'#A6192E',weight:2,fillColor:'#A6192E',fillOpacity:.05,dashArray:'6 5'}).addTo(map);
      L.marker([${CENTER.latitude},${CENTER.longitude}],{opacity:.01}).addTo(map).bindTooltip('TUP Cavite Campus',{permanent:true,direction:'top',className:'campus-label'});
      let marker=L.marker([${pin.latitude},${pin.longitude}],{draggable:true}).addTo(map);
      function valid(p){return bounds.contains(p)}
      function send(p){if(valid(p)){marker.setLatLng(p);window.ReactNativeWebView.postMessage(JSON.stringify({latitude:p.lat,longitude:p.lng}))}else{marker.setLatLng([${pin.latitude},${pin.longitude}]);window.ReactNativeWebView.postMessage(JSON.stringify({error:'outside'}))}}
      map.on('click',e=>send(e.latlng)); marker.on('dragend',e=>send(e.target.getLatLng()));
      </script></body></html>`;
  }, [mapKey, phoneLocation]);

  const choosePhoneLocation = () => {
    if (!phoneLocation) {
      Alert.alert("Location Unavailable", "Waiting for your phone location. Make sure location access is enabled.");
      return;
    }
    if (!insideCampus(phoneLocation)) {
      Alert.alert("Outside TUP Cavite", "Your phone location is outside the TUP Cavite campus. Tap the correct delivery point inside the campus map.");
      return;
    }
    setSelected(phoneLocation);
    setMapKey((value) => value + 1);
  };

  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.error === "outside") {
        Alert.alert("Campus Only", "Please place the delivery pin inside TUP Cavite.");
        return;
      }
      const pin = { latitude: Number(data.latitude), longitude: Number(data.longitude) };
      if (Number.isFinite(pin.latitude) && Number.isFinite(pin.longitude) && insideCampus(pin)) setSelected(pin);
    } catch { /* Ignore malformed map messages. */ }
  };

  return <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable style={styles.close} onPress={onClose}><Ionicons name="close" size={22} color="#171717" /></Pressable>
        <View style={styles.heading}><Text style={styles.title}>Pin Delivery Location</Text><Text style={styles.subtitle}>Tap or drag the pin inside TUP Cavite.</Text></View>
      </View>
      <View style={styles.mapWrap}>
        <WebView key={mapKey} source={{ html: mapHtml }} onMessage={handleMessage} javaScriptEnabled originWhitelist={["*"]} style={styles.map} />
        <View pointerEvents="none" style={styles.campusBadge}><Ionicons name="school-outline" size={15} color={CARDINAL} /><Text style={styles.campusBadgeText}>TUP Cavite campus map</Text></View>
      </View>
      <View style={styles.panel}>
        <Pressable style={styles.phoneButton} onPress={choosePhoneLocation}><Ionicons name="locate" size={18} color={CARDINAL} /><Text style={styles.phoneButtonText}>Use My Phone Location</Text></Pressable>
        <View style={styles.pinInfo}><Ionicons name={selected ? "location" : "location-outline"} size={20} color={selected ? CARDINAL : "#777"} /><View style={styles.pinCopy}><Text style={styles.pinTitle}>{selected ? "Delivery pin selected" : "Select a point on the map"}</Text><Text style={styles.pinCoordinates}>{selected ? `${selected.latitude.toFixed(6)}, ${selected.longitude.toFixed(6)}` : "The pin must be inside the campus boundary."}</Text></View></View>
        <Pressable disabled={!selected} style={[styles.confirm, !selected && styles.disabled]} onPress={() => selected && onConfirm(selected)}><Text style={styles.confirmText}>Confirm Delivery Pin</Text></Pressable>
      </View>
    </SafeAreaView>
  </Modal>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFFFFF" },
  header: { minHeight: 72, paddingHorizontal: 15, flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: "#E7E7E8" },
  close: { width: 42, height: 42, borderRadius: 13, backgroundColor: "#F3F3F4", alignItems: "center", justifyContent: "center" },
  heading: { flex: 1, marginLeft: 12 }, title: { fontSize: 17, fontWeight: "900", color: "#171717" }, subtitle: { marginTop: 3, fontSize: 10, color: "#737373" },
  mapWrap: { flex: 1, backgroundColor: "#EDEDED" }, map: { flex: 1 },
  campusBadge: { position: "absolute", top: 12, alignSelf: "center", paddingHorizontal: 12, height: 34, borderRadius: 17, backgroundColor: "#FFFFFF", flexDirection: "row", alignItems: "center", gap: 6, shadowColor: "#000", shadowOpacity: .15, shadowRadius: 6, elevation: 5 },
  campusBadgeText: { fontSize: 10, fontWeight: "900", color: "#171717" },
  panel: { padding: 16, paddingBottom: 20, borderTopWidth: 1, borderTopColor: "#E7E7E8" },
  phoneButton: { height: 44, borderRadius: 13, borderWidth: 1, borderColor: "#E8C4CA", backgroundColor: "#FFF7F8", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  phoneButtonText: { fontSize: 11, fontWeight: "900", color: CARDINAL },
  pinInfo: { marginTop: 12, padding: 12, borderRadius: 13, backgroundColor: "#F6F6F7", flexDirection: "row", alignItems: "center" },
  pinCopy: { flex: 1, marginLeft: 9 }, pinTitle: { fontSize: 11, fontWeight: "900", color: "#171717" }, pinCoordinates: { marginTop: 3, fontSize: 9.5, color: "#737373" },
  confirm: { height: 48, marginTop: 12, borderRadius: 14, backgroundColor: CARDINAL, alignItems: "center", justifyContent: "center" }, disabled: { opacity: .45 }, confirmText: { fontSize: 12, fontWeight: "900", color: "#FFFFFF" },
});
