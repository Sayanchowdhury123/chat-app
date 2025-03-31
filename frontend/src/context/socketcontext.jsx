import {  createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";

const Socketcontext = createContext();

export const Socketprovider = ({children}) => {
const[socket,setsocket] = useState(null)

useEffect(() => {
    const newsocket = io("http://localhost:5000",{
        auth: {
            token: localStorage.getItem("token")
        }
    });
    setsocket(newsocket)

    return () => newsocket.close();
},[])

    return(
        <Socketcontext.Provider value={socket}>
            {children}
        </Socketcontext.Provider>
    )
}


export const useSocket = () => useContext(Socketcontext);