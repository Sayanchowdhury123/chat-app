
import './App.css'
import { BrowserRouter as Router, Routes,Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/register'
import Chat from './pages/chat'

import Home from './pages/home'
import { useAuth } from './context/authcontext'

import Contacts from './pages/contacts'
import Grouplist from './pages/grouplist'
import Groupchatpage from './pages/groupchatform'
import Groupchat from './pages/groupchat'



function App() {
const {isauthinticated} = useAuth();


  return (


 <Router>
  <Routes>
    <Route path='/login'  element={<Login/>} />
    <Route path='/register' element={<Register/>} />
    <Route path='/' element={isauthinticated ? <Home/> : <Navigate to="/login" />} />
    <Route path='/contacts' element={isauthinticated ? <Contacts/> : <Navigate to="/login" />} />
    <Route path='/chat/:contactid' element={isauthinticated ? <Chat/> : <Navigate to="/login" />} />
    <Route path='/groups' element={isauthinticated ? <Grouplist/> : <Navigate to="/login" />} />
    <Route path='/create-group' element={isauthinticated ? <Groupchatpage/> : <Navigate to="/login" />} />
    <Route path='/group-chat/:groupid' element={isauthinticated ? <Groupchat/> : <Navigate to="/login" />} />
  </Routes>
 </Router>
      
    
  )
}

export default App
