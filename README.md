# micro_gdrive

Simple NodeJs Micro Service to upload Images to Google Drive Shared Folder and get a public URL to share.   

You need to setup a Service Account on Google Cloud
You need to obtain your ServiceAccountCred.json from Google Cloud
You need to share a folder with the Service Account


Usage:    
use http://localhost:7001/gdrive to upload manually.     
use POST http://localhost:7001/gdrive multidata/form-data to upload Image     
fields fileName and folderName (Google Drive shared folder ID)
