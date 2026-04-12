import express from "express";
import cors from "cors";
import multer from "multer";
import mongoose from "mongoose";
import { DocumentModel } from "./models/Document.js";
import { highlightModel } from "./models/Highlight.js";

const app = express()
const port = 3000

app.use(cors())
app.use('/uploads', express.static('uploads'))
app.use(express.json())

//connecting database
mongoose.connect("mongodb://localhost:27017/ReCon_DB")
  .then(() => {
    console.log("DB connected successfully")
  })
  .catch((err) => {
    console.log("failed to connect DB :" + err)
  });

app.get('/', (req, res) => {
  res.send('Hello World!')
})

//configuring multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname)
  }
})

//multer middleware
const upload = multer({ storage: storage })

//saving file at backend server using multer and logging it to DB
app.post('/api/upload', upload.single('file'), async (req, res) => { //this name i.e 'file' inside .single() should match with key of dataframe in frontend
  try {
    console.log(req.file)

    //saving in DB
    const document = new DocumentModel({ name: req.file.originalname, path: req.file.path })
    await document.save()
    res.json({
      message: "file uploaded successfully",
      name: req.file.originalname,
      path: req.file.path,
      id: document.id
    })
  }
  catch (err) {
    res.status(500).json({ message: "something went wrong", error: err.message })
  }
})

app.post('/api/highlight', async (req, res) => {
  try {
    const { selectedText, documentId, currentPage } = req.body;
    const highlight = new highlightModel({
      selectedText,
      documentId,
      currentPage,
    });
    await highlight.save();
    res.json({message:"highlight saved successfully in DB"})
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/uploads/:id', async (req, res) => {
  try {
    const doc = await DocumentModel.findById(req.params.id)

    if (!doc) {
      return res.status(404).json({ message: "Document not found" });
    }
    res.json({
      name: doc.name,
      path: doc.path
    })
  } catch (error) {
    res.send("error fetching document")
  }
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
