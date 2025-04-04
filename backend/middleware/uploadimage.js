const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
    destination: (req,file,cb) => {
        cb(null,"uploads/")
    },
    filename: (req,file,cb) => {
        cb(null, Date.now() + path.extname(file.originalname))
    }
})

const fileFilter = (req,file,cb) => {
    const allowedtypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/wbbp",

    ];

    cb(null, allowedtypes.includes(file.mimetype))
}




const upload = multer({storage,
    fileFilter,
    limits:{fileSize: 10 * 1024 * 1024}

});


module.exports = upload;