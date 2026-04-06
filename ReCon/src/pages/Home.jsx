import './Home.css'
import logo from "../assets/ReCon_logo.png";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Home(){

    //
    const navigate = useNavigate();
    const openDocument=(id)=>{
        navigate(`/reader/${id}`)
    }

    const[file,setfile] = useState(null) //why usestate? it is because upload and chosing file are handled differently with different functions, so the filedata should be stored/remembered  so that they can be accessed in different blocks of different functions
    
    function handlechosenfile(e){
        const chosenfile = e.target.files[0] //got file data from here
        setfile(chosenfile)
    }

    async function handlefileupload(){
        const formdata = new FormData()
        formdata.append("file",file)
        const response = await fetch("http://localhost:3000/api/upload",{  //This is just a naming convention. You prefix all your backend routes with /api so it's clear these are backend endpoints, not frontend pages. It has no technical requirement — you could name it anything — but /api is the industry standard and immediately tells anyone reading your code "this is a backend call."
            method:"POST",
            body:formdata
        })
        const data = await response.json()
        openDocument(data.id)//
    }

    return(
        <>
        <div className="parent_div">
            <img src={logo} alt="" id='logoimage'/>
            <h1>Read more. Remember everything.</h1>
            <p className="home-para">Every time you highlight something important, it lives in the margin of a document you'll never open again. ReCon changes that. Highlight anything — and instantly see everything you've ever read that connects to it. No searching. No note-taking. Just the knowledge you already have, finally talking to itself.</p>
            <input type="file" accept='.pdf' onChange={handlechosenfile}/>
            <button onClick={handlefileupload}>upload</button>
            <div>your last read!</div>
        </div>
        </>
    )
}

export default Home