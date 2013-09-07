//
function s3_Action(_1,_2,_3,_4,_5){
this.accessCode=_1;
this.secretKey=_2;
this.isSecure=_3;
this.callbackObj=_4;
this.callbackFunc=_5;
this.arrFiles=new Array();
this.hasErrors=false;
this.statusMessage="";
this.errorMessage="";
this.httpClient=null;
}
s3_Action.prototype={setError:function(_6,_7){
if(_7){
alert(_6);
}
this.hasErrors=true;
this.errorMessage=_6;
},sortHeaders:function(x,y){
if(x.name.toLowerCase()<y.name.toLowerCase()){
return -1;
}else{
if(x.name.toLowerCase()>y.name.toLowerCase()){
return 1;
}
}
return 0;
},getHeaderString:function(_a,_b){
var _c="";
if(_a!=null&&_a.length>0){
_a.sort(this.sortHeaders);
for(var i=0;i<_a.length;i++){
_c+=_a[i].name+":"+_a[i].value+_b;
}
}
return _c;
},getAuthHeader:function(_e,_f){
var _10=s3_encUtils.b64_hmac_sha1(this.secretKey,_e);
return !_f?s3_Utils.stringFormat("AWS {0}:{1}",s3_uiManager.accessCode,_10):s3_Utils.stringFormat("Authorization:AWS {0}:{1}",s3_uiManager.accessCode,_10);
},getBucketFromUrl:function(_11){
var _12=_11.indexOf("/",1);
var _13=_11.length;
if(_12!=-1){
_13=_12;
}
var _14=_11.substring(1,_13);
_14=_14.replace(/\/|\\/gi,"");
return _14;
},abortRequest:function(){
if(this.httpClient!=null){
s3_dump("abort request");
this.httpClient.abort();
}
},encodeS3:function(str){
str=encodeURIComponent(str);
str=str.replace(/'/gi,"%27");
str=str.replace(/%2F/gi,"/");
return str;
},getHostUrl1:function(_16){
var _17,_18;
if(this.isSecure){
_17="https://";
_18="https://s3.amazonaws.com";
}else{
_17="http://";
_18="http://s3.amazonaws.com";
}
var _19=this.getBucketFromUrl(_16);
var url;
var _1b=new RegExp("/"+_19+"/|/"+_19);
var _1c=_16.replace(_1b,"");
if(_19.toLowerCase()===_19&&_19!=""){
url=_17+_19+".s3.amazonaws.com/"+_1c;
}else{
if(_19!=""){
_19+="/";
}
url=_17+"s3.amazonaws.com/"+_19+_1c;
}
return url;
},getHostUrl:function(_1d){
var _1e,_1f;
if(this.isSecure){
_1e="https://";
_1f="https://s3.amazonaws.com";
}else{
_1e="http://";
_1f="http://s3.amazonaws.com";
}
_1d=_1d.toString();
var _20=this.getBucketFromUrl(_1d);
var url;
var str="(/"+_20.toString()+"/|/"+_20.toString()+")";
var _23=new RegExp(str,"i");
var _24=_1d.replace(_23,"");
if(_20.toLowerCase()===_20&&_20!=""){
url=_1e+_20+".s3.amazonaws.com/"+_24;
}else{
if(_20!=""){
_20+="/";
}
url=_1e+"s3.amazonaws.com/"+_20+_24;
}
return url;
},getHttpClient:function(){
return new s3_HttpClient(this);
},listAllBuckets:function(){
this.httpClient=this.getHttpClient();
var _25=new Array();
var _26="/";
var _27=(new Date()).toUTCString();
var _28="";
var _29="";
var _2a=s3_Utils.stringFormat("GET\n\n{0}\n{1}\n{2}{3}",_29,_27,_28,_26);
var _2b=this.getAuthHeader(_2a);
_25.push(new s3_Header("Authorization",_2b));
_25.push(new s3_Header("Date",_27));
this.httpClient.doRequest("GET",this.getHostUrl(_26),"","",_25,false,function(_2c){
if(_2c.hasErrors){
this.setError(_2c.statusMessage);
}else{
var _2d=_2c.xmlDoc;
if(_2d==null){
this.setError("Error getting response from server.");
if(this.callbackFunc){
this.callbackFunc.call(this.callbackObj);
}
}
var _2e=_2d.getElementsByTagName("Bucket");
for(var i=0;i<_2e.length;i++){
var _30=_2e[i].getElementsByTagName("Name")[0].firstChild.nodeValue;
var _31=_2e[i].getElementsByTagName("CreationDate")[0].firstChild.nodeValue;
_31=s3_Utils.getDate(_31);
var _32=new s3_remoteFileInfo(_30,0,_31,true,"/"+_30,"/"+_30);
this.arrFiles.push(_32);
}
}
if(this.callbackFunc){
this.callbackFunc.call(this.callbackObj);
}
});
},listFiles:function(_33,_34,_35,_36,_37){
if(_34){
delete this.arrFiles;
this.arrFiles=new Array;
}
var _38=_33.substring(0,_33.indexOf("/",1));
var _39=_33.substr(_33.indexOf("/",1)+1);
var _3a=_38+"/";
_39=this.encodeS3(_39);
var _3b="&delimiter=/";
if(_35){
_3b="";
}
if(_36==null){
_36="";
}
this.httpClient=this.getHttpClient();
var _3c=new Array();
var _3d="";
var _3e="";
var _3f=(new Date()).toUTCString();
var _40=s3_Utils.stringFormat("GET\n\n{0}\n{1}\n{2}{3}",_3e,_3f,_3d,_3a);
var _41=this.getAuthHeader(_40);
_3c.push(new s3_Header("Authorization",_41));
_3c.push(new s3_Header("Date",_3f));
var _42=s3_Utils.stringFormat("prefix={0}&marker={1}{2}",_39,_36,_3b);
var url=this.getHostUrl(_38);
if(url.indexOf("https")!=-1&&_38.indexOf(".")!=-1){
var res=s3_remoteTreeView.showBadCertMessage(url);
if(!res){
return;
}
}
this.httpClient.doRequest("GET",url,_42,null,_3c,false,function(_45){
if(_45.hasErrors){
this.setError(_45.statusMessage);
if(this.callbackFunc){
this.callbackFunc.call(this.callbackObj);
}
return;
}
var _46=_45.xmlDoc;
this.populateFiles(_46,_33);
var _47=s3_Utils.getTagValue(_46,"IsTruncated");
if(_47=="true"){
if(_37){
_37.call(this.callbackObj);
}
if(_46.getElementsByTagName("NextMarker").length>0){
var _48=s3_Utils.getTagValue(_46,"NextMarker");
s3_dump("prog callback = "+_48);
var _49=this;
_49.listFiles(_33,false,false,_48,_37);
}else{
var _4a=_46.getElementsByTagName("Contents");
if(_4a.length>0){
_48=_4a[_4a.length-1].getElementsByTagName("Key")[0].firstChild.nodeValue;
s3_dump("prog callback = "+_48);
this.listAllFiles(_33,false,false,_48,_37);
}
}
}else{
if(this.callbackFunc){
this.callbackFunc.call(this.callbackObj);
}
}
});
},listAllFiles:function(_4b,_4c,_4d){
if(_4c){
delete this.arrFiles;
this.arrFiles=new Array;
}
var _4e=_4b.substring(0,_4b.indexOf("/",1));
var _4f=_4b.substr(_4b.indexOf("/",1)+1);
var _50=_4e+"/";
_4f=this.encodeS3(_4f);
var _51="";
if(_4d==null){
_4d="";
}
this.httpClient=this.getHttpClient();
var _52=new Array();
var _53="";
var _54="";
var _55=(new Date()).toUTCString();
var _56=s3_Utils.stringFormat("GET\n\n{0}\n{1}\n{2}{3}",_54,_55,_53,_50);
var _57=this.getAuthHeader(_56);
_52.push(new s3_Header("Authorization",_57));
_52.push(new s3_Header("Date",_55));
var _58=s3_Utils.stringFormat("prefix={0}&marker={1}{2}",_4f,_4d,_51);
this.httpClient.doRequest("GET",this.getHostUrl(_4e),_58,null,_52,false,function(_59){
if(_59.hasErrors){
this.setError(_59.statusMessage);
if(this.callbackFunc){
this.callbackFunc.call(this.callbackObj);
}
return;
}
var _5a=_59.xmlDoc;
this.populateFiles(_5a,_4b);
var _5b=s3_Utils.getTagValue(_5a,"IsTruncated");
if(_5b=="true"){
var _5c;
if(_5a.getElementsByTagName("NextMarker").length>0){
var _5c=s3_Utils.getTagValue(_5a,"NextMarker");
s3_dump("prog callback = "+_5c);
this.listAllFiles(_4b,false,_5c);
}else{
var _5d=_5a.getElementsByTagName("Contents");
if(_5d.length>0){
_5c=_5d[_5d.length-1].getElementsByTagName("Key")[0].firstChild.nodeValue;
s3_dump("prog callback = "+_5c);
this.listAllFiles(_4b,false,_5c);
}
}
}else{
if(this.callbackFunc){
this.callbackFunc.call(this.callbackObj);
}
}
});
},populateFiles:function(_5e,_5f){
if(_5e==null){
return;
}
var _60=_5f.substring(0,_5f.indexOf("/",1)+1);
var _61=_5f.replace(_60,"");
_60=_60.replace(/\//gi,"");
var _62=_5e.getElementsByTagName("Contents");
for(var i=0;i<_62.length;i++){
var _64=_62[i].getElementsByTagName("Key")[0].firstChild.nodeValue;
var _65=_62[i].getElementsByTagName("LastModified")[0].firstChild.nodeValue;
var _66=_62[i].getElementsByTagName("Size")[0].firstChild.nodeValue;
var _67=false;
var _68=_62[i].getElementsByTagName("ETag")[0].firstChild.nodeValue;
if(_68!=null){
if(_68=="\"d66759af42f282e1ba19144df2d405d0\""){
_67=true;
}
}
if(_64.indexOf("_$folder$")!=-1){
_67=true;
_64=_64.replace("_$folder$","");
}
_64=_64.replace(_61,"");
var _69="http://";
var _6a=_69+_60+".s3.amazonaws.com/"+_61+_64;
_65=s3_Utils.getDate(_65);
if(this.fileExists(_64)==-1){
var _6b=_64.substr(_64.lastIndexOf("/")+1);
var _6c=new s3_remoteFileInfo(_6b,_66,_65,_67,_5f+_64,_6a);
if(_68!=null){
_6c.eTag=_68;
}
if(this.filesAsHashTable){
this.arrFiles[_5f+_64]=_6c;
}else{
this.arrFiles.push(_6c);
}
}
}
var _6d=_5e.getElementsByTagName("CommonPrefixes");
for(var i=0;i<_6d.length;i++){
var _64=_6d[i].getElementsByTagName("Prefix")[0].firstChild.nodeValue;
_64=_64.replace(_61,"");
_64=_64.substring(0,_64.indexOf("/"));
var _67=true;
_65="";
_66=0;
var _69="http://";
var _6a=_69+_60+".s3.amazonaws.com/"+_61+_64;
if(this.fileExists(_64)==-1){
var _6c=new s3_remoteFileInfo(_64,_66,_65,_67,_5f+_64,_6a);
if(this.filesAsHashTable){
this.arrFiles[_5f+_64]=_6c;
}else{
this.arrFiles.push(_6c);
}
}
}
},fileExists:function(_6e){
for(var i=0;i<this.arrFiles.length;i++){
if(this.arrFiles[i].fileName==_6e){
return i;
}
}
return -1;
},createBucket:function(_70,_71){
var _72=null;
var _73="/"+_70+"/";
this.httpClient=this.getHttpClient();
var _74=new Array();
var _75="";
var _76="";
if(_71!="US"){
_72="<CreateBucketConfiguration>"+"<LocationConstraint>"+_71+"</LocationConstraint>"+"</CreateBucketConfiguration>";
_76="text/plain; charset=UTF-8";
}
var _77=(new Date()).toUTCString();
var _78=s3_Utils.stringFormat("PUT\n\n{0}\n{1}\n{2}{3}",_76,_77,_75,_73);
var _79=this.getAuthHeader(_78);
_74.push(new s3_Header("Authorization",_79));
_74.push(new s3_Header("Date",_77));
this.httpClient.doRequest("PUT",this.getHostUrl(_73),"",_72,_74,false,function(_7a){
if(_7a.hasErrors){
this.setError(_7a.statusMessage);
}
if(this.callbackFunc){
this.callbackFunc.call(this.callbackObj,!_7a.hasErrors);
}
});
},createRemoteFolder:function(_7b,_7c){
var _7d=null;
var _7e=_7c+this.encodeS3(_7b);
this.httpClient=this.getHttpClient();
var _7f=new Array();
var _80="";
var _81="";
var _82=(new Date()).toUTCString();
var _83=s3_Utils.stringFormat("PUT\n\n{0}\n{1}\n{2}{3}",_81,_82,_80,_7e);
var _84=this.getAuthHeader(_83);
_7f.push(new s3_Header("Authorization",_84));
_7f.push(new s3_Header("Date",_82));
this.httpClient.doRequest("PUT",this.getHostUrl(_7e),"",_7d,_7f,false,function(_85){
if(_85.hasErrors){
this.setError(_85.statusMessage);
}
if(this.callbackFunc){
this.callbackFunc.call(this.callbackObj,!_85.hasErrors);
}
});
},deleteFile:function(_86){
var _87=_86.indexOf("/",1);
if(_87==-1){
_86+="/";
}
var _88=this.encodeS3(_86);
this.httpClient=this.getHttpClient();
var _89=new Array();
var _8a="";
var _8b="";
var _8c=(new Date()).toUTCString();
var _8d=s3_Utils.stringFormat("DELETE\n\n{0}\n{1}\n{2}{3}",_8b,_8c,_8a,_88);
var _8e=this.getAuthHeader(_8d);
_89.push(new s3_Header("Authorization",_8e));
_89.push(new s3_Header("Date",_8c));
this.httpClient.doRequest("DELETE",this.getHostUrl(_88),"",null,_89,false,function(_8f){
if(_8f.hasErrors){
this.setError(_8f.statusMessage);
}
if(this.callbackFunc){
this.callbackFunc.call(this.callbackObj,!_8f.hasErrors);
}
});
},getAcls:function(_90){
var _91=_90.indexOf("/",1);
if(_91==-1){
_90+="/";
}
var _92=this.encodeS3(_90)+"?acl";
this.httpClient=this.getHttpClient();
var _93=new Array();
var _94="";
var _95="";
var _96=(new Date()).toUTCString();
var _97=s3_Utils.stringFormat("GET\n\n{0}\n{1}\n{2}{3}",_95,_96,_94,_92);
var _98=this.getAuthHeader(_97);
_93.push(new s3_Header("Authorization",_98));
_93.push(new s3_Header("Date",_96));
this.httpClient.doRequest("GET",this.getHostUrl(_92),"",null,_93,false,function(_99){
if(_99.hasErrors){
this.setError(_99.statusMessage);
if(this.callbackFunc){
this.callbackFunc.call(this.callbackObj,null);
}
return;
}
var _9a=_99.xmlDoc;
if(_9a==null){
return null;
}
var _9b=_9a.getElementsByTagName("AccessControlList");
var _9c=_9b[0].getElementsByTagName("Grant");
var _9d=new s3_AccessPolicy();
for(var i=0;i<_9c.length;i++){
var _9f=_9c[i].getElementsByTagName("Grantee")[0];
if(_9f==null){
return null;
}
var id,_a1;
if(_9f.getAttribute("xsi:type")=="Group"){
id=_9c[i].getElementsByTagName("URI")[0].firstChild.nodeValue;
}else{
if(_9f.getAttribute("xsi:type")=="CanonicalUser"){
id=_9c[i].getElementsByTagName("ID")[0].firstChild.nodeValue;
_a1=_9c[i].getElementsByTagName("DisplayName")[0].firstChild.nodeValue;
}
}
var _a2=_9c[i].getElementsByTagName("Permission")[0].firstChild.nodeValue;
var _a3=_9c[i].getElementsByTagName("Grantee")[0].getAttribute("xsi:type");
var _a4=_9d.findGrantee(id);
if(_a4!=-1){
var _9f=_9d.grant[_a4];
_9f.arrPermissions.push(_a2);
}else{
var _9f=new s3_Grantee(_a3,id,_a1);
_9f.arrPermissions.push(_a2);
_9d.addGrantee(_9f);
}
}
var _a5=_9a.getElementsByTagName("Owner")[0];
id=_a5.getElementsByTagName("ID")[0].firstChild.nodeValue;
_a1=_a5.getElementsByTagName("DisplayName")[0].firstChild.nodeValue;
var _a4=_9d.findGrantee(id);
if(_a4==-1){
var _9f=new s3_Grantee("CanonicalUser",id,_a1);
_9d.addGrantee(_9f);
_9d.owner=_9f;
}else{
_9d.owner=_9d.grant[_a4];
}
if(this.callbackFunc){
this.callbackFunc.call(this.callbackObj,_9d);
}
});
},setAcls:function(_a6,acl){
var _a8=_a6.indexOf("/",1);
if(_a8==-1){
_a6+="/";
}
var _a9=this.encodeS3(_a6)+"?acl";
this.httpClient=this.getHttpClient();
var _aa=new Array();
var _ab="";
var _ac="application/xml; charset=UTF-8";
var _ad=(new Date()).toUTCString();
var _ae=s3_Utils.stringFormat("PUT\n\n{0}\n{1}\n{2}{3}",_ac,_ad,_ab,_a9);
var _af=this.getAuthHeader(_ae);
_aa.push(new s3_Header("Authorization",_af));
_aa.push(new s3_Header("Date",_ad));
_aa.push(new s3_Header("Content-Type",_ac));
this.httpClient.doRequest("PUT",this.getHostUrl(_a9),"",acl,_aa,false,function(_b0){
if(_b0.hasErrors){
this.setError(_b0.statusMessage);
}
if(this.callbackFunc){
this.callbackFunc.call(this.callbackObj,!_b0.hasErrors);
}
});
},getHeaderInfo:function(_b1){
var _b2=_b1.indexOf("/",1);
if(_b2==-1){
_b1+="/";
}
var _b3=this.encodeS3(_b1);
this.httpClient=this.getHttpClient();
var _b4=new Array();
var _b5="";
var _b6="";
var _b7=(new Date()).toUTCString();
var _b8=s3_Utils.stringFormat("HEAD\n\n{0}\n{1}\n{2}{3}",_b6,_b7,_b5,_b3);
var _b9=this.getAuthHeader(_b8);
_b4.push(new s3_Header("Authorization",_b9));
_b4.push(new s3_Header("Date",_b7));
this.httpClient.doRequest("HEAD",this.getHostUrl(_b3),"",null,_b4,false,function(_ba){
if(_ba.hasErrors){
this.setError(_ba.statusMessage);
}
if(this.callbackFunc){
this.callbackFunc.call(this.callbackObj,!_ba.hasErrors,_ba.responseHeaders);
}
});
},getAclForUpload:function(_bb){
var _bc=_bb.indexOf("/",1);
if(_bc==-1){
_bb+="/";
}
var _bd=this.encodeS3(_bb)+"?acl";
this.httpClient=this.getHttpClient();
var _be=new Array();
var _bf="";
var _c0="";
var _c1=(new Date()).toUTCString();
var _c2=s3_Utils.stringFormat("GET\n\n{0}\n{1}\n{2}{3}",_c0,_c1,_bf,_bd);
var _c3=this.getAuthHeader(_c2);
_be.push(new s3_Header("Authorization",_c3));
_be.push(new s3_Header("Date",_c1));
this.httpClient.doRequest("GET",this.getHostUrl(_bd),"",null,_be,false,function(_c4){
if(_c4.hasErrors){
this.setError(_c4.statusMessage);
if(this.callbackFunc){
this.callbackFunc.call(this.callbackObj,null);
}
return;
}
var _c5=_c4.xmlDoc;
if(_c5==null){
return null;
}
var _c6=new XMLSerializer();
var _c7=_c6.serializeToString(_c5);
if(this.callbackFunc){
this.callbackFunc.call(this.callbackObj,_c7);
}
});
},uploadObject:function(_c8,_c9,_ca,_cb,_cc,_cd,_ce){
var _cf=_cb+_c9;
var _d0=s3_Utils.localPath(_ca+"\\"+_c9);
var _d1=Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
_d1.initWithPath(_d0);
if(!_d1.exists()){
this.setError("File does not exist");
if(this.callbackFunc){
this.callbackFunc.call(this.callbackObj,false);
}
}
if(_d1.isDirectory()){
if(_cb!="/"){
_cf+="_$folder$";
}
}
var _d2=function(_d3){
var _d4=_c9.substring(_c9.lastIndexOf(".")+1,_c9.length);
var _d5=Components.classes["@mozilla.org/mime;1"].getService(Components.interfaces.nsIMIMEService);
try{
strMime=_d5.getTypeFromExtension(_d4);
}
catch(ex){
strMime="application/x-unknown-content-type";
}
this.httpClient=this.getHttpClient();
var _d6=[{"name":"x-amz-meta-s3fox-modifiedtime","value":_d1.lastModifiedTime},{"name":"x-amz-meta-s3fox-filesize","value":_d1.fileSize}];
var _d7=strMime;
s3_dump("upload = "+_cd);
if(_cd!=null){
if(s3_Utils.trim(_cd.contentType)!=""){
_d7=_cd.contentType;
}
for(var p=0;p<_cd.headers.length;p++){
_d6.push({"name":_cd.headers[p].name,"value":_cd.headers[p].value});
}
}
var _d9=this.getHeaderString(_d6,"\n");
var _da=(new Date()).toUTCString();
var _db=s3_Utils.stringFormat("PUT\n\n{0}\n{1}\n{2}{3}",_d7,_da,_d9,this.encodeS3(_cf));
s3_dump("s3_Action; upload Func; strToSign = "+_db);
var _dc=this.getAuthHeader(_db);
_d6.push(new s3_Header("Content-Type",_d7));
_d6.push(new s3_Header("Authorization",_dc));
_d6.push(new s3_Header("Date",_da));
s3_dump("s3_Actions; upload object; resLoc = "+_cf+", localFilePath = "+_d0);
this.httpClient.uploadFile("PUT",this.getHostUrl(this.encodeS3(_cf)),_d0,_d6,function(_dd){
if(_dd.hasErrors){
this.setError(_dd.statusMessage);
if(this.callbackFunc){
this.callbackFunc.call(this.callbackObj,{isSuccess:!_dd.hasErrors,actionId:_c8,statusMessage:_dd.statusMessage});
}
}else{
if(_cc){
var act=new s3_Action(this.accessCode,this.secretKey,this.isSecure,this,function(_df){
if(!_df){
this.setError("Error setting ACL");
}
if(this.callbackFunc){
this.callbackFunc.call(this.callbackObj,{isSuccess:_df,actionId:_c8,statusMessage:this.errorMessage});
}
});
act.setAcls(_cf,_d3);
}else{
if(this.callbackFunc){
this.callbackFunc.call(this.callbackObj,{isSuccess:!_dd.hasErrors,actionId:_c8,statusMessage:""});
}
}
}
},function(_e0){
if(_ce){
_ce.call(this.callbackObj,{isSuccess:true,actionId:_c8,progress:_e0,statusMessage:""});
}
});
};
if(_cc){
var act=new s3_Action(this.accessCode,this.secretKey,this.isSecure,this,function(_e2){
if(_e2==null){
this.setError("Error getting ACL for the project");
if(this.callbackFunc){
this.callbackFunc.call(this.callbackObj,{isSuccess:false,actionId:_c8,statusMessage:"Error getting ACL for the project"});
}
}else{
_d2.call(this,_e2);
}
});
act.getAclForUpload(_cf);
}else{
_d2.call(this);
}
},downloadObject:function(_e3,_e4,_e5,_e6,_e7,_e8,_e9,_ea,_eb){
try{
if(_e9){
var _ec=Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
var _ed=s3_Utils.localPath(_e6);
_ec.initWithPath(_ed);
if(!_ec.exists()||!_ec.isDirectory()){
_ec.create(Components.interfaces.nsIFile.DIRECTORY_TYPE,509);
}
if(this.callbackFunc){
this.callbackFunc.call(this.callbackObj,{isSuccess:true,actionId:_e3,statusMessage:""});
}
}else{
var _ee=this.encodeS3(_e5);
this.httpClient=this.getHttpClient();
var _ef=[];
var _f0="";
var _f1="";
var _f2=(new Date()).toUTCString();
var _f3=s3_Utils.stringFormat("GET\n\n{0}\n{1}\n{2}{3}",_f1,_f2,_f0,_ee);
s3_dump("s3_Action; download Func; strToSign = "+_f3);
var _f4=this.getAuthHeader(_f3);
_ef.push(new s3_Header("Authorization",_f4));
_ef.push(new s3_Header("Date",_f2));
var _f5=this.getHeaderString(_ef,"\r\n");
this.httpClient.downloadFile(_e4,_e6,_e8,_e7,this.getHostUrl(_ee),_f5,function(_f6){
if(_f6.hasErrors){
this.setError(_f6.statusMessage);
if(this.callbackFunc){
this.callbackFunc.call(this.callbackObj,{isSuccess:!_f6.hasErrors,actionId:_e3,statusMessage:_f6.statusMessage});
}
}else{
if(this.callbackFunc){
this.callbackFunc.call(this.callbackObj,{isSuccess:!_f6.hasErrors,actionId:_e3,statusMessage:""});
}
}
},function(_f7){
if(_eb){
_eb.call(this.callbackObj,{isSuccess:true,actionId:_e3,progress:_f7,statusMessage:""});
}
});
}
}
catch(ex){
if(this.callbackFunc){
this.callbackFunc.call(this.callbackObj,{isSuccess:false,actionId:_e3,statusMessage:ex});
}
}
}};
function s3_Actions(_f8,_f9,_fa,_fb,_fc){
this.accessCode=_f8;
this.secretKey=_f9;
this.isSecure=_fa;
this.arrFiles=new Array;
this.requestType="";
this.remotePath="";
this.existIndex=-1;
this.filePath="";
this.isError=0;
this.errorMesg="";
this.actStatus=0;
this.objHttp=new s3_xhttp(_f8,_f9,_fa);
this.responseStatus="";
this.isListFiles="recursive";
this.ticket="";
this.isDisplay=true;
this.strAcp="";
this.headerInfo=new Array;
this.callbackObj=_fb;
this.callbackFunc=_fc;
}
s3_Actions.prototype={setError:function(_fd,_fe){
if(_fe){
alert(_fd);
}
this.hasErrors=true;
this.errorMesg=_fd;
},listAllBuckets:function(_ff){
var _100=_ff.xmlDoc;
var _101=_100.getElementsByTagName("Bucket");
for(var i=0;i<_101.length;i++){
var _103=_101[i].getElementsByTagName("Name")[0].firstChild.nodeValue;
var _104=_101[i].getElementsByTagName("CreationDate")[0].firstChild.nodeValue;
_104=s3_Utils.getDate(_104);
var _105=new s3_remoteFileInfo(_103,0,_104,true,"/"+_103,"/"+_103);
this.arrFiles.push(_105);
}
if(this.isDisplay){
s3_remoteTreeView.displayFiles(this);
}
},listObjects:function(_106){
var _107=_106.xmlDoc;
if(_107==null){
s3_remoteTreeView.displayFiles(this);
return;
}
var _108=this.remotePath.substring(0,this.remotePath.indexOf("/",1)+1);
var _109=this.remotePath.replace(_108,"");
_108=_108.replace(/\//gi,"");
var _10a=_107.getElementsByTagName("Contents");
for(var i=0;i<_10a.length;i++){
var _10c=_10a[i].getElementsByTagName("Key")[0].firstChild.nodeValue;
var _10d=_10a[i].getElementsByTagName("LastModified")[0].firstChild.nodeValue;
var _10e=_10a[i].getElementsByTagName("Size")[0].firstChild.nodeValue;
var _10f=false;
var eTag=_10a[i].getElementsByTagName("ETag")[0].firstChild.nodeValue;
if(eTag!=null){
if(eTag=="\"d66759af42f282e1ba19144df2d405d0\""){
_10f=true;
}
}
if(_10c.indexOf("_$folder$")!=-1){
_10f=true;
_10c=_10c.replace("_$folder$","");
}
_10c=_10c.replace(_109,"");
var _111="http://";
var _112=_111+_108+".s3.amazonaws.com/"+_109+_10c;
_10d=s3_Utils.getDate(_10d);
if(this.fileExists(_10c)==-1){
var _113=new s3_remoteFileInfo(_10c,_10e,_10d,_10f,this.remotePath+_10c,_112);
if(eTag!=null){
_113.eTag=eTag;
}
this.arrFiles.push(_113);
}
}
var _114=_107.getElementsByTagName("CommonPrefixes");
for(var i=0;i<_114.length;i++){
var _10c=_114[i].getElementsByTagName("Prefix")[0].firstChild.nodeValue;
_10c=_10c.replace(_109,"");
_10c=_10c.substring(0,_10c.indexOf("/"));
var _10f=true;
_10d="";
_10e=0;
var _111="http://";
var _112=_111+_108+".s3.amazonaws.com/"+_109+_10c;
if(this.fileExists(_10c)==-1){
var _113=new s3_remoteFileInfo(_10c,_10e,_10d,_10f,this.remotePath+_10c,_112);
this.arrFiles.push(_113);
}
}
var _115=_107.getElementsByTagName("IsTruncated")[0].firstChild.nodeValue;
if(_115=="true"){
if(_107.getElementsByTagName("NextMarker").length>0){
var _116=_107.getElementsByTagName("NextMarker")[0].firstChild.nodeValue;
this.listFiles(this.remotePath,false,false,_116);
}
}else{
if(this.isDisplay){
s3_remoteTreeView.displayFiles(this);
}
}
},listFiles:function(path,_118,_119,_11a){
if(_118){
delete this.arrFiles;
this.arrFiles=new Array;
}
this.remotePath=path;
if(path=="/"){
this.objHttp.doRequest("GET",path,"",null,null,this,false,"listBuckets",false);
}else{
var _11b=path.substring(0,path.indexOf("/",1));
var _11c=path.substr(path.indexOf("/",1)+1);
_11c=encodeURI(_11c);
var _11d="&delimiter=/";
if(_119){
_11d="";
}
if(_11a==null){
_11a="";
}
this.objHttp.doRequest("GET",_11b,"prefix="+_11c+_11d+"&marker="+_11a,null,null,this,true,"listObjects",false);
}
},getRemoteFilesList:function(_11e){
this.isDisplay=false;
this.listFiles(_11e,true,true);
},getHeaderInfo:function(_11f){
var _120=this.objHttp.doRequest("HEAD",_11f,"",null,"",this,true,"getHeaderInfo",false);
var _121=_120.strHeaders;
var _122=_121.split("\n");
s3_dump("all headers = "+_121);
for(var i=0;i<_122.length;i++){
var _124=_122[i];
if(s3_Utils.trim(_124)!=""){
this.headerInfo[s3_Utils.trim(_124.split(":")[0])]=s3_Utils.trim(_124.split(":")[1]);
}
}
},onResponseComplete:function(_125){
if(_125.hasErrors!=null&&_125.hasErrors){
alert(_125.eMesg);
this.isError=1;
this.uploadStatus=this.FAILED;
if(_125.requestType=="listBuckets"){
s3_uiManager.loginStatus=s3_progStatus.LOGOUT;
}
return;
}
if(_125.requestType=="listBuckets"){
s3_uiManager.status=1;
s3_uiManager.loginStatus=s3_progStatus.LOGIN;
this.listAllBuckets(_125);
}else{
if(_125.requestType=="listObjects"){
this.listObjects(_125);
}else{
if(_125.requestType=="createFolder"){
this.onCompleteAddFolder(_125);
}
}
}
},createRemoteFolder:function(_126,_127,_128){
var _129=null;
if(_128!="US"){
_129="<CreateBucketConfiguration>"+"<LocationConstraint>"+_128+"</LocationConstraint>"+"</CreateBucketConfiguration>";
}
this.objHttp.doRequest("PUT",_127+_126,"",null,_129,this,false,"createFolder",false);
},onCompleteFileUpload:function(_12a){
this.uploadStatus=this.COMPLETE;
if(this.existIndex!=-1){
this.objHttp.doRequest("PUT",this.filePath,"acl",null,this.strAcp,this,true,"setAcl",true);
}
},onCompleteFileDownload:function(_12b){
this.downloadStatus=this.COMPLETE;
},onCompleteAddFolder:function(_12c){
setTimeout(function(){
s3_remoteTreeView.refreshFolder();
},1);
},deleteFile:function(path){
this.objHttp.doRequest("DELETE",path,"",null,"",this,true,"deleteFile",false);
},setAcls:function(_12e,_12f){
return this.objHttp.doRequest("PUT",_12e,"acl",null,_12f,this,true,"setAcl",true);
},getAcls:function(_130){
var _131=this.objHttp.doRequest("GET",_130,"acl",null,"",this,true,"getAcl",true);
var _132=_131.xmlDoc;
if(_132==null){
return null;
}
var _133=_132.getElementsByTagName("AccessControlList");
var _134=_133[0].getElementsByTagName("Grant");
var _135=new s3_accessPolicy();
for(var i=0;i<_134.length;i++){
var _137=_134[i].getElementsByTagName("Grantee")[0];
if(_137==null){
return null;
}
var id,name;
if(_137.getAttribute("xsi:type")=="Group"){
id=_134[i].getElementsByTagName("URI")[0].firstChild.nodeValue;
}else{
if(_137.getAttribute("xsi:type")=="CanonicalUser"){
id=_134[i].getElementsByTagName("ID")[0].firstChild.nodeValue;
name=_134[i].getElementsByTagName("DisplayName")[0].firstChild.nodeValue;
}
}
var _13a=_134[i].getElementsByTagName("Permission")[0].firstChild.nodeValue;
var type=_134[i].getElementsByTagName("Grantee")[0].getAttribute("xsi:type");
var _13c=_135.findGrantee(id);
if(_13c!=-1){
var _137=_135.grant[_13c];
_137.arrPermissions.push(_13a);
}else{
var _137=new s3_grantee(type,id,name);
_137.arrPermissions.push(_13a);
_135.addGrantee(_137);
}
}
var _13d=_132.getElementsByTagName("Owner")[0];
id=_13d.getElementsByTagName("ID")[0].firstChild.nodeValue;
name=_13d.getElementsByTagName("DisplayName")[0].firstChild.nodeValue;
var _13c=_135.findGrantee(id);
if(_13c==-1){
var _137=new s3_grantee("CanonicalUser",id,name);
_135.addGrantee(_137);
_135.owner=_137;
}else{
_135.owner=_135.grant[_13c];
}
return _135;
},uploadObject:function(_13e){
var _13f=this;
try{
var _140="@mozilla.org/io/string-input-stream;1";
var _141="@mozilla.org/io/multiplex-input-stream;1";
var _142="@mozilla.org/network/file-input-stream;1";
var _143="@mozilla.org/network/buffered-input-stream;1";
var _144=Components.interfaces.nsIStringInputStream;
var _145=Components.interfaces.nsIMultiplexInputStream;
var _146=Components.interfaces.nsIFileInputStream;
var _147=Components.interfaces.nsIBufferedInputStream;
var _13f=this;
var _148=_13e.fileName;
var _149=_13e.fromPath;
var _14a=_13e.toPath;
var _14b=Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
_14b.initWithPath(_149);
_14b.append(_148);
s3_dump("ADFDe "+_14a+"/ "+_148);
if(!_14b.exists()){
throw _148+" "+s3_Utils.getPropertyString("filenotexists");
}
var buf=Components.classes[_140].createInstance(_144);
buf.setData("",0);
if(_14b.isDirectory()){
if(_14a!="/"){
_148+="_$folder$";
}else{
var _14d="<CreateBucketConfiguration>"+"<LocationConstraint>EU</LocationConstraint>"+"</CreateBucketConfiguration>";
buf.setData(_14d,_14d.length);
}
}
if(_13e.objFileInfo!=null){
var tAct=new s3_xhttp(this.accessCode,this.secretKey,this.isSecure);
var _14f=tAct.doRequest("GET",_14a+_148,"acl",null,"",this,true,"getAcl",true);
var _150=_14a+_148;
var _151=_14f.xmlDoc;
var _152=new XMLSerializer();
_13e.objFileInfo.strAcp=_152.serializeToString(_151);
}
var _153=Components.classes[_143].createInstance(_147);
var _154=" ";
if(!_14b.isDirectory()){
var fin=Components.classes[_142].createInstance(_146);
fin.init(_14b,1,0,false);
_153.init(fin,9000000);
var _156=_148.substring(_148.lastIndexOf(".")+1,_148.length);
var mime=Components.classes["@mozilla.org/mime;1"].getService(Components.interfaces.nsIMIMEService);
try{
_154=mime.getTypeFromExtension(_156);
}
catch(ex){
_154="application/x-unknown-content-type";
}
}else{
var hsis=Components.classes[_140].createInstance(_144);
hsis.setData("",0);
_153.init(hsis,9000000);
}
_14a+=_148;
var _159=_14a;
var verb="PUT";
var _15b="";
var _15c=[{"name":"x-amz-meta-s3fox-modifiedtime","value":_14b.lastModifiedTime},{"name":"x-amz-meta-s3fox-filesize","value":_14b.fileSize}];
var _15d=this.objHttp.getObject();
var url=s3_getHostUrl(verb,_159,"");
_15d.open(verb,url,true);
if(_15c instanceof Array){
_15c.sort(this.objHttp.metadataSort);
for(var i=0;i<_15c.length;i++){
_15b+=_15c[i].name.toLowerCase()+":"+_15c[i].value;
_15b+="\n";
_15d.setRequestHeader(_15c[i].name,_15c[i].value);
}
}
if(!_14b.isDirectory()){
var _160=_153.available();
}else{
var _160=0;
}
s3_setSignature(_15d,verb,_159,"",_15b,null,_154);
if(_160==0){
_15d.setRequestHeader("Content-Length",0);
_15d.send(null);
}else{
_15d.setRequestHeader("Content-Length",_160);
_15d.send(_153);
}
_13e.status=s3_progStatus.PROGRESS;
var _161=setInterval(function(){
var _162=_160-_153.available();
_13e.intProgress=Math.round(_162/_160*100);
var _163=(_13e.isSyncActions)?s3_syncActionsTreeView:s3_actionTreeView;
_163.InvalidateTree(_13e.index);
if(_13e.intProgress<100){
_13e.lastUpdated=(new Date()).getTime();
}
},200);
_15d.onreadystatechange=function(){
if(_15d.readyState!=4){
return;
}else{
try{
if(_15d.status>=200&&_15d.status<300){
buf.close();
if(fin!=null){
fin.close();
}
clearInterval(_161);
_153.close();
_13e.lastUpdated=(new Date()).getTime();
_13e.intProgress=100;
_13e.status=s3_progStatus.COMPLETED;
if(_13e.objFileInfo!=null){
var tAct=new s3_xhttp(_13f.accessCode,_13f.secretKey,_13f.isSecure);
tAct.doRequest("PUT",_150,"acl",null,_13e.objFileInfo.strAcp,_13f,true,"setAcl",true);
}
var _165=(_13e.isSyncActions)?"s3_uploadSync":"s3_upload";
s3_fireEvent(_165,document,{"tActionRow":_13e,"isError":0});
}else{
var _166=_15d.responseXML;
var _167=_166.getElementsByTagName("Message")[0].firstChild.nodeValue;
s3_dump("Response = "+_15d.responseText);
throw "Problem with connection! "+_167;
}
}
catch(ex){
_13f.isError=1;
_13e.lastUpdated=(new Date()).getTime();
clearInterval(_161);
_13e.intProgress=0;
_13e.status=s3_progStatus.FAILED;
var _165=(_13e.isSyncActions)?"s3_uploadSync":"s3_upload";
s3_fireEvent(_165,document,{"tActionRow":_13e,"isError":1,"errorMesg":ex});
}
}
};
}
catch(ex){
throw ex;
}
},fileExists:function(_168){
var _169=-1;
for(var i=0;i<this.arrFiles.length;i++){
if(this.arrFiles[i].fileName==_168){
_169=i;
break;
}
}
return _169;
},downloadFileObject:function(_16b){
try{
if(_16b.isDirectory){
var file=Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
var _16d=s3_Utils.localPath(_16b.toPath);
file.initWithPath(_16d);
if(!file.exists()||!file.isDirectory()){
file.create(Components.interfaces.nsIFile.DIRECTORY_TYPE,509);
}
_16b.lastUpdated=(new Date()).getTime();
_16b.intProgress=100;
_16b.status=s3_progStatus.COMPLETED;
var _16e=(_16b.isSyncActions)?"s3_downloadSync":"s3_download";
s3_fireEvent(_16e,document,{"tActionRow":_16b,"isError":0});
var _16f=(_16b.isSyncActions)?s3_syncActionsTreeView:s3_actionTreeView;
_16f.InvalidateTree(_16b.index);
}else{
_16b.status=s3_progStatus.PROGRESS;
var _170=_16b.fromPath;
var url=s3_getHostUrl("GET",_170,"");
var _172=s3_setSignature(null,"GET",_170,"","",null,"");
s3_dump(s3_uiManager.accessCode+", New = "+_172);
this.objHttp.downloadFile(_16b,url,this,"fileDownload",_172);
}
}
catch(ex){
alert(ex);
}
},listFilesNew:function(path,_174,_175,_176,_177){
if(_174){
delete this.arrFiles;
this.arrFiles=new Array;
}
this.remotePath=path;
if(path=="/"){
this.objHttp.doRequest("GET",path,"",null,null,this,false,"listBuckets",false);
}else{
var _178=path.substring(0,path.indexOf("/",1));
var _179=path.substr(path.indexOf("/",1)+1);
_179=encodeURI(_179);
var _17a="&delimiter=/";
if(_175){
_17a="";
}
if(_176==null){
_176="";
}
var _17b=this;
var _17c=function(_17d){
var _17e=_17d.xmlDoc;
if(_17e==null){
s3_remoteTreeView.displayFiles(_17b);
return;
}
with(_17b){
var _17f=remotePath.substring(0,remotePath.indexOf("/",1)+1);
var _180=remotePath.replace(_17f,"");
_17f=_17f.replace(/\//gi,"");
var _181=_17e.getElementsByTagName("Contents");
for(var i=0;i<_181.length;i++){
var _183=_181[i].getElementsByTagName("Key")[0].firstChild.nodeValue;
var _184=_181[i].getElementsByTagName("LastModified")[0].firstChild.nodeValue;
var _185=_181[i].getElementsByTagName("Size")[0].firstChild.nodeValue;
var _186=false;
var eTag=_181[i].getElementsByTagName("ETag")[0].firstChild.nodeValue;
if(eTag!=null){
if(eTag=="\"d66759af42f282e1ba19144df2d405d0\""){
_186=true;
}
}
if(_183.indexOf("_$folder$")!=-1){
_186=true;
_183=_183.replace("_$folder$","");
}
_183=_183.replace(_180,"");
var _188="http://";
var _189=_188+_17f+".s3.amazonaws.com/"+_180+_183;
_184=s3_Utils.getDate(_184);
if(fileExists(_183)==-1){
var _18a=new s3_remoteFileInfo(_183,_185,_184,_186,remotePath+_183,_189);
if(eTag!=null){
_18a.eTag=eTag;
}
arrFiles.push(_18a);
}
}
var _18b=_17e.getElementsByTagName("CommonPrefixes");
for(var i=0;i<_18b.length;i++){
var _183=_18b[i].getElementsByTagName("Prefix")[0].firstChild.nodeValue;
_183=_183.replace(_180,"");
_183=_183.substring(0,_183.indexOf("/"));
var _186=true;
_184="";
_185=0;
var _188="http://";
var _189=_188+_17f+".s3.amazonaws.com/"+_180+_183;
if(fileExists(_183)==-1){
var _18a=new s3_remoteFileInfo(_183,_185,_184,_186,remotePath+_183,_189);
arrFiles.push(_18a);
}
}
alert(arrFiles.length);
var _18c=_17e.getElementsByTagName("IsTruncated")[0].firstChild.nodeValue;
if(_18c=="true"){
listFilesNew(remotePath,false,false,_18d);
if(_17e.getElementsByTagName("NextMarker").length>0){
var _18d=_17e.getElementsByTagName("NextMarker")[0].firstChild.nodeValue;
}
}else{
if(_177==null&&_17b.isDisplay){
s3_remoteTreeView.displayFiles(_17b);
}else{
_177(_17b);
}
}
}
};
this.objHttp.doRequestNew("GET",_178,"max-keys=20&prefix="+_179+_17a+"&marker="+_176,null,null,this,false,"listObjects",false,_17c);
}
},deleteFileNew:function(path,_18f,_190){
this.objHttp.doRequestNew("DELETE",path,"",null,"",this,false,"deleteFile",false,function(){
_18f(_190);
});
},listDistributions:function(){
var _191=new s3_xhttp();
var self=this;
_191.doRequestDistributions("GET","","",null,"",this,false,function(_193){
if(!_193.hasErrors){
var _194=new Array();
var _195=_193.xmlDoc;
1;
var _196=_195.getElementsByTagName("DistributionSummary");
for(var i=0;i<_196.length;i++){
var id=s3_Utils.getTagValue(_196[i],"Id");
var _199=s3_Utils.getTagValue(_196[i],"Status");
var _19a=s3_Utils.getTagValue(_196[i],"LastModifiedTime");
var _19b=s3_Utils.getTagValue(_196[i],"DomainName");
var _19c=s3_Utils.getTagValue(_196[i],"Origin");
var _19d=s3_Utils.getTagValue(_196[i],"Comment");
_194.push(new s3_distribution(id,_19b,_19c,_199,_19a,_19d));
}
if(self.callbackFunc!=null){
self.callbackFunc.call(self.callbackObj,_194);
}
}else{
self.setError(_193.statusMesg,true);
}
});
},createDistribution:function(_19e,_19f,_1a0,_1a1){
var _1a2=new s3_xhttp();
var self=this;
var _1a4="";
if(s3_Utils.trim(_1a0[0])!=""&&_1a0.length>0){
for(var k=0;k<_1a0.length;k++){
_1a4+=s3_Utils.stringFormat("<CNAME>{0}</CNAME>",_1a0[k]);
}
}
var _1a6=s3_Utils.stringFormat("<?xml version=\"1.0\" encoding=\"UTF-8\"?><DistributionConfig xmlns=\"http://cloudfront.amazonaws.com/doc/2008-06-30/\">"+"<Origin>{0}</Origin>"+"<CallerReference>{1}</CallerReference>{4}"+"<Comment>{2}</Comment>"+"<Enabled>{3}</Enabled>"+"</DistributionConfig>",_19e,(new Date()).getTime(),_19f,_1a1,_1a4);
_1a2.doRequestDistributions("POST","","",null,_1a6,this,false,function(_1a7){
if(!_1a7.hasErrors){
var _1a8=_1a7.xmlDoc;
var id=s3_Utils.getTagValue(_1a8,"Id");
var _1aa=s3_Utils.getTagValue(_1a8,"Status");
var _1ab=s3_Utils.getTagValue(_1a8,"LastModifiedTime");
var _1ac=s3_Utils.getTagValue(_1a8,"DomainName");
var _1ad=s3_Utils.getTagValue(_1a8,"Origin");
var _1ae=s3_Utils.getTagValue(_1a8,"Comment");
var _1af=s3_Utils.getTagValue(_1a8,"CallerReference");
var _1b0=s3_Utils.getTagValue(_1a8,"Enabled");
var _1b1=new Array();
var _1b2=_1a8.getElementsByTagName("CNAME");
for(var p=0;p<_1b2.length;p++){
_1b1.push(_1b2[p].firstChild.nodeValue);
}
var _1b4=_1b1.join(",");
var dist=new s3_distribution(id,_1ac,_1ad,_1aa,_1ab,_1ae,_1af,_1b0,_1b4);
if(self.callbackFunc!=null){
self.callbackFunc.call(self.callbackObj,dist);
}
}else{
self.setError(_1a7.statusMesg,true);
}
});
},getDistributionInfo:function(_1b6){
var _1b7=new s3_xhttp();
var self=this;
_1b7.doRequestDistributions("GET",_1b6,"",null,"",this,false,function(_1b9){
if(!_1b9.hasErrors){
var _1ba=_1b9.xmlDoc;
var id=s3_Utils.getTagValue(_1ba,"Id");
var _1bc=s3_Utils.getTagValue(_1ba,"Status");
var _1bd=s3_Utils.getTagValue(_1ba,"LastModifiedTime");
var _1be=s3_Utils.getTagValue(_1ba,"DomainName");
var _1bf=s3_Utils.getTagValue(_1ba,"Origin");
var _1c0=s3_Utils.getTagValue(_1ba,"Comment");
var _1c1=s3_Utils.getTagValue(_1ba,"CallerReference");
var _1c2=s3_Utils.getTagValue(_1ba,"Enabled");
var _1c3=new Array();
var _1c4=_1ba.getElementsByTagName("CNAME");
for(var p=0;p<_1c4.length;p++){
_1c3.push(_1c4[p].firstChild.nodeValue);
}
var _1c6=_1c3.join(",");
var dist=new s3_distribution(id,_1be,_1bf,_1bc,_1bd,_1c0,_1c1,_1c2,_1c6);
dist.eTag=_1b9.responseHeaders["Etag"];
if(self.callbackFunc!=null){
self.callbackFunc.call(self.callbackObj,dist);
}
}else{
self.setError(_1b9.statusMesg,true);
}
});
},setDistribution:function(_1c8,_1c9,_1ca,_1cb,_1cc,eTag,_1ce){
var _1cf=new s3_xhttp();
var self=this;
var _1d1="";
if(s3_Utils.trim(_1ce[0])!=""&&_1ce.length>0){
for(var k=0;k<_1ce.length;k++){
_1d1+=s3_Utils.stringFormat("<CNAME>{0}</CNAME>",s3_Utils.trim(_1ce[k]));
}
}
var _1d3=s3_Utils.stringFormat("<?xml version=\"1.0\" encoding=\"UTF-8\"?><DistributionConfig xmlns=\"http://cloudfront.amazonaws.com/doc/2008-06-30/\">"+"<Origin>{0}</Origin>"+"<CallerReference>{1}</CallerReference>{4}"+"<Comment>{2}</Comment>"+"<Enabled>{3}</Enabled>"+"</DistributionConfig>",_1c8,_1cb,_1c9,_1ca,_1d1);
_1cf.doRequestDistributions("PUT",_1cc+"/config","",[{"name":"If-Match","value":eTag}],_1d3,this,false,function(_1d4){
if(!_1d4.hasErrors){
var _1d5=_1d4.xmlDoc;
if(self.callbackFunc!=null){
self.callbackFunc.call(self.callbackObj,true);
}
}else{
self.setError(_1d4.statusMesg,true);
if(self.callbackFunc!=null){
self.callbackFunc.call(self.callbackObj,false);
}
}
});
},deleteDistribution:function(_1d6,eTag){
var _1d8=new s3_xhttp();
var self=this;
_1d8.doRequestDistributions("DELETE",_1d6,"",[{"name":"If-Match","value":eTag}],"",this,false,function(_1da){
if(!_1da.hasErrors){
if(self.callbackFunc!=null){
self.callbackFunc.call(self.callbackObj,true);
}
}else{
self.setError(_1da.statusMesg,true);
if(self.callbackFunc!=null){
self.callbackFunc.call(self.callbackObj,false);
}
}
});
}};
//
var s3_encUtils={hexcase:0,b64pad:"=",chrsz:8,hex_sha1:function(s){
return this.binb2hex(this.core_sha1(this.str2binb(s),s.length*this.chrsz));
},b64_sha1:function(s){
return this.binb2b64(this.core_sha1(this.str2binb(s),s.length*this.chrsz));
},str_sha1:function(s){
return this.binb2str(this.core_sha1(this.str2binb(s),s.length*this.chrsz));
},hex_hmac_sha1:function(_4,_5){
return this.binb2hex(this.core_hmac_sha1(_4,_5));
},b64_hmac_sha1:function(_6,_7){
return this.binb2b64(this.core_hmac_sha1(_6,_7));
},str_hmac_sha1:function(_8,_9){
return this.binb2str(this.core_hmac_sha1(_8,_9));
},sha1_vm_test:function(){
return hex_sha1("abc")=="a9993e364706816aba3e25717850c26c9cd0d89d";
},core_sha1:function(x,_b){
x[_b>>5]|=128<<(24-_b%32);
x[((_b+64>>9)<<4)+15]=_b;
var w=Array(80);
var a=1732584193;
var b=-271733879;
var c=-1732584194;
var d=271733878;
var e=-1009589776;
for(var i=0;i<x.length;i+=16){
var _13=a;
var _14=b;
var _15=c;
var _16=d;
var _17=e;
for(var j=0;j<80;j++){
if(j<16){
w[j]=x[i+j];
}else{
w[j]=this.rol(w[j-3]^w[j-8]^w[j-14]^w[j-16],1);
}
var t=this.safe_add(this.safe_add(this.rol(a,5),this.sha1_ft(j,b,c,d)),this.safe_add(this.safe_add(e,w[j]),this.sha1_kt(j)));
e=d;
d=c;
c=this.rol(b,30);
b=a;
a=t;
}
a=this.safe_add(a,_13);
b=this.safe_add(b,_14);
c=this.safe_add(c,_15);
d=this.safe_add(d,_16);
e=this.safe_add(e,_17);
}
return Array(a,b,c,d,e);
},sha1_ft:function(t,b,c,d){
if(t<20){
return (b&c)|((~b)&d);
}
if(t<40){
return b^c^d;
}
if(t<60){
return (b&c)|(b&d)|(c&d);
}
return b^c^d;
},sha1_kt:function(t){
return (t<20)?1518500249:(t<40)?1859775393:(t<60)?-1894007588:-899497514;
},core_hmac_sha1:function(key,_20){
var _21=this.str2binb(key);
if(_21.length>16){
_21=this.core_sha1(_21,key.length*this.chrsz);
}
var _22=Array(16),_23=Array(16);
for(var i=0;i<16;i++){
_22[i]=_21[i]^909522486;
_23[i]=_21[i]^1549556828;
}
var _25=this.core_sha1(_22.concat(this.str2binb(_20)),512+_20.length*this.chrsz);
return this.core_sha1(_23.concat(_25),512+160);
},safe_add:function(x,y){
var lsw=(x&65535)+(y&65535);
var msw=(x>>16)+(y>>16)+(lsw>>16);
return (msw<<16)|(lsw&65535);
},rol:function(num,cnt){
return (num<<cnt)|(num>>>(32-cnt));
},str2binb:function(str){
var bin=Array();
var _2e=(1<<this.chrsz)-1;
for(var i=0;i<str.length*this.chrsz;i+=this.chrsz){
bin[i>>5]|=(str.charCodeAt(i/this.chrsz)&_2e)<<(32-this.chrsz-i%32);
}
return bin;
},binb2str:function(bin){
var str="";
var _32=(1<<this.chrsz)-1;
for(var i=0;i<bin.length*32;i+=this.chrsz){
str+=String.fromCharCode((bin[i>>5]>>>(32-this.chrsz-i%32))&_32);
}
return str;
},binb2hex:function(_34){
var _35=this.hexcase?"0123456789ABCDEF":"0123456789abcdef";
var str="";
for(var i=0;i<_34.length*4;i++){
str+=_35.charAt((_34[i>>2]>>((3-i%4)*8+4))&15)+_35.charAt((_34[i>>2]>>((3-i%4)*8))&15);
}
return str;
},binb2b64:function(_38){
var tab="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
var str="";
for(var i=0;i<_38.length*4;i+=3){
var _3c=(((_38[i>>2]>>8*(3-i%4))&255)<<16)|(((_38[i+1>>2]>>8*(3-(i+1)%4))&255)<<8)|((_38[i+2>>2]>>8*(3-(i+2)%4))&255);
for(var j=0;j<4;j++){
if(i*8+j*6>_38.length*32){
str+=this.b64pad;
}else{
str+=tab.charAt((_3c>>6*(3-j))&63);
}
}
}
return str;
}};
//
var accessCode="AKIAJZZ7BWAVPNU6O5WQ";
var secretKey = "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";
var isSecure = false;
var s3_Utils = Packages.java.lang.String;
function toString($this) {
	var str = new Packages.java.lang.String($this);
	return str;
}

function trim($this) {
	return toString($this).trim();
}

function generateUrls (s3Path, expires){
	var signedUrls = "";
    var s3PathObj = toString(s3Path);
	if (s3PathObj.trim() == "")
		return signedUrls;	
    if (s3PathObj.endsWith("/")) {
       Packages.java.lang.System.err.println("the path should be folde path: " + s3Path);
      // s3Path =  s3PathObj.substring(0, s3PathObj.indexOf("/"));
    }
	var act = new s3_Action(accessCode, secretKey, isSecure);
					
	var resLoc = act.encodeS3(s3Path);
	var currentTS = new Date();
	var timestamp = (currentTS).toUTCString();
	var expirySeconds = Math.ceil(currentTS.getTime() / 1000) + (expires * 60 * 60); 
	
	var strHeaders = "";
	var strContentType = "";
	//var strToSign = s3_Utils.format("GET\n\n{0}\n{3}\n{1}{2}", strContentType, strHeaders, resLoc, expirySeconds+"");
	var strToSign = "GET\n\n"+strContentType+"\n"+expirySeconds+"\n"+strHeaders+resLoc;
	//s3_dump("sign = " + strToSign)
	var authHeader = s3_encUtils.b64_hmac_sha1(secretKey, strToSign);
	//http://seo-domain-prospecting-new.s3.amazonaws.com/wc/output/20130823T110012/dedup/part-r-00000?AWSAccessKeyId=AKIAJZZ7BWAVPNU6O5WQ&Expires=1377361303&Signature=GLYIn%2BSK/rXY0KQYEXtkc1BcFFw%3D
	//var signedUrl = s3_Utils.format("{0}?AWSAccessKeyId={1}&Expires={2}&Signature={3}", act.getHostUrl(resLoc), accessCode, expirySeconds+"", act.encodeS3(authHeader));
	var signedUrl = act.getHostUrl(resLoc)+"?AWSAccessKeyId="+accessCode+"&Expires="+expirySeconds+"&Signature="+act.encodeS3(authHeader);
	
	return signedUrl;
}
