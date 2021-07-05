const express = require('express');
const cors = require('cors');
const path = require('path');

const fs = require('fs');
const fsDelete = require('fs').promises;

const {json,urlencoded} = express;

const app = express();
const PORT = process.env.PORTGDRIVE || 7001;

app.use(json());
app.use(urlencoded({extended : false}));

const corsOptions = {
    origin: '*',
    optionsSuccessStatus: 200
}

app.use(cors(corsOptions));

// GOOGLE DRIVE SETUP
const { google } = require('googleapis');
const { drive } = require('googleapis/build/src/apis/drive');

//Service account key file

const KEYFILEPATH = 'ServiceAccountCred.json';

// Add drive scope
const SCOPES = ['https://www.googleapis.com/auth/drive'];


// Init the auth
const auth = new google.auth.GoogleAuth( {
    keyFile: KEYFILEPATH,
    scopes: SCOPES
});

//Init drive service
const driveService = google.drive( {version: 'v3', auth} );

// END GOOGLE DRIVE SETUP

// MULTER SETUP
const multer = require('multer');
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname + '/src/images')) 
    },
    filename: (req, file,cb) => {
        mimeType = file.mimetype;
        //console.log(file);
        let temp = Date.now() + path.extname(file.originalname);
        tempFilePath = path.join(__dirname + '/src/images/'+temp)
        cb(null, temp)
    }
});

const upload = multer({
    storage: storage,
    fileFilter:(req, file, cb) => {
        const validFileTypes = /jpg|jpeg|png/ // Create regex to match jpg and png

        // Do the regex match to check if file extenxion match
        const extname = validFileTypes.test(path.extname(file.originalname).toLowerCase())

        if(extname === true){
            // Return true and file is saved
             return cb(null, true)
        }else{
            // Return error message if file extension does not match
            return cb("Error: Images Only!")
            }
        }
});

// END MULTER SETUP

// APP VARIABLES
var fileName = "";
var folderName = "";
var mimeType = "";
var tempFilePath = "";
var url = "";

async function createAndUploadFile(){
    try 
    {
        // create upload
        
        const response = await driveService.files.create({
            requestBody:{
                name: fileName,
                mimeType: mimeType,
                parents: folderName ? [folderName] : []
            },
            media: {
                mimeType: mimeType,
                body: fs.createReadStream(tempFilePath)
            }
        })        
        url = await generatePublicUrl(response.data.id); 
        return true; 
        
    }
    catch (error) 
    {   
        url = error.message;
        return false;
    }    
};

async function generatePublicUrl(id) {
    try {
        const fileId = id;

        await driveService.permissions.create({
            fileId: fileId,
            requestBody: {
                role: 'reader',
                type: 'anyone'
            }
        })

        const result = await driveService.files.get({
            fileId: fileId,
            fields: 'webContentLink'
        })
        //fields: 'webViewLink, webContentLink'
        return result.data;
        
    } catch (error) {
        console.log(error.message);
        
    }
}

async function deleteFileFromServer(filePath) {
    fsDelete.unlink(filePath)
  .then(() => {
    console.log('File removed')
  }).catch(err => {
    console.error('Something wrong happened removing the file', err)
  })
    
}

// APP ENDPOINTS

app.get('/gdrive', ( req, res ) => {
    let msg = path.join(__dirname + '/src/html/index.html');
    res.sendFile(msg);
});

app.post('/gdrive', upload.single('image'), async ( req, res ) => {    
    
    fileName = req.body.fileName;
    folderName = req.body.folderName;    
    
    let create = await createAndUploadFile() 
    if (create) {        
        res.json({
            url: url.webContentLink    
        });
        fileName = "";
        folderName = "";
        mimeType = "";
        url = "";
    }else{
        res.json({
            error: url
        });
        fileName = "";
        folderName = "";
        mimeType = "";
        url = "";        
    }
    await deleteFileFromServer(tempFilePath)
    
    tempFilePath = "";
});

app.listen(
    PORT,
    () => console.log(`SERVER GDRIVE LISTENING ON PORT ${PORT}`)
);


// END APP ENDPOINTS