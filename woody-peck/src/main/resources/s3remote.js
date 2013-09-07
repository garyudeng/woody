//
var s3_remoteTreeView={treeBox:null,selection:null,arrRemoteFiles:new Array,remotePath:"/",rowCountChange:0,refreshActionObject:null,isBusy:false,refreshTaskInfoList:null,isTreeSorted:false,hasAllFiles:true,badCertMessageShow:false,getRowCount:function(){
if(this.arrRemoteFiles!=null){
this.rowCount=this.arrRemoteFiles.length;
return this.rowCount;
}else{
return 0;
}
},setTree:function(_1){
this.treeBox=_1;
},getCellText:function(_2,_3){
if(_2>=this.getRowCount()){
return "";
}
if(_3.id=="s3_remoteFileName"){
return this.arrRemoteFiles[_2].fileName;
}else{
if(_3.id=="s3_remoteFileSize"){
return this.arrRemoteFiles[_2].fileSizeInKb;
}else{
if(_3.id=="s3_remoteActualSize"){
return this.arrRemoteFiles[_2].fileSize;
}else{
if(_3.id=="s3_remoteUploadTime"){
var _4=new Date(this.arrRemoteFiles[_2].modifiedTime);
return s3_Utils.getDateString(_4);
}
}
}
}
},isEditable:function(_5,_6){
return true;
},isContainer:function(_7){
return false;
},isSeparator:function(_8){
return false;
},isSorted:function(){
return false;
},getImageSrc:function(_9,_a){
if(_9>=this.getRowCount()){
return "";
}
if(_a.id=="s3_remoteFileName"){
if(this.arrRemoteFiles[_9].isDirectory){
return "chrome://s3fox/content/images/directory.png";
}else{
return "moz-icon://"+this.arrRemoteFiles[_9].fileName+"?size=16";
}
}
},canDrop:function(_b,_c){
if(_c!=Components.interfaces.DROP_ON){
return false;
}else{
return true;
}
},getParentIndex:function(_d){
return -1;
},drop:function(_e,_f){
},getProgressMode:function(idx,_11){
},getCellValue:function(idx,_13){
},cycleHeader:function(col,_15){
var _16=(col.element.getAttribute("sortDirection")=="ascending"||col.element.getAttribute("sortDirection")=="natural")?"descending":"ascending";
for(var i=0;i<col.columns.count;i++){
col.columns.getColumnAt(i).element.setAttribute("sortDirection","natural");
}
col.element.setAttribute("sortDirection",_16);
this.doSort(col.element);
},selectionChanged:function(){
},cycleCell:function(idx,_19){
},performAction:function(_1a){
},performActionOnCell:function(_1b,_1c,_1d){
},getRowProperties:function(idx,_1f,_20){
},getCellProperties:function(idx,_22,_23){
},getColumnProperties:function(_24,_25,_26){
},getLevel:function(idx){
return 0;
},doSort:function(_28){
if(_28==null){
s3_remoteTreeView.doSort(s3_get("s3_remoteFileName"));
s3_remoteTreeView.doSort(s3_get("s3_remoteFileSize"));
s3_remoteTreeView.doSort(s3_get("s3_remoteUploadTime"));
s3_remoteTreeView.doSort(s3_get("s3_remoteActualSize"));
}else{
var _29=_28.getAttribute("colName");
var _2a=s3_Utils.compareNumberOrDate;
if(_29=="fileName"||_29=="from"){
_2a=s3_Utils.compareFileName;
}
if(_28!=null&&_28.getAttribute("sortDirection")&&_28.getAttribute("sortDirection")!="natural"){
s3_remoteTreeView.sortVariable=_29;
this.arrRemoteFiles.sort(_2a);
if(_28.getAttribute("sortDirection")!="descending"){
this.arrRemoteFiles.reverse();
}
}
}
},getActionObject:function(_2b){
return new s3_Action(s3_uiManager.authInfo.accessCode,s3_uiManager.authInfo.secretKey,s3_uiManager.authInfo.scheme,this,_2b);
},handleError:function(_2c){
alert(_2c.errorMessage);
s3_logView.log(_2c.errorMessage,"CustomError");
},dblClick:function(_2d){
if(this.arrRemoteFiles==null||this.selection==null){
return;
}
var _2e=this.arrRemoteFiles[this.selection.currentIndex];
if(_2e!=null&&_2e.isDirectory){
this.changeFolder(_2e.filePath);
}
},click:function(evt){
},keyPress:function(evt){
if(s3_uiManager.loginStatus!=s3_progStatus.LOGIN){
return;
}
if(evt.keyCode==13){
this.dblClick(null);
}
if(evt.ctrlKey&&(evt.which==65||evt.which==97)){
evt.stopPropagation();
if(s3_remoteTreeView.selection){
s3_remoteTreeView.selection.selectAll();
}
}
if(evt.keyCode==46){
s3_remoteTreeView.deleteSelected();
evt.stopPropagation();
}
},gotoParentFolder:function(){
var _31=this.remotePath;
var _32=_31.lastIndexOf("/",_31.length-2);
var _33="/";
if(_32!=0){
_33=_31.substring(0,_32);
}
this.changeFolder(_33);
},changeFolder:function(_34){
try{
if(_34.indexOf("/")==-1){
throw s3_Utils.getPropertyString("invalidpath");
}
if(this.remotePath==_34){
return;
}
this.setRemotePath(_34);
this.refreshFolder();
}
catch(ex){
alert(ex);
}
},clearItems:function(){
var _35=this.getRowCount();
delete this.arrRemoteFiles;
if(this.treeBox!=null){
this.treeBox.rowCountChanged(0,-_35);
}
},refreshFolder:function(_36){
var _37=this.getRowCount();
if(!this.hasAllFiles&&this.refreshActionObject!=null){
this.refreshActionObject.abortRequest();
s3_taskView.remove(this.refreshTaskInfoList.id);
}
delete this.arrRemoteFiles;
this.setRemotePath(this.remotePath);
if(!_36){
this.isBusy=true;
this.hasAllFiles=false;
this.refreshTaskInfoList=new s3_TaskListInfo((new Date()).getTime(),"Refreshing...","");
var _38=function(){
if(curAct.hasErrors){
this.handleError(new s3_Error(curAct.errorMessage));
s3_taskView.setError(this.refreshTaskInfoList.id);
return;
}
this.arrRemoteFiles=curAct.arrFiles;
delete curAct;
curAct=null;
this.doSort();
if(this.treeBox){
this.hasAllFiles=true;
this.isBusy=false;
this.treeBox.rowCountChanged(0,-_37);
_37=this.arrRemoteFiles.length;
this.treeBox.rowCountChanged(0,_37);
}
if(this.selection){
this.selection.clearSelection();
}
s3_showWaitIcon(false);
s3_logView.log("Listing files done - "+this.remotePath+", Fetched "+this.arrRemoteFiles.length+" rows","info");
s3_taskView.remove(this.refreshTaskInfoList.id);
};
s3_showWaitIcon(true);
s3_taskView.add(this.refreshTaskInfoList);
s3_logView.log("Listing files - "+this.remotePath,"message");
this.refreshActionObject=curAct=this.getActionObject(_38);
if(this.remotePath=="/"){
curAct.listAllBuckets();
}else{
curAct.listFiles(this.remotePath,true,false,null,function(){
this.hasAllFiles=false;
this.arrRemoteFiles=curAct.arrFiles;
this.doSort();
if(this.treeBox){
this.treeBox.rowCountChanged(0,-_37);
_37=this.arrRemoteFiles.length;
this.treeBox.rowCountChanged(0,_37);
}
s3_logView.log("Fetched "+this.arrRemoteFiles.length+" rows","info");
s3_taskView.updateItem(this.refreshTaskInfoList.id,"Fetched "+this.arrRemoteFiles.length+" rows");
});
}
}else{
s3_uiManager.curAct().listFiles(this.remotePath,true,false);
}
},displayFiles:function(_39){
this.arrRemoteFiles=_39.arrFiles;
this.doSort();
if(this.treeBox){
s3_dump("displayFiles = "+this.rowCountChange+", "+this.arrRemoteFiles.length);
this.treeBox.rowCountChanged(0,this.rowCountChange);
this.rowCountChange=this.arrRemoteFiles.length;
this.treeBox.rowCountChanged(0,this.rowCountChange);
}
if(this.selection){
this.selection.clearSelection();
}
s3_showWaitIcon(false);
},setRemotePath:function(_3a){
_3a=s3_Utils.trim(_3a);
this.remotePath=_3a;
if(this.remotePath.lastIndexOf("/")!=this.remotePath.length-1){
this.remotePath+="/";
}
s3_get("s3_remotePath").value=this.remotePath;
},addFolder:function(){
if(this.isBusy){
alert("Please wait while the refresh operation is complete");
return;
}
s3_remoteTreeView.dialogResponse=null;
window.openDialog("chrome://s3fox/content/s3NewFolder.xul","Choose a bucket","chrome,modal,centerscreen",s3_uiManager,s3_remoteTreeView);
if(s3_remoteTreeView.dialogResponse==null){
return;
}
var _3b=s3_remoteTreeView.dialogResponse.folderName;
if(_3b==null||_3b==""){
return;
}
var _3c=s3_remoteTreeView.dialogResponse.location;
if(this.remotePath=="/"){
if(this.fileExists(_3b,true)!=-1){
alert(s3_Utils.getPropertyString("folderexists"));
}else{
var _3d=new s3_TaskListInfo((new Date()).getTime(),"Creating bucket...","");
var _3e=this.getActionObject(function(){
if(_3e.hasErrors){
this.handleError(new s3_Error(_3e.errorMessage));
s3_taskView.setError(_3d.id);
return;
}
s3_taskView.remove(_3d.id);
s3_logView.log("Creating bucket done - "+_3b,"message");
this.refreshFolder();
});
_3e.createBucket(_3b,_3c);
s3_taskView.add(_3d);
s3_logView.log("Creating bucket - "+_3b,"message");
}
}
if(_3b.lastIndexOf("/")!=_3b.length-1&&this.remotePath!="/"){
_3b+="_$folder$";
if(this.fileExists(_3b,true)!=-1){
alert(s3_Utils.getPropertyString("folderexists"));
}else{
var _3d=new s3_TaskListInfo((new Date()).getTime(),"Creating folder...","");
var _3e=this.getActionObject(function(){
if(_3e.hasErrors){
this.handleError(new s3_Error(_3e.errorMessage));
s3_taskView.setError(_3d.id);
return;
}
s3_taskView.remove(_3d.id);
s3_logView.log("Creating folder done - "+_3b,"message");
this.refreshFolder();
});
_3e.createRemoteFolder(_3b,this.remotePath);
s3_taskView.add(_3d);
s3_logView.log("Creating folder - "+_3b,"message");
}
}
},getRemotePath:function(){
return this.remotePath;
},deleteSelected:function(){
var _3f=new Object();
var end=new Object();
var _41=s3_remoteTreeView.selection.getRangeCount();
if(_41==0){
return;
}
var _42=false;
var chk=confirm(s3_Utils.getPropertyString("deleteconfirm"));
if(!chk){
return;
}else{
var _44=new s3_TaskDelete(true,s3_uiManager.authInfo);
_44.addTaskProperty("remotePath",this.getRemotePath());
_44.eventManager.addListener("DeleteComplete",this,function(_45){
if(_45.properties["remotePath"]==this.remotePath){
this.refreshFolder();
}
});
_44.eventManager.addListener("DeleteFailed",this,function(_46,ex){
alert(ex);
});
for(var t=0;t<_41;t++){
s3_remoteTreeView.selection.getRangeAt(t,_3f,end);
for(var v=_3f.value;v<=end.value;v++){
var _4a=s3_remoteTreeView.arrRemoteFiles[v];
_44.addToDelete(_4a,{filesFetched:false});
}
}
_44.startProcessing();
}
},fileExists:function(_4b,_4c){
if(this.arrRemoteFiles==null){
return -1;
}
for(var i=0;i<this.arrRemoteFiles.length;i++){
if(this.arrRemoteFiles[i].fileName==_4b){
if((_4c&&this.arrRemoteFiles[i].isDirectory==true)||!_4c){
return i;
}
}
}
return -1;
},getFileInfo:function(_4e){
var _4f=s3_uiManager.getActionInstance();
_4e.permisssions=_4f.getAcls(_4e.filePath);
},copyUrl:function(){
if(this.arrRemoteFiles==null){
return;
}
var _50=s3_remoteTreeView.selection.currentIndex;
if(_50==-1){
return;
}
var _51=this.arrRemoteFiles[this.selection.currentIndex];
var _52=s3_getHostUrl("GET",_51.filePath,"");
var _53=Components.classes["@mozilla.org/widget/clipboardhelper;1"].getService(Components.interfaces.nsIClipboardHelper);
_53.copyString(_52);
},editAcl:function(){
if(this.arrRemoteFiles==null){
return;
}
var _54=s3_remoteTreeView.selection.getRangeCount();
if(_54==0){
return;
}
var _55=this.arrRemoteFiles[this.selection.currentIndex];
s3_modalDialog.onLoadObject=s3_aclManager;
s3_modalDialog.onLoad=s3_aclManager.loadAcl;
s3_modalDialog.showDialog("ACL",this,function(_56){
if(_56){
s3_aclManager.saveAcl();
}
});
},addToDownloadQ:function(_57,_58){
var _59=true;
var dir=Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
dir.initWithPath(_58.path);
dir.append(_57.fileName);
if(dir.exists()&&dir.isDirectory()&&s3_fileOpPref.askOption){
alert("Folder '"+_57.fileName+"' already exists in the destination directory. \nIf any of the files have same names, you will be asked if you want to replace those files.");
}else{
if(dir.exists()&&!dir.isDirectory()){
if(s3_fileOpPref.askOption){
window.openDialog("chrome://s3fox/content/s3Overwrite.xul","Overwrite Options","chrome,modal,centerscreen",s3_fileOpPref,_57.fileName,"download");
}
if(s3_fileOpPref.overwriteOption==s3_fileOpPref.SKIP){
s3_fileOpPref.askOption=true;
return;
}else{
if(s3_fileOpPref.overwriteOption==s3_fileOpPref.SKIP_ALL||s3_fileOpPref.overwriteOption==s3_fileOpPref.CANCEL){
s3_fileOpPref.askOption=false;
return;
}else{
if(s3_fileOpPref.overwriteOption==s3_fileOpPref.OVERWRITE_DELETE){
s3_fileOpPref.askOption=true;
}else{
if(s3_fileOpPref.overwriteOption==s3_fileOpPref.KEEP_ORIGINAL){
_59=false;
s3_fileOpPref.askOption=true;
}else{
if(s3_fileOpPref.overwriteOption==s3_fileOpPref.KEEP_ORIGINAL_ALL){
_59=false;
s3_fileOpPref.askOption=false;
}else{
if(s3_fileOpPref.overwriteOption==s3_fileOpPref.OVERWRITE_DELETE_ALL){
s3_fileOpPref.askOption=false;
}
}
}
}
}
}
}
}
if(!_57.isDirectory){
var _5b=new s3_actionRow(_57.filePath,_58.path,_57.fileName,s3_progStatus.INIT,"download",_57.fileSize,"",_57.isDirectory,null,_57.key,s3_uiManager.getActionInstance());
_5b.overwriteFiles=_59;
s3_actionTreeView.arrActionQ.push(_5b);
}else{
if(_57.isDirectory&&!dir.exists()){
var _5b=new s3_actionRow(_57.filePath,_58.path,_57.fileName,s3_progStatus.INIT,"download",_57.fileSize,"",_57.isDirectory,null,_57.key,s3_uiManager.getActionInstance());
_5b.overwriteFiles=_59;
s3_actionTreeView.arrActionQ.push(_5b);
}
}
if(_57.isDirectory){
this.addRemoteFoldersToQ(s3_Utils.localPath(_58.path+"\\"+_57.fileName),_57);
}
},addRemoteFoldersToQ:function(_5c,_5d){
var _5e=_5d.filePath;
var _5f=_5d.key;
if(_5e.charAt(_5e.length-1)!="/"){
_5e+="/";
}
var _60=s3_uiManager.getActionInstance();
_60.getRemoteFilesList(_5e);
var dir=Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
for(var i=0;i<_60.arrFiles.length;i++){
var _5d=_60.arrFiles[i];
var _63=_5d.filePath;
var _5d=_60.arrFiles[i];
dir.initWithPath(s3_Utils.localPath(_5c+"\\"+_5d.fileName));
var _64=true;
if(dir.exists()&&!dir.isDirectory()){
if(s3_fileOpPref.askOption){
window.openDialog("chrome://s3fox/content/s3Overwrite.xul","Overwrite Options","chrome,modal,centerscreen",s3_fileOpPref,_5d.fileName,"download");
}
if(s3_fileOpPref.overwriteOption==s3_fileOpPref.SKIP){
s3_fileOpPref.askOption=true;
continue;
}else{
if(s3_fileOpPref.overwriteOption==s3_fileOpPref.SKIP_ALL||s3_fileOpPref.overwriteOption==s3_fileOpPref.CANCEL){
s3_fileOpPref.askOption=false;
continue;
}else{
if(s3_fileOpPref.overwriteOption==s3_fileOpPref.OVERWRITE_DELETE){
s3_fileOpPref.askOption=true;
}else{
if(s3_fileOpPref.overwriteOption==s3_fileOpPref.KEEP_ORIGINAL){
_64=false;
s3_fileOpPref.askOption=true;
}else{
if(s3_fileOpPref.overwriteOption==s3_fileOpPref.KEEP_ORIGINAL_ALL){
_64=false;
s3_fileOpPref.askOption=false;
}else{
if(s3_fileOpPref.overwriteOption==s3_fileOpPref.OVERWRITE_DELETE_ALL){
s3_fileOpPref.askOption=false;
}
}
}
}
}
}
}
if(!_5d.isDirectory){
var _65=new s3_actionRow(_5d.filePath,_5c,_5d.fileName,s3_progStatus.INIT,"download",_5d.fileSize,"",_5d.isDirectory,null,_5d.key,s3_uiManager.getActionInstance());
_65.overwriteFiles=_64;
s3_actionTreeView.arrActionQ.push(_65);
}else{
if(_5d.isDirectory&&!dir.exists()){
var _65=new s3_actionRow(_5d.filePath,_5c,_5d.fileName,s3_progStatus.INIT,"download",_5d.fileSize,"",_5d.isDirectory,null,_5d.key,s3_uiManager.getActionInstance());
_65.overwriteFiles=_64;
s3_actionTreeView.arrActionQ.push(_65);
}
}
}
},setActType:function(_66){
switch(_66){
case "dropbox":
_66="upload";
break;
case "drag_drop_upload":
_66="upload";
break;
case "drag_drop_download":
_66="download";
break;
case "upload_sync_add":
_66="upload";
break;
case "download_sync_add":
_66="download";
break;
}
return _66;
},addToActionQ:function(_67,_68){
if(s3_actionTreeView.isError>0){
var _69=confirm("Looks like there was a problem while transferring earlier, do you want to clear the list and start again?");
if(_69){
s3_actionTreeView.clearItems(true);
}
}
var _6a="";
var _6b=new Object();
var end=new Object();
var _6d=-s3_actionTreeView.getRowCount();
var _6e=(_67=="dropbox")?true:false;
if(_67=="upload_sync_add"||_67=="download_sync_add"){
var _6f,_70,_71,_72,_73;
if(_67=="upload_sync_add"){
var _6f=s3_localTreeView.selection.getRangeCount();
s3_localTreeView.selection.getRangeAt(0,_6b,end);
_70=s3_localTreeView.arrLocalFiles[s3_localTreeView.selection.currentIndex];
_71=_70.filePath;
var _74=s3_remoteTreeView.getRemotePath();
if(_74=="/"){
s3_remoteTreeView.dialogResponse=null;
window.openDialog("chrome://s3fox/content/s3DlgBeforeUpload.xul","Choose a bucket","chrome,modal,centerscreen",s3_uiManager,s3_remoteTreeView);
if(s3_remoteTreeView.dialogResponse==null){
return;
}
selectedBucket=s3_remoteTreeView.arrRemoteFiles[s3_remoteTreeView.dialogResponse.selectedIndex];
_6a=selectedBucket.fileName;
_74="/"+_6a+"/";
}
_72=_74+_70.fileName+"/";
if(_70==null){
return;
}
}else{
if(_67=="download_sync_add"){
var _6f=s3_remoteTreeView.selection.getRangeCount();
s3_remoteTreeView.selection.getRangeAt(0,_6b,end);
_70=s3_remoteTreeView.arrRemoteFiles[s3_remoteTreeView.selection.currentIndex];
var _75=s3_localTreeView.getLocalPrefFolder();
_71=s3_Utils.localPath(_75.path+"\\"+_70.fileName);
_72=_70.filePath;
if(_70==null){
return;
}
}
}
if(_6f>1||end.value-_6b.value!=0){
alert("Multiple files are selected. Please select only one directory to add to the synchronization list.");
return;
}
if(!_70.isDirectory){
alert("Only directories can be added be added to the list, please select only one directory");
return;
}
_73=_70.fileName;
s3_manageSyncFolders.loadSyncData(false);
_73=prompt("Give a name to identify the synchronize folders, leave it blank to cancel this operation.",_73);
if(_73==null){
return;
}
_73=s3_Utils.trim(_73);
if(_73==""){
return;
}
var _76=s3_manageSyncFolders.isExistsInAccount(_73,s3_uiManager.acctName);
if(_76!=-1){
alert("The name you specified already exists in the list! A random string is appended to the given name");
_73+="_"+(new Date()).valueOf();
}
s3_manageSyncFolders.arrSyncList.push({"acctName":s3_uiManager.acctName,"syncName":_73,"localLoc":_71,"s3Loc":_72});
s3_manageSyncFolders.saveInfo(true);
var _77=s3_get("s3_syncFoldersPopup");
_77.setAttribute("isDirty","yes");
}
_67=this.setActType(_67);
if(_67=="download"){
s3_remoteTreeView.folderExists=false;
var _75=s3_localTreeView.getLocalPrefFolder();
var ret;
if(s3_uiManager.isOverlay){
var _79=s3_remoteTreeView.getDownloadFolder();
ret=_79[0];
_75=_79[1];
if(!ret){
return;
}
}
var _6f=s3_remoteTreeView.selection.getRangeCount();
s3_fileOpPref.askOption=true;
var _7a=null;
for(var t=0;t<_6f;t++){
s3_remoteTreeView.selection.getRangeAt(t,_6b,end);
for(var v=_6b.value;v<=end.value;v++){
if(_7a==null){
_7a=new s3_TaskDownload(true,s3_uiManager.authInfo,_75.path);
}
var _7d=s3_remoteTreeView.arrRemoteFiles[v];
_7a.addToQueue(_7d,null);
}
}
if(_7a){
_7a.startProcessing();
}
_7a=null;
}else{
if(_67=="upload"||_67=="uploadFromContextMenu"||_67=="upload_set_headers"){
var _74=s3_remoteTreeView.getRemotePath();
s3_fileOpPref.askOption=true;
s3_remoteTreeView.folderExists=false;
var _7e=s3_remoteTreeView.currentKey;
var _7f=null;
if(_67=="upload_set_headers"){
s3_remoteTreeView.dialogResponse=null;
window.openDialog("chrome://s3fox/content/s3SetHeaders.xul","Choose Headers","chrome,modal,centerscreen",s3_uiManager,s3_remoteTreeView);
if(s3_remoteTreeView.dialogResponse==null){
return;
}
_7f=s3_remoteTreeView.dialogResponse;
}
if(_74=="/"){
if(_6a==""){
s3_remoteTreeView.dialogResponse=null;
window.openDialog("chrome://s3fox/content/s3DlgBeforeUpload.xul","Choose a bucket","chrome,modal,centerscreen",s3_uiManager,s3_remoteTreeView);
if(s3_remoteTreeView.dialogResponse==null){
return;
}
_70=s3_remoteTreeView.arrRemoteFiles[s3_remoteTreeView.dialogResponse.selectedIndex];
_6a=_70.fileName;
}
_74="/"+_6a+"/";
}
if(_6e){
s3_remoteTreeView.addFilesFromDrop(_68,_74);
}else{
var _80=null;
var _6f=s3_localTreeView.selection.getRangeCount();
for(var t=0;t<_6f;t++){
s3_localTreeView.selection.getRangeAt(t,_6b,end);
for(var v=_6b.value;v<=end.value;v++){
if(_80==null){
_80=new s3_TaskUpload(true,s3_uiManager.authInfo,_74,_7f);
}
var _81=s3_localTreeView.arrLocalFiles[v];
_80.addToQueue(_81,null);
}
}
if(_80){
_80.startProcessing();
}
_80=null;
}
}
}
if(s3_actionTreeView.treeBox){
s3_actionTreeView.treeBox.rowCountChanged(0,_6d);
_6d=s3_actionTreeView.getRowCount();
s3_actionTreeView.treeBox.rowCountChanged(0,_6d);
}
if(s3_remoteTreeView.folderExists){
alert(s3_Utils.getPropertyString("folders"));
}
s3_get("s3_actionTab").selectedIndex=(s3_uiManager.isOverlay)?1:0;
s3_actionTreeView.ProcessActionQ(_67);
},addFilesFromDrop:function(_82,_83){
var _84=null;
if(_82.numDropItems){
for(var m=0;m<_82.numDropItems;m++){
var _86=Components.classes["@mozilla.org/widget/transferable;1"].createInstance(Components.interfaces.nsITransferable);
_86.addDataFlavor("application/x-moz-file");
_86.addDataFlavor("text/x-moz-url");
_82.getData(_86,m);
var _87=new Object();
var _88=new Object();
var _89=new Object();
_86.getAnyTransferData(_89,_87,_88);
if(_89.value.toString()!="application/x-moz-file"){
return;
}
var _8a=_87.value.QueryInterface(Components.interfaces.nsIFile);
var _8b=_8a.parent?_8a.parent.path:_8a.path;
var _8c=new s3_localFileInfo(_8b,_8a.leafName,_8a.parent.path,_8a.fileSize,_8a.lastModifiedTime,_8a.isDirectory());
if(_84==null){
_84=new s3_TaskUpload(true,s3_uiManager.authInfo,_83);
}
_84.addToQueue(_8c,null);
}
if(_84){
_84.startProcessing();
}
}else{
for(var m=0;m<_82.mozItemCount;m++){
var _89=_82.mozTypesAt(m)[0];
if(_89!="application/x-moz-file"){
return;
}
var _8a=_82.mozGetDataAt(_82.mozTypesAt(m)[0],m).QueryInterface(Components.interfaces.nsIFile);
var _8b=_8a.parent?_8a.parent.path:_8a.path;
var _8c=new s3_localFileInfo(_8b,_8a.leafName,_8a.parent.path,_8a.fileSize,_8a.lastModifiedTime,_8a.isDirectory());
if(_84==null){
_84=new s3_TaskUpload(true,s3_uiManager.authInfo,_83);
}
_84.addToQueue(_8c,null);
}
if(_84){
_84.startProcessing();
}
}
_84=null;
},addToUploadQ:function(_8d,_8e,_8f,_90){
var _91=_8d.fileName;
var _90=s3_remoteTreeView.getRemotePath();
var _92=s3_remoteTreeView.fileExists(_91);
if(_92!=-1){
if(s3_fileOpPref.askOption){
window.openDialog("chrome://s3fox/content/s3Overwrite.xul","Overwrite Options","chrome,modal,centerscreen",s3_fileOpPref,_8d.fileName,"regular");
}
if(s3_fileOpPref.overwriteOption==s3_fileOpPref.SKIP){
s3_fileOpPref.askOption=true;
return;
}else{
if(s3_fileOpPref.overwriteOption==s3_fileOpPref.SKIP_ALL||s3_fileOpPref.overwriteOption==s3_fileOpPref.CANCEL){
s3_fileOpPref.askOption=false;
return;
}else{
if(s3_fileOpPref.overwriteOption==s3_fileOpPref.OVERWRITE_DELETE){
s3_fileOpPref.askOption=true;
}else{
if(s3_fileOpPref.overwriteOption==s3_fileOpPref.OVERWRITE_DELETE_ALL){
s3_fileOpPref.askOption=false;
}
}
}
}
}
var _93=new s3_actionRow(_8e.path,_90,_8d.fileName,s3_progStatus.INIT,"upload",_8d.fileSize,"",_8d.isDirectory,s3_remoteTreeView.arrRemoteFiles[_92],_8f,s3_uiManager.getActionInstance());
s3_actionTreeView.arrActionQ.push(_93);
if(_8d.isDirectory){
var _94=s3_uiManager.getActionInstance();
_94.getRemoteFilesList(_90);
if(_94.isError>0){
return;
}
this.syncAddLocalFoldersToQ(s3_Utils.localPath(_8e.path+"\\"+_8d.fileName),_90+_8d.fileName,_94,false,false);
}
},syncAddLocalFoldersToQ:function(_95,_96,_97,_98,_99){
if(_96.charAt(_96.length-1)!="/"){
_96+="/";
}
try{
var dir=Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
dir.initWithPath(_95);
if(!dir.exists()||!dir.isDirectory()){
throw s3_Utils.getPropertyString("validpath");
}
var _9b=dir.directoryEntries;
while(_9b.hasMoreElements()){
var _9c=_9b.getNext().QueryInterface(Components.interfaces.nsILocalFile);
var _9d=_9c.fileSize;
var _9e;
if(_98){
_9e=this.checkRemoteFileExists(_97,_96+_9c.leafName);
}else{
_9e=this.checkRemoteFileExists(_97,_96+dir.leafName+"/"+_9c.leafName);
}
if(_9e!=-1){
_97.arrFiles[_9e].found=true;
if(!_9c.isDirectory()&&_97.arrFiles[_9e].isDirectory){
_9e=-1;
}
if(!_9c.isDirectory()&&!_97.arrFiles[_9e].isDirectory&&_98&&_99){
var _9f=s3_uiManager.getActionInstance();
_9f.getHeaderInfo(_97.arrFiles[_9e].filePath);
if(_9f.headerInfo["x-amz-meta-s3fox-modifiedtime"]==_9c.lastModifiedTime&&_9f.headerInfo["x-amz-meta-s3fox-filesize"]==_9c.fileSize){
continue;
}
}
}
if(_9e!=-1&&!_98){
if(s3_fileOpPref.askOption){
window.openDialog("chrome://s3fox/content/s3Overwrite.xul","Overwrite Options","chrome,modal,centerscreen",s3_fileOpPref,_97.arrFiles[_9e].fileName,"regular");
}
if(s3_fileOpPref.overwriteOption==s3_fileOpPref.SKIP){
s3_fileOpPref.askOption=true;
continue;
}else{
if(s3_fileOpPref.overwriteOption==s3_fileOpPref.SKIP_ALL||s3_fileOpPref.overwriteOption==s3_fileOpPref.CANCEL){
s3_fileOpPref.askOption=false;
continue;
}else{
if(s3_fileOpPref.overwriteOption==s3_fileOpPref.OVERWRITE_DELETE){
s3_fileOpPref.askOption=true;
}else{
if(s3_fileOpPref.overwriteOption==s3_fileOpPref.OVERWRITE_DELETE_ALL){
s3_fileOpPref.askOption=false;
}
}
}
}
}
if(_98){
var _a0=new s3_actionRow(dir.path,_96,_9c.leafName,s3_progStatus.INIT,"upload",_9d,"",_9c.isDirectory(),_97.arrFiles[_9e],_96,s3_uiManager.getActionInstance());
_a0.isSyncActions=true;
s3_syncActionsTreeView.arrActionQ.push(_a0);
}else{
var _a0=new s3_actionRow(dir.path,_96,_9c.leafName,s3_progStatus.INIT,"upload",_9d,"",_9c.isDirectory(),_97.arrFiles[_9e],_96,s3_uiManager.getActionInstance());
s3_actionTreeView.arrActionQ.push(_a0);
}
if(_9c.isDirectory()){
this.syncAddLocalFoldersToQ(s3_Utils.localPath(dir.path+"\\"+_9c.leafName),_96+_9c.leafName,_97,_98,_99);
}
}
}
catch(ex){
alert(ex);
}
},syncAddRemoteFoldersToQ:function(_a1,_a2,_a3){
if(_a2.charAt(_a2.length-1)!="/"){
_a2+="/";
}
var _a4=new Array;
var _a5=s3_uiManager.getActionInstance();
_a5.getRemoteFilesList(_a2);
if(_a5.isError>0){
return _a5.isError;
}
if(_a5.arrFiles.length==0){
alert("No files in the remote directory!");
return 1;
}
for(var i=0;i<_a5.arrFiles.length;i++){
var _a7=_a5.arrFiles[i];
var _a8=_a7.filePath;
if(_a3){
var _a9=Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
var _aa=s3_Utils.localPath(_a1+"\\"+_a7.fileName);
_a9.initWithPath(_aa);
if(_a9.exists()){
_a4.push(_aa);
}
if(_a9.exists()&&!_a9.isDirectory()){
var _ab=s3_uiManager.getActionInstance();
_ab.getHeaderInfo(_a8);
s3_dump(_ab.headerInfo["x-amz-meta-s3fox-modifiedtime"]+", "+_a9.lastModifiedTime+", "+_a9.path);
if(_ab.headerInfo["x-amz-meta-s3fox-modifiedtime"]==_a9.lastModifiedTime&&_ab.headerInfo["x-amz-meta-s3fox-filesize"]==_a9.fileSize){
continue;
}
}
}
var _ac=new s3_actionRow(_a8,_a1,_a7.fileName,s3_progStatus.INIT,"download",_a7.fileSize,"",_a7.isDirectory,null,_a7.key,s3_uiManager.getActionInstance());
_ac.overwriteFiles=true;
_ac.isSyncActions=true;
s3_syncActionsTreeView.arrActionQ.push(_ac);
}
return _a4;
},putToS3:function(_ad){
var _ae=s3_Utils.trim(_ad.getAttribute("s3Loc"));
var _af=s3_Utils.trim(_ad.getAttribute("localLoc"));
var _b0=-s3_syncActionsTreeView.getRowCount();
var _b1=confirm("Do you wish to skip upload of unchanged files since last upload?");
var _b2=false;
if(_b1){
_b2=true;
}
var _b3=new s3_TaskUploadSync(true,s3_uiManager.authInfo,_ae,_af,_b2);
_b3.startProcessing();
s3_get("s3_actionTab").selectedIndex=(s3_uiManager.isOverlay)?2:1;
return;
},removeLocalFiles:function(_b4,_b5){
try{
var dir=Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
dir.initWithPath(_b4);
if(!dir.exists()||!dir.isDirectory()){
throw s3_Utils.getPropertyString("validpath");
}
var _b7=dir.directoryEntries;
while(_b7.hasMoreElements()){
var _b8=_b7.getNext().QueryInterface(Components.interfaces.nsILocalFile);
var _b9=_b8.path;
if(_b5.indexOf(_b9)==-1){
_b8.remove(true);
continue;
}
if(_b8.isDirectory()){
this.removeLocalFiles(s3_Utils.localPath(dir.path+"\\"+_b8.leafName),_b5);
}
}
}
catch(ex){
alert(ex);
}
},getFromS3:function(_ba){
var _bb=s3_Utils.trim(_ba.getAttribute("s3Loc"));
var _bc=s3_Utils.trim(_ba.getAttribute("localLoc"));
var _bd=-s3_syncActionsTreeView.getRowCount();
var _be=confirm("Do you wish to skip download of unchanged files since last download?");
var _bf=false;
if(_be){
_bf=true;
}
var _c0=new s3_TaskDownloadSync(true,s3_uiManager.authInfo,_bb,_bc,_bf);
_c0.startProcessing();
s3_get("s3_actionTab").selectedIndex=(s3_uiManager.isOverlay)?2:1;
return;
try{
var _c1=this.syncAddRemoteFoldersToQ(s3_Utils.localPath(_bc),_bb,_bf);
if(_c1!=null){
var _c2=Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
_c2.initWithPath(s3_Utils.localPath(_bc));
this.removeLocalFiles(_c2.path,_c1);
}else{
return;
}
if(s3_syncActionsTreeView.treeBox){
s3_syncActionsTreeView.treeBox.rowCountChanged(0,_bd);
_bd=s3_syncActionsTreeView.getRowCount();
s3_syncActionsTreeView.treeBox.rowCountChanged(0,_bd);
}
s3_get("s3_actionTab").selectedIndex=(s3_uiManager.isOverlay)?2:1;
if(s3_syncActionsTreeView.getRowCount()>0){
setTimeout("s3_syncActionsTreeView.Download()",10);
}
}
catch(ex){
alert("Error getting from S3 - "+ex);
}
},checkRemoteFileExists:function(_c3,_c4){
var _c5=-1;
for(var i=0;i<_c3.arrFiles.length;i++){
if(s3_Utils.trim(_c3.arrFiles[i].filePath)==s3_Utils.trim(_c4)){
_c5=i;
break;
}
}
return _c5;
},getDownloadFolder:function(){
var _c7=Components.interfaces.nsIFilePicker;
var _c8="@mozilla.org/filepicker;1";
var fp=Components.classes[_c8].createInstance(_c7);
fp.init(window,s3_Utils.getPropertyString("choosefolder"),_c7.modeGetFolder);
fp.appendFilters(_c7.filterAll|_c7.filterText);
var _ca=s3_localTreeView.getLocalPrefFolder();
if(_ca!=null){
fp.displayDirectory=_ca;
}
fp.appendFilters(_c7.filterAll);
var rv=fp.show();
if(rv==_c7.returnOK){
return [true,fp.file];
}else{
return [false,null];
}
},getPresignedUrls:function(){
window.openDialog("chrome://s3fox/content/s3SignedUrls.xul","Get Signed Urls","chrome,modal,centerscreen",s3_uiManager,s3_remoteTreeView);
},showBadCertMessage:function(url){
if(!this.badCertMessageShow){
this.badCertMessageShow=true;
alert("The bucket has dot(.) and you are using https. The SSL Certificate is valid only for *.s3.amazonaws.com and not any sub domains.\nAdd an exception to domains having dot(.) to make it work.");
window.openDialog("chrome://pippki/content/exceptionDialog.xul","Add Exceptions","chrome,centerscreen",{"location":url});
return false;
}
return true;
}};
//
function LoadData()
		{	

			//var s3_remoteTreeView = new s3_remoteTreeView();
			
			var s3_arrUrls = new Array();

			var numRanges = s3_remoteTreeView.selection.getRangeCount();
			if (numRanges == 0)
				return;
			
			var start = {};
			var end = {};
			var count = 0;
			for (var t = 0; t < numRanges; t++)
			{
				s3_remoteTreeView.selection.getRangeAt(t, start, end);
				for (var v = start.value; v <= end.value; v++)
				{
					var tRemoteInfo = s3_remoteTreeView.arrRemoteFiles[v];
					println(tRemoteInfo.filePath);
					s3_arrUrls.push(tRemoteInfo.filePath);					
				}
			}
			//generateUrls(s3_arrUrls, 24);
		}