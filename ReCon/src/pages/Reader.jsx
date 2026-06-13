import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";
import './Reader.css';
import toast from "react-hot-toast";

pdfjs.GlobalWorkerOptions.workerSrc = workerSrc

function Reader() {

    const pdfRef = useRef(null);
    const { documentId } = useParams();
    const navigate = useNavigate();

    const [currentpage, setcurrentpage] = useState(1);
    const [totalpages, settotalpages] = useState(1);
    const [doc, setdoc] = useState(null);
    const [selectedText, setSelectedText] = useState(null);
    const [aiResponse, setaiResponse] = useState([]);
    const [earlierRead, setearlierRead] = useState([]);

    // Check auth on load — redirect to home if not logged in
    useEffect(() => {
        fetch("http://localhost:3000/auth/me", {
            credentials: 'include'
        })
            .then(res => res.json())
            .then(data => {
                if (!data.loggedIn) {
                    navigate('/') // not logged in — back to home
                }
            })
            .catch(err => console.log(err))
    }, [])

    // Fetch document info
    useEffect(() => {
        fetch(`http://localhost:3000/api/uploads/${documentId}`, {
            credentials: 'include' // send session cookie
        })
            .then(res => res.json())
            .then(data => setdoc(data))
            .catch(err => console.log("err"))
    }, [documentId]);

    // Detect text selection on PDF
    useEffect(() => {
        const handleMouseUp = () => {
            const selection = window.getSelection();
            const text = selection.toString().trim();
            if (text) {
                setSelectedText(text);
            }
        }
        const el = pdfRef.current;
        if (el) {
            el.addEventListener("mouseup", handleMouseUp);
        }
        return () => {
            if (el) el.removeEventListener("mouseup", handleMouseUp);
        };
    }, [doc]);

    // Runs only when user clicks Highlight button
    const handleHighlight = () => {
        if (!selectedText) return;

        fetch('http://localhost:3000/api/highlight', {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include', // send session cookie
            body: JSON.stringify({
                selectedText,
                documentId,
                currentPage: currentpage,
            })
        })
            .then(res => res.json())
            .then(data => {
                toast.success(data.message);
                const content = data.relatedHighlights.choices[0].message.content;
                const highlights = JSON.parse(content);
                // setaiResponse(prev => [...prev, data.summaryResponse]);
                setearlierRead(prev => [...prev, ...highlights]);
                setSelectedText(null);
            })
            .catch(err => console.log(err));
    }

    if (!doc) return <div className="loading-container"><div className="loader"></div><p>Loading document...</p></div>;

    const handleLoadSuccess = ({ numPages }) => {
        settotalpages(numPages);
    };

    const prevhandler = () => setcurrentpage(p => Math.max(p - 1, 1));
    const nexthandler = () => setcurrentpage(p => Math.min(p + 1, totalpages));

    return (
        <div className="reader-container">
            <nav className="reader-nav glass">
                <div className="nav-left">
                    <button className="btn-icon" onClick={() => navigate('/')}>← Home</button>
                    <span className="doc-name">{doc.name}</span>
                </div>

                <div className="nav-center">
                    <button className="btn-pagination" onClick={prevhandler} disabled={currentpage === 1}>Prev</button>
                    <span className="page-info">Page {currentpage} of {totalpages}</span>
                    <button className="btn-pagination" onClick={nexthandler} disabled={currentpage === totalpages}>Next</button>
                </div>

                <div className="nav-right">
                    <button className="btn-primary highlight-btn" onClick={handleHighlight} disabled={!selectedText}>
                        Highlight & Connect
                    </button>
                </div>
            </nav>

            <main className="reader-main">
                <div className="pdf-viewer-container" ref={pdfRef}>
                    <div className="pdf-document-wrapper">
                        <Document
                            file={`http://localhost:3000/${doc.path.replace(/\\/g, "/")}`}
                            onLoadSuccess={handleLoadSuccess}
                        >
                            <Page
                                pageNumber={currentpage}
                                scale={1.2}
                                renderTextLayer={true}
                                className="pdf-page"
                            />
                        </Document>
                    </div>
                </div>

                <aside className="ai-sidebar">
                    <div className="section-content">
                        {earlierRead.length === 0 ? (
                            <p className="empty-text">
                                No related highlights yet — keep reading!
                            </p>
                        ) : (
                            earlierRead.map((text, index) => (
                                <div className="highlight-card" key={index}>
                                    <p className="highlight-text">"{text}"</p>
                                </div>
                            ))
                        )}
                    </div>

                    {/* <div className="sidebar-section glass">
                         <div className="section-header">
                            <h2>Summary</h2>
                        </div>
                        <div className="section-content">
                            {aiResponse.length === 0 ? (
                                <p className="empty-text">Highlight something to see its summary!</p>
                            ) : (
                                aiResponse.map((item, index) => (
                                    <div className="summary-card" key={index}>
                                        <p>{item}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div> */}
                </aside>
            </main>
        </div>
    )
}

export default Reader