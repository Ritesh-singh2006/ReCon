import 'dotenv/config'
import express from "express";
import cors from "cors";
import multer from "multer";
import mongoose from "mongoose";
import session from "express-session";
import passport from "./auth/passport.js";
import { DocumentModel } from "./models/Document.js";
import { highlightModel } from "./models/Highlight.js";
import { UserModel } from './models/User.js';
import { getGroqChatCompletion } from "./services/summaryservice.js";
import { convertToVector } from "./services/embeddingService.js"
import { storeEmbedding, querySimilar } from "./services/pineconeService.js";
import jwt from 'jsonwebtoken';
import fs from 'fs';

const app = express()
const port = 3000

if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// credentials: true tells browser to include cookies in cross-origin requests
// without this, session cookie won't be sent from localhost:5173 to localhost:3000
app.use(cors({
  origin: "https://re-con-orcin.vercel.app", // only allow your React app
  credentials: true               // allow cookies to be sent
}))

app.use(express.json())
app.use('/uploads', express.static('uploads'))

// 4. Session middleware — must come BEFORE passport
// This creates and manages sessions for all requests
app.use(session({
  secret: process.env.SESSION_SECRET, // from your .env file — signs the cookie
  resave: false,                      // don't save session if nothing changed
  saveUninitialized: false,           // don't create session until something stored
  cookie: {
    maxAge: 24 * 60 * 60 * 1000,     // session lasts 24 hours (in milliseconds)
    secure: true,
    sameSite: 'none',
  }
}))

// 5. Passport initialize — sets passport up on every request
app.use(passport.initialize())

// 6. Passport session — reads session cookie, calls deserializeUser, sets req.user
// must come AFTER express-session
app.use(passport.session())

//connecting database
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("DB connected successfully")
  })
  .catch((err) => {
    console.log("failed to connect DB :" + err)
  });

// ─── AUTH MIDDLEWARE ─────────────────────────────────────────────────────────


// Reusable function to protect routes
// Add this to any route that requires login
function isLoggedIn(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "please login first" });

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { _id: decoded.id, name: decoded.name, email: decoded.email };
    next();
  } catch {
    res.status(401).json({ message: "invalid token" });
  }
}

// ─── AUTH ROUTES ─────────────────────────────────────────────────────────────

// Starts Google OAuth flow
// When frontend hits this URL, passport redirects to Google login page
// scope tells Google what info we want — profile (name) and email
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
)

// Google redirects here after user logs in
// Passport handles the code exchange, runs verify callback, serializes user
app.get('/auth/google/callback',
  passport.authenticate('google', {
    failureRedirect: "https://re-con-orcin.vercel.app"
  }),
  (req, res) => {
    const token = jwt.sign(
      { id: req.user._id, name: req.user.name, email: req.user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    )
    res.redirect(`https://re-con-orcin.vercel.app?token=${token}`)
  }
)

// Route for frontend to check if user is logged in
// Frontend calls this on load to know whether to show login button or home screen
app.get('/auth/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.json({ loggedIn: false });

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ loggedIn: true, name: decoded.name, email: decoded.email, id: decoded.id });
  } catch {
    res.json({ loggedIn: false });
  }
})

// Logout route
app.get('/auth/logout', (req, res) => {
  req.logout(() => {
    res.json({ message: "logged out successfully" })
  })
})

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
app.post('/api/upload', isLoggedIn, upload.single('file'), async (req, res) => { //this name i.e 'file' inside .single() should match with key of dataframe in frontend
  try {
    console.log(req.file)

    //saving in DB
    const document = new DocumentModel({ name: req.file.originalname, path: req.file.path, userId: req.user._id })
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

app.get('/api/documents', isLoggedIn, async (req, res) => {
  try {
    const documents = await DocumentModel.find({ userId: req.user._id })
      .sort({ uploadedAt: -1 }) // newest first
    res.json(documents)
  } catch (err) {
    res.status(500).json({ message: "error fetching documents" })
  }
})

app.post('/api/highlight', isLoggedIn, async (req, res) => {
  try {
    const { selectedText, documentId, currentPage } = req.body;
    const highlight = new highlightModel({
      selectedText,
      documentId,
      currentPage,
      userId: req.user._id
    });
    await highlight.save();
    // const chatCompletion = await getGroqChatCompletion(highlight.selectedText)
    // const aiResponse = chatCompletion.choices[0]?.message?.content || "";
    const embedding = await convertToVector(highlight.selectedText);
    const metadata = {
      text: highlight.selectedText,
      documentId: documentId,
      pageNumber: currentPage,
      userId: req.user._id.toString()
    }
    await storeEmbedding(highlight.id, embedding, metadata)
    const vectorSearchResult = await querySimilar(embedding, highlight._id.toString(),req.user._id.toString());
    const aiResponse = await getGroqChatCompletion(vectorSearchResult, highlight.selectedText);

    console.log(aiResponse.choices[0].message.content);
    res.json({
      message: "highlight saved successfully in DB",
      relatedHighlights: aiResponse
    })
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
