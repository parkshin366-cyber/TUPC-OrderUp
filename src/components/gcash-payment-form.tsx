import { useEffect, useState } from "react";
import { Image, Platform, useWindowDimensions, Pressable, Text, TextInput, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";
import { File, Paths } from "expo-file-system";
import { useAppTheme } from "../context/ThemeContext";
import type { RegisterImage, Store } from "../services/api";

type Props = { store: Store | null; total: number; reference: string; onReference: (value: string) => void; proof?: RegisterImage; onProof: (value: RegisterImage) => void; confirmed: boolean; onConfirmed: (value: boolean) => void; disabled: boolean };
export default function GcashPaymentForm({store,total,reference,onReference,proof,onProof,confirmed,onConfirmed,disabled}:Props) {
 const {colors}=useAppTheme(); const {width}=useWindowDimensions(); const qrSize=Math.min(width-72,320); const [error,setError]=useState(""); const [busy,setBusy]=useState(false);
 useEffect(()=>{onConfirmed(false);},[total,store?._id,reference,onConfirmed]);
 const text={color:colors.text,fontSize:14};
 async function pick(){
  try { const result=await ImagePicker.launchImageLibraryAsync({mediaTypes:["images"],quality:0.9});
   if(!result.canceled){const image=result.assets[0]; if(image.fileSize && image.fileSize>5*1024*1024) throw new Error("Choose a screenshot smaller than 5 MB."); onProof({uri:image.uri,name:image.fileName || "payment.jpg",type:image.mimeType || "image/jpeg"});setError("");}
  } catch(e){setError(e instanceof Error?e.message:"Unable to select screenshot.");}
 }
 async function saveQr(){
  if(!store?.gcashQrImage)return; setBusy(true);setError("");
  try {if(Platform.OS==="web"){
    const response=await fetch(store.gcashQrImage,{headers:{"ngrok-skip-browser-warning":"true"}});
    if(!response.ok) throw new Error("QR download failed.");
    const url=URL.createObjectURL(await response.blob()); const link=document.createElement("a");link.href=url;link.download="seller-gcash-qr.png";document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);return;
   }
   const permission=await MediaLibrary.requestPermissionsAsync(true);
   if(!permission.granted) throw new Error("Allow photo access to save the QR in your gallery.");
   const file=await File.downloadFileAsync(store.gcashQrImage,new File(Paths.cache,`gcash-qr-${Date.now()}.png`),{headers:{"ngrok-skip-browser-warning":"true"}});
   await MediaLibrary.createAssetAsync(file.uri);
  }catch(e){setError(e instanceof Error?e.message:"Unable to save QR.");}finally{setBusy(false);}
 }
 return <View style={{padding:18,borderRadius:16,borderWidth:1,borderColor:colors.border,backgroundColor:colors.surface,gap:12}}>
  <Text style={{...text,fontSize:18,fontWeight:"800"}}>Pay the seller with GCash</Text>
  <Text selectable style={text}>{store?.gcashName} • {store?.gcashNumber}</Text>
  <Text style={{...text,fontWeight:"800"}}>Amount: PHP {total.toFixed(2)}</Text>
  {store?.gcashQrImage ? <><Image source={{uri:store.gcashQrImage}} style={{width:qrSize,height:qrSize,alignSelf:"center",backgroundColor:"white"}} resizeMode="contain"/><Pressable disabled={busy} onPress={saveQr}><Text style={{...text,color:colors.cardinal,fontWeight:"700"}}>{busy?"Saving QR…":"Save seller QR to gallery"}</Text></Pressable><Text style={text}>In GCash, choose QR, then upload the saved QR or scan it from another screen. Check the recipient and amount before sending.</Text></> : <Text style={text}>The seller has not uploaded a QR yet. Send to the GCash number above.</Text>}
  <Text style={text}>After paying, enter the reference and upload the payment screenshot. Keep the reference number, amount, recipient and date visible.</Text>
  <TextInput accessibilityLabel="GCash reference number" placeholder="13-digit reference number" placeholderTextColor={colors.textSecondary} value={reference} onChangeText={v=>onReference(v.replace(/\D/g,""))} keyboardType="number-pad" maxLength={13} editable={!disabled} style={{...text,padding:14,borderWidth:1,borderColor:colors.border,borderRadius:10}}/>
  <Pressable disabled={disabled} onPress={pick} style={{padding:14,borderRadius:10,backgroundColor:colors.cardinal}}><Text style={{color:"white",textAlign:"center",fontWeight:"700"}}>{proof?"Replace payment screenshot":"Upload payment screenshot"}</Text></Pressable>
  {proof && <Image source={{uri:proof.uri}} resizeMode="contain" style={{width:"100%",height:280}}/>}
  <Pressable accessibilityRole="checkbox" accessibilityState={{checked:confirmed}} disabled={disabled} onPress={()=>onConfirmed(!confirmed)} style={{flexDirection:"row",gap:10,alignItems:"center"}}><Text style={{...text,fontSize:23}}>{confirmed?"☑":"□"}</Text><Text style={{...text,flex:1}}>I sent PHP {total.toFixed(2)} to this seller. The screenshot and reference belong to this payment.</Text></Pressable>
  <Text style={text}>Your order stays pending until the seller confirms receiving the money.</Text>
  {!!error && <Text style={{color:colors.cardinal}}>{error}</Text>}
 </View>;
}
