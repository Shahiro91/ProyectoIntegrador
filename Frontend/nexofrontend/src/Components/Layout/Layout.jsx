import Nav from '../Navbar/nav'
import '../../App.css'

function Layout({ children }) {
  return (
    <div className="app-layout">
      <Nav />
      <main className="app-main">{children}</main>
    </div>
  )
}

export default Layout
