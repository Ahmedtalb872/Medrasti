import { Route, Routes } from 'react-router-dom'
import Sidebar from './components/Sidebar.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Students from './pages/Students.jsx'
import StudentProfile from './pages/StudentProfile.jsx'
import Finance from './pages/Finance.jsx'
import Cards from './pages/Cards.jsx'
import Invoices from './pages/Invoices.jsx'
import Classes from './pages/Classes.jsx'
import Teachers from './pages/Teachers.jsx'
import Settings from './pages/Settings.jsx'

export default function App() {
  return (
    <div className="layout">
      <Sidebar />
      <main className="content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/students" element={<Students />} />
          <Route path="/students/:id" element={<StudentProfile />} />
          <Route path="/finance" element={<Finance />} />
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/cards" element={<Cards />} />
          <Route path="/classes" element={<Classes />} />
          <Route path="/teachers" element={<Teachers />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </div>
  )
}
