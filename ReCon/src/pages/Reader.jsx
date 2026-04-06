import { useParams } from "react-router-dom";
import { useEffect, useState, useRef, useEffectEvent } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";
import './Reader.css'

pdfjs.GlobalWorkerOptions.workerSrc = workerSrc

function Reader() {

    const pdfRef = useRef(null);
    const { documentId } = useParams();

    const [currentpage, setcurrentpage] = useState(1);
    const [totalpages, settotalpages] = useState(1);
    const [doc, setdoc] = useState(null);
    const [SelectedText, setSelectedText] = useState(null);

    useEffect(() => {
        fetch(`http://localhost:3000/api/uploads/${documentId}`)
            .then(res => res.json())
            .then(data => {
                console.log(data);
                setdoc(data)
            })
            .catch(err => console.log("err"))
    }, [documentId]);

    useEffect(() => {
        const handleMouseUp = () => {
            const selection = window.getSelection();
            const text = selection.toString();
            if (text) {
                setSelectedText(text);
            }
        }
        const el = pdfRef.current;
        if (el) {
            el.addEventListener("mouseup", handleMouseUp);
        }
        return () => {
            if (el) {
                el.removeEventListener("mouseup", handleMouseUp);
            }
        };
    }, [doc]);//why this doc prop?

    useEffect(() => {
        if (!SelectedText) return;

        fetch('http://localhost:3000/api/highlight', {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                selectedText: SelectedText,
                documentId,
                currentPage: currentpage,
            })
        })
            .then(res => res.json())
            .then(data => console.log(data))
            .catch(err => console.log(err));

    }, [SelectedText]);

    if (!doc) return <p>Loading...</p>;

    const handleLoadSuccess = ({ numPages }) => {
        settotalpages(numPages);
    };

    const prevhandler = () => {
        setcurrentpage(p => Math.max(p - 1, 1))
    };

    const nexthandler = () => {
        setcurrentpage(p => Math.min(p + 1, totalpages))
    };

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
                        <Document file={`http://localhost:3000/${doc.path.replace(/\\/g, "/")}`} onLoadSuccess={handleLoadSuccess}>
                            <Page pageNumber={currentpage} scale={1.2} renderTextLayer={true} />
                        </Document>
                    </div>
                    <div className="aicoponents">
                        <div className="highlight"> YOU READ THIS LAST TIME</div>
                        <div className="summary"> THE SUMMARY OF DOCUMENT IS </div>
                    </div>
                </div>
            </section>
        </>
    )
}
export default Reader