const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadPath = path.join(__dirname, "../uploads");
if(!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath);

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        setImmediate(() => {
            const uniqueSuffix = `${Date.now()}-${Math.round(10000 + Math.random() * 90000)}`;
            cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
        });
    },
});

const uploadFile = (req, res, next) => {
    multer({ storage }).single('file')(req, res, (err) => {
        if (err) {
            console.log("Multer error:", err);
            return res.status(500).json({ error: true, message: "File upload failed" });
        }
        next();
    });
};

exports.handleUpload = async(req, res) => {
    try {
        if(req.file){
            res.status(200).send({ error: false, message: "upload success" });
        } else {
            res.status(400).send({ error: true, message: "file require"});
        }
    } catch (err) {
        console.log("Error during uploading: ", err);
        res.status(500).send({ error: true, message: "Server error" });
    }
}

module.exports = {  
    upload: uploadFile,
    handleController: exports.handleUpload
};