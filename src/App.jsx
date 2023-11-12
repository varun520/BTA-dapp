import './App.css'

import Home from './components/Home'
import ProposalDetails from './components/proposalDetails';
import { HashRouter as Router, Route, Routes } from 'react-router-dom';


function App() {
  return (
    <>
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/proposals/:id" element={<ProposalDetails />} />
      </Routes>
    </Router>
    </>
  )
}

export default App
