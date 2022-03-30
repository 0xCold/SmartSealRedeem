import { useState, useEffect } from 'react'
import Header from "./Header"
import Home from "../pages/Home"
import Redeem from "../pages/Redeem"
import MySeals from "../pages/MySeals"
import Admins from "../pages/Admins"
import { getRoute } from '../helpers/helpers'

function App() {

  const [page, setPage] = useState()
  const [user, setUser] = useState()

  useEffect(() => {
    const route = getRoute(window.location.href)
    if (page === undefined) {
      setPage(route.page)
      document.title = "SmartSeal | " + route.page
    }
  }, [page]);

  const pages = {
    "Home": <Home />,
    "Redeem": <Redeem user={ user } />,
    "My Seals": <MySeals user={ user } />,
    "Admins": <Admins user={ user } />,
  }

  return (
    <div className="container-fluid">

      <Header 
        page={ page } setPage={ setPage } 
        user={ user } setUser={ setUser } 
      />

      { user !== undefined 
        ? pages[page] 
        : (
          <div className="row text-center justify-content-center">
            Connect Your Wallet to Continue.
          </div>
        )
      }

    </div>
  );
}

export default App;
