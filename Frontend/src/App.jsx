import React from 'react'
import {Routes, Route} from "react-router";

import ProfilePage from './pages/user/ProfilePage';


const App = () => {
  return (
    <>
      <Routes>
        <Route path="/profile" element ={<ProfilePage />} />
      </Routes>
    </>
  )
}

export default App