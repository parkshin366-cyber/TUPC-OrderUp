import assert from "node:assert/strict";
import { test } from "node:test";
import Order from "../src/models/Order";
import { getPaymentProof, reviewGcashPayment } from "../src/controllers/orderController";
const id="507f1f77bcf86cd799439011";
function response(){return {code:200,body:null as any,headers:{} as any,status(n:number){this.code=n;return this;},json(b:any){this.body=b;return this;},setHeader(k:string,v:string){this.headers[k]=v;}};}
test("payment screenshots are private and restricted to order parties",async()=>{
 const original=Order.findOne; let query:any;
 (Order as any).findOne=(filter:any)=>{query=filter;return {select:async()=>null};};
 try{const res=response();await getPaymentProof({params:{orderId:id},userId:"customer-a"} as any,res as any);assert.deepEqual(query.$or,[{customer:"customer-a"},{seller:"customer-a"}]);assert.equal(res.code,404);}finally{Order.findOne=original;}
});
test("review only updates this seller's pending manual payment once",async()=>{
 const original=Order.findOneAndUpdate;let query:any;
 (Order as any).findOneAndUpdate=async(filter:any)=>{query=filter;return null;};
 try{const res=response();await reviewGcashPayment({params:{orderId:id},userId:"seller-a",body:{action:"verify"}} as any,res as any);assert.equal(query.seller,"seller-a");assert.equal(query.paymentStatus,"pending");assert.equal(query.status,"Pending");assert.deepEqual(query.gcashProof,{$exists:true});assert.equal(res.code,409);}finally{Order.findOneAndUpdate=original;}
});
test("invalid payment review action is rejected before database access",async()=>{const res=response();await reviewGcashPayment({params:{orderId:id},body:{action:"paid"}} as any,res as any);assert.equal(res.code,400);});
test("manual reference has a unique partial index and proof is excluded by default",()=>{assert.equal(Order.schema.path("gcashProof").options.select,false);assert.ok(Order.schema.indexes().some(([fields,options])=>fields.gcashManualReference===1&&options.unique&&options.partialFilterExpression));});
