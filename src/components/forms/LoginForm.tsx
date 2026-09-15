import { Link, useNavigate } from "react-router-dom"
import { useState } from "react"
import { useAuth } from "../../contexts/AuthContext"
import { toast } from "react-toastify"
import { landingRouteForRole } from "../../utils/landingRoute"

const LoginForm = () => {
   const [formData, setFormData] = useState({
      email: 'admin@tourex.com',
      password: 'admin123'
   })
   const [loading, setLoading] = useState(false)
   const { login } = useAuth()
   const navigate = useNavigate()

   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData({
         ...formData,
         [e.target.name]: e.target.value
      })
   }

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault()
      setLoading(true)

      try {
         const loggedInUser = await login(formData)
         toast.success('Login successful!')
         navigate(landingRouteForRole(loggedInUser?.role))
      } catch (error: any) {
         toast.error(error.response?.data?.message || 'Login failed. Please try again.')
      } finally {
         setLoading(false)
      }
   }

   return (
      <form onSubmit={handleSubmit}>
         <div className="row">
            <div className="col-lg-12 mb-25">
               <input 
                  className="input" 
                  type="email" 
                  name="email"
                  placeholder="E-mail" 
                  value={formData.email}
                  onChange={handleChange}
                  required
               />
            </div>
            <div className="col-lg-12 mb-25">
               <input 
                  className="input" 
                  type="password" 
                  name="password"
                  placeholder="Password" 
                  value={formData.password}
                  onChange={handleChange}
                  required
               />
            </div>
            <div className="col-lg-12">
               <div className="d-flex align-items-center justify-content-between">
                  <div className="review-checkbox d-flex align-items-center mb-25">
                     <input className="tg-checkbox" type="checkbox" id="remember" />
                     <label htmlFor="remember" className="tg-label">Remember me</label>
                  </div>
                  <div className="tg-login-navigate mb-25">
                     <Link to="/register">Register Now</Link>
                  </div>
               </div>
               <button 
                  type="submit" 
                  className="tg-btn w-100" 
                  disabled={loading}
               >
                  {loading ? 'Signing In...' : 'Sign In'}
               </button>
            </div>
         </div>
      </form>
   )
}

export default LoginForm