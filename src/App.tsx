import { HelmetProvider } from "react-helmet-async"
import AppNavigation from "./navigation/Navigation"
import { Provider } from 'react-redux'
import store from "./redux/store"
import { AuthProvider } from "./contexts/AuthContext"
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

function App() {

  return (
    <>
      <Provider store={store}>
        <AuthProvider>
          <HelmetProvider>
            <AppNavigation />
            <ToastContainer
              position="top-right"
              autoClose={3000}
              hideProgressBar={false}
              newestOnTop={true}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="colored"
            />
          </HelmetProvider>
        </AuthProvider>
      </Provider>
    </>
  )
}

export default App