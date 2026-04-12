import { useParams } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";
import './Reader.css';

pdfjs.GlobalWorkerOptions.workerSrc = workerSrc

function Reader() {

    const pdfRef = useRef(null);
    const { documentId } = useParams();

    const [currentpage, setcurrentpage] = useState(1);
    const [totalpages, settotalpages] = useState(1);
    const [doc, setdoc] = useState(null);
    const [selectedText, setSelectedText] = useState(null);
    const [toolbarPosition, setToolbarPosition] = useState(null);

    // fetch document info from backend
    useEffect(() => {
        fetch(`http://localhost:3000/api/uploads/${documentId}`)
            .then(res => res.json())
            .then(data => setdoc(data))
            .catch(err => console.log("err"))
    }, [documentId]);

    // detect text selection on PDF
    useEffect(() => {
        const handleMouseUp = () => {
            const selection = window.getSelection();
            const text = selection.toString().trim();

            if (text && text.length > 0) {
                // text is selected — store it and calculate toolbar position
                setSelectedText(text);
                const rect = selection.getRangeAt(0).getBoundingClientRect();
                setToolbarPosition({
                    // position toolbar just above the selection
                    // rect.top gives distance from top of viewport
                    // we subtract 40px so toolbar appears above the text
                    top: rect.top + window.scrollY - 40,
                    left: rect.left + window.scrollX
                });
            } else {
                // nothing selected — hide toolbar
                setSelectedText(null);
                setToolbarPosition(null);
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

    // this runs ONLY when user clicks the highlight button
    const handleHighlight = () => {
        if (!selectedText) return;

        fetch('http://localhost:3000/api/highlight', {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                selectedText,
                documentId,
                currentPage: currentpage,
            })
        })
        .then(res => res.json())
        .then(data => {
            console.log("highlight saved:", data)
            // hide toolbar after saving
            setSelectedText(null);
            setToolbarPosition(null);
        })
        .catch(err => console.log(err));
    }

    if (!doc) return <p>Loading...</p>;

    const handleLoadSuccess = ({ numPages }) => {
        settotalpages(numPages);
    };

    const prevhandler = () => setcurrentpage(p => Math.max(p - 1, 1));
    const nexthandler = () => setcurrentpage(p => Math.min(p + 1, totalpages));

    return (
        <>
            <section className="readersection">
                <div className="navigationbar">
                    <span>{doc.name}</span>
                    <div>
                        <button onClick={prevhandler}>prev</button>
                        <span>page {currentpage} of {totalpages}</span>
                        <button onClick={nexthandler}>next</button>
                    </div>
                </div>
                <div className="parentdiv">
                    <div className="mainpdf" ref={pdfRef}>
                        <Document
                            file={`http://localhost:3000/${doc.path.replace(/\\/g, "/")}`}
                            onLoadSuccess={handleLoadSuccess}
                        >
                            <Page
                                pageNumber={currentpage}
                                scale={1.2}
                                renderTextLayer={true}
                            />
                        </Document>
                    </div>
                    <div className="aicomponents">
                        <div className="highlight">YOU READ THIS LAST TIME</div>
                        <div className="summary">THE SUMMARY IS</div>
                    </div>
                </div>
            </section>

            {/* toolbar only appears when text is selected */}
            {toolbarPosition && (
                <button
                    onMouseDown={(e) => {
                        // prevent mousedown from clearing the selection
                        // before handleHighlight can read it
                        e.preventDefault();
                    }}
                    onClick={handleHighlight}
                    style={{
                        position: "fixed",
                        top: toolbarPosition.top,
                        left: toolbarPosition.left,
                        background: "#a29bfe",
                        color: "white",
                        border: "none",
                        padding: "6px 12px",
                        borderRadius: "6px",
                        cursor: "pointer",
                        zIndex: 1000,
                        fontSize: "13px"
                    }}
                >
                    Highlight
                </button>
            )}
        </>
    )
}
export default Reader