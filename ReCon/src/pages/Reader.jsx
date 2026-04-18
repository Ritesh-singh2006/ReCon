import { useParams } from "react-router-dom";
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

    const [currentpage, setcurrentpage] = useState(1);
    const [totalpages, settotalpages] = useState(1);
    const [doc, setdoc] = useState(null);
    const [selectedText, setSelectedText] = useState(null);
    const [aiResponse, setaiResponse] = useState([]);

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
                console.log(data);
                toast.success(data.message);
                setaiResponse(prev => [
                    ...prev,
                    data.summaryResponse,
                ]);
                setSelectedText(null);
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
                    <button onClick={handleHighlight}>Highlight</button>
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
                        <div className="summary">
                            <h1>SUMMARY IS</h1>
                            {aiResponse.map((item, index) => (
                                <p key={index}>{item}</p>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        </>
    )
}
export default Reader