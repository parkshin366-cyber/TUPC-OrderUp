import { useEffect, useState } from "react";
import { Image, Modal, Pressable, ScrollView, Text, View } from "react-native";
import { useAppTheme } from "../context/ThemeContext";
import { getGcashProof, reviewGcashPayment, type Order } from "../services/api";
export default function GcashPaymentReview({order,token,onReviewed}:{order:Order;token:string;onReviewed:()=>void}){
 const {colors}=useAppTheme();const [proof,setProof]=useState<Awaited<ReturnType<typeof getGcashProof>>>();const [open,setOpen]=useState(false);const [busy,setBusy]=useState(false);const [error,setError]=useState("");const [action,setAction]=useState<"verify"|"reject"|null>(null);
 useEffect(() => { setProof(undefined); setOpen(false); setAction(null); setError(""); }, [order._id]);
 const text={color:colors.text,fontSize:14};
 async function view(){setProof(undefined);setBusy(true);setError("");try{setProof(await getGcashProof(token,order._id));setOpen(true);}catch(e){setError(e instanceof Error?e.message:"Unable to load screenshot");}finally{setBusy(false);}}
 async function confirm(){if(!action||busy)return;setBusy(true);setError("");try{await reviewGcashPayment(token,order._id,action);setAction(null);setOpen(false);onReviewed();}catch(e){setError(e instanceof Error?e.message:"Unable to review payment");}finally{setBusy(false);}}
 const button=(label:string,fn:()=>void)=><Pressable disabled={busy} onPress={fn} style={{padding:12,borderRadius:10,borderWidth:1,borderColor:colors.cardinal}}><Text style={{...text,color:colors.cardinal,fontWeight:"700"}}>{label}</Text></Pressable>;
 return <View style={{padding:14,gap:10,borderWidth:1,borderColor:colors.border,borderRadius:12,backgroundColor:colors.surface}}><Text style={{...text,fontWeight:"800"}}>GCash • {order.paymentStatus==="paid"?"Verified":order.paymentStatus==="failed"?"Rejected":"For verification"}</Text><Text selectable style={text}>Reference: {order.gcashReference || "Not provided"}</Text>{button(busy?"Loading…":"View payment screenshot",view)}{!!error&&!open&&<Text style={text}>{error}</Text>}
 <Modal visible={open} onRequestClose={()=>{if(!busy){setOpen(false);setAction(null);}}} animationType="slide"><ScrollView contentContainerStyle={{padding:24,paddingTop:50,gap:16,backgroundColor:colors.surface,flexGrow:1}}>
 <Text style={{...text,fontSize:20,fontWeight:"800"}}>Review GCash payment</Text><Text selectable style={text}>Reference: {order.gcashReference}</Text><Text style={text}>Amount due: PHP {Number(order.total).toFixed(2)}</Text><Text style={text}>Recipient: {proof?.recipientName} • {proof?.recipientNumber}</Text>{proof&&<Image source={{uri:proof.image}} resizeMode="contain" style={{width:"100%",height:500}}/>}
 <Text style={text}>Check your own GCash transaction history. Match the received amount, reference and recipient. A screenshot alone does not confirm payment.</Text>
 {order.paymentStatus==="pending"&&order.status==="Pending"&&proof&&<>{action?<><Text style={{...text,fontWeight:"700"}}>{action==="verify"?"Confirm you received this payment in your GCash account?":"Reject this payment and cancel the order? If money was received, arrange its return separately."}</Text>{button(busy?"Saving…":"Confirm",confirm)}{button("Go back",()=>setAction(null))}</>:<>{button("I received the payment",()=>setAction("verify"))}{button("Reject payment",()=>setAction("reject"))}</>}</>}
 {!!error&&<Text style={text}>{error}</Text>}{button("Close",()=>{setOpen(false);setAction(null);})}</ScrollView></Modal></View>;
}
