import { BrowserRouter,Routes,Route } from "react-router-dom"
import './App.css'
const App = () => {
  return (
    <BrowserRouter>
    <Routes>
     <Route path="/" element={<h1>DreamF1 Dashboard 🏎️</h1>} />
        
      
      <Route path="/login" element={<h1>Login Page</h1>} />
      <Route path="/register" element={<h1>Register Page</h1>} />

    </Routes>
    </BrowserRouter>
  )
}

export default App