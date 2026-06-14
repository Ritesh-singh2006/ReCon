import './Home.css'
import logo from "../assets/ReCon_logo.png";
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Home() {

    const navigate = useNavigate();
    const [file, setfile] = useState(null)
    const [user, setUser] = useState(null)        // stores logged in user info
    const [documents, setDocuments] = useState([])// stores past uploaded docs

    const getToken = () => localStorage.getItem('token');

    const authHeaders = () => ({
        'Authorization': `Bearer ${getToken()}`
    });


    // Check if user is logged in when home page loads
    useEffect(() => {
        // grab token from URL after Google login
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
        if (token) {
            localStorage.setItem('token', token);
            window.history.replaceState({}, '', '/'); // clean URL
        }

        fetch(`${import.meta.env.VITE_API_URL}/auth/me`, {
            headers: authHeaders()
        })
            .then(res => res.json())
            .then(data => {
                if (data.loggedIn) {
                    setUser(data);
                    fetchDocuments();
                }
            })
            .catch(err => console.log(err))
    }, [])

    // Fetch all documents uploaded by this user
    const fetchDocuments = () => {
        fetch(`${import.meta.env.VITE_API_URL}/api/documents`, {
            headers: authHeaders()
        })
            .then(res => res.json())
            .then(data => setDocuments(data))
            .catch(err => console.log(err))
    }

    // Redirect to Google login
    const handleGoogleLogin = () => {
        window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`
    }

    // Logout
    const handleLogout = () => {
        localStorage.removeItem('token');
        setUser(null);
        setDocuments([]);
    }

    function handlechosenfile(e) {
        const chosenfile = e.target.files[0]
        setfile(chosenfile)
    }

    async function handlefileupload() {
        if (!file) return;
        const formdata = new FormData();
        formdata.append("file", file);
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/upload`, {
            method: "POST",
            body: formdata,
            headers: authHeaders()
        });
        const data = await response.json();
        navigate(`/reader/${data.id}`);
    }

    // Open a previously uploaded document
    const openDocument = (id) => {
        navigate(`/reader/${id}`)
    }

    return (
        <div className="home-container">
            {/* Background decorative elements */}
            <div className="bg-shape shape-1"></div>
            <div className="bg-shape shape-2"></div>

            <div className="hero-section glass">
                <img src={logo} alt="ReCon Logo" className="hero-logo" />
                <h1 className="hero-title">Read more. <br /><span className="gradient-text">Remember everything.</span></h1>
                <p className="hero-para">
                    Every time you highlight something important, it lives in the margin of a document you'll never open again. ReCon changes that. Highlight anything — and instantly see everything you've ever read that connects to it. No searching. No note-taking. Just the knowledge you already have, finally talking to itself.
                </p>

                {/* Show login button if not logged in */}
                {!user ? (
                    <button className="btn-primary login-btn" onClick={handleGoogleLogin}>
                        Sign in with Google
                    </button>
                ) : (
                    <div className="user-dashboard">
                        <div className="user-header">
                            <p className="welcome-text">Welcome back, <strong>{user.name}</strong></p>
                            <button className="btn-primary logout-btn" onClick={handleLogout}>Logout</button>
                        </div>

                        {/* Upload new document */}
                        <div className="upload-section">
                            <div className="file-input-wrapper">
                                <input type="file" id="file-upload" accept='.pdf' onChange={handlechosenfile} />
                                <label htmlFor="file-upload" className="file-label">
                                    {file ? file.name : "Choose a PDF file..."}
                                </label>
                            </div>
                            <button className="btn-primary upload-btn" onClick={handlefileupload} disabled={!file}>
                                Upload & Read
                            </button>
                        </div>

                        {/* Previously uploaded documents */}
                        <div className="documents-section">
                            <h2>Your Documents</h2>
                            {documents.length === 0 ? (
                                <div className="empty-state">
                                    <p>No documents yet — upload your first PDF to get started!</p>
                                </div>
                            ) : (
                                <div className="documents-grid">
                                    {documents.map(doc => (
                                        <div
                                            className="document-card glass"
                                            key={doc._id}
                                            onClick={() => openDocument(doc._id)}
                                        >
                                            <div className="doc-icon">📄</div>
                                            <div className="doc-info">
                                                <h3 className="doc-title">{doc.name}</h3>
                                                <p className="doc-date">{new Date(doc.uploadedAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Home